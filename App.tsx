import React, { useState, useEffect } from 'react';
import { Timer, TimerType, Preset } from './types';
import TimerCard from './components/TimerCard';
import DynamicIsland from './components/DynamicIsland';
import AddTimer from './components/AddTimer';
import Weather from './components/Weather';
import { MaximizeIcon, MinimizeIcon } from './components/Icons';

function App() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [lastTick, setLastTick] = useState<number>(Date.now());
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [fullDate, setFullDate] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClockFullscreen, setIsClockFullscreen] = useState(false);
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [clockReminder, setClockReminder] = useState<string>("");
  const [showReminderInput, setShowReminderInput] = useState(false);
  const [reminderText, setReminderText] = useState<string>("");

  // --- Clock ---
  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        const hour = now.getHours();
        
        // Determine greeting
        let greet = '';
        if (hour >= 5 && hour < 12) {
          greet = 'Good Morning';
        } else if (hour >= 12 && hour < 17) {
          greet = 'Good Afternoon';
        } else if (hour >= 17 && hour < 21) {
          greet = 'Good Evening';
        } else {
          greet = 'Good Night';
        }
        
        setCurrentTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
        // Compact date for mobile, full for desktop if needed
        setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
        // Full date for fullscreen mode
        setFullDate(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        setGreeting(greet);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Fullscreen Handler ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        setIsClockFullscreen(false);
        setShowReminderInput(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // --- Clock Fullscreen Handler ---
  const clockRef = React.useRef<HTMLDivElement>(null);

  const toggleClockFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (clockRef.current) {
        try {
          await clockRef.current.requestFullscreen();
          setIsClockFullscreen(true);
        } catch (err) {
          console.error("Error attempting to enable clock fullscreen:", err);
        }
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsClockFullscreen(false);
      }
    }
  };

  // --- Persistence ---
  useEffect(() => {
    const savedTimers = localStorage.getItem('chronos_timers');
    if (savedTimers) {
      try {
        const parsed = JSON.parse(savedTimers);
        if (Array.isArray(parsed) && parsed.length > 0) {
            setTimers(parsed);
        } else {
            initializeDefaultTimer();
        }
      } catch (e) { initializeDefaultTimer(); }
    } else {
         initializeDefaultTimer();
    }

    const savedPresets = localStorage.getItem('chronos_presets');
    if (savedPresets) {
        try {
            setCustomPresets(JSON.parse(savedPresets));
        } catch (e) { console.error(e); }
    }

    // Load clock reminder
    const savedReminder = localStorage.getItem('clock_reminder');
    if (savedReminder) {
      setClockReminder(savedReminder);
    }
  }, []);

  const initializeDefaultTimer = () => {
     setTimers([{
        id: crypto.randomUUID(),
        type: 'TIMER',
        label: 'Timer 1',
        initialDuration: 300,
        remainingTime: 300,
        elapsedTime: 0,
        isRunning: false,
        isCompleted: false,
        createdAt: Date.now()
    }]);
  }

  useEffect(() => {
    if (timers.length > 0) {
        localStorage.setItem('chronos_timers', JSON.stringify(timers));
    }
  }, [timers]);

  // --- Ticker ---
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTick) / 1000;
      setLastTick(now);

      setTimers(prevTimers => prevTimers.map(timer => {
        if (!timer.isRunning || timer.isCompleted) return timer;

        if (timer.type === 'STOPWATCH') {
          return { ...timer, elapsedTime: timer.elapsedTime + deltaSeconds };
        } else {
          const newRemaining = Math.max(0, timer.remainingTime - deltaSeconds);
          const isFinished = newRemaining <= 0;
          return { 
            ...timer, 
            remainingTime: newRemaining, 
            isCompleted: isFinished,
            isRunning: !isFinished
          };
        }
      }));
    }, 100);

    return () => clearInterval(intervalId);
  }, [lastTick]);


  // --- Actions ---
  const addTimer = (type: TimerType, duration: number, label: string, note?: string) => {
    const newTimer: Timer = {
      id: crypto.randomUUID(),
      type: type,
      label: label,
      initialDuration: duration,
      remainingTime: duration,
      elapsedTime: 0,
      isRunning: false,
      isCompleted: false,
      createdAt: Date.now(),
      pomodoroType: type === 'POMODORO' ? 'FOCUS' : undefined,
      note: note
    };
    setTimers(prev => [...prev, newTimer]);
  };

  const toggleTimer = (id: string) => {
    setTimers(prev => prev.map(t => 
      t.id === id ? { ...t, isRunning: !t.isRunning } : t
    ));
  };

  const resetTimer = (id: string) => {
    setTimers(prev => prev.map(t => 
      t.id === id ? { 
        ...t, 
        remainingTime: t.initialDuration, 
        elapsedTime: 0, 
        isCompleted: false, 
        isRunning: false 
      } : t
    ));
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const updateTimer = (id: string, updates: Partial<Timer>) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }

  const handleSavePreset = (preset: Preset) => {
      const updated = [...customPresets, preset];
      setCustomPresets(updated);
      localStorage.setItem('chronos_presets', JSON.stringify(updated));
  };

  const handleDeletePreset = (label: string) => {
      const updated = customPresets.filter(p => p.label !== label);
      setCustomPresets(updated);
      localStorage.setItem('chronos_presets', JSON.stringify(updated));
  }

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        const running = timers.find(t => t.isRunning);
        if (running) {
            toggleTimer(running.id);
        } else if (timers.length > 0) {
            toggleTimer(timers[0].id);
        }
      }

      if (e.code === 'KeyR') {
         const running = timers.find(t => t.isRunning);
         if (running) {
             resetTimer(running.id);
         } else if (timers.length > 0) {
             resetTimer(timers[0].id);
         }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timers]);

  const activeTimer = timers.find(t => t.isRunning) || timers[0];

  return (
    <div className="w-full min-h-screen bg-[#050505] relative flex flex-col font-sans selection:bg-white/20">
      
      {/* Background Ambience - Fixed */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/5 blur-[150px] rounded-full"></div>
      </div>

      {/* Dynamic Island Status - Fixed on top */}
      <DynamicIsland onAdd={addTimer} activeTimer={activeTimer} />

      {/* Header controls (Top Right) */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50 animate-fade-in flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Weather */}
            <Weather />

            {/* Clock & Date */}
            <div 
              ref={clockRef}
              onClick={toggleClockFullscreen}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 flex items-center gap-2 md:gap-3 justify-center text-neutral-400 shadow-lg text-xs md:text-sm cursor-pointer hover:border-neutral-600 transition-colors
                ${isClockFullscreen 
                  ? 'fixed inset-0 z-50 w-full h-full justify-center items-center rounded-none border-none text-6xl md:text-8xl' 
                  : ''
                }`}
            >
              {isClockFullscreen ? (
                <div className="flex flex-col items-center justify-center gap-8 w-full h-full relative">
                  <div className="text-neutral-400 font-sans text-3xl md:text-5xl font-light tracking-wide mb-4">
                    {greeting}
                  </div>
                  <div className="font-mono text-white font-medium tracking-wider text-6xl md:text-8xl">
                    {currentTime}
                  </div>
                  <div className="text-neutral-400 font-sans text-xl md:text-2xl font-medium mt-8">
                    {fullDate}
                  </div>
                  <div className="mt-8 flex justify-center">
                    <Weather />
                  </div>

                  {/* Reminder Display */}
                  {clockReminder && (
                    <div className="mt-12 px-8 py-6 rounded-2xl bg-neutral-900/80 border border-neutral-700 backdrop-blur-md max-w-2xl mx-auto">
                      <div className="text-neutral-500 text-sm font-medium mb-2 uppercase tracking-wider">Reminder</div>
                      <div className="text-white text-2xl md:text-3xl font-light text-center leading-relaxed">
                        {clockReminder}
                      </div>
                    </div>
                  )}

                  {/* Bottom Controls */}
                  <div className="absolute bottom-8 right-8 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {!showReminderInput ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReminderInput(true);
                        }}
                        className="p-3 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors flex items-center justify-center w-12 h-12"
                        title="Add Reminder"
                      >
                        <span className="text-2xl leading-none">+</span>
                      </button>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={reminderText}
                          onChange={(e) => setReminderText(e.target.value)}
                          placeholder="Enter reminder..."
                          className="px-4 py-2 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 text-sm"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (reminderText.trim()) {
                                setClockReminder(reminderText);
                                localStorage.setItem('clock_reminder', reminderText);
                              }
                              setReminderText('');
                              setShowReminderInput(false);
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (reminderText.trim()) {
                              setClockReminder(reminderText);
                              localStorage.setItem('clock_reminder', reminderText);
                            }
                            setReminderText('');
                            setShowReminderInput(false);
                          }}
                          className="px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors font-medium text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReminderInput(false);
                            setReminderText('');
                          }}
                          className="p-1.5 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-400 hover:text-white transition-colors text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleClockFullscreen();
                      }}
                      className="p-3 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
                      title="Exit Clock View"
                    >
                      <MinimizeIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="font-medium text-neutral-500 whitespace-nowrap">{currentDate}</span>
                  <span className="w-px h-3 bg-neutral-800"></span>
                  <span className="font-mono text-neutral-300">{currentTime}</span>
                </>
              )}
            </div>
          </div>
      </div>

      {/* Fullscreen Toggle (Bottom Right) */}
      <button 
        onClick={toggleFullscreen}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 p-2 md:p-3 rounded-full bg-[#111]/80 backdrop-blur-md border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors shadow-lg"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? <MinimizeIcon className="w-4 h-4 md:w-5 md:h-5" /> : <MaximizeIcon className="w-4 h-4 md:w-5 md:h-5" />}
      </button>

      {/* Scrollable Main Content */}
      <div className="flex-grow flex flex-col items-center w-full relative z-10 px-4 pt-28 md:pt-32 pb-16">
        
        {/* Timer Grid */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 w-full max-w-[1200px]">
            {timers.map(timer => (
                <TimerCard
                    key={timer.id}
                    timer={timer}
                    onToggle={toggleTimer}
                    onReset={resetTimer}
                    onDelete={deleteTimer}
                    onUpdate={updateTimer}
                />
            ))}
        </div>

        {/* Add Timer Button Area */}
        <div className="mt-12 md:mt-16 mb-8 w-full">
            <AddTimer 
                onAdd={addTimer} 
                customPresets={customPresets} 
                onSavePreset={handleSavePreset}
                onDeletePreset={handleDeletePreset}
            />
        </div>

        {/* Footer */}
        <footer className="mt-auto py-6 text-center">
            <p className="text-neutral-700 text-sm font-medium">Made by Mistiz911 and Aspitasko</p>
        </footer>

      </div>

    </div>
  );
}

export default App;
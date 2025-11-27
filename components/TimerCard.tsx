import React, { useEffect, useRef, useState } from 'react';
import { Timer, TimerType, PomodoroType } from '../types';
import { PlayIcon, PauseIcon, RotateCcwIcon, SettingsIcon, TrashIcon, ClockIcon, StopwatchIcon, CoffeeIcon, MaximizeIcon, MinimizeIcon } from './Icons';
import CircularProgress from './CircularProgress';
import { playAlertSound } from '../utils/sound';

interface TimerCardProps {
  timer: Timer;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Timer>) => void;
}

const TimerCard: React.FC<TimerCardProps> = ({ timer, onToggle, onReset, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [endTime, setEndTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Format HH:MM:SS or MM:SS
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    
    // Always show HH if hours exist, or if user is typing a long time
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  let progress = 0;
  let displayTime = "";

  if (timer.type === 'STOPWATCH') {
    progress = 100;
    displayTime = formatTime(timer.elapsedTime);
  } else {
    progress = timer.initialDuration > 0 
      ? ((timer.initialDuration - timer.remainingTime) / timer.initialDuration) * 100 
      : 0;
    progress = 100 - progress;
    displayTime = formatTime(timer.remainingTime);
  }

  // Calculate End Time
  useEffect(() => {
    if (timer.isRunning && !timer.isCompleted && timer.type !== 'STOPWATCH') {
        const endDate = new Date(Date.now() + timer.remainingTime * 1000);
        setEndTime(endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }));
    } else {
        setEndTime('');
    }
  }, [timer.isRunning, timer.remainingTime, timer.type, timer.isCompleted]);

  // Sound effect on completion
  const prevCompleted = useRef(timer.isCompleted);
  useEffect(() => {
    if (timer.isCompleted && !prevCompleted.current) {
      playAlertSound();
    }
    prevCompleted.current = timer.isCompleted;
  }, [timer.isCompleted]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  // Fullscreen Logic
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
        if (cardRef.current) {
            try {
                await cardRef.current.requestFullscreen();
            } catch (err) {
                console.error("Error attempting to enable full-screen mode:", err);
            }
        }
    } else {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        }
    }
  };

  useEffect(() => {
    const handleChange = () => {
        setIsFullscreen(document.fullscreenElement === cardRef.current);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // Clock for Fullscreen
  useEffect(() => {
    if (isFullscreen) {
        const update = () => {
             const now = new Date();
             setCurrentTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
             setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
        }
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }
  }, [isFullscreen]);


  const handleTabChange = (newType: TimerType) => {
    let newDuration = timer.initialDuration;
    let newPomodoroType: PomodoroType | undefined = undefined;

    if (newType === 'POMODORO') {
        newDuration = 25 * 60;
        newPomodoroType = 'FOCUS';
    } else if (newType === 'TIMER') {
        // Default to 5 mins if switching back to timer
        newDuration = 5 * 60;
    } else {
        // Stopwatch
        newDuration = 0;
    }
    
    onUpdate(timer.id, { 
      type: newType,
      initialDuration: newDuration,
      remainingTime: newDuration,
      elapsedTime: 0,
      isRunning: false,
      isCompleted: false,
      pomodoroType: newPomodoroType
    });
  };

  const handlePomodoroTypeChange = (pType: PomodoroType) => {
      let duration = 25 * 60;
      if (pType === 'SHORT_BREAK') duration = 5 * 60;
      if (pType === 'LONG_BREAK') duration = 15 * 60;

      onUpdate(timer.id, {
          pomodoroType: pType,
          initialDuration: duration,
          remainingTime: duration,
          elapsedTime: 0,
          isRunning: false,
          isCompleted: false
      });
  };

  const handleTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Support HH:MM:SS, MM:SS, or just MM
    const parts = val.split(':').map(p => parseInt(p) || 0);
    let total = 0;

    if (parts.length === 3) {
        // HH:MM:SS
        total = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        total = parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        // MM
        total = parts[0] * 60;
    }

    onUpdate(timer.id, { initialDuration: total, remainingTime: total, isCompleted: false });
  };

  // Determine current pomodoro type if undefined but is pomodoro
  const currentPomodoroType = timer.pomodoroType || (timer.initialDuration === 25*60 ? 'FOCUS' : 'FOCUS');

  // Dynamic font size based on length of time string
  // HH:MM:SS is 8 chars, MM:SS is 5.
  const isHours = displayTime.length > 5;
  const textSizeClass = isHours ? 'text-4xl sm:text-5xl md:text-[3.5rem]' : 'text-5xl sm:text-6xl md:text-[5rem]';

  return (
    <div className={`relative group w-full ${isFullscreen ? '' : 'max-w-[420px] mx-auto'} transition-all duration-300 animate-fade-in`}>
      
      {/* Delete Button - Optimized for Mobile & Desktop */}
      {!isFullscreen && (
        <button 
          onClick={() => onDelete(timer.id)}
          className={`
            absolute p-2 text-neutral-600 hover:text-red-500 transition-all duration-300 z-30
            right-4 top-4 md:right-[-3rem] md:top-0 md:opacity-0 md:group-hover:opacity-100
          `}
          title="Delete Timer"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      )}

      {/* Main Card */}
      <div 
        ref={cardRef}
        className={`bg-[#0A0A0A] border flex flex-col items-center shadow-2xl relative overflow-hidden transition-all
            ${timer.isCompleted ? 'animate-shake border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.4)]' : 'border-neutral-800'}
            ${isFullscreen 
                ? 'fixed inset-0 z-50 w-full h-full justify-center border-none rounded-none' 
                : 'rounded-[32px] p-6 md:p-8'
            }`}
      >
        
        {/* Glow Effect */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 blur-xl rounded-full transition-colors duration-500 ${timer.isCompleted ? 'bg-red-500' : 'bg-white/10'}`}></div>

        {/* Fullscreen Current Time */}
        {isFullscreen && (
            <div className="absolute top-4 right-4 md:top-8 md:right-8 flex flex-col items-end z-50 animate-fade-in">
                <div className="text-neutral-500 font-mono text-lg md:text-xl font-medium tracking-wider">
                    {currentTime}
                </div>
                <div className="text-neutral-600 font-sans text-xs md:text-sm font-medium mt-1">
                    {currentDate}
                </div>
            </div>
        )}

        {/* Maximize/Minimize Toggle - Bottom Right */}
        <button 
            onClick={toggleFullscreen}
            className={`absolute bottom-4 right-4 md:bottom-6 md:right-6 p-2 rounded-full text-neutral-600 hover:text-white hover:bg-neutral-900 transition-all z-50
                ${!isFullscreen ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100' : 'opacity-100'}`}
            title={isFullscreen ? "Exit Focus Mode" : "Enter Focus Mode"}
        >
            {isFullscreen ? <MinimizeIcon className="w-5 h-5" /> : <MaximizeIcon className="w-5 h-5" />}
        </button>

        {/* Tab Switcher - Hidden in fullscreen */}
        {!isFullscreen && (
            <div className="flex p-1 bg-[#151515] rounded-full border border-neutral-800 mb-6 md:mb-8 z-20 relative scale-90 md:scale-100">
                <button 
                    onClick={() => handleTabChange('TIMER')}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-medium transition-all ${timer.type === 'TIMER' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    <ClockIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Timer</span>
                </button>
                <button 
                    onClick={() => handleTabChange('STOPWATCH')}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-medium transition-all ${timer.type === 'STOPWATCH' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    <StopwatchIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Stopwatch</span>
                </button>
                <button 
                    onClick={() => handleTabChange('POMODORO')}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs font-medium transition-all ${timer.type === 'POMODORO' ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    <CoffeeIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Pomodoro</span>
                </button>
            </div>
        )}

        {/* Pomodoro Sub-controls - Hidden in fullscreen */}
        {!isFullscreen && (
            <div className={`transition-all duration-300 overflow-hidden flex justify-center w-full ${timer.type === 'POMODORO' ? 'max-h-12 opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="flex gap-2 bg-[#111] p-1 rounded-full border border-neutral-800">
                    <button 
                        onClick={() => handlePomodoroTypeChange('FOCUS')}
                        className={`text-[10px] font-medium px-3 py-1 rounded-full transition-all border ${currentPomodoroType === 'FOCUS' ? 'bg-neutral-800 text-white border-neutral-600' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Focus
                    </button>
                    <button 
                        onClick={() => handlePomodoroTypeChange('SHORT_BREAK')}
                        className={`text-[10px] font-medium px-3 py-1 rounded-full transition-all border ${currentPomodoroType === 'SHORT_BREAK' ? 'bg-neutral-800 text-white border-neutral-600' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Short
                    </button>
                    <button 
                        onClick={() => handlePomodoroTypeChange('LONG_BREAK')}
                        className={`text-[10px] font-medium px-3 py-1 rounded-full transition-all border ${currentPomodoroType === 'LONG_BREAK' ? 'bg-neutral-800 text-white border-neutral-600' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Long
                    </button>
                </div>
            </div>
        )}

        {/* Timer Visualization */}
        <div className={`relative flex items-center justify-center w-full transition-all duration-500 
            ${isFullscreen ? 'scale-100 md:scale-125 mb-16' : 'scale-[0.85] md:scale-100 mb-8 md:mb-12 origin-center'}
        `}>
            {/* The Circle */}
            <div className="relative z-10">
                 <CircularProgress 
                    progress={progress} 
                    size={280} 
                    strokeWidth={6}
                    color={timer.isCompleted ? 'stroke-red-500' : 'stroke-white'}
                    isIndeterminate={timer.type === 'STOPWATCH' && timer.isRunning}
                 />
            </div>

            {/* The Digital Time */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                {isEditing && timer.type !== 'STOPWATCH' && !isFullscreen ? (
                    <form onSubmit={handleTimeSubmit} className="pointer-events-auto w-full flex justify-center">
                        <input
                            ref={editInputRef}
                            className={`bg-transparent text-center font-digital font-bold text-white focus:outline-none w-full max-w-[220px] placeholder-neutral-700 leading-none ${textSizeClass}`}
                            placeholder="MM:SS"
                            onBlur={() => setIsEditing(false)}
                            onChange={handleTimeChange}
                            defaultValue={formatTime(timer.initialDuration)}
                        />
                    </form>
                ) : (
                    <div 
                        onClick={() => !timer.isRunning && timer.type !== 'STOPWATCH' && !isFullscreen && setIsEditing(true)}
                        className={`font-digital leading-none font-bold tracking-tighter tabular-nums text-white pointer-events-auto select-none transition-all duration-200
                                   ${!timer.isRunning && timer.type !== 'STOPWATCH' && !isFullscreen ? 'cursor-pointer hover:opacity-80' : ''} 
                                   ${timer.isCompleted ? 'animate-pulse text-red-500' : ''}
                                   ${textSizeClass}`}
                    >
                        {displayTime}
                    </div>
                )}
                
                {/* End Time Indicator */}
                {endTime && (
                    <div className="absolute bottom-16 text-xs text-neutral-500 font-medium tracking-wide animate-fade-in">
                        Ends at {endTime}
                    </div>
                )}
            </div>
            
            {/* Background dashed circle for aesthetics */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className={`w-[250px] h-[250px] border-4 border-dashed rounded-full transition-colors ${timer.isCompleted ? 'border-red-900/50' : 'border-neutral-900/50'}`}></div>
            </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 md:gap-6 w-full mb-4 md:mb-8 relative z-20">
            {/* Reset Button */}
            <button 
                onClick={() => onReset(timer.id)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-600 hover:bg-neutral-900 transition-all"
                title="Reset (R)"
            >
                <RotateCcwIcon className="w-4 h-4" />
            </button>

            {/* Play/Pause Button */}
            <button 
                onClick={() => onToggle(timer.id)}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.05)]
                    ${timer.isRunning 
                        ? 'bg-neutral-900 border border-neutral-700 text-white hover:bg-neutral-800' 
                        : 'bg-white text-black hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]'}`}
            >
                {timer.isRunning ? <PauseIcon className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <PlayIcon className="w-6 h-6 md:w-8 md:h-8 fill-current ml-1" />}
            </button>

            {/* Settings Button - Hidden in fullscreen */}
            {!isFullscreen && (
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full border border-neutral-800 flex items-center justify-center transition-all
                        ${isEditing ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:border-neutral-600 hover:bg-neutral-900'}`}
                    title="Edit Time"
                >
                    <SettingsIcon className="w-4 h-4" />
                </button>
            )}
        </div>

        {/* Keyboard Hints - Hidden in fullscreen & mobile */}
        {!isFullscreen && (
            <div className="hidden md:flex text-xs font-medium text-neutral-600 items-center gap-3 select-none">
                <span className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800">Space</span>
                <span>to start</span>
                <span className="w-1 h-1 bg-neutral-800 rounded-full"></span>
                <span className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800">R</span>
                <span>to reset</span>
            </div>
        )}

      </div>
    </div>
  );
};

export default TimerCard;
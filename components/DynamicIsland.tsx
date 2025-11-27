import React, { useState, useEffect } from 'react';
import { Timer } from '../types';
import { ClockIcon } from './Icons';

interface DynamicIslandProps {
  onAdd: (type: any, duration: number, label: string) => void;
  activeTimer?: Timer;
}

const DynamicIsland: React.FC<DynamicIslandProps> = ({ activeTimer }) => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusText = () => {
    if (!activeTimer) return "Ready";
    if (activeTimer.isCompleted) return "Finished";
    if (activeTimer.isRunning) return "Running";
    return "Paused";
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const status = getStatusText();

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className={`
        flex items-center gap-3 px-5 py-2 rounded-full
        bg-[#0f0f0f] border border-[#222] shadow-2xl
        transition-all duration-500 ease-out
        ${status === 'Running' ? 'w-[180px] justify-between border-green-900/30' : 'w-[130px] justify-center'}
      `}>
          <div className="flex items-center gap-2">
            {status === 'Running' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
            {status === 'Paused' && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
            {status === 'Finished' && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
            {status === 'Ready' && <ClockIcon className="w-3 h-3 text-neutral-500" />}
            
            <span className={`text-xs font-medium tracking-wide ${status === 'Running' ? 'text-white' : 'text-neutral-400'}`}>
                {status}
            </span>
          </div>

          {status === 'Running' && activeTimer && (
              <span className="text-xs font-mono font-bold text-white">
                 {formatTime(activeTimer.remainingTime)}
              </span>
          )}
      </div>
    </div>
  );
};

export default DynamicIsland;
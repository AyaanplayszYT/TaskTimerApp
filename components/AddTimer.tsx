import React, { useState } from 'react';
import { PRESETS, TimerType, Preset } from '../types';
import { PlusIcon, TrashIcon, SettingsIcon } from './Icons';

interface AddTimerProps {
  onAdd: (type: TimerType, duration: number, label: string, note?: string) => void;
  customPresets: Preset[];
  onSavePreset: (preset: Preset) => void;
  onDeletePreset: (label: string) => void;
}

const AddTimer: React.FC<AddTimerProps> = ({ onAdd, customPresets, onSavePreset, onDeletePreset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  // Custom Timer State
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [label, setLabel] = useState('Custom Timer');
  const [note, setNote] = useState('');

  const handleCustomAdd = () => {
    const duration = hours * 3600 + minutes * 60 + seconds;
    if (duration > 0) {
        onAdd('TIMER', duration, label, note || undefined);
        setIsOpen(false);
        resetForm();
    }
  };

  const handleSaveAsPreset = () => {
      const duration = hours * 3600 + minutes * 60 + seconds;
      if (duration > 0 && label.trim()) {
          onSavePreset({
              label: label,
              duration: duration,
              type: 'TIMER',
              note: note || undefined
          });
          setIsCustomMode(false); // Return to preset list to see the new preset
      }
  };

  const resetForm = () => {
      setHours(0);
      setMinutes(5);
      setSeconds(0);
      setLabel('Custom Timer');
      setNote('');
      setIsCustomMode(false);
  };

  const allPresets = [...PRESETS, ...customPresets];

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto z-50 relative px-4">
      {!isOpen ? (
        <button 
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 px-6 py-3 rounded-full bg-[#111] border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all duration-300 shadow-lg hover:shadow-neutral-900/50"
        >
            <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm font-medium">Add Timer</span>
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4 animate-expand w-full max-w-[600px]">
            <div className="flex flex-col w-full p-4 md:p-6 rounded-[24px] bg-[#0A0A0A] border border-neutral-800 shadow-2xl relative">
                
                {/* Header/Back */}
                {isCustomMode && (
                    <button 
                        onClick={() => setIsCustomMode(false)}
                        className="absolute top-4 left-4 md:top-6 md:left-6 text-xs text-neutral-500 hover:text-white transition-colors"
                    >
                        &larr; Back to Presets
                    </button>
                )}

                {!isCustomMode ? (
                    <>
                        <div className="text-center mb-6 text-neutral-400 text-sm font-medium">Select a Preset</div>
                        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-6">
                            {/* Presets */}
                            {allPresets.map((preset, idx) => (
                                <div key={`${preset.label}-${idx}`} className="relative group">
                                    <button 
                                        onClick={() => { onAdd(preset.type, preset.duration, preset.label, preset.note); setIsOpen(false); }}
                                        className="px-3 py-2 md:px-4 md:py-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-medium hover:bg-white hover:text-black hover:border-white transition-all"
                                    >
                                        {preset.label}
                                    </button>
                                    {/* Show delete for custom presets only */}
                                    {customPresets.includes(preset) && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeletePreset(preset.label); }}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-900 text-white rounded-full flex items-center justify-center transition-all md:opacity-0 md:group-hover:opacity-100"
                                            title="Delete Preset"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="w-full h-px bg-neutral-900 mb-4"></div>
                        
                        <button 
                            onClick={() => setIsCustomMode(true)}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-neutral-900/50 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all text-sm font-medium border border-transparent hover:border-neutral-700"
                        >
                            <SettingsIcon className="w-4 h-4" />
                            Create Custom Timer
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col gap-6 mt-6">
                        {/* Custom Form */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-neutral-500 ml-1">Label</label>
                            <input 
                                type="text" 
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                className="bg-[#111] border border-neutral-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-neutral-600 transition-colors"
                                placeholder="Timer Name"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-neutral-500 ml-1">Note/Reminder (Optional)</label>
                            <textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="bg-[#111] border border-neutral-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-neutral-600 transition-colors resize-none h-20"
                                placeholder="e.g., Exam starts at 10 AM, Study for Biology"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                             <div className="flex flex-col gap-2">
                                <label className="text-[10px] md:text-xs text-neutral-500 text-center uppercase tracking-wider">Hours</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    max="23"
                                    value={hours}
                                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="bg-[#111] border border-neutral-800 rounded-lg px-1 py-3 text-white text-center text-lg font-mono focus:outline-none focus:border-neutral-600 transition-colors"
                                />
                             </div>
                             <div className="flex flex-col gap-2">
                                <label className="text-[10px] md:text-xs text-neutral-500 text-center uppercase tracking-wider">Minutes</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    max="59"
                                    value={minutes}
                                    onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="bg-[#111] border border-neutral-800 rounded-lg px-1 py-3 text-white text-center text-lg font-mono focus:outline-none focus:border-neutral-600 transition-colors"
                                />
                             </div>
                             <div className="flex flex-col gap-2">
                                <label className="text-[10px] md:text-xs text-neutral-500 text-center uppercase tracking-wider">Seconds</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    max="59"
                                    value={seconds}
                                    onChange={(e) => setSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="bg-[#111] border border-neutral-800 rounded-lg px-1 py-3 text-white text-center text-lg font-mono focus:outline-none focus:border-neutral-600 transition-colors"
                                />
                             </div>
                        </div>

                        <div className="flex gap-3 mt-2">
                            <button 
                                onClick={handleSaveAsPreset}
                                className="flex-1 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all text-sm font-medium whitespace-nowrap"
                            >
                                Save Preset
                            </button>
                            <button 
                                onClick={handleCustomAdd}
                                className="flex-[2] py-3 rounded-xl bg-white text-black hover:bg-neutral-200 transition-all text-sm font-bold shadow-lg shadow-white/10"
                            >
                                Start Timer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <button 
                onClick={() => { setIsOpen(false); resetForm(); }}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
                Close
            </button>
        </div>
      )}
    </div>
  );
};

export default AddTimer;
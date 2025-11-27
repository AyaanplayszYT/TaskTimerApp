
export type TimerType = 'TIMER' | 'STOPWATCH' | 'POMODORO';
export type PomodoroType = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

export interface Timer {
  id: string;
  type: TimerType;
  label: string;
  initialDuration: number; // In seconds
  remainingTime: number; // In seconds (counts down)
  elapsedTime: number; // In seconds (counts up for stopwatch)
  isRunning: boolean;
  isCompleted: boolean;
  createdAt: number;
  pomodoroType?: PomodoroType;
  note?: string; // Optional reminder/note
}

export interface Preset {
  label: string;
  duration: number; // seconds
  type: TimerType;
  note?: string; // Optional note/description
}

export const PRESETS: Preset[] = [
  { label: 'Pomodoro', duration: 25 * 60, type: 'POMODORO' },
  { label: 'Short Break', duration: 5 * 60, type: 'POMODORO' },
  { label: 'Long Break', duration: 15 * 60, type: 'POMODORO' },
  { label: '1 Hour', duration: 60 * 60, type: 'TIMER' },
  { label: '3 Hours', duration: 3 * 60 * 60, type: 'TIMER' },
  { label: 'Stopwatch', duration: 0, type: 'STOPWATCH' },
];
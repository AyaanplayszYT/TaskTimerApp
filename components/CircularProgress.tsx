import React from 'react';

interface CircularProgressProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  isIndeterminate?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  progress, 
  size = 280, 
  strokeWidth = 8,
  color = 'stroke-white',
  isIndeterminate = false
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`transform -rotate-90 transition-all duration-300 ${isIndeterminate ? 'animate-spin-slow' : ''}`}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth / 2} // Thinner track
          fill="transparent"
          className="text-midnight-800"
        />
        {/* Indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={isIndeterminate ? circumference * 0.25 : offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-500 ease-out`}
        />
      </svg>
    </div>
  );
};

export default CircularProgress;
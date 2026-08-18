import React from 'react';

interface TimeDisplayProps {
  time: string; // e.g. "10:30" or "10:00 - 10:30"
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SplitFlapTime: React.FC<TimeDisplayProps> = ({
  time,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-xs sm:text-sm',
    lg: 'text-sm sm:text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-mono font-bold tracking-tight text-zinc-700 dark:text-zinc-300 ${sizeClasses[size]} ${className}`}
    >
      {time}
    </span>
  );
};

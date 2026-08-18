import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplitFlapTimeProps {
  time: string; // e.g. "10:30" or "10:00 - 10:30"
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SplitFlapTime: React.FC<SplitFlapTimeProps> = ({
  time,
  size = 'md',
  className = '',
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const sizeClasses = {
    sm: {
      card: 'w-4 h-6 text-xs rounded-sm',
      gap: 'gap-0.5',
      sep: 'text-xs px-0.5',
    },
    md: {
      card: 'w-6 h-8 text-sm rounded',
      gap: 'gap-1',
      sep: 'text-sm px-1',
    },
    lg: {
      card: 'w-8 h-10 text-base rounded-md',
      gap: 'gap-1.5',
      sep: 'text-base px-1.5',
    },
  };

  const currentSize = sizeClasses[size];
  const characters = time.split('');

  return (
    <div className={`inline-flex items-center ${currentSize.gap} ${className}`}>
      {characters.map((char, index) => {
        const isDigit = /\d/.test(char);

        if (!isDigit) {
          return (
            <span
              key={`${char}-${index}`}
              className={`font-mono font-bold text-amber-500/80 dark:text-amber-400/80 select-none ${currentSize.sep}`}
            >
              {char}
            </span>
          );
        }

        return (
          <motion.div
            key={`${char}-${index}`}
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { rotateX: -90, opacity: 0 }
            }
            animate={{ rotateX: 0, opacity: 1 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: 0.3,
                    delay: index * 0.04,
                    ease: [0.34, 1.56, 0.64, 1],
                  }
            }
            style={{ transformPerspective: 400 }}
            className={`relative flex items-center justify-center bg-zinc-900 dark:bg-zinc-950 text-amber-400 font-mono font-black border border-zinc-800/80 shadow-md select-none overflow-hidden ${currentSize.card}`}
          >
            {/* Top/Bottom Flap Divider Seam */}
            <div className="absolute inset-x-0 top-1/2 border-t border-zinc-950/80 dark:border-black z-10" />

            {/* Subtle top glare highlight */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-white/[0.04] pointer-events-none" />

            {/* Digit Content */}
            <span className="z-0 tracking-tighter leading-none">{char}</span>
          </motion.div>
        );
      })}
    </div>
  );
};

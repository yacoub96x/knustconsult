import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface FloatingToastProps {
  successMsg: string | null;
  errorMsg: string | null;
  onCloseSuccess: () => void;
  onCloseError: () => void;
}

export const FloatingToast: React.FC<FloatingToastProps> = ({
  successMsg,
  errorMsg,
  onCloseSuccess,
  onCloseError,
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-[calc(100vw-3rem)] pointer-events-none">
      <AnimatePresence>
        {successMsg && (
          <motion.div
            key="success-toast"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-emerald-500/30 text-zinc-900 dark:text-white shadow-2xl flex items-center justify-between gap-3 ring-1 ring-emerald-500/20"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold leading-relaxed">
                <p className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                  Success
                </p>
                <p className="truncate">{successMsg}</p>
              </div>
            </div>

            <button
              onClick={onCloseSuccess}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            key="error-toast"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-rose-500/30 text-zinc-900 dark:text-white shadow-2xl flex items-center justify-between gap-3 ring-1 ring-rose-500/20"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold leading-relaxed">
                <p className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px]">
                  Error
                </p>
                <p className="truncate">{errorMsg}</p>
              </div>
            </div>

            <button
              onClick={onCloseError}
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

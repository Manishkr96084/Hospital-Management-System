import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastType) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Keep track of recent toasts to prevent duplicate spam
  const recentToastsRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    const key = `${type}:${title}:${message || ''}`;
    const now = Date.now();
    const lastTime = recentToastsRef.current.get(key);

    // Suppress identical toasts within 3.5 seconds
    if (lastTime && now - lastTime < 3500) {
      return;
    }
    recentToastsRef.current.set(key, now);

    // Clean up old entries from history map
    if (recentToastsRef.current.size > 50) {
      for (const [k, timestamp] of recentToastsRef.current.entries()) {
        if (now - timestamp > 10000) {
          recentToastsRef.current.delete(k);
        }
      }
    }

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      // Keep maximum 4 active toasts to prevent screen congestion
      const updated = prev.length >= 4 ? prev.slice(prev.length - 3) : prev;
      return [...updated, { id, title, message, type }];
    });

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    showToast(title, message, 'success');
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast(title, message, 'error');
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast(title, message, 'warning');
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast(title, message, 'info');
  }, [showToast]);

  const contextValue = useMemo(() => ({
    showToast,
    success,
    error,
    warning,
    info
  }), [showToast, success, error, warning, info]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto flex items-start p-4 rounded-xl shadow-2xl border backdrop-blur-xl ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                  : toast.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/30 text-rose-100'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500/30 text-amber-100'
                  : 'bg-slate-900/90 border-slate-700 text-slate-100'
              }`}
            >
              <div className="mr-3 mt-0.5 shrink-0">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
              </div>
              <div className="flex-1 pr-2">
                <h4 className="text-sm font-semibold">{toast.title}</h4>
                {toast.message && <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 opacity-70 hover:opacity-100 transition-opacity rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

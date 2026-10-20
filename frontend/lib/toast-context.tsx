'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    showToast(message, 'success', title);
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast(message, 'error', title);
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast(message, 'info', title);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, info }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        role="region"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';

            // WCAG AA Compliant colors according to specifications:
            // Mint: bg #BDEBD6, ink #1F6B50
            // Rose: bg #FFC8D6, ink #8C2F4B
            // Sky: bg #BFE0FF, ink #24577F
            const bgClass = isSuccess
              ? 'bg-[#BDEBD6] border-[#A2D9BF] text-[#1F6B50]'
              : isError
              ? 'bg-[#FFC8D6] border-[#F2B3C3] text-[#8C2F4B]'
              : 'bg-[#BFE0FF] border-[#A8D3FC] text-[#24577F]';

            const IconComponent = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={`pointer-events-auto rounded-2xl p-4 border shadow-soft flex items-start gap-3 relative ${bgClass}`}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 pr-6">
                  {toast.title && (
                    <div className="font-semibold text-sm leading-tight mb-0.5">{toast.title}</div>
                  )}
                  <div className="text-xs leading-relaxed font-medium">{toast.message}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Close notification"
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors focus-visible:ring-1"
                >
                  <X className="w-4 h-4 opacity-70 hover:opacity-100" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

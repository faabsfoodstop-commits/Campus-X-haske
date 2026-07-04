import { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', autoClose = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, autoClose }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
        style={{ width: '360px', maxWidth: 'calc(100vw - 2rem)' }}
      >
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            autoClose={toast.autoClose}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const TOAST_CONFIG = {
  success: {
    title: 'Success',
    borderColor: '#22c55e',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    progressColor: '#22c55e',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  error: {
    title: 'Error',
    borderColor: '#ef4444',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    progressColor: '#ef4444',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  },
  info: {
    title: 'Info',
    borderColor: '#3b82f6',
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    progressColor: '#3b82f6',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    title: 'Warning',
    borderColor: '#f59e0b',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    progressColor: '#f59e0b',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
};

function Toast({ message, type = 'info', onClose, autoClose }) {
  const cfg = TOAST_CONFIG[type] ?? TOAST_CONFIG.info;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="pointer-events-auto bg-white rounded-xl shadow-xl overflow-hidden toast-slide-in"
      style={{ borderLeft: `4px solid ${cfg.borderColor}` }}
    >
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div
          className="flex-shrink-0 rounded-full p-1.5"
          style={{ backgroundColor: cfg.iconBg, color: cfg.iconColor }}
        >
          {cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{cfg.title}</p>
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">{message}</p>
        </div>

        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {autoClose && (
        <div className="h-1 bg-gray-100">
          <div
            className="h-full toast-shrink-bar"
            style={{ backgroundColor: cfg.progressColor, animationDuration: `${autoClose}ms` }}
          />
        </div>
      )}
    </div>
  );
}

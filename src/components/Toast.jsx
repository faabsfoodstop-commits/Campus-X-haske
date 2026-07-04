import { useState, useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, autoClose = 4000 }) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce-in`}
    >
      <span aria-hidden="true">
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'info' && 'ℹ'}
        {type === 'warning' && '⚠'}
      </span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} aria-label="Dismiss notification" className="text-white/80 hover:text-white">×</button>
    </div>
  );
}

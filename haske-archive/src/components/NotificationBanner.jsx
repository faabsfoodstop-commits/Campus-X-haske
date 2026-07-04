import { useEffect } from 'react';
import './NotificationBanner.css';

export default function NotificationBanner({ message, type = 'info', onDismiss, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`notification-banner ${type}`}>
      <div className="banner-icon">{icons[type]}</div>
      <p className="banner-message">{message}</p>
      <button onClick={onDismiss} className="banner-close">×</button>
    </div>
  );
}

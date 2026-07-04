import { useEffect } from 'react';
import './Modal.css';

export default function Modal({
  isOpen = false,
  title = 'Confirm',
  message = '',
  type = 'info', // info, success, warning, error
  actions = [],
  closeButtonText = 'Close',
  onClose = () => {}
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕'
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} aria-hidden="true">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`modal-container ${type}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-icon" aria-hidden="true">{icons[type]}</span>
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {message && <p className="modal-message">{message}</p>}

        <div className="modal-actions">
          {actions.length > 0 ? (
            actions.map((action, idx) => (
              <button
                key={idx}
                className={`modal-action-btn ${action.variant || 'secondary'}`}
                onClick={() => {
                  action.onClick?.();
                  onClose();
                }}
              >
                {action.label}
              </button>
            ))
          ) : (
            <button
              className="modal-action-btn primary"
              onClick={onClose}
            >
              {closeButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

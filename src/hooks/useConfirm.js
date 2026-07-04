import { useState, useCallback } from 'react';

export function useConfirm() {
  const [modal, setModal] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      const {
        title = 'Confirm',
        message = 'Are you sure?',
        type = 'warning',
        cancelLabel = 'Cancel',
        confirmLabel = 'Confirm',
        onConfirm = () => {},
        onCancel = () => {}
      } = typeof options === 'string' ? { message: options } : options;

      setModal({
        isOpen: true,
        title,
        message,
        type,
        actions: [
          {
            label: cancelLabel,
            variant: 'secondary',
            onClick: () => {
              onCancel?.();
              resolve(false);
              setModal(null);
            }
          },
          {
            label: confirmLabel,
            variant: type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary',
            onClick: () => {
              onConfirm?.();
              resolve(true);
              setModal(null);
            }
          }
        ]
      });
    });
  }, []);

  const alert = useCallback((options) => {
    return new Promise((resolve) => {
      const {
        title = 'Alert',
        message = '',
        type = 'info',
        buttonLabel = 'OK',
        onClose = () => {}
      } = typeof options === 'string' ? { message: options } : options;

      setModal({
        isOpen: true,
        title,
        message,
        type,
        actions: [
          {
            label: buttonLabel,
            variant: type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary',
            onClick: () => {
              onClose?.();
              resolve(true);
              setModal(null);
            }
          }
        ]
      });
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal(prev => prev ? { ...prev, isOpen: false } : null);
    // allow exit animation then clear
    setTimeout(() => setModal(null), 150);
  }, []);

  return {
    confirm,
    alert,
    modal,
    closeModal
  };
}

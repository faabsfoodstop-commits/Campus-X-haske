import './EmptyState.css';

export default function EmptyState({
  icon = '📭',
  title = 'No items here',
  message = 'Get started by taking action',
  actionLabel = 'Get Started',
  onAction,
  variant = 'default'
}) {
  return (
    <div className={`empty-state ${variant}`}>
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-message">{message}</p>
      {onAction && (
        <button onClick={onAction} className="empty-action-btn">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

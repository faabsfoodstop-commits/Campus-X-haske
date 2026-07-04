import './SkeletonLoader.css';

export default function SkeletonLoader({ type = 'card', count = 3 }) {
  if (type === 'card') {
    return (
      <div className="skeleton-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-header">
              <div className="skeleton skeleton-avatar" />
              <div className="skeleton-text">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-subtitle" />
              </div>
            </div>
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-button" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="skeleton-list">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-list-item">
            <div className="skeleton skeleton-avatar" />
            <div className="skeleton-content">
              <div className="skeleton skeleton-title-sm" />
              <div className="skeleton skeleton-subtitle-sm" />
            </div>
            <div className="skeleton skeleton-amount" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="skeleton-profile">
        <div className="skeleton skeleton-cover" />
        <div className="skeleton-info">
          <div className="skeleton skeleton-avatar-lg" />
          <div className="skeleton skeleton-title-lg" />
          <div className="skeleton skeleton-subtitle" />
        </div>
      </div>
    );
  }

  return null;
}

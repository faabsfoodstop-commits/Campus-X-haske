import './ActivityFeed.css';

export default function ActivityFeed({ activities }) {
  const getActivityIcon = (type) => {
    const icons = {
      earn: '➕',
      purchase: '🛒',
      challenge: '🎯',
      achievement: '🏆',
      referral: '👥',
      streak: '🔥',
    };
    return icons[type] || '📌';
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="activity-feed">
      <div className="feed-header">
        <h3>📊 Recent Activity</h3>
      </div>

      <div className="feed-items">
        {activities && activities.length > 0 ? (
          activities.slice(0, 10).map((activity, idx) => (
            <div key={idx} className={`feed-item ${activity.type}`}>
              <div className="feed-icon">{getActivityIcon(activity.type)}</div>
              <div className="feed-content">
                <p className="feed-title">{activity.title}</p>
                <p className="feed-time">{formatTime(activity.timestamp)}</p>
              </div>
              <div className={`feed-amount ${activity.type}`}>
                {activity.value}
              </div>
            </div>
          ))
        ) : (
          <div className="feed-empty">
            <p>No activities yet. Start earning points! 🚀</p>
          </div>
        )}
      </div>
    </div>
  );
}

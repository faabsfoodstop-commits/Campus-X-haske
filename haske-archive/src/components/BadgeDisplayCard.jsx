import './BadgeDisplayCard.css';

export default function BadgeDisplayCard({
  badge,
  isUnlocked = false,
  progress = 0,
  maxProgress = 100
}) {
  return (
    <div className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
      <div className="badge-icon-container">
        <div className="badge-icon">{badge.icon}</div>
        {!isUnlocked && <div className="badge-lock">🔒</div>}
        {isUnlocked && <div className="badge-check">✓</div>}
      </div>

      <div className="badge-content">
        <h4 className="badge-name">{badge.name}</h4>
        <p className="badge-category">{badge.category}</p>

        {!isUnlocked ? (
          <div className="badge-progress">
            <div className="progress-small">
              <div
                className="progress-fill-small"
                style={{ width: `${(progress / maxProgress) * 100}%` }}
              />
            </div>
            <p className="progress-text">{Math.round((progress / maxProgress) * 100)}% complete</p>
          </div>
        ) : (
          <p className="badge-unlocked-date">Unlocked! 🎉</p>
        )}

        <p className="badge-description">{badge.description}</p>
      </div>

      <div className="badge-reward">
        <span className="reward-icon">⭐</span>
        <span className="reward-text">{badge.reward} pts</span>
      </div>
    </div>
  );
}

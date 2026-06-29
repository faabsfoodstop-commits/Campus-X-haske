import './ChallengeCard.css';

export default function ChallengeCard({
  challenge,
  isCompleted = false,
  progress = 0,
  maxProgress = 100,
  onClaim
}) {
  const progressPercent = Math.min(100, (progress / maxProgress) * 100);

  return (
    <div className={`challenge-card ${isCompleted ? 'completed' : ''}`}>
      <div className="challenge-header">
        <div className="challenge-icon">{challenge.icon}</div>
        <div className="challenge-title-group">
          <h3 className="challenge-title">{challenge.title}</h3>
          <p className="challenge-period">{challenge.period || 'This Week'}</p>
        </div>
        <div className="challenge-reward">
          <span className="reward-amount">+{challenge.reward}</span>
          <span className="reward-unit">pts</span>
        </div>
      </div>

      <p className="challenge-description">{challenge.description}</p>

      <div className="challenge-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="progress-info">
          <span className="current">{progress}</span>
          <span className="separator">/</span>
          <span className="target">{maxProgress}</span>
          <span className="percent">{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {isCompleted ? (
        <button onClick={onClaim} className="challenge-btn claim">
          ✓ Claim Reward
        </button>
      ) : (
        <div className="challenge-action">
          <span className="challenge-status">
            {progressPercent === 100 ? '🎯 Ready to claim!' : '⏳ In progress'}
          </span>
        </div>
      )}
    </div>
  );
}

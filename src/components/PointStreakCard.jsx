import './PointStreakCard.css';

export default function PointStreakCard({ streak = 0, onCheckIn }) {
  const multiplier = Math.floor(streak / 7) * 10 + 10;
  const nextMilestone = Math.ceil((streak + 1) / 7) * 7;
  const daysToNextMilestone = nextMilestone - streak;

  return (
    <div className={`streak-card ${streak > 0 ? 'active' : 'inactive'}`}>
      <div className="streak-header">
        <div className="streak-title">
          <span className="streak-icon">🔥</span>
          <div>
            <h3>Check-In Streak</h3>
            <p>Maintain your streak for bonus points</p>
          </div>
        </div>
      </div>

      <div className="streak-display">
        <div className="streak-number">
          <span className="number">{streak}</span>
          <span className="label">days</span>
        </div>
        <div className="streak-multiplier">
          <div className="multiplier-badge">+{multiplier}%</div>
          <p className="multiplier-text">Bonus Multiplier</p>
        </div>
      </div>

      <div className="streak-progress">
        <div className="progress-label">
          <span>Progress to Level {Math.floor(streak / 7) + 1}</span>
          <span className="progress-days">{daysToNextMilestone} days to go</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((streak % 7) / 7) * 100}%` }}
          />
        </div>
      </div>

      <div className="streak-milestones">
        <div className="milestone">
          <span className="milestone-day">7 days</span>
          <span className="milestone-bonus">+10%</span>
        </div>
        <div className="milestone">
          <span className="milestone-day">14 days</span>
          <span className="milestone-bonus">+20%</span>
        </div>
        <div className="milestone">
          <span className="milestone-day">30 days</span>
          <span className="milestone-bonus">+50%</span>
        </div>
      </div>

      <button onClick={onCheckIn} className="streak-checkin-btn">
        ✓ Check In Today
      </button>

      <p className="streak-warning">
        💡 Missing a day will reset your streak. Check in every day!
      </p>
    </div>
  );
}

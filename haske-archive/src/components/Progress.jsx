import './Progress.css';

export default function Progress({
  current = 0,
  target = 100,
  label = 'Progress',
  showPercent = true,
  size = 'medium',
  color = 'blue'
}) {
  const percent = Math.min(100, (current / target) * 100);

  return (
    <div className={`progress-container ${size}`}>
      {label && <p className="progress-label">{label}</p>}
      <div className={`progress-bar ${color}`}>
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-info">
        <span className="progress-current">{current.toLocaleString()}</span>
        <span className="progress-target">/ {target.toLocaleString()}</span>
        {showPercent && <span className="progress-percent">{Math.round(percent)}%</span>}
      </div>
    </div>
  );
}

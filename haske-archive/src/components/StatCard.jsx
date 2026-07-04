import './StatCard.css';

export default function StatCard({
  icon = '📊',
  label = 'Statistic',
  value = '0',
  subtext = '',
  trend = null,
  color = 'blue'
}) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <div className="stat-value-row">
          <span className="stat-value">{value}</span>
          {trend && (
            <span className={`stat-trend ${trend.direction}`}>
              {trend.direction === 'up' ? '📈' : '📉'} {trend.percent}%
            </span>
          )}
        </div>
        {subtext && <p className="stat-subtext">{subtext}</p>}
      </div>
    </div>
  );
}

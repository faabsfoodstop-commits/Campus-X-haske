import './ActivityCard.css';

const ActivityCard = ({
  title,
  description,
  gradient,
  icon: Icon,
  onNavigate,
  badge,
  cta = 'Get Started'
}) => {
  return (
    <div
      className={`activity-card ${gradient}`}
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onNavigate()}
    >
      <div className="card-icon-container">
        <Icon />
      </div>

      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
      </div>

      {badge && <div className="card-badge">{badge}</div>}

      <div className="card-cta">{cta} →</div>
    </div>
  );
};

export default ActivityCard;

import { useState } from 'react';
import './RichMarketplaceCard.css';

export default function RichMarketplaceCard({ item, userPoints, onRedeem }) {
  const [showDetails, setShowDetails] = useState(false);
  const hasEnoughPoints = userPoints >= item.basePts;
  const affordabilityPercent = Math.min(100, (userPoints / item.basePts) * 100);

  return (
    <div className={`rich-card ${hasEnoughPoints ? 'available' : 'locked'}`}>
      <div className="card-header">
        <div className="card-icon">{item.icon || '🎁'}</div>
        <div className="card-title-group">
          <h3 className="card-title">{item.name}</h3>
          <div className="card-social">
            ⭐ {item.purchases || 0} purchases
          </div>
        </div>
        {item.featured && <div className="card-badge">Popular</div>}
      </div>

      <div className="card-cost">
        <div className="cost-item">
          <span className="cost-label">Points Needed</span>
          <span className="cost-value">{item.basePts.toLocaleString()}</span>
        </div>
        <div className="cost-status">
          {hasEnoughPoints ? (
            <span className="status-success">✓ You can redeem!</span>
          ) : (
            <>
              <span className="status-warning">Need {(item.basePts - userPoints).toLocaleString()} more</span>
              <div className="affordability-bar">
                <div className="affordability-fill" style={{ width: `${affordabilityPercent}%` }} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card-details-toggle">
        <button onClick={() => setShowDetails(!showDetails)} className="details-btn">
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {showDetails && (
        <div className="card-details">
          <div className="detail-row">
            <span>Network</span>
            <span className="detail-value">{item.network || 'Multiple'}</span>
          </div>
          <div className="detail-row">
            <span>Delivery</span>
            <span className="detail-value">⚡ Instant</span>
          </div>
          <div className="detail-row">
            <span>Guarantee</span>
            <span className="detail-value">100% money-back</span>
          </div>
        </div>
      )}

      <div className="card-actions">
        <button
          onClick={() => onRedeem(item)}
          disabled={!hasEnoughPoints}
          className={`redeem-btn ${hasEnoughPoints ? 'primary' : 'disabled'}`}
        >
          {hasEnoughPoints ? 'Redeem Now' : 'Earn More Points'}
        </button>
      </div>
    </div>
  );
}

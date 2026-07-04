import './ReferralCard.css';

export default function ReferralCard({
  referralCode = '',
  referredCount = 0,
  earnedAmount = 0,
  maxReferrals = 50,
  onShare,
  onCopy
}) {
  const progressPercent = (referredCount / maxReferrals) * 100;

  return (
    <div className="referral-card">
      <div className="referral-header">
        <h3>👥 Refer Friends & Earn</h3>
        <p>Share your code and earn points for each friend</p>
      </div>

      <div className="referral-code-section">
        <label className="code-label">Your Referral Code</label>
        <div className="code-display">
          <span className="code-text">{referralCode || 'Loading...'}</span>
          <button onClick={onCopy} className="code-copy-btn" title="Copy code">
            📋
          </button>
        </div>
        <p className="code-hint">Share this code with friends to earn points</p>
      </div>

      <div className="referral-stats">
        <div className="stat-box">
          <div className="stat-value">{referredCount}</div>
          <div className="stat-label">Friends Referred</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">+{earnedAmount}</div>
          <div className="stat-label">Points Earned</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">₦{Math.round(earnedAmount * 0.50)}</div>
          <div className="stat-label">Cash Value</div>
        </div>
      </div>

      <div className="referral-progress">
        <div className="progress-label">
          <span>Referral Progress</span>
          <span className="progress-percent">{referredCount}/{maxReferrals}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="referral-tiers">
        <p className="tiers-title">💰 Earn More by Tier:</p>
        <div className="tier-list">
          <div className="tier-item">
            <span className="tier-count">5 friends</span>
            <span className="tier-reward">₦50/referral</span>
          </div>
          <div className="tier-item">
            <span className="tier-count">15 friends</span>
            <span className="tier-reward">₦75/referral</span>
          </div>
          <div className="tier-item">
            <span className="tier-count">30 friends</span>
            <span className="tier-reward">₦100/referral</span>
          </div>
        </div>
      </div>

      <button onClick={onShare} className="referral-share-btn">
        📤 Share Referral Link
      </button>
    </div>
  );
}

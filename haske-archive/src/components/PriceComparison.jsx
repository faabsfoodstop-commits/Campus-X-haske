import './PriceComparison.css';

export default function PriceComparison({ userPoints, nairaBalance }) {
  const pointValue = (userPoints * 0.50) / 1000; // Approximate cash value
  const totalValue = pointValue + nairaBalance;

  return (
    <div className="price-comparison">
      <div className="comparison-header">
        <h3>💎 Your Total Assets</h3>
        <p>See what your points are worth</p>
      </div>

      <div className="comparison-grid">
        {/* Points Card */}
        <div className="comparison-card points">
          <div className="card-label">Points Value</div>
          <div className="card-value">₦{(userPoints * 0.50).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          <div className="card-subtext">{userPoints.toLocaleString()} pts @ ₦0.50</div>
        </div>

        {/* Naira Card */}
        <div className="comparison-card naira">
          <div className="card-label">Cash Balance</div>
          <div className="card-value">₦{nairaBalance.toLocaleString()}</div>
          <div className="card-subtext">In your wallet</div>
        </div>
      </div>

      {/* Total */}
      <div className="comparison-total">
        <div className="total-label">Total Net Worth</div>
        <div className="total-value">₦{Math.round(totalValue).toLocaleString()}</div>
        <div className="total-subtext">Points + Cash</div>
      </div>

      {/* Benefits */}
      <div className="comparison-benefits">
        <p className="benefits-title">✨ Benefits of Points:</p>
        <ul className="benefits-list">
          <li>
            <span className="benefit-icon">📱</span>
            <span>Get instant airtime & data</span>
          </li>
          <li>
            <span className="benefit-icon">🎁</span>
            <span>Redeem gift cards</span>
          </li>
          <li>
            <span className="benefit-icon">💱</span>
            <span>Trade with other users</span>
          </li>
          <li>
            <span className="benefit-icon">🏆</span>
            <span>Unlock exclusive rewards</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

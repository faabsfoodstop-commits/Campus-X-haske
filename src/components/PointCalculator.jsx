import { useState } from 'react';
import './PointCalculator.css';

export default function PointCalculator({ onCalculate }) {
  const [nairaAmount, setNairaAmount] = useState(500);

  const packages = [
    { naira: 500, points: 1000, savings: 0 },
    { naira: 1000, points: 2100, savings: '5%' },
    { naira: 2500, points: 5500, savings: '10%' },
    { naira: 5000, points: 11500, savings: '15%' },
  ];

  const costPerPoint = (nairaAmount / packages.find(p => p.naira === nairaAmount)?.points) || 0;
  const selectedPackage = packages.find(p => p.naira === nairaAmount);

  return (
    <div className="point-calculator">
      <div className="calculator-header">
        <h3>💳 Point Calculator</h3>
        <p>See how many points you'll get</p>
      </div>

      {/* Amount Slider */}
      <div className="calculator-input">
        <label>Amount to Spend</label>
        <input
          type="range"
          min="500"
          max="5000"
          step="500"
          value={nairaAmount}
          onChange={(e) => setNairaAmount(Number(e.target.value))}
          className="amount-slider"
        />
        <div className="amount-display">
          <span className="amount-value">₦{nairaAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Quick Package Buttons */}
      <div className="calculator-packages">
        {packages.map(pkg => (
          <button
            key={pkg.naira}
            onClick={() => setNairaAmount(pkg.naira)}
            className={`package-btn ${nairaAmount === pkg.naira ? 'active' : ''}`}
          >
            <div className="package-naira">₦{pkg.naira}</div>
            <div className="package-points">{pkg.points.toLocaleString()} pts</div>
            {pkg.savings && <div className="package-savings">{pkg.savings} off</div>}
          </button>
        ))}
      </div>

      {/* Results */}
      {selectedPackage && (
        <div className="calculator-results">
          <div className="result-row">
            <span>You'll Get</span>
            <span className="result-value">{selectedPackage.points.toLocaleString()} pts</span>
          </div>
          <div className="result-row">
            <span>Cost per Point</span>
            <span className="result-value">₦{costPerPoint.toFixed(3)}</span>
          </div>
          {selectedPackage.savings && (
            <div className="result-row savings">
              <span>💰 You Save</span>
              <span className="result-value">{selectedPackage.savings}</span>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => onCalculate?.({ naira: nairaAmount, points: selectedPackage?.points })}
        className="calculator-cta"
      >
        Proceed to Payment →
      </button>
    </div>
  );
}

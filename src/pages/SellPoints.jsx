import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function SellPoints() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [pointsToSell, setPointsToSell] = useState('');
  const [pricePerPoint, setPricePerPoint] = useState('0.40');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const totalValue = pointsToSell ? (parseInt(pointsToSell) * parseFloat(pricePerPoint)).toLocaleString() : '0';
  const currentPoints = userData?.points || 0;
  const pointsNum = parseInt(pointsToSell) || 0;
  const isValid = pointsNum > 0 && pointsNum <= currentPoints && parseFloat(pricePerPoint) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setError('Invalid points or price');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'point_sell_orders'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        points: pointsNum,
        askPrice: parseFloat(pricePerPoint),
        totalValue: pointsNum * parseFloat(pricePerPoint),
        status: 'active',
        createdAt: new Date(),
      });

      // Reset form
      setPointsToSell('');
      setPricePerPoint('0.40');

      alert('✓ Your sell order is live on the Point Market!');
      navigate('/point-market');
    } catch (err) {
      console.error('Error creating sell order:', err);
      setError('Failed to create order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/point-market')}
              className="text-gray-600 hover:text-primary"
            >
              ← Back to Market
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sell Your Points</h1>
          <p className="text-gray-600 mb-8">
            Convert your earned points into cash. Set your price and wait for buyers.
          </p>

          {/* Current Balance */}
          <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-4 mb-8">
            <p className="text-gray-600 text-sm mb-1">Available Points</p>
            <p className="text-3xl font-bold text-primary">{currentPoints.toLocaleString()}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Points Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                How many points to sell?
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={currentPoints}
                  value={pointsToSell}
                  onChange={(e) => setPointsToSell(e.target.value)}
                  placeholder="e.g., 500"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setPointsToSell(currentPoints.toString())}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700"
                >
                  Max
                </button>
              </div>
              {pointsNum > currentPoints && pointsNum > 0 && (
                <p className="text-red-600 text-sm mt-2">You don't have enough points</p>
              )}
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Price per point (₦)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-600">₦</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={pricePerPoint}
                  onChange={(e) => setPricePerPoint(e.target.value)}
                  placeholder="0.40"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Platform buys at ₦0.40/pt. Price higher for faster sales.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">Quick prices:</p>
              <div className="grid grid-cols-4 gap-2">
                {['0.35', '0.40', '0.45', '0.50'].map((price) => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setPricePerPoint(price)}
                    className={`py-2 rounded font-semibold transition ${
                      pricePerPoint === price
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary'
                    }`}
                  >
                    ₦{price}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600 text-sm">Points to sell</p>
                  <p className="text-2xl font-bold text-gray-800">{pointsNum.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Price per point</p>
                  <p className="text-2xl font-bold text-gray-800">₦{pricePerPoint}</p>
                </div>
              </div>
              <div className="border-t border-blue-200 pt-4">
                <p className="text-gray-600 text-sm mb-1">Total value</p>
                <p className="text-3xl font-bold text-primary">₦{totalValue}</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                isValid && !submitting
                  ? 'bg-primary hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Creating order...' : 'List on Market'}
            </button>

            {/* Info */}
            <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-4 text-sm">
              <p className="text-gray-700 mb-2">
                <strong>How it works:</strong>
              </p>
              <ul className="text-gray-600 space-y-1 text-xs">
                <li>✓ Your order appears on the Point Market immediately</li>
                <li>✓ Buyers can accept your price anytime</li>
                <li>✓ Once bought, points transfer and you get cash to wallet</li>
                <li>✓ Cancel anytime if no one's interested</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

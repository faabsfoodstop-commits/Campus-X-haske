import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function BuyPoints() {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pointPackages = [
    {
      id: 'starter',
      points: 500,
      price: 250,
      description: 'Get started',
      popular: false,
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'standard',
      points: 1000,
      price: 500,
      description: 'Most popular',
      popular: true,
      color: 'from-indigo-400 to-indigo-600'
    },
    {
      id: 'boost',
      points: 2500,
      price: 1250,
      description: 'Better value',
      popular: false,
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'premium',
      points: 5000,
      price: 2500,
      description: 'Best savings',
      popular: false,
      color: 'from-pink-400 to-pink-600'
    },
  ];

  const handlePurchase = async (pkg) => {
    if (!auth.currentUser) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      // TODO: Integrate payment provider (Paystack, Stripe, etc.)
      // For now, show placeholder
      const userRef = doc(db, 'users', auth.currentUser.uid);

      // This will be replaced with actual payment processing
      alert(`Payment integration coming soon!\n\n${pkg.points} points = ₦${pkg.price}\n\nSupported: Paystack, bank transfer, card`);

      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-primary">Buy Points</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Get Points Instantly</h2>
          <p className="text-xl text-gray-600 mb-2">Speed up your rewards with flexible packages</p>
          <p className="text-lg text-primary font-semibold">₦0.50 per point</p>
        </div>

        {/* Point Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {pointPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
                pkg.popular ? 'md:scale-105 ring-2 ring-indigo-500' : ''
              } cursor-pointer`}
              onClick={() => setSelectedPackage(pkg)}
            >
              <div className={`bg-gradient-to-br ${pkg.color} p-8 text-white relative`}>
                {pkg.popular && (
                  <div className="absolute top-3 right-3 bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                    Popular
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm opacity-90 mb-2">{pkg.description}</p>
                  <p className="text-4xl font-bold">{pkg.points.toLocaleString()}</p>
                  <p className="text-sm opacity-75">points</p>
                </div>

                <div className="border-t border-white/30 pt-6">
                  <p className="text-sm opacity-90 mb-1">Total Price</p>
                  <p className="text-3xl font-bold">₦{pkg.price.toLocaleString()}</p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchase(pkg);
                  }}
                  disabled={loading}
                  className={`w-full mt-6 py-2 rounded-lg font-semibold transition ${
                    selectedPackage?.id === pkg.id
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  } disabled:opacity-50`}
                >
                  {loading && selectedPackage?.id === pkg.id ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Why Buy Points?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="font-bold text-gray-800 mb-2">Instant Access</h4>
              <p className="text-gray-600">Redeem for rewards immediately. No waiting for points to accumulate.</p>
            </div>
            <div>
              <div className="text-3xl mb-3">💰</div>
              <h4 className="font-bold text-gray-800 mb-2">Better Value</h4>
              <p className="text-gray-600">Get ₦500 airtime for ₦250 total (earn 800 pts free, buy 200 for ₦100).</p>
            </div>
            <div>
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-bold text-gray-800 mb-2">Flexible</h4>
              <p className="text-gray-600">Choose your package. Use points for airtime, data, or gift cards.</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">How It Works</h3>
          <div className="space-y-3 text-gray-700">
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">1.</span>
              <span>Choose a point package above</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">2.</span>
              <span>Select your payment method (Paystack, bank transfer, card)</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">3.</span>
              <span>Points appear instantly in your account</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">4.</span>
              <span>Head to Marketplace and redeem for airtime, data, or gift cards</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

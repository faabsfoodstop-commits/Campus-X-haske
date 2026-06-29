import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Button from '../components/Button';
import { IconArrowLeft, IconCheckmark, IconDiamond, IconTrendingUp } from '../components/Icons';

export default function PremiumEnhancements() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!auth.currentUser) return;

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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const isPremium = userData?.premiumActive;

  const premiumFeatures = [
    {
      title: '2x Points on Everything',
      description: 'Earn double points on all activities',
      icon: IconTrendingUp,
      available: true
    },
    {
      title: 'Instant Point Redemption',
      description: 'Redeem points immediately (vs 24-48h)',
      icon: IconCheckmark,
      available: true
    },
    {
      title: 'Premium Ad Badges',
      description: 'Get "Verified Seller" badge on ads',
      icon: IconCheckmark,
      available: !isPremium
    },
    {
      title: '10 Free Ads/Month',
      description: 'Post ads without points deduction',
      icon: IconCheckmark,
      available: true
    },
    {
      title: 'Priority in Leaderboards',
      description: 'Higher ranking visibility',
      icon: IconTrendingUp,
      available: true
    },
    {
      title: 'Exclusive Cosmetics',
      description: 'Premium-only profile customization',
      icon: IconDiamond,
      available: true
    },
    {
      title: 'Ad Analytics',
      description: 'Track views and engagement on your ads',
      icon: IconTrendingUp,
      available: !isPremium
    },
    {
      title: 'No Video Ads',
      description: 'Skip ads on video reward activities',
      icon: IconCheckmark,
      available: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => navigate('/premium')}
              className="p-2 hover:bg-gray-100 rounded transition"
            >
              <IconArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-primary">Premium Enhancements</h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status */}
        {isPremium ? (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-purple-500 rounded-lg p-6 mb-8">
            <p className="text-purple-700 font-bold text-lg">✓ Premium Active</p>
            <p className="text-purple-600">Enjoy all premium benefits!</p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-primary rounded-lg p-6 mb-8">
            <p className="text-gray-800 font-bold text-lg">Upgrade to Premium</p>
            <p className="text-gray-700 mb-4">Unlock all these features for just ₦999/month</p>
            <Button
              onClick={() => navigate('/premium')}
              variant="primary"
              size="lg"
            >
              Upgrade Now
            </Button>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {premiumFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className={`rounded-lg p-6 transition ${
                  feature.available
                    ? 'bg-white shadow hover:shadow-lg'
                    : 'bg-gray-100 shadow opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${feature.available ? 'bg-primary/10' : 'bg-gray-300/20'}`}>
                    <Icon className={`w-6 h-6 ${feature.available ? 'text-primary' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                    {feature.available && (
                      <p className="text-xs text-green-600 font-semibold mt-2">✓ Available</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ROI Calculation */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-l-4 border-green-500 rounded-lg p-8 mt-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Premium ROI</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Daily Free Earnings</p>
              <p className="text-3xl font-bold text-green-600">~₦100/day</p>
              <p className="text-xs text-gray-600 mt-1">Without premium</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Premium Earnings (2x)</p>
              <p className="text-3xl font-bold text-green-600">~₦200/day</p>
              <p className="text-xs text-gray-600 mt-1">With 2x multiplier</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Monthly Premium Cost</p>
              <p className="text-3xl font-bold text-primary">₦999/month</p>
              <p className="text-xs text-green-600 mt-1">Break-even in 5 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

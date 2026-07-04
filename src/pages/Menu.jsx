import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { supabase } from '../config/supabase';
import { IconArrowLeft } from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';
import { ToastContext } from '../context/ToastContext';

export default function Menu() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && userData) {
        setUserData(userData);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const menuItems = [
    {
      section: 'Earning',
      items: [
        { label: 'Daily Missions', path: '/daily-missions', icon: '🎯' },
        { label: 'Spin Wheel', path: '/spin-wheel', icon: '🎡' },
        { label: 'Trivia', path: '/trivia', icon: '🧠' },
        { label: 'Video Ads', path: '/video-ads', icon: '📺' },
        { label: 'Instagram Follow', path: '/instagram-follow', icon: '📸' },
        { label: 'Sponsored Missions', path: '/sponsored-missions', icon: '⭐' },
      ]
    },
    {
      section: 'Community',
      items: [
        { label: 'Campus Chat', path: '/university-chat', icon: '💬' },
        { label: 'Marketplace Ads', path: '/marketplace-ads', icon: '🛍️' },
        { label: 'Leaderboards', path: '/leaderboards', icon: '🏆' },
        { label: 'Weekly Challenges', path: '/weekly-challenges', icon: '🏅' },
      ]
    },
    {
      section: 'Account & Rewards',
      items: [
        { label: 'Rewards', path: '/rewards', icon: '🎁' },
        { label: 'Referrals', path: '/referrals', icon: '👥' },
        { label: 'Achievements', path: '/achievements', icon: '🏆' },
        { label: 'Streak Manager', path: '/streak', icon: '🔥' },
      ]
    },
    {
      section: 'Shopping',
      items: [
        { label: 'Buy Points', path: '/buy-points', icon: '💳' },
        { label: 'Point Market', path: '/point-market', icon: '📊' },
        { label: 'Sell Points', path: '/sell-points', icon: '💰' },
        { label: 'Cosmetics Shop', path: '/cosmetics-shop', icon: '✨' },
      ]
    },
    {
      section: 'Premium & Monetization',
      items: [
        { label: 'Premium Tier', path: '/premium', icon: '👑' },
        { label: 'Premium Enhancements', path: '/premium-enhancements', icon: '💎' },
        { label: 'Post Ads', path: '/my-ads', icon: '📢' },
      ]
    },
    {
      section: 'Admin & Analytics',
      items: [
        userData?.is_admin && { label: 'Admin Panel', path: '/admin', icon: '⚙️' },
        userData?.is_admin && { label: 'Ad Moderation', path: '/admin/moderation', icon: '🛡️' },
        userData?.is_admin && { label: 'University Analytics', path: '/analytics/universities', icon: '📈' },
        userData?.is_admin && { label: 'Brand Partnerships', path: '/admin/partnerships', icon: '🤝' },
      ].filter(Boolean)
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {menuItems.map((section) => (
          section.items.length > 0 && (
            <div key={section.section} className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">{section.section}</h2>
              <div className="grid grid-cols-2 gap-3">
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="bg-white rounded-lg p-4 shadow hover:shadow-lg transition text-left"
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )
        ))}

        {/* Account Info */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-800 mb-4">Account</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Points Balance</span>
              <span className="font-bold text-primary">{userData?.points || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Profile Status</span>
              <span className={userData?.profile_complete ? 'font-bold text-green-600' : 'font-bold text-orange-600'}>
                {userData?.profile_complete ? 'Complete' : 'Incomplete'}
              </span>
            </div>
            {userData?.premium_active && (
              <div className="flex justify-between">
                <span className="text-gray-600">Premium Status</span>
                <span className="font-bold text-blue-600">✓ Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Other */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => navigate('/transactions')}
            className="w-full bg-white rounded-lg p-4 shadow hover:shadow-lg transition text-left font-semibold text-gray-800"
          >
            📊 Transaction History
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-white rounded-lg p-4 shadow hover:shadow-lg transition text-left font-semibold text-gray-800"
          >
            👤 Edit Profile
          </button>
          <button
            onClick={() => navigate('/wallet')}
            className="w-full bg-white rounded-lg p-4 shadow hover:shadow-lg transition text-left font-semibold text-gray-800"
          >
            💳 Wallet
          </button>
          <button
            onClick={async () => {
              try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                navigate('/');
              } catch (err) {
                addToast('Sign out failed. Please try again.', 'error');
              }
            }}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-lg p-4 shadow hover:shadow-lg transition text-left font-semibold"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

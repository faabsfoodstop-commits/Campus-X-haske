import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, {profile?.full_name}! 👋</h1>
          <p className="text-purple-100">{profile?.university}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Points Balance</p>
            <p className="text-4xl font-bold text-purple-600">{profile?.points || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Wallet Balance</p>
            <p className="text-4xl font-bold text-green-600">₦{profile?.wallet || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Current Streak</p>
            <p className="text-4xl font-bold text-orange-600">{profile?.current_streak || 0} 🔥</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/daily-check-in')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">📅</p>
              <p className="font-semibold text-sm">Check-In</p>
            </button>
            <button
              onClick={() => navigate('/wallet')}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">💰</p>
              <p className="font-semibold text-sm">Wallet</p>
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">📊</p>
              <p className="font-semibold text-sm">Ledger</p>
            </button>
            <button
              onClick={() => navigate('/activity-log')}
              className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">📝</p>
              <p className="font-semibold text-sm">Activity</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Coming Soon</h2>
          <div className="space-y-3 opacity-50">
            <div className="text-left p-4 border-l-4 border-blue-500">
              <p className="font-semibold text-gray-800">✅ Daily Missions</p>
              <p className="text-sm text-gray-600">Complete tasks to earn extra points</p>
            </div>
            <div className="text-left p-4 border-l-4 border-green-500">
              <p className="font-semibold text-gray-800">▶️ Watch Ads</p>
              <p className="text-sm text-gray-600">Earn points by watching short videos</p>
            </div>
            <div className="text-left p-4 border-l-4 border-purple-500">
              <p className="font-semibold text-gray-800">🧑‍🤝‍🧑 Referrals</p>
              <p className="text-sm text-gray-600">Invite friends and earn bonuses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

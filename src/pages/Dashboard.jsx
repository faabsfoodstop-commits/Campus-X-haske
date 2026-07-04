import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [gettingStartedProgress, setGettingStartedProgress] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchGettingStartedProgress();
    }
  }, [user]);

  const fetchGettingStartedProgress = async () => {
    try {
      const { data } = await supabase
        .from('getting_started_tasks')
        .select('task_id')
        .eq('user_id', user.id);

      const progress = data ? (data.length / 4) * 100 : 0;
      setGettingStartedProgress(Math.round(progress));
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

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

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-amber-900">Getting Started</h2>
            <span className="text-sm font-semibold text-amber-700">{gettingStartedProgress}%</span>
          </div>
          <div className="w-full bg-amber-200 rounded-full h-2 mb-3">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${gettingStartedProgress}%` }}
            />
          </div>
          <button
            onClick={() => navigate('/getting-started')}
            className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition"
          >
            View Tasks →
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Earn Points</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/daily-check-in')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">📅</p>
              <p className="font-semibold text-sm">Check-In</p>
            </button>
            <button
              onClick={() => navigate('/daily-missions')}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">✅</p>
              <p className="font-semibold text-sm">Missions</p>
            </button>
            <button
              onClick={() => navigate('/video-ads')}
              className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">▶️</p>
              <p className="font-semibold text-sm">Ads</p>
            </button>
            <button
              onClick={() => navigate('/wallet')}
              className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">💰</p>
              <p className="font-semibold text-sm">Wallet</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Spend Points</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/rewards')}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">🎁</p>
              <p className="font-semibold text-sm">Rewards</p>
            </button>
            <button
              onClick={() => navigate('/redemption-history')}
              className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">📜</p>
              <p className="font-semibold text-sm">History</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Account</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/transactions')}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg p-4 transition text-center"
            >
              <p className="text-2xl mb-1">📊</p>
              <p className="font-semibold text-sm">Ledger</p>
            </button>
            <button
              onClick={() => navigate('/activity-log')}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg p-4 transition text-center"
            >
              <p className="text-2xl mb-1">📝</p>
              <p className="font-semibold text-sm">Activity</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Social & Community</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/referrals')}
              className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">👥</p>
              <p className="font-semibold text-sm">Referrals</p>
            </button>
            <button
              onClick={() => navigate('/leaderboards')}
              className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">🏆</p>
              <p className="font-semibold text-sm">Rankings</p>
            </button>
            <button
              onClick={() => navigate('/achievements')}
              className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-4 hover:shadow-lg transition"
            >
              <p className="text-2xl mb-1">🎖️</p>
              <p className="font-semibold text-sm">Badges</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Coming Soon</h2>
          <div className="space-y-3 opacity-50">
            <div className="text-left p-4 border-l-4 border-cyan-500">
              <p className="font-semibold text-gray-800">💱 Point Market</p>
              <p className="text-sm text-gray-600">Trade points with other users</p>
            </div>
            <div className="text-left p-4 border-l-4 border-violet-500">
              <p className="font-semibold text-gray-800">👗 Cosmetics</p>
              <p className="text-sm text-gray-600">Collect badges and titles</p>
            </div>
            <div className="text-left p-4 border-l-4 border-fuchsia-500">
              <p className="font-semibold text-gray-800">💎 Premium Tier</p>
              <p className="text-sm text-gray-600">Unlock exclusive benefits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

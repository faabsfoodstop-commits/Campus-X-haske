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

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Getting Started</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/daily-check-in')}
              className="w-full text-left p-4 border-l-4 border-blue-500 hover:bg-gray-50 transition"
            >
              <p className="font-semibold text-gray-800">📅 Daily Check-In</p>
              <p className="text-sm text-gray-600">Come back every day to maintain your streak</p>
            </button>
            <button
              onClick={() => navigate('/daily-missions')}
              className="w-full text-left p-4 border-l-4 border-green-500 hover:bg-gray-50 transition"
            >
              <p className="font-semibold text-gray-800">✅ Daily Missions</p>
              <p className="text-sm text-gray-600">Complete tasks to earn extra points</p>
            </button>
            <button
              onClick={() => navigate('/video-ads')}
              className="w-full text-left p-4 border-l-4 border-purple-500 hover:bg-gray-50 transition"
            >
              <p className="font-semibold text-gray-800">▶️ Watch Ads</p>
              <p className="text-sm text-gray-600">Earn points by watching short videos</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

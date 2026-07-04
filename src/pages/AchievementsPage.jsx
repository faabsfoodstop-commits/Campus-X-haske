import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { ACHIEVEMENTS, getUnlockedAchievements, getProgress } from '../data/achievements';

export default function AchievementsPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

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

  const unlockedAchievements = getUnlockedAchievements(userData || {});
  const allAchievements = Object.values(ACHIEVEMENTS);

  const filteredAchievements = allAchievements.filter(ach => {
    if (filter === 'unlocked') return unlockedAchievements.includes(ach);
    if (filter === 'locked') return !unlockedAchievements.includes(ach);
    return true;
  });

  const categories = [...new Set(allAchievements.map(a => a.category))];

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
              <h1 className="text-2xl font-bold text-primary">Achievements</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm mb-2">Achievements Unlocked</p>
            <p className="text-4xl font-bold text-yellow-600">{unlockedAchievements.length}</p>
            <p className="text-xs text-gray-600 mt-2">of {allAchievements.length} total</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm mb-2">Current Streak</p>
            <p className="text-4xl font-bold text-blue-600">{userData?.current_streak || 0}</p>
            <p className="text-xs text-gray-600 mt-2">days earning points</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm mb-2">Total Points</p>
            <p className="text-4xl font-bold text-purple-600">{(userData?.points || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-2">all-time earned</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {['all', 'unlocked', 'locked'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-semibold border-b-2 transition capitalize ${
                filter === f
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.includes(achievement);
            const progress = getProgress(userData || {}, achievement);

            return (
              <div
                key={achievement.id}
                className={`rounded-lg p-6 transition ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400'
                    : 'bg-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`text-5xl ${isUnlocked ? '' : 'grayscale'}`}>
                    {achievement.icon}
                  </div>
                  {isUnlocked && (
                    <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                      UNLOCKED
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {achievement.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {achievement.description}
                </p>

                {!isUnlocked && progress < 100 && (
                  <div className="bg-gray-300 rounded-full h-2 mb-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                )}

                <p className="text-xs text-gray-600 text-center">
                  {isUnlocked
                    ? '✓ You earned this!'
                    : `${Math.round(progress)}% progress`}
                </p>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-12 bg-blue-50 border-l-4 border-primary rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">💡 How to Earn Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-primary mb-2">Earn by Accumulating Points</p>
              <ul className="space-y-1 text-xs">
                <li>• 🌟 Getting Started: 100 points</li>
                <li>• 👑 Point Master: 5,000 points</li>
                <li>• 💰 Millionaire: 1M lifetime points</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-primary mb-2">Earn by Trading & Social</p>
              <ul className="space-y-1 text-xs">
                <li>• 📈 Market Maker: First sell order</li>
                <li>• 👥 Influencer: Refer 5 friends</li>
                <li>• 🔥 Consistent: 7-day earning streak</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

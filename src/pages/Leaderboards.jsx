import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

export default function Leaderboards() {
  const { profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('global');
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      // Fetch top 50 users
      const { data } = await supabase
        .from('users')
        .select('id, full_name, university, points, current_streak')
        .order('points', { ascending: false })
        .limit(50);

      setLeaderboard(data || []);

      // Calculate user rank
      if (profile) {
        const rank = (data || []).findIndex(u => u.id === profile.id) + 1;
        setUserRank(rank > 0 ? rank : null);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank) => {
    const medals = {
      1: '🥇',
      2: '🥈',
      3: '🥉',
    };
    return medals[rank] || '📍';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Leaderboards</h1>
        <p className="text-gray-600 mb-6">Compete with other students</p>

        {/* Your Rank Card */}
        {userRank && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Your Rank</p>
                <p className="text-4xl font-bold">#{userRank}</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold">{getMedalIcon(userRank)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg p-4 mb-6 overflow-x-auto">
          <div className="flex space-x-2 whitespace-nowrap">
            <button
              onClick={() => setFilter('global')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'global'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🌍 Global
            </button>
            <button
              onClick={() => setFilter('weekly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'weekly'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 This Week
            </button>
            <button
              onClick={() => setFilter('streaks')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'streaks'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔥 Streaks
            </button>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2">
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = profile?.id === user.id;

            return (
              <div
                key={user.id}
                className={`rounded-lg p-4 flex items-center justify-between ${
                  isCurrentUser
                    ? 'bg-purple-100 border-2 border-purple-500 shadow-md'
                    : 'bg-white hover:shadow-md transition'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {getMedalIcon(rank)}
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-gray-800">
                      #{rank} {user.full_name} {isCurrentUser && '(You)'}
                    </p>
                    <p className="text-sm text-gray-600">{user.university}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">{user.points.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">🔥 {user.current_streak}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Motivation Banner */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-6">
          <p className="text-amber-900 mb-2">
            <span className="font-bold text-lg">🚀 Ready to climb higher?</span>
          </p>
          <p className="text-amber-800 text-sm">
            Complete daily missions, watch ads, and maintain your streak to earn more points and climb the leaderboard!
          </p>
        </div>
      </div>
    </div>
  );
}

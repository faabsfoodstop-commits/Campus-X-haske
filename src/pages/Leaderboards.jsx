import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { IconArrowLeft, IconTrophy } from '../components/Icons';
import { NIGERIAN_UNIVERSITIES } from '../constants/universities';
import { COSMETICS_LOOKUP } from '../constants/cosmetics';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');
  const [userRank, setUserRank] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [leaderboardType, setLeaderboardType] = useState('global');
  const [selectedUniversity, setSelectedUniversity] = useState('');

  useEffect(() => {
    setLoading(true);
    if (leaderboardType === 'global') setSelectedUniversity('');
    fetchAll();
  }, [timeframe, leaderboardType, selectedUniversity]);

  const fetchAll = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const userId = session.user.id;
      const orderByField = timeframe === 'week' ? 'weekly_points'
                         : timeframe === 'month' ? 'monthly_points'
                         : 'points';

      // Build leaderboard query — select only needed columns
      let lbQuery = supabase
        .from('users')
        .select('id, full_name, points, weekly_points, monthly_points, university, department, active_badge, active_title, active_frame')
        .order(orderByField, { ascending: false })
        .limit(50);

      if (leaderboardType === 'university' && selectedUniversity) {
        lbQuery = lbQuery.eq('university', selectedUniversity);
      }

      // Run leaderboard + current user fetch in parallel
      const [lbResult, userResult] = await Promise.all([
        lbQuery,
        supabase.from('users').select('*').eq('id', userId).single(),
      ]);

      if (lbResult.error) throw lbResult.error;
      if (userResult.error) throw userResult.error;

      const mappedUsers = (lbResult.data || []).map((user, idx) => ({
        ...user,
        uid: user.id,
        rank: idx + 1,
      }));
      setLeaderboard(mappedUsers);

      const rawUser = userResult.data;
      setCurrentUser({
        ...rawUser,
        fullName: rawUser.full_name,
        weeklyPoints: rawUser.weekly_points || 0,
        monthlyPoints: rawUser.monthly_points || 0,
      });

      // Rank via server-side COUNT — no full table scan
      const userScore = rawUser[orderByField] || 0;
      let rankQuery = supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gt(orderByField, userScore);

      if (leaderboardType === 'university' && selectedUniversity) {
        rankQuery = rankQuery.eq('university', selectedUniversity);
      }

      const { count } = await rankQuery;
      setUserRank((count ?? 0) + 1);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setLoading(false);
    }
  };

  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  // Accepts both normalized (camelCase) and raw DB (snake_case) user objects
  const getPointsForTimeframe = (user) => {
    if (timeframe === 'week') return user.weekly_points ?? user.weeklyPoints ?? 0;
    if (timeframe === 'month') return user.monthly_points ?? user.monthlyPoints ?? 0;
    return user.points || 0;
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <IconArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <IconTrophy className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Leaderboard</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* User's Rank Card */}
        {currentUser && userRank && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-8 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100 mb-2">Your Rank</p>
                <h2 className="text-5xl font-bold mb-2">#<span className="text-yellow-300">{userRank}</span></h2>
                <p className="text-blue-100">{currentUser?.fullName || currentUser?.full_name || 'User'}</p>
                <p className="text-sm text-blue-100 mt-1">
                  📍 {NIGERIAN_UNIVERSITIES.find(u => u.code === currentUser?.university)?.name || currentUser?.university || 'No university set'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 mb-2">Points This {timeframe === 'week' ? 'Week' : timeframe === 'month' ? 'Month' : 'All Time'}</p>
                <p className="text-4xl font-bold text-yellow-300">{getPointsForTimeframe(currentUser || {}).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Type & Filters */}
        <div className="space-y-4 mb-8">
          {/* Leaderboard Type Selector */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setLeaderboardType('global')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                leaderboardType === 'global'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-100 border-2 border-primary'
              }`}
            >
              Global Rankings
            </button>
            <button
              onClick={() => {
                setLeaderboardType('university');
                if (!selectedUniversity && currentUser?.university) {
                  setSelectedUniversity(currentUser.university);
                }
              }}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                leaderboardType === 'university'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-100 border-2 border-primary'
              }`}
            >
              My University
            </button>
          </div>

          {/* University Selector (when viewing university leaderboard) */}
          {leaderboardType === 'university' && (
            <div className="flex justify-center">
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="px-4 py-2 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="">Select your university</option>
                {NIGERIAN_UNIVERSITIES.map((uni) => (
                  <option key={uni.code} value={uni.code}>
                    {uni.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Timeframe Selector */}
          <div className="flex gap-4 justify-center">
            {['week', 'month', 'all-time'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  timeframe === tf
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-800 hover:bg-gray-100 border-2 border-primary'
                }`}
              >
                {tf === 'all-time' ? 'All Time' : tf === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Spotlight */}
        {leaderboard.length >= 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((position) => {
              const user = leaderboard[position - 1];
              if (!user) return null;

              const medals = {
                1: 'from-yellow-400 to-yellow-600',
                2: 'from-gray-400 to-gray-600',
                3: 'from-orange-400 to-orange-600',
              };

              return (
                <div
                  key={user.uid}
                  className={`rounded-lg shadow-lg overflow-hidden bg-gradient-to-b ${medals[position]} text-white p-6 text-center transform scale-100 hover:scale-105 transition`}
                >
                  <div className="text-6xl mb-2">{getMedalIcon(position)}</div>
                  <p className="text-4xl font-bold mb-2">#{position}</p>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <p className="text-lg font-semibold">{user.full_name || 'Anonymous'}</p>
                    {user.active_badge && <span className="text-xl">{COSMETICS_LOOKUP[user.active_badge]?.icon}</span>}
                  </div>
                  {user.active_title && (
                    <p className="text-xs text-yellow-200 font-semibold mb-1">{COSMETICS_LOOKUP[user.active_title]?.name}</p>
                  )}
                  <p className="text-sm opacity-90 mb-4">{user.university || 'User'}</p>
                  <div className="bg-white bg-opacity-20 rounded p-2">
                    <p className="text-2xl font-bold">{getPointsForTimeframe(user).toLocaleString()} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
            <h3 className="text-2xl font-bold">
              {leaderboardType === 'global'
                ? 'Global Rankings'
                : `${NIGERIAN_UNIVERSITIES.find(u => u.code === selectedUniversity)?.name || 'University'} Rankings`}
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              {leaderboardType === 'university' && selectedUniversity
                ? `Top performers from ${NIGERIAN_UNIVERSITIES.find(u => u.code === selectedUniversity)?.name}`
                : 'Best performers across all universities'}
            </p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg mb-4">
                {leaderboardType === 'university' && selectedUniversity
                  ? `No rankings found for ${NIGERIAN_UNIVERSITIES.find(u => u.code === selectedUniversity)?.name}`
                  : 'No rankings available yet'}
              </p>
              {leaderboardType === 'university' && (
                <button
                  onClick={() => setLeaderboardType('global')}
                  className="text-primary hover:text-blue-600 font-semibold"
                >
                  View Global Rankings →
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {leaderboard.map((user) => (
                <div
                  key={user.uid}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 transition ${
                    user.id === currentUser?.id ? 'bg-blue-50 border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="min-w-12 text-center">
                      <p className="text-2xl font-bold text-primary">
                        #{user.rank}
                        {getMedalIcon(user.rank) && <span className="ml-1">{getMedalIcon(user.rank)}</span>}
                      </p>
                    </div>
                    {/* Avatar with frame ring */}
                    <div
                      className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={user.active_frame ? { boxShadow: `0 0 0 3px ${COSMETICS_LOOKUP[user.active_frame]?.frameColor}` } : {}}
                    >
                      {(user.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-800">{user.full_name || 'Anonymous'}</p>
                        {user.active_badge && <span className="text-base">{COSMETICS_LOOKUP[user.active_badge]?.icon}</span>}
                      </div>
                      {user.active_title && (
                        <p className="text-xs text-purple-600 font-semibold">{COSMETICS_LOOKUP[user.active_title]?.name}</p>
                      )}
                      <div className="flex gap-2 items-center mt-1 flex-wrap">
                        <span className="text-xs bg-blue-100 text-primary px-2 py-1 rounded">
                          📍 {NIGERIAN_UNIVERSITIES.find(u => u.code === user.university)?.name || user.university || 'No university'}
                        </span>
                        {user.department && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {user.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{getPointsForTimeframe(user).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rewards Info */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-purple-500 rounded-lg p-8 mt-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Leaderboard Rewards</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl mb-2">🥇</p>
              <h4 className="font-bold text-gray-800 mb-2">#1 - ₦5,000/month</h4>
              <p className="text-gray-600">Monthly exclusive reward for top performer</p>
            </div>
            <div className="text-center">
              <p className="text-4xl mb-2">🥈</p>
              <h4 className="font-bold text-gray-800 mb-2">#2 - ₦2,500/month</h4>
              <p className="text-gray-600">Second place monthly reward</p>
            </div>
            <div className="text-center">
              <p className="text-4xl mb-2">🥉</p>
              <h4 className="font-bold text-gray-800 mb-2">#3 - ₦1,000/month</h4>
              <p className="text-gray-600">Third place monthly reward</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

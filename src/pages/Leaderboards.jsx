import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function Leaderboards() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [leaderboards, setLeaderboards] = useState({
    points: [],
    weekly: [],
    referrals: []
  });
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('points');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        setUser(auth.currentUser);
      }
      await fetchLeaderboards();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const fetchLeaderboards = async () => {
    try {
      // Fetch all users for leaderboards
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('points', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map((doc, idx) => ({
        id: doc.id,
        ...doc.data(),
        rank: idx + 1
      }));

      setLeaderboards({
        points: users,
        weekly: [...users].sort((a, b) => (b.weeklyPoints || 0) - (a.weeklyPoints || 0)),
        referrals: [...users].sort((a, b) => (b.successful_referrals || 0) - (a.successful_referrals || 0))
      });

      // Find current user's rank
      const userRankInfo = users.find(u => u.id === auth.currentUser.uid);
      setUserRank(userRankInfo);
    } catch (err) {
      console.error('Error fetching leaderboards:', err);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRewardColor = (rank) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-500';
    if (rank === 2) return 'from-gray-400 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-500';
    return 'from-blue-400 to-blue-500';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const currentLeaderboard = leaderboards[activeTab];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary"
              >
                Dashboard
              </button>
              <div className="text-lg font-bold text-primary">
                ⭐ {userData?.points || 0} pts
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">🏆 Leaderboards</h1>
          <p className="text-purple-100">Compete with other students and climb the rankings!</p>
        </div>

        {/* Your Rank */}
        {userRank && (
          <div className={`mb-8 rounded-lg shadow-lg p-8 text-white text-center bg-gradient-to-r ${getRewardColor(userRank.rank)}`}>
            <p className="text-lg mb-2">Your Rank</p>
            <p className="text-5xl font-bold mb-4">{getMedalEmoji(userRank.rank)}</p>
            <p className="text-2xl font-bold">
              {userRank.rank === 1 && 'TOP OF THE LEADERBOARD! 🎉'}
              {userRank.rank <= 10 && userRank.rank !== 1 && `Top 10! Keep it up! 💪`}
              {userRank.rank <= 50 && userRank.rank > 10 && `Top 50! You're doing great! ⭐`}
              {userRank.rank > 50 && `Keep climbing! 🚀`}
            </p>
            <p className="text-lg mt-2">{userRank.points || 0} points</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: 'points', label: '⭐ All-Time Points', icon: '📊' },
            { id: 'weekly', label: '🔥 This Week', icon: '📈' },
            { id: 'referrals', label: '👥 Top Referrers', icon: '🤝' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-bold transition ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
            <div className="grid grid-cols-12 gap-4 font-bold">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">User</div>
              <div className="col-span-3">Points</div>
              <div className="col-span-3">Badge</div>
            </div>
          </div>

          {/* Rankings */}
          <div className="divide-y">
            {currentLeaderboard.map((leader, idx) => {
              const isCurrentUser = leader.id === auth.currentUser.uid;
              const badgeEmoji = leader.rank === 1 ? '👑' : leader.rank <= 10 ? '⭐' : '';

              return (
                <div
                  key={leader.id}
                  className={`p-6 ${isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Rank */}
                    <div className="col-span-1">
                      <span className="text-3xl font-bold">
                        {leader.rank <= 3 ? getMedalEmoji(leader.rank) : `#${leader.rank}`}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="col-span-5">
                      <div>
                        <p className="font-bold text-gray-800">
                          {leader.displayName || `User ${leader.id.slice(0, 5)}`}
                          {isCurrentUser && ' (You)'}
                        </p>
                        <p className="text-sm text-gray-600">{leader.university || 'Campus'}</p>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="col-span-3">
                      <p className="text-2xl font-bold text-primary">
                        {activeTab === 'points' && (leader.points || 0)}
                        {activeTab === 'weekly' && (leader.weeklyPoints || 0)}
                        {activeTab === 'referrals' && (leader.successful_referrals || 0)}
                      </p>
                      {activeTab === 'referrals' && (
                        <p className="text-xs text-gray-600">referrals</p>
                      )}
                    </div>

                    {/* Badge/Status */}
                    <div className="col-span-3 text-right">
                      {leader.rank === 1 && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                          🏆 Champion
                        </span>
                      )}
                      {leader.rank === 2 && (
                        <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">
                          🥈 Runner-up
                        </span>
                      )}
                      {leader.rank === 3 && (
                        <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                          🥉 Third
                        </span>
                      )}
                      {leader.rank <= 10 && leader.rank > 3 && (
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                          ⭐ Top 10
                        </span>
                      )}
                      {leader.rank <= 50 && leader.rank > 10 && (
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                          Top 50
                        </span>
                      )}
                      {badgeEmoji && <span className="text-2xl ml-2">{badgeEmoji}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rewards Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
            <p className="text-3xl mb-2">🥇</p>
            <p className="font-bold text-yellow-900">1st Place</p>
            <p className="text-yellow-700 mt-2">₦5,000 + 500 pts</p>
            <p className="text-sm text-yellow-600 mt-2">Weekly rewards reset every Sunday</p>
          </div>

          <div className="bg-gray-50 border-2 border-gray-400 rounded-lg p-6">
            <p className="text-3xl mb-2">🥈</p>
            <p className="font-bold text-gray-900">2nd Place</p>
            <p className="text-gray-700 mt-2">₦3,000 + 300 pts</p>
            <p className="text-sm text-gray-600 mt-2">Weekly rewards reset every Sunday</p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-6">
            <p className="text-3xl mb-2">🥉</p>
            <p className="font-bold text-orange-900">3rd Place</p>
            <p className="text-orange-700 mt-2">₦1,000 + 200 pts</p>
            <p className="text-sm text-orange-600 mt-2">Weekly rewards reset every Sunday</p>
          </div>
        </div>

        {/* How to Climb */}
        <div className="mt-12 bg-purple-50 border-l-4 border-purple-500 p-8 rounded">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">📈 How to Climb the Leaderboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl mb-2">🎡</p>
              <p className="font-bold text-purple-900 mb-2">Spin Wheel</p>
              <p className="text-purple-700">50-500 points per spin</p>
            </div>
            <div>
              <p className="text-3xl mb-2">📺</p>
              <p className="font-bold text-purple-900 mb-2">Watch Ads</p>
              <p className="text-purple-700">50-100 points per ad</p>
            </div>
            <div>
              <p className="text-3xl mb-2">📋</p>
              <p className="font-bold text-purple-900 mb-2">Daily Missions</p>
              <p className="text-purple-700">50-250 points per mission</p>
            </div>
            <div>
              <p className="text-3xl mb-2">👥</p>
              <p className="font-bold text-purple-900 mb-2">Referrals</p>
              <p className="text-purple-700">100+ points per referral</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

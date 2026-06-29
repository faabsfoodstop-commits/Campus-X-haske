import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          setUser(auth.currentUser);
          checkTodayCheckIn();
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const checkTodayCheckIn = () => {
    const today = new Date().toDateString();
    const lastCheckIn = localStorage.getItem('lastCheckIn');
    setCheckedInToday(lastCheckIn === today);
  };

  const handleCheckIn = async () => {
    try {
      const today = new Date().toDateString();
      const pointsEarned = 10;
      const userRef = doc(db, 'users', auth.currentUser.uid);

      await setDoc(userRef, {
        points: (userData?.points || 0) + pointsEarned,
      }, { merge: true });

      localStorage.setItem('lastCheckIn', today);
      setUserData((prev) => ({
        ...prev,
        points: (prev?.points || 0) + pointsEarned,
      }));
      setCheckedInToday(true);

      alert(`Check-in successful! You earned ${pointsEarned} points!`);
    } catch (err) {
      console.error('Error checking in:', err);
      alert(`Failed to check in: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate('/profile')}
                className="text-gray-600 hover:text-primary"
              >
                Profile
              </button>
              <button
                onClick={() => navigate('/wallet')}
                className="text-gray-600 hover:text-primary"
              >
                Wallet
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {user?.displayName || 'User'}!</h2>
          <p className="text-blue-100">{userData?.university || 'Campus'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Points Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-semibold mb-2">Your Points</h3>
            <p className="text-4xl font-bold text-primary">{userData?.points || 0}</p>
            <p className="text-gray-500 text-sm mt-2">Redeemable rewards</p>
          </div>

          {/* Wallet Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-semibold mb-2">Wallet Balance</h3>
            <p className="text-4xl font-bold text-primary">₦{userData?.wallet || 0}</p>
            <button
              onClick={() => navigate('/wallet')}
              className="text-primary hover:text-blue-600 text-sm mt-2 font-semibold"
            >
              View Wallet →
            </button>
          </div>

          {/* Referrals Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-semibold mb-2">Referral Code</h3>
            <p className="text-lg font-mono text-primary font-bold">
              {auth.currentUser?.uid?.substring(0, 8).toUpperCase()}
            </p>
            <p className="text-gray-500 text-sm mt-2">Share to earn bonus</p>
          </div>
        </div>

        {/* Daily Check-In */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Daily Check-In</h3>
          <p className="text-gray-600 mb-6">
            Check in daily to earn points and maintain your streak!
          </p>

          <button
            onClick={handleCheckIn}
            disabled={checkedInToday}
            className={`px-8 py-3 rounded-lg font-semibold text-white ${
              checkedInToday
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-blue-600'
            }`}
          >
            {checkedInToday ? '✓ Checked In Today' : 'Check In Now'}
          </button>
        </div>

        {/* Games & Activities */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Play & Earn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/spin-wheel')}>
              <h3 className="text-xl font-bold text-white mb-2">🎡 Lucky Spin</h3>
              <p className="text-yellow-50 mb-4">Spin daily for random rewards. Earn up to 500 points!</p>
              <p className="text-yellow-100 font-semibold">Free spins reset daily →</p>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/daily-missions')}>
              <h3 className="text-xl font-bold text-white mb-2">📋 Daily Missions</h3>
              <p className="text-blue-50 mb-4">Complete tasks and earn bonus points. Chain them for multipliers!</p>
              <p className="text-blue-100 font-semibold">Start missions →</p>
            </div>

            <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/trivia')}>
              <h3 className="text-xl font-bold text-white mb-2">🧠 Trivia Quiz</h3>
              <p className="text-purple-50 mb-4">Test your campus knowledge. Earn points for correct answers!</p>
              <p className="text-purple-100 font-semibold">Play trivia →</p>
            </div>

            <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/achievements')}>
              <h3 className="text-xl font-bold text-white mb-2">🏆 Achievements</h3>
              <p className="text-pink-50 mb-4">Unlock badges and special rewards as you progress!</p>
              <p className="text-pink-100 font-semibold">View achievements →</p>
            </div>
          </div>
        </div>

        {/* Earn More */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">💰 Earn More</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/video-ads')}>
              <h3 className="text-xl font-bold text-white mb-2">📺 Watch & Earn</h3>
              <p className="text-red-50 mb-4">Watch short video ads and earn 50-100 points per video!</p>
              <p className="text-red-100 font-semibold">Start watching →</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/instagram-follow')}>
              <h3 className="text-xl font-bold text-white mb-2">📱 Follow & Earn</h3>
              <p className="text-pink-50 mb-4">Follow brands on Instagram and earn instant points!</p>
              <p className="text-pink-100 font-semibold">Start following →</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/referrals')}>
              <h3 className="text-xl font-bold text-white mb-2">👑 Referrals</h3>
              <p className="text-green-50 mb-4">Invite friends and earn 100-250 points per referral!</p>
              <p className="text-green-100 font-semibold">Share your code →</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/leaderboards')}>
              <h3 className="text-xl font-bold text-white mb-2">🏆 Leaderboards</h3>
              <p className="text-purple-50 mb-4">Compete with others and win weekly prizes!</p>
              <p className="text-purple-100 font-semibold">View rankings →</p>
            </div>
          </div>
        </div>

        {/* Marketplace */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">🛍️ Rewards Marketplace</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/marketplace')}>
              <h3 className="text-xl font-bold text-white mb-2">💎 Explore Marketplace</h3>
              <p className="text-purple-50 mb-4">Browse rewards by tier level. Exchange points for airtime, data, and gift cards!</p>
              <div className="mb-3 text-2xl font-bold text-white">{userData?.points || 0} pts</div>
              <p className="text-purple-100 font-semibold">Shop now →</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Marketplace</h3>
            <p className="text-gray-600 mb-4">
              Browse and list items for sale on the campus marketplace.
            </p>
            <button className="text-primary hover:text-blue-600 font-semibold">
              Open Marketplace →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">P2P Transfers</h3>
            <p className="text-gray-600 mb-4">
              Send money to other students quickly and securely.
            </p>
            <button className="text-primary hover:text-blue-600 font-semibold">
              Send Money →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

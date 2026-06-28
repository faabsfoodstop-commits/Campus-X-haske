import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export default function DailyMissions() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [missions, setMissions] = useState([]);
  const [completedToday, setCompletedToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comboBonus, setComboBonus] = useState(0);
  const navigate = useNavigate();

  const availableMissions = [
    {
      id: 'checkin',
      name: 'Morning Check-In',
      description: 'Check in before 9 AM',
      reward: 50,
      difficulty: 'easy',
      icon: '🌅'
    },
    {
      id: 'video_ad',
      name: 'Watch an Ad',
      description: 'Watch 1 video ad',
      reward: 50,
      difficulty: 'easy',
      icon: '📺'
    },
    {
      id: 'instagram',
      name: 'Follow a Brand',
      description: 'Follow @haske_campus on Instagram',
      reward: 75,
      difficulty: 'easy',
      icon: '📱'
    },
    {
      id: 'profile',
      name: 'Complete Profile',
      description: 'Add university & course info',
      reward: 150,
      difficulty: 'medium',
      icon: '👤'
    },
    {
      id: 'invite',
      name: 'Invite Friends',
      description: 'Send referral to 2 friends',
      reward: 100,
      difficulty: 'medium',
      icon: '👫'
    },
    {
      id: 'explore',
      name: 'Explore Marketplace',
      description: 'Browse 3+ marketplace items',
      reward: 75,
      difficulty: 'medium',
      icon: '🛍️'
    },
    {
      id: 'share',
      name: 'Share & Earn',
      description: 'Share to WhatsApp & get 1 signup',
      reward: 250,
      difficulty: 'hard',
      icon: '📤'
    },
    {
      id: 'watch_videos',
      name: 'Watch 3 Videos',
      description: 'Complete 3 video ads today',
      reward: 200,
      difficulty: 'hard',
      icon: '🎬'
    }
  ];

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
      await checkDailyMissions();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const checkDailyMissions = async () => {
    try {
      const today = new Date().toDateString();
      const missionsQuery = query(
        collection(db, 'daily_missions'),
        where('userId', '==', auth.currentUser.uid),
        where('completedDate', '==', today)
      );

      const snapshot = await getDocs(missionsQuery);
      const completed = snapshot.docs.map(doc => doc.data().missionId);
      setCompletedToday(completed);

      // Calculate combo bonus
      const easyCount = availableMissions.filter(m => m.difficulty === 'easy' && completed.includes(m.id)).length;
      const mediumCount = availableMissions.filter(m => m.difficulty === 'medium' && completed.includes(m.id)).length;
      const allCompleted = completed.length === availableMissions.length;

      if (easyCount === 3) setComboBonus(prev => Math.max(prev, 50));
      if (mediumCount === 3) setComboBonus(prev => Math.max(prev, 100));
      if (allCompleted) setComboBonus(250);
    } catch (err) {
      console.error('Error checking missions:', err);
    }
  };

  const completeMission = async (mission) => {
    if (completedToday.includes(mission.id)) {
      alert('Already completed today!');
      return;
    }

    try {
      const today = new Date().toDateString();
      const totalReward = mission.reward + comboBonus;

      // Immediately update UI (optimistic update)
      setCompletedToday([...completedToday, mission.id]);
      setUserData(prev => ({
        ...prev,
        points: (prev?.points || 0) + totalReward
      }));

      // Update Firestore in background
      const userRef = doc(db, 'users', auth.currentUser.uid);

      // First ensure user document exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          points: totalReward,
          createdAt: new Date()
        });
      } else {
        // User exists, just update points
        await setDoc(userRef, {
          points: (userDoc.data().points || 0) + totalReward
        }, { merge: true });
      }

      // Add mission record to tracking collection
      await addDoc(collection(db, 'daily_missions'), {
        userId: auth.currentUser.uid,
        missionId: mission.id,
        missionName: mission.name,
        pointsEarned: mission.reward,
        comboBonus,
        completedDate: today,
        timestamp: new Date()
      });

      alert(`Mission completed! +${mission.reward} pts${comboBonus > 0 ? ` (+${comboBonus} bonus)` : ''}`);

      // Refresh combo bonus calculation
      await checkDailyMissions();
    } catch (err) {
      console.error('Error completing mission:', err);
      // Revert optimistic update on error
      setCompletedToday(completedToday.filter(id => id !== mission.id));
      setUserData(prev => ({
        ...prev,
        points: (prev?.points || 0) - mission.reward
      }));
      alert(`Failed to complete mission: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const easyMissions = availableMissions.filter(m => m.difficulty === 'easy');
  const mediumMissions = availableMissions.filter(m => m.difficulty === 'medium');
  const hardMissions = availableMissions.filter(m => m.difficulty === 'hard');

  const totalPotentialRewards = availableMissions.reduce((sum, m) => sum + m.reward, 0) + 250;

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
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">📋 Daily Missions</h1>
          <p className="text-blue-100 mb-4">Complete missions to earn points. Chain them for combo bonuses!</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-100">Completed Today</p>
              <p className="text-3xl font-bold">{completedToday.length}/8</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Potential Reward</p>
              <p className="text-3xl font-bold">+{totalPotentialRewards}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Combo Bonus</p>
              <p className="text-3xl font-bold text-yellow-300">{comboBonus > 0 ? '+' + comboBonus : 'None'}</p>
            </div>
          </div>
        </div>

        {/* Easy Missions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Easy (Quick Tasks)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {easyMissions.map(mission => (
              <div
                key={mission.id}
                className={`rounded-lg shadow p-6 transition ${
                  completedToday.includes(mission.id)
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-white hover:shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-4xl">{mission.icon}</span>
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    Easy
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{mission.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{mission.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">+{mission.reward}</span>
                  <button
                    onClick={() => completeMission(mission)}
                    disabled={completedToday.includes(mission.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      completedToday.includes(mission.id)
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-blue-600'
                    }`}
                  >
                    {completedToday.includes(mission.id) ? '✓ Done' : 'Start'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medium Missions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Medium (Main Tasks)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mediumMissions.map(mission => (
              <div
                key={mission.id}
                className={`rounded-lg shadow p-6 transition ${
                  completedToday.includes(mission.id)
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-white hover:shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-4xl">{mission.icon}</span>
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-800">
                    Medium
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{mission.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{mission.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">+{mission.reward}</span>
                  <button
                    onClick={() => completeMission(mission)}
                    disabled={completedToday.includes(mission.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      completedToday.includes(mission.id)
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-blue-600'
                    }`}
                  >
                    {completedToday.includes(mission.id) ? '✓ Done' : 'Start'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hard Missions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Hard (Challenge Tasks)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hardMissions.map(mission => (
              <div
                key={mission.id}
                className={`rounded-lg shadow p-6 transition ${
                  completedToday.includes(mission.id)
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-white hover:shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-4xl">{mission.icon}</span>
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-red-100 text-red-800">
                    Hard
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{mission.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{mission.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">+{mission.reward}</span>
                  <button
                    onClick={() => completeMission(mission)}
                    disabled={completedToday.includes(mission.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      completedToday.includes(mission.id)
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-blue-600'
                    }`}
                  >
                    {completedToday.includes(mission.id) ? '✓ Done' : 'Start'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Combo Bonuses */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🔥 Combo Bonuses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Complete All Easy</p>
              <p className="text-3xl font-bold text-yellow-600">+50 pts</p>
              <p className="text-xs text-gray-500 mt-2">{3 - Math.min(3, easyMissions.filter(m => completedToday.includes(m.id)).length)} more</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Complete All Medium</p>
              <p className="text-3xl font-bold text-orange-600">+100 pts</p>
              <p className="text-xs text-gray-500 mt-2">{3 - Math.min(3, mediumMissions.filter(m => completedToday.includes(m.id)).length)} more</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Complete All Missions</p>
              <p className="text-3xl font-bold text-red-600">+250 pts</p>
              <p className="text-xs text-gray-500 mt-2">{8 - completedToday.length} more</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

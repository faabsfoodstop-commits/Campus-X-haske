import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, getDocs } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { ToastContext } from '../context/ToastContext';
import Button from '../components/Button';
import { IconArrowLeft, IconRocket, IconCheckmark } from '../components/Icons';

export default function SponsoredMissions() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const [missions, setMissions] = useState([]);
  const [userData, setUserData] = useState(null);
  const [completedMissions, setCompletedMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const sponsoredMissions = [
    {
      id: 'brand_001',
      brand: 'Coca-Cola Campus',
      title: 'Share Your Campus Experience',
      description: 'Post about your campus life using #CocaColaCampus',
      reward: 1000,
      difficulty: 'medium',
      duration: '24 hours',
      participants: 1247,
      image: '🎉',
      proof: 'Social media post'
    },
    {
      id: 'brand_002',
      brand: 'SnapChat',
      title: 'Filter Challenge',
      description: 'Try SnapChat filters and share 3 stories using #SnapChallenge',
      reward: 750,
      difficulty: 'easy',
      duration: '48 hours',
      participants: 892,
      image: '📸',
      proof: 'Social media posts'
    },
    {
      id: 'brand_003',
      brand: 'MTN Campus',
      title: 'Network Connection Survey',
      description: 'Complete MTN connectivity survey (2 minutes)',
      reward: 500,
      difficulty: 'easy',
      duration: '7 days',
      participants: 2341,
      image: '📱',
      proof: 'Survey completion'
    },
    {
      id: 'brand_004',
      brand: 'Zenith Bank',
      title: 'Campus Finance Learning',
      description: 'Watch finance education videos and answer 5 questions',
      reward: 2000,
      difficulty: 'hard',
      duration: '14 days',
      participants: 523,
      image: '💰',
      proof: 'Quiz score 80%+'
    },
    {
      id: 'brand_005',
      brand: 'Airbnb Campus',
      title: 'Travel Stories',
      description: 'Share your most memorable campus travel experience',
      reward: 1500,
      difficulty: 'medium',
      duration: '10 days',
      participants: 634,
      image: '✈️',
      proof: 'Photo + story submission'
    },
    {
      id: 'brand_006',
      brand: 'Stanbic IBTC',
      title: 'Tech Innovation Survey',
      description: 'Share your ideas on financial tech innovation',
      reward: 1200,
      difficulty: 'medium',
      duration: '7 days',
      participants: 445,
      image: '💡',
      proof: 'Survey submission'
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }

      const missionsQuery = query(collection(db, 'sponsored_mission_completions'));
      const snapshot = await getDocs(missionsQuery);
      const completed = snapshot.docs
        .filter(doc => doc.data().userId === auth.currentUser.uid)
        .map(doc => doc.data().missionId);

      setCompletedMissions(completed);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleClaimMission = async (mission) => {
    if (completedMissions.includes(mission.id)) {
      addToast('Already completed this mission!', 'warning');
      return;
    }

    try {
      const functions = getFunctions();
      const claimSponsoredMission = httpsCallable(functions, 'claimSponsoredMission');

      const result = await claimSponsoredMission({
        missionId: mission.id,
        brand: mission.brand,
        baseReward: mission.reward
      });

      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to claim mission');
      }

      const pointsAwarded = result.data.pointsAwarded;

      setUserData(prev => ({
        ...prev,
        points: (prev?.points || 0) + pointsAwarded,
      }));

      setCompletedMissions([...completedMissions, mission.id]);
      addToast(`Mission claimed! +${pointsAwarded} points 🎉`, 'success');
    } catch (err) {
      console.error('Claim error:', err);
      addToast(err.message || 'Failed to claim mission. Try again.', 'error');
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <IconArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <IconRocket className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Sponsored Missions</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-primary">
              {userData?.points || 0} pts
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">Earn from Top Brands</h2>
          <p className="text-purple-100">Participate in brand missions and earn amazing rewards. Brands pay us, you get the benefits!</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-5xl mb-2">🌍</p>
            <h3 className="font-bold text-gray-800 mb-2">6 Active Brands</h3>
            <p className="text-gray-600">Top companies partnering with us</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-5xl mb-2">💰</p>
            <h3 className="font-bold text-gray-800 mb-2">₦750 - ₦2,000</h3>
            <p className="text-gray-600">Reward range per mission</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-5xl mb-2">👥</p>
            <h3 className="font-bold text-gray-800 mb-2">6,082 Participants</h3>
            <p className="text-gray-600">Community engaged</p>
          </div>
        </div>

        {/* Missions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsoredMissions.map(mission => (
            <div
              key={mission.id}
              className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
                completedMissions.includes(mission.id)
                  ? 'ring-2 ring-green-500'
                  : ''
              }`}
            >
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 text-center h-24 flex items-center justify-center text-6xl">
                {mission.image}
              </div>

              <div className="p-6">
                <p className="text-xs font-bold text-primary uppercase mb-1">{mission.brand}</p>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{mission.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{mission.description}</p>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Difficulty:</span>
                    <span className="font-semibold capitalize">{mission.difficulty}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Duration:</span>
                    <span className="font-semibold">{mission.duration}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Proof:</span>
                    <span className="font-semibold">{mission.proof}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Participants:</span>
                    <span className="font-semibold">{mission.participants.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <p className="text-gray-600 text-xs mb-2">Reward</p>
                  <p className="text-3xl font-bold text-primary">{mission.reward}</p>
                  <p className="text-gray-600 text-xs">points</p>
                </div>

                {completedMissions.includes(mission.id) ? (
                  <div className="bg-green-500 text-white px-4 py-2 rounded font-semibold text-sm text-center flex items-center justify-center gap-2">
                    <IconCheckmark className="w-4 h-4" />
                    Completed
                  </div>
                ) : (
                  <Button
                    onClick={() => handleClaimMission(mission)}
                    variant="primary"
                    size="sm"
                    fullWidth
                  >
                    Participate Now
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow p-8 mt-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">How Sponsored Missions Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                1
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Browse Missions</h4>
              <p className="text-gray-600 text-sm">Select from active brand missions that interest you</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                2
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Complete Task</h4>
              <p className="text-gray-600 text-sm">Follow the brand's instructions (share, survey, watch, etc)</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                3
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Submit Proof</h4>
              <p className="text-gray-600 text-sm">Provide evidence (screenshot, link, or form submission)</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                4
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Earn Points</h4>
              <p className="text-gray-600 text-sm">Get approved and receive your reward instantly</p>
            </div>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-l-4 border-green-500 rounded-lg p-8 mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-3">Why Brands Love HASKE</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Direct access to engaged student audience</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Proof of participation and engagement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Cost-effective marketing (you only pay for results)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Build loyalty with campus communities</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

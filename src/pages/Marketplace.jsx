import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export default function Marketplace() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [notification, setNotification] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedPhone, setSelectedPhone] = useState('');
  const navigate = useNavigate();

  const MIN_POINTS = 1000;

  const rewards = [
    // Level 1: 0-1000 pts
    { id: 'airtime_500', name: '₦500 Airtime', points: 500, type: 'airtime', amount: 500, provider: 'MTN/Airtel/Glo', level: 1, tier: 'Starter', purchases: 247, featured: true },
    { id: 'data_1gb', name: '1GB Mobile Data', points: 1500, type: 'data', amount: 1, unit: 'GB', provider: 'MTN/Airtel/Glo', level: 1, tier: 'Starter', purchases: 156, featured: false },

    // Level 2: 1000-5000 pts
    { id: 'airtime_1000', name: '₦1,000 Airtime', points: 1000, type: 'airtime', amount: 1000, provider: 'MTN/Airtel/Glo', level: 2, tier: 'Bronze', purchases: 342, featured: true },
    { id: 'airtime_2500', name: '₦2,500 Airtime', points: 2500, type: 'airtime', amount: 2500, provider: 'MTN/Airtel/Glo', level: 2, tier: 'Bronze', purchases: 89, featured: false },
    { id: 'data_5gb', name: '5GB Mobile Data', points: 6000, type: 'data', amount: 5, unit: 'GB', provider: 'MTN/Airtel/Glo', level: 2, tier: 'Bronze', purchases: 124, featured: true },
    { id: 'gift_card_500', name: '₦500 Gift Card', points: 500, type: 'giftcard', amount: 500, provider: 'Amazon/iTunes', level: 2, tier: 'Bronze', purchases: 78, featured: false },
    { id: 'gift_card_1000', name: '₦1,000 Gift Card', points: 1000, type: 'giftcard', amount: 1000, provider: 'Amazon/iTunes', level: 2, tier: 'Bronze', purchases: 156, featured: false },

    // Level 3: 5000-10000 pts (VIP)
    { id: 'airtime_5000', name: '₦5,000 Premium Airtime', points: 5000, type: 'airtime', amount: 5000, provider: 'MTN/Airtel/Glo', level: 3, tier: 'Silver', purchases: 67, featured: true },
    { id: 'data_10gb', name: '10GB Premium Data', points: 9000, type: 'data', amount: 10, unit: 'GB', provider: 'MTN/Airtel/Glo', level: 3, tier: 'Silver', purchases: 45, featured: true },
    { id: 'gift_card_2500', name: '₦2,500 Premium Gift Card', points: 2500, type: 'giftcard', amount: 2500, provider: 'Amazon/iTunes/Gaming', level: 3, tier: 'Silver', purchases: 32, featured: false },

    // Level 4: 10000+ pts (Elite)
    { id: 'airtime_10000', name: '₦10,000 Elite Airtime', points: 10000, type: 'airtime', amount: 10000, provider: 'MTN/Airtel/Glo', level: 4, tier: 'Gold', purchases: 23, featured: true },
    { id: 'data_20gb', name: '20GB Elite Data Bundle', points: 15000, type: 'data', amount: 20, unit: 'GB', provider: 'MTN/Airtel/Glo', level: 4, tier: 'Gold', purchases: 12, featured: true },
    { id: 'gift_card_5000', name: '₦5,000 Elite Gift Card', points: 5000, type: 'giftcard', amount: 5000, provider: 'Amazon/iTunes/Gaming/Apple', level: 4, tier: 'Gold', purchases: 8, featured: false },
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
      await fetchPurchases();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('userId', '==', auth.currentUser.uid)
      );

      const snapshot = await getDocs(purchasesQuery);
      const data = snapshot.docs.map(doc => doc.data()).sort((a, b) => b.timestamp - a.timestamp);
      setPurchases(data);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }
  };

  const calculateLevel = (points) => {
    if (points >= 10000) return { level: 4, tier: 'Gold', color: 'from-yellow-400 to-yellow-600' };
    if (points >= 5000) return { level: 3, tier: 'Silver', color: 'from-gray-400 to-gray-600' };
    if (points >= 1000) return { level: 2, tier: 'Bronze', color: 'from-orange-400 to-orange-600' };
    return { level: 1, tier: 'Starter', color: 'from-blue-400 to-blue-600' };
  };

  const currentPoints = userData?.points || 0;
  const userLevel = calculateLevel(currentPoints);
  const pointsToNextLevel = userLevel.level === 4 ? 0 : [1000, 5000, 10000][userLevel.level];
  const pointsToMinimum = Math.max(0, MIN_POINTS - currentPoints);
  const canRedeem = currentPoints >= MIN_POINTS;

  const filteredRewards = rewards.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'featured') return r.featured;
    if (filter === 'unlocked') return r.level <= userLevel.level;
    if (filter === 'locked') return r.level > userLevel.level;
    return true;
  });

  const purchaseReward = async (reward) => {
    if (!selectedPhone.trim()) {
      setNotification({ type: 'error', message: 'Please enter your phone number' });
      return;
    }

    if (currentPoints < reward.points) {
      setNotification({ type: 'error', message: `Not enough points. Need ${reward.points}, have ${currentPoints}` });
      return;
    }

    if (!canRedeem) {
      setNotification({ type: 'error', message: `Minimum ${MIN_POINTS} points required` });
      return;
    }

    try {
      // Optimistic update
      const newPoints = currentPoints - reward.points;
      setUserData(prev => ({ ...prev, points: newPoints }));

      // Create purchase record
      await addDoc(collection(db, 'purchases'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        rewardId: reward.id,
        rewardName: reward.name,
        rewardType: reward.type,
        pointsSpent: reward.points,
        phoneNumber: selectedPhone,
        amount: reward.amount,
        unit: reward.unit || '',
        provider: reward.provider,
        status: 'pending',
        timestamp: new Date(),
        completedAt: null
      });

      // Update user points in Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        await setDoc(userRef, {
          points: (userDoc.data().points || 0) - reward.points
        }, { merge: true });
      }

      setNotification({ type: 'success', message: `✓ Purchase confirmed! ${reward.name} will be delivered within 24 hours.` });
      setSelectedPhone('');
      await fetchPurchases();

      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error purchasing reward:', err);
      await fetchUserData();
      setNotification({ type: 'error', message: `Error: ${err.message}` });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4 items-center">
              <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-primary">
                Dashboard
              </button>
              <div className="text-lg font-bold text-primary">⭐ {currentPoints} pts</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* User Level Card */}
        <div className={`bg-gradient-to-r ${userLevel.color} text-white rounded-lg shadow-lg p-8 mb-8`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-90 mb-2">Your Level</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-bold">{userLevel.level}</p>
                <p className="text-2xl">{userLevel.tier}</p>
              </div>
            </div>

            <div>
              <p className="text-sm opacity-90 mb-2">Current Points</p>
              <p className="text-4xl font-bold">{currentPoints}</p>
              <p className="text-xs opacity-75 mt-1">
                {pointsToMinimum > 0 ? `${pointsToMinimum} to unlock rewards` : 'Rewards unlocked!'}
              </p>
            </div>

            <div>
              <p className="text-sm opacity-90 mb-2">Next Level</p>
              {userLevel.level < 4 ? (
                <>
                  <p className="text-4xl font-bold">{pointsToNextLevel}</p>
                  <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mt-3">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${(currentPoints / pointsToNextLevel) * 100}%` }}
                    ></div>
                  </div>
                </>
              ) : (
                <p className="text-2xl font-bold">🏆 MAX LEVEL</p>
              )}
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-8 p-4 rounded-lg text-white text-center ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Phone Number Input */}
        {canRedeem && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number (where to receive rewards)
            </label>
            <input
              type="tel"
              placeholder="e.g., 08012345678"
              value={selectedPhone}
              onChange={(e) => setSelectedPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-gray-500 mt-2">Rewards will be sent to this number within 24 hours</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: 'all', label: '🎁 All Rewards' },
            { id: 'featured', label: '🔥 Featured' },
            { id: 'unlocked', label: '✅ Unlocked' },
            { id: 'locked', label: '🔒 Locked' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                filter === tab.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredRewards.map(reward => {
            const isAffordable = currentPoints >= reward.points;
            const isUnlocked = reward.level <= userLevel.level;
            const isLocked = !isUnlocked;

            return (
              <div
                key={reward.id}
                className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
                  isLocked ? 'opacity-60 bg-gray-200' : isAffordable ? 'bg-white border-2 border-green-300' : 'bg-white'
                }`}
              >
                {/* Header */}
                <div className={`p-6 text-white ${
                  reward.type === 'airtime' ? 'bg-gradient-to-r from-pink-500 to-red-500' :
                  reward.type === 'data' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                  'bg-gradient-to-r from-purple-500 to-indigo-500'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-4xl">
                      {reward.type === 'airtime' && '📱'}
                      {reward.type === 'data' && '📡'}
                      {reward.type === 'giftcard' && '🎁'}
                    </div>
                    {reward.featured && <span className="text-xs bg-yellow-300 text-yellow-900 px-2 py-1 rounded-full font-bold">⭐ Featured</span>}
                  </div>
                  <h3 className="text-xl font-bold">{reward.name}</h3>
                  <p className="text-sm opacity-90">{reward.provider}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Tier & Purchases */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                      {reward.tier}
                    </span>
                    <span className="text-xs text-gray-600">{reward.purchases} purchases</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Cost</p>
                    <p className="text-3xl font-bold text-primary">{reward.points} pts</p>
                  </div>

                  {/* Status */}
                  {isLocked ? (
                    <div className="p-3 bg-red-50 rounded-lg mb-4">
                      <p className="text-red-800 text-sm font-semibold">🔒 Level {reward.level} Required</p>
                      <p className="text-xs text-red-700 mt-1">
                        Need {Math.max(0, [1000, 5000, 10000][reward.level - 1] - currentPoints)} more points
                      </p>
                    </div>
                  ) : !isAffordable ? (
                    <div className="p-3 bg-yellow-50 rounded-lg mb-4">
                      <p className="text-yellow-800 text-sm font-semibold">⏳ Need {reward.points - currentPoints} more pts</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 rounded-lg mb-4">
                      <p className="text-green-800 text-sm font-semibold">✅ You can afford this!</p>
                    </div>
                  )}

                  {/* Button */}
                  <button
                    onClick={() => purchaseReward(reward)}
                    disabled={isLocked || !isAffordable || !canRedeem}
                    className={`w-full font-bold py-3 rounded-lg transition ${
                      isLocked || !isAffordable || !canRedeem
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {isLocked ? '🔒 Locked' : !isAffordable ? '💰 Not Enough' : '🛒 Buy Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Purchase History */}
        {purchases.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📦 Your Purchases</h2>
            <div className="space-y-3">
              {purchases.slice(0, 5).map((purchase, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded border-l-4 border-blue-500">
                  <div>
                    <p className="font-semibold text-gray-800">{purchase.rewardName}</p>
                    <p className="text-sm text-gray-600">Phone: {purchase.phoneNumber}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(purchase.timestamp.toDate?.() || purchase.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">-{purchase.pointsSpent} pts</p>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      purchase.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {purchase.status === 'completed' ? '✓ Delivered' : '⏳ Processing'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-12 rounded">
          <p className="text-blue-800 font-bold mb-3">📚 How to Use HASKE Marketplace</p>
          <ul className="text-blue-700 space-y-2 text-sm">
            <li>✓ Earn points by completing missions, watching ads, and following brands</li>
            <li>✓ Reach Level 1 (1,000 pts) to unlock purchases</li>
            <li>✓ Each level unlocks premium rewards (Level 2, 3, 4)</li>
            <li>✓ Select rewards, enter phone number, and purchase</li>
            <li>✓ Rewards delivered within 24 hours</li>
            <li>✓ Your points are deducted immediately</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

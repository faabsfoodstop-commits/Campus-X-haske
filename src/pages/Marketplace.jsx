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
  const [selectedProvider, setSelectedProvider] = useState('mtn');
  const navigate = useNavigate();

  const MIN_POINTS = 1000;

  // Telecom providers with different rates and limits
  const providers = {
    mtn: { name: 'MTN', color: 'from-yellow-400 to-yellow-600', rate: 'Standard', pointRate: 4, dailyLimit: 2000 },
    airtel: { name: 'Airtel', color: 'from-red-500 to-red-600', rate: '10% Better', pointRate: 3.6, dailyLimit: 2500, badge: '⭐ Best Rate' },
    glo: { name: 'Glo', color: 'from-green-400 to-green-600', rate: 'Premium', pointRate: 4.4, dailyLimit: 1500, badge: '💎 Premium' },
    nine: { name: '9mobile', color: 'from-blue-400 to-blue-600', rate: '5% Better', pointRate: 3.8, dailyLimit: 2000 }
  };

  // Calculate points needed for each amount based on provider rate
  const getPointsNeeded = (nairaAmount, providerKey) => {
    const provider = providers[providerKey];
    return Math.ceil((nairaAmount * provider.pointRate) / 100);
  };

  const rewards = [
    // Level 1: Airtime (base points for MTN) - Fixed: Now economically rational to buy points
    { id: 'airtime_500', name: '₦500 Airtime', basePts: 1000, type: 'airtime', amount: 500, naira: 500, level: 1, tier: 'Starter', purchases: 247, featured: true, telecom: true },
    { id: 'airtime_1000', name: '₦1,000 Airtime', basePts: 2000, type: 'airtime', amount: 1000, naira: 1000, level: 2, tier: 'Bronze', purchases: 342, featured: true, telecom: true },
    { id: 'airtime_2500', name: '₦2,500 Airtime', basePts: 5000, type: 'airtime', amount: 2500, naira: 2500, level: 2, tier: 'Bronze', purchases: 89, featured: false, telecom: true },
    { id: 'airtime_5000', name: '₦5,000 Airtime', basePts: 10000, type: 'airtime', amount: 5000, naira: 5000, level: 3, tier: 'Silver', purchases: 67, featured: true, telecom: true },
    { id: 'airtime_10000', name: '₦10,000 Elite Airtime', basePts: 20000, type: 'airtime', amount: 10000, naira: 10000, level: 4, tier: 'Gold', purchases: 23, featured: true, telecom: true },

    // Level 1-2: Data (fixed, not provider-based)
    { id: 'data_1gb', name: '1GB Mobile Data', basePts: 1500, type: 'data', amount: 1, unit: 'GB', level: 1, tier: 'Starter', purchases: 156, featured: false, telecom: true },
    { id: 'data_5gb', name: '5GB Mobile Data', basePts: 4000, type: 'data', amount: 5, unit: 'GB', level: 2, tier: 'Bronze', purchases: 124, featured: true, telecom: true },
    { id: 'data_10gb', name: '10GB Premium Data', basePts: 7500, type: 'data', amount: 10, unit: 'GB', level: 3, tier: 'Silver', purchases: 45, featured: true, telecom: true },
    { id: 'data_20gb', name: '20GB Elite Data', basePts: 14000, type: 'data', amount: 20, unit: 'GB', level: 4, tier: 'Gold', purchases: 12, featured: true, telecom: true },

    // Gift Cards (not provider-based, fixed points)
    { id: 'gift_card_500', name: '₦500 Gift Card', basePts: 1250, type: 'giftcard', amount: 500, level: 2, tier: 'Bronze', purchases: 78, featured: false },
    { id: 'gift_card_1000', name: '₦1,000 Gift Card', basePts: 2500, type: 'giftcard', amount: 1000, level: 2, tier: 'Bronze', purchases: 156, featured: false },
    { id: 'gift_card_2500', name: '₦2,500 Gift Card', basePts: 6000, type: 'giftcard', amount: 2500, level: 3, tier: 'Silver', purchases: 32, featured: false },
    { id: 'gift_card_5000', name: '₦5,000 Gift Card', basePts: 12500, type: 'giftcard', amount: 5000, level: 4, tier: 'Gold', purchases: 8, featured: false },
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

    // Calculate points needed based on selected provider (for airtime/data only)
    let pointsNeeded = reward.basePts;
    let selectedProviderName = providers[selectedProvider].name;

    if (reward.telecom && reward.type === 'airtime') {
      pointsNeeded = getPointsNeeded(reward.naira, selectedProvider);
    } else if (reward.type === 'data') {
      pointsNeeded = reward.basePts; // Data uses fixed points
      selectedProviderName = 'Any Provider';
    }

    if (currentPoints < pointsNeeded) {
      setNotification({ type: 'error', message: `Not enough points. Need ${pointsNeeded}, have ${currentPoints}` });
      return;
    }

    if (!canRedeem) {
      setNotification({ type: 'error', message: `Minimum ${MIN_POINTS} points required` });
      return;
    }

    try {
      // Optimistic update
      const newPoints = currentPoints - pointsNeeded;
      setUserData(prev => ({ ...prev, points: newPoints }));

      // Create purchase record
      await addDoc(collection(db, 'purchases'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        rewardId: reward.id,
        rewardName: reward.name,
        rewardType: reward.type,
        pointsSpent: pointsNeeded,
        phoneNumber: selectedPhone,
        amount: reward.amount,
        unit: reward.unit || '',
        provider: selectedProviderName,
        telecomProvider: selectedProvider,
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

        {/* Provider Selector (for Airtime) */}
        {rewards.some(r => r.type === 'airtime' && r.level <= userLevel.level) && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow">
            <h3 className="font-bold text-gray-800 mb-4">📱 Choose Airtime Provider (Different Rates)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(providers).map(([key, provider]) => (
                <button
                  key={key}
                  onClick={() => setSelectedProvider(key)}
                  className={`p-4 rounded-lg font-semibold transition border-2 ${
                    selectedProvider === key
                      ? `bg-gradient-to-r ${provider.color} text-white border-white shadow-lg`
                      : 'bg-gray-50 border-gray-300 text-gray-800 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">{provider.name}</div>
                  <div className="text-xs">{provider.rate}</div>
                  {provider.badge && <div className="text-xs mt-1">{provider.badge}</div>}
                  <div className="text-xs mt-1">Limit: ₦{provider.dailyLimit}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredRewards.map(reward => {
            // Calculate points needed based on provider
            let pointsNeeded = reward.basePts;
            let priceInfo = `${reward.basePts} pts`;

            if (reward.telecom && reward.type === 'airtime') {
              pointsNeeded = getPointsNeeded(reward.naira, selectedProvider);
              const providerData = providers[selectedProvider];
              const savings = reward.basePts - pointsNeeded;
              priceInfo = `${pointsNeeded} pts`;
              if (savings > 0) priceInfo += ` (Save ${savings}!)`;
            }

            const isAffordable = currentPoints >= pointsNeeded;
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
                  reward.type === 'airtime' ? `bg-gradient-to-r ${providers[selectedProvider].color}` :
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
                  {reward.type === 'airtime' && <p className="text-sm opacity-90">{providers[selectedProvider].name}</p>}
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
                    <p className="text-gray-600 text-sm">Cost (with {reward.type === 'airtime' ? providers[selectedProvider].name : 'current provider'})</p>
                    <p className="text-3xl font-bold text-primary">{priceInfo}</p>
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
                      <p className="text-yellow-800 text-sm font-semibold">⏳ Need {pointsNeeded - currentPoints} more pts</p>
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
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-12 rounded mb-8">
          <p className="text-blue-800 font-bold mb-3">📚 How to Use HASKE Marketplace</p>
          <ul className="text-blue-700 space-y-2 text-sm">
            <li>✓ Earn points by completing missions, watching ads, and following brands</li>
            <li>✓ Reach Level 1 (1,000 pts) to unlock purchases</li>
            <li>✓ Each level unlocks premium rewards (Level 2, 3, 4)</li>
            <li>✓ Select an airtime provider - different rates available!</li>
            <li>✓ Enter phone number and select your reward</li>
            <li>✓ Rewards delivered within 24 hours</li>
            <li>✓ Your points are deducted based on provider rate</li>
          </ul>
        </div>

        {/* Provider Info */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 p-6 rounded">
          <p className="text-orange-800 font-bold mb-3">💡 Smart Provider Rates</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-orange-700">
            <div>
              <p className="font-semibold">📊 How Rates Work:</p>
              <ul className="mt-2 space-y-1">
                <li>• <strong>MTN:</strong> Standard rates (Baseline)</li>
                <li>• <strong>Airtel:</strong> 10% better rates (Recommended!)</li>
                <li>• <strong>9mobile:</strong> 5% better rates</li>
                <li>• <strong>Glo:</strong> Premium pricing (25% more)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">🎯 Example (₦500 Airtime):</p>
              <ul className="mt-2 space-y-1">
                <li>• MTN: 2,000 pts</li>
                <li>• Airtel: 1,800 pts (Save 200!)</li>
                <li>• 9mobile: 1,900 pts (Save 100)</li>
                <li>• Glo: 2,200 pts (Premium)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

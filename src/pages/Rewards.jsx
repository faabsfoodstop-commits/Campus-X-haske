import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export default function Rewards() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState([]);
  const [notification, setNotification] = useState(null);
  const [selectedPhone, setSelectedPhone] = useState('');
  const navigate = useNavigate();

  const MIN_REDEMPTION = 1000; // Minimum 1000 points to redeem

  const rewardOptions = [
    { id: 'airtime_500', name: '₦500 Airtime', points: 500, type: 'airtime', amount: 500, provider: 'MTN/Airtel/Glo' },
    { id: 'airtime_1000', name: '₦1,000 Airtime', points: 1000, type: 'airtime', amount: 1000, provider: 'MTN/Airtel/Glo' },
    { id: 'airtime_2500', name: '₦2,500 Airtime', points: 2500, type: 'airtime', amount: 2500, provider: 'MTN/Airtel/Glo' },
    { id: 'airtime_5000', name: '₦5,000 Airtime', points: 5000, type: 'airtime', amount: 5000, provider: 'MTN/Airtel/Glo' },
    { id: 'data_1gb', name: '1GB Mobile Data', points: 1500, type: 'data', amount: 1, unit: 'GB', provider: 'MTN/Airtel/Glo' },
    { id: 'data_5gb', name: '5GB Mobile Data', points: 6000, type: 'data', amount: 5, unit: 'GB', provider: 'MTN/Airtel/Glo' },
    { id: 'gift_card_500', name: '₦500 Gift Card', points: 500, type: 'giftcard', amount: 500, provider: 'Amazon/iTunes' },
    { id: 'gift_card_1000', name: '₦1,000 Gift Card', points: 1000, type: 'giftcard', amount: 1000, provider: 'Amazon/iTunes' },
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
      await fetchRedemptions();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    try {
      const redemptionsQuery = query(
        collection(db, 'redemptions'),
        where('userId', '==', auth.currentUser.uid)
      );

      const snapshot = await getDocs(redemptionsQuery);
      const data = snapshot.docs.map(doc => doc.data()).sort((a, b) => b.timestamp - a.timestamp);
      setRedemptions(data);
    } catch (err) {
      console.error('Error fetching redemptions:', err);
    }
  };

  const redeemReward = async (reward) => {
    if (!selectedPhone.trim()) {
      setNotification({
        type: 'error',
        message: 'Please enter your phone number'
      });
      return;
    }

    const currentPoints = userData?.points || 0;

    if (currentPoints < MIN_REDEMPTION) {
      setNotification({
        type: 'error',
        message: `Minimum ${MIN_REDEMPTION} points required to redeem. You have ${currentPoints} points. Need ${MIN_REDEMPTION - currentPoints} more!`
      });
      return;
    }

    if (currentPoints < reward.points) {
      setNotification({
        type: 'error',
        message: `Not enough points. You need ${reward.points} but have ${currentPoints}`
      });
      return;
    }

    try {
      // Optimistic update
      const newPoints = (userData?.points || 0) - reward.points;
      setUserData(prev => ({
        ...prev,
        points: newPoints
      }));

      // Create redemption request
      const redemptionDoc = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        rewardId: reward.id,
        rewardName: reward.name,
        rewardType: reward.type,
        pointsRedeemed: reward.points,
        phoneNumber: selectedPhone,
        amount: reward.amount,
        unit: reward.unit || '',
        provider: reward.provider,
        status: 'pending',
        timestamp: new Date(),
        completedAt: null
      };

      await addDoc(collection(db, 'redemptions'), redemptionDoc);

      // Update user points in Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        await setDoc(userRef, {
          points: (userDoc.data().points || 0) - reward.points
        }, { merge: true });
      }

      setNotification({
        type: 'success',
        message: `✓ Redemption request submitted! ${reward.name} will be sent to ${selectedPhone} within 24 hours.`
      });

      setSelectedPhone('');
      await fetchRedemptions();

      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error redeeming reward:', err);
      // Revert optimistic update
      await fetchUserData();
      setNotification({
        type: 'error',
        message: `Error: ${err.message}`
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const currentPoints = userData?.points || 0;
  const pointsToMinimum = Math.max(0, MIN_REDEMPTION - currentPoints);
  const canRedeem = currentPoints >= MIN_REDEMPTION;

  const earnableRewards = rewardOptions.filter(r => currentPoints >= r.points && canRedeem);
  const unavailableRewards = rewardOptions.filter(r => currentPoints < r.points || !canRedeem);

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
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">💰 Redeem Rewards</h1>
          <p className="text-purple-100 mb-4">Convert your points into real airtime, data, and gift cards!</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Your Points</p>
              <p className="text-3xl font-bold">{userData?.points || 0}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Rewards Available</p>
              <p className="text-3xl font-bold">{earnableRewards.length}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Pending Redemptions</p>
              <p className="text-3xl font-bold">{redemptions.filter(r => r.status === 'pending').length}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Completed</p>
              <p className="text-3xl font-bold">{redemptions.filter(r => r.status === 'completed').length}</p>
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

        {/* Minimum Redemption Requirement */}
        {!canRedeem && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-yellow-800">🎯 Minimum Redemption Requirement</h3>
              <span className="text-sm font-semibold text-yellow-800">{currentPoints}/{MIN_REDEMPTION} pts</span>
            </div>

            <div className="w-full bg-yellow-200 rounded-full h-4 mb-3 overflow-hidden">
              <div
                className="bg-yellow-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(currentPoints / MIN_REDEMPTION) * 100}%` }}
              ></div>
            </div>

            <p className="text-yellow-800 font-semibold mb-2">
              {pointsToMinimum > 0 ? (
                <>🚀 Keep earning! You need <span className="text-lg">{pointsToMinimum}</span> more points to unlock redemptions</>
              ) : (
                <>✅ You're eligible to redeem rewards now!</>
              )}
            </p>
            <p className="text-sm text-yellow-700">
              This ensures you're an active user before redeeming rewards. Complete more missions, watch ads, and follow brands!
            </p>
          </div>
        )}

        {canRedeem && (
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 mb-8">
            <p className="text-green-800 font-bold text-lg">✅ You've unlocked redemptions! Pick a reward below.</p>
          </div>
        )}

        {/* Phone Number Input */}
        <div className={`rounded-lg shadow p-6 mb-8 ${canRedeem ? 'bg-white' : 'bg-gray-100 opacity-50'}`}>
          <label className={`block text-sm font-semibold mb-2 ${canRedeem ? 'text-gray-700' : 'text-gray-500'}`}>
            Phone Number (where to send rewards)
          </label>
          <input
            type="tel"
            placeholder="e.g., 08012345678"
            value={selectedPhone}
            onChange={(e) => setSelectedPhone(e.target.value)}
            disabled={!canRedeem}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none ${
              canRedeem
                ? 'border-gray-300 focus:border-primary'
                : 'border-gray-300 bg-gray-50 cursor-not-allowed'
            }`}
          />
          <p className={`text-xs mt-2 ${canRedeem ? 'text-gray-500' : 'text-gray-400'}`}>
            {canRedeem
              ? 'Make sure to enter the correct number - rewards go to this phone number'
              : 'Reach the minimum threshold to enable this'
            }
          </p>
        </div>

        {/* Available Rewards */}
        {canRedeem && earnableRewards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Rewards You Can Redeem</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {earnableRewards.map(reward => (
                <div
                  key={reward.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-green-200 hover:shadow-xl transition"
                >
                  <div className="bg-gradient-to-r from-green-400 to-green-500 p-6 text-white">
                    <div className="text-4xl mb-2">
                      {reward.type === 'airtime' && '📱'}
                      {reward.type === 'data' && '📡'}
                      {reward.type === 'giftcard' && '🎁'}
                    </div>
                    <h3 className="text-xl font-bold">{reward.name}</h3>
                    <p className="text-sm text-green-100">{reward.provider}</p>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">Cost</span>
                      <span className="text-2xl font-bold text-green-600">{reward.points} pts</span>
                    </div>

                    <button
                      onClick={() => redeemReward(reward)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition"
                    >
                      Redeem Now ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unavailable Rewards */}
        {unavailableRewards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🔒 Locked Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unavailableRewards.map(reward => (
                <div
                  key={reward.id}
                  className="bg-gray-100 rounded-lg shadow overflow-hidden border-2 border-gray-300 opacity-60"
                >
                  <div className="bg-gray-400 p-6 text-white">
                    <div className="text-4xl mb-2 opacity-50">
                      {reward.type === 'airtime' && '📱'}
                      {reward.type === 'data' && '📡'}
                      {reward.type === 'giftcard' && '🎁'}
                    </div>
                    <h3 className="text-xl font-bold">{reward.name}</h3>
                    <p className="text-sm text-gray-300">{reward.provider}</p>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">Cost</span>
                      <span className="text-2xl font-bold text-gray-400">{reward.points} pts</span>
                    </div>

                    <div className="text-center text-sm text-gray-600">
                      <p className="font-semibold">Need {reward.points - (userData?.points || 0)} more points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redemption History */}
        {redemptions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Redemption History</h2>
            <div className="space-y-3">
              {redemptions.map((redemption, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded border-l-4" style={{
                  borderLeftColor: redemption.status === 'completed' ? '#10b981' : redemption.status === 'pending' ? '#f59e0b' : '#ef4444'
                }}>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{redemption.rewardName}</p>
                    <p className="text-sm text-gray-600">Phone: {redemption.phoneNumber}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(redemption.timestamp.toDate?.() || redemption.timestamp).toLocaleDateString()} {new Date(redemption.timestamp.toDate?.() || redemption.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">-{redemption.pointsRedeemed} pts</p>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      redemption.status === 'completed' ? 'bg-green-100 text-green-800' :
                      redemption.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {redemption.status === 'completed' ? '✓ Sent' :
                       redemption.status === 'pending' ? '⏳ Processing' :
                       '✗ Rejected'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-12 rounded">
          <p className="text-blue-800 font-semibold">💡 How Redemptions Work</p>
          <ul className="text-blue-700 mt-3 space-y-1">
            <li>✓ Enter your phone number above</li>
            <li>✓ Select a reward you can afford</li>
            <li>✓ Points are deducted immediately</li>
            <li>✓ Reward is processed within 24 hours</li>
            <li>✓ Airtime/Data sent to your phone automatically</li>
            <li>✓ Track all redemptions in history below</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { ToastContext } from '../context/ToastContext';
import Button from '../components/Button';
import { IconArrowLeft, IconDiamond, IconStar, IconTrophy, IconRocket, IconParty } from '../components/Icons';

export default function CosmeticsShop() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('frames');
  const [purchasedItems, setPurchasedItems] = useState([]);

  const cosmetics = {
    frames: [
      { id: 'frame_gold', name: 'Gold Frame', price: 150, description: 'Prestigious gold border', icon: '✨', color: 'from-yellow-400 to-yellow-600' },
      { id: 'frame_diamond', name: 'Diamond Frame', price: 300, description: 'Ultra rare diamond border', icon: '💎', color: 'from-cyan-400 to-cyan-600' },
      { id: 'frame_rainbow', name: 'Rainbow Frame', price: 250, description: 'Colorful gradient border', icon: '🌈', color: 'from-pink-400 to-purple-600' },
      { id: 'frame_neon', name: 'Neon Frame', price: 200, description: 'Glowing neon border', icon: '⚡', color: 'from-green-400 to-green-600' },
    ],
    badges: [
      { id: 'badge_og', name: 'OG Badge', price: 100, description: 'Original member badge', icon: '🔱', color: 'from-purple-500 to-purple-600' },
      { id: 'badge_legend', name: 'Legend Badge', price: 200, description: 'Top 10% leaderboard', icon: '👑', color: 'from-yellow-500 to-yellow-600' },
      { id: 'badge_streak', name: '7-Day Streak', price: 50, description: 'Unlocked at 7 day streak', icon: '🔥', color: 'from-red-500 to-red-600' },
      { id: 'badge_collector', name: 'Collector Badge', price: 175, description: 'Purchased 10 cosmetics', icon: '🎨', color: 'from-indigo-500 to-indigo-600' },
    ],
    titles: [
      { id: 'title_grinder', name: 'The Grinder', price: 80, description: 'Complete 100 tasks', icon: '⚙️', color: 'from-gray-500 to-gray-700' },
      { id: 'title_scholar', name: 'The Scholar', price: 120, description: 'Score 90%+ on trivia', icon: '📚', color: 'from-blue-500 to-blue-600' },
      { id: 'title_socialite', name: 'The Socialite', price: 150, description: 'Refer 20+ friends', icon: '🤝', color: 'from-pink-500 to-pink-600' },
      { id: 'title_legend', name: 'Legend', price: 500, description: 'Rank #1 on leaderboard', icon: '🏆', color: 'from-yellow-500 to-yellow-600' },
    ],
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        setPurchasedItems(userDoc.data().cosmeticsPurchased || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const handlePurchase = async (cosmetic) => {
    if (!auth.currentUser) {
      addToast('Please log in first', 'error');
      return;
    }

    if ((userData?.points || 0) < cosmetic.price) {
      addToast(`You need ${cosmetic.price - (userData?.points || 0)} more points`, 'error');
      return;
    }

    if (purchasedItems.includes(cosmetic.id)) {
      addToast('You already own this item!', 'warning');
      return;
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const newPoints = (userData?.points || 0) - cosmetic.price;
      const newPurchased = [...purchasedItems, cosmetic.id];

      await updateDoc(userRef, {
        points: newPoints,
        cosmeticsPurchased: newPurchased,
      });

      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        type: 'cosmetic_purchase',
        amount: cosmetic.price,
        item: cosmetic.id,
        itemName: cosmetic.name,
        timestamp: new Date(),
      });

      setUserData(prev => ({
        ...prev,
        points: newPoints,
      }));
      setPurchasedItems(newPurchased);
      addToast(`${cosmetic.name} purchased! ✨`, 'success');
    } catch (err) {
      console.error('Purchase error:', err);
      addToast('Purchase failed. Try again.', 'error');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const allCosmetics = [...cosmetics.frames, ...cosmetics.badges, ...cosmetics.titles];
  const displayItems = cosmetics[selectedTab];

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
                <IconDiamond className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Cosmetics Shop</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-primary">
              <IconStar className="w-5 h-5" />
              {userData?.points || 0} pts
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">Customize Your Profile</h2>
          <p className="text-purple-100">Show off your style with exclusive cosmetics. Cost ₦0 in real money!</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          {['frames', 'badges', 'titles'].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-3 font-semibold capitalize transition ${
                selectedTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayItems.map(cosmetic => (
            <div
              key={cosmetic.id}
              className={`rounded-lg shadow overflow-hidden transition transform hover:scale-105 ${
                purchasedItems.includes(cosmetic.id)
                  ? 'ring-2 ring-green-500'
                  : ''
              }`}
            >
              <div className={`bg-gradient-to-br ${cosmetic.color} p-6 text-white text-center`}>
                <div className="text-5xl mb-2">{cosmetic.icon}</div>
                <h3 className="text-xl font-bold mb-2">{cosmetic.name}</h3>
                <p className="text-sm opacity-90 mb-4">{cosmetic.description}</p>

                {purchasedItems.includes(cosmetic.id) ? (
                  <div className="bg-green-500 text-white px-4 py-2 rounded font-semibold text-sm">
                    ✓ Owned
                  </div>
                ) : (
                  <Button
                    onClick={() => handlePurchase(cosmetic)}
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="bg-white text-gray-800 hover:bg-gray-100 font-bold"
                  >
                    {cosmetic.price} pts
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-lg shadow p-8 mt-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Why Cosmetics?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <IconStar className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Zero Real Cost</h4>
              <p className="text-gray-600">Buy with points earned for free. No naira required!</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-3">
                <IconDiamond className="w-8 h-8 text-pink-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Show Status</h4>
              <p className="text-gray-600">Display your badges and achievements to stand out on leaderboards.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <IconRocket className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Collect Them All</h4>
              <p className="text-gray-600">Unlock exclusive cosmetics by completing special challenges.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

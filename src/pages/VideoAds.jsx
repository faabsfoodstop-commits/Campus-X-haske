import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export default function VideoAds() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [adsWatched, setAdsWatched] = useState(0);
  const [loading, setLoading] = useState(true);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adResult, setAdResult] = useState(null);
  const [todayStats, setTodayStats] = useState({ watched: 0, earned: 0 });
  const navigate = useNavigate();

  const videoAds = [
    {
      id: 'ad_1',
      title: 'Learn JavaScript in 30 Seconds',
      duration: 30,
      network: 'YouTube',
      reward: 50
    },
    {
      id: 'ad_2',
      title: 'Best Pizza in Lagos',
      duration: 45,
      network: 'Brand Ad',
      reward: 50
    },
    {
      id: 'ad_3',
      title: 'New Fashion Collection',
      duration: 40,
      network: 'E-commerce',
      reward: 50
    },
    {
      id: 'ad_4',
      title: 'Mobile App Launch',
      duration: 35,
      network: 'Tech',
      reward: 50
    },
    {
      id: 'ad_5',
      title: 'Fitness Training Guide',
      duration: 50,
      network: 'Lifestyle',
      reward: 75
    },
    {
      id: 'ad_6',
      title: 'Learn Python Basics',
      duration: 60,
      network: 'Education',
      reward: 100
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
      await checkDailyAdStats();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const checkDailyAdStats = async () => {
    try {
      const today = new Date().toDateString();
      const adQuery = query(
        collection(db, 'video_ads_watched'),
        where('userId', '==', auth.currentUser.uid),
        where('watchedDate', '==', today)
      );

      const snapshot = await getDocs(adQuery);
      const watched = snapshot.size;
      const earned = snapshot.docs.reduce((sum, doc) => sum + doc.data().reward, 0);

      setAdsWatched(watched);
      setTodayStats({ watched, earned });
    } catch (err) {
      console.error('Error checking ad stats:', err);
    }
  };

  const watchAd = async (ad) => {
    if (watchingAd) return;

    setWatchingAd(true);
    setAdResult(null);

    // Simulate ad playing
    await new Promise(resolve => setTimeout(resolve, ad.duration * 1000));

    try {
      const today = new Date().toDateString();

      // Immediately update UI (optimistic)
      setUserData(prev => ({
        ...prev,
        points: (prev?.points || 0) + ad.reward
      }));

      setAdResult({
        success: true,
        reward: ad.reward,
        title: ad.title
      });

      // Update Firestore in background
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          points: ad.reward,
          createdAt: new Date(),
          lastAdWatched: new Date()
        });
      } else {
        await setDoc(userRef, {
          points: (userDoc.data().points || 0) + ad.reward,
          lastAdWatched: new Date()
        }, { merge: true });
      }

      // Record ad watched
      await addDoc(collection(db, 'video_ads_watched'), {
        userId: auth.currentUser.uid,
        adId: ad.id,
        adTitle: ad.title,
        reward: ad.reward,
        watchedDate: today,
        timestamp: new Date(),
        duration: ad.duration
      });

      await checkDailyAdStats();

      // Auto-hide result after 2 seconds
      setTimeout(() => setAdResult(null), 2000);
    } catch (err) {
      console.error('Error recording ad:', err);
      setAdResult({
        success: false,
        error: `Failed: ${err.message}`
      });
    }

    setWatchingAd(false);
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
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">📺 Watch & Earn</h1>
          <p className="text-red-100">Watch short video ads and earn points instantly!</p>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Ads Watched Today</p>
            <p className="text-4xl font-bold text-primary">{todayStats.watched}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Points Earned Today</p>
            <p className="text-4xl font-bold text-primary">+{todayStats.earned}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Potential (6/day)</p>
            <p className="text-4xl font-bold text-primary">₦300/day</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
          <p className="text-blue-800 font-semibold">💡 How it works:</p>
          <ul className="text-blue-700 mt-2 space-y-1">
            <li>✓ Watch a short video ad (30-60 seconds)</li>
            <li>✓ Earn 50-100 points per ad</li>
            <li>✓ Watch up to 6 ads per day</li>
            <li>✓ Ads reset daily at midnight</li>
          </ul>
        </div>

        {/* Result Notification */}
        {adResult && (
          <div className={`mb-8 p-6 rounded-lg text-white text-center ${adResult.success ? 'bg-green-500' : 'bg-red-500'}`}>
            {adResult.success ? (
              <>
                <p className="text-2xl font-bold">✓ Ad Watched!</p>
                <p className="text-lg">You earned +{adResult.reward} points for "{adResult.title}"</p>
              </>
            ) : (
              <p className="text-xl font-bold">{adResult.error}</p>
            )}
          </div>
        )}

        {/* Video Ads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoAds.map((ad, idx) => (
            <div key={ad.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
              {/* Thumbnail Placeholder */}
              <div className="bg-gradient-to-br from-gray-300 to-gray-400 h-40 flex items-center justify-center">
                <div className="text-5xl">📹</div>
              </div>

              {/* Ad Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{ad.title}</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold">{ad.duration}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Network</span>
                    <span className="font-semibold">{ad.network}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reward</span>
                    <span className="font-bold text-primary">+{ad.reward} pts</span>
                  </div>
                </div>

                {/* Progress Bar (simulated) */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="bg-primary h-2 rounded-full" style={{ width: watchingAd ? '0%' : '100%' }}></div>
                </div>

                {/* Watch Button */}
                <button
                  onClick={() => watchAd(ad)}
                  disabled={watchingAd}
                  className={`w-full font-bold py-3 rounded-lg transition text-white ${
                    watchingAd
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  }`}
                >
                  {watchingAd ? '⏳ PLAYING...' : 'Watch Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Limit Info */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mt-12 rounded">
          <p className="text-yellow-800 font-semibold">⏰ Daily Limit</p>
          <p className="text-yellow-700 mt-2">
            You can watch up to 6 ads per day. Currently watched: {todayStats.watched}/6
          </p>
          <div className="w-full bg-yellow-200 rounded-full h-3 mt-3">
            <div
              className="bg-yellow-600 h-3 rounded-full transition-all"
              style={{ width: `${(todayStats.watched / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Revenue Info */}
        <div className="bg-green-50 border-l-4 border-green-500 p-6 mt-8 rounded">
          <p className="text-green-800 font-semibold">💰 Revenue Share</p>
          <p className="text-green-700 mt-2">
            At 100 users watching 3 ads/day = ₦45,000/month in video ad revenue for the platform. You earn points while ads generate revenue! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}

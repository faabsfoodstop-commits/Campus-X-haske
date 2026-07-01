import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VideoAds() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [adsWatched, setAdsWatched] = useState(0);
  const [loading, setLoading] = useState(true);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adResult, setAdResult] = useState(null);
  const [todayStats, setTodayStats] = useState({ watched: 0, earned: 0 });
  const [activeAdModal, setActiveAdModal] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [videoPlayed, setVideoPlayed] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const navigate = useNavigate();

  const videoAds = [
    {
      id: 'ad_1',
      title: 'Learn JavaScript in 30 Seconds',
      duration: 30,
      network: 'YouTube',
      reward: 250,
      youtubeId: 'PFmuCDHWQH8'
    },
    {
      id: 'ad_2',
      title: 'Best Pizza in Lagos',
      duration: 45,
      network: 'Brand Ad',
      reward: 250,
      youtubeId: 'jNQXAC9IVRw'
    },
    {
      id: 'ad_3',
      title: 'New Fashion Collection',
      duration: 40,
      network: 'E-commerce',
      reward: 250,
      youtubeId: 'dQw4w9WgXcQ'
    },
    {
      id: 'ad_4',
      title: 'Mobile App Launch',
      duration: 35,
      network: 'Tech',
      reward: 250,
      youtubeId: 'aqz-KE-bpKQ'
    },
    {
      id: 'ad_5',
      title: 'Fitness Training Guide',
      duration: 50,
      network: 'Lifestyle',
      reward: 375,
      youtubeId: '9bZkp7q19f0'
    },
    {
      id: 'ad_6',
      title: 'Learn Python Basics',
      duration: 60,
      network: 'Education',
      reward: 500,
      youtubeId: '_uQrJ0TkSAc'
    }
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!activeAdModal) {
      setVideoPlayed(false);
      setVideoError(null);
      return;
    }

    setTimeRemaining(activeAdModal.duration);
    setVideoPlayed(false);
    setVideoError(null);

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-detect if video was watched by checking if timer completed
          // (user didn't close early)
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAdModal]);

  const handleVideoIframeLoad = () => {
    setVideoPlayed(true);
  };

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (user) {
        setUserData(user);
        setUser(session.user);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date().toDateString();
      const { data: ads, error } = await supabase
        .from('video_ads_watched')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('watched_date', today);

      if (error) throw error;

      const watched = ads.length;
      const earned = ads.reduce((sum, ad) => sum + (ad.points_earned || 0), 0);

      setAdsWatched(watched);
      setTodayStats({ watched, earned });
    } catch (err) {
      console.error('Error checking ad stats:', err);
    }
  };

  const watchAd = (ad) => {
    setActiveAdModal(ad);
    setAdResult(null);
  };

  const completeVideoWatch = async (ad) => {
    if (watchingAd) return;

    // Anti-cheat: Verify video was actually played
    if (!videoPlayed) {
      setVideoError('⚠️ Please play the video to completion before claiming reward');
      setTimeout(() => setVideoError(null), 3000);
      return;
    }

    if (timeRemaining > 0) {
      setVideoError('⏱️ Please watch the entire video before claiming');
      setTimeout(() => setVideoError(null), 3000);
      return;
    }

    setWatchingAd(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const finalPoints = ad.reward;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          points: (userData?.points || 0) + finalPoints
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setUserData(prev => ({
        ...prev,
        points: (prev?.points || 0) + finalPoints
      }));

      // Record ad watched for analytics
      const { error: insertError } = await supabase
        .from('video_ads_watched')
        .insert({
          user_id: session.user.id,
          ad_id: ad.id,
          ad_title: ad.title,
          points_earned: finalPoints,
          watched_date: new Date().toDateString(),
          duration: ad.duration
        });

      if (insertError) throw insertError;

      setAdResult({
        success: true,
        reward: finalPoints,
        title: ad.title,
        message: `You earned ${finalPoints} points!`
      });

      await checkDailyAdStats();

      // Close modal after result
      setActiveAdModal(null);

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
    return <LoadingSpinner size="lg" />;
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
                onClick={() => navigate('/daily-missions')}
                className="text-gray-600 hover:text-primary text-sm font-semibold"
              >
                ← Missions
              </button>
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

      {/* Video Player Modal */}
      {activeAdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="relative">
              {/* YouTube Embed */}
              <div className="relative w-full aspect-video bg-gray-900 flex items-center justify-center">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${activeAdModal.youtubeId}?autoplay=1`}
                  title={activeAdModal.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0"
                  onLoad={handleVideoIframeLoad}
                />
              </div>

              {/* Anti-Cheat Warning */}
              {videoError && (
                <div className="bg-red-900 border-t-2 border-red-500 p-3 text-center">
                  <p className="text-red-200 font-semibold text-sm">{videoError}</p>
                </div>
              )}

              {/* Countdown Timer */}
              <div className={`p-4 text-center ${videoError ? 'bg-gray-800' : 'bg-gray-900'}`}>
                <p className="text-white text-sm mb-2">
                  {timeRemaining > 0 ? (
                    <>
                      Watch video to earn <span className="font-bold text-green-400">+{activeAdModal.reward} pts</span>
                      <br />
                      <span className="text-2xl font-bold text-yellow-400">{timeRemaining}s</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-green-400">✓ Video completed!</span>
                  )}
                </p>

                {/* Video Status Indicator */}
                <div className="flex justify-center gap-2 mb-3 text-xs">
                  <span className={`px-2 py-1 rounded ${videoPlayed ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                    {videoPlayed ? '✓ Video Loaded' : '○ Loading...'}
                  </span>
                  <span className={`px-2 py-1 rounded ${timeRemaining === 0 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                    {timeRemaining === 0 ? '✓ Time Complete' : `○ ${timeRemaining}s left`}
                  </span>
                </div>

                {timeRemaining === 0 ? (
                  <button
                    onClick={() => completeVideoWatch(activeAdModal)}
                    disabled={watchingAd}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
                  >
                    {watchingAd ? '⏳ Processing...' : '✓ Claim Reward'}
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveAdModal(null)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
                  >
                    Close (won't count)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Notification */}
      {adResult && (
        <div className={`fixed bottom-4 right-4 p-6 rounded-lg text-white text-center ${adResult.success ? 'bg-green-500' : 'bg-red-500'}`}>
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
    </div>
  );
}

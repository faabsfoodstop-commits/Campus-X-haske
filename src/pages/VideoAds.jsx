import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { supabase } from '../config/supabase';

const VIDEO_ADS = [
  {
    id: 'ad_1',
    title: 'VPN App Pro',
    description: 'Secure your internet connection',
    duration: 30,
    points: 5,
    thumbnail: '🔒',
  },
  {
    id: 'ad_2',
    title: 'Game: Puzzle Quest',
    description: 'Solve mind-bending puzzles',
    duration: 15,
    points: 3,
    thumbnail: '🎮',
  },
  {
    id: 'ad_3',
    title: 'Fitness Tracker',
    description: 'Track your daily steps',
    duration: 30,
    points: 5,
    thumbnail: '⚽',
  },
  {
    id: 'ad_4',
    title: 'Dating App',
    description: 'Meet new people',
    duration: 45,
    points: 7,
    thumbnail: '💕',
  },
  {
    id: 'ad_5',
    title: 'Trading Platform',
    description: 'Invest in stocks',
    duration: 30,
    points: 8,
    thumbnail: '📈',
  },
];

export default function VideoAds() {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [ads, setAds] = useState([]);
  const [watchedToday, setWatchedToday] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalEarnedToday, setTotalEarnedToday] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadWatchedAds();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  const loadWatchedAds = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('video_ads_watched')
        .select('ad_id, points_earned')
        .eq('user_id', user.id)
        .eq('watch_date', today);

      const watched = new Set(data?.map(w => w.ad_id) || []);
      setWatchedToday(watched);

      const totalPoints = data?.reduce((sum, w) => sum + (w.points_earned || 0), 0) || 0;
      setTotalEarnedToday(totalPoints);

      setAds(VIDEO_ADS);
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAd = (ad) => {
    if (watchedToday.has(ad.id)) {
      addToast('Already watched this ad today', 'warning');
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setSelectedAd(ad);
    setPlaying(true);
    setTimeRemaining(ad.duration);

    // Simulate video playback
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          completeAd(ad);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelAd = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSelectedAd(null);
    setPlaying(false);
    setTimeRemaining(0);
  };

  const completeAd = async (ad) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlaying(false);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Insert ad watch record
      const { error: insertError } = await supabase
        .from('video_ads_watched')
        .insert([{
          user_id: user.id,
          ad_id: ad.id,
          watch_date: today,
          watched_at: new Date().toISOString(),
          points_earned: ad.points,
        }]);

      if (insertError) throw insertError;

      // Award points
      const newPoints = (profile?.points || 0) + ad.points;
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: 'video_watched',
          amount: ad.points,
          description: `Watched ad: ${ad.title}`,
          metadata: { ad_id: ad.id, duration: ad.duration },
        }]);

      // Log activity
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          action: 'video_watched',
          description: `Watched ad (${ad.duration}s) - ${ad.title} (+${ad.points})`,
        }]);

      addToast(`+${ad.points} points for watching!`, 'success');

      // Update state
      setWatchedToday(prev => new Set([...prev, ad.id]));
      setTotalEarnedToday(prev => prev + ad.points);
      setSelectedAd(null);

      // Refresh profile to sync points balance
      await refreshProfile();
    } catch (error) {
      addToast(error.message || 'Failed to complete ad', 'error');
      setSelectedAd(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading ads...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Watch Ads & Earn</h1>
        <p className="text-gray-600 mb-6">Watch short videos to earn points</p>

        {/* Video Player Modal */}
        {selectedAd && playing && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
              <button
                onClick={handleCancelAd}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
                title="Cancel video"
              >
                ✕
              </button>
              <div className="bg-gray-900 rounded-lg h-64 flex items-center justify-center mb-4 relative">
                <span className="text-6xl">{selectedAd.thumbnail}</span>
                <div className="absolute bottom-4 right-4 bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">
                  {timeRemaining}s
                </div>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">{selectedAd.title}</h2>
              <p className="text-sm text-gray-600 mb-4">{selectedAd.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((selectedAd.duration - timeRemaining) / selectedAd.duration) * 100}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mb-4">
                Please watch the entire video to earn +{selectedAd.points} points
              </p>
              <p className="text-center text-xs text-gray-500">
                Time remaining: {timeRemaining}s
              </p>
            </div>
          </div>
        )}

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Ads Watched Today</p>
            <p className="text-3xl font-bold">{watchedToday.size} / {VIDEO_ADS.length}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Earnings Today</p>
            <p className="text-3xl font-bold">+{totalEarnedToday}</p>
            <p className="text-xs opacity-75 mt-2">points</p>
          </div>
        </div>

        {/* Ads Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ads.map(ad => {
            const isWatched = watchedToday.has(ad.id);

            return (
              <div
                key={ad.id}
                className={`rounded-lg border-2 transition ${
                  isWatched
                    ? 'bg-gray-100 border-gray-300 opacity-60'
                    : 'bg-white border-blue-300 hover:border-blue-500'
                }`}
              >
                <div className="p-4">
                  {/* Thumbnail */}
                  <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-4 text-6xl">
                    {ad.thumbnail}
                  </div>

                  {/* Content */}
                  <h3 className="font-bold text-gray-800 mb-1">{ad.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{ad.description}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      ⏱️ {ad.duration}s
                    </span>
                    <span className="text-lg font-bold text-green-600">+{ad.points}</span>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handlePlayAd(ad)}
                    disabled={isWatched}
                    className={`w-full py-2 rounded-lg font-semibold transition ${
                      isWatched
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isWatched ? '✓ Watched' : 'Watch Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
          <p className="text-purple-900 text-sm">
            <span className="font-bold">💡 Tip:</span> Each ad can only be watched once per day. Ads refresh daily at 12:00 AM.
          </p>
        </div>

        {watchedToday.size === VIDEO_ADS.length && (
          <div className="mt-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-green-900 text-sm">
              🎉 <span className="font-bold">All ads watched!</span> Come back tomorrow for more.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

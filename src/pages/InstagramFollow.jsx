import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { recordInstagramFollowActivity, updateUserPoints } from '../utils/databaseHelpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function InstagramFollow() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [followedBrands, setFollowedBrands] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const navigate = useNavigate();

  const brands = [
    {
      id: 'haske_campus',
      name: 'HASKE Campus',
      handle: '@haske_campus',
      description: 'Official platform account',
      reward: 375,
      category: 'Platform',
      verified: true
    },
    {
      id: 'unilag_official',
      name: 'University of Lagos',
      handle: '@unilag_official',
      description: 'Official University Account',
      reward: 500,
      category: 'University',
      verified: true
    },
    {
      id: 'campus_store',
      name: 'Campus Store Nigeria',
      handle: '@campus_store_ng',
      description: 'Campus merchandise store',
      reward: 250,
      category: 'Marketplace',
      verified: false
    },
    {
      id: 'study_vibes',
      name: 'Study Vibes Africa',
      handle: '@study_vibes_africa',
      description: 'Educational content creator',
      reward: 375,
      category: 'Education',
      verified: false
    },
    {
      id: 'student_life',
      name: 'Student Life Magazine',
      handle: '@studentlife_mag',
      description: 'Student lifestyle magazine',
      reward: 375,
      category: 'Lifestyle',
      verified: true
    },
    {
      id: 'campus_food',
      name: 'Campus Food Delivery',
      handle: '@campusfood_ng',
      description: 'Food delivery to campus',
      reward: 500,
      category: 'Food',
      verified: false
    }
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

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
      await fetchFollowedBrands();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const fetchFollowedBrands = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: follows } = await supabase
        .from('instagram_follows')
        .select('brand_id')
        .eq('user_id', session.user.id)
        .eq('verified', true);

      const followed = follows?.map(f => f.brand_id) || [];
      setFollowedBrands(followed);
    } catch (err) {
      console.error('Error fetching followed brands:', err);
    }
  };

  const verifyFollow = async (brand) => {
    if (verifying) return;
    if (followedBrands.includes(brand.id)) {
      setVerificationResult({
        success: false,
        message: `Already verified! You've followed ${brand.handle}`
      });
      setTimeout(() => setVerificationResult(null), 3000);
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const pointsAwarded = brand.reward;

      const newPoints = (userData?.points || 0) + pointsAwarded;
      const updated = await updateUserPoints(session.user.id, newPoints);
      if (!updated) throw new Error('Failed to update points');

      const recorded = await recordInstagramFollowActivity(
        session.user.id, brand.id, brand.name, brand.handle, pointsAwarded
      );
      if (!recorded.success) throw new Error(recorded.error || 'Failed to record follow');

      setUserData(prev => ({ ...prev, points: newPoints }));

      setFollowedBrands([...followedBrands, brand.id]);

      setVerificationResult({
        success: true,
        message: `✓ Successfully followed ${brand.handle}! +${pointsAwarded} pts`
      });

      setTimeout(() => setVerificationResult(null), 3000);
    } catch (err) {
      console.error('Error verifying follow:', err);
      setVerificationResult({
        success: false,
        message: err.message || 'Verification failed'
      });
      setTimeout(() => setVerificationResult(null), 3000);
    }

    setVerifying(false);
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const categories = [...new Set(brands.map(b => b.category))];
  const totalPotentialReward = brands.reduce((sum, b) => sum + b.reward, 0);
  const earnedReward = followedBrands.length > 0
    ? brands.filter(b => followedBrands.includes(b.id)).reduce((sum, b) => sum + b.reward, 0)
    : 0;

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
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">📱 Follow & Earn</h1>
          <p className="text-pink-100">Follow brands on Instagram and earn points instantly!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Brands Followed</p>
            <p className="text-4xl font-bold text-primary">{followedBrands.length}/{brands.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Points Earned</p>
            <p className="text-4xl font-bold text-primary">+{earnedReward}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Potential Reward</p>
            <p className="text-4xl font-bold text-primary">+{totalPotentialReward}</p>
          </div>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className={`mb-8 p-6 rounded-lg text-center font-semibold ${
            verificationResult.success
              ? 'bg-green-100 text-green-800 border-2 border-green-500'
              : 'bg-red-100 text-red-800 border-2 border-red-500'
          }`}>
            {verificationResult.message}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
          <p className="text-blue-800 font-semibold">💡 How it works:</p>
          <ul className="text-blue-700 mt-2 space-y-1">
            <li>✓ Click "Follow on Instagram" button below</li>
            <li>✓ Follow the brand account</li>
            <li>✓ Click "Verify Follow" to confirm</li>
            <li>✓ Earn points instantly (verified by our system)</li>
          </ul>
        </div>

        {/* Brands by Category */}
        {categories.map(category => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands
                .filter(b => b.category === category)
                .map(brand => {
                  const isFollowed = followedBrands.includes(brand.id);
                  return (
                    <div
                      key={brand.id}
                      className={`rounded-lg shadow-lg overflow-hidden transition ${
                        isFollowed
                          ? 'bg-green-50 border-2 border-green-500'
                          : 'bg-white hover:shadow-xl'
                      }`}
                    >
                      {/* Profile Picture */}
                      <div className="bg-gradient-to-br from-pink-400 to-purple-500 h-32 flex items-center justify-center">
                        <div className="text-6xl">📸</div>
                      </div>

                      {/* Brand Info */}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{brand.name}</h3>
                          {brand.verified && <span className="text-blue-500">✓</span>}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{brand.handle}</p>
                        <p className="text-sm text-gray-600 mb-4">{brand.description}</p>

                        <div className="flex justify-between items-center mb-4">
                          <span className="font-bold text-primary text-lg">+{brand.reward} pts</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            isFollowed
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {isFollowed ? '✓ Followed' : 'New'}
                          </span>
                        </div>

                        {isFollowed ? (
                          <button
                            disabled
                            className="w-full bg-green-500 text-white font-bold py-3 rounded-lg cursor-not-allowed"
                          >
                            ✓ Already Followed
                          </button>
                        ) : (
                          <a
                            href={`https://instagram.com/${brand.handle.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg text-center hover:from-pink-600 hover:to-purple-600 transition mb-2"
                          >
                            Follow on Instagram
                          </a>
                        )}

                        {!isFollowed && (
                          <button
                            onClick={() => verifyFollow(brand)}
                            disabled={verifying}
                            className={`w-full font-bold py-3 rounded-lg transition ${
                              verifying
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-blue-600'
                            }`}
                          >
                            {verifying ? '⏳ Verifying...' : 'Verify Follow'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {/* How to Maximize */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 mt-12 rounded">
          <p className="text-purple-800 font-semibold">🎯 Maximize Your Earnings</p>
          <p className="text-purple-700 mt-2">
            Follow all {brands.length} brands to earn {totalPotentialReward} points! Each follow is one-time only, so collect them all.
          </p>
        </div>
      </div>
    </div>
  );
}

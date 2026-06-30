import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { ToastContext } from '../context/ToastContext';

export default function WeeklyChallenges() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const weeklyChallenges = [
    {
      id: 'earn_1000',
      title: 'Power Earner',
      description: 'Earn 1,000 points this week',
      icon: '⚡',
      target: 1000,
      bonus: 200,
      type: 'earning',
      progress: (userData?.weekPoints || 0),
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      id: 'sell_500',
      title: 'Market Mover',
      description: 'Sell 500+ points on the market',
      icon: '📈',
      target: 500,
      bonus: 150,
      type: 'trading',
      progress: (userData?.weekSold || 0),
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'complete_5',
      title: 'Reward Collector',
      description: 'Redeem 5 rewards this week',
      icon: '🎁',
      target: 5,
      bonus: 100,
      type: 'redemption',
      progress: (userData?.weekRedeemed || 0),
      color: 'from-pink-400 to-pink-600'
    },
    {
      id: 'refer_2',
      title: 'Connector',
      description: 'Refer 2 new friends',
      icon: '👥',
      target: 2,
      bonus: 250,
      type: 'social',
      progress: (userData?.weekReferrals || 0),
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'login_5',
      title: 'Daily Visitor',
      description: 'Log in 5 times this week',
      icon: '📱',
      target: 5,
      bonus: 50,
      type: 'engagement',
      progress: (userData?.weekLogins || 0),
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'streak_7',
      title: 'Unstoppable',
      description: 'Earn points 7 days straight',
      icon: '🔥',
      target: 7,
      bonus: 300,
      type: 'streaks',
      progress: (userData?.currentStreak || 0),
      color: 'from-red-400 to-red-600'
    }
  ];

  const handleClaimReward = async (challenge) => {
    if (challenge.progress < challenge.target) {
      addToast('Challenge not yet complete!', 'warning');
      return;
    }

    if (userData?.[`claimed_${challenge.id}`]) {
      addToast('You already claimed this reward!', 'warning');
      return;
    }

    try {
      const functions = getFunctions();
      const claimWeeklyChallenge = httpsCallable(functions, 'claimWeeklyChallenge');

      const result = await claimWeeklyChallenge({
        challengeId: challenge.id
      });

      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to claim reward');
      }

      const bonusAwarded = result.data.bonusAwarded;

      setUserData(prev => ({
        ...prev,
        points: (prev?.points || 0) + bonusAwarded,
        [`claimed_${challenge.id}`]: true
      }));

      addToast(`🎉 Claimed ${bonusAwarded} bonus points!`, 'success');
    } catch (err) {
      console.error('Error claiming reward:', err);
      addToast(err.message || 'Error claiming reward', 'error');
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
                className="text-gray-600 hover:text-primary"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-primary">Weekly Challenges</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Complete Challenges, Earn Bonus Points</h2>
          <p className="text-gray-600">New challenges reset every Monday. Complete as many as you can!</p>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weeklyChallenges.map((challenge) => {
            const isComplete = challenge.progress >= challenge.target;
            const isClaimed = userData?.[`claimed_${challenge.id}`];
            const percentage = Math.min(100, (challenge.progress / challenge.target) * 100);

            return (
              <div
                key={challenge.id}
                className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
                  isComplete ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className={`bg-gradient-to-br ${challenge.color} p-6 text-white`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl">{challenge.icon}</div>
                    {isComplete && !isClaimed && (
                      <div className="bg-yellow-300 text-yellow-900 px-2 py-1 rounded text-xs font-bold animate-pulse">
                        Complete!
                      </div>
                    )}
                    {isClaimed && (
                      <div className="bg-green-300 text-green-900 px-2 py-1 rounded text-xs font-bold">
                        ✓ Claimed
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-1">{challenge.title}</h3>
                  <p className="text-white/90 text-sm mb-4">{challenge.description}</p>

                  {/* Progress Bar */}
                  <div className="bg-white/20 rounded-full h-3 mb-2">
                    <div
                      className="bg-white rounded-full h-3 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm mb-6">
                    <span>{challenge.progress} / {challenge.target}</span>
                    <span>{Math.round(percentage)}%</span>
                  </div>

                  <div className="border-t border-white/30 pt-4">
                    <p className="text-sm text-white/80 mb-2">Bonus Points</p>
                    <p className="text-3xl font-bold mb-4">+{challenge.bonus}</p>

                    <button
                      onClick={() => handleClaimReward(challenge)}
                      disabled={!isComplete || isClaimed}
                      className={`w-full py-2 rounded-lg font-semibold transition ${
                        isClaimed
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : isComplete
                          ? 'bg-white text-yellow-600 hover:bg-yellow-50'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {isClaimed ? '✓ Claimed' : isComplete ? 'Claim Reward' : 'In Progress'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-12 bg-blue-50 border-l-4 border-primary rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">📋 Challenge Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-primary mb-2">How to Progress</p>
              <ul className="space-y-1 text-xs">
                <li>• Earning challenges track your weekly points earned</li>
                <li>• Trading challenges track your market activity</li>
                <li>• Social challenges reward referrals</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-primary mb-2">Reset Schedule</p>
              <ul className="space-y-1 text-xs">
                <li>• Challenges reset every Monday at 12:00 AM</li>
                <li>• Unclaimed rewards don't carry over</li>
                <li>• Progress resets with each week</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

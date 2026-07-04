import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { ToastContext } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const EARN_TYPES = new Set([
  'spin_wheel', 'trivia', 'check_in', 'video_ad',
  'instagram_follow', 'referral', 'getting_started', 'mission',
]);

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export default function WeeklyChallenges() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const [userData, setUserData] = useState(null);
  const [weekStats, setWeekStats] = useState({ points: 0, sold: 0, redeemed: 0, referrals: 0 });
  const [claimedIds, setClaimedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const userId = session.user.id;
      const weekStart = getWeekStart();

      const [userResult, txResult, soldResult, redeemedResult, referralsResult, claimedResult] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('transactions').select('type, amount').eq('user_id', userId).gte('timestamp', weekStart),
        supabase.from('point_sell_orders').select('amount').eq('user_id', userId).eq('status', 'completed').gte('created_at', weekStart),
        supabase.from('redemptions').select('id').eq('user_id', userId).gte('created_at', weekStart),
        supabase.from('referrals').select('id').eq('referrer_id', userId).gte('created_at', weekStart),
        supabase.from('weekly_challenges').select('challenge_id').eq('user_id', userId).eq('claimed', true).gte('claimed_at', weekStart),
      ]);

      if (userResult.data) setUserData(userResult.data);

      const weekPoints = (txResult.data || [])
        .filter(t => EARN_TYPES.has(t.type))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const weekSold = (soldResult.data || []).reduce((sum, o) => sum + (o.amount || 0), 0);
      const weekRedeemed = (redeemedResult.data || []).length;
      const weekReferrals = (referralsResult.data || []).length;

      setWeekStats({ points: weekPoints, sold: weekSold, redeemed: weekRedeemed, referrals: weekReferrals });
      setClaimedIds(new Set((claimedResult.data || []).map(r => r.challenge_id)));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weekly challenges:', err);
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
      progress: weekStats.points,
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      id: 'sell_500',
      title: 'Market Mover',
      description: 'Sell 500+ points on the market',
      icon: '📈',
      target: 500,
      bonus: 150,
      progress: weekStats.sold,
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'complete_5',
      title: 'Reward Collector',
      description: 'Redeem 5 rewards this week',
      icon: '🎁',
      target: 5,
      bonus: 100,
      progress: weekStats.redeemed,
      color: 'from-pink-400 to-pink-600'
    },
    {
      id: 'refer_2',
      title: 'Connector',
      description: 'Refer 2 new friends',
      icon: '👥',
      target: 2,
      bonus: 250,
      progress: weekStats.referrals,
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'login_5',
      title: 'Daily Visitor',
      description: 'Log in 5 times this week',
      icon: '📱',
      target: 5,
      bonus: 50,
      progress: userData?.current_streak || 0,
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'streak_7',
      title: 'Unstoppable',
      description: 'Earn points 7 days straight',
      icon: '🔥',
      target: 7,
      bonus: 300,
      progress: userData?.current_streak || 0,
      color: 'from-red-400 to-red-600'
    }
  ];

  const handleClaimReward = async (challenge) => {
    if (challenge.progress < challenge.target) {
      addToast('Challenge not yet complete!', 'warning');
      return;
    }
    if (claimedIds.has(challenge.id)) {
      addToast('You already claimed this reward!', 'warning');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const userId = session.user.id;
      const weekStart = getWeekStart();

      // Double-check against DB before writing
      const { data: existing } = await supabase
        .from('weekly_challenges')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_id', challenge.id)
        .eq('claimed', true)
        .gte('claimed_at', weekStart)
        .maybeSingle();

      if (existing) {
        addToast('Already claimed this reward!', 'warning');
        setClaimedIds(prev => new Set([...prev, challenge.id]));
        return;
      }

      // Insert claim record FIRST — if this fails, points are not touched
      const { error: claimError } = await supabase.from('weekly_challenges').insert({
        user_id: userId,
        challenge_id: challenge.id,
        claimed: true,
        claimed_at: new Date().toISOString(),
      });
      if (claimError) throw claimError;

      // Fetch fresh points then update
      const { data: freshUser } = await supabase
        .from('users').select('points').eq('id', userId).single();
      if (!freshUser) throw new Error('Could not fetch user points');

      const newPoints = freshUser.points + challenge.bonus;
      const { data: updated, error: updateError } = await supabase
        .from('users').update({ points: newPoints }).eq('id', userId).select('id');
      if (updateError) throw updateError;
      if (!updated?.length) throw new Error('Points update blocked — check RLS policy for users table');

      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'weekly_challenge',
        amount: challenge.bonus,
        description: `Weekly Challenge: ${challenge.title}`,
        timestamp: new Date().toISOString(),
      });
      if (txError) console.error('[WeeklyChallenges] Transaction insert failed:', txError.message);

      setClaimedIds(prev => new Set([...prev, challenge.id]));
      setUserData(prev => ({ ...prev, points: newPoints }));
      addToast(`🎉 Claimed ${challenge.bonus} bonus points!`, 'success');
    } catch (err) {
      console.error('Error claiming reward:', err);
      addToast(err.message || 'Error claiming reward', 'error');
    }
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
            const isClaimed = claimedIds.has(challenge.id);
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

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { ToastContext } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import GettingStartedChecklist from '../components/GettingStartedChecklist';
import ActivityCard from '../components/ActivityCard';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';
import { awardGettingStartedTask } from '../utils/rateLimiter';
import { recordCheckInActivity, updateUserPoints } from '../utils/databaseHelpers';
import {
  IconSpinWheel,
  IconMissions,
  IconTrivia,
  IconAchievements,
  IconVideoAds,
  IconInstagram,
  IconReferrals,
  IconLeaderboard,
  IconMarketplace,
  IconBuyPoints,
  IconFire,
  IconDiamond,
  IconRocket,
  IconTrendingUp,
} from '../components/Icons';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { alert: showAlert, modal, closeModal } = useConfirm();
  const { addToast } = useContext(ToastContext);

  useEffect(() => {
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
          const normalizedUser = {
            ...user,
            fullName: user.full_name,
            profileComplete: user.profile_complete,
            currentStreak: user.current_streak || 0
          };
          setUserData(normalizedUser);
          setUser(session.user);
          checkTodayCheckIn(session.user.id);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Refetch user data every 3 seconds to keep points updated
    const interval = setInterval(fetchUserData, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkTodayCheckIn = async (userId) => {
    const todayString = new Date().toDateString();
    // Fast-path: localStorage already confirms today
    if (localStorage.getItem('lastCheckIn') === todayString) {
      setCheckedInToday(true);
      return;
    }
    // Authoritative check against DB
    const todayDate = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('streak_check_ins')
      .select('id')
      .eq('user_id', userId)
      .eq('check_in_date', todayDate)
      .maybeSingle();
    if (existing) {
      localStorage.setItem('lastCheckIn', todayString);
      setCheckedInToday(true);
    } else {
      setCheckedInToday(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const todayDate = new Date().toISOString().split('T')[0];
      const todayString = new Date().toDateString();

      // Use limit(1) — maybeSingle() returns null when multiple rows exist (swallows the error)
      const { data: existing } = await supabase
        .from('streak_check_ins')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('check_in_date', todayDate)
        .limit(1);

      if (existing && existing.length > 0) {
        localStorage.setItem('lastCheckIn', todayString);
        setCheckedInToday(true);
        addToast('You already checked in today!', 'warning');
        return;
      }

      // Fetch fresh user data — never use stale local state for calculations
      const { data: freshUser, error: fetchError } = await supabase
        .from('users').select('points, current_streak').eq('id', session.user.id).single();
      if (fetchError || !freshUser) throw new Error('Failed to fetch user data');

      const newStreak = (freshUser.current_streak || 0) + 1;
      let pointsEarned = 250;
      if (newStreak === 7) pointsEarned += 500;
      if (newStreak === 14) pointsEarned += 1500;
      if (newStreak === 30) pointsEarned += 5000;
      if (newStreak === 100) pointsEarned += 25000;

      // INSERT check-in row FIRST — this is the atomic duplicate guard.
      // Points are only updated if this insert succeeds. If it fails due to
      // a unique constraint violation (already checked in), we stop here.
      const recorded = await recordCheckInActivity(session.user.id, pointsEarned);
      if (!recorded.success) {
        localStorage.setItem('lastCheckIn', todayString);
        setCheckedInToday(true);
        addToast('You already checked in today!', 'warning');
        return;
      }

      // Safe to update points now — check-in row is committed
      const newPoints = freshUser.points + pointsEarned;
      const { error } = await supabase
        .from('users')
        .update({ points: newPoints, current_streak: newStreak })
        .eq('id', session.user.id);
      if (error) throw error;

      // Award 7-day getting started task if reached
      try {
        const { data: allCheckIns } = await supabase
          .from('streak_check_ins').select('check_in_date').eq('user_id', session.user.id);
        const uniqueDates = new Set((allCheckIns || []).map(ci => ci.check_in_date));
        if (uniqueDates.size >= 7) {
          const { recordGettingStartedActivity } = await import('../utils/databaseHelpers');
          const taskResult = await recordGettingStartedActivity(session.user.id, 'checkin', 'Check In 7 Days', 70);
          if (taskResult.success) addToast('🎉 Completed 7-Day Check-In Challenge! +70 bonus points', 'success');
        }
      } catch (err) {
        console.error('Error awarding 7-day task:', err);
      }

      localStorage.setItem('lastCheckIn', todayString);
      setUserData(prev => ({ ...prev, points: newPoints, current_streak: newStreak }));
      setCheckedInToday(true);

      await showAlert({
        title: 'Success',
        message: `Check-in successful! You earned ${pointsEarned} points!`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error checking in:', err);
      await showAlert({
        title: 'Error',
        message: err.message || 'Failed to check in. Please try again.',
        type: 'error'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4 items-center">
              <Button
                onClick={() => navigate('/profile')}
                variant="ghost"
                size="md"
              >
                Profile
              </Button>
              <Button
                onClick={() => navigate('/wallet')}
                variant="ghost"
                size="md"
              >
                Wallet
              </Button>
              <Button
                onClick={handleLogout}
                variant="danger"
                size="md"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {user?.displayName || 'User'}!</h2>
          <p className="text-blue-100">{userData?.university || 'Campus'}</p>
        </div>

        {/* Profile Completion Status */}
        {userData && !userData?.profileComplete && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-amber-900 mb-2">Complete Your Profile - Earn 1,000 Bonus Points! 🎁</h3>
                <p className="text-sm text-amber-800 mb-4">
                  Add your university, department, and course to unlock ad posting and see your university badge on leaderboards.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate('/profile')}
                    variant="primary"
                    size="sm"
                  >
                    Complete Now
                  </Button>
                  <Button
                    onClick={() => navigate('/leaderboards')}
                    variant="ghost"
                    size="sm"
                  >
                    View Leaderboards
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Getting Started Checklist */}
        <GettingStartedChecklist />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Points Card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/streak')}>
            <h3 className="text-gray-600 font-semibold mb-2">Your Points</h3>
            <p className="text-4xl font-bold text-primary">{userData?.points || 0}</p>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-600 mb-1">Current Streak</p>
              <div className="flex items-center gap-2">
                <IconFire className="w-6 h-6 text-orange-500" />
                <span className="text-2xl font-bold text-orange-500">{userData?.currentStreak || 0}</span>
                <span className="text-xs text-gray-600">days</span>
              </div>
              {(userData?.currentStreak || 0) >= 7 && (
                <p className="text-xs text-green-600 font-semibold mt-1">+{Math.floor((userData?.currentStreak || 0) / 7) * 10}% bonus!</p>
              )}
              <p className="text-xs text-primary font-semibold mt-2">View streak details →</p>
            </div>
          </div>

          {/* Wallet Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-semibold mb-2">Wallet Balance</h3>
            <p className="text-4xl font-bold text-primary">₦{userData?.wallet || 0}</p>
            <div className="mt-3 space-y-2">
              <Button
                onClick={() => navigate('/wallet')}
                variant="ghost"
                size="sm"
                fullWidth
              >
                View Wallet →
              </Button>
              <Button
                onClick={() => navigate('/transactions')}
                variant="ghost"
                size="sm"
                fullWidth
              >
                Transaction History →
              </Button>
            </div>
          </div>

          {/* Referrals Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-semibold mb-2">Referral Code</h3>
            <p className="text-lg font-mono text-primary font-bold">
              {user?.id?.substring(0, 8).toUpperCase()}
            </p>
            <p className="text-gray-500 text-sm mt-2">Share to earn ₦50+</p>
          </div>

          {/* Activity Log Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-semibold mb-2">Activity Log</h3>
            <p className="text-gray-600 text-sm mb-4">View all your point-earning activities and history</p>
            <Button
              onClick={() => navigate('/activity-log')}
              variant="primary"
              size="sm"
              fullWidth
            >
              View Activity Log →
            </Button>
          </div>
        </div>

        {/* Daily Check-In */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Daily Check-In</h3>
          <p className="text-gray-600 mb-6">
            Check in daily to earn points and maintain your streak!
          </p>

          <Button
            onClick={handleCheckIn}
            disabled={checkedInToday}
            variant={checkedInToday ? 'secondary' : 'primary'}
            size="lg"
          >
            {checkedInToday ? '✓ Checked In Today' : 'Check In Now'}
          </Button>
        </div>

        {/* Games & Activities */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Play & Earn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActivityCard
              title="Lucky Spin"
              description="Spin daily for random rewards. Earn up to 500 points!"
              gradient="gradient-yellow"
              icon={IconSpinWheel}
              onNavigate={() => navigate('/spin-wheel')}
              cta="Spin now"
            />
            <ActivityCard
              title="Daily Missions"
              description="Complete tasks and earn bonus points. Chain them for multipliers!"
              gradient="gradient-blue"
              icon={IconMissions}
              onNavigate={() => navigate('/daily-missions')}
              cta="Start missions"
            />
            <ActivityCard
              title="Trivia Quiz"
              description="Test your campus knowledge. Earn points for correct answers!"
              gradient="gradient-purple"
              icon={IconTrivia}
              onNavigate={() => navigate('/trivia')}
              cta="Play trivia"
            />
            <ActivityCard
              title="Achievements"
              description="Unlock badges and special rewards as you progress!"
              gradient="gradient-pink"
              icon={IconAchievements}
              onNavigate={() => navigate('/achievements')}
              cta="View badges"
            />
          </div>
        </section>

        {/* Earn More */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Earn More Points</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActivityCard
              title="Watch & Earn"
              description="Watch short video ads and earn points daily!"
              gradient="gradient-red"
              icon={IconVideoAds}
              onNavigate={() => navigate('/video-ads')}
              cta="Start watching"
            />
            <ActivityCard
              title="Follow & Earn"
              description="Follow brands on Instagram and earn instant points!"
              gradient="gradient-pink"
              icon={IconInstagram}
              onNavigate={() => navigate('/instagram-follow')}
              cta="Start following"
            />
            <ActivityCard
              title="Invite Friends"
              description="Invite friends and earn 500-1000 points per referral!"
              gradient="gradient-emerald"
              icon={IconReferrals}
              onNavigate={() => navigate('/referrals')}
              cta="Share code"
            />
            <ActivityCard
              title="Sponsored Missions"
              description="Earn 500-2000 points from top brands. Direct partnerships!"
              gradient="gradient-yellow"
              icon={IconRocket}
              onNavigate={() => navigate('/sponsored-missions')}
              cta="Browse missions"
            />
          </div>
        </section>

        {/* Marketplace */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Rewards Marketplace</h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg p-8 hover:shadow-xl transition">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Explore Rewards</h3>
                  <p className="text-purple-50 text-lg">Exchange your points for real rewards</p>
                </div>
                <IconMarketplace className="w-12 h-12 text-white opacity-80" />
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-6 backdrop-blur-sm">
                <p className="text-purple-100 text-sm font-semibold mb-1">Your Balance</p>
                <p className="text-3xl font-bold text-white">{userData?.points || 0} pts</p>
              </div>
              <Button
                onClick={() => navigate('/marketplace')}
                variant="primary"
                size="lg"
                fullWidth
              >
                Shop Now
              </Button>
            </div>
          </div>
        </section>

        {/* Cosmetics & Premium */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Enhance Your Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActivityCard
              title="Cosmetics Shop"
              description="Customize your profile with exclusive badges, frames, and titles!"
              gradient="gradient-pink"
              icon={IconDiamond}
              onNavigate={() => navigate('/cosmetics-shop')}
              cta="Browse shop"
            />
            <ActivityCard
              title="Go Premium"
              description="Get 2x points on all activities, instant redemption, and no ads!"
              gradient="gradient-purple"
              icon={IconRocket}
              onNavigate={() => navigate('/premium')}
              cta="Learn more"
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-8 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/buy-points')}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Buy Points Instantly</h3>
                  <p className="text-gray-600 text-sm">From ₦0.07/point - 80% savings!</p>
                </div>
                <IconBuyPoints className="w-10 h-10 text-blue-600 flex-shrink-0" />
              </div>
              <p className="text-sm text-blue-600 font-semibold">Unlock premium rewards →</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg p-8 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/point-market')}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Point Trading Market</h3>
                  <p className="text-gray-600 text-sm">Buy & sell at market rates</p>
                </div>
                <svg className="w-10 h-10 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </div>
              <p className="text-sm text-emerald-600 font-semibold">View live rates →</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Marketplace</h3>
            <p className="text-gray-600 mb-4">
              Browse and list items for sale on the campus marketplace.
            </p>
            <Button
              onClick={() => navigate('/marketplace')}
              variant="ghost"
              size="md"
            >
              Open Marketplace →
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Post Ads</h3>
            <p className="text-gray-600 mb-4">
              Sell items or offer services to your university community.
            </p>
            <Button
              onClick={() => navigate('/my-ads')}
              variant="ghost"
              size="md"
            >
              My Ads →
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">P2P Transfers</h3>
            <p className="text-gray-600 mb-4">
              Send money to other students quickly and securely.
            </p>
            <Button
              onClick={() => navigate('/wallet')}
              variant="ghost"
              size="md"
            >
              Send Money →
            </Button>
          </div>
        </div>
      </div>
      <Modal {...modal} onClose={closeModal} />
    </div>
  );
}

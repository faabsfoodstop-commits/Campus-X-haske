import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { recordCheckInActivity, updateUserPoints } from '../utils/databaseHelpers';
import { ToastContext } from '../context/ToastContext';
import Button from '../components/Button';
import { IconArrowLeft, IconFire, IconStar, IconRocket } from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StreakManager() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakStatus, setStreakStatus] = useState('active'); // active, broken, warning

  useEffect(() => {
    fetchUserData();

    // Refetch every 30 seconds — streak data changes at most once per day
    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && userData) {
        // Calculate streak from check-in history
        const { data: checkIns } = await supabase
          .from('streak_check_ins')
          .select('check_in_date')
          .eq('user_id', session.user.id)
          .order('check_in_date', { ascending: false });

        let streak = 0;
        if (checkIns && checkIns.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const sortedDates = checkIns.map(ci => ci.check_in_date).sort().reverse();
          if (sortedDates[0] === today || sortedDates[0] === yesterday) {
            for (let i = 0; i < sortedDates.length; i++) {
              // Use noon UTC to avoid local-timezone date boundary issues
              const d = new Date(sortedDates[0] + 'T12:00:00Z');
              d.setUTCDate(d.getUTCDate() - i);
              const expectedDate = d.toISOString().split('T')[0];
              if (sortedDates[i] === expectedDate) {
                streak++;
              } else {
                break;
              }
            }
          }
        }

        setUserData({ ...userData, current_streak: streak });

        // Use DB as authoritative source for today's check-in status
        const todayDate = new Date().toISOString().split('T')[0];
        const todayString = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        const todayCheckIn = checkIns?.find(ci => ci.check_in_date === todayDate);
        if (todayCheckIn) {
          localStorage.setItem('lastCheckIn', todayString);
          setStreakStatus('active');
        } else {
          const lastCheckIn = localStorage.getItem('lastCheckIn');
          if (lastCheckIn === yesterday) {
            setStreakStatus('warning');
          } else {
            setStreakStatus('broken');
          }
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const todayDate = new Date().toISOString().split('T')[0];
    const todayString = new Date().toDateString();

    try {
      // Use limit(1) — maybeSingle() returns null when multiple rows exist (swallows the error)
      const { data: existing } = await supabase
        .from('streak_check_ins')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('check_in_date', todayDate)
        .limit(1);

      if (existing && existing.length > 0) {
        localStorage.setItem('lastCheckIn', todayString);
        setStreakStatus('active');
        addToast('You already checked in today!', 'warning');
        return;
      }

      // Fetch fresh user data — never use stale local state
      const { data: freshUser, error: fetchError } = await supabase
        .from('users').select('points, current_streak').eq('id', session.user.id).single();
      if (fetchError || !freshUser) throw new Error('Failed to fetch user data');

      const newStreak = (freshUser.current_streak || 0) + 1;
      let streakBonus = 0;
      if (newStreak === 7) streakBonus = 500;
      if (newStreak === 14) streakBonus = 1500;
      if (newStreak === 30) streakBonus = 5000;
      if (newStreak === 100) streakBonus = 25000;

      const totalPoints = 250 + streakBonus;

      // INSERT check-in row FIRST — this is the atomic duplicate guard.
      // Points are only updated if this insert succeeds. If it fails due to
      // a unique constraint violation (already checked in), we stop here.
      const recorded = await recordCheckInActivity(session.user.id, totalPoints);
      if (!recorded.success) {
        localStorage.setItem('lastCheckIn', todayString);
        setStreakStatus('active');
        addToast('You already checked in today!', 'warning');
        return;
      }

      // Safe to update points now — check-in row is committed
      const newPoints = freshUser.points + totalPoints;
      const { error: updateError } = await supabase
        .from('users')
        .update({ current_streak: newStreak, points: newPoints })
        .eq('id', session.user.id);
      if (updateError) throw updateError;

      localStorage.setItem('lastCheckIn', todayString);
      setUserData(prev => ({ ...prev, current_streak: newStreak, points: newPoints }));
      setStreakStatus('active');

      if (streakBonus > 0) {
        addToast(`Milestone Reached! 🎉 +${streakBonus} bonus points!`, 'success');
      } else {
        addToast(`Check-in successful! Streak: ${newStreak} days 🔥`, 'success');
      }
    } catch (err) {
      console.error('Check-in error:', err);
      addToast('Check-in failed. Try again.', 'error');
    }
  };

  const streakMultiplier = Math.floor((userData?.current_streak || 0) / 7);

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
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <IconArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <IconFire className="w-6 h-6 text-orange-500" />
                <h1 className="text-2xl font-bold text-gray-800">Streak Tracker</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Streak Card */}
        <div
          className={`rounded-lg shadow-lg p-12 mb-8 text-center text-white ${
            streakStatus === 'active'
              ? 'bg-gradient-to-br from-red-500 to-orange-600'
              : streakStatus === 'warning'
              ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
              : 'bg-gradient-to-br from-gray-500 to-gray-700'
          }`}
        >
          <p className="text-lg opacity-90 mb-2">Current Streak</p>
          <p className="text-7xl font-bold mb-4">{userData?.current_streak || 0}</p>
          <div className="flex items-center justify-center gap-2 text-2xl">
            <IconFire className="w-8 h-8" />
            <p>{userData?.current_streak || 0} Days</p>
          </div>

          {streakStatus === 'warning' && (
            <p className="text-yellow-100 mt-4 text-lg">⚠️ Check in today to keep your streak alive!</p>
          )}
          {streakStatus === 'broken' && (
            <p className="text-gray-100 mt-4 text-lg">Streak broken. Check in now to start fresh!</p>
          )}
        </div>

        {/* Check-in Button */}
        <div className="bg-white rounded-lg shadow p-8 mb-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Daily Check-In</h3>
          <p className="text-gray-600 mb-6">Check in every day to maintain your streak and earn bonus points!</p>
          {streakStatus === 'active' ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
              <p className="text-green-700 text-lg font-semibold flex items-center justify-center gap-2">
                ✓ Already Checked In Today
              </p>
              <p className="text-green-600 text-sm mt-2">Come back tomorrow to continue your streak!</p>
            </div>
          ) : (
            <Button
              onClick={handleCheckIn}
              variant="primary"
              size="lg"
              className="min-w-64"
            >
              Check In Now (+250 pts)
            </Button>
          )}
        </div>

        {/* Multiplier Bonus */}
        {streakMultiplier > 0 && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-8 mb-8">
            <h3 className="text-2xl font-bold mb-4">Streak Multiplier Active!</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-lg opacity-90">Current Multiplier</p>
                <p className="text-5xl font-bold">+{streakMultiplier * 10}%</p>
              </div>
              <div className="text-center border-l border-r border-white/30">
                <p className="text-lg opacity-90">All Activity Rewards</p>
                <p className="text-2xl font-bold">×{1 + streakMultiplier * 0.1}</p>
              </div>
              <div className="text-center">
                <p className="text-lg opacity-90">Keep Going!</p>
                <p className="text-lg">{7 - ((userData?.current_streak || 0) % 7)} days to next level</p>
              </div>
            </div>
          </div>
        )}

        {/* Milestones */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Milestone Rewards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-lg border-2 ${
              (userData?.current_streak || 0) >= 7 ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}>
              <p className="text-lg font-bold text-gray-800 mb-2">7 Days 🔥</p>
              <p className="text-gray-600 mb-3">Complete a full week of check-ins</p>
              <p className="text-3xl font-bold text-green-600">+500 pts</p>
              {(userData?.current_streak || 0) >= 7 && <p className="text-green-600 font-bold mt-2">✓ Unlocked</p>}
            </div>

            <div className={`p-6 rounded-lg border-2 ${
              (userData?.current_streak || 0) >= 14 ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}>
              <p className="text-lg font-bold text-gray-800 mb-2">14 Days 🔥</p>
              <p className="text-gray-600 mb-3">Two weeks of consistency</p>
              <p className="text-3xl font-bold text-blue-600">+1,500 pts</p>
              {(userData?.current_streak || 0) >= 14 && <p className="text-green-600 font-bold mt-2">✓ Unlocked</p>}
            </div>

            <div className={`p-6 rounded-lg border-2 ${
              (userData?.current_streak || 0) >= 30 ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}>
              <p className="text-lg font-bold text-gray-800 mb-2">30 Days 🔥</p>
              <p className="text-gray-600 mb-3">One full month of commitment</p>
              <p className="text-3xl font-bold text-purple-600">+5,000 pts</p>
              {(userData?.current_streak || 0) >= 30 && <p className="text-green-600 font-bold mt-2">✓ Unlocked</p>}
            </div>

            <div className={`p-6 rounded-lg border-2 ${
              (userData?.current_streak || 0) >= 100 ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}>
              <p className="text-lg font-bold text-gray-800 mb-2">100 Days 🔥🔥🔥</p>
              <p className="text-gray-600 mb-3">Legendary commitment</p>
              <p className="text-3xl font-bold text-yellow-600">+25,000 pts</p>
              {(userData?.current_streak || 0) >= 100 && <p className="text-green-600 font-bold mt-2">✓ Unlocked</p>}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">How Streaks Work</h3>
          <div className="space-y-3 text-gray-700">
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">1.</span>
              <span>Check in once per day to maintain your streak</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">2.</span>
              <span>Every 7 days, you unlock a multiplier bonus (+10% per week)</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">3.</span>
              <span>Miss a day and your streak resets (but you can start over!)</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">4.</span>
              <span>Hit milestones (7, 14, 30, 100 days) for massive bonus points</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

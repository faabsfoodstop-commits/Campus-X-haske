import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
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

    // Refetch every 3 seconds to keep streak updated
    const interval = setInterval(fetchUserData, 3000);
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

          // Check if today or yesterday has a check-in
          if (sortedDates[0] === today || sortedDates[0] === yesterday) {
            // Count consecutive days backwards
            let currentDate = new Date(sortedDates[0]);
            for (let i = 0; i < sortedDates.length; i++) {
              const checkInDate = new Date(sortedDates[i]);
              const expectedDate = new Date(currentDate);
              expectedDate.setDate(expectedDate.getDate() - i);

              if (checkInDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
                streak++;
              } else {
                break;
              }
            }
          }
        }

        const updatedUserData = { ...userData, current_streak: streak };
        setUserData(updatedUserData);

        // Check streak status
        const today = new Date().toDateString();
        const lastCheckIn = localStorage.getItem('lastCheckIn');
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (lastCheckIn === today) {
          setStreakStatus('active');
        } else if (lastCheckIn === yesterday) {
          setStreakStatus('warning');
        } else {
          setStreakStatus('broken');
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

    const today = new Date().toDateString();
    const lastCheckIn = localStorage.getItem('lastCheckIn');

    if (lastCheckIn === today) {
      addToast('You already checked in today!', 'warning');
      return;
    }

    try {
      let newStreak = (userData?.current_streak || 0) + 1;
      let streakBonus = 0;

      // Milestone bonuses
      if (newStreak === 7) streakBonus = 500; // 1 week
      if (newStreak === 14) streakBonus = 1500; // 2 weeks
      if (newStreak === 30) streakBonus = 5000; // 1 month
      if (newStreak === 100) streakBonus = 25000; // 100 days

      const totalPoints = 250 + streakBonus;

      // Update user streak
      const { error: updateError } = await supabase
        .from('users')
        .update({
          current_streak: newStreak,
          points: (userData?.points || 0) + totalPoints,
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Log streak check-in
      const today_date = new Date().toISOString().split('T')[0];
      const { error: insertError } = await supabase
        .from('streak_check_ins')
        .insert([{
          user_id: session.user.id,
          check_in_date: today_date,
          points_earned: totalPoints,
        }]);

      if (insertError) throw insertError;

      localStorage.setItem('lastCheckIn', today);
      setUserData(prev => ({
        ...prev,
        current_streak: newStreak,
        points: (prev?.points || 0) + totalPoints,
      }));

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

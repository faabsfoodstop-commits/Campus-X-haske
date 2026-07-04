import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { supabase } from '../config/supabase';

export default function DailyCheckIn() {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todayPoints, setTodayPoints] = useState(0);

  useEffect(() => {
    checkTodayCheckIn();
  }, [user]);

  const checkTodayCheckIn = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('streak_check_ins')
      .select('*')
      .eq('user_id', user.id)
      .eq('check_in_date', today)
      .maybeSingle();

    setHasCheckedInToday(!!data);
    if (data) {
      setTodayPoints(data.points_awarded);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Award 10 points base + 5 per streak day
      const streakBonus = Math.min(profile?.current_streak || 0, 50);
      const totalPoints = 10 + streakBonus;

      // Insert check-in record (UNIQUE constraint prevents duplicates)
      const { error: checkInError } = await supabase
        .from('streak_check_ins')
        .insert([{
          user_id: user.id,
          check_in_date: today,
          points_awarded: totalPoints,
        }]);

      if (checkInError) {
        if (checkInError.code === '23505') {
          addToast('Already checked in today!', 'warning');
          setHasCheckedInToday(true);
          return;
        }
        throw checkInError;
      }

      // Update user points and streak
      const newStreak = (profile?.current_streak || 0) + 1;
      const { error: updateError } = await supabase
        .from('users')
        .update({
          points: (profile?.points || 0) + totalPoints,
          current_streak: newStreak,
          last_check_in: today,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: 'daily_check_in',
          amount: totalPoints,
          description: `Daily check-in (streak: ${newStreak})`,
          metadata: { streak: newStreak },
        }]);

      // Log activity
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          action: 'daily_check_in',
          description: `Checked in and earned ${totalPoints} points`,
        }]);

      addToast(`+${totalPoints} points! Streak: ${newStreak}`, 'success');
      setHasCheckedInToday(true);
      setTodayPoints(totalPoints);

      // Refresh profile to sync points balance
      await refreshProfile();
    } catch (error) {
      addToast(error.message || 'Check-in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Daily Check-In</h1>

          <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-8 mb-6">
            <p className="text-white text-sm opacity-90 mb-2">Current Streak</p>
            <p className="text-5xl font-bold text-white">🔥 {profile?.current_streak || 0}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
              <span className="text-gray-700">Base Points</span>
              <span className="font-bold text-blue-600">+10</span>
            </div>
            <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg">
              <span className="text-gray-700">Streak Bonus</span>
              <span className="font-bold text-purple-600">+{Math.min(profile?.current_streak || 0, 50)}</span>
            </div>
            <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border-2 border-green-300">
              <span className="text-gray-700 font-semibold">Total Today</span>
              <span className="font-bold text-green-600 text-lg">+{10 + Math.min(profile?.current_streak || 0, 50)}</span>
            </div>
          </div>

          {hasCheckedInToday ? (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
              <p className="text-green-700 font-semibold">✅ Already checked in today!</p>
              <p className="text-green-600 text-sm mt-1">Earned {todayPoints} points</p>
            </div>
          ) : null}

          <button
            onClick={handleCheckIn}
            disabled={loading || hasCheckedInToday}
            className={`w-full py-4 rounded-lg font-bold text-white text-lg transition ${
              hasCheckedInToday
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg'
            }`}
          >
            {loading ? 'Checking In...' : hasCheckedInToday ? 'Checked In Today' : 'Check In Now'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Come back tomorrow to maintain your streak! <br />
              Miss a day and your streak resets to 0.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { supabase } from '../config/supabase';

const MISSIONS = [
  {
    id: 'trivia_1',
    title: 'Trivia Challenge',
    description: 'Answer 5 questions correctly',
    points: 20,
    difficulty: 'medium',
    type: 'trivia',
    icon: '🧠',
    dailyLimit: 1,
  },
  {
    id: 'instagram_1',
    title: 'Follow on Instagram',
    description: 'Follow @haski_campus',
    points: 50,
    difficulty: 'easy',
    type: 'social',
    icon: '📷',
    dailyLimit: 1,
  },
  {
    id: 'invite_1',
    title: 'Invite a Friend',
    description: 'Refer someone to HASKii',
    points: 100,
    difficulty: 'hard',
    type: 'referral',
    icon: '👥',
    dailyLimit: 3,
  },
  {
    id: 'survey_1',
    title: 'Quick Survey',
    description: 'Complete a 2-minute feedback survey',
    points: 15,
    difficulty: 'easy',
    type: 'survey',
    icon: '📋',
    dailyLimit: 1,
  },
  {
    id: 'brand_1',
    title: 'Try Sponsored App',
    description: 'Install & open a featured app',
    points: 75,
    difficulty: 'hard',
    type: 'sponsored',
    icon: '📲',
    dailyLimit: 1,
  },
];

export default function DailyMissions() {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [missions, setMissions] = useState([]);
  const [completedToday, setCompletedToday] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [totalEarnedToday, setTotalEarnedToday] = useState(0);
  const [comboCount, setComboCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadTodaysMissions();
    }
  }, [user]);

  const loadTodaysMissions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('daily_missions')
        .select('mission_id, points_earned')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const completed = new Map();
      let totalPoints = 0;

      data?.forEach(record => {
        const key = record.mission_id;
        const current = completed.get(key) || 0;
        completed.set(key, current + 1);
        totalPoints += record.points_earned;
      });

      setCompletedToday(completed);
      setTotalEarnedToday(totalPoints);
      setComboCount(data?.length || 0);

      // Initialize mission list
      setMissions(MISSIONS);
    } catch (error) {
      console.error('Failed to load missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCompleteMission = (missionId) => {
    const completed = completedToday.get(missionId) || 0;
    const mission = MISSIONS.find(m => m.id === missionId);
    return completed < mission.dailyLimit;
  };

  const handleCompleteMission = async (mission) => {
    if (!canCompleteMission(mission.id)) {
      addToast(`Daily limit reached for ${mission.title}`, 'warning');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      let pointsAwarded = mission.points;

      // Combo bonus: every 3rd mission completed gets 50% bonus
      if (comboCount > 0 && (comboCount + 1) % 3 === 0) {
        pointsAwarded = Math.floor(mission.points * 1.5);
      }

      // Insert mission completion
      const { error: insertError } = await supabase
        .from('daily_missions')
        .insert([{
          user_id: user.id,
          mission_id: mission.id,
          points_earned: pointsAwarded,
          completed_at: new Date().toISOString(),
        }]);

      if (insertError) throw insertError;

      // Award points
      const newPoints = (profile?.points || 0) + pointsAwarded;
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Log transaction
      const bonusText = pointsAwarded > mission.points ? ' + COMBO BONUS!' : '';
      await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: 'mission_completed',
          amount: pointsAwarded,
          description: `${mission.title}${bonusText}`,
          mission_id: mission.id,
          metadata: { mission_type: mission.type },
        }]);

      // Log activity
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          action: 'mission_completed',
          description: `Completed: ${mission.title} (+${pointsAwarded})`,
        }]);

      const newCombo = comboCount + 1;
      const comboMessage = newCombo % 3 === 0 ? ' 🔥 COMBO BONUS!' : '';
      addToast(`+${pointsAwarded} points${comboMessage}`, 'success');

      // Update local state
      setCompletedToday(prev => new Map(prev).set(mission.id, (prev.get(mission.id) || 0) + 1));
      setTotalEarnedToday(prev => prev + pointsAwarded);
      setComboCount(newCombo);

      // Refresh profile to sync points balance
      await refreshProfile();
    } catch (error) {
      addToast(error.message || 'Mission failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading missions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Daily Missions</h1>
        <p className="text-gray-600 mb-6">Complete tasks to earn bonus points</p>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Today's Earnings</p>
            <p className="text-3xl font-bold">{totalEarnedToday}</p>
            <p className="text-xs opacity-75 mt-2">points earned</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Missions Completed</p>
            <p className="text-3xl font-bold">{comboCount}</p>
            <p className="text-xs opacity-75 mt-2">today</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Combo Streak</p>
            <p className="text-3xl font-bold">🔥 {Math.floor(comboCount / 3)}</p>
            <p className="text-xs opacity-75 mt-2">combos active</p>
          </div>
        </div>

        {/* Combo Bonus Info */}
        {comboCount > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6">
            <p className="text-amber-900 text-sm">
              <span className="font-bold">💡 Combo System:</span> Every 3rd mission gets 50% bonus points!
            </p>
          </div>
        )}

        {/* Missions Grid */}
        <div className="space-y-3">
          {missions.map((mission) => {
            const completed = completedToday.get(mission.id) || 0;
            const canComplete = canCompleteMission(mission.id);
            const difficultyColor = {
              easy: 'bg-green-100 text-green-700',
              medium: 'bg-yellow-100 text-yellow-700',
              hard: 'bg-red-100 text-red-700',
            }[mission.difficulty];

            return (
              <div
                key={mission.id}
                className={`rounded-lg p-5 border-l-4 transition ${
                  canComplete
                    ? 'bg-white border-blue-500 hover:shadow-md'
                    : 'bg-gray-50 border-gray-400 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <span className="text-3xl">{mission.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{mission.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${difficultyColor}`}>
                          {mission.difficulty}
                        </span>
                        <span className="text-xs text-gray-600">
                          {completed}/{mission.dailyLimit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-purple-600 mb-2">+{mission.points}</p>
                    <button
                      onClick={() => handleCompleteMission(mission)}
                      disabled={!canComplete}
                      className={`px-4 py-2 rounded font-semibold text-sm transition ${
                        canComplete
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {!canComplete ? 'Limit Reached' : 'Complete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <p className="text-blue-900 text-sm">
            <span className="font-bold">💡 Tip:</span> Mix different mission types to maximize daily earnings. Some missions reset daily, others have limits.
          </p>
        </div>
      </div>
    </div>
  );
}

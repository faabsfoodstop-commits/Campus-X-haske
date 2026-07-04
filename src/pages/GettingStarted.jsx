import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { supabase } from '../config/supabase';

const GETTING_STARTED_TASKS = [
  {
    id: 'profile_complete',
    title: 'Complete Your Profile',
    description: 'Add your full name, university, and department',
    points: 100,
    icon: '👤',
    category: 'onboarding',
    check: async (profile) => profile?.profile_complete === true,
  },
  {
    id: 'first_check_in',
    title: 'Daily Check-In',
    description: 'Check in to maintain your streak',
    points: 50,
    icon: '📅',
    category: 'engagement',
    check: async (profile, user) => {
      const { data } = await supabase
        .from('streak_check_ins')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      return data && data.length > 0;
    },
  },
  {
    id: 'view_activity',
    title: 'View Activity Log',
    description: 'Check your activity and transaction history',
    points: 25,
    icon: '📝',
    category: 'exploration',
    check: async () => {
      // Completed when user visits activity log (tracked in analytics)
      return localStorage.getItem('viewed_activity_log') === 'true';
    },
  },
  {
    id: 'join_community',
    title: 'Join Our Community',
    description: 'Follow us on social media for updates',
    points: 50,
    icon: '👥',
    category: 'community',
    check: async () => {
      // Completed when user clicks follow link
      return localStorage.getItem('joined_community') === 'true';
    },
  },
];

export default function GettingStarted() {
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);

  useEffect(() => {
    if (user) {
      loadCompletedTasks();
    }
  }, [user, profile]);

  const loadCompletedTasks = async () => {
    try {
      const { data } = await supabase
        .from('getting_started_tasks')
        .select('task_id, points_awarded')
        .eq('user_id', user.id);

      const completed = new Set(data?.map(t => t.task_id) || []);
      setCompletedTasks(completed);

      const earned = data?.reduce((sum, t) => sum + (t.points_awarded || 0), 0) || 0;
      setTotalPointsEarned(earned);

      // Check for newly completed tasks
      await checkAndAwardNewTasks(completed);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndAwardNewTasks = async (alreadyCompleted) => {
    try {
      for (const task of GETTING_STARTED_TASKS) {
        if (!alreadyCompleted.has(task.id)) {
          const isCompleted = await task.check(profile, user);

          if (isCompleted) {
            await awardTask(task);
          }
        }
      }
    } catch (error) {
      console.error('Error checking tasks:', error);
    }
  };

  const awardTask = async (task) => {
    try {
      // Insert into getting_started_tasks (UNIQUE constraint prevents duplicates)
      const { error: insertError } = await supabase
        .from('getting_started_tasks')
        .insert([{
          user_id: user.id,
          task_id: task.id,
          points_awarded: task.points,
        }]);

      if (insertError?.code === '23505') {
        // Already awarded
        return;
      }

      if (insertError) throw insertError;

      // Award points
      const newPoints = (profile?.points || 0) + task.points;
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
          type: 'getting_started_bonus',
          amount: task.points,
          description: `Completed: ${task.title}`,
          metadata: { task_id: task.id },
        }]);

      // Log activity
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          action: 'task_completed',
          description: `Completed getting started task: ${task.title} (+${task.points})`,
        }]);

      addToast(`🎉 Task completed! +${task.points} points`, 'success');
      setCompletedTasks(prev => new Set([...prev, task.id]));
      setTotalPointsEarned(prev => prev + task.points);

      // Refresh profile to sync points balance
      await refreshProfile();
    } catch (error) {
      console.error('Failed to award task:', error);
    }
  };

  const handleManualCompletion = async (task) => {
    if (completedTasks.has(task.id)) {
      addToast('Task already completed', 'info');
      return;
    }

    await awardTask(task);
  };

  const handleActivityLogClick = async () => {
    localStorage.setItem('viewed_activity_log', 'true');
    const task = GETTING_STARTED_TASKS.find(t => t.id === 'view_activity');
    if (task && !completedTasks.has(task.id)) {
      await awardTask(task);
    }
  };

  const handleCommunityClick = async () => {
    localStorage.setItem('joined_community', 'true');
    const task = GETTING_STARTED_TASKS.find(t => t.id === 'join_community');
    if (task && !completedTasks.has(task.id)) {
      await awardTask(task);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading tasks...</div>
      </div>
    );
  }

  const progressPercent = (completedTasks.size / GETTING_STARTED_TASKS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Getting Started</h1>
        <p className="text-gray-600 mb-6">Complete tasks to earn bonus points</p>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="font-semibold text-gray-700">Progress</p>
            <p className="text-sm text-gray-600">{completedTasks.size} / {GETTING_STARTED_TASKS.length}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">Bonus points earned: {totalPointsEarned}</p>
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          {GETTING_STARTED_TASKS.map((task) => {
            const isCompleted = completedTasks.has(task.id);

            return (
              <div
                key={task.id}
                className={`rounded-lg p-5 border-l-4 transition ${
                  isCompleted
                    ? 'bg-green-50 border-green-500 opacity-75'
                    : 'bg-white border-blue-500 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <span className="text-3xl">{task.icon}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-800">{task.title}</h3>
                        {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Done</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {task.category}
                        </span>
                        <span className="text-xs font-semibold text-amber-600">+{task.points} pts</span>
                      </div>
                    </div>
                  </div>

                  {!isCompleted && task.id === 'view_activity' && (
                    <button
                      onClick={handleActivityLogClick}
                      className="ml-4 px-4 py-2 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 transition whitespace-nowrap"
                    >
                      Visit
                    </button>
                  )}

                  {!isCompleted && task.id === 'join_community' && (
                    <button
                      onClick={handleCommunityClick}
                      className="ml-4 px-4 py-2 bg-blue-500 text-white rounded text-sm font-semibold hover:bg-blue-600 transition whitespace-nowrap"
                    >
                      Follow
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {progressPercent === 100 && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white text-center">
            <p className="text-lg font-bold">🎉 All Tasks Completed!</p>
            <p className="text-sm opacity-90 mt-2">You've earned {totalPointsEarned} bonus points. Keep earning!</p>
          </div>
        )}
      </div>
    </div>
  );
}

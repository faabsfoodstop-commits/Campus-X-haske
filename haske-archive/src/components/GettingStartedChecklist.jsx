import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { ToastContext } from '../context/ToastContext';
import { insertTransaction } from '../utils/databaseHelpers';

const TASKS = [
  {
    id: 'profile',
    title: 'Set Up Your Profile',
    description: 'Add your university, department, and course to unlock all features',
    reward: 1000,
    link: '/profile',
    emoji: '👤',
    color: 'from-violet-500 to-purple-600',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'checkin',
    title: 'Your First Check-In',
    description: 'Check in once to start your daily streak and earn streak bonuses',
    reward: 250,
    link: '/streak',
    emoji: '✅',
    color: 'from-green-500 to-emerald-600',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'video_ad',
    title: 'Watch Your First Ad',
    description: 'Watch a short video ad and earn instant points',
    reward: 250,
    link: '/video-ads',
    emoji: '📺',
    color: 'from-blue-500 to-cyan-600',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'spin',
    title: 'Take Your First Spin',
    description: 'Your first spin is free — try your luck on the wheel',
    reward: 500,
    link: '/spin-wheel',
    emoji: '🎡',
    color: 'from-yellow-500 to-orange-500',
    badgeColor: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'instagram',
    title: 'Follow a Brand',
    description: 'Follow a partner brand on Instagram to earn bonus points',
    reward: 375,
    link: '/instagram-follow',
    emoji: '📱',
    color: 'from-pink-500 to-rose-600',
    badgeColor: 'bg-pink-100 text-pink-700',
  },
  {
    id: 'refer',
    title: 'Invite a Friend',
    description: 'Share your referral code and earn when your friend joins',
    reward: 500,
    link: '/referrals',
    emoji: '👥',
    color: 'from-indigo-500 to-blue-600',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
];

const TOTAL_REWARD = TASKS.reduce((s, t) => s + t.reward, 0);

export default function GettingStartedChecklist() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  // Map of task_id → { completed: bool, pointsAwarded: bool }
  const [taskState, setTaskState] = useState({});
  const [loading, setLoading] = useState(true);
  // Prevent concurrent award calls for the same task
  const awardingRef = useRef(new Set());

  // ─── DB detection ──────────────────────────────────────────────────────────
  const detectCompletions = useCallback(async (session) => {
    const uid = session.user.id;

    const [
      { data: userData },
      { data: checkIns },
      { data: adRows },
      { data: spinRows },
      { data: igRows },
      { data: referralRows },
      { data: taskRows },
    ] = await Promise.all([
      supabase.from('users').select('profile_complete, university, department, course').eq('id', uid).maybeSingle(),
      supabase.from('streak_check_ins').select('id').eq('user_id', uid).limit(1),
      supabase.from('video_ads_watched').select('id').eq('user_id', uid).limit(1),
      supabase.from('spin_history').select('id').eq('user_id', uid).limit(1),
      supabase.from('instagram_follows').select('id').eq('user_id', uid).eq('verified', true).limit(1),
      supabase.from('referrals').select('id').eq('referrer_id', uid).limit(1),
      supabase.from('getting_started_tasks').select('task_id, points_awarded').eq('user_id', uid),
    ]);

    const awarded = new Set((taskRows || []).filter(t => t.points_awarded).map(t => t.task_id));

    const detected = {
      profile: !!(userData?.profile_complete || (userData?.university && userData?.department && userData?.course)),
      checkin: (checkIns?.length || 0) > 0,
      video_ad: (adRows?.length || 0) > 0,
      spin: (spinRows?.length || 0) > 0,
      instagram: (igRows?.length || 0) > 0,
      refer: (referralRows?.length || 0) > 0,
    };

    return { detected, awarded };
  }, []);

  // ─── Award a task (atomic: insert row → update points → log tx) ───────────
  const awardTask = useCallback(async (session, task) => {
    if (awardingRef.current.has(task.id)) return;
    awardingRef.current.add(task.id);
    const uid = session.user.id;

    try {
      // Insert task row as duplicate guard — fails silently if already awarded
      const { error: insertError } = await supabase.from('getting_started_tasks').insert({
        user_id: uid,
        task_id: task.id,
        task_name: task.title,
        reward_points: task.reward,
        completed: true,
        completed_at: new Date().toISOString(),
        points_awarded: true,
      });

      if (insertError) {
        // Duplicate constraint hit — already awarded, just update local state
        setTaskState(prev => ({
          ...prev,
          [task.id]: { completed: true, pointsAwarded: true },
        }));
        return;
      }

      // Fetch fresh points then update
      const { data: freshUser } = await supabase
        .from('users').select('points').eq('id', uid).single();
      if (!freshUser) throw new Error('Could not fetch user points');

      const newPoints = freshUser.points + task.reward;
      const { data: updated } = await supabase
        .from('users').update({ points: newPoints }).eq('id', uid).select('id');

      if (!updated?.length) {
        // Rollback task row
        await supabase.from('getting_started_tasks').delete()
          .eq('user_id', uid).eq('task_id', task.id);
        throw new Error('Points update blocked — try again');
      }

      await insertTransaction(uid, 'getting_started', task.reward, `Getting Started: ${task.title}`);

      setTaskState(prev => ({
        ...prev,
        [task.id]: { completed: true, pointsAwarded: true },
      }));

      addToast(`${task.emoji} ${task.title} complete! +${task.reward} pts`, 'success');
    } catch (err) {
      console.error('[GettingStarted] awardTask error:', err);
    } finally {
      awardingRef.current.delete(task.id);
    }
  }, [addToast]);

  // ─── Main refresh: detect completions, award newly done tasks ─────────────
  const refresh = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { detected, awarded } = await detectCompletions(session);

      // Update state for all tasks
      const next = {};
      for (const task of TASKS) {
        next[task.id] = {
          completed: detected[task.id] || awarded.has(task.id),
          pointsAwarded: awarded.has(task.id),
        };
      }
      setTaskState(next);

      // Auto-award any newly detected tasks that haven't been awarded yet
      for (const task of TASKS) {
        if (detected[task.id] && !awarded.has(task.id)) {
          await awardTask(session, task);
        }
      }
    } catch (err) {
      console.error('[GettingStarted] refresh error:', err);
    }
  }, [detectCompletions, awardTask]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Re-check when user returns to this tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  // ─── Derived stats ─────────────────────────────────────────────────────────
  const awardedCount = TASKS.filter(t => taskState[t.id]?.pointsAwarded).length;
  const earnedPts = TASKS.filter(t => taskState[t.id]?.pointsAwarded).reduce((s, t) => s + t.reward, 0);
  const progressPct = (awardedCount / TASKS.length) * 100;
  const allDone = awardedCount === TASKS.length;

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🚀</span>
          <h3 className="text-xl font-bold text-gray-800">Getting Started</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <div>
              <h3 className="text-xl font-bold">Getting Started</h3>
              <p className="text-indigo-200 text-sm">Complete tasks to unlock your full earning potential</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs">Earned</p>
            <p className="text-2xl font-bold">+{earnedPts.toLocaleString()}</p>
            <p className="text-indigo-200 text-xs">of {TOTAL_REWARD.toLocaleString()} pts</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-indigo-200 mb-1">
            <span>{awardedCount}/{TASKS.length} tasks complete</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2.5">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="divide-y divide-gray-50">
        {TASKS.map((task) => {
          const state = taskState[task.id] || {};
          const done = state.pointsAwarded;
          const detected = state.completed && !done;

          return (
            <div
              key={task.id}
              className={`flex items-center gap-4 px-5 py-4 transition-colors ${done ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
            >
              {/* Status indicator */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${done ? 'bg-green-100' : 'bg-gray-100'}`}>
                {done ? '✓' : task.emoji}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {task.title}
                  </p>
                  {detected && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium animate-pulse">
                      Awarding…
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
              </div>

              {/* Reward + action */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-sm font-bold ${done ? 'text-gray-400' : 'text-primary'}`}>
                  +{task.reward}
                </span>
                {done ? (
                  <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">✓</span>
                ) : (
                  <button
                    onClick={() => navigate(task.link)}
                    className="text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition"
                  >
                    Start
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* All done banner */}
      {allDone && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-lg">Onboarding Complete!</p>
          <p className="text-green-100 text-sm">You've earned {TOTAL_REWARD.toLocaleString()} pts. Keep exploring to earn more!</p>
        </div>
      )}
    </div>
  );
}

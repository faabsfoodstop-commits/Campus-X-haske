import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { ToastContext } from '../context/ToastContext';
import Button from './Button';
import { recordGettingStartedActivity, updateUserPoints, insertTransaction } from '../utils/databaseHelpers';
import './GettingStartedChecklist.css';

// Icon Components
const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CheckinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChallengeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const PurchaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const ReferralIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ICONS = {
  profile: ProfileIcon,
  checkin: CheckinIcon,
  challenge: ChallengeIcon,
  purchase: PurchaseIcon,
  refer: ReferralIcon,
};

export default function GettingStartedChecklist() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const [checklist, setChecklist] = useState([
    { id: 'profile', title: 'Complete Your Profile', reward: 1000, iconKey: 'profile', completed: false, pointsAwarded: false, link: '/profile' },
    { id: 'checkin', title: 'Check In 7 Days', reward: 70, iconKey: 'checkin', completed: false, pointsAwarded: false, progress: 0, target: 7, link: '/dashboard' },
    { id: 'challenge', title: 'Join a Weekly Challenge', reward: 100, iconKey: 'challenge', completed: false, pointsAwarded: false, link: '/weekly-challenges' },
    { id: 'purchase', title: 'Make Your First Purchase', reward: 150, iconKey: 'purchase', completed: false, pointsAwarded: false, link: '/buy-points' },
    { id: 'refer', title: 'Refer a Friend', reward: 50, iconKey: 'refer', completed: false, pointsAwarded: false, link: '/referrals' },
  ]);
  const [totalReward, setTotalReward] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDataAndCheckTasks();
  }, []);

  useEffect(() => {
    calculateReward();
  }, [checklist]);

  const fetchUserDataAndCheckTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user data to check task statuses
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('profile_complete, points')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;

      // Fetch getting started tasks from database
      const { data: dbTasks, error: tasksError } = await supabase
        .from('getting_started_tasks')
        .select('task_id, points_awarded')
        .eq('user_id', session.user.id);

      if (tasksError && tasksError.code !== 'PGRST116') throw tasksError;

      // Create a map of completed tasks
      const completedMap = {};
      if (dbTasks) {
        dbTasks.forEach(task => {
          completedMap[task.task_id] = {
            completed: !!task.points_awarded,
            pointsAwarded: !!task.points_awarded
          };
        });
      }

      // Fetch check-in progress
      let checkInProgress = 0;
      try {
        const { data: checkIns } = await supabase
          .from('streak_check_ins')
          .select('check_in_date')
          .eq('user_id', session.user.id);
        if (checkIns) {
          const uniqueDates = new Set(checkIns.map(ci => ci.check_in_date));
          checkInProgress = uniqueDates.size;
        }
      } catch (err) {
        console.warn('Error fetching check-in progress:', err);
      }

      // Update checklist based on actual user data
      const updatedChecklist = checklist.map(item => {
        const dbTask = completedMap[item.id] || {};
        let completed = false;
        let pointsAwarded = dbTask.pointsAwarded || false;
        let progress = 0;

        // Check if task should be marked complete based on user data
        if (item.id === 'profile' && (userData?.profile_complete || (userData?.university && userData?.department && userData?.course))) {
          completed = true;
        } else if (item.id === 'checkin') {
          progress = checkInProgress;
          completed = checkInProgress >= 7;
        } else if (item.id === 'challenge') {
          // This requires checking weekly_challenges table
          completed = dbTask.completed || false;
        } else if (item.id === 'purchase') {
          // This requires checking purchases table
          completed = dbTask.completed || false;
        } else if (item.id === 'refer') {
          // This requires checking referrals table
          completed = dbTask.completed || false;
        }

        return {
          ...item,
          completed,
          pointsAwarded,
          progress: item.id === 'checkin' ? progress : item.progress
        };
      });

      setChecklist(updatedChecklist);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching getting started data:', err);
      setLoading(false);
    }
  };

  const calculateReward = () => {
    const completed = checklist.filter(item => item.completed && item.pointsAwarded).length;
    const total = checklist.reduce((sum, item) => sum + item.reward, 0);
    setTotalReward(Math.round((completed / checklist.length) * total));
  };

  const startTask = (item) => {
    navigate(item.link);
  };

  const markTaskComplete = async (id) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const item = checklist.find(i => i.id === id);
      if (!item) throw new Error('Task not found');

      // Record task completion first (guards against double-award)
      const result = await recordGettingStartedActivity(session.user.id, id, item.title, item.reward);

      if (!result.success) {
        if (result.error?.includes('already completed')) {
          addToast('This task has already been completed!', 'info');
        } else {
          throw new Error(result.error || 'Failed to record task');
        }
        return;
      }

      // Fetch fresh points from DB (never use stale local state)
      const { data: freshUser, error: fetchError } = await supabase
        .from('users').select('points').eq('id', session.user.id).single();
      if (fetchError || !freshUser) throw new Error('Failed to fetch current points');

      const updated = await updateUserPoints(session.user.id, freshUser.points + item.reward);
      if (!updated) {
        // Rollback the getting_started_tasks row
        if (result.activityId) {
          await supabase.from('getting_started_tasks').delete().eq('id', result.activityId);
        }
        throw new Error('Failed to update points. Please try again.');
      }

      // Log transaction after points are confirmed
      await insertTransaction(session.user.id, 'getting_started', item.reward,
        `Getting Started: ${item.title}`);

      // Update local state
      const newChecklist = checklist.map(task =>
        task.id === id ? { ...task, completed: true, pointsAwarded: true } : task
      );
      setChecklist(newChecklist);
      addToast(`🎉 Earned ${item.reward} bonus points!`, 'success');
    } catch (err) {
      console.error('Error awarding task:', err);
      addToast('Failed to award task. Please try again.', 'error');
    }
  };

  const completedCount = checklist.filter(item => item.pointsAwarded).length;
  const progressPercent = (completedCount / checklist.length) * 100;
  const allComplete = completedCount === checklist.length;

  if (loading) {
    return (
      <div className="getting-started-checklist">
        <div className="checklist-header">
          <h3>Getting Started</h3>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="getting-started-checklist">
      <div className="checklist-header">
        <div className="header-top">
          <h3>Getting Started</h3>
          <div className="progress-badge">
            <span className="badge-label">Progress</span>
            <span className="badge-value">{completedCount}/{checklist.length}</span>
          </div>
        </div>
        <p>Complete these tasks to earn bonus points and unlock your full potential</p>
      </div>

      <div className="checklist-progress">
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="progress-stats">
            <span className="stat-text">{Math.round(progressPercent)}% complete</span>
            <span className="reward-badge">+{totalReward} pts</span>
          </div>
        </div>
      </div>

      <div className="checklist-items">
        {checklist.map(item => {
          const IconComponent = ICONS[item.iconKey];
          return (
            <div key={item.id} className={`checklist-item ${item.completed ? 'completed' : ''} ${item.pointsAwarded ? 'points-awarded' : ''} ${allComplete ? 'all-complete' : ''}`}>
              <div className="item-icon">
                <IconComponent />
              </div>

              <div className="item-content">
                <div className="item-title">{item.title}</div>
                {item.progress !== undefined && (
                  <div className="item-progress">
                    {item.progress} of {item.target} check-ins
                  </div>
                )}
              </div>

              <div className="item-actions">
                <div className="item-reward">+{item.reward}</div>
                {!item.completed && (
                  <Button
                    onClick={() => startTask(item)}
                    variant="primary"
                    size="sm"
                    className="item-check-button"
                  >
                    Start
                  </Button>
                )}
                {item.completed && !item.pointsAwarded && (
                  <Button
                    onClick={() => markTaskComplete(item.id)}
                    variant="primary"
                    size="sm"
                    className="item-check-button"
                  >
                    Claim
                  </Button>
                )}
                {item.pointsAwarded && (
                  <div className="item-checkmark">
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allComplete && (
        <div className="checklist-celebration">
          <div className="celebration-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
              <polyline points="9 13 12 16 16 12" />
            </svg>
          </div>
          <h4>Onboarding Complete!</h4>
          <p>You've unlocked all starter tasks. Continue earning points and trading them for rewards.</p>
        </div>
      )}
    </div>
  );
}

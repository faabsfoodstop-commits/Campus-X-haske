import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { IconTrendingUp, IconStar } from '../components/Icons';

export default function ActivityLog() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  const activityColors = {
    spin: '#fbbf24',
    trivia: '#60a5fa',
    'check-in': '#34d399',
    'getting-started': '#f87171',
  };

  const activityIcons = {
    spin: '🎡',
    trivia: '🧠',
    'check-in': '✅',
    'getting-started': '🚀',
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user data
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (user) {
        setUserData(user);
        setUser(session.user);
      }

      // Fetch all activity sources in parallel
      const [spinData, triviaData, checkinData, tasksData] = await Promise.all([
        supabase
          .from('spin_history')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('trivia_results')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('streak_check_ins')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('getting_started_tasks')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('points_awarded', true)
          .order('completed_at', { ascending: false }),
      ]);

      // Combine all activities
      const allActivities = [];

      // Add spin activities
      if (spinData.data) {
        spinData.data.forEach(spin => {
          allActivities.push({
            id: `spin-${spin.id}`,
            type: 'spin',
            title: `Spin Wheel - ${spin.result}`,
            points: spin.earned_points || 0,
            timestamp: spin.created_at,
            details: `Won: ${spin.result}`,
          });
        });
      }

      // Add trivia activities
      if (triviaData.data) {
        triviaData.data.forEach(trivia => {
          allActivities.push({
            id: `trivia-${trivia.id}`,
            type: 'trivia',
            title: `Trivia Game`,
            points: trivia.points_earned || 0,
            timestamp: trivia.created_at,
            details: `Score: ${trivia.score} | ${trivia.correct_answers}/10 correct`,
          });
        });
      }

      // Add check-in activities
      if (checkinData.data) {
        checkinData.data.forEach(checkin => {
          allActivities.push({
            id: `checkin-${checkin.id}`,
            type: 'check-in',
            title: `Daily Check-In`,
            points: checkin.points_earned || 10,
            timestamp: checkin.created_at,
            details: `Checked in on ${checkin.check_in_date}`,
          });
        });
      }

      // Add getting started task activities
      if (tasksData.data) {
        tasksData.data.forEach(task => {
          allActivities.push({
            id: `task-${task.id}`,
            type: 'getting-started',
            title: task.task_name,
            points: task.reward_points || 0,
            timestamp: task.completed_at,
            details: `Onboarding bonus`,
          });
        });
      }

      // Sort by timestamp, newest first
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setActivities(allActivities);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setLoading(false);
    }
  };

  const filteredActivities = filterType === 'all'
    ? activities
    : activities.filter(a => a.type === filterType);

  const totalPoints = filteredActivities.reduce((sum, a) => sum + a.points, 0);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary text-sm font-semibold"
              >
                ← Back
              </button>
              <div className="flex items-center gap-2 text-lg font-bold text-primary">
                <IconStar className="w-5 h-5" />
                {userData?.points || 0} pts
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <IconTrendingUp className="w-8 h-8" />
            <h2 className="text-3xl font-bold">Activity Log</h2>
          </div>
          <p className="text-blue-100">Track your points earned from all activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Activities</div>
            <div className="text-2xl font-bold text-primary">{filteredActivities.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Points Earned</div>
            <div className="text-2xl font-bold text-green-600">+{totalPoints}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Spins</div>
            <div className="text-2xl font-bold text-yellow-600">
              {activities.filter(a => a.type === 'spin').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Check-Ins</div>
            <div className="text-2xl font-bold text-green-600">
              {activities.filter(a => a.type === 'check-in').length}
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            onClick={() => setFilterType('all')}
            variant={filterType === 'all' ? 'primary' : 'secondary'}
            size="sm"
          >
            All
          </Button>
          <Button
            onClick={() => setFilterType('spin')}
            variant={filterType === 'spin' ? 'primary' : 'secondary'}
            size="sm"
          >
            🎡 Spins
          </Button>
          <Button
            onClick={() => setFilterType('trivia')}
            variant={filterType === 'trivia' ? 'primary' : 'secondary'}
            size="sm"
          >
            🧠 Trivia
          </Button>
          <Button
            onClick={() => setFilterType('check-in')}
            variant={filterType === 'check-in' ? 'primary' : 'secondary'}
            size="sm"
          >
            ✅ Check-Ins
          </Button>
          <Button
            onClick={() => setFilterType('getting-started')}
            variant={filterType === 'getting-started' ? 'primary' : 'secondary'}
            size="sm"
          >
            🚀 Onboarding
          </Button>
        </div>

        {/* Activities List */}
        <div className="space-y-3">
          {filteredActivities.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No activities found</p>
            </div>
          ) : (
            filteredActivities.map(activity => (
              <div
                key={activity.id}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${activityColors[activity.type]}20` }}
                    >
                      {activityIcons[activity.type]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                      <p className="text-sm text-gray-600">{activity.details}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-green-600">+{activity.points}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

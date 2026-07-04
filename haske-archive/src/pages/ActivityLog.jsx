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
    check_in: '#34d399',
    getting_started: '#f87171',
    mission: '#a78bfa',
    challenge: '#ec4899',
    video_ad: '#14b8a6',
    referral: '#f59e0b',
    instagram: '#e1306c',
    purchase: '#ef4444',
    redemption: '#ef4444',
    sponsored: '#8b5cf6',
    default: '#6b7280',
  };

  const activityIcons = {
    spin: '🎡',
    trivia: '🧠',
    check_in: '✅',
    getting_started: '🚀',
    mission: '📋',
    challenge: '🏆',
    video_ad: '📺',
    referral: '👥',
    instagram: '📱',
    purchase: '🛒',
    redemption: '💸',
    sponsored: '🏢',
    default: '💰',
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

      // Fetch ALL transactions (unified activity log)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('timestamp', { ascending: false });

      // Transform transactions to activity items
      const allActivities = (transactions || []).map(tx => {
        const typeMap = {
          spin_wheel: { type: 'spin', icon: '🎡', label: 'Spin Wheel' },
          trivia: { type: 'trivia', icon: '🧠', label: 'Trivia Game' },
          check_in: { type: 'check_in', icon: '✅', label: 'Daily Check-In' },
          streak_checkin: { type: 'check_in', icon: '✅', label: 'Daily Check-In' },
          getting_started: { type: 'getting_started', icon: '🚀', label: 'Getting Started' },
          mission: { type: 'mission', icon: '📋', label: 'Daily Mission' },
          weekly_challenge: { type: 'challenge', icon: '🏆', label: 'Weekly Challenge' },
          video_ad: { type: 'video_ad', icon: '📺', label: 'Video Ad' },
          referral: { type: 'referral', icon: '👥', label: 'Referral' },
          instagram_follow: { type: 'instagram', icon: '📱', label: 'Instagram Follow' },
          cosmetic_purchase: { type: 'purchase', icon: '🎨', label: 'Cosmetic Purchase' },
          marketplace: { type: 'purchase', icon: '🛒', label: 'Marketplace Purchase' },
          redemption: { type: 'redemption', icon: '💸', label: 'Reward Redemption' },
          sponsored_mission: { type: 'sponsored', icon: '🏢', label: 'Sponsored Mission' },
        };

        const info = typeMap[tx.type] || { type: 'default', icon: '💰', label: 'Activity' };

        return {
          id: tx.id,
          type: info.type,
          title: tx.description || info.label,
          points: tx.amount || 0,
          timestamp: tx.timestamp,
          details: '',
        };
      });

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

  const totalEarned = filteredActivities.reduce((sum, a) => a.points > 0 ? sum + a.points : sum, 0);
  const totalSpent = filteredActivities.reduce((sum, a) => a.points < 0 ? sum + Math.abs(a.points) : sum, 0);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Activities</div>
            <div className="text-2xl font-bold text-primary">{filteredActivities.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Points Earned</div>
            <div className="text-2xl font-bold text-green-600">+{totalEarned.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Points Spent</div>
            <div className="text-2xl font-bold text-red-500">-{totalSpent.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Net Balance</div>
            <div className={`text-2xl font-bold ${(totalEarned - totalSpent) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {(totalEarned - totalSpent) >= 0 ? '+' : ''}{(totalEarned - totalSpent).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'spin', label: '🎡 Spins' },
            { key: 'trivia', label: '🧠 Trivia' },
            { key: 'check_in', label: '✅ Check-Ins' },
            { key: 'mission', label: '📋 Missions' },
            { key: 'challenge', label: '🏆 Challenges' },
            { key: 'video_ad', label: '📺 Videos' },
            { key: 'referral', label: '👥 Referrals' },
            { key: 'sponsored', label: '🏢 Sponsored' },
            { key: 'purchase', label: '🛒 Purchases' },
            { key: 'redemption', label: '💸 Redemptions' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              onClick={() => setFilterType(key)}
              variant={filterType === key ? 'primary' : 'secondary'}
              size="sm"
            >
              {label}
            </Button>
          ))}
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
                    <div className={`text-2xl font-bold ${activity.points < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {activity.points < 0 ? `-${Math.abs(activity.points).toLocaleString()}` : `+${activity.points.toLocaleString()}`}
                    </div>
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

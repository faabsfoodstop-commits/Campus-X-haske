import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

export default function ActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setActivities(data || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    const icons = {
      daily_check_in: '📅',
      mission_completed: '✅',
      video_watched: '▶️',
      points_earned: '⭐',
      points_spent: '💸',
      referral_bonus: '👥',
      streak_maintained: '🔥',
    };
    return icons[action] || '📌';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading activity...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Activity Log</h1>

        <div className="space-y-2">
          {activities.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-600">No activities yet</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white rounded-lg p-4 border-l-4 border-purple-500 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getActivityIcon(activity.action)}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{activity.action.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {formatDate(activity.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

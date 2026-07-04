import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

export default function RedemptionHistory() {
  const { user } = useAuth();
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchRedemptions();
    }
  }, [user, filter]);

  const fetchRedemptions = async () => {
    try {
      let query = supabase
        .from('redemptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      setRedemptions(data || []);
    } catch (error) {
      console.error('Failed to fetch redemptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      processing: '🔄',
      completed: '✅',
      failed: '❌',
      cancelled: '🚫',
    };
    return icons[status] || '❓';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading redemptions...</div>
      </div>
    );
  }

  const statuses = ['all', 'pending', 'processing', 'completed', 'failed'];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Redemption History</h1>
        <p className="text-gray-600 mb-6">Track all your reward redemptions</p>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg p-4 mb-6 overflow-x-auto">
          <div className="flex space-x-2 whitespace-nowrap">
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Redemptions List */}
        <div className="space-y-3">
          {redemptions.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-2">No redemptions found</p>
              <p className="text-sm text-gray-500">Start earning and redeem your first reward!</p>
            </div>
          ) : (
            redemptions.map(redemption => (
              <div
                key={redemption.id}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{redemption.reward_name}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(redemption.status)}`}>
                        {getStatusIcon(redemption.status)} {redemption.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {redemption.provider} • {formatDate(redemption.created_at)}
                    </p>
                    {redemption.status === 'completed' && redemption.reward_code && (
                      <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                        <p className="text-xs text-green-700">
                          <span className="font-bold">Code:</span> {redemption.reward_code}
                        </p>
                      </div>
                    )}
                    {redemption.status === 'failed' && redemption.failure_reason && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                        <p className="text-xs text-red-700">
                          {redemption.failure_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-purple-600">-{redemption.points_spent}</p>
                    <p className="text-xs text-gray-600">points</p>
                  </div>
                </div>

                {/* Estimated Delivery */}
                {redemption.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      ⏱️ Expected delivery: 24 hours
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Summary Card */}
        {redemptions.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Redeemed</p>
                <p className="text-2xl font-bold text-purple-600">
                  {redemptions.reduce((sum, r) => sum + r.points_spent, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {redemptions.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {redemptions.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

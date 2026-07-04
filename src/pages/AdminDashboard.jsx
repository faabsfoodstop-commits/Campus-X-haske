import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { useToast } from '../hooks/useToast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading2, setLoading2] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && user && !profile?.is_admin) {
      navigate('/dashboard');
    }
  }, [user, loading, profile, navigate]);

  useEffect(() => {
    if (user && profile?.is_admin) {
      fetchStats();
      fetchUsers();
    }
  }, [user, profile]);

  const fetchStats = async () => {
    try {
      const [userCount, totalPoints, activeUsers] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('users').select('points'),
        supabase.from('users').select('id').gt('current_streak', 0).select('id', { count: 'exact' })
      ]);

      const totalPointsAmount = userCount.data ? userCount.data.reduce((sum, u) => sum + (u.points || 0), 0) : 0;

      setStats({
        totalUsers: userCount.count || 0,
        totalPoints: totalPointsAmount,
        activeUsers: activeUsers.count || 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading2(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, points, current_streak, created_at, is_banned')
        .order('points', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading2(false);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_banned: true })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction('ban_user', userId);
      showToast('User banned successfully');
      fetchUsers();
    } catch (error) {
      showToast('Failed to ban user', 'error');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_banned: false })
        .eq('id', userId);

      if (error) throw error;

      await logAdminAction('unban_user', userId);
      showToast('User unbanned successfully');
      fetchUsers();
    } catch (error) {
      showToast('Failed to unban user', 'error');
    }
  };

  const handleAwardPoints = async (userId, points) => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

      const newPoints = (user?.points || 0) + points;

      const { error: updateError } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', userId);

      if (updateError) throw updateError;

      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'admin_award',
        amount: points,
        description: `Admin awarded ${points} points`,
        metadata: { awarded_by: user.id }
      });

      await logAdminAction('award_points', userId, { points });
      showToast(`Awarded ${points} points`);
      fetchUsers();
    } catch (error) {
      showToast('Failed to award points', 'error');
    }
  };

  const logAdminAction = async (action, targetUserId, details = {}) => {
    try {
      await supabase.from('admin_logs').insert({
        admin_id: user.id,
        action,
        target_user_id: targetUserId,
        details
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, monitor system health, and control platform settings</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-600 text-sm mb-1">Total Users</p>
              <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-600 text-sm mb-1">Points in Circulation</p>
              <p className="text-4xl font-bold text-purple-600">{stats.totalPoints.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-600 text-sm mb-1">Active Streaks</p>
              <p className="text-4xl font-bold text-orange-600">{stats.activeUsers}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">User Management</h2>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {loading2 ? (
            <div className="text-center py-8 text-gray-600">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Points</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Streak</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{u.full_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{u.points}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{u.current_streak} 🔥</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.is_banned
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {u.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => {
                            const points = prompt('Enter points to award:');
                            if (points) {
                              handleAwardPoints(u.id, parseInt(points));
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Award
                        </button>
                        {u.is_banned ? (
                          <button
                            onClick={() => handleUnbanUser(u.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(u.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin-analytics')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">📊</p>
            <p className="font-semibold">Analytics</p>
            <p className="text-sm text-blue-100">View detailed reports</p>
          </button>
          <button
            onClick={() => navigate('/admin-settings')}
            className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-lg p-6 hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">⚙️</p>
            <p className="font-semibold">Settings</p>
            <p className="text-sm text-gray-100">Configure platform</p>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">🏠</p>
            <p className="font-semibold">Back to Dashboard</p>
            <p className="text-sm text-purple-100">Return to user view</p>
          </button>
        </div>
      </div>
    </div>
  );
}

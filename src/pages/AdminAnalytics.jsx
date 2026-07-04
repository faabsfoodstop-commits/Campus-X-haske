import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading2, setLoading2] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && user && !profile?.is_admin) {
      navigate('/dashboard');
    }
  }, [user, loading, profile, navigate]);

  useEffect(() => {
    if (user && profile?.is_admin) {
      fetchAnalytics();
    }
  }, [user, profile]);

  const fetchAnalytics = async () => {
    try {
      setLoading2(true);

      const [users, transactions, redemptions, referrals] = await Promise.all([
        supabase.from('users').select('id, points, wallet, current_streak, created_at'),
        supabase.from('transactions').select('type, amount, created_at'),
        supabase.from('redemptions').select('points_spent, status, created_at'),
        supabase.from('referrals').select('status, created_at')
      ]);

      const totalUsers = users.data?.length || 0;
      const avgPoints = users.data ? users.data.reduce((sum, u) => sum + (u.points || 0), 0) / totalUsers : 0;
      const avgStreak = users.data ? users.data.reduce((sum, u) => sum + (u.current_streak || 0), 0) / totalUsers : 0;

      const transactionsByType = {};
      transactions.data?.forEach(t => {
        transactionsByType[t.type] = (transactionsByType[t.type] || 0) + t.amount;
      });

      const redemptionsByStatus = {};
      redemptions.data?.forEach(r => {
        redemptionsByStatus[r.status] = (redemptionsByStatus[r.status] || 0) + 1;
      });

      const referralsByStatus = {};
      referrals.data?.forEach(r => {
        referralsByStatus[r.status] = (referralsByStatus[r.status] || 0) + 1;
      });

      setStats({
        totalUsers,
        avgPoints: Math.round(avgPoints),
        avgStreak: Math.round(avgStreak * 10) / 10,
        transactionsByType,
        redemptionsByStatus,
        referralsByStatus,
        totalTransactions: transactions.data?.length || 0,
        totalRedemptions: redemptions.data?.length || 0,
        totalReferrals: referrals.data?.length || 0
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading2(false);
    }
  };

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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform statistics and insights</p>
        </div>

        {loading2 ? (
          <div className="text-center py-12 text-gray-600">Loading analytics...</div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-600 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-600 text-sm mb-1">Avg Points/User</p>
                <p className="text-3xl font-bold text-purple-600">{stats.avgPoints}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-600 text-sm mb-1">Avg Streak</p>
                <p className="text-3xl font-bold text-orange-600">{stats.avgStreak}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <p className="text-gray-600 text-sm mb-1">Total Transactions</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalTransactions}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Transactions by Type</h2>
                <div className="space-y-3">
                  {Object.entries(stats.transactionsByType).map(([type, amount]) => (
                    <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-700 capitalize">{type}</span>
                      <span className={`font-bold ${amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {amount > 0 ? '+' : ''}{amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Redemptions Summary</h2>
                <div className="space-y-3">
                  {Object.entries(stats.redemptionsByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-700 capitalize">{status}</span>
                      <span className="font-bold text-blue-600">{count}</span>
                    </div>
                  ))}
                  <div className="text-xs text-gray-600 mt-3 p-3 bg-blue-50 rounded-lg">
                    Total Redemption Requests: {stats.totalRedemptions}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Referral Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(stats.referralsByStatus).map(([status, count]) => (
                  <div key={status} className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <p className="text-gray-600 text-sm capitalize mb-1">{status}</p>
                    <p className="text-3xl font-bold text-purple-600">{count}</p>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-600 mt-4 p-3 bg-purple-50 rounded-lg">
                Total Referral Links Generated: {stats.totalReferrals}
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition"
              >
                ← Back to Admin Dashboard
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

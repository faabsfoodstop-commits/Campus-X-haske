import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filter]);

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data } = await query;
      setTransactions(data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      daily_check_in: '📅',
      mission_completed: '✅',
      video_watched: '▶️',
      reward_redeemed: '🎁',
      referral_bonus: '👥',
      points_purchased: '💳',
      points_sold: '💰',
    };
    return icons[type] || '💸';
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

  const transactionTypes = [
    'all',
    'daily_check_in',
    'mission_completed',
    'video_watched',
    'reward_redeemed',
    'referral_bonus',
    'points_purchased',
    'points_sold',
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Points Ledger</h1>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg p-4 mb-6 overflow-x-auto">
          <div className="flex space-x-2 whitespace-nowrap">
            {transactionTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{getTypeIcon(transaction.type)}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>
                <div
                  className={`text-lg font-bold ${
                    transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                </div>
              </div>
            ))
          )}
        </div>

        {transactions.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white text-center">
            <p className="text-sm opacity-90 mb-2">Total Transactions</p>
            <p className="text-3xl font-bold">{transactions.length}</p>
          </div>
        )}
      </div>
    </div>
  );
}

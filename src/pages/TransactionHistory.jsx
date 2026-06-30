import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTransactions(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.toDate?.() || timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter);

  const stats = {
    totalSpent: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    totalPoints: transactions.reduce((sum, t) => sum + (t.points || 0), 0),
    transactionCount: transactions.length
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-primary">Transaction History</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm mb-2">Total Spent</p>
            <p className="text-4xl font-bold text-blue-600">₦{stats.totalSpent.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-2">on point purchases</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm mb-2">Points Purchased</p>
            <p className="text-4xl font-bold text-green-600">{stats.totalPoints.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-2">total acquired</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm mb-2">Transactions</p>
            <p className="text-4xl font-bold text-purple-600">{stats.transactionCount}</p>
            <p className="text-xs text-gray-600 mt-2">total purchases</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {['all', 'point_purchase', 'reward_redemption', 'point_sale'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-semibold border-b-2 transition capitalize ${
                filter === f
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-primary'
              }`}
            >
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">No transactions yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-700 font-semibold">Date & Time</th>
                    <th className="px-6 py-3 text-left text-gray-700 font-semibold">Type</th>
                    <th className="px-6 py-3 text-right text-gray-700 font-semibold">Amount</th>
                    <th className="px-6 py-3 text-right text-gray-700 font-semibold">Points</th>
                    <th className="px-6 py-3 text-left text-gray-700 font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-gray-700 font-semibold">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-800">
                        {formatDate(transaction.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                          {transaction.type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-primary">
                        ₦{transaction.amount?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">
                        {transaction.points?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm font-mono">
                        {transaction.reference?.substring(0, 12)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-50 border-l-4 border-primary rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">📋 About Your Transactions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-primary mb-2">Point Purchases</p>
              <p className="text-xs">Payments you've made to buy points directly.</p>
            </div>
            <div>
              <p className="font-semibold text-primary mb-2">Reward Redemptions</p>
              <p className="text-xs">Points you've spent on rewards (airtime, data, etc).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

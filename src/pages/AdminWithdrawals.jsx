import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { auth, db } from '../config/firebase';
import Button from '../components/Button';
import { IconArrowLeft, IconCheckmark, IconX } from '../components/Icons';

export default function AdminWithdrawals() {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists() && userDoc.data().isAdmin) {
        setIsAdmin(true);
        await fetchWithdrawals();
      } else {
        navigate('/dashboard');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error checking admin:', err);
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const withdrawalsQuery = query(
        collection(db, 'withdrawals'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(withdrawalsQuery);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      setWithdrawals(data);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  };

  const handleWithdrawal = async (withdrawalId, approved) => {
    setProcessing(prev => ({ ...prev, [withdrawalId]: true }));

    try {
      // Call Cloud Function to process withdrawal
      const functions = getFunctions();
      const adminProcessWithdrawal = httpsCallable(functions, 'adminProcessWithdrawal');

      await adminProcessWithdrawal({
        withdrawalId,
        approved
      });

      // Refresh list
      await fetchWithdrawals();
      alert(approved ? 'Withdrawal approved and processed!' : 'Withdrawal rejected');
    } catch (err) {
      console.error('Error processing withdrawal:', err);
      alert('Error: ' + err.message);
    } finally {
      setProcessing(prev => ({ ...prev, [withdrawalId]: false }));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="flex items-center justify-center h-screen">Admin access required</div>;
  }

  const filteredWithdrawals = filter === 'all'
    ? withdrawals
    : withdrawals.filter(w => w.status === filter);

  const stats = {
    pending: withdrawals.filter(w => w.status === 'pending').length,
    pendingAmount: withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0),
    approved: withdrawals.filter(w => w.status === 'approved').length,
    approvedAmount: withdrawals
      .filter(w => w.status === 'approved')
      .reduce((sum, w) => sum + w.amount, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <IconArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-primary">Withdrawal Management</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Pending Requests</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-500 mt-1">₦{stats.pendingAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Approved Today</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-sm text-gray-500 mt-1">₦{stats.approvedAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Withdrawals</p>
            <p className="text-3xl font-bold text-blue-600">{withdrawals.length}</p>
            <p className="text-sm text-gray-500 mt-1">
              ₦{withdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Processing Time</p>
            <p className="text-3xl font-bold text-primary">2-3 days</p>
            <p className="text-sm text-gray-500 mt-1">Average</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Withdrawals List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Method</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Bank Details</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredWithdrawals.map(withdrawal => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">User {withdrawal.userId.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">{withdrawal.userId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">₦{withdrawal.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700 capitalize">{withdrawal.method.replace('_', ' ')}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {withdrawal.bankDetails ? (
                        <div className="text-gray-700">
                          <p className="font-semibold">{withdrawal.bankDetails.accountName}</p>
                          <p>{withdrawal.bankDetails.bankName}</p>
                          <p>•••• {withdrawal.bankDetails.accountNumber.slice(-4)}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">N/A</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {withdrawal.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {withdrawal.status === 'pending' ? '⏳ Pending' :
                         withdrawal.status === 'approved' ? '✓ Approved' :
                         '✗ Rejected'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {withdrawal.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleWithdrawal(withdrawal.id, true)}
                            variant="primary"
                            size="sm"
                            loading={processing[withdrawal.id]}
                          >
                            <IconCheckmark className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleWithdrawal(withdrawal.id, false)}
                            variant="secondary"
                            size="sm"
                            loading={processing[withdrawal.id]}
                          >
                            <IconX className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {withdrawal.status !== 'pending' && (
                        <p className="text-sm text-gray-600">
                          {withdrawal.processedAt ? `Processed ${new Date(withdrawal.processedAt).toLocaleDateString()}` : 'N/A'}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredWithdrawals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No {filter} withdrawals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

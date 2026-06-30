import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Button from '../components/Button';
import { IconArrowLeft } from '../components/Icons';

export default function Wallet() {
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank_transfer');
  const [bankDetails, setBankDetails] = useState({ accountName: '', accountNumber: '', bankName: '' });
  const [showBankForm, setShowBankForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }

      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const transactionsDocs = await getDocs(transactionsQuery);
      const transactionsList = transactionsDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(transactionsList);

      const withdrawalsQuery = query(
        collection(db, 'withdrawals'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const withdrawalsDocs = await getDocs(withdrawalsQuery);
      const withdrawalsList = withdrawalsDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setWithdrawals(withdrawalsList);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawalAmount) > (userData?.wallet || 0)) {
      alert('Insufficient funds');
      return;
    }

    try {
      await addDoc(collection(db, 'withdrawals'), {
        userId: auth.currentUser.uid,
        amount: parseFloat(withdrawalAmount),
        method: withdrawalMethod,
        bankDetails: withdrawalMethod === 'bank_transfer' ? bankDetails : null,
        status: 'pending',
        createdAt: serverTimestamp(),
        processedAt: null
      });

      setWithdrawalAmount('');
      setShowWithdrawalForm(false);
      await fetchWalletData();
      alert('Withdrawal request submitted! You will receive your funds within 2-3 business days.');
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      alert('Failed to request withdrawal');
    }
  };

  const handleUpdateBankDetails = async () => {
    if (!bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.accountName) {
      alert('Please fill in all bank details');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        bankDetails: bankDetails
      });
      setUserData({ ...userData, bankDetails });
      setShowBankForm(false);
      alert('Bank details updated successfully');
    } catch (err) {
      console.error('Error updating bank details:', err);
    }
  };

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const totalEarnedThisMonth = transactions
    .filter(t => {
      const txDate = new Date(t.timestamp?.toDate?.() || t.timestamp);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      return txDate >= thisMonth && t.type === 'credit';
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalSpentThisMonth = transactions
    .filter(t => {
      const txDate = new Date(t.timestamp?.toDate?.() || t.timestamp);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      return txDate >= thisMonth && t.type === 'debit';
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const approvedWithdrawals = withdrawals.filter(w => w.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <IconArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-primary">Wallet</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary to-blue-600 text-white rounded-lg p-6">
            <p className="text-blue-100 text-sm font-semibold mb-1">Wallet Balance</p>
            <p className="text-3xl font-bold">₦{(userData?.wallet || 0).toLocaleString()}</p>
            <p className="text-blue-100 text-xs mt-2">Ready to withdraw</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
            <p className="text-green-100 text-sm font-semibold mb-1">Earned This Month</p>
            <p className="text-3xl font-bold">₦{totalEarnedThisMonth.toLocaleString()}</p>
            <p className="text-green-100 text-xs mt-2">From activities & referrals</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
            <p className="text-orange-100 text-sm font-semibold mb-1">Spent This Month</p>
            <p className="text-3xl font-bold">₦{totalSpentThisMonth.toLocaleString()}</p>
            <p className="text-orange-100 text-xs mt-2">On ads & premium features</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => navigate('/buy-points')}
            variant="primary"
            fullWidth
            size="lg"
          >
            + Add Funds
          </Button>
          <Button
            onClick={() => {
              if (!userData?.bankDetails?.accountNumber) {
                setShowBankForm(true);
              } else {
                setShowWithdrawalForm(true);
              }
            }}
            variant="secondary"
            fullWidth
            size="lg"
          >
            💸 Withdraw
          </Button>
          <Button
            onClick={() => navigate('/point-market')}
            variant="secondary"
            fullWidth
            size="lg"
          >
            📊 Trade Points
          </Button>
        </div>

        {/* Pending Withdrawals Alert */}
        {pendingWithdrawals.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-8">
            <p className="font-semibold text-blue-900">
              🔄 You have {pendingWithdrawals.length} pending withdrawal(s)
            </p>
            <p className="text-blue-800 text-sm mt-1">
              Total: ₦{pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
            </p>
            <p className="text-blue-700 text-xs mt-2">
              Withdrawals typically process within 2-3 business days
            </p>
          </div>
        )}

        {/* Withdrawal Form Modal */}
        {showWithdrawalForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Request Withdrawal</h3>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Amount (₦)</label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-600 mt-1">Available: ₦{(userData?.wallet || 0).toLocaleString()}</p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Withdrawal Method</label>
                <select
                  value={withdrawalMethod}
                  onChange={(e) => setWithdrawalMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              {/* Show bank details if set */}
              {userData?.bankDetails?.accountNumber && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                  <p className="font-semibold text-gray-800">{userData.bankDetails.accountName}</p>
                  <p className="text-gray-600">{userData.bankDetails.bankName}</p>
                  <p className="text-gray-600">•••• {userData.bankDetails.accountNumber.slice(-4)}</p>
                  <button
                    onClick={() => {
                      setBankDetails(userData.bankDetails);
                      setShowWithdrawalForm(false);
                      setShowBankForm(true);
                    }}
                    className="text-primary text-xs hover:underline mt-2"
                  >
                    Change Bank Details
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowWithdrawalForm(false)}
                  variant="secondary"
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestWithdrawal}
                  variant="primary"
                  fullWidth
                >
                  Request
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bank Details Form Modal */}
        {showBankForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Bank Details</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Account Name</label>
                  <input
                    type="text"
                    value={bankDetails.accountName}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    placeholder="e.g., GTBank, Access Bank"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Account Number</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    placeholder="10 digits"
                    maxLength="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowBankForm(false)}
                  variant="secondary"
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateBankDetails}
                  variant="primary"
                  fullWidth
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal History */}
        {withdrawals.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Withdrawal Requests</h3>
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex justify-between items-center border-b pb-4 last:border-b-0"
                >
                  <div>
                    <p className="font-semibold text-gray-800 capitalize">{withdrawal.method.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(withdrawal.createdAt?.toDate?.() || withdrawal.createdAt).toLocaleDateString()}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                      withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {withdrawal.status === 'pending' ? '⏳ Pending' :
                       withdrawal.status === 'approved' ? '✓ Approved' :
                       '✗ Rejected'}
                    </span>
                  </div>
                  <p className="font-bold text-gray-800">₦{withdrawal.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Transaction History</h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Transactions</option>
              <option value="credit">Credits</option>
              <option value="debit">Debits</option>
            </select>
          </div>

          {filteredTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                  <div>
                    <p className="font-semibold text-gray-800 capitalize">
                      {transaction.type === 'credit' ? '💰 ' : '💸 '}
                      {transaction.description || transaction.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.timestamp?.toDate?.() || transaction.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount?.toLocaleString() || 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

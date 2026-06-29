import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

export default function AdminRedemptions() {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, completed, rejected
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRedemptions();
  }, [filter]);

  const fetchRedemptions = async () => {
    try {
      let q = collection(db, 'redemptions');

      if (filter !== 'all') {
        q = query(collection(db, 'redemptions'), where('status', '==', filter));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.timestamp - a.timestamp);

      setRedemptions(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching redemptions:', err);
      setLoading(false);
    }
  };

  const completeRedemption = async (redemptionId) => {
    try {
      const redemptionRef = doc(db, 'redemptions', redemptionId);
      await updateDoc(redemptionRef, {
        status: 'completed',
        completedAt: new Date(),
        processedBy: auth.currentUser.email
      });

      setNotification({
        type: 'success',
        message: 'Redemption marked as completed'
      });

      await fetchRedemptions();
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error completing redemption:', err);
      setNotification({
        type: 'error',
        message: `Error: ${err.message}`
      });
    }
  };

  const rejectRedemption = async (redemptionId, redemption) => {
    try {
      const redemptionRef = doc(db, 'redemptions', redemptionId);
      await updateDoc(redemptionRef, {
        status: 'rejected',
        completedAt: new Date(),
        rejectionReason: 'Rejected by admin',
        processedBy: auth.currentUser.email
      });

      // Refund points to user
      const userRef = doc(db, 'users', redemption.userId);
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', redemption.userId)));

      if (userDoc.docs.length > 0) {
        const userData = userDoc.docs[0].data();
        await updateDoc(userRef, {
          points: (userData.points || 0) + redemption.pointsRedeemed
        });
      }

      setNotification({
        type: 'success',
        message: 'Redemption rejected and points refunded'
      });

      await fetchRedemptions();
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error rejecting redemption:', err);
      setNotification({
        type: 'error',
        message: `Error: ${err.message}`
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const stats = {
    pending: redemptions.filter(r => r.status === 'pending').length,
    completed: redemptions.filter(r => r.status === 'completed').length,
    rejected: redemptions.filter(r => r.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE Admin</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-primary"
              >
                Back to Admin
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">💳 Redemptions Manager</h1>
          <p className="text-purple-100 mb-6">Process user reward redemption requests</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Pending</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Completed</p>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm text-purple-100">Rejected</p>
              <p className="text-3xl font-bold">{stats.rejected}</p>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-8 p-4 rounded-lg text-white text-center ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8">
          {['pending', 'completed', 'rejected', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-primary'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({stats[status] || 0})
            </button>
          ))}
        </div>

        {/* Redemptions Table */}
        {redemptions.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">User</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Reward</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Points</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Provider</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Requested</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map(redemption => (
                    <tr key={redemption.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-gray-800">{redemption.userEmail}</div>
                        <div className="text-xs text-gray-500">{redemption.userId.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">{redemption.phoneNumber}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{redemption.rewardName}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-bold text-primary">{redemption.pointsRedeemed}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {redemption.rewardType === 'airtime' && '📱'}
                          {redemption.rewardType === 'data' && '📡'}
                          {redemption.rewardType === 'giftcard' && '🎁'}
                          {' '}{redemption.rewardType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{redemption.provider}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(redemption.timestamp.toDate?.() || redemption.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          redemption.status === 'completed' ? 'bg-green-100 text-green-800' :
                          redemption.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {redemption.status === 'completed' && '✓ Completed'}
                          {redemption.status === 'pending' && '⏳ Pending'}
                          {redemption.status === 'rejected' && '✗ Rejected'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {redemption.status === 'pending' && (
                            <>
                              <button
                                onClick={() => completeRedemption(redemption.id)}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded transition"
                              >
                                ✓ Complete
                              </button>
                              <button
                                onClick={() => rejectRedemption(redemption.id, redemption)}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded transition"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          {redemption.status === 'completed' && (
                            <span className="text-xs text-gray-600">
                              {redemption.completedAt && `Completed: ${new Date(redemption.completedAt.toDate?.() || redemption.completedAt).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-xl text-gray-600">No redemptions found</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-12 rounded">
          <p className="text-blue-800 font-bold mb-3">📝 How to Process Redemptions</p>
          <ul className="text-blue-700 space-y-2 text-sm">
            <li>✓ <strong>For Airtime:</strong> Use Paystack/Flutterwave API or manually top-up via MTN/Airtel/Glo website</li>
            <li>✓ <strong>For Data:</strong> Use telecom provider APIs to send data bundles</li>
            <li>✓ <strong>For Gift Cards:</strong> Send digital code via email or SMS to user's phone</li>
            <li>✓ Click "Complete" once you've verified the reward was sent</li>
            <li>✓ Click "Reject" to cancel and refund points if there's an issue</li>
          </ul>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
            <p className="text-yellow-800 text-xs">
              <strong>Note:</strong> This admin panel is for manual processing. For automated processing, integrate with:
              <br/>• <strong>Paystack API</strong> (Airtime & Data)
              <br/>• <strong>Flutterwave API</strong> (Airtime & Data)
              <br/>• <strong>Opay/Monnify API</strong> (Direct transfers)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

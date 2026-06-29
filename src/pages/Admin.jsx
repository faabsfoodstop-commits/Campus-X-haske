import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [buyPoints, setBuyPoints] = useState('');
  const [buyPrice, setBuyPrice] = useState('0.40');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!auth.currentUser) return;

      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);

        const totalUsers = usersList.length;
        const totalWallet = usersList.reduce((sum, u) => sum + (u.wallet || 0), 0);
        const totalPoints = usersList.reduce((sum, u) => sum + (u.points || 0), 0);

        setStats({
          totalUsers,
          totalWallet,
          totalPoints,
          avgBalance: totalUsers > 0 ? (totalWallet / totalUsers).toFixed(2) : 0,
        });
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handlePostBuyOffer = async (e) => {
    e.preventDefault();
    if (!buyPoints || !buyPrice) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'point_buy_offers'), {
        offeredBy: 'admin',
        points: parseInt(buyPoints),
        offerPrice: parseFloat(buyPrice),
        totalValue: parseInt(buyPoints) * parseFloat(buyPrice),
        status: 'active',
        createdAt: new Date(),
      });

      alert(`✓ Posted: Buying ${buyPoints} points at ₦${buyPrice}/pt`);
      setBuyPoints('');
      setBuyPrice('0.40');
    } catch (err) {
      console.error('Error posting buy offer:', err);
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedMarket = async () => {
    if (!window.confirm('Create 3 test buy offers to bootstrap the market?')) return;

    setSubmitting(true);
    try {
      const testOffers = [
        { points: 500, offerPrice: 0.40 },
        { points: 1000, offerPrice: 0.40 },
        { points: 2500, offerPrice: 0.40 },
      ];

      for (const offer of testOffers) {
        await addDoc(collection(db, 'point_buy_offers'), {
          offeredBy: 'admin',
          points: offer.points,
          offerPrice: offer.offerPrice,
          totalValue: offer.points * offer.offerPrice,
          status: 'active',
          createdAt: new Date(),
        });
      }

      alert('✓ Market seeded! Check Point Market to see live offers.');
    } catch (err) {
      console.error('Error seeding market:', err);
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE Admin</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="mb-8 flex gap-3">
          <button
            onClick={() => navigate('/admin/redemptions')}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            💳 Manage Redemptions
          </button>
          <button
            onClick={() => navigate('/point-market')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            📊 Point Market
          </button>
        </div>

        {/* Market Management */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">📈 Post Buy Offer (Bootstrap Market)</h3>
          <p className="text-gray-600 mb-6">Create offers to prime the pump and show users that point trading is real.</p>

          <form onSubmit={handlePostBuyOffer} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Points to Buy</label>
              <input
                type="number"
                min="100"
                value={buyPoints}
                onChange={(e) => setBuyPoints(e.target.value)}
                placeholder="e.g., 500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price/Point (₦)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.40"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total (₦)</label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-800 font-bold">
                {buyPoints && buyPrice ? (parseInt(buyPoints) * parseFloat(buyPrice)).toLocaleString() : '0'}
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!buyPoints || !buyPrice || submitting}
                className={`w-full py-2 rounded-lg font-semibold text-white transition ${
                  buyPoints && buyPrice && !submitting
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Posting...' : 'Post Offer'}
              </button>
            </div>
          </form>

          <div className="mt-4 flex gap-3">
            <div className="flex-1 p-3 bg-blue-50 border-l-4 border-primary text-sm text-gray-700">
              <p className="font-semibold mb-2">💡 Strategy:</p>
              <ul className="text-xs space-y-1">
                <li>• Start at ₦0.40/pt to show users they can earn money</li>
                <li>• Post larger amounts (1000+ pts) to show volume</li>
                <li>• Watch real users start trading at rates between your offers</li>
                <li>• Once market is active, you can step back</li>
              </ul>
            </div>
            <button
              onClick={handleSeedMarket}
              disabled={submitting}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              🚀 Quick Seed<br />(3 offers)
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-semibold mb-2">Total Users</h3>
            <p className="text-4xl font-bold text-primary">{stats.totalUsers}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-semibold mb-2">Total Wallet</h3>
            <p className="text-4xl font-bold text-primary">₦{stats.totalWallet}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-semibold mb-2">Total Points</h3>
            <p className="text-4xl font-bold text-primary">{stats.totalPoints}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 font-semibold mb-2">Avg Balance</h3>
            <p className="text-4xl font-bold text-primary">₦{stats.avgBalance}</p>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Users</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">University</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">Wallet</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-semibold">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800">{user.fullName}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600">{user.university}</td>
                    <td className="px-6 py-4 font-semibold text-primary">₦{user.wallet || 0}</td>
                    <td className="px-6 py-4 font-semibold text-primary">{user.points || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [buyPoints, setBuyPoints] = useState('');
  const [buyPrice, setBuyPrice] = useState('0.40');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { alert: showAlert, confirm, modal, closeModal } = useConfirm();

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      try {
        const { data: adminCheck } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (!adminCheck?.is_admin) { navigate('/dashboard'); return; }

        const { data: usersList, error } = await supabase
          .from('users')
          .select('id, full_name, email, points, wallet, university, is_admin, created_at')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!error && usersList) {
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
        }
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
      const { error } = await supabase
        .from('point_buy_offers')
        .insert([{
          offered_by: 'admin',
          points: parseInt(buyPoints),
          offer_price: parseFloat(buyPrice),
          total_value: parseInt(buyPoints) * parseFloat(buyPrice),
          status: 'active',
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      await showAlert({
        title: 'Success',
        message: `Buy offer posted: ${buyPoints} points at ₦${buyPrice}/pt`,
        type: 'success'
      });
      setBuyPoints('');
      setBuyPrice('0.40');
    } catch (err) {
      console.error('Error posting buy offer:', err);
      await showAlert({
        title: 'Error',
        message: err.message || 'Failed to post buy offer',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedMarket = async () => {
    const confirmed = await confirm({
      title: 'Seed Market?',
      message: 'This will create 3 test buy offers to bootstrap the market.',
      type: 'info',
      confirmLabel: 'Seed Market',
      cancelLabel: 'Cancel'
    });

    if (!confirmed) return;

    setSubmitting(true);
    try {
      const testOffers = [
        { points: 500, offer_price: 0.40 },
        { points: 1000, offer_price: 0.40 },
        { points: 2500, offer_price: 0.40 },
      ];

      const offersToInsert = testOffers.map(offer => ({
        offered_by: 'admin',
        points: offer.points,
        offer_price: offer.offer_price,
        total_value: offer.points * offer.offer_price,
        status: 'active',
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('point_buy_offers')
        .insert(offersToInsert);

      if (error) throw error;

      await showAlert({
        title: 'Success',
        message: 'Market seeded with 3 test offers! Check Point Market to see live offers.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error seeding market:', err);
      await showAlert({
        title: 'Error',
        message: err.message || 'Failed to seed market',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
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
            <h1 className="text-2xl font-bold text-primary">HASKE Admin</h1>
            <div className="flex gap-4 items-center">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="md"
              >
                Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                variant="danger"
                size="md"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="mb-8 flex gap-3">
          <Button
            onClick={() => navigate('/admin/redemptions')}
            variant="primary"
            size="lg"
          >
            💳 Manage Redemptions
          </Button>
          <Button
            onClick={() => navigate('/point-market')}
            variant="success"
            size="lg"
          >
            📊 Point Market
          </Button>
        </div>

        {/* Market Management */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">📈 Post Buy Offer (Bootstrap Market)</h3>
          <p className="text-gray-600 mb-6">Create offers to prime the pump and show users that point trading is real.</p>

          <form onSubmit={handlePostBuyOffer} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                label="Points to Buy"
                type="number"
                min="100"
                value={buyPoints}
                onChange={(e) => setBuyPoints(e.target.value)}
                placeholder="e.g., 500"
              />
            </div>
            <div>
              <Input
                label="Price/Point (₦)"
                type="number"
                min="0.01"
                step="0.01"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total (₦)</label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-800 font-bold">
                {buyPoints && buyPrice ? (parseInt(buyPoints) * parseFloat(buyPrice)).toLocaleString() : '0'}
              </div>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={!buyPoints || !buyPrice || submitting}
                variant="success"
                size="md"
                fullWidth
                loading={submitting}
              >
                Post Offer
              </Button>
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
            <Button
              onClick={handleSeedMarket}
              disabled={submitting}
              variant="primary"
              size="lg"
            >
              🚀 Quick Seed (3 offers)
            </Button>
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
                    <td className="px-6 py-4 text-gray-800">{user.full_name}</td>
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
      <Modal {...modal} onClose={closeModal} />
    </div>
  );
}

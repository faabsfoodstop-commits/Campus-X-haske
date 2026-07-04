import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';
import { ToastContext } from '../context/ToastContext';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [buyPoints, setBuyPoints] = useState('');
  const [buyPrice, setBuyPrice] = useState('0.40');
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editPoints, setEditPoints] = useState('');
  const [rewards, setRewards] = useState([]);
  const [missions, setMissions] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
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

        const { data: usersList } = await supabase
          .from('users')
          .select('id, full_name, email, points, wallet, university, is_admin, created_at')
          .order('created_at', { ascending: false })
          .limit(200);

        if (usersList) {
          setUsers(usersList);

          const totalUsers = usersList.length;
          const totalWallet = usersList.reduce((sum, u) => sum + (u.wallet || 0), 0);
          const totalPoints = usersList.reduce((sum, u) => sum + (u.points || 0), 0);
          const activeUsers = usersList.filter(u => new Date(u.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length;

          setStats({
            totalUsers,
            totalWallet,
            totalPoints,
            activeUsers,
            avgBalance: totalUsers > 0 ? (totalWallet / totalUsers).toFixed(2) : 0,
          });
        }

        const { data: rewardsList } = await supabase.from('rewards').select('*');
        if (rewardsList) setRewards(rewardsList);

        const { data: missionsList } = await supabase.from('daily_missions').select('*').limit(10);
        if (missionsList) setMissions(missionsList);
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

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

  const handleUpdateUserPoints = async (userId, newPoints) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ points: parseInt(newPoints) })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, points: parseInt(newPoints) } : u));
      setEditingUser(null);
      addToast('User points updated!', 'success');
    } catch (err) {
      console.error('Error updating points:', err);
      addToast('Failed to update points', 'error');
    }
  };

  const handlePromoteAdmin = async (userId) => {
    const confirmed = await confirm({
      title: 'Promote to Admin?',
      message: 'This user will have access to the admin panel.',
      confirmLabel: 'Promote',
      cancelLabel: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: true } : u));
      addToast('User promoted to admin!', 'success');
    } catch (err) {
      addToast('Failed to promote user', 'error');
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

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'users', label: '👥 Users', icon: '👥' },
    { id: 'points', label: '💰 Points & Rewards', icon: '💰' },
    { id: 'missions', label: '🎯 Missions', icon: '🎯' },
    { id: 'market', label: '📈 Market', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">🔒 HASKE Admin</h1>
            <div className="flex gap-4 items-center">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="md"
              >
                ← Return to App
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

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
                <p className="text-green-100 text-sm font-medium">Active (7d)</p>
                <p className="text-4xl font-bold mt-2">{stats.activeUsers}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
                <p className="text-purple-100 text-sm font-medium">Total Points</p>
                <p className="text-3xl font-bold mt-2">{(stats.totalPoints / 1000).toFixed(1)}k</p>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg shadow p-6">
                <p className="text-amber-100 text-sm font-medium">Total Wallet</p>
                <p className="text-3xl font-bold mt-2">₦{(stats.totalWallet / 1000).toFixed(1)}k</p>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg shadow p-6">
                <p className="text-pink-100 text-sm font-medium">Avg Balance</p>
                <p className="text-3xl font-bold mt-2">₦{stats.avgBalance}</p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-6">
              <h3 className="font-bold text-gray-800 mb-2">💡 Quick Stats</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• {stats.totalUsers} registered users</li>
                <li>• {stats.activeUsers} users active in last 7 days</li>
                <li>• ₦{stats.totalWallet.toLocaleString()} total wallet value</li>
                <li>• {stats.totalPoints.toLocaleString()} total points in circulation</li>
              </ul>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">User Management</h2>
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-64"
              />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">Name</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">Email</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">University</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">Points</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">Wallet</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">Role</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{user.full_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.university || '—'}</td>
                        <td className="px-6 py-4 font-semibold text-primary">{user.points || 0}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">₦{user.wallet || 0}</td>
                        <td className="px-6 py-4">
                          {user.is_admin ? (
                            <span className="inline-block bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setEditingUser(user.id);
                                setEditPoints(user.points?.toString() || '0');
                              }}
                              variant="primary"
                              size="sm"
                            >
                              Edit Points
                            </Button>
                            {!user.is_admin && (
                              <Button
                                onClick={() => handlePromoteAdmin(user.id)}
                                variant="secondary"
                                size="sm"
                              >
                                Promote
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {editingUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-xl font-bold mb-4">Edit User Points</h3>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2">New Points Value</label>
                    <Input
                      type="number"
                      value={editPoints}
                      onChange={(e) => setEditPoints(e.target.value)}
                      placeholder="Enter points"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleUpdateUserPoints(editingUser, editPoints)}
                      variant="primary"
                      fullWidth
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => setEditingUser(null)}
                      variant="secondary"
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Points & Rewards Tab */}
        {activeTab === 'points' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Points & Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Rewards ({rewards.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{reward.name}</p>
                          <p className="text-sm text-gray-600">{reward.description}</p>
                        </div>
                        <span className="font-bold text-primary">{reward.points} pts</span>
                      </div>
                    </div>
                  ))}
                  {rewards.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No rewards yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Points Overview</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded">
                    <p className="text-sm text-gray-600">Total Points Issued</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalPoints.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm text-gray-600">Avg Points per User</p>
                    <p className="text-2xl font-bold text-blue-600">{(stats.totalPoints / stats.totalUsers).toFixed(0)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded">
                    <p className="text-sm text-gray-600">Total Rewards</p>
                    <p className="text-2xl font-bold text-purple-600">{rewards.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Missions Tab */}
        {activeTab === 'missions' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Mission Management</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">Mission</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">Difficulty</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">Reward</th>
                      <th className="px-6 py-3 text-left text-gray-700 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {missions.map((mission) => (
                      <tr key={mission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{mission.mission_name}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            mission.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            mission.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {mission.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-primary">{mission.reward_points} pts</td>
                        <td className="px-6 py-4">
                          <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Market Tab */}
        {activeTab === 'market' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Point Market Management</h2>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">📈 Post Buy Offer</h3>
              <p className="text-gray-600 mb-6">Create offers to bootstrap the market and show users that point trading is active.</p>

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

              <div className="mt-6 flex gap-3">
                <div className="flex-1 p-4 bg-blue-50 border-l-4 border-primary text-sm text-gray-700 rounded">
                  <p className="font-semibold mb-2">💡 Strategy:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Start at ₦0.40/pt to show earning potential</li>
                    <li>• Post larger amounts (1000+ pts) to show volume</li>
                    <li>• Watch real users trade between your offers</li>
                    <li>• Step back once market is active</li>
                  </ul>
                </div>
                <Button
                  onClick={handleSeedMarket}
                  disabled={submitting}
                  variant="primary"
                  size="lg"
                >
                  🚀 Quick Seed
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/point-market')}
                variant="success"
                size="lg"
              >
                📊 View Point Market
              </Button>
              <Button
                onClick={() => navigate('/admin/redemptions')}
                variant="primary"
                size="lg"
              >
                💳 Manage Redemptions
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal {...modal} onClose={closeModal} />
    </div>
  );
}

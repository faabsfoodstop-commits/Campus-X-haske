import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';
import { ToastContext } from '../context/ToastContext';
import { recordSpinActivity, fetchSpinHistory as fetchSpinHistoryFromDB } from '../utils/databaseHelpers';
import {
  IconSpinWheel,
  IconStar,
} from '../components/Icons';

export default function SpinWheel() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [freeSpin, setFreeSpin] = useState(0);
  const [purchasedSpin, setPurchasedSpin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [spinHistory, setSpinHistory] = useState([]);
  const [showBuySpins, setShowBuySpins] = useState(false);
  const navigate = useNavigate();
  const { alert: showAlert, modal, closeModal } = useConfirm();
  const { addToast } = useContext(ToastContext);

  const wheelOptions = [
    { label: '250 pts', points: 250, color: '#fbbf24', probability: 0.30 },
    { label: '500 pts', points: 500, color: '#60a5fa', probability: 0.25 },
    { label: '1K pts', points: 1000, color: '#34d399', probability: 0.15 },
    { label: '2.5K pts', points: 2500, color: '#f87171', probability: 0.10 },
    { label: '2x Multiplier', points: 0, color: '#c084fc', multiplier: 2, probability: 0.12 },
    { label: 'Try Again', points: 0, color: '#d1d5db', probability: 0.08 }
  ];

  useEffect(() => {
    fetchUserData();

    // Refetch every 30 seconds — points are updated optimistically after each spin
    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (user) {
        setUserData(user);
        setUser(session.user);
      }
      await checkDailySpins();
      await fetchSpinHistory();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const FREE_SPIN_LIMIT = 3;
  const PURCHASED_SPIN_LIMIT = 10;

  const checkDailySpins = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Count today's spins directly from spin_history (no edge function dependency)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todaySpins, error } = await supabase
        .from('spin_history')
        .select('cost')
        .eq('user_id', session.user.id)
        .gte('created_at', todayStart.toISOString());

      if (error) throw error;

      const freeUsed = (todaySpins || []).filter(s => s.cost === 0).length;
      const purchasedUsed = (todaySpins || []).filter(s => s.cost > 0).length;

      setFreeSpin(Math.max(0, FREE_SPIN_LIMIT - freeUsed));
      setPurchasedSpin(Math.max(0, PURCHASED_SPIN_LIMIT - purchasedUsed));
    } catch (err) {
      console.error('Error checking spins:', err);
      // Don't reset to defaults on error - keep current state
    }
  };

  const fetchSpinHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const history = await fetchSpinHistoryFromDB(session.user.id, 10);
      setSpinHistory(history);
    } catch (err) {
      console.error('Error fetching spin history:', err);
      setSpinHistory([]);
    }
  };

  const getWeightedRandom = () => {
    const rand = Math.random();
    let cumulative = 0;

    for (let option of wheelOptions) {
      cumulative += option.probability;
      if (rand <= cumulative) {
        return option;
      }
    }
    return wheelOptions[0];
  };

  const handleSpin = async (useFreeSpins = true) => {
    if (isSpinning) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Check spin count directly (no edge function needed)
      const remaining = useFreeSpins ? freeSpin : purchasedSpin;
      if (remaining <= 0) {
        const limit = useFreeSpins ? FREE_SPIN_LIMIT : PURCHASED_SPIN_LIMIT;
        addToast(`Daily ${useFreeSpins ? 'free' : 'purchased'} spin limit reached (${limit}/day). Resets at midnight.`, 'warning');
        return;
      }

      // Fetch fresh user data — never use stale local state for DB writes
      const { data: freshUser, error: fetchError } = await supabase
        .from('users')
        .select('points, wallet')
        .eq('id', session.user.id)
        .single();
      if (fetchError || !freshUser) throw new Error('Failed to fetch user data');

      if (!useFreeSpins && (freshUser.wallet || 0) < 50) {
        addToast('You need 50 tokens to use a paid spin. Complete tasks to earn more tokens.', 'warning');
        return;
      }

      setIsSpinning(true);
      setSpinResult(null);

      // Simulate spin animation (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result = getWeightedRandom();
      let earnedPoints = result.points;

      // Check for streak bonus
      const today = new Date().toDateString();
      const lastCheckIn = localStorage.getItem('lastCheckIn');
      if (lastCheckIn === today && result.points > 0) {
        earnedPoints = Math.floor(earnedPoints * 1.5);
      }

      // Apply multiplier if applicable
      if (result.multiplier) {
        earnedPoints = 0; // Multipliers don't give immediate points
      }

      setSpinResult({ ...result, earnedPoints, multiplierActive: !!result.multiplier });

      // Record spin activity FIRST — if this fails, abort without touching points
      const spinRecordResult = await recordSpinActivity(
        session.user.id,
        result.label,
        earnedPoints,
        useFreeSpins
      );
      if (!spinRecordResult.success) {
        throw new Error(spinRecordResult.error || 'Failed to record spin');
      }

      // Now safe to update points and wallet — activity is committed
      const newPoints = freshUser.points + earnedPoints;
      const newWallet = useFreeSpins ? freshUser.wallet : ((freshUser.wallet || 0) - 50);

      const { data: updatedRows, error: updateError } = await supabase
        .from('users')
        .update({ points: newPoints, wallet: newWallet })
        .eq('id', session.user.id)
        .select('id');

      if (updateError) throw updateError;
      if (!updatedRows?.length) throw new Error('Points update blocked — check RLS policy for users table');

      // Optimistically update UI immediately
      if (useFreeSpins) {
        setFreeSpin(prev => Math.max(0, prev - 1));
      } else {
        setPurchasedSpin(prev => Math.max(0, prev - 1));
      }

      // Optimistically prepend new spin to history
      const newSpin = {
        id: `temp-${Date.now()}`,
        user_id: session.user.id,
        result: result.label,
        points_earned: earnedPoints,
        multiplier: result.multiplier ? String(result.multiplier) : '1',
        cost: useFreeSpins ? 0 : 50,
        created_at: new Date().toISOString()
      };
      setSpinHistory(prev => [newSpin, ...prev].slice(0, 10));

      // Update local user state
      setUserData(prev => ({ ...prev, points: newPoints, wallet: newWallet }));

      // Sync from DB in background (replaces temp entry with real one)
      fetchSpinHistory();

      if (earnedPoints > 0) {
        addToast(`🎉 You won ${earnedPoints} points!`, 'success');
      }
    } catch (err) {
      console.error('Error processing spin:', err);
      addToast('Spin error: ' + (err.message || 'Please try again'), 'error');
    } finally {
      setIsSpinning(false);
    }
  };

  const buySpins = async (quantity = 1) => {
    const cost = 50 * quantity;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data: freshUser, error: fetchError } = await supabase
        .from('users')
        .select('wallet')
        .eq('id', session.user.id)
        .single();
      if (fetchError || !freshUser) throw new Error('Failed to fetch wallet balance');

      if ((freshUser.wallet || 0) < cost) {
        showAlert({
          title: 'Insufficient Balance',
          message: `You need ${cost} tokens but only have ${freshUser.wallet || 0}. Complete more tasks to earn tokens.`,
          type: 'warning'
        });
        return;
      }

      const newWallet = (freshUser.wallet || 0) - cost;
      const { data: updatedRows, error } = await supabase
        .from('users')
        .update({ wallet: newWallet })
        .eq('id', session.user.id)
        .select('id');

      if (error) throw error;
      if (!updatedRows?.length) throw new Error('Wallet update blocked — check RLS policy for users table');

      setUserData(prev => ({ ...prev, wallet: newWallet }));
      setPurchasedSpin(prev => prev + quantity);
      setShowBuySpins(false);
      showAlert({
        title: 'Success!',
        message: `You've purchased ${quantity} spin${quantity > 1 ? 's' : ''}! Now you have ${purchasedSpin + quantity} paid spins available.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error buying spins:', err);
      addToast('Failed to buy spins. Please try again.', 'error');
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
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate('/daily-missions')}
                className="text-gray-600 hover:text-primary text-sm font-semibold flex items-center gap-1"
              >
                ← Missions
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary"
              >
                Dashboard
              </button>
              <div className="flex items-center gap-2 text-lg font-bold text-primary">
                <IconStar className="w-5 h-5" />
                {userData?.points || 0} pts
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Spin Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <IconSpinWheel className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">Lucky Spin</h2>
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="text-gray-600 text-sm">Free Spins</p>
                <p className="text-3xl font-bold text-green-600">{freeSpin}/3</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Purchased Spins</p>
                <p className="text-3xl font-bold text-blue-600">{purchasedSpin}/10</p>
              </div>
            </div>
          </div>
          <p className="text-gray-600">Spin daily to earn random points! Resets at midnight.</p>
        </div>

        {/* Spinning Wheel */}
        <div className="bg-gradient-to-b from-primary to-blue-600 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col items-center">
            {/* Wheel Container */}
            <div className="relative w-64 h-64 mb-8">
              <svg viewBox="0 0 400 400" className={`w-full h-full transition-transform ${isSpinning ? 'animate-spin' : ''}`} style={{ transformOrigin: 'center', animation: isSpinning ? 'spin 3s linear' : 'none' }}>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(1800deg); }
                  }
                `}</style>
                {wheelOptions.map((option, idx) => {
                  const angle = (360 / wheelOptions.length) * idx;
                  return (
                    <g key={idx}>
                      <path
                        d={`M 200 200 L ${200 + 150 * Math.cos((angle - 90) * Math.PI / 180)} ${200 + 150 * Math.sin((angle - 90) * Math.PI / 180)} A 150 150 0 0 1 ${200 + 150 * Math.cos((angle - 90 + 360 / wheelOptions.length) * Math.PI / 180)} ${200 + 150 * Math.sin((angle - 90 + 360 / wheelOptions.length) * Math.PI / 180)} Z`}
                        fill={option.color}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={200 + 100 * Math.cos((angle - 90 + 360 / (wheelOptions.length * 2)) * Math.PI / 180)}
                        y={200 + 100 * Math.sin((angle - 90 + 360 / (wheelOptions.length * 2)) * Math.PI / 180)}
                        textAnchor="middle"
                        fill="white"
                        fontSize="16"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {option.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx="200" cy="200" r="30" fill="white" stroke={isSpinning ? 'gold' : 'white'} strokeWidth="2" />
              </svg>

              {/* Pointer */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                <div className="text-4xl">🎯</div>
              </div>
            </div>

            {/* Spin Result */}
            {spinResult && (
              <div className={`text-center mb-8 p-6 rounded-lg ${spinResult.earnedPoints > 200 ? 'bg-yellow-200' : 'bg-green-200'}`}>
                <p className="text-2xl font-bold">
                  {spinResult.multiplierActive ? '2x Multiplier Activated! 🎉' : `You Won ${spinResult.earnedPoints} Points! 🎉`}
                </p>
                {spinResult.earnedPoints > 0 && (
                  <p className="text-lg text-gray-700 mt-2">
                    Total Points: {userData?.points || 0}
                  </p>
                )}
              </div>
            )}

            {/* Spin Buttons */}
            <div className="flex gap-4 justify-center mb-6 flex-wrap">
              <Button
                onClick={() => handleSpin(true)}
                disabled={freeSpin <= 0 || isSpinning}
                loading={isSpinning}
                variant="success"
                size="lg"
              >
                {isSpinning ? 'Spinning...' : freeSpin > 0 ? `Free Spin (${freeSpin})` : 'No Free Spins'}
              </Button>

              <Button
                onClick={() => handleSpin(false)}
                disabled={purchasedSpin <= 0 || isSpinning}
                loading={isSpinning}
                variant="primary"
                size="lg"
              >
                {isSpinning ? 'Spinning...' : purchasedSpin > 0 ? `Paid Spin (${purchasedSpin}, 50 tokens)` : 'No Paid Spins'}
              </Button>
            </div>

            {/* Info */}
            <div className="text-center text-white text-sm">
              <p>📈 Consecutive daily spin = higher rewards!</p>
              <p>✨ 7-day streak unlocks free 3x spin</p>
            </div>
          </div>
        </div>

        {/* Buy Spins Modal - Custom implementation */}
        {showBuySpins && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Buy More Spins</h3>
                <button
                  onClick={() => setShowBuySpins(false)}
                  className="text-2xl text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                You have <span className="font-bold text-primary">{userData?.wallet || 0}</span> tokens available
              </p>

              <div className="space-y-3 mb-6">
                {[1, 3, 5].map(qty => (
                  <Button
                    key={qty}
                    onClick={() => buySpins(qty)}
                    variant="primary"
                    fullWidth
                    size="md"
                  >
                    Buy {qty} Spin{qty > 1 ? 's' : ''} ({qty * 50} tokens)
                  </Button>
                ))}
              </div>

              <Button
                onClick={() => setShowBuySpins(false)}
                variant="secondary"
                fullWidth
                size="md"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Recent Spins */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-2xl font-bold mb-4">Recent Spins</h3>
          <div className="space-y-2">
            {spinHistory.length > 0 ? (
              spinHistory.map((spin, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">{spin.result}</p>
                    <p className="text-sm text-gray-600">{new Date(spin.created_at).toLocaleTimeString()}</p>
                  </div>
                  <p className="text-lg font-bold text-primary">+{spin.points_earned}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No spins yet. Start spinning!</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal for alerts */}
      <Modal {...modal} onClose={closeModal} />
    </div>
  );
}

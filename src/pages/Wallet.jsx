import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { supabase } from '../config/supabase';

export default function Wallet() {
  const { profile, user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [convertAmount, setConvertAmount] = useState('');

  const handleConvertPoints = async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) {
      addToast('Enter a valid amount', 'error');
      return;
    }

    const points = parseFloat(convertAmount);
    if (points > (profile?.points || 0)) {
      addToast('Insufficient points', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1 point = ₦1 (configurable)
      const walletAmount = points;

      const { error } = await supabase
        .from('users')
        .update({
          points: (profile?.points || 0) - points,
          wallet: (profile?.wallet || 0) + walletAmount,
        })
        .eq('id', user.id);

      if (error) throw error;

      await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: 'points_converted',
          amount: -points,
          description: `Converted ${points} points to ₦${walletAmount} wallet`,
          metadata: { wallet_amount: walletAmount },
        }]);

      addToast(`Converted ${points} points to wallet!`, 'success');
      setConvertAmount('');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      addToast(error.message || 'Conversion failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Wallet</h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 text-white">
            <p className="text-sm opacity-90 mb-2">Points Balance</p>
            <p className="text-4xl font-bold">{profile?.points || 0}</p>
            <p className="text-xs opacity-75 mt-2">Earn from tasks & missions</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 text-white">
            <p className="text-sm opacity-90 mb-2">Wallet Balance</p>
            <p className="text-4xl font-bold">₦{profile?.wallet || 0}</p>
            <p className="text-xs opacity-75 mt-2">Ready to redeem</p>
          </div>
        </div>

        {/* Conversion Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Convert Points to Wallet</h2>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="text-blue-900 text-sm">
              💡 <span className="font-semibold">Rate:</span> 1 Point = ₦1
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points to Convert
              </label>
              <input
                type="number"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
                max={profile?.points || 0}
              />
              <p className="text-xs text-gray-600 mt-1">
                Available: {profile?.points || 0} points
              </p>
            </div>

            {convertAmount && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Points</span>
                  <span className="font-semibold">{convertAmount}</span>
                </div>
                <div className="flex justify-between text-purple-600 font-bold text-lg border-t pt-2">
                  <span>You get</span>
                  <span>₦{convertAmount}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleConvertPoints}
              disabled={loading || !convertAmount}
              className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {loading ? 'Converting...' : 'Convert to Wallet'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <p className="text-amber-900 text-sm">
            <span className="font-semibold">ℹ️ Tip:</span> Keep points for earning streaks or convert to wallet for redemptions
          </p>
        </div>
      </div>
    </div>
  );
}

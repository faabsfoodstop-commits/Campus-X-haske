import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { supabase } from '../config/supabase';

const REWARD_CATALOG = [
  {
    id: 'airtime_500',
    category: 'airtime',
    provider: 'MTN',
    name: 'MTN Airtime ₦500',
    description: 'Get 500 naira airtime credit',
    cost: 500,
    icon: '📱',
    badge: 'Popular',
  },
  {
    id: 'airtime_1000',
    category: 'airtime',
    provider: 'MTN',
    name: 'MTN Airtime ₦1,000',
    description: 'Get 1,000 naira airtime credit',
    cost: 1000,
    icon: '📱',
  },
  {
    id: 'airtime_2000',
    category: 'airtime',
    provider: 'MTN',
    name: 'MTN Airtime ₦2,000',
    description: 'Get 2,000 naira airtime credit',
    cost: 2000,
    icon: '📱',
    badge: 'Best Value',
  },
  {
    id: 'data_1gb',
    category: 'data',
    provider: 'Airtel',
    name: 'Airtel Data 1GB',
    description: '1GB data bundle (7 days)',
    cost: 800,
    icon: '🌐',
  },
  {
    id: 'data_2gb',
    category: 'data',
    provider: 'Airtel',
    name: 'Airtel Data 2GB',
    description: '2GB data bundle (30 days)',
    cost: 1500,
    icon: '🌐',
    badge: 'Popular',
  },
  {
    id: 'gift_card_1k',
    category: 'gift_card',
    provider: 'Amazon',
    name: 'Amazon Gift Card ₦1,000',
    description: 'Digital Amazon gift card',
    cost: 1200,
    icon: '🎁',
  },
  {
    id: 'gift_card_5k',
    category: 'gift_card',
    provider: 'Amazon',
    name: 'Amazon Gift Card ₦5,000',
    description: 'Digital Amazon gift card',
    cost: 6000,
    icon: '🎁',
    badge: 'Best Value',
  },
];

export default function Rewards() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const [rewards, setRewards] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRewards(REWARD_CATALOG);
  }, []);

  const handleRedeem = async (reward) => {
    if ((profile?.points || 0) < reward.cost) {
      addToast(`You need ${reward.cost - (profile?.points || 0)} more points`, 'error');
      return;
    }

    setLoading(true);
    try {
      // Create redemption record
      const { data: redemption, error: insertError } = await supabase
        .from('redemptions')
        .insert([{
          user_id: user.id,
          reward_id: reward.id,
          points_spent: reward.cost,
          status: 'pending',
          provider: reward.provider,
          reward_name: reward.name,
          metadata: {
            category: reward.category,
            original_cost: reward.cost,
          },
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Deduct points
      const newPoints = (profile?.points || 0) - reward.cost;
      const { error: updateError } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: 'reward_redeemed',
          amount: -reward.cost,
          description: `Redeemed: ${reward.name}`,
          reward_id: reward.id,
          metadata: { redemption_id: redemption.id },
        }]);

      // Log activity
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          action: 'reward_redeemed',
          description: `Redeemed ${reward.name} for ${reward.cost} points`,
        }]);

      addToast(`✅ Redemption request submitted! Check your email for details.`, 'success');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      addToast(error.message || 'Redemption failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredRewards = selectedCategory === 'all'
    ? rewards
    : rewards.filter(r => r.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All Rewards', icon: '🎁' },
    { id: 'airtime', name: 'Airtime', icon: '📱' },
    { id: 'data', name: 'Data', icon: '🌐' },
    { id: 'gift_card', name: 'Gift Cards', icon: '💳' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Rewards</h1>
        <p className="text-gray-600 mb-6">Redeem your points for real rewards</p>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <p className="text-sm opacity-90 mb-1">Your Balance</p>
          <p className="text-4xl font-bold">{profile?.points || 0}</p>
          <p className="text-xs opacity-75 mt-2">points available to spend</p>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg p-4 mb-6 overflow-x-auto">
          <div className="flex space-x-2 whitespace-nowrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRewards.map(reward => (
            <div
              key={reward.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
            >
              {/* Header with Badge */}
              <div className="bg-gray-50 p-4 border-b border-gray-200 relative">
                <div className="text-4xl mb-2">{reward.icon}</div>
                {reward.badge && (
                  <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded">
                    {reward.badge}
                  </div>
                )}
                <h3 className="font-bold text-gray-800">{reward.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{reward.provider}</p>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">{reward.description}</p>

                {/* Cost and Button */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-purple-600">
                    {reward.cost.toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={loading || (profile?.points || 0) < reward.cost}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      (profile?.points || 0) < reward.cost
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    Redeem
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              <span className="font-bold">⏱️ Processing Time:</span> Most rewards are delivered within 24 hours. Check your email for status updates.
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-green-900 text-sm">
              <span className="font-bold">💡 Tip:</span> Check "Redemption History" to track your pending and completed orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { useToast } from '../hooks/useToast';

export default function CosmeticsShop() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { showToast } = useToast();
  const [cosmetics, setCosmetics] = useState([]);
  const [ownedCosmetics, setOwnedCosmetics] = useState(new Set());
  const [selectedType, setSelectedType] = useState('all');
  const [loading2, setLoading2] = useState(true);

  const types = ['all', 'frame', 'badge', 'effect', 'title'];
  const rarities = {
    common: { color: 'gray', emoji: '⚪' },
    rare: { color: 'blue', emoji: '🔵' },
    epic: { color: 'purple', emoji: '🟣' },
    legendary: { color: 'yellow', emoji: '🟡' }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCosmetics();
      fetchOwnedCosmetics();
    }
  }, [user]);

  const fetchCosmetics = async () => {
    try {
      setLoading2(true);
      const { data, error } = await supabase
        .from('cosmetics')
        .select('*')
        .order('rarity', { ascending: false });

      if (error) throw error;
      setCosmetics(data || []);
    } catch (error) {
      console.error('Failed to fetch cosmetics:', error);
    } finally {
      setLoading2(false);
    }
  };

  const fetchOwnedCosmetics = async () => {
    try {
      const { data } = await supabase
        .from('user_cosmetics')
        .select('cosmetic_id')
        .eq('user_id', user.id);

      setOwnedCosmetics(new Set(data?.map(c => c.cosmetic_id) || []));
    } catch (error) {
      console.error('Failed to fetch owned cosmetics:', error);
    }
  };

  const handleBuyCosmetic = async (cosmetic) => {
    if (ownedCosmetics.has(cosmetic.id)) {
      showToast('Already owned!', 'error');
      return;
    }

    const canAfford = cosmetic.points_cost
      ? profile.points >= cosmetic.points_cost
      : profile.wallet >= cosmetic.wallet_cost;

    if (!canAfford) {
      showToast('Insufficient balance', 'error');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('user_cosmetics')
        .insert({
          user_id: user.id,
          cosmetic_id: cosmetic.id
        });

      if (insertError) throw insertError;

      if (cosmetic.points_cost) {
        const newPoints = profile.points - cosmetic.points_cost;
        const { error: updateError } = await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('id', user.id);

        if (updateError) throw updateError;

        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'cosmetic_purchase',
          amount: -cosmetic.points_cost,
          description: `Purchased ${cosmetic.name}`,
          metadata: { cosmetic_id: cosmetic.id, currency: 'points' }
        });
      } else {
        const newWallet = profile.wallet - cosmetic.wallet_cost;
        const { error: updateError } = await supabase
          .from('users')
          .update({ wallet: newWallet })
          .eq('id', user.id);

        if (updateError) throw updateError;

        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'cosmetic_purchase',
          amount: -cosmetic.wallet_cost,
          description: `Purchased ${cosmetic.name}`,
          metadata: { cosmetic_id: cosmetic.id, currency: 'wallet' }
        });
      }

      showToast(`Acquired ${cosmetic.name}! 🎉`);
      fetchOwnedCosmetics();
    } catch (error) {
      console.error('Failed to buy cosmetic:', error);
      showToast('Failed to purchase', 'error');
    }
  };

  const filteredCosmetics = cosmetics.filter(c =>
    selectedType === 'all' || c.type === selectedType
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Cosmetics Shop</h1>
          <p className="text-gray-600">Collect exclusive badges, frames, and effects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Points Balance</p>
            <p className="text-3xl font-bold text-purple-600">{profile?.points || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Wallet Balance</p>
            <p className="text-3xl font-bold text-green-600">₦{profile?.wallet || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Items Owned</p>
            <p className="text-3xl font-bold text-blue-600">{ownedCosmetics.size}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filter by Type</h2>
          <div className="flex flex-wrap gap-2">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedType === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading2 ? (
          <div className="text-center py-12 text-gray-600">Loading cosmetics...</div>
        ) : filteredCosmetics.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No cosmetics available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCosmetics.map(cosmetic => {
              const rarity = rarities[cosmetic.rarity] || rarities.common;
              const isOwned = ownedCosmetics.has(cosmetic.id);

              return (
                <div
                  key={cosmetic.id}
                  className={`rounded-xl shadow-lg overflow-hidden transition hover:shadow-xl ${
                    isOwned ? 'border-4 border-green-500' : 'border border-gray-200'
                  }`}
                  style={{ backgroundColor: cosmetic.background_color || '#ffffff' }}
                >
                  <div className="bg-gray-100 p-8 text-center">
                    <p className="text-6xl mb-2">{cosmetic.icon}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${
                      cosmetic.rarity === 'legendary' ? 'bg-yellow-500' :
                      cosmetic.rarity === 'epic' ? 'bg-purple-500' :
                      cosmetic.rarity === 'rare' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}>
                      {cosmetic.rarity.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{cosmetic.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{cosmetic.description}</p>

                    {cosmetic.is_limited && (
                      <div className="bg-red-100 border border-red-300 text-red-800 text-xs font-semibold px-3 py-2 rounded-lg mb-4">
                        ⏰ Limited Time Only
                      </div>
                    )}

                    <div className="mb-4">
                      {cosmetic.points_cost ? (
                        <div className="text-center">
                          <p className="text-gray-600 text-sm">Cost</p>
                          <p className="text-2xl font-bold text-purple-600">{cosmetic.points_cost} points</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-600 text-sm">Cost</p>
                          <p className="text-2xl font-bold text-green-600">₦{cosmetic.wallet_cost}</p>
                        </div>
                      )}
                    </div>

                    {isOwned ? (
                      <div className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg text-center">
                        ✓ Owned
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuyCosmetic(cosmetic)}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition"
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

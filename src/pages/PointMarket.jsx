import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { useToast } from '../hooks/useToast';

export default function PointMarket() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [pointsToSell, setPointsToSell] = useState('');
  const [pricePerPoint, setPricePerPoint] = useState('0.5');
  const [loading2, setLoading2] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    try {
      setLoading2(true);
      const { data, error } = await supabase
        .from('point_market')
        .select('*, seller_id(full_name, university)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);

      const { data: myData } = await supabase
        .from('point_market')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      setMyListings(myData || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading2(false);
    }
  };

  const handleCreateListing = async () => {
    if (!pointsToSell || !pricePerPoint) {
      showToast('Please fill all fields', 'error');
      return;
    }

    const points = parseInt(pointsToSell);
    const price = parseFloat(pricePerPoint);

    if (points <= 0 || price <= 0) {
      showToast('Values must be positive', 'error');
      return;
    }

    if (points > profile.points) {
      showToast('Insufficient points', 'error');
      return;
    }

    try {
      const walletCost = Math.floor(points * price);

      const { error } = await supabase.from('point_market').insert({
        seller_id: user.id,
        points_amount: points,
        price_per_point: price,
        wallet_cost: walletCost,
        status: 'active'
      });

      if (error) throw error;

      const { error: transError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'point_market_listing',
        amount: -points,
        description: `Listed ${points} points at ₦${price}/point`,
        metadata: { listing_type: 'sell' }
      });

      if (transError) throw transError;

      showToast('Listing created successfully! 📋');
      setPointsToSell('');
      setPricePerPoint('0.5');
      setShowForm(false);
      fetchListings();
    } catch (error) {
      console.error('Failed to create listing:', error);
      showToast('Failed to create listing', 'error');
    }
  };

  const handleBuyPoints = async (listing) => {
    if (!profile.wallet || profile.wallet < listing.wallet_cost) {
      showToast('Insufficient wallet balance', 'error');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('point_market')
        .update({
          buyer_id: user.id,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', listing.id);

      if (updateError) throw updateError;

      const [buyerUpdate, sellerUpdate] = await Promise.all([
        supabase.from('users')
          .update({
            wallet: (profile.wallet - listing.wallet_cost),
            points: (profile.points + listing.points_amount)
          })
          .eq('id', user.id),
        supabase.from('users')
          .update({ wallet: ((profile.wallet || 0) + listing.wallet_cost) })
          .eq('id', listing.seller_id)
      ]);

      if (buyerUpdate.error) throw buyerUpdate.error;
      if (sellerUpdate.error) throw sellerUpdate.error;

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'point_market_purchase',
        amount: listing.points_amount,
        description: `Bought ${listing.points_amount} points for ₦${listing.wallet_cost}`,
        related_user_id: listing.seller_id,
        metadata: { market_id: listing.id }
      });

      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'market_purchase',
        description: `Purchased ${listing.points_amount} points from market`
      });

      showToast('Points purchased! 🎉');
      fetchListings();
    } catch (error) {
      console.error('Failed to buy points:', error);
      showToast('Failed to complete purchase', 'error');
    }
  };

  const handleCancelListing = async (listingId) => {
    try {
      const { error } = await supabase
        .from('point_market')
        .update({ status: 'cancelled' })
        .eq('id', listingId);

      if (error) throw error;

      showToast('Listing cancelled');
      fetchListings();
    } catch (error) {
      showToast('Failed to cancel listing', 'error');
    }
  };

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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Point Market</h1>
          <p className="text-gray-600">Trade points with other users</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Your Points</p>
            <p className="text-3xl font-bold text-purple-600">{profile?.points || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Your Wallet</p>
            <p className="text-3xl font-bold text-green-600">₦{profile?.wallet || 0}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow p-6 hover:shadow-lg transition"
          >
            <p className="text-2xl mb-2">📝</p>
            <p className="font-semibold">{showForm ? 'Cancel' : 'Create Listing'}</p>
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Sell Your Points</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Points to Sell
                </label>
                <input
                  type="number"
                  value={pointsToSell}
                  onChange={(e) => setPointsToSell(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  max={profile?.points || 0}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price per Point (₦)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pricePerPoint}
                  onChange={(e) => setPricePerPoint(e.target.value)}
                  placeholder="0.50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {pointsToSell && pricePerPoint && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    You will receive: <span className="font-bold text-purple-600">
                      ₦{Math.floor(parseInt(pointsToSell || 0) * parseFloat(pricePerPoint || 0))}
                    </span>
                  </p>
                </div>
              )}

              <button
                onClick={handleCreateListing}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition"
              >
                Create Listing
              </button>
            </div>
          </div>
        )}

        {myListings.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">My Listings</h2>
            <div className="space-y-3">
              {myListings.map(listing => (
                <div key={listing.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800">{listing.points_amount} points</p>
                    <p className="text-sm text-gray-600">₦{listing.price_per_point}/point = ₦{listing.wallet_cost}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: <span className="font-semibold capitalize">{listing.status}</span>
                    </p>
                  </div>
                  {listing.status === 'active' && (
                    <button
                      onClick={() => handleCancelListing(listing.id)}
                      className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800">Market Listings</h2>
          {loading2 ? (
            <div className="text-center py-8 text-gray-600">Loading listings...</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No active listings</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map(listing => (
                <div key={listing.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{listing.points_amount} Points</p>
                      <p className="text-sm text-gray-600">at ₦{listing.price_per_point}/point</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Active
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">Total cost</p>
                    <p className="text-2xl font-bold text-green-600">₦{listing.wallet_cost}</p>
                  </div>

                  <button
                    onClick={() => handleBuyPoints(listing)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition"
                  >
                    Buy Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

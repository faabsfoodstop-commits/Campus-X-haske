import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { useToast } from '../hooks/useToast';

export default function PremiumTier() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { showToast } = useToast();
  const [tiers, setTiers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [paymentType, setPaymentType] = useState('monthly');
  const [loading2, setLoading2] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTiers();
      fetchSubscription();
    }
  }, [user]);

  const fetchTiers = async () => {
    try {
      setLoading2(true);
      const { data, error } = await supabase
        .from('premium_tiers')
        .select('*')
        .order('tier_level', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Failed to fetch tiers:', error);
    } finally {
      setLoading2(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*, premium_tiers(name, tier_level)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      setSubscription(data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handleSubscribe = async (tier) => {
    const price = paymentType === 'monthly' ? tier.monthly_price : tier.yearly_price;

    if (!price) {
      showToast('This plan is not available for this billing period', 'error');
      return;
    }

    let deductedPoints = 0;
    let deductedWallet = 0;

    if (profile.points >= price) {
      deductedPoints = price;
    } else if (profile.wallet >= price) {
      deductedWallet = price;
    } else {
      showToast('Insufficient balance', 'error');
      return;
    }

    try {
      const expiryDate = new Date();
      if (paymentType === 'monthly') {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }

      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          tier_id: tier.id,
          subscription_type: paymentType,
          status: 'active',
          points_deducted: deductedPoints || null,
          wallet_deducted: deductedWallet || null,
          expires_at: expiryDate.toISOString()
        });

      if (insertError) throw insertError;

      const newPoints = profile.points - deductedPoints;
      const newWallet = profile.wallet - deductedWallet;

      const { error: updateError } = await supabase
        .from('users')
        .update({
          points: newPoints,
          wallet: newWallet
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'premium_subscription',
        amount: -(deductedPoints + deductedWallet),
        description: `Subscribed to ${tier.name} tier (${paymentType})`,
        metadata: { tier_id: tier.id, subscription_type: paymentType }
      });

      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'premium_subscription',
        description: `Subscribed to ${tier.name} premium tier`
      });

      showToast(`Welcome to ${tier.name} tier! 🎉`);
      fetchSubscription();
    } catch (error) {
      console.error('Failed to subscribe:', error);
      showToast('Failed to subscribe', 'error');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      showToast('Subscription cancelled');
      fetchSubscription();
    } catch (error) {
      showToast('Failed to cancel subscription', 'error');
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Premium Membership</h1>
          <p className="text-gray-600">Unlock exclusive features and boost your earnings</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setPaymentType('monthly')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              paymentType === 'monthly'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPaymentType('yearly')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              paymentType === 'yearly'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            Yearly (Save 17%)
          </button>
        </div>

        {subscription && (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-green-800 mb-2">
                  ✓ Currently Subscribed: {subscription.premium_tiers.name}
                </h2>
                <p className="text-green-700">
                  Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        )}

        {loading2 ? (
          <div className="text-center py-12 text-gray-600">Loading tiers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {tiers.map((tier, idx) => {
              const price = paymentType === 'monthly' ? tier.monthly_price : tier.yearly_price;
              const isCurrentTier = subscription?.premium_tiers?.tier_level === tier.tier_level;

              return (
                <div
                  key={tier.id}
                  className={`rounded-xl shadow-lg overflow-hidden transition hover:shadow-xl ${
                    isCurrentTier
                      ? 'border-4 border-green-500 transform scale-105'
                      : 'border border-gray-200'
                  } ${idx === 2 ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : 'bg-white'}`}
                >
                  {idx === 2 && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-center py-2 font-bold">
                      BEST VALUE 🔥
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{tier.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{tier.description}</p>

                    <div className="mb-6">
                      <p className="text-gray-600 text-sm">Starting at</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-purple-600">₦{price}</span>
                        <span className="text-gray-600">/{paymentType === 'monthly' ? 'mo' : 'yr'}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {tier.benefits && Object.entries(tier.benefits).map(([key, value]) => (
                        <div key={key} className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <span className="text-sm text-gray-700">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {isCurrentTier ? (
                      <div className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg text-center">
                        ✓ Your Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(tier)}
                        className={`w-full font-semibold py-3 rounded-lg transition ${
                          idx === 2
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg'
                            : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:shadow-lg'
                        }`}
                      >
                        Upgrade Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">What's Included?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">📊</span> Enhanced Earnings
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Daily bonus points (5-20 depending on tier)</li>
                <li>• Increased ad watch limits</li>
                <li>• Priority in point market access</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">✨</span> Exclusive Content
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Access to exclusive cosmetics</li>
                <li>• Premium badges and titles</li>
                <li>• Early access to new features</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">💰</span> Point Market Benefits
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Reduced trading fees (up to 50% off)</li>
                <li>• Higher point market limits</li>
                <li>• Priority order fulfillment</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">🏆</span> VIP Treatment
              </h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• VIP support priority</li>
                <li>• Leaderboard boost</li>
                <li>• Referral bonus multiplier</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

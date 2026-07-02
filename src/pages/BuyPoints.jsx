import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { ToastContext } from '../context/ToastContext';
import { initializePayment, generateReference } from '../services/paystack';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';
import {
  IconBolt,
  IconBuyPoints,
  IconTarget,
  IconParty,
  IconCheckmark,
  IconArrowLeft,
} from '../components/Icons';

export default function BuyPoints() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const { modal, closeModal } = useConfirm();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  const pointPackages = [
    {
      id: 'starter',
      points: 5000,
      price: 500,
      pricePerPoint: 0.10,
      description: 'Get started',
      popular: false,
      color: 'from-blue-400 to-blue-600',
      badge: null,
      referralBonus: 250,
      savings: '80% off'
    },
    {
      id: 'standard',
      points: 10000,
      price: 900,
      pricePerPoint: 0.09,
      description: 'Most popular',
      popular: true,
      color: 'from-indigo-400 to-indigo-600',
      badge: '10% off',
      referralBonus: 500,
      savings: '82% off'
    },
    {
      id: 'boost',
      points: 25000,
      price: 2000,
      pricePerPoint: 0.08,
      description: 'Better value',
      popular: false,
      color: 'from-purple-400 to-purple-600',
      badge: '20% off',
      referralBonus: 1500,
      savings: '84% off'
    },
    {
      id: 'premium',
      points: 50000,
      price: 3500,
      pricePerPoint: 0.07,
      description: 'Best savings',
      popular: false,
      color: 'from-pink-400 to-pink-600',
      badge: '30% off',
      referralBonus: 3500,
      savings: '86% off'
    },
  ];

  const handlePurchase = async (pkg) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      addToast('Please log in first', 'error');
      return;
    }

    setLoading(true);

    try {
      // Generate payment reference
      const reference = generateReference();

      // Initialize Paystack payment popup
      addToast('Opening payment form...', 'info');
      await initializePayment({
        email: session.user.email,
        amount: pkg.price,
        reference: reference,
        metadata: {
          userId: session.user.id,
          points: pkg.points,
          packageId: pkg.id,
        },
      });

      // Payment successful - verify with Supabase Edge Function
      addToast('Verifying payment...', 'info');
      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verifyPaystackPayment', {
        body: { reference },
      });

      if (verifyError || !verifyResult.success) {
        throw new Error('Payment verification failed');
      }

      addToast('Payment verified! Crediting points...', 'info');

      // Credit points via Supabase Edge Function
      const { data: creditResult, error: creditError } = await supabase.functions.invoke('creditPointsAfterPayment', {
        body: {
          reference,
          packageId: pkg.id,
          points: pkg.points,
        },
      });

      if (creditError || !creditResult.success) {
        throw new Error('Failed to credit points');
      }

      // Update local state
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!fetchError && updatedUser) {
        setUserData(updatedUser);
      }

      addToast(`✓ ${pkg.points} points added to your account!`, 'success');
      addToast(`Bonus: +${pkg.referralBonus} points (referral)!`, 'success');

      // Redirect after 2 seconds
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      // Payment cancelled or failed
      if (err.message.includes('closed') || err.message.includes('popup')) {
        addToast('Payment cancelled', 'warning');
      } else {
        console.error('Payment error:', err);
        addToast('Payment failed: ' + err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <IconArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <IconBuyPoints className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Buy Points</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Get Points Instantly</h2>
          <p className="text-xl text-gray-600 mb-2">Speed up your rewards with flexible packages</p>
          <p className="text-lg text-primary font-semibold">Starting from ₦0.07 per point!</p>
          <p className="text-sm text-green-600 font-semibold">80%+ savings compared to old pricing</p>
        </div>

        {/* Point Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {pointPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
                pkg.popular ? 'md:scale-105 ring-2 ring-indigo-500' : ''
              } cursor-pointer`}
              onClick={() => setSelectedPackage(pkg)}
            >
              <div className={`bg-gradient-to-br ${pkg.color} p-8 text-white relative`}>
                {pkg.popular && (
                  <div className="absolute top-3 right-3 bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                    Popular
                  </div>
                )}
                {pkg.badge && (
                  <div className="absolute top-3 left-3 bg-yellow-300 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                    {pkg.badge}
                  </div>
                )}

                <div className="mb-6 pt-8">
                  <p className="text-sm opacity-90 mb-2">{pkg.description}</p>
                  <p className="text-4xl font-bold">{pkg.points.toLocaleString()}</p>
                  <p className="text-sm opacity-75">points</p>
                </div>

                <div className="bg-white/10 rounded p-3 mb-4">
                  <p className="text-xs opacity-75 mb-1">Rate</p>
                  <p className="font-bold">₦{pkg.pricePerPoint.toFixed(2)}/point</p>
                </div>

                <div className="border-t border-white/30 pt-6 mb-4">
                  <p className="text-sm opacity-90 mb-1">Total Price</p>
                  <p className="text-3xl font-bold">₦{pkg.price.toLocaleString()}</p>
                </div>

                <div className="bg-white/10 rounded p-2 mb-4 text-xs">
                  <p className="opacity-75 mb-1">Referral Bonus</p>
                  <p className="font-bold">+₦{pkg.referralBonus}</p>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchase(pkg);
                  }}
                  disabled={loading && selectedPackage?.id === pkg.id}
                  variant={selectedPackage?.id === pkg.id ? 'primary' : 'outline'}
                  size="md"
                  fullWidth
                  loading={loading && selectedPackage?.id === pkg.id}
                >
                  {loading && selectedPackage?.id === pkg.id ? 'Processing...' : 'Buy Now'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Why Buy Points?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600">
                <IconBolt className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Instant Access</h4>
              <p className="text-gray-600">Redeem for rewards immediately. No waiting for points to accumulate.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 text-green-600">
                <IconBuyPoints className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">80% Cheaper</h4>
              <p className="text-gray-600">Used to pay ₦250 for 500 pts. Now get 5,000 pts for just ₦500!</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-orange-600">
                <IconTarget className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Flexible</h4>
              <p className="text-gray-600">Choose your package. Use points for airtime, data, or gift cards.</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">How It Works</h3>
          <div className="space-y-3 text-gray-700">
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">1.</span>
              <span>Choose a point package above</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">2.</span>
              <span>Select your payment method (Paystack, bank transfer, card)</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">3.</span>
              <span>Points appear instantly in your account</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="font-bold text-primary min-w-6">4.</span>
              <span>Head to Marketplace and redeem for airtime, data, or gift cards</span>
            </p>
          </div>
        </div>
      </div>
      <Modal {...modal} onClose={closeModal} />
    </div>
  );
}

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { ToastContext } from '../context/ToastContext';
import { initializePayment, generateReference } from '../services/paystack';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { IconArrowLeft, IconRocket, IconCheckmark, IconStar } from '../components/Icons';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PremiumTier() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const premiumPrice = 999; // ₦999/month
  const premiumBenefits = [
    { text: '2x Points on all activities', icon: 'IconStar' },
    { text: 'No ads on video rewards', icon: 'IconCheckmark' },
    { text: 'Instant point redemption', icon: 'IconRocket' },
    { text: 'Priority customer support', icon: 'IconCheckmark' },
    { text: 'Exclusive cosmetics', icon: 'IconStar' },
    { text: 'Early access to features', icon: 'IconRocket' },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!auth.currentUser) {
      addToast('Please log in first', 'error');
      return;
    }

    setProcessing(true);

    try {
      // Check if already subscribed
      if (userData?.premiumUntil && new Date(userData.premiumUntil) > new Date()) {
        addToast('You already have an active premium subscription!', 'warning');
        setProcessing(false);
        return;
      }

      // Generate payment reference
      const reference = generateReference();

      // Initialize Paystack payment
      addToast('Opening payment form...', 'info');
      await initializePayment({
        email: auth.currentUser.email,
        amount: premiumPrice,
        reference: reference,
        metadata: {
          userId: auth.currentUser.uid,
          type: 'premium_subscription',
        },
      });

      // Verify payment
      addToast('Verifying payment...', 'info');
      const functions = getFunctions();
      const verifyPayment = httpsCallable(functions, 'verifyPaystackPayment');
      const verifyResult = await verifyPayment({ reference });

      if (!verifyResult.data.success) {
        throw new Error('Payment verification failed');
      }

      // Activate premium via Cloud Function
      addToast('Activating premium...', 'info');
      const activatePremium = httpsCallable(functions, 'activatePremium');
      const activateResult = await activatePremium({ reference });

      if (!activateResult.data.success) {
        throw new Error('Failed to activate premium');
      }

      // Update local state
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const updatedUser = userDoc.data();
      setUserData(updatedUser);

      addToast('✓ Premium activated for 30 days!', 'success');
      addToast('Enjoy 2x points on all activities!', 'success');

      // Redirect after 2 seconds
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      if (err.message.includes('closed') || err.message.includes('popup')) {
        addToast('Payment cancelled', 'warning');
      } else {
        console.error('Subscription error:', err);
        addToast('Error: ' + err.message, 'error');
      }
    } finally {
      setProcessing(false);
    }
  };

  const isPremium = userData?.premiumTier && userData?.premiumUntil &&
    new Date(userData.premiumUntil) > new Date();

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

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
                <IconRocket className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-primary">Premium Tier</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isPremium && (
          <div className="bg-green-100 border-2 border-green-500 text-green-800 rounded-lg p-4 mb-8">
            <p className="font-bold">✓ You have an active premium subscription until {new Date(userData.premiumUntil).toLocaleDateString()}</p>
          </div>
        )}

        {/* Hero */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-lg p-12 mb-12 text-center">
          <h2 className="text-5xl font-bold mb-4">Go Premium</h2>
          <p className="text-2xl text-purple-100 mb-6">Earn 2x points on everything</p>
          <div className="text-6xl font-bold mb-2">₦999</div>
          <p className="text-purple-100">Per month</p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {premiumBenefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-white rounded-lg p-6 shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                <IconCheckmark className="w-6 h-6" />
              </div>
              <p className="text-gray-800 font-semibold">{benefit.text}</p>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Compare Plans</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-gray-800">Feature</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-800">Free</th>
                  <th className="text-center py-3 px-4 font-bold text-purple-600">Premium</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-800">Points per activity</td>
                  <td className="text-center py-3 px-4">1x</td>
                  <td className="text-center py-3 px-4 font-bold text-purple-600">2x</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-800">Video ads</td>
                  <td className="text-center py-3 px-4">Yes (with ads)</td>
                  <td className="text-center py-3 px-4 font-bold text-purple-600">No ads</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-800">Redemption speed</td>
                  <td className="text-center py-3 px-4">24-48 hours</td>
                  <td className="text-center py-3 px-4 font-bold text-purple-600">Instant</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-800">Leaderboard rank</td>
                  <td className="text-center py-3 px-4">Standard</td>
                  <td className="text-center py-3 px-4 font-bold text-purple-600">Premium badge</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-800">Exclusive cosmetics</td>
                  <td className="text-center py-3 px-4">No</td>
                  <td className="text-center py-3 px-4 font-bold text-purple-600">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ROI Calculation */}
        <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Your ROI</h3>
          <div className="space-y-3 text-gray-700">
            <p className="flex justify-between">
              <span>Premium cost:</span>
              <span className="font-bold">₦999</span>
            </p>
            <p className="flex justify-between">
              <span>Daily earnings (free):</span>
              <span className="font-bold">~₦100</span>
            </p>
            <p className="flex justify-between">
              <span>Daily earnings (premium - 2x):</span>
              <span className="font-bold text-purple-600">~₦200</span>
            </p>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Break-even in:</span>
              <span className="text-purple-600">~5 days</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">After 5 days, premium pays for itself through 2x points!</p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={handleSubscribe}
            disabled={isPremium || processing}
            variant="primary"
            size="lg"
            className="min-w-64"
            loading={processing}
          >
            {isPremium ? '✓ Already Premium' : 'Subscribe Now (₦999/month)'}
          </Button>
          <p className="text-gray-600 text-sm mt-4">Cancel anytime. First 30 days start immediately.</p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { supabase } from '../config/supabase';

export default function Referrals() {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const [referrals, setReferrals] = useState([]);
  const [referralCode, setReferralCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      // Generate or retrieve referral code
      let code = profile?.referral_code;
      if (!code) {
        code = generateReferralCode(user.id);
        await supabase
          .from('users')
          .update({ referral_code: code })
          .eq('id', user.id);
      }
      setReferralCode(code);

      // Fetch referrals
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      setReferrals(data || []);

      // Calculate total earned
      const earned = data?.reduce((sum, ref) => {
        return sum + (ref.status === 'completed' ? 500 : 0);
      }, 0) || 0;
      setTotalEarned(earned);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = (userId) => {
    const prefix = userId.substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      addToast('Referral code copied!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      addToast('Failed to copy code', 'error');
    }
  };

  const getShareLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${referralCode}`;
  };

  const handleShareLink = async () => {
    try {
      const link = getShareLink();
      await navigator.clipboard.writeText(link);
      addToast('Share link copied!', 'success');
    } catch (error) {
      addToast('Failed to copy link', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading referral data...</div>
      </div>
    );
  }

  const successfulReferrals = referrals.filter(r => r.status === 'completed').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Referrals</h1>
        <p className="text-gray-600 mb-6">Earn points by inviting friends</p>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Total Earned</p>
            <p className="text-3xl font-bold">+{totalEarned}</p>
            <p className="text-xs opacity-75 mt-2">points from referrals</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Successful</p>
            <p className="text-3xl font-bold">{successfulReferrals}</p>
            <p className="text-xs opacity-75 mt-2">friends joined</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Pending</p>
            <p className="text-3xl font-bold">{pendingReferrals}</p>
            <p className="text-xs opacity-75 mt-2">awaiting verification</p>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Your Referral Code</h2>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-4 border-2 border-dashed border-purple-300">
            <p className="text-center text-gray-600 mb-2">Share this code with friends</p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-2xl font-bold text-purple-600">{referralCode}</code>
              <button
                onClick={handleCopyCode}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  copiedCode
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copiedCode ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            onClick={handleShareLink}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition mb-4"
          >
            📋 Copy Share Link
          </button>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${getShareLink()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              📘 Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=Join HASKii and earn points!&url=${getShareLink()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-500 text-white text-center py-2 rounded-lg hover:bg-sky-600 transition font-semibold"
            >
              𝕏 Twitter
            </a>
          </div>
        </div>

        {/* Referral List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Your Referrals</h2>

          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-2">No referrals yet</p>
              <p className="text-sm text-gray-500">Start sharing your code to earn points!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map(referral => {
                const isCompleted = referral.status === 'completed';

                return (
                  <div
                    key={referral.id}
                    className={`rounded-lg p-4 border-l-4 ${
                      isCompleted
                        ? 'bg-green-50 border-green-500'
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {referral.referee_name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {referral.referee_email || 'Email not shared'}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Joined {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right ml-4">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            isCompleted
                              ? 'bg-green-200 text-green-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}
                        >
                          {isCompleted ? '✓ Verified' : 'Pending'}
                        </span>
                        {isCompleted && (
                          <p className="text-lg font-bold text-green-600 mt-2">+500</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              <span className="font-bold">💰 Bonus:</span> Earn 500 points when a friend signs up and completes their profile!
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-green-900 text-sm">
              <span className="font-bold">🎯 Referral Tips:</span> Share with classmates, on social media, or in campus groups. More shares = more points!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

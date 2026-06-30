import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function Referrals() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [referralHistory, setReferralHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const navigate = useNavigate();

  const referralCode = auth.currentUser?.uid?.substring(0, 8).toUpperCase() || '';
  const referralLink = `https://campus-x-haske.vercel.app/signup?ref=${referralCode}`;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        setUser(auth.currentUser);
      }
      await fetchReferralStats();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const fetchReferralStats = async () => {
    try {
      // Get referrals made by this user
      const madeQuery = query(
        collection(db, 'referrals'),
        where('referrerId', '==', auth.currentUser.uid)
      );

      const madeSnapshot = await getDocs(madeQuery);
      const madeReferrals = madeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const successful = madeReferrals.filter(r => r.status === 'completed');
      const pending = madeReferrals.filter(r => r.status === 'pending');

      const totalEarned = successful.reduce((sum, r) => sum + r.reward, 0);

      setReferralStats({
        totalReferrals: madeReferrals.length,
        successfulReferrals: successful.length,
        pendingReferrals: pending.length,
        totalEarned,
        potentialEarning: (pending.length * 500) + totalEarned
      });

      setReferralHistory(madeReferrals.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10));
    } catch (err) {
      console.error('Error fetching referral stats:', err);
      setReferralStats({
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        totalEarned: 0,
        potentialEarning: 0
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `🎉 Join Haske Campus App!\n\nJoin me and earn points! 💰\n\n` +
      `Download: ${referralLink}\n\n` +
      `Get bonus points when you join with my code!\n- ${user?.displayName || 'Friend'}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(
      `🚀 Join Haske Campus App and earn points!\n\n` +
      `Use my referral code: ${referralCode}\n\n` +
      `${referralLink}\n\n` +
      `#Haske #CampusApp #EarnPoints`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
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
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary"
              >
                Dashboard
              </button>
              <div className="text-lg font-bold text-primary">
                ⭐ {userData?.points || 0} pts
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">👑 Referral Program</h1>
          <p className="text-green-100">Invite friends and earn rewards! Build your network and grow your points.</p>
        </div>

        {/* Referral Code Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Referral Code</h2>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-8 mb-6">
            <p className="text-gray-600 mb-2">Your Unique Code</p>
            <p className="text-4xl font-bold text-primary font-mono mb-6">{referralCode}</p>

            <div className="bg-white rounded-lg p-4 mb-6 break-all">
              <p className="text-sm text-gray-600 mb-2">Referral Link</p>
              <p className="text-sm font-mono text-gray-800">{referralLink}</p>
            </div>

            <button
              onClick={copyToClipboard}
              className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition"
            >
              {copiedCode ? '✓ Copied to Clipboard!' : 'Copy Link'}
            </button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={shareViaWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition"
            >
              💬 Share WhatsApp
            </button>
            <button
              onClick={shareViaTwitter}
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition"
            >
              𝕏 Share Twitter
            </button>
            <a
              href={`mailto:?subject=Join Haske Campus App&body=Join me on Haske: ${referralLink}`}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition text-center"
            >
              📧 Share Email
            </a>
          </div>
        </div>

        {/* Stats */}
        {referralStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm mb-2">Total Referrals</p>
              <p className="text-4xl font-bold text-primary">{referralStats.totalReferrals}</p>
              <p className="text-xs text-gray-500 mt-2">
                {referralStats.successfulReferrals} successful, {referralStats.pendingReferrals} pending
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm mb-2">Points Earned</p>
              <p className="text-4xl font-bold text-primary">+{referralStats.totalEarned}</p>
              <p className="text-xs text-gray-500 mt-2">From successful referrals</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm mb-2">Potential Earning</p>
              <p className="text-4xl font-bold text-green-600">+{referralStats.potentialEarning}</p>
              <p className="text-xs text-gray-500 mt-2">Including pending referrals</p>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-8 mb-8 rounded">
          <h3 className="text-2xl font-bold text-blue-900 mb-4">💡 How Referrals Work</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="text-3xl">1️⃣</div>
              <div>
                <p className="font-bold text-blue-900">Share Your Code</p>
                <p className="text-blue-700">Send your referral code to friends via WhatsApp, Twitter, email, or SMS</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">2️⃣</div>
              <div>
                <p className="font-bold text-blue-900">Friend Signs Up</p>
                <p className="text-blue-700">They use your code when registering. They get 50 bonus points!</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">3️⃣</div>
              <div>
                <p className="font-bold text-blue-900">You Earn Points</p>
                <p className="text-blue-700">You get 500 points for each successful referral</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">4️⃣</div>
              <div>
                <p className="font-bold text-blue-900">Keep Growing</p>
                <p className="text-blue-700">No limit on referrals. More friends = more points!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Tiers */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🎁 Referral Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6 text-center border-t-4 border-blue-500">
              <p className="text-4xl mb-2">🔰</p>
              <p className="font-bold text-gray-800">Starter</p>
              <p className="text-sm text-gray-600 mb-3">1-5 referrals</p>
              <p className="text-2xl font-bold text-primary">+500 pts</p>
              <p className="text-xs text-gray-500 mt-2">per referral</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center border-t-4 border-green-500">
              <p className="text-4xl mb-2">⭐</p>
              <p className="font-bold text-gray-800">Growing</p>
              <p className="text-sm text-gray-600 mb-3">6-15 referrals</p>
              <p className="text-2xl font-bold text-green-600">+150 pts</p>
              <p className="text-xs text-gray-500 mt-2">per referral</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center border-t-4 border-yellow-500">
              <p className="text-4xl mb-2">🌟</p>
              <p className="font-bold text-gray-800">Champion</p>
              <p className="text-sm text-gray-600 mb-3">16-30 referrals</p>
              <p className="text-2xl font-bold text-yellow-600">+200 pts</p>
              <p className="text-xs text-gray-500 mt-2">per referral</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-center border-t-4 border-red-500">
              <p className="text-4xl mb-2">👑</p>
              <p className="font-bold text-gray-800">Legend</p>
              <p className="text-sm text-gray-600 mb-3">30+ referrals</p>
              <p className="text-2xl font-bold text-red-600">+250 pts</p>
              <p className="text-xs text-gray-500 mt-2">per referral</p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        {referralHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Recent Referrals</h2>
            <div className="space-y-4">
              {referralHistory.map((referral, idx) => (
                <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-bold text-gray-800">{referral.referreeName || 'User'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(referral.timestamp?.toDate?.() || referral.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold mb-1 ${
                      referral.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      +{referral.reward} pts
                    </p>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      referral.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {referral.status === 'completed' ? '✓ Complete' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {referralHistory.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <p className="text-4xl mb-4">🤝</p>
            <p className="text-xl font-bold text-gray-800 mb-2">No Referrals Yet</p>
            <p className="text-gray-600 mb-6">Start sharing your code with friends to earn rewards!</p>
            <button
              onClick={copyToClipboard}
              className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Copy Your Referral Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

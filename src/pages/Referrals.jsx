import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { ToastContext } from '../context/ToastContext';
import { recordGettingStartedActivity, updateUserPoints } from '../utils/databaseHelpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Referrals() {
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [referees, setReferees] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, earned: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const referralLink = `https://campus-x-haske.vercel.app/signup?ref=${referralCode}`;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      setUser(session.user);
      const code = session.user.id.substring(0, 8).toUpperCase();
      setReferralCode(code);

      const { data: userData } = await supabase
        .from('users')
        .select('points, full_name')
        .eq('id', session.user.id)
        .single();

      if (userData) setUserData(userData);

      // Fetch all referrals where current user is the referrer
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      if (!referrals || referrals.length === 0) {
        setReferees([]);
        setStats({ total: 0, completed: 0, pending: 0, earned: 0 });
        setLoading(false);
        return;
      }

      // Fetch referee profile data to check completion status
      const refereeIds = referrals.map(r => r.referee_id);
      const { data: refereeUsers } = await supabase
        .from('users')
        .select('id, full_name, profile_complete, created_at')
        .in('id', refereeIds);

      const refereeMap = {};
      (refereeUsers || []).forEach(u => { refereeMap[u.id] = u; });

      // Merge referral rows with referee user data
      const mergedReferees = referrals.map(r => ({
        ...r,
        refereeUser: refereeMap[r.referee_id] || null,
        completed: refereeMap[r.referee_id]?.profile_complete === true,
      }));

      // Auto-award points for completed referrals not yet paid out
      let totalEarned = 0;
      let newlyAwarded = 0;
      let freshPoints = userData?.points || 0;

      for (const ref of mergedReferees) {
        if (ref.completed && !ref.points_awarded) {
          // Award 500 pts to referrer for this completed referral
          const { error: updateError } = await supabase
            .from('referrals')
            .update({ points_awarded: true })
            .eq('id', ref.id);

          if (!updateError) {
            freshPoints += ref.reward || 500;
            newlyAwarded += ref.reward || 500;
            ref.points_awarded = true;

            // Log transaction
            await supabase.from('transactions').insert({
              user_id: session.user.id,
              type: 'referral',
              amount: ref.reward || 500,
              description: `Referral completed: ${ref.referee_name || ref.refereeUser?.full_name || 'Friend'}`,
              timestamp: new Date().toISOString(),
            });
          }
        }

        if (ref.points_awarded) {
          totalEarned += ref.reward || 500;
        }
      }

      // Update referrer's total points if any were newly awarded
      if (newlyAwarded > 0) {
        await updateUserPoints(session.user.id, freshPoints);
        setUserData(prev => ({ ...prev, points: freshPoints }));
        addToast(`🎉 You earned ${newlyAwarded} pts from completed referrals!`, 'success');
      }

      // Award getting-started task for first referral
      const anyCompleted = mergedReferees.some(r => r.completed);
      if (anyCompleted) {
        try {
          const result = await recordGettingStartedActivity(
            session.user.id, 'refer', 'Refer a Friend', 50
          );
          if (result.success) {
            await updateUserPoints(session.user.id, freshPoints + 50);
            setUserData(prev => ({ ...prev, points: (prev?.points || 0) + 50 }));
          }
        } catch (err) {
          // Non-critical — task may already be completed
        }
      }

      const completed = mergedReferees.filter(r => r.completed).length;
      const pending = mergedReferees.length - completed;

      setReferees(mergedReferees);
      setStats({
        total: mergedReferees.length,
        completed,
        pending,
        earned: totalEarned + newlyAwarded,
      });
    } catch (err) {
      console.error('Error loading referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `🎉 Join Haske Campus App!\n\nEarn points and redeem rewards!\n\n${referralLink}\n\nUse my code: ${referralCode}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(
      `🚀 Join Haske Campus App and earn points!\n\nUse my code: ${referralCode}\n\n${referralLink}\n\n#Haske #CampusApp`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button onClick={() => navigate('/dashboard')} className="text-2xl font-bold text-primary">HASKE</button>
            <div className="flex gap-4 items-center">
              <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-primary">Dashboard</button>
              <div className="text-lg font-bold text-primary">⭐ {userData?.points || 0} pts</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-8">
          <h1 className="text-4xl font-bold mb-2">👑 Referral Program</h1>
          <p className="text-green-100">Invite friends, they complete their profile, you earn 500 pts per referral.</p>
        </div>

        {/* Referral Code Card */}
        <div className="bg-white rounded-xl shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Referral Code</h2>
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6 mb-6">
            <p className="text-gray-600 mb-1 text-sm">Your Unique Code</p>
            <p className="text-4xl font-bold text-primary font-mono mb-4">{referralCode}</p>
            <div className="bg-white rounded-lg p-3 mb-4 break-all">
              <p className="text-xs text-gray-500 mb-1">Referral Link</p>
              <p className="text-sm font-mono text-gray-700">{referralLink}</p>
            </div>
            <button
              onClick={copyToClipboard}
              className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition"
            >
              {copiedCode ? '✓ Copied!' : 'Copy Referral Link'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={shareViaWhatsApp} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-sm transition">
              💬 WhatsApp
            </button>
            <button onClick={shareViaTwitter} className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-sm transition">
              𝕏 Twitter
            </button>
            <a
              href={`mailto:?subject=Join Haske Campus App&body=Join me on Haske: ${referralLink}`}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-sm transition text-center"
            >
              📧 Email
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-gray-600 text-sm mt-1">Total Referrals</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-gray-600 text-sm mt-1">Completed</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-gray-600 text-sm mt-1">Pending</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">+{stats.earned}</p>
            <p className="text-gray-600 text-sm mt-1">Pts Earned</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-4">💡 How Referrals Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Share Your Link', desc: 'Send your referral link to friends via WhatsApp, Twitter, or email.' },
              { step: '2', title: 'Friend Signs Up', desc: 'They create an account using your link. They appear as "Pending" in your list.' },
              { step: '3', title: 'They Complete Profile', desc: 'Once they set their university and department, you automatically earn 500 pts!' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <span className="text-2xl font-bold text-blue-500 shrink-0">{step}.</span>
                <div>
                  <p className="font-bold text-blue-900">{title}</p>
                  <p className="text-blue-700 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referee List */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
            <h2 className="text-2xl font-bold">Your Referrals</h2>
            <p className="text-blue-100 text-sm mt-1">
              {stats.pending > 0
                ? `${stats.pending} friend${stats.pending > 1 ? 's' : ''} still need${stats.pending === 1 ? 's' : ''} to complete their profile`
                : stats.completed > 0
                ? 'All your referrals are complete!'
                : 'No referrals yet — share your link!'}
            </p>
          </div>

          {referees.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-5xl mb-4">🤝</p>
              <p className="text-xl font-bold text-gray-800 mb-2">No Referrals Yet</p>
              <p className="text-gray-600 mb-6">Share your referral link with friends to start earning!</p>
              <button
                onClick={copyToClipboard}
                className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                Copy Your Referral Link
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {referees.map((ref) => {
                const name = ref.referee_name || ref.refereeUser?.full_name || ref.referee_email || 'Unknown';
                const joinDate = ref.created_at
                  ? new Date(ref.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';
                return (
                  <div key={ref.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${ref.completed ? 'bg-green-500' : 'bg-gray-400'}`}>
                        {name[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{name}</p>
                        {ref.referee_email && (
                          <p className="text-xs text-gray-500">{ref.referee_email}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">Joined {joinDate}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {ref.completed ? (
                        <>
                          <p className="font-bold text-green-600">+{ref.reward || 500} pts</p>
                          <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded mt-1">
                            ✓ Complete
                          </span>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-400 text-sm font-semibold">+{ref.reward || 500} pts</p>
                          <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded mt-1">
                            ⏳ Pending Profile
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rewards Tiers */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎁 Referral Rewards</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '🔰', label: 'Starter', range: '1–5', pts: 500, color: 'border-blue-500' },
              { emoji: '⭐', label: 'Growing', range: '6–15', pts: 500, color: 'border-green-500' },
              { emoji: '🌟', label: 'Champion', range: '16–30', pts: 500, color: 'border-yellow-500' },
              { emoji: '👑', label: 'Legend', range: '30+', pts: 500, color: 'border-red-500' },
            ].map(t => (
              <div key={t.label} className={`bg-white rounded-xl shadow p-5 text-center border-t-4 ${t.color}`}>
                <p className="text-4xl mb-2">{t.emoji}</p>
                <p className="font-bold text-gray-800">{t.label}</p>
                <p className="text-sm text-gray-500 mb-2">{t.range} referrals</p>
                <p className="text-2xl font-bold text-primary">+{t.pts} pts</p>
                <p className="text-xs text-gray-400">per referral</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

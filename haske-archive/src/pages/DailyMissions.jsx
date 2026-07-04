import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { insertTransaction } from '../utils/databaseHelpers';
import { ToastContext } from '../context/ToastContext';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  IconSun,
  IconVideoAds,
  IconMobile,
  IconUsers,
  IconShare,
  IconFilm,
  IconMissions,
  IconFire,
  IconStar,
  IconCheckmark,
  IconArrowRight,
} from '../components/Icons';

const MISSIONS = [
  {
    id: 'checkin',
    name: 'Daily Check-In',
    description: 'Check in today to keep your streak alive',
    reward: 250,
    difficulty: 'easy',
    icon: IconSun,
    link: '/streak',
  },
  {
    id: 'video_ad',
    name: 'Watch an Ad',
    description: 'Watch 1 video ad to completion',
    reward: 250,
    difficulty: 'easy',
    icon: IconVideoAds,
    link: '/video-ads',
  },
  {
    id: 'instagram',
    name: 'Follow a Brand',
    description: 'Follow a brand on Instagram',
    reward: 375,
    difficulty: 'easy',
    icon: IconMobile,
    link: '/instagram-follow',
  },
  {
    id: 'watch_videos',
    name: 'Watch 3 Videos',
    description: 'Complete 3 video ads today',
    reward: 1000,
    difficulty: 'medium',
    icon: IconFilm,
    link: '/video-ads',
  },
  {
    id: 'invite',
    name: 'Invite a Friend',
    description: 'Share your referral link with someone',
    reward: 500,
    difficulty: 'medium',
    icon: IconUsers,
    link: '/referrals',
  },
  {
    id: 'share',
    name: 'Share & Get a Signup',
    description: 'Share your link and get 1 friend to sign up',
    reward: 1250,
    difficulty: 'hard',
    icon: IconShare,
    link: '/referrals',
  },
];

const DIFFICULTY_STYLE = {
  easy: { badge: 'bg-yellow-100 text-yellow-800', icon: 'bg-yellow-100 text-yellow-600' },
  medium: { badge: 'bg-orange-100 text-orange-800', icon: 'bg-orange-100 text-orange-600' },
  hard: { badge: 'bg-red-100 text-red-800', icon: 'bg-red-100 text-red-600' },
};

const COMBO_RULES = [
  { label: 'Complete All Easy', count: 3, difficulty: 'easy', bonus: 250 },
  { label: 'Complete All Medium', count: 2, difficulty: 'medium', bonus: 300 },
  { label: 'Complete All Missions', count: MISSIONS.length, difficulty: 'all', bonus: 1000 },
];

function MissionCard({ mission, done, onStart }) {
  const style = DIFFICULTY_STYLE[mission.difficulty];
  const Icon = mission.icon;
  return (
    <div className={`rounded-lg shadow p-5 transition-shadow ${done ? 'bg-green-50 border-2 border-green-500' : 'bg-white hover:shadow-lg'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${style.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${style.badge}`}>
          {mission.difficulty}
        </span>
      </div>
      <h3 className="font-bold text-gray-800 mb-1">{mission.name}</h3>
      <p className="text-gray-500 text-sm mb-4">{mission.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-primary">+{mission.reward}</span>
        {done ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
            <IconCheckmark className="w-4 h-4" /> Done
          </span>
        ) : (
          <Button onClick={() => onStart(mission)} variant="primary" size="sm">
            <span className="flex items-center gap-1">
              Start <IconArrowRight className="w-4 h-4" />
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function DailyMissions() {
  const [userData, setUserData] = useState(null);
  const [completedToday, setCompletedToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useContext(ToastContext);

  const refreshMissions = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const todayDate = todayStart.toISOString().split('T')[0];

      // Fetch already-awarded missions from DB
      const { data: missionRows } = await supabase
        .from('daily_missions')
        .select('mission_id')
        .eq('user_id', session.user.id)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', tomorrowStart.toISOString());

      const awarded = new Set((missionRows || []).map(r => r.mission_id));
      const completed = new Set(awarded);

      // Auto-detect: check-in
      if (!completed.has('checkin')) {
        const { data: ciRows } = await supabase
          .from('streak_check_ins')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('check_in_date', todayDate);
        if (ciRows?.length > 0) {
          completed.add('checkin');
          if (!awarded.has('checkin')) await awardMission(session.user.id, 'checkin', 'Daily Check-In', 250, awarded);
        }
      }

      // Auto-detect: video ads
      const { data: adRows } = await supabase
        .from('video_ads_watched')
        .select('id')
        .eq('user_id', session.user.id)
        .gte('watched_at', todayStart.toISOString())
        .lt('watched_at', tomorrowStart.toISOString());

      const adCount = adRows?.length || 0;
      if (adCount >= 1 && !completed.has('video_ad')) {
        completed.add('video_ad');
        if (!awarded.has('video_ad')) await awardMission(session.user.id, 'video_ad', 'Watch an Ad', 250, awarded);
      }
      if (adCount >= 3 && !completed.has('watch_videos')) {
        completed.add('watch_videos');
        if (!awarded.has('watch_videos')) await awardMission(session.user.id, 'watch_videos', 'Watch 3 Videos', 1000, awarded);
      }

      // Auto-detect: Instagram follow
      if (!completed.has('instagram')) {
        const { data: igRows } = await supabase
          .from('instagram_follows')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('verified', true);
        if (igRows?.length > 0) {
          completed.add('instagram');
          if (!awarded.has('instagram')) await awardMission(session.user.id, 'instagram', 'Follow a Brand', 375, awarded);
        }
      }

      setCompletedToday([...completed]);
    } catch (err) {
      console.error('[DailyMissions] refreshMissions error:', err);
    }
  }, []);

  // Award mission points: insert DB row first (duplicate guard), then update points
  const awardMission = async (userId, missionId, missionName, reward, awarded) => {
    // Guard: don't re-award if already in awarded set
    if (awarded.has(missionId)) return;

    const { error: insertError } = await supabase.from('daily_missions').insert({
      user_id: userId,
      mission_id: missionId,
      mission_name: missionName,
      base_reward: reward,
      completed: true,
      completed_at: new Date().toISOString(),
    });

    if (insertError) {
      // Likely duplicate — silently skip
      return;
    }

    const { data: freshUser } = await supabase
      .from('users').select('points').eq('id', userId).single();
    if (!freshUser) return;

    const newPoints = freshUser.points + reward;
    const { data: updated } = await supabase
      .from('users').update({ points: newPoints }).eq('id', userId).select('id');

    if (!updated?.length) {
      // Rollback mission row
      await supabase.from('daily_missions')
        .delete().eq('user_id', userId).eq('mission_id', missionId);
      return;
    }

    await insertTransaction(userId, 'mission', reward, `Daily Mission: ${missionName}`);
    addToast(`Mission complete! +${reward} pts`, 'success');
    setUserData(prev => prev ? { ...prev, points: newPoints } : prev);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user } = await supabase
        .from('users').select('*').eq('id', session.user.id).single();
      if (user) setUserData(user);

      await refreshMissions();
      setLoading(false);
    };

    init();
  }, [refreshMissions]);

  // Re-check when user returns to this tab/page
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshMissions();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshMissions]);

  const handleStart = (mission) => {
    navigate(mission.link, { state: { returnTo: '/daily-missions' } });
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const easyMissions = MISSIONS.filter(m => m.difficulty === 'easy');
  const mediumMissions = MISSIONS.filter(m => m.difficulty === 'medium');
  const hardMissions = MISSIONS.filter(m => m.difficulty === 'hard');
  const totalPossible = MISSIONS.reduce((s, m) => s + m.reward, 0) +
    COMBO_RULES.reduce((s, r) => s + r.bonus, 0);

  const comboEarned = COMBO_RULES.reduce((sum, rule) => {
    const count = rule.difficulty === 'all'
      ? completedToday.length
      : MISSIONS.filter(m => m.difficulty === rule.difficulty && completedToday.includes(m.id)).length;
    return count >= rule.count ? sum + rule.bonus : sum;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary text-sm font-semibold"
              >
                ← Dashboard
              </button>
              <div className="flex items-center gap-2 text-lg font-bold text-primary">
                <IconStar className="w-5 h-5" />
                {userData?.points?.toLocaleString() || 0} pts
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow p-8 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <IconMissions className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Daily Missions</h1>
          </div>
          <p className="text-blue-100 mb-6">Complete missions to earn points. Finish sets for combo bonuses!</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-100">Completed</p>
              <p className="text-3xl font-bold">{completedToday.length}/{MISSIONS.length}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Max Reward</p>
              <p className="text-3xl font-bold">+{totalPossible.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Combo Earned</p>
              <p className="text-3xl font-bold text-yellow-300">
                {comboEarned > 0 ? `+${comboEarned}` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-xl shadow px-6 py-4 mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Today's progress</span>
            <span>{Math.round((completedToday.length / MISSIONS.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completedToday.length / MISSIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Easy */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-5 bg-yellow-400 rounded-full" />
            Easy Tasks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {easyMissions.map(m => (
              <MissionCard key={m.id} mission={m} done={completedToday.includes(m.id)} onStart={handleStart} />
            ))}
          </div>
        </section>

        {/* Medium */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-5 bg-orange-400 rounded-full" />
            Medium Tasks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mediumMissions.map(m => (
              <MissionCard key={m.id} mission={m} done={completedToday.includes(m.id)} onStart={handleStart} />
            ))}
          </div>
        </section>

        {/* Hard */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-5 bg-red-400 rounded-full" />
            Hard Tasks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hardMissions.map(m => (
              <MissionCard key={m.id} mission={m} done={completedToday.includes(m.id)} onStart={handleStart} />
            ))}
          </div>
        </section>

        {/* Combo Bonuses */}
        <section className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconFire className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-800">Combo Bonuses</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COMBO_RULES.map(rule => {
              const count = rule.difficulty === 'all'
                ? completedToday.length
                : MISSIONS.filter(m => m.difficulty === rule.difficulty && completedToday.includes(m.id)).length;
              const unlocked = count >= rule.count;
              return (
                <div key={rule.label} className={`bg-white rounded-lg p-4 border-2 transition ${unlocked ? 'border-green-400' : 'border-transparent'}`}>
                  <p className="text-sm text-gray-600 mb-1">{rule.label}</p>
                  <p className={`text-2xl font-bold ${unlocked ? 'text-green-600' : 'text-gray-800'}`}>
                    +{rule.bonus} pts
                  </p>
                  {unlocked
                    ? <p className="text-xs text-green-600 font-semibold mt-1">✓ Unlocked!</p>
                    : <p className="text-xs text-gray-500 mt-1">{rule.count - count} more to go</p>
                  }
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

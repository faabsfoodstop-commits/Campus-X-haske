import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, callEdgeFunction } from '../config/supabase';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useConfirm } from '../hooks/useConfirm';
import {
  IconSun,
  IconVideoAds,
  IconMobile,
  IconProfile,
  IconUsers,
  IconMarketplace,
  IconShare,
  IconFilm,
  IconMissions,
  IconFire,
  IconStar,
  IconCheckmark,
  IconSettings2,
  IconArrowRight,
} from '../components/Icons';

export default function DailyMissions() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [missions, setMissions] = useState([]);
  const [completedToday, setCompletedToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comboBonus, setComboBonus] = useState(0);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const { alert: showAlert, confirm, modal, closeModal } = useConfirm();

  const missionIcons = {
    checkin: IconSun,
    video_ad: IconVideoAds,
    instagram: IconMobile,
    profile: IconProfile,
    invite: IconUsers,
    explore: IconMarketplace,
    share: IconShare,
    watch_videos: IconFilm,
  };

  const availableMissions = [
    {
      id: 'checkin',
      name: 'Morning Check-In',
      description: 'Check in before 9 AM',
      reward: 250,
      difficulty: 'easy',
      link: '/streak-manager'
    },
    {
      id: 'video_ad',
      name: 'Watch an Ad',
      description: 'Watch 1 video ad',
      reward: 250,
      difficulty: 'easy',
      link: '/video-ads'
    },
    {
      id: 'instagram',
      name: 'Follow a Brand',
      description: 'Follow @haske_campus on Instagram',
      reward: 375,
      difficulty: 'easy',
      link: '/instagram-follow'
    },
    {
      id: 'profile',
      name: 'Complete Profile',
      description: 'Add university & course info',
      reward: 750,
      difficulty: 'medium',
      link: '/profile'
    },
    {
      id: 'invite',
      name: 'Invite Friends',
      description: 'Send referral to 2 friends',
      reward: 500,
      difficulty: 'medium',
      link: '/referrals'
    },
    {
      id: 'explore',
      name: 'Explore Marketplace',
      description: 'Browse 3+ marketplace items',
      reward: 375,
      difficulty: 'medium',
      link: '/marketplace'
    },
    {
      id: 'share',
      name: 'Share & Earn',
      description: 'Share to WhatsApp & get 1 signup',
      reward: 1250,
      difficulty: 'hard',
      link: '/referrals'
    },
    {
      id: 'watch_videos',
      name: 'Watch 3 Videos',
      description: 'Complete 3 video ads today',
      reward: 1000,
      difficulty: 'hard',
      link: '/video-ads'
    }
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  // Refresh missions when user returns to page (from activity)
  useEffect(() => {
    const handleFocus = async () => {
      await checkDailyMissionsWithAutoDetect();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (userData) {
        setUserData(userData);
        setUser(session.user);
      }
      await checkDailyMissionsSimple();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  // Simple check - just get completed missions (for initial load)
  const checkDailyMissionsSimple = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const todayDate = todayStart.toISOString().split('T')[0];

      const { data: missions, error } = await supabase
        .from('daily_missions')
        .select('mission_id')
        .eq('user_id', session.user.id)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', tomorrowStart.toISOString());

      if (error) throw error;

      const completed = missions.map(m => m.mission_id);

      // Also check streak_check_ins directly (in case daily_missions row isn't inserted yet)
      if (!completed.includes('checkin')) {
        const { data: checkInData } = await supabase
          .from('streak_check_ins')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('check_in_date', todayDate);
        if (checkInData?.length > 0) {
          completed.push('checkin');
        }
      }

      setCompletedToday(completed);

      // Calculate combo bonus
      const easyCount = availableMissions.filter(m => m.difficulty === 'easy' && completed.includes(m.id)).length;
      const mediumCount = availableMissions.filter(m => m.difficulty === 'medium' && completed.includes(m.id)).length;
      const allCompleted = completed.length === availableMissions.length;

      if (easyCount === 3) setComboBonus(prev => Math.max(prev, 250));
      if (mediumCount === 3) setComboBonus(prev => Math.max(prev, 500));
      if (allCompleted) setComboBonus(1250);
    } catch (err) {
      console.error('Error checking missions:', err);
    }
  };

  // Full check with auto-detect (when user returns from activity)
  const checkDailyMissionsWithAutoDetect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const completed = [];

      // Check daily_missions (already completed)
      const { data: missions, error: missionsError } = await supabase
        .from('daily_missions')
        .select('mission_id')
        .eq('user_id', session.user.id)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', tomorrowStart.toISOString());

      if (missionsError) throw missionsError;

      const existingCompleted = missions.map(m => m.mission_id);
      completed.push(...existingCompleted);

      // Check video ads watched
      const { data: adsData, error: adsError } = await supabase
        .from('video_ads_watched')
        .select('id')
        .eq('user_id', session.user.id)
        .gte('watched_at', todayStart.toISOString())
        .lt('watched_at', tomorrowStart.toISOString());

      if (adsError) throw adsError;

      if (adsData.length > 0 && !completed.includes('video_ad')) {
        completed.push('video_ad');
        if (!existingCompleted.includes('video_ad')) {
          await supabase.from('daily_missions').insert({
            user_id: session.user.id,
            mission_id: 'video_ad',
            mission_name: 'Watch an Ad',
            base_reward: 250,
            completed: true,
            completed_at: new Date().toISOString()
          });
        }
      }

      if (adsData.length >= 3 && !completed.includes('watch_videos')) {
        completed.push('watch_videos');
        if (!existingCompleted.includes('watch_videos')) {
          await supabase.from('daily_missions').insert({
            user_id: session.user.id,
            mission_id: 'watch_videos',
            mission_name: 'Watch 3 Videos',
            base_reward: 1000,
            completed: true,
            completed_at: new Date().toISOString()
          });
        }
      }

      // Check Instagram follows
      const { data: igData, error: igError } = await supabase
        .from('instagram_follows')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('verified', true);

      if (igError) throw igError;

      if (igData.length > 0 && !completed.includes('instagram')) {
        completed.push('instagram');
        if (!existingCompleted.includes('instagram')) {
          await supabase.from('daily_missions').insert({
            user_id: session.user.id,
            mission_id: 'instagram',
            mission_name: 'Follow a Brand',
            base_reward: 375,
            completed: true,
            completed_at: new Date().toISOString()
          });
        }
      }

      // Check streak check-ins for today
      const todayDate = todayStart.toISOString().split('T')[0];
      const { data: checkInData, error: checkInError } = await supabase
        .from('streak_check_ins')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('check_in_date', todayDate);

      if (!checkInError && checkInData?.length > 0 && !completed.includes('checkin')) {
        completed.push('checkin');
        if (!existingCompleted.includes('checkin')) {
          await supabase.from('daily_missions').insert({
            user_id: session.user.id,
            mission_id: 'checkin',
            mission_name: 'Morning Check-In',
            base_reward: 250,
            completed: true,
            completed_at: new Date().toISOString()
          });
        }
      }

      setCompletedToday(completed);

      // Calculate combo bonus
      const easyCount = availableMissions.filter(m => m.difficulty === 'easy' && completed.includes(m.id)).length;
      const mediumCount = availableMissions.filter(m => m.difficulty === 'medium' && completed.includes(m.id)).length;
      const allCompleted = completed.length === availableMissions.length;

      if (easyCount === 3) setComboBonus(prev => Math.max(prev, 250));
      if (mediumCount === 3) setComboBonus(prev => Math.max(prev, 500));
      if (allCompleted) setComboBonus(1250);
    } catch (err) {
      console.error('Error checking missions:', err);
    }
  };

  const completeMission = async (mission) => {
    if (completedToday.includes(mission.id)) {
      setNotification({
        type: 'warning',
        title: 'Already Completed',
        message: `You've already completed "${mission.name}" today! Come back tomorrow for fresh missions.`
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const result = await callEdgeFunction('award-mission-reward', {
        userId: session.user.id,
        missionId: mission.id,
        missionName: mission.name,
        baseReward: mission.reward
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to award mission');
      }

      const finalPoints = result.pointsAwarded;

      // Update UI
      setCompletedToday([...completedToday, mission.id]);
      setUserData(prev => ({
        ...prev,
        points: (prev?.points || 0) + finalPoints
      }));

      setNotification({
        type: 'success',
        title: 'Mission Completed! 🎉',
        message: `${mission.name}\n+${mission.reward} pts${result.multiplier > 1 ? ` x${result.multiplier} (premium)` : ''}\nTotal: +${finalPoints} pts`,
        reward: finalPoints
      });

      // Refresh combo bonus calculation
      await checkDailyMissionsSimple();

      // Hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error completing mission:', err);
      setNotification({
        type: 'error',
        title: 'Mission Failed ❌',
        message: `${err.message}\nPlease try again.`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const easyMissions = availableMissions.filter(m => m.difficulty === 'easy');
  const mediumMissions = availableMissions.filter(m => m.difficulty === 'medium');
  const hardMissions = availableMissions.filter(m => m.difficulty === 'hard');

  const totalPotentialRewards = availableMissions.reduce((sum, m) => sum + m.reward, 0) + 250;

  const handleStartMission = (mission) => {
    console.log('🎯 Starting mission:', mission.id, mission.name);
    console.log('📍 Navigating to:', mission.link);
    console.log('✅ Completed missions:', completedToday);
    navigate(mission.link);
  };

  const clearTestData = async () => {
    const confirmed = await confirm({
      title: 'Clear Test Data?',
      message: 'Delete all test missions for today? This resets the daily missions so you can test fresh.',
      type: 'warning',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      const { data: missions, error: fetchError } = await supabase
        .from('daily_missions')
        .select('id')
        .eq('user_id', session.user.id)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', tomorrowStart.toISOString());

      if (fetchError) throw fetchError;

      if (missions.length > 0) {
        const missionIds = missions.map(m => m.id);
        const { error: deleteError } = await supabase
          .from('daily_missions')
          .delete()
          .in('id', missionIds);

        if (deleteError) throw deleteError;
      }

      setCompletedToday([]);
      setComboBonus(0);
      await showAlert({
        title: 'Success',
        message: `Deleted ${missions.length} test missions. Refresh the page to see the clean slate.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting test data:', err);
      await showAlert({
        title: 'Error',
        message: err.message || 'Failed to delete test data',
        type: 'error'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4 items-center">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="md"
              >
                Dashboard
              </Button>
              <button
                onClick={clearTestData}
                className="p-2 hover:bg-gray-100 rounded transition"
                title="Clear test data"
              >
                <IconSettings2 className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2 text-lg font-bold text-primary">
                <IconStar className="w-5 h-5" />
                {userData?.points || 0} pts
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-6 rounded-lg shadow-lg text-white max-w-sm animate-pulse ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          <p className="text-xl font-bold mb-2">{notification.title}</p>
          <p className="whitespace-pre-wrap text-sm">{notification.message}</p>
          {notification.reward && (
            <div className="mt-3 text-center bg-white bg-opacity-20 rounded py-2">
              <p className="text-2xl font-bold">+{notification.reward} Points!</p>
            </div>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <IconMissions className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Daily Missions</h1>
          </div>
          <p className="text-blue-100 mb-4">Complete missions to earn points. Chain them for combo bonuses!</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-100">Completed Today</p>
              <p className="text-3xl font-bold">{completedToday.length}/8</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Potential Reward</p>
              <p className="text-3xl font-bold">+{totalPotentialRewards}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Combo Bonus</p>
              <p className="text-3xl font-bold text-yellow-300">{comboBonus > 0 ? '+' + comboBonus : 'None'}</p>
            </div>
          </div>
        </div>

        {/* Easy Missions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Easy (Quick Tasks)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {easyMissions.map(mission => {
              const IconComponent = missionIcons[mission.id];
              return (
              <div
                key={mission.id}
                className={`rounded-lg shadow p-6 transition ${
                  completedToday.includes(mission.id)
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-white hover:shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
                    {IconComponent && <IconComponent className="w-6 h-6" />}
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    Easy
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{mission.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{mission.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">+{mission.reward}</span>
                  <Button
                    onClick={() => handleStartMission(mission)}
                    disabled={completedToday.includes(mission.id)}
                    variant={completedToday.includes(mission.id) ? 'success' : 'primary'}
                    size="sm"
                  >
                    {completedToday.includes(mission.id) ? (
                      <span className="flex items-center gap-1">
                        <IconCheckmark className="w-4 h-4" />
                        Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        Start
                        <IconArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Medium Missions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Medium (Main Tasks)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mediumMissions.map(mission => {
              const IconComponent = missionIcons[mission.id];
              return (
              <div
                key={mission.id}
                className={`rounded-lg shadow p-6 transition ${
                  completedToday.includes(mission.id)
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-white hover:shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                    {IconComponent && <IconComponent className="w-6 h-6" />}
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-800">
                    Medium
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{mission.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{mission.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">+{mission.reward}</span>
                  <Button
                    onClick={() => handleStartMission(mission)}
                    disabled={completedToday.includes(mission.id)}
                    variant={completedToday.includes(mission.id) ? 'success' : 'primary'}
                    size="sm"
                  >
                    {completedToday.includes(mission.id) ? (
                      <span className="flex items-center gap-1">
                        <IconCheckmark className="w-4 h-4" />
                        Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        Start
                        <IconArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Hard Missions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Hard (Challenge Tasks)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hardMissions.map(mission => {
              const IconComponent = missionIcons[mission.id];
              return (
              <div
                key={mission.id}
                className={`rounded-lg shadow p-6 transition ${
                  completedToday.includes(mission.id)
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-white hover:shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                    {IconComponent && <IconComponent className="w-6 h-6" />}
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-800">
                    Hard
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{mission.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{mission.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">+{mission.reward}</span>
                  <Button
                    onClick={() => handleStartMission(mission)}
                    disabled={completedToday.includes(mission.id)}
                    variant={completedToday.includes(mission.id) ? 'success' : 'primary'}
                    size="sm"
                  >
                    {completedToday.includes(mission.id) ? (
                      <span className="flex items-center gap-1">
                        <IconCheckmark className="w-4 h-4" />
                        Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        Start
                        <IconArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Combo Bonuses */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-8">
          <div className="flex items-center gap-2 mb-4">
            <IconFire className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-800">Combo Bonuses</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Complete All Easy</p>
              <p className="text-3xl font-bold text-yellow-600">+50 pts</p>
              <p className="text-xs text-gray-500 mt-2">{3 - Math.min(3, easyMissions.filter(m => completedToday.includes(m.id)).length)} more</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Complete All Medium</p>
              <p className="text-3xl font-bold text-orange-600">+100 pts</p>
              <p className="text-xs text-gray-500 mt-2">{3 - Math.min(3, mediumMissions.filter(m => completedToday.includes(m.id)).length)} more</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Complete All Missions</p>
              <p className="text-3xl font-bold text-red-600">+250 pts</p>
              <p className="text-xs text-gray-500 mt-2">{8 - completedToday.length} more</p>
            </div>
          </div>
        </div>
      </div>
      <Modal {...modal} onClose={closeModal} />
    </div>
  );
}

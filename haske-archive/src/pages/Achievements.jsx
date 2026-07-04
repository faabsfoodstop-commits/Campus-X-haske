import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  IconSpinWheel,
  IconTrivia,
  IconMissions,
  IconFire,
  IconInstagram,
  IconReferrals,
  IconDiamond,
  IconRocket,
  IconMarketplace,
  IconStar,
  IconTrophy,
  IconCheckmark,
} from '../components/Icons';

export default function Achievements() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const achievementIcons = {
    first_spin: IconSpinWheel,
    spin_master: IconSpinWheel,
    trivia_pro: IconTrivia,
    mission_master: IconMissions,
    checkin_streak: IconFire,
    social_butterfly: IconInstagram,
    referral_king: IconReferrals,
    points_millionaire: IconDiamond,
    early_adopter: IconRocket,
    marketplace_seller: IconMarketplace,
    level5: IconStar,
    collector: IconTrophy,
  };

  const allAchievements = [
    {
      id: 'first_spin',
      name: 'Spinner',
      description: 'Spin the wheel 1 time',
      requirement: 'spins',
      threshold: 1,
      reward: 100,
      category: 'Games'
    },
    {
      id: 'spin_master',
      name: 'Spin Master',
      description: 'Spin the wheel 50 times',
      requirement: 'spins',
      threshold: 50,
      reward: 500,
      category: 'Games'
    },
    {
      id: 'trivia_pro',
      name: 'Trivia Pro',
      description: 'Score 100/100 on a trivia game',
      requirement: 'trivia_perfect',
      threshold: 1,
      reward: 250,
      category: 'Games'
    },
    {
      id: 'mission_master',
      name: 'Mission Master',
      description: 'Complete all daily missions 5 times',
      requirement: 'missions_completed',
      threshold: 5,
      reward: 300,
      category: 'Missions'
    },
    {
      id: 'checkin_streak',
      name: 'Streak Master',
      description: 'Check in 7 days in a row',
      requirement: 'checkin_streak',
      threshold: 7,
      reward: 250,
      category: 'Engagement'
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Follow 5 brands on Instagram',
      requirement: 'instagram_follows',
      threshold: 5,
      reward: 150,
      category: 'Social'
    },
    {
      id: 'referral_king',
      name: 'Referral King',
      description: 'Refer 5 friends who sign up',
      requirement: 'successful_referrals',
      threshold: 5,
      reward: 500,
      category: 'Growth'
    },
    {
      id: 'points_millionaire',
      name: 'Millionaire',
      description: 'Earn 1,000,000 total points',
      requirement: 'total_points',
      threshold: 1000000,
      reward: 1000,
      category: 'Milestones'
    },
    {
      id: 'early_adopter',
      name: 'Early Adopter',
      description: 'Be among the first 100 users',
      requirement: 'early_adopter',
      threshold: 1,
      reward: 200,
      category: 'Special'
    },
    {
      id: 'marketplace_seller',
      name: 'Marketplace Seller',
      description: 'List your first item',
      requirement: 'marketplace_seller',
      threshold: 1,
      reward: 150,
      category: 'Marketplace'
    },
    {
      id: 'level5',
      name: 'Legend',
      description: 'Reach Level 5',
      requirement: 'user_level',
      threshold: 5,
      reward: 750,
      category: 'Progression'
    },
    {
      id: 'collector',
      name: 'Collector',
      description: 'Unlock 10 achievements',
      requirement: 'achievements_unlocked',
      threshold: 10,
      reward: 300,
      category: 'Meta'
    }
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (user) {
        setUserData(user);
        setUser(session.user);
        await checkAchievements(user);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const checkAchievements = async (userData_temp) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userData = userData_temp;
      const unlocked = [];

      for (let achievement of allAchievements) {
        let isUnlocked = false;

        switch (achievement.requirement) {
          case 'spins':
            const { data: spins } = await supabase
              .from('spin_history')
              .select('id')
              .eq('user_id', session.user.id);
            isUnlocked = (spins?.length || 0) >= achievement.threshold;
            break;

          case 'trivia_perfect':
            const { data: triviaResults } = await supabase
              .from('trivia_results')
              .select('score')
              .eq('user_id', session.user.id);
            isUnlocked = (triviaResults || []).some(r => r.score === 1000);
            break;

          case 'missions_completed':
            const { data: missions } = await supabase
              .from('daily_missions')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('completed', true);
            isUnlocked = (missions?.length || 0) >= achievement.threshold;
            break;

          case 'total_points':
            isUnlocked = (userData?.points || 0) >= achievement.threshold;
            break;

          case 'user_level':
            const level = Math.floor((userData?.points || 0) / 500) + 1;
            isUnlocked = level >= achievement.threshold;
            break;

          case 'early_adopter':
            isUnlocked = true;
            break;

          case 'checkin_streak':
            isUnlocked = (userData?.current_streak || 0) >= achievement.threshold;
            break;

          case 'instagram_follows': {
            const { count: igCount } = await supabase
              .from('instagram_follows')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', session.user.id)
              .eq('verified', true);
            isUnlocked = (igCount || 0) >= achievement.threshold;
            break;
          }

          case 'successful_referrals': {
            const { count: refCount } = await supabase
              .from('referrals')
              .select('id', { count: 'exact', head: true })
              .eq('referrer_id', session.user.id)
              .eq('status', 'completed');
            isUnlocked = (refCount || 0) >= achievement.threshold;
            break;
          }

          case 'marketplace_seller': {
            const { count: adsCount } = await supabase
              .from('user_ads')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', session.user.id);
            isUnlocked = (adsCount || 0) >= achievement.threshold;
            break;
          }

          case 'achievements_unlocked':
            isUnlocked = unlocked.length >= achievement.threshold;
            break;

          default:
            isUnlocked = false;
        }

        if (isUnlocked) {
          unlocked.push(achievement);
        }
      }

      setUnlockedAchievements(unlocked);
    } catch (err) {
      console.error('Error checking achievements:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const categories = [...new Set(allAchievements.map(a => a.category))];
  const userLevel = Math.floor((userData?.points || 0) / 500) + 1;

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
                className="text-gray-600 hover:text-primary transition"
              >
                Dashboard
              </button>
              <div className="flex items-center gap-2 text-lg font-bold text-primary">
                <IconStar className="w-5 h-5" />
                {userData?.points || 0} pts
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <IconTrophy className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Achievements</h1>
          </div>
          <p className="text-pink-100 mb-6">Unlock badges and special rewards as you progress!</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-pink-100">Level</p>
              <p className="text-4xl font-bold">{userLevel}</p>
            </div>
            <div>
              <p className="text-sm text-pink-100">Unlocked</p>
              <p className="text-4xl font-bold">{unlockedAchievements.length}/{allAchievements.length}</p>
            </div>
            <div>
              <p className="text-sm text-pink-100">Total Points</p>
              <p className="text-4xl font-bold">{userData?.points || 0}</p>
            </div>
            <div>
              <p className="text-sm text-pink-100">Completion</p>
              <p className="text-4xl font-bold">{Math.round((unlockedAchievements.length / allAchievements.length) * 100)}%</p>
            </div>
          </div>
        </div>

        {/* Level Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Level Progress</h2>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Level {userLevel}</span>
              <span className="text-gray-600">{(userData?.points || 0) % 500} / 500 points</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-pink-500 to-pink-600 h-3 rounded-full transition-all"
                style={{ width: `${((userData?.points || 0) % 500) / 500 * 100}%` }}
              ></div>
            </div>
          </div>
          <p className="text-gray-600">
            {500 - ((userData?.points || 0) % 500)} points until next level
          </p>
        </div>

        {/* Achievements by Category */}
        {categories.map(category => (
          <section key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allAchievements
                .filter(a => a.category === category)
                .map(achievement => {
                  const isUnlocked = unlockedAchievements.some(a => a.id === achievement.id);
                  const IconComponent = achievementIcons[achievement.id];
                  return (
                    <div
                      key={achievement.id}
                      className={`rounded-lg shadow p-6 transition-all ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-400 shadow-md'
                          : 'bg-white border border-gray-200'
                      } hover:shadow-lg`}
                    >
                      <div className="flex flex-col items-center text-center h-full">
                        <div
                          className={`w-16 h-16 flex items-center justify-center rounded-2xl mb-4 transition-all ${
                            isUnlocked
                              ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {IconComponent && <IconComponent className="w-8 h-8" />}
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${isUnlocked ? 'text-gray-900' : 'text-gray-600'}`}>
                          {achievement.name}
                        </h3>
                        <p className={`text-sm mb-4 flex-grow ${isUnlocked ? 'text-gray-700' : 'text-gray-500'}`}>
                          {achievement.description}
                        </p>
                        <div className={`text-lg font-bold mb-3 ${isUnlocked ? 'text-amber-600' : 'text-gray-400'}`}>
                          +{achievement.reward} pts
                        </div>
                        <div>
                          {isUnlocked ? (
                            <span className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                              <IconCheckmark className="w-4 h-4" />
                              Unlocked
                            </span>
                          ) : (
                            <span className="inline-block bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-bold">
                              Locked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}

        {/* Back Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition text-lg shadow hover:shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

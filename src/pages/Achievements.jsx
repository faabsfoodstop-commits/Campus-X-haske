import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

const ACHIEVEMENT_LIST = [
  {
    id: 'first_check_in',
    title: 'First Steps',
    description: 'Complete your first daily check-in',
    icon: '👣',
    points: 25,
    category: 'engagement',
    check: async (profile, user) => {
      const { data } = await supabase
        .from('streak_check_ins')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      return data && data.length > 0;
    },
  },
  {
    id: '7_day_streak',
    title: '7-Day Warrior',
    description: 'Maintain a 7-day check-in streak',
    icon: '🔥',
    points: 100,
    category: 'engagement',
    check: async (profile) => profile?.current_streak >= 7,
  },
  {
    id: '30_day_streak',
    title: 'Legendary Grinder',
    description: 'Reach a 30-day check-in streak',
    icon: '⚡',
    points: 500,
    category: 'engagement',
    check: async (profile) => profile?.current_streak >= 30,
  },
  {
    id: 'first_mission',
    title: 'Mission Possible',
    description: 'Complete your first daily mission',
    icon: '✅',
    points: 50,
    category: 'missions',
    check: async (user) => {
      const { data } = await supabase
        .from('daily_missions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      return data && data.length > 0;
    },
  },
  {
    id: '10_missions',
    title: 'Mission Master',
    description: 'Complete 10 missions',
    icon: '🎯',
    points: 200,
    category: 'missions',
    check: async (user) => {
      const { data } = await supabase
        .from('daily_missions')
        .select('id')
        .eq('user_id', user.id);
      return (data?.length || 0) >= 10;
    },
  },
  {
    id: 'first_redemption',
    title: 'First Prize',
    description: 'Redeem your first reward',
    icon: '🎁',
    points: 75,
    category: 'rewards',
    check: async (user) => {
      const { data } = await supabase
        .from('redemptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      return data && data.length > 0;
    },
  },
  {
    id: '5_referrals',
    title: 'Viral Influencer',
    description: 'Successfully refer 5 friends',
    icon: '👥',
    points: 250,
    category: 'social',
    check: async (user) => {
      const { data } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id)
        .eq('status', 'completed');
      return (data?.length || 0) >= 5;
    },
  },
  {
    id: '10k_points',
    title: 'Point Hoarder',
    description: 'Accumulate 10,000 points',
    icon: '💰',
    points: 300,
    category: 'points',
    check: async (profile) => profile?.points >= 10000,
  },
];

export default function Achievements() {
  const { user, profile } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user && profile) {
      loadAchievements();
    }
  }, [user, profile]);

  const loadAchievements = async () => {
    try {
      // Load unlocked achievements (from getting_started_tasks for now)
      // In production, create an achievements table
      const unlocked = new Set();

      // Check each achievement
      for (const achievement of ACHIEVEMENT_LIST) {
        try {
          const isUnlocked = await achievement.check(profile, user);
          if (isUnlocked) {
            unlocked.add(achievement.id);
          }
        } catch (error) {
          console.error(`Failed to check achievement ${achievement.id}:`, error);
        }
      }

      setUnlockedAchievements(unlocked);
      setAchievements(ACHIEVEMENT_LIST);

      const totalEarned = ACHIEVEMENT_LIST.reduce((sum, ach) => {
        return sum + (unlocked.has(ach.id) ? ach.points : 0);
      }, 0);
      setTotalPoints(totalEarned);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading achievements...</div>
      </div>
    );
  }

  const categories = ['all', 'engagement', 'missions', 'rewards', 'social', 'points'];
  const categoryNames = {
    all: 'All',
    engagement: 'Engagement',
    missions: 'Missions',
    rewards: 'Rewards',
    social: 'Social',
    points: 'Points',
  };

  const filteredAchievements = filter === 'all'
    ? achievements
    : achievements.filter(a => a.category === filter);

  const progress = Math.round((unlockedAchievements.size / achievements.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Achievements</h1>
        <p className="text-gray-600 mb-6">Unlock badges and earn bonus points</p>

        {/* Progress Card */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Progress</p>
              <p className="text-3xl font-bold">{unlockedAchievements.size} / {achievements.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90 mb-1">Bonus Points</p>
              <p className="text-3xl font-bold">+{totalPoints}</p>
            </div>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs opacity-75 mt-2">{progress}% Complete</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg p-4 mb-6 overflow-x-auto">
          <div className="flex space-x-2 whitespace-nowrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {categoryNames[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map(achievement => {
            const isUnlocked = unlockedAchievements.has(achievement.id);

            return (
              <div
                key={achievement.id}
                className={`rounded-lg p-5 border-2 transition ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 shadow-md'
                    : 'bg-gray-100 border-gray-300 opacity-60'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`text-4xl p-3 rounded-lg ${
                    isUnlocked ? 'bg-amber-200' : 'bg-gray-300'
                  }`}>
                    {achievement.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {achievement.category}
                      </span>
                      <span className={`font-bold ${isUnlocked ? 'text-amber-600' : 'text-gray-500'}`}>
                        +{achievement.points}
                      </span>
                    </div>

                    {isUnlocked && (
                      <div className="mt-2 text-xs text-green-700 font-semibold">
                        ✅ Unlocked
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-2">No achievements in this category yet</p>
            <p className="text-sm text-gray-500">Check back as you unlock more!</p>
          </div>
        )}

        {/* Motivation */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <p className="text-blue-900 text-sm">
            <span className="font-bold">💡 Keep Going!</span> More achievements unlock as you use the app. Keep checking in, completing missions, and inviting friends!
          </p>
        </div>
      </div>
    </div>
  );
}

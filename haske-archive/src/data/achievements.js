export const ACHIEVEMENTS = {
  // Earning Achievements
  FIRST_POINTS: {
    id: 'first_points',
    name: 'Getting Started',
    description: 'Earn your first 100 points',
    icon: '🌟',
    condition: (user) => (user.points || 0) >= 100,
    category: 'earning'
  },
  POINT_MASTER: {
    id: 'point_master',
    name: 'Point Master',
    description: 'Accumulate 5,000 points',
    icon: '👑',
    condition: (user) => (user.points || 0) >= 5000,
    category: 'earning'
  },
  MILLIONAIRE: {
    id: 'millionaire',
    name: 'Millionaire',
    description: 'Reach 1,000,000 lifetime points earned',
    icon: '💰',
    condition: (user) => (user.lifetimePoints || 0) >= 1000000,
    category: 'earning'
  },

  // Trading Achievements
  MARKET_MAKER: {
    id: 'market_maker',
    name: 'Market Maker',
    description: 'Complete your first sell order',
    icon: '📈',
    condition: (user) => (user.trades || {}).firstSell,
    category: 'trading'
  },
  TRADER: {
    id: 'trader',
    name: 'Active Trader',
    description: 'Complete 10 buy/sell transactions',
    icon: '📊',
    condition: (user) => (user.tradeCount || 0) >= 10,
    category: 'trading'
  },
  PROFIT_HUNTER: {
    id: 'profit_hunter',
    name: 'Profit Hunter',
    description: 'Sell points and earn ₦1,000+',
    icon: '💵',
    condition: (user) => (user.profitFromSales || 0) >= 1000,
    category: 'trading'
  },

  // Redemption Achievements
  CONVERTER: {
    id: 'converter',
    name: 'Converter',
    description: 'Redeem points for 5 different rewards',
    icon: '🔄',
    condition: (user) => (user.rewardsRedeemed || 0) >= 5,
    category: 'redemption'
  },
  COLLECTOR: {
    id: 'collector',
    name: 'Collector',
    description: 'Collect all 4 reward tiers',
    icon: '🏆',
    condition: (user) => (user.tiersUnlocked || 0) >= 4,
    category: 'redemption'
  },

  // Social Achievements
  INFLUENCER: {
    id: 'influencer',
    name: 'Influencer',
    description: 'Refer 5 friends who join',
    icon: '👥',
    condition: (user) => (user.referralsCompleted || 0) >= 5,
    category: 'social'
  },
  NETWORKER: {
    id: 'networker',
    name: 'Networker',
    description: 'Form a group pool with 3+ friends',
    icon: '🤝',
    condition: (user) => (user.groupPools || 0) >= 1,
    category: 'social'
  },

  // Streak Achievements
  CONSISTENT: {
    id: 'consistent',
    name: 'Consistent',
    description: 'Earn points 7 days in a row',
    icon: '🔥',
    condition: (user) => (user.currentStreak || 0) >= 7,
    category: 'streaks'
  },
  LEGEND: {
    id: 'legend',
    name: 'Legend',
    description: 'Maintain 30-day earning streak',
    icon: '⭐',
    condition: (user) => (user.currentStreak || 0) >= 30,
    category: 'streaks'
  }
};

export function getUnlockedAchievements(user) {
  return Object.values(ACHIEVEMENTS).filter(achievement =>
    achievement.condition(user)
  );
}

export function getProgress(user, achievement) {
  // Return progress as percentage for specific achievements
  const progressMap = {
    'first_points': (user.points || 0) / 100 * 100,
    'point_master': (user.points || 0) / 5000 * 100,
    'millionaire': (user.lifetimePoints || 0) / 1000000 * 100,
    'trader': (user.tradeCount || 0) / 10 * 100,
    'influencer': (user.referralsCompleted || 0) / 5 * 100,
    'consistent': (user.currentStreak || 0) / 7 * 100,
    'legend': (user.currentStreak || 0) / 30 * 100,
  };

  return Math.min(100, progressMap[achievement.id] || 100);
}

import React, { useState } from 'react';

export default function GamesHub({ onSelectGame }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const games = [
    {
      id: 'typing-master',
      name: 'Typing Master',
      emoji: '⌨️',
      description: 'Race your opponents. Type faster. Earn tokens.',
      color: 'from-purple-600 to-pink-600',
      category: 'speed'
    },
    {
      id: 'quickfire-trivia',
      name: 'QuickFire Trivia',
      emoji: '🧠',
      description: 'Answer fast. Earn tokens. Climb the leaderboard.',
      color: 'from-blue-600 to-cyan-600',
      category: 'knowledge'
    },
    {
      id: 'coming-soon-1',
      name: 'Code Challenges',
      emoji: '💻',
      description: 'Solve coding problems. Earn rewards.',
      color: 'from-green-600 to-emerald-600',
      category: 'coding',
      comingSoon: true
    },
    {
      id: 'coming-soon-2',
      name: 'Music Quiz Master',
      emoji: '🎵',
      description: 'Guess songs and artists. Test your music knowledge.',
      color: 'from-pink-600 to-red-600',
      category: 'music',
      comingSoon: true
    }
  ];

  const filteredGames = selectedCategory === 'all'
    ? games
    : games.filter(g => g.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">🎮 HASKii Games</h1>
          <p className="text-2xl text-gray-300 mb-8">Earn tokens. Win prizes. Climb leaderboards.</p>
          <div className="inline-flex gap-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                selectedCategory === 'all'
                  ? 'bg-white text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Games
            </button>
            <button
              onClick={() => setSelectedCategory('speed')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                selectedCategory === 'speed'
                  ? 'bg-white text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Speed
            </button>
            <button
              onClick={() => setSelectedCategory('knowledge')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                selectedCategory === 'knowledge'
                  ? 'bg-white text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Knowledge
            </button>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {filteredGames.map(game => (
            <div
              key={game.id}
              className={`bg-gradient-to-br ${game.color} rounded-lg p-8 overflow-hidden relative group cursor-pointer hover:shadow-2xl transition transform hover:scale-105 ${
                game.comingSoon ? 'opacity-60' : ''
              }`}
              onClick={() => !game.comingSoon && onSelectGame(game.id)}
            >
              {/* Background effect */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition"></div>

              {/* Coming Soon Badge */}
              {game.comingSoon && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                  Coming Soon
                </div>
              )}

              {/* Content */}
              <div className="relative z-10">
                <div className="text-6xl mb-4">{game.emoji}</div>
                <h2 className="text-3xl font-bold text-white mb-2">{game.name}</h2>
                <p className="text-gray-100 mb-8 text-lg">{game.description}</p>

                {!game.comingSoon ? (
                  <button className="bg-white text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition group-hover:scale-110">
                    Play Now →
                  </button>
                ) : (
                  <button disabled className="bg-gray-400 text-gray-700 px-8 py-3 rounded-lg font-bold cursor-not-allowed">
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-3 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Active Players</p>
            <p className="text-4xl font-bold text-white">12,453</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Matches Today</p>
            <p className="text-4xl font-bold text-green-400">8,932</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Tokens Awarded</p>
            <p className="text-4xl font-bold text-yellow-400">1.2M</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-16 text-center">
          <div className="inline-flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition">Leaderboards</a>
            <a href="#" className="text-gray-400 hover:text-white transition">How to Play</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Cosmetics Shop</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Daily Challenges</a>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { gamesClient } from '../api/gamesClient';

export default function Leaderboard({ gameType = 'typing', boardType = 'global' }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(boardType);

  useEffect(() => {
    loadLeaderboard();
  }, [gameType, selectedBoard]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (gameType === 'typing') {
        result = await gamesClient.getTypingLeaderboard(selectedBoard);
      } else if (gameType === 'trivia') {
        result = await gamesClient.getTriviaLeaderboard(selectedBoard);
      }

      if (result.status === 'success') {
        setLeaderboard(result.data.slice(0, 50));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = () => {
    if (gameType === 'typing') {
      return 'WPM';
    }
    return 'Points';
  };

  const getMetricValue = (player) => {
    if (gameType === 'typing') {
      return player.best_wpm || 0;
    }
    return player.total_points || 0;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-8 border border-gray-700">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">🏆 Leaderboard</h2>

        {/* Board Type Selector */}
        <div className="flex gap-2">
          {gameType === 'typing' && (
            <>
              <button
                onClick={() => setSelectedBoard('global')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedBoard === 'global'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Global
              </button>
              <button
                onClick={() => setSelectedBoard('campus')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedBoard === 'campus'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                My Campus
              </button>
            </>
          )}
          {gameType === 'trivia' && (
            <>
              <button
                onClick={() => setSelectedBoard('daily')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedBoard === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setSelectedBoard('weekly')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedBoard === 'weekly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Weekly
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/20 border border-red-500 rounded p-4 text-red-200 text-center">
          {error}
        </div>
      )}

      {/* Leaderboard List */}
      {!loading && !error && leaderboard.length > 0 && (
        <div className="space-y-2">
          {leaderboard.map((player, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-4 rounded transition ${
                index < 3
                  ? 'bg-gradient-to-r from-yellow-600/20 to-transparent border border-yellow-500/30'
                  : 'bg-gray-800 border border-gray-700'
              } hover:bg-gray-700`}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Rank */}
                <div className="text-center w-12">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index >= 3 && (
                    <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1">
                  <p className="text-white font-semibold">
                    Player {player.user_id.slice(0, 8)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {gameType === 'typing' ? 'Matches played' : 'Rounds played'}: {player.matches_played || 0}
                  </p>
                </div>
              </div>

              {/* Score/Metric */}
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-400">
                  {getMetricValue(player)}
                </p>
                <p className="text-gray-400 text-sm">{getMetricLabel()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && leaderboard.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No players on this leaderboard yet.</p>
        </div>
      )}
    </div>
  );
}

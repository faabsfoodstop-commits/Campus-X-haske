import React, { useState, useEffect, useRef } from 'react';
import { useTypingGame } from '../../hooks/useTypingGame';
import { gamesClient } from '../../api/gamesClient';
import { useAuth } from '../../hooks/useAuth';

export default function TypingMaster() {
  const { user } = useAuth();
  const { gameState, match, wpm, accuracy, loading, error, createMatch, startRace, updateTyping, submitMatch, completeMatch } = useTypingGame();
  const [typedText, setTypedText] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const inputRef = useRef(null);

  // Set user ID in gamesClient and load data
  useEffect(() => {
    if (user?.id) {
      gamesClient.setUserId(user.id);
      loadLeaderboard();
      loadUserStats();
    }
  }, [user?.id]);

  const loadLeaderboard = async () => {
    const result = await gamesClient.getTypingLeaderboard('global');
    if (result.status === 'success') {
      setLeaderboard(result.data.slice(0, 10));
    }
  };

  const loadUserStats = async () => {
    const result = await gamesClient.getTypingStats();
    if (result.status === 'success') {
      setUserStats(result.data);
    }
  };

  const handleTextInput = (e) => {
    const text = e.target.value;
    setTypedText(text);
    updateTyping(text);
  };

  const handleFinishMatch = async () => {
    await submitMatch();
  };

  const handleCompleteMatch = async () => {
    const result = await completeMatch();
    if (result) {
      setMatchResult(result);
    }
  };

  const handleReset = () => {
    setTypedText('');
    setMatchResult(null);
  };

  // HOME SCREEN
  if (gameState === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">⌨️ Typing Master</h1>
            <p className="text-xl text-gray-300">Race your opponents. Type faster. Earn tokens.</p>
          </div>

          {/* User Stats */}
          {userStats && (
            <div className="grid grid-cols-3 gap-4 mb-12 bg-purple-800/30 p-6 rounded-lg border border-purple-500">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Matches</p>
                <p className="text-3xl font-bold text-white">{userStats.total_matches}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Best WPM</p>
                <p className="text-3xl font-bold text-green-400">{userStats.best_wpm}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="text-3xl font-bold text-blue-400">{(userStats.win_rate_percent || 0).toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Quick Match Button */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-center mb-12">
            <button
              onClick={() => createMatch('medium')}
              disabled={loading}
              className="bg-white text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 disabled:opacity-50 transition"
            >
              {loading ? 'Finding Match...' : 'Start Quick Match'}
            </button>
          </div>

          {/* Leaderboard */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">🏆 Global Leaderboard</h2>
            <div className="space-y-2">
              {leaderboard.map((player, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-800 p-3 rounded">
                  <span className="text-gray-400">#{index + 1}</span>
                  <span className="text-white font-semibold flex-1 ml-4">Player {player.user_id.slice(0, 8)}</span>
                  <span className="text-green-400 font-bold">{player.best_wpm} WPM</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-500/20 border border-red-500 rounded p-4 text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // LOBBY SCREEN
  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-900 rounded-lg p-8 border border-purple-500 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Match Ready</h2>
            <p className="text-gray-300 mb-8">Get ready to type! Press Start when you're ready to race.</p>

            <button
              onClick={startRace}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-lg font-bold text-xl hover:from-green-600 hover:to-green-700 transition"
            >
              🚀 Start Racing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RACING SCREEN
  if (gameState === 'racing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black p-8">
        <div className="max-w-4xl mx-auto">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-8 bg-purple-800/30 p-4 rounded-lg border border-purple-500">
            <div className="text-center">
              <p className="text-gray-400 text-sm">WPM</p>
              <p className="text-3xl font-bold text-green-400">{wpm}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Accuracy</p>
              <p className="text-3xl font-bold text-blue-400">{accuracy.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-3xl font-bold text-purple-400">Racing...</p>
            </div>
          </div>

          {/* Typing Area */}
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-700 mb-8">
            <p className="text-gray-400 text-sm mb-4">Type the text below:</p>
            <div className="bg-gray-800 p-6 rounded mb-6 min-h-24 border border-gray-600">
              <p className="text-lg text-gray-300 leading-relaxed">
                A single hand cannot tie a bundle. When brothers fight to the death, a stranger inherits their estate.
              </p>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={typedText}
              onChange={handleTextInput}
              placeholder="Start typing here..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-600 focus:border-purple-500 focus:outline-none mb-6"
              autoFocus
            />

            <button
              onClick={handleFinishMatch}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition"
            >
              Submit & Finish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (gameState === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-900 rounded-lg p-8 border border-purple-500">
            <h2 className="text-3xl font-bold text-white text-center mb-8">🎯 Match Complete!</h2>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded text-center">
                <p className="text-gray-400 text-sm mb-2">Final WPM</p>
                <p className="text-4xl font-bold text-green-400">{wpm}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded text-center">
                <p className="text-gray-400 text-sm mb-2">Accuracy</p>
                <p className="text-4xl font-bold text-blue-400">{accuracy.toFixed(1)}%</p>
              </div>
            </div>

            {matchResult && (
              <div className="bg-purple-800/30 border border-purple-500 rounded p-6 mb-8 text-center">
                <p className="text-gray-300 mb-2">Tokens Earned</p>
                <p className="text-4xl font-bold text-yellow-400">+{matchResult.tokens_awarded}</p>
              </div>
            )}

            <button
              onClick={() => {
                handleCompleteMatch();
                handleReset();
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }
}

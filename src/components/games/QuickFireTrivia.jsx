import React, { useState, useEffect, useRef } from 'react';
import { useTriviaGame } from '../../hooks/useTriviaGame';
import { gamesClient } from '../../api/gamesClient';
import { useAuth } from '../../hooks/useAuth';

export default function QuickFireTrivia() {
  const { user } = useAuth();
  const { gameState, currentQuestion, score, streak, timePerQuestion, setTimePerQuestion, loading, error, startRound, submitAnswer, completeRound } = useTriviaGame();
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [dailyWinners, setDailyWinners] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('home'); // home, question, review, winners, leaderboard
  const [lastAnswer, setLastAnswer] = useState(null);
  const timerRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      gamesClient.setUserId(user.id);
      loadLeaderboard();
      loadUserStats();
      loadDailyWinners();
    }
  }, [user?.id]);

  // Timer countdown
  useEffect(() => {
    if (gameState === 'round' && timePerQuestion > 0) {
      timerRef.current = setTimeout(() => {
        setTimePerQuestion(timePerQuestion - 1);
      }, 1000);
    } else if (gameState === 'round' && timePerQuestion === 0) {
      // Auto-submit when time runs out
      handleSubmitAnswer(null);
    }
    return () => clearTimeout(timerRef.current);
  }, [gameState, timePerQuestion]);

  const loadLeaderboard = async () => {
    const result = await gamesClient.getTriviaLeaderboard('daily');
    if (result.status === 'success') {
      setLeaderboard(result.data.slice(0, 10));
    }
  };

  const loadUserStats = async () => {
    const result = await gamesClient.getTriviaStats();
    if (result.status === 'success') {
      setUserStats(result.data);
    }
  };

  const loadDailyWinners = async () => {
    const result = await gamesClient.getTriviaWinners();
    if (result.status === 'success') {
      setDailyWinners(result.data.slice(0, 10));
    }
  };

  const handleStartRound = async (roundType = 'free') => {
    setCurrentScreen('question');
    await startRound(roundType);
  };

  const handleSubmitAnswer = async (selectedId) => {
    setSelectedOptionId(selectedId);
    const result = await submitAnswer(selectedId);
    if (result) {
      setLastAnswer(result);
      setCurrentScreen('review');
    }
  };

  const handleNextQuestion = () => {
    setSelectedOptionId(null);
    setCurrentScreen('question');
  };

  const handleCompleteRound = async () => {
    const result = await completeRound();
    if (result) {
      setCurrentScreen('results');
    }
  };

  const handleReset = () => {
    setSelectedOptionId(null);
    setLastAnswer(null);
    setCurrentScreen('home');
  };

  // HOME SCREEN
  if (currentScreen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">🧠 QuickFire Trivia</h1>
            <p className="text-xl text-gray-300">Answer fast. Earn tokens. Climb the leaderboard.</p>
          </div>

          {/* User Stats */}
          {userStats && (
            <div className="grid grid-cols-3 gap-4 mb-12 bg-blue-800/30 p-6 rounded-lg border border-blue-500">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Rounds</p>
                <p className="text-3xl font-bold text-white">{userStats.total_rounds}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Best Score</p>
                <p className="text-3xl font-bold text-green-400">{userStats.best_score}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Accuracy</p>
                <p className="text-3xl font-bold text-blue-400">{(userStats.accuracy_percent || 0).toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Daily Winners */}
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">👑 Today's Winners</h2>
            <div className="space-y-2">
              {dailyWinners.slice(0, 3).map((winner, index) => (
                <div key={index} className="flex justify-between items-center bg-black/40 p-3 rounded">
                  <span className="text-yellow-300 font-bold">#{index + 1}</span>
                  <span className="text-white font-semibold flex-1 ml-4">Player {winner.user_id.slice(0, 8)}</span>
                  <span className="text-yellow-300 font-bold">{winner.total_points} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Round Type Selector */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <button
              onClick={() => handleStartRound('free')}
              disabled={loading}
              className="bg-gradient-to-b from-green-500 to-green-600 rounded-lg p-8 text-center hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition"
            >
              <p className="text-white font-bold mb-2">🎯 Free Play</p>
              <p className="text-gray-200 text-sm mb-4">10 questions, earn tokens</p>
              <p className="text-2xl font-bold text-white">{loading ? 'Loading...' : 'Start'}</p>
            </button>
            <button
              onClick={() => handleStartRound('premium')}
              disabled={loading}
              className="bg-gradient-to-b from-purple-600 to-purple-700 rounded-lg p-8 text-center hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition"
            >
              <p className="text-white font-bold mb-2">⭐ Premium</p>
              <p className="text-gray-200 text-sm mb-4">Multiplier bonuses</p>
              <p className="text-2xl font-bold text-white">{loading ? 'Loading...' : 'Start'}</p>
            </button>
          </div>

          {/* Leaderboard */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">🏆 Daily Leaderboard</h2>
            <div className="space-y-2">
              {leaderboard.map((player, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-800 p-3 rounded">
                  <span className="text-gray-400">#{index + 1}</span>
                  <span className="text-white font-semibold flex-1 ml-4">Player {player.user_id.slice(0, 8)}</span>
                  <span className="text-green-400 font-bold">{player.total_points} pts</span>
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

  // QUESTION SCREEN
  if (currentScreen === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header with Timer and Score */}
          <div className="grid grid-cols-3 gap-4 mb-8 bg-blue-800/30 p-4 rounded-lg border border-blue-500">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Score</p>
              <p className="text-3xl font-bold text-green-400">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Time Left</p>
              <p className={`text-3xl font-bold ${timePerQuestion <= 3 ? 'text-red-400' : 'text-blue-400'}`}>
                {timePerQuestion}s
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Streak</p>
              <p className="text-3xl font-bold text-yellow-400">{streak}x</p>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-700 mb-8">
            <div className="mb-8">
              <p className="text-gray-400 text-sm mb-2">Question</p>
              <p className="text-2xl font-bold text-white leading-relaxed">
                {currentQuestion.question_text}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options && currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSubmitAnswer(option.id)}
                  disabled={selectedOptionId !== null}
                  className={`w-full p-4 rounded-lg border-2 font-semibold text-lg transition ${
                    selectedOptionId === option.id
                      ? 'border-green-500 bg-green-500/20 text-white'
                      : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-blue-400'
                  } disabled:opacity-50`}
                >
                  {option.option_text}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-submit warning */}
          {timePerQuestion <= 3 && (
            <div className="text-center text-red-400 text-sm">
              Submitting in {timePerQuestion} seconds...
            </div>
          )}
        </div>
      </div>
    );
  }

  // REVIEW SCREEN
  if (currentScreen === 'review' && currentQuestion && lastAnswer) {
    const correctOption = currentQuestion.options.find(o => o.is_correct);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className={`bg-gray-900 rounded-lg p-8 border ${lastAnswer.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
            <h2 className={`text-3xl font-bold text-center mb-6 ${lastAnswer.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {lastAnswer.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </h2>

            <div className="space-y-6">
              {/* Question Review */}
              <div className="bg-gray-800 p-6 rounded">
                <p className="text-gray-400 text-sm mb-2">Question</p>
                <p className="text-white font-semibold">{currentQuestion.question_text}</p>
              </div>

              {/* Your Answer */}
              <div className="bg-gray-800 p-6 rounded">
                <p className="text-gray-400 text-sm mb-2">Your Answer</p>
                <p className={`text-lg font-semibold ${lastAnswer.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {currentQuestion.options.find(o => o.id === selectedOptionId)?.option_text}
                </p>
              </div>

              {/* Correct Answer (if wrong) */}
              {!lastAnswer.isCorrect && (
                <div className="bg-gray-800 p-6 rounded">
                  <p className="text-gray-400 text-sm mb-2">Correct Answer</p>
                  <p className="text-lg font-semibold text-green-400">
                    {correctOption?.option_text}
                  </p>
                </div>
              )}

              {/* Points Earned */}
              <div className="bg-blue-800/30 border border-blue-500 rounded p-6 text-center">
                <p className="text-gray-300 mb-2">Points Earned</p>
                <p className="text-4xl font-bold text-yellow-400">+{lastAnswer.points}</p>
                <p className="text-gray-400 text-sm mt-2">Streak: {streak}x</p>
              </div>
            </div>

            {/* Navigation */}
            <button
              onClick={handleNextQuestion}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition"
            >
              Next Question →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  if (currentScreen === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-900 rounded-lg p-8 border border-blue-500">
            <h2 className="text-3xl font-bold text-white text-center mb-8">🎯 Round Complete!</h2>

            <div className="space-y-6 mb-8">
              <div className="bg-gray-800 p-6 rounded text-center">
                <p className="text-gray-400 text-sm mb-2">Final Score</p>
                <p className="text-4xl font-bold text-green-400">{score} pts</p>
              </div>
              <div className="bg-gray-800 p-6 rounded text-center">
                <p className="text-gray-400 text-sm mb-2">Best Streak</p>
                <p className="text-4xl font-bold text-blue-400">{streak}x</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

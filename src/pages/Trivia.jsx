import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { recordTriviaActivity, updateUserPoints } from '../utils/databaseHelpers';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  IconTrivia,
  IconStar,
} from '../components/Icons';

export default function Trivia() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, finished
  const [loading, setLoading] = useState(true);
  const [triviaStats, setTriviaStats] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const navigate = useNavigate();

  const triviaQuestions = [
    {
      question: "In what year was the first university in Nigeria founded?",
      options: ["1948", "1934", "1952", "1960"],
      correct: 1,
      category: "Education"
    },
    {
      question: "Which Nigerian university is the oldest?",
      options: ["OAU", "OOU", "UI", "ABU"],
      correct: 2,
      category: "Education"
    },
    {
      question: "What does HASKE stand for?",
      options: ["Higher African Student Knowledge Exchange", "Haske Academic Student Knowledge Exchange", "Haven for Academic Success Kenya Education", "Not yet defined"],
      correct: 3,
      category: "Platform"
    },
    {
      question: "Which country hosts the most African students abroad?",
      options: ["South Africa", "Egypt", "Nigeria", "Kenya"],
      correct: 2,
      category: "General Knowledge"
    },
    {
      question: "What is the capital of Nigeria?",
      options: ["Lagos", "Abuja", "Kano", "Ibadan"],
      correct: 1,
      category: "Geography"
    },
    {
      question: "How many African countries are there?",
      options: ["52", "54", "56", "50"],
      correct: 1,
      category: "Geography"
    },
    {
      question: "Which African country has the largest economy?",
      options: ["South Africa", "Egypt", "Nigeria", "Ethiopia"],
      correct: 2,
      category: "Economics"
    },
    {
      question: "What is the primary language spoken in Nigeria?",
      options: ["Yoruba", "Igbo", "English", "Hausa"],
      correct: 2,
      category: "Language"
    },
    {
      question: "In which year did Nigeria gain independence?",
      options: ["1958", "1960", "1962", "1963"],
      correct: 1,
      category: "History"
    },
    {
      question: "How many states does Nigeria have?",
      options: ["32", "34", "36", "38"],
      correct: 2,
      category: "Geography"
    }
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  // Per-question 10-second countdown
  useEffect(() => {
    if (gameState !== 'playing' || selectedAnswer !== null) return;
    setTimeLeft(10);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time's up — auto-advance without awarding points
          setTimeout(() => {
            setSelectedAnswer(-1); // sentinel: timed out
            setTimeout(() => {
              if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(q => q + 1);
                setSelectedAnswer(null);
              } else {
                finishGame();
              }
            }, 800);
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, currentQuestion]);

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
      }
      await fetchTriviaStats();
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user:', err);
      setLoading(false);
    }
  };

  const fetchTriviaStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: results, error } = await supabase
        .from('trivia_results')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const totalGames = results?.length || 0;
      const totalCorrect = results?.reduce((sum, r) => sum + (r.correct_answers || 0), 0) || 0;
      const bestScore = results?.length > 0 ? Math.max(...results.map(r => r.score || 0)) : 0;

      setTriviaStats({
        totalGames,
        totalCorrect,
        bestScore,
        accuracy: totalGames > 0 ? Math.round((totalCorrect / (totalGames * 10)) * 100) : 0
      });
    } catch (err) {
      console.error('Error fetching trivia stats:', err);
      setTriviaStats({
        totalGames: 0,
        totalCorrect: 0,
        bestScore: 0,
        accuracy: 0
      });
    }
  };

  const startGame = () => {
    const shuffled = [...triviaQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setTimeLeft(10);
    setGameState('playing');
  };

  const handleAnswerSelect = (index) => {
    if (selectedAnswer !== null) return; // Already answered

    setSelectedAnswer(index);
    if (index === questions[currentQuestion].correct) {
      setScore(score + 100); // 100 points per correct answer (10x increase)
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        finishGame();
      }
    }, 1500);
  };

  const finishGame = async () => {
    setGameState('finished');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const correctAnswers = Math.round(score / 100); // score is 100 per correct answer
      const totalReward = score + 500;

      // Record activity FIRST — if this fails, abort before touching points
      const recorded = await recordTriviaActivity(session.user.id, score, correctAnswers, totalReward);
      if (!recorded.success) throw new Error(recorded.error || 'Failed to record trivia');

      // Fetch fresh points then update
      const { data: freshUser } = await supabase
        .from('users').select('points').eq('id', session.user.id).single();
      if (!freshUser) throw new Error('Failed to fetch user points');
      const newPoints = freshUser.points + totalReward;
      const updated = await updateUserPoints(session.user.id, newPoints);
      if (!updated) throw new Error('Failed to update points');

      setUserData(prev => ({ ...prev, points: newPoints }));

      await fetchTriviaStats();
    } catch (err) {
      console.error('Error finishing game:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">HASKE</h1>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate('/daily-missions')}
                className="text-gray-600 hover:text-primary text-sm font-semibold"
              >
                ← Missions
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-primary"
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

      <div className="max-w-2xl mx-auto px-4 py-12">
        {gameState === 'menu' && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow p-8 mb-8">
              <div className="flex items-center gap-3 mb-2">
                <IconTrivia className="w-8 h-8" />
                <h1 className="text-4xl font-bold">Campus IQ Trivia</h1>
              </div>
              <p className="text-purple-100">Test your knowledge about campus life and African history!</p>
            </div>

            {/* Stats */}
            {triviaStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600 text-sm mb-2">Games Played</p>
                  <p className="text-4xl font-bold text-primary">{triviaStats.totalGames}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600 text-sm mb-2">Accuracy</p>
                  <p className="text-4xl font-bold text-primary">{triviaStats.accuracy}%</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600 text-sm mb-2">Best Score</p>
                  <p className="text-4xl font-bold text-primary">{triviaStats.bestScore}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600 text-sm mb-2">Total Points</p>
                  <p className="text-4xl font-bold text-primary">{triviaStats.totalCorrect}</p>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-white rounded-lg shadow p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">How It Works</h2>
              <div className="space-y-3 text-gray-600">
                <p>✅ 10 questions about campus life and African history</p>
                <p>✅ 10 seconds per question</p>
                <p>✅ 100 points per correct answer</p>
                <p>✅ +500 bonus points on completion</p>
                <p>✅ Earn up to 1,500 points per game!</p>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 rounded-lg text-lg transition"
            >
              Start Game
            </button>
          </>
        )}

        {gameState === 'playing' && questions.length > 0 && (
          <>
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 font-semibold">Question {currentQuestion + 1}/{questions.length}</span>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg ${timeLeft <= 3 ? 'text-red-500' : 'text-purple-600'}`}>
                    ⏱ {timeLeft}s
                  </span>
                  <span className="text-gray-600 font-semibold">Score: {score}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
              {/* Timer bar */}
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all ${timeLeft <= 3 ? 'bg-red-500' : 'bg-purple-400'}`}
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-white rounded-lg shadow p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{questions[currentQuestion].question}</h2>
              <p className="text-sm text-gray-500 mb-6">Category: {questions[currentQuestion].category}</p>

              {/* Options */}
              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-lg font-semibold text-left transition ${
                      selectedAnswer === null
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        : idx === questions[currentQuestion].correct
                        ? 'bg-green-500 text-white'
                        : selectedAnswer === idx && selectedAnswer !== -1
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {option}
                    {selectedAnswer !== null && idx === questions[currentQuestion].correct && ' ✓'}
                    {selectedAnswer === idx && idx !== questions[currentQuestion].correct && ' ✗'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {gameState === 'finished' && (
          <>
            {/* Results */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow p-8 mb-8 text-center">
              <h2 className="text-4xl font-bold mb-4">Game Finished! 🎉</h2>
              <p className="text-6xl font-bold mb-2">{score} / 1000</p>
              <p className="text-green-100 text-lg">You earned +{score + 500} points!</p>
            </div>

            {/* Breakdown */}
            <div className="bg-white rounded-lg shadow p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm mb-2">Correct Answers</p>
                  <p className="text-4xl font-bold text-blue-600">{Math.round((score / 100) * 10)}/10</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm mb-2">Score %</p>
                  <p className="text-4xl font-bold text-purple-600">{Math.round((score / 1000) * 100)}%</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm mb-2">Points Earned</p>
                  <p className="text-4xl font-bold text-yellow-600">+{score + 500}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition"
              >
                Play Again
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-4 rounded-lg transition"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

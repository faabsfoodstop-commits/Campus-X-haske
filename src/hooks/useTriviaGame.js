import { useState, useEffect, useCallback } from 'react';
import { gamesClient } from '../api/gamesClient';

export function useTriviaGame() {
  const [gameState, setGameState] = useState('idle'); // idle, round, results
  const [round, setRound] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timePerQuestion, setTimePerQuestion] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Start new round
  const startRound = async (roundType = 'free') => {
    setLoading(true);
    setError(null);
    try {
      const result = await gamesClient.startTriviaRound(roundType);
      if (result.status === 'success') {
        setRound(result.data);
        setQuestions(result.data.questions);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setScore(0);
        setStreak(0);
        setGameState('round');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = async (selectedOptionId) => {
    if (!round || currentQuestionIndex >= questions.length) return;

    const question = questions[currentQuestionIndex];
    const responseTime = (10 - timePerQuestion) * 1000; // Approximate time spent

    const result = await gamesClient.submitTriviaAnswer(
      round.round_id,
      question.id,
      selectedOptionId,
      responseTime
    );

    if (result.status === 'success') {
      const isCorrect = result.data.is_correct;
      const points = result.data.points_earned;
      const newStreak = result.data.streak;

      setAnswers({
        ...answers,
        [question.id]: selectedOptionId
      });

      setScore(score + points);
      setStreak(newStreak);

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimePerQuestion(10);
      } else {
        // Round complete
        completeRound();
      }

      return { isCorrect, points, newStreak };
    } else {
      setError(result.message);
      return null;
    }
  };

  // Complete round
  const completeRound = async () => {
    if (!round) return;

    const result = await gamesClient.completeTriviaRound(round.round_id);

    if (result.status === 'success') {
      setGameState('results');
      return result.data;
    } else {
      setError(result.message);
      return null;
    }
  };

  // Get current question
  const getCurrentQuestion = () => {
    if (currentQuestionIndex < questions.length) {
      return questions[currentQuestionIndex];
    }
    return null;
  };

  return {
    gameState,
    round,
    questions,
    currentQuestionIndex,
    currentQuestion: getCurrentQuestion(),
    score,
    streak,
    timePerQuestion,
    setTimePerQuestion,
    loading,
    error,
    startRound,
    submitAnswer,
    completeRound
  };
}

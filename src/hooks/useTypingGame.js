import { useState, useEffect, useRef } from 'react';
import { gamesClient } from '../api/gamesClient';

export function useTypingGame() {
  const [gameState, setGameState] = useState('idle'); // idle, lobby, racing, results
  const [match, setMatch] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const typedTextRef = useRef('');
  const startTimeRef = useRef(null);

  // Create new match
  const createMatch = async (difficulty = 'medium') => {
    setLoading(true);
    setError(null);
    try {
      const result = await gamesClient.createTypingMatch(difficulty);
      if (result.status === 'success') {
        setMatch(result.data);
        setGameState('lobby');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Start race (transition to racing state)
  const startRace = () => {
    typedTextRef.current = '';
    startTimeRef.current = Date.now();
    setGameState('racing');
    setWpm(0);
    setAccuracy(0);
  };

  // Update live WPM
  const updateTyping = (typedText) => {
    typedTextRef.current = typedText;

    if (startTimeRef.current) {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedMinutes = elapsedMs / 60000;
      const wordsTyped = typedText.split(' ').length;
      const calculatedWpm = Math.round(wordsTyped / elapsedMinutes);
      setWpm(calculatedWpm);
    }
  };

  // Submit match results
  const submitMatch = async () => {
    if (!match) return;

    const completionTimeMs = Date.now() - startTimeRef.current;
    const result = await gamesClient.submitTypingMatch(
      match.match_id,
      typedTextRef.current,
      completionTimeMs
    );

    if (result.status === 'success') {
      setAccuracy(parseFloat(result.data.accuracy));
      setGameState('results');
    } else {
      setError(result.message);
    }
  };

  // Complete match and award tokens
  const completeMatch = async () => {
    if (!match) return;

    const result = await gamesClient.completeTypingMatch(match.match_id);

    if (result.status === 'success') {
      return result.data;
    } else {
      setError(result.message);
      return null;
    }
  };

  return {
    gameState,
    match,
    wpm,
    accuracy,
    loading,
    error,
    createMatch,
    startRace,
    updateTyping,
    submitMatch,
    completeMatch
  };
}

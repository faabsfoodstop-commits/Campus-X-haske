// Games API Client - Handles all backend communication

import { supabase } from './supabaseClient';

class GamesClient {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.userId = null;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  getHeaders() {
    return {
      'X-User-ID': this.userId,
      'Content-Type': 'application/json'
    };
  }

  // ============================================================================
  // TYPING MASTER ENDPOINTS
  // ============================================================================

  async createTypingMatch(difficulty = 'medium') {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/typing/match/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ difficulty })
      });
      return await response.json();
    } catch (error) {
      console.error('Create match error:', error);
      return { status: 'error', message: error.message };
    }
  }

  async getTypingMatchLive(matchId) {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/typing/match/${matchId}/live`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async submitTypingMatch(matchId, typedText, completionTimeMs) {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/typing/match/${matchId}/submit`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ typed_text: typedText, completion_time_ms: completionTimeMs })
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async completeTypingMatch(matchId) {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/typing/match/${matchId}/complete`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getTypingLeaderboard(type = 'global', campusId = null) {
    try {
      const url = type === 'global'
        ? `${this.getApiUrl()}/api/typing/leaderboard/global?limit=100`
        : `${this.getApiUrl()}/api/typing/leaderboard/campus/${campusId}`;

      const response = await fetch(url, { headers: this.getHeaders() });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getTypingStats() {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/typing/user/stats`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getTypingHistory(limit = 20) {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/typing/match/history?limit=${limit}`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // ============================================================================
  // TRIVIA ENDPOINTS
  // ============================================================================

  async startTriviaRound(roundType = 'free', difficultyLevel = 'mixed') {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/trivia/round/start`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ round_type: roundType, difficulty_level: difficultyLevel })
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async submitTriviaAnswer(roundId, questionId, selectedOptionId, responseTimeMs) {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/trivia/round/${roundId}/answer`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          question_id: questionId,
          selected_option_id: selectedOptionId,
          response_time_ms: responseTimeMs
        })
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async completeTriviaRound(roundId) {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/trivia/round/${roundId}/complete`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getTriviaLeaderboard(type = 'daily') {
    try {
      const endpoint = type === 'daily' ? 'daily' : 'weekly';
      const response = await fetch(`${this.getApiUrl()}/api/trivia/leaderboard/${endpoint}?limit=100`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getTriviaStats() {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/trivia/user/stats`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getTriviaWinners() {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/trivia/winners/today`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async getTriviaHistory(limit = 20) {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/trivia/user/history?limit=${limit}`, {
        headers: this.getHeaders()
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // ============================================================================
  // COSMETICS ENDPOINTS
  // ============================================================================

  async getCosmetics(gameId = null) {
    try {
      const url = gameId
        ? `${this.getApiUrl()}/api/${gameId}/cosmetics/shop`
        : `${this.getApiUrl()}/api/cosmetics/shop`;

      const response = await fetch(url, { headers: this.getHeaders() });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async purchaseCosmetic(gameId, cosmeticId) {
    try {
      const response = await fetch(`${this.getApiUrl()}/api/${gameId}/cosmetics/purchase`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ cosmetic_id: cosmeticId })
      });
      return await response.json();
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  getApiUrl() {
    // Use local Vercel API routes (no external backend needed)
    return '';
  }
}

export const gamesClient = new GamesClient(supabase);

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard] = useState([
    { rank: 1, player: 'alex_speed', score: 4250 },
    { rank: 2, player: 'jordan_type', score: 3890 },
    { rank: 3, player: 'sam_trivia', score: 3720 },
    { rank: 4, player: 'casey_race', score: 3540 },
    { rank: 5, player: 'you?', score: 0 }
  ]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="landing-container">
      <style>{`
        :root {
          --accent-hot: #FF006E;
          --accent-speed: #00D9FF;
          --ground: #0A0E27;
          --text-primary: #F5F3F0;
          --text-secondary: #A8AFB8;
          --border-subtle: #1a1f3a;
        }

        @media (prefers-color-scheme: light) {
          :root {
            --ground: #FFFFFF;
            --text-primary: #0A0E27;
            --text-secondary: #5a6170;
            --border-subtle: #e0e4eb;
          }
        }

        .landing-container {
          background: var(--ground);
          color: var(--text-primary);
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Hero Section */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          align-items: center;
          padding: 4rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 80vh;
        }

        .hero-content h1 {
          font-family: 'Courier New', Courier, monospace;
          font-size: 3.5rem;
          font-weight: bold;
          letter-spacing: 0.05em;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, var(--accent-hot) 0%, var(--accent-speed) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: fadeInUp 0.8s ease-out;
        }

        .hero-content p {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          max-width: 90%;
          line-height: 1.5;
          animation: fadeInUp 0.8s ease-out 0.1s both;
        }

        .hero-cta {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .btn-primary, .btn-secondary {
          font-family: inherit;
          padding: 1rem 2rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: var(--accent-hot);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(255, 0, 110, 0.3);
        }

        .btn-primary:focus-visible {
          outline: 2px solid var(--accent-speed);
          outline-offset: 2px;
        }

        .btn-secondary {
          background: transparent;
          border: 2px solid var(--accent-speed);
          color: var(--accent-speed);
        }

        .btn-secondary:hover {
          background: var(--accent-speed);
          color: var(--ground);
          transform: translateY(-2px);
        }

        .btn-secondary:focus-visible {
          outline: 2px solid var(--accent-hot);
          outline-offset: 2px;
        }

        /* Leaderboard Preview */
        .leaderboard-preview {
          background: rgba(0, 217, 255, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: 1rem;
          padding: 2rem;
          backdrop-filter: blur(10px);
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        .leaderboard-preview h3 {
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.875rem;
          letter-spacing: 0.1em;
          color: var(--accent-speed);
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        .leaderboard-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid var(--border-subtle);
          font-variant-numeric: tabular-nums;
          font-size: 0.95rem;
        }

        .leaderboard-row:last-child {
          border-bottom: none;
        }

        .rank {
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
          color: var(--accent-hot);
          width: 2rem;
        }

        .player {
          flex: 1;
          margin-left: 1rem;
          color: var(--text-secondary);
        }

        .score {
          font-family: 'Courier New', Courier, monospace;
          color: var(--accent-speed);
          font-weight: bold;
        }

        /* Section Styles */
        section {
          padding: 4rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        section h2 {
          font-family: 'Courier New', Courier, monospace;
          font-size: 2.5rem;
          letter-spacing: 0.05em;
          margin-bottom: 3rem;
          text-align: center;
        }

        /* Games Section */
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .game-card {
          background: rgba(255, 0, 110, 0.05);
          border: 1px solid var(--border-subtle);
          border-radius: 1rem;
          padding: 2rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .game-card:hover {
          border-color: var(--accent-hot);
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(255, 0, 110, 0.2);
        }

        .game-card h3 {
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: var(--accent-hot);
        }

        .game-card p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .game-stat {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-variant-numeric: tabular-nums;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }

        .game-stat-label {
          color: var(--text-secondary);
        }

        .game-stat-value {
          font-family: 'Courier New', Courier, monospace;
          color: var(--accent-speed);
          font-weight: bold;
        }

        /* How It Works */
        .how-section {
          background: rgba(0, 217, 255, 0.02);
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .step {
          padding: 2rem;
          border-left: 3px solid var(--accent-hot);
        }

        .step-number {
          font-family: 'Courier New', Courier, monospace;
          font-size: 2rem;
          font-weight: bold;
          color: var(--accent-speed);
          margin-bottom: 0.5rem;
        }

        .step h3 {
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .step p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* Stats Section */
        .stats-section {
          background: linear-gradient(135deg, rgba(255, 0, 110, 0.1) 0%, rgba(0, 217, 255, 0.1) 100%);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .stat-card {
          text-align: center;
        }

        .stat-value {
          font-family: 'Courier New', Courier, monospace;
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(135deg, var(--accent-hot) 0%, var(--accent-speed) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.95rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: 'Courier New', Courier, monospace;
        }

        /* Footer CTA */
        .footer-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 4rem 2rem;
          border-top: 1px solid var(--border-subtle);
        }

        .footer-cta h2 {
          font-size: 2rem;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero {
            grid-template-columns: 1fr;
            min-height: auto;
            padding: 2rem;
          }

          .hero-content h1 {
            font-size: 2.5rem;
          }

          section {
            padding: 3rem 1.5rem;
          }

          section h2 {
            font-size: 2rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .hero-cta {
            flex-direction: column;
          }

          .btn-primary, .btn-secondary {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Play. Compete. Earn.</h1>
          <p>Join the college gaming community where every match earns you real tokens. Race against thousands. Climb the leaderboard. Get rewarded.</p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => navigate('/signup')}>
              Start Playing Now
            </button>
            <button className="btn-secondary" onClick={() => navigate('/games')}>
              Explore Games
            </button>
          </div>
        </div>

        <div className="leaderboard-preview">
          <h3>🏆 Live Leaderboard</h3>
          {leaderboard.map((entry) => (
            <div key={entry.rank} className="leaderboard-row">
              <div className="rank">{entry.rank}</div>
              <div className="player">{entry.player}</div>
              <div className="score">{entry.score.toLocaleString()} pts</div>
            </div>
          ))}
        </div>
      </section>

      {/* Games Section */}
      <section className="games-section">
        <h2>Choose Your Arena</h2>
        <div className="games-grid">
          <div className="game-card" onClick={() => navigate('/login')}>
            <h3>⌨️ Typing Master</h3>
            <p>Race others in high-speed typing challenges. Faster fingers = bigger rewards.</p>
            <div className="game-stat">
              <span className="game-stat-label">Avg Match</span>
              <span className="game-stat-value">3 min</span>
            </div>
            <div className="game-stat">
              <span className="game-stat-label">Tokens/Win</span>
              <span className="game-stat-value">150</span>
            </div>
          </div>

          <div className="game-card" onClick={() => navigate('/login')}>
            <h3>🧠 QuickFire Trivia</h3>
            <p>Answer faster than the competition. Knowledge + speed = dominance.</p>
            <div className="game-stat">
              <span className="game-stat-label">Avg Match</span>
              <span className="game-stat-value">5 min</span>
            </div>
            <div className="game-stat">
              <span className="game-stat-label">Tokens/Win</span>
              <span className="game-stat-value">200</span>
            </div>
          </div>

          <div className="game-card">
            <h3>🎮 Coming Soon</h3>
            <p>More games launching weekly. Vote for the next arena on Discord.</p>
            <div className="game-stat">
              <span className="game-stat-label">Next Release</span>
              <span className="game-stat-value">Jul 14</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <h2>The Earn Loop</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Sign Up</h3>
            <p>Create your HASKii account. Takes 30 seconds. No credit card needed.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Jump In</h3>
            <p>Pick a game. Challenge friends or queue solo. Matchmaking finds your level.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Win & Earn</h3>
            <p>Victory = tokens. Build your streak. Tokens unlock cosmetics and rewards.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Climb</h3>
            <p>Rank up daily. Hit the leaderboard. Become campus legend.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">2.8K</div>
            <div className="stat-label">Active Players</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">156K</div>
            <div className="stat-label">Matches This Week</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">$42K</div>
            <div className="stat-label">Tokens Awarded</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">18</div>
            <div className="stat-label">Partner Campuses</div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="footer-cta">
        <h2>Ready to compete?</h2>
        <button className="btn-primary" onClick={() => navigate('/signup')}>
          Join HASKii Free
        </button>
      </section>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PALETTES = ['blush', 'sage', 'mauve', 'honey', 'blue'];

function getPalette(category) {
  if (!category) return 'blush';
  const hash = category.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTES[hash % PALETTES.length];
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'good morning, sunshine';
  if (hour < 17) return 'hey there, lovely';
  return 'good evening, babe';
}

function App() {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const fetchTodaySuggestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/suggestion/today`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'something went wrong');
      }
      setSuggestion(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNewSuggestion = useCallback(async (category) => {
    setLoading(true);
    setError(null);
    setShowCategories(false);
    try {
      const url = category
        ? `${API_URL}/suggestion/new?category=${encodeURIComponent(category)}`
        : `${API_URL}/suggestion/new`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'something went wrong');
      }
      setSuggestion(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    fetchTodaySuggestion();
    fetchCategories();
  }, [fetchTodaySuggestion, fetchCategories]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  const palette = suggestion ? getPalette(suggestion.category) : 'blush';

  return (
    <div className="app">
      <header className="header">
        <p className="header-deco">~ chennai ~</p>
        <h1>Summer <em>Vibes</em></h1>
        <p className="header-sub">{getGreeting()}</p>
      </header>

      <div className="date-strip">
        <span>{formatDate()}</span>
      </div>

      {showInstallBanner && (
        <div className="install-banner">
          <div className="install-banner-text">
            add to your home screen
            <span>wake up to a new vibe every day</span>
          </div>
          <button className="btn-install" onClick={handleInstall}>
            install
          </button>
          <button
            className="btn-close"
            onClick={() => setShowInstallBanner(false)}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
          <p>finding your perfect vibe...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <p>oops — {error}</p>
          <button className="btn-primary" onClick={fetchTodaySuggestion}>
            try again
          </button>
        </div>
      )}

      {suggestion && !loading && !error && (
        <div className="suggestion-card" key={suggestion.title}>
          <div className="card-top">
            <div className={`card-emoji-wrap ${palette}`}>
              {suggestion.emoji}
            </div>
            <span className={`card-badge ${palette}`}>
              {suggestion.category}
            </span>
          </div>

          <h2 className="card-title">{suggestion.title}</h2>
          <p className="card-desc">{suggestion.description}</p>

          <div className="card-details">
            <div className="card-detail">
              <span className="card-detail-label">best time</span>
              <span className="card-detail-value">{suggestion.best_time}</span>
            </div>
            <div className="card-detail">
              <span className="card-detail-label">vibe</span>
              <span className="card-detail-value">{suggestion.vibe}</span>
            </div>
          </div>
        </div>
      )}

      <div className="actions">
        <button
          className="btn-primary"
          onClick={() => fetchNewSuggestion()}
          disabled={loading}
        >
          {loading ? 'finding...' : 'surprise me'}
        </button>
        <button
          className="btn-secondary"
          onClick={() => setShowCategories(!showCategories)}
          aria-label="Pick a category"
        >
          +
        </button>
      </div>

      {showCategories && categories.length > 0 && (
        <div className="category-section">
          <p className="category-section-title">pick a mood</p>
          <div className="category-list">
            {categories.map((cat) => (
              <button
                key={cat}
                className="category-pill"
                onClick={() => fetchNewSuggestion(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="footer">
        <p>made with love for chennai girls</p>
      </footer>
    </div>
  );
}

export default App;

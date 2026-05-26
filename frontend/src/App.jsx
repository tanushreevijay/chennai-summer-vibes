import { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ACCENT_COLORS = ['pink', 'lavender', 'mint', 'peach', 'sky'];

function getAccentColor(category) {
  if (!category) return 'lavender';
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
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
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
        throw new Error(data.detail || 'Failed to fetch suggestion');
      }
      const data = await res.json();
      setSuggestion(data);
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
        throw new Error(data.detail || 'Failed to fetch suggestion');
      }
      const data = await res.json();
      setSuggestion(data);
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
      // silently fail
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

  const accent = suggestion ? getAccentColor(suggestion.category) : 'lavender';

  return (
    <div className="app">
      <header className="header">
        <span className="header-emoji" role="img" aria-label="sun">
          &#x1F334;
        </span>
        <h1>Chennai Summer Vibes</h1>
        <p className="subtitle">{getGreeting()}! Here&apos;s your vibe for today</p>
      </header>

      <div className="date-badge">
        <span role="img" aria-label="calendar">&#x1F4C5;</span>
        {formatDate()}
      </div>

      {showInstallBanner && (
        <div className="install-prompt">
          <div className="install-prompt-text">
            Add to Home Screen
            <span>Get daily vibes on your phone!</span>
          </div>
          <button className="btn-install" onClick={handleInstall}>
            Install
          </button>
          <button
            className="btn-dismiss"
            onClick={() => setShowInstallBanner(false)}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-card">
          <span className="loading-emoji" role="img" aria-label="sparkles">
            &#x2728;
          </span>
          <p className="loading-text">Finding something fun for you...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-card">
          <span className="error-emoji" role="img" aria-label="sad">
            &#x1F625;
          </span>
          <p className="error-text">{error}</p>
          <button className="btn-refresh" onClick={fetchTodaySuggestion}>
            Try Again
          </button>
        </div>
      )}

      {suggestion && !loading && !error && (
        <div className="suggestion-card" key={suggestion.title}>
          <div className={`card-accent ${accent}`} />
          <span className="card-emoji" role="img" aria-label="activity">
            {suggestion.emoji}
          </span>
          <span className={`card-category ${accent}`}>
            {suggestion.category}
          </span>
          <h2 className="card-title">{suggestion.title}</h2>
          <p className="card-description">{suggestion.description}</p>
          <div className="card-meta">
            <span className="meta-tag">
              <span role="img" aria-label="clock">&#x1F570;&#xFE0F;</span>
              {suggestion.best_time}
            </span>
            <span className="meta-tag">
              <span role="img" aria-label="vibe">&#x2728;</span>
              {suggestion.vibe}
            </span>
          </div>
        </div>
      )}

      <div className="button-group">
        <button
          className="btn-refresh"
          onClick={() => fetchNewSuggestion()}
          disabled={loading}
        >
          <span role="img" aria-label="shuffle">&#x1F500;</span>
          {loading ? 'Loading...' : 'Surprise Me!'}
        </button>
        <button
          className="btn-category"
          onClick={() => setShowCategories(!showCategories)}
        >
          <span role="img" aria-label="categories">&#x1F3AF;</span>
        </button>
      </div>

      {showCategories && categories.length > 0 && (
        <div className="category-picker">
          <div className="category-grid">
            {categories.map((cat) => (
              <button
                key={cat}
                className="category-chip"
                onClick={() => fetchNewSuggestion(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Made with love for Chennai summers</p>
      </footer>
    </div>
  );
}

export default App;

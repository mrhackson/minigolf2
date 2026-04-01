import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Initialize with saved theme or default immediately
    const savedTheme = localStorage.getItem('theme') || 'default';
    // Apply theme immediately during initialization
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    return savedTheme;
  });
  const [loading, setLoading] = useState(false);

  // Theme definitions
  const themes = {
    default: {
      id: 'default',
      name: 'Default',
      description: 'Classic green minigolf theme',
      preview: ['#2e7d32', '#f0f4f0']
    },
    dark: {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Easy on the eyes dark theme',
      preview: ['#4caf50', '#1e1e1e']
    },
    midnight: {
      id: 'midnight',
      name: 'Midnight Blue',
      description: 'Deep blue night theme',
      preview: ['#3f51b5', '#0d1421']
    },
    sunset: {
      id: 'sunset',
      name: 'Sunset',
      description: 'Warm orange and golden tones',
      preview: ['#e65100', '#fdf6f0']
    },
    ocean: {
      id: 'ocean',
      name: 'Ocean',
      description: 'Cool ocean-blue tones',
      preview: ['#0277bd', '#e8f4fd']
    },
    rose: {
      id: 'rose',
      name: 'Rose',
      description: 'Soft pink and rose tones',
      preview: ['#ad1457', '#fdf0f5']
    },
    retro: {
      id: 'retro',
      name: 'Retro',
      description: 'Dark arcade-style purple theme',
      preview: ['#ce93d8', '#1a0a2e']
    }
  };

  // Load user's theme preference from API
  const loadUserTheme = async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) return;

      const response = await api.get('/auth/preferences/');
      if (response.data?.theme) {
        setTheme(response.data.theme);
        applyTheme(response.data.theme);
      }
    } catch (error) {
      console.log('Could not load theme preference:', error);
      // Fall back to localStorage or default
      const savedTheme = localStorage.getItem('theme') || 'default';
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  };

  // Apply theme to document
  const applyTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName);
  };

  // Change theme and persist to backend
  const changeTheme = async (newTheme) => {
    if (!themes[newTheme]) return;

    setLoading(true);
    const previousTheme = theme;

    try {
      // Optimistically apply theme
      setTheme(newTheme);
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);

      // Update backend if authenticated
      const token = localStorage.getItem('access');
      if (token) {
        await api.post('/auth/preferences/', { theme: newTheme });
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Revert on failure
      setTheme(previousTheme);
      applyTheme(previousTheme);
      localStorage.setItem('theme', previousTheme);
    } finally {
      setLoading(false);
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    const initializeTheme = async () => {
      // First, apply default theme immediately to prevent invisible content
      const savedTheme = localStorage.getItem('theme') || 'default';
      setTheme(savedTheme);
      applyTheme(savedTheme);

      // Then load from API to sync with latest user preference
      await loadUserTheme();
    };

    initializeTheme();
  }, []);

  const value = {
    theme,
    themes,
    changeTheme,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
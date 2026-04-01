import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { theme, themes, changeTheme, loading } = useTheme();
  const { user } = useAuth();

  const handleThemeChange = (themeId) => {
    if (loading) return;
    changeTheme(themeId);
  };

  return (
    <div className="container">
      <div className="section-title">Settings</div>
      
      <div className="card">
        <h3>Account</h3>
        {user && (
          <div className="meta">
            Logged in as <strong>{user.username}</strong>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Theme Preferences</h3>
        <p className="meta" style={{ marginBottom: '16px' }}>
          Choose your preferred color theme for the minigolf app.
        </p>
        
        <div className="theme-options">
          {Object.values(themes).map((themeOption) => (
            <div 
              key={themeOption.id}
              className={`theme-option ${theme === themeOption.id ? 'active' : ''}`}
              onClick={() => handleThemeChange(themeOption.id)}
              style={{
                padding: '16px',
                border: `2px solid ${theme === themeOption.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                marginBottom: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: theme === themeOption.id ? 'var(--primary-light)' : 'var(--surface)',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    marginBottom: '4px'
                  }}>
                    {themeOption.name}
                    {theme === themeOption.id && (
                      <span style={{ 
                        marginLeft: '8px',
                        color: 'var(--primary-color)',
                        fontSize: '0.9rem'
                      }}>
                        ✓ Active
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)' 
                  }}>
                    {themeOption.description}
                  </div>
                </div>
                
                <div className="theme-preview" style={{ 
                  display: 'flex', 
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  {themeOption.preview && themeOption.preview.map((color, i) => (
                    <div key={i} style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: color,
                      borderRadius: '50%',
                      border: '1px solid rgba(0,0,0,0.15)'
                    }}></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ 
            textAlign: 'center', 
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            marginTop: '12px'
          }}>
            Saving theme preference...
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
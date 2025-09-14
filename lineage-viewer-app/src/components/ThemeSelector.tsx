import React, { useState } from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeSelectorProps {
  isCollapsed?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ isCollapsed = false }) => {
  const { currentTheme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  if (isCollapsed) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-full flex items-center justify-center group transition-colors"
          style={{ backgroundColor: currentTheme.colors.background }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.background;
          }}
          title="Theme Selector"
        >
          <Palette className="w-4 h-4" style={{ color: currentTheme.colors.textSecondary }} />
        </button>
        
        {isOpen && (
          <div 
            className="absolute left-10 top-0 z-50 rounded-lg shadow-lg min-w-64"
            style={{
              backgroundColor: currentTheme.colors.surface,
              border: `1px solid ${currentTheme.colors.border}`
            }}
          >
            <div className="p-2">
              <div className="text-xs font-semibold mb-2 px-2" style={{ color: currentTheme.colors.text }}>Select Theme</div>
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className="w-full flex items-center justify-between px-2 py-2 text-xs rounded transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: currentTheme.colors.textSecondary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = currentTheme.colors.border;
                    e.currentTarget.style.color = currentTheme.colors.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = currentTheme.colors.textSecondary;
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: theme.colors.primary,
                        border: `1px solid ${currentTheme.colors.border}`
                      }}
                    />
                    <span style={{ color: currentTheme.colors.text }}>{theme.name}</span>
                  </div>
                  {currentTheme.id === theme.id && (
                    <Check className="w-3 h-3" style={{ color: currentTheme.colors.primary }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="text-sm font-medium mb-2 block" style={{ color: currentTheme.colors.text }}>
        Theme
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors"
          style={{
            backgroundColor: currentTheme.colors.background,
            border: `1px solid ${currentTheme.colors.border}`,
            color: currentTheme.colors.text
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = currentTheme.colors.background;
          }}
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" style={{ color: currentTheme.colors.textSecondary }} />
            <span style={{ color: currentTheme.colors.text }}>{currentTheme.name}</span>
            <span className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>({currentTheme.description})</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: currentTheme.colors.textSecondary }}
          />
        </button>
        
        {isOpen && (
          <div 
            className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg shadow-lg"
            style={{
              backgroundColor: currentTheme.colors.surface,
              border: `1px solid ${currentTheme.colors.border}`
            }}
          >
            <div className="p-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: currentTheme.colors.textSecondary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = currentTheme.colors.border;
                    e.currentTarget.style.color = currentTheme.colors.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = currentTheme.colors.textSecondary;
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ 
                        backgroundColor: theme.colors.primary,
                        border: `1px solid ${currentTheme.colors.border}`
                      }}
                    />
                    <div className="text-left">
                      <div className="font-medium" style={{ color: currentTheme.colors.text }}>{theme.name}</div>
                      <div className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>{theme.description}</div>
                    </div>
                  </div>
                  {currentTheme.id === theme.id && (
                    <Check className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeSelector;

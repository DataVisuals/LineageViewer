import React, { useState } from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';

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
          className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center group hover:bg-secondary-200 transition-colors"
          title="Theme Selector"
        >
          <Palette className="w-4 h-4 text-secondary-600 group-hover:text-secondary-800" />
        </button>
        
        {isOpen && (
          <div className="absolute left-10 top-0 z-50 bg-white border border-secondary-200 rounded-lg shadow-lg min-w-64">
            <div className="p-2">
              <div className="text-xs font-semibold text-secondary-700 mb-2 px-2">Select Theme</div>
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className="w-full flex items-center justify-between px-2 py-2 text-xs rounded hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-secondary-300"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <span className="text-secondary-700">{theme.name}</span>
                  </div>
                  {currentTheme.id === theme.id && (
                    <Check className="w-3 h-3 text-primary-600" />
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
      <label className="text-sm font-medium text-secondary-700 mb-2 block">
        Theme
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm border border-secondary-300 rounded-lg bg-white hover:bg-secondary-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-secondary-500" />
            <span className="text-secondary-700">{currentTheme.name}</span>
            <span className="text-xs text-secondary-500">({currentTheme.description})</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-secondary-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg">
            <div className="p-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border border-secondary-300"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div className="text-left">
                      <div className="font-medium text-secondary-700">{theme.name}</div>
                      <div className="text-xs text-secondary-500">{theme.description}</div>
                    </div>
                  </div>
                  {currentTheme.id === theme.id && (
                    <Check className="w-4 h-4 text-primary-600" />
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

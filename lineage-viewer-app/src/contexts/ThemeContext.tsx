import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  cytoscape: {
    node: {
      column: {
        background: string;
        border: string;
        text: string;
        selected: {
          background: string;
          border: string;
        };
      };
      transform: {
        background: string;
        border: string;
        text: string;
        selected: {
          background: string;
          border: string;
        };
      };
      dataset: {
        background: string;
        border: string;
        text: string;
        selected: {
          background: string;
          border: string;
        };
      };
      job: {
        background: string;
        border: string;
        text: string;
        selected: {
          background: string;
          border: string;
        };
      };
    };
    edge: {
      directCopy: string;
      aggregation: string;
      calculation: string;
      conditional: string;
      join: string;
      filter: string;
      default: string;
    };
    tooltip: {
      background: string;
      text: string;
      border: string;
      accent: string;
    };
  };
}

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright theme for daytime use',
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    cytoscape: {
      node: {
        column: {
          background: '#eff6ff',
          border: '#3b82f6',
          text: '#1f2937',
          selected: {
            background: '#dbeafe',
            border: '#6366f1',
          },
        },
        transform: {
          background: '#fffbeb',
          border: '#f59e0b',
          text: '#1f2937',
          selected: {
            background: '#fef3c7',
            border: '#6366f1',
          },
        },
        dataset: {
          background: '#eff6ff',
          border: '#3b82f6',
          text: '#1f2937',
          selected: {
            background: '#dbeafe',
            border: '#6366f1',
          },
        },
        job: {
          background: '#ecfdf5',
          border: '#10b981',
          text: '#1f2937',
          selected: {
            background: '#d1fae5',
            border: '#6366f1',
          },
        },
      },
      edge: {
        directCopy: '#3b82f6',
        aggregation: '#8b5cf6',
        calculation: '#10b981',
        conditional: '#f59e0b',
        join: '#ef4444',
        filter: '#6b7280',
        default: '#6b7280',
      },
      tooltip: {
        background: 'rgba(0, 0, 0, 0.9)',
        text: '#ffffff',
        border: '#374151',
        accent: '#fbbf24',
      },
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme for comfortable viewing in low light',
    colors: {
      primary: '#60a5fa',
      secondary: '#9ca3af',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#cbd5e1',
      border: '#334155',
      accent: '#fbbf24',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
    },
    cytoscape: {
      node: {
        column: {
          background: '#1e3a8a',
          border: '#60a5fa',
          text: '#f8fafc',
          selected: {
            background: '#1e40af',
            border: '#93c5fd',
          },
        },
        transform: {
          background: '#92400e',
          border: '#fbbf24',
          text: '#f8fafc',
          selected: {
            background: '#b45309',
            border: '#93c5fd',
          },
        },
        dataset: {
          background: '#1e3a8a',
          border: '#60a5fa',
          text: '#f8fafc',
          selected: {
            background: '#1e40af',
            border: '#93c5fd',
          },
        },
        job: {
          background: '#064e3b',
          border: '#34d399',
          text: '#f8fafc',
          selected: {
            background: '#065f46',
            border: '#93c5fd',
          },
        },
      },
      edge: {
        directCopy: '#60a5fa',
        aggregation: '#a78bfa',
        calculation: '#34d399',
        conditional: '#fbbf24',
        join: '#f87171',
        filter: '#9ca3af',
        default: '#9ca3af',
      },
      tooltip: {
        background: 'rgba(0, 0, 0, 0.95)',
        text: '#ffffff',
        border: '#4b5563',
        accent: '#fbbf24',
      },
    },
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'High contrast theme for accessibility',
    colors: {
      primary: '#0000ff',
      secondary: '#000000',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#000000',
      border: '#000000',
      accent: '#ff8c00',
      success: '#008000',
      warning: '#ff8c00',
      error: '#ff0000',
      info: '#0000ff',
    },
    cytoscape: {
      node: {
        column: {
          background: '#e6f3ff',
          border: '#0000ff',
          text: '#000000',
          selected: {
            background: '#cce7ff',
            border: '#ff0000',
          },
        },
        transform: {
          background: '#fff2e6',
          border: '#ff8c00',
          text: '#000000',
          selected: {
            background: '#ffe6cc',
            border: '#ff0000',
          },
        },
        dataset: {
          background: '#e6f3ff',
          border: '#0000ff',
          text: '#000000',
          selected: {
            background: '#cce7ff',
            border: '#ff0000',
          },
        },
        job: {
          background: '#e6ffe6',
          border: '#008000',
          text: '#000000',
          selected: {
            background: '#ccffcc',
            border: '#ff0000',
          },
        },
      },
      edge: {
        directCopy: '#0000ff',
        aggregation: '#800080',
        calculation: '#008000',
        conditional: '#ff8c00',
        join: '#ff0000',
        filter: '#000000',
        default: '#000000',
      },
      tooltip: {
        background: '#ffffff',
        text: '#000000',
        border: '#000000',
        accent: '#ff8c00',
      },
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool ocean-inspired color palette',
    colors: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#cbd5e1',
      accent: '#f59e0b',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0ea5e9',
    },
    cytoscape: {
      node: {
        column: {
          background: '#e0f2fe',
          border: '#0ea5e9',
          text: '#0f172a',
          selected: {
            background: '#bae6fd',
            border: '#0284c7',
          },
        },
        transform: {
          background: '#fef3c7',
          border: '#f59e0b',
          text: '#0f172a',
          selected: {
            background: '#fde68a',
            border: '#0284c7',
          },
        },
        dataset: {
          background: '#e0f2fe',
          border: '#0ea5e9',
          text: '#0f172a',
          selected: {
            background: '#bae6fd',
            border: '#0284c7',
          },
        },
        job: {
          background: '#d1fae5',
          border: '#059669',
          text: '#0f172a',
          selected: {
            background: '#a7f3d0',
            border: '#0284c7',
          },
        },
      },
      edge: {
        directCopy: '#0ea5e9',
        aggregation: '#8b5cf6',
        calculation: '#059669',
        conditional: '#f59e0b',
        join: '#dc2626',
        filter: '#64748b',
        default: '#64748b',
      },
      tooltip: {
        background: 'rgba(15, 23, 42, 0.95)',
        text: '#f0f9ff',
        border: '#475569',
        accent: '#f59e0b',
      },
    },
  },
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // Try to get theme from localStorage, fallback to light theme
    const savedTheme = localStorage.getItem('lineage-viewer-theme');
    return themes.find(theme => theme.id === savedTheme) || themes[0];
  });

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('lineage-viewer-theme', themeId);
    }
  };

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    const theme = currentTheme;
    
    // Apply CSS custom properties
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-info', theme.colors.info);
    
    // Apply background color to body
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.text;
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

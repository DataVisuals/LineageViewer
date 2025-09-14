import React from 'react';
import { Settings, ChevronLeft, ChevronRight, Database, Cpu, BarChart3, Code, Workflow } from 'lucide-react';
import { ViewMode } from '../types/lineage';
import AutocompleteSearch from './AutocompleteSearch';
import ThemeSelector from './ThemeSelector';
import { useTheme } from '../contexts/ThemeContext';

type LayoutAlgorithm = 'hierarchical' | 'circular' | 'grid' | 'force' | 'flow' | 'dag' | 'sugiyama' | 'manual';

interface ControlPanelProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: Partial<ViewMode>) => void;
  onSearch: (query: string) => void;
  onFilter: (filters: any) => void;
  graph?: {
    jobs?: any[];
    datasets?: any[];
    transforms?: any[];
  };
  layoutAlgorithm?: LayoutAlgorithm;
  onLayoutChange?: (algorithm: LayoutAlgorithm) => void;
  edgeLength?: number;
  onEdgeLengthChange?: (length: number) => void;
  layoutParams?: {
    nodeSpacing?: number;
    levelSpacing?: number;
    iterations?: number;
    damping?: number;
  };
  onLayoutParamsChange?: (params: any) => void;
  activeTab?: 'graph' | 'browser';
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  viewMode,
  onViewModeChange,
  onSearch,
  onFilter,
  graph,
  layoutAlgorithm = 'dag',
  onLayoutChange,
  edgeLength = 150,
  onEdgeLengthChange,
  layoutParams = { nodeSpacing: 100, levelSpacing: 150, iterations: 150, damping: 0.7 },
  onLayoutParamsChange,
  activeTab = 'graph',
}) => {
  const { currentTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Count unique languages used in jobs
  const getLanguageCount = () => {
    if (!graph?.jobs) return 0;
    const languages = new Set<string>();
    graph.jobs.forEach(job => {
      if (job.language) languages.add(job.language);
      if (job.sourceCode?.language) languages.add(job.sourceCode.language);
    });
    return languages.size;
  };

  const handleSearch = (query: string) => {
    onSearch(query);
  };

  return (
    <div 
      className={`control-panel transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'} ${isCollapsed ? 'min-w-12' : 'min-w-80'} ${isCollapsed ? 'max-w-12' : 'max-w-80'} overflow-hidden shadow-sm`}
      style={{ 
        backgroundColor: currentTheme.colors.surface,
        borderRight: `1px solid ${currentTheme.colors.border}`
      }}
    >
      {/* Header with collapse toggle */}
      <div 
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4 p-4 border-b`}
        style={{ borderColor: currentTheme.colors.border }}
      >
        {!isCollapsed && <h2 className="text-lg font-semibold" style={{ color: currentTheme.colors.text }}>Lineage Controls</h2>}
        <div className="flex items-center gap-2">
          {!isCollapsed && <Settings className="w-5 h-5" style={{ color: currentTheme.colors.textSecondary }} />}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg transition-all duration-200"
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
            title={isCollapsed ? 'Expand controls panel' : 'Collapse controls panel'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" style={{ color: currentTheme.colors.textSecondary }} />
            ) : (
              <ChevronLeft className="w-4 h-4" style={{ color: currentTheme.colors.textSecondary }} />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      {!isCollapsed ? (
        <div className="p-4 space-y-4">
          {/* Theme Selector */}
          <ThemeSelector />

          {/* Statistics */}
          <div 
            className="mb-4 p-3 rounded-lg"
            style={{ 
              backgroundColor: currentTheme.colors.background,
              border: `1px solid ${currentTheme.colors.border}`
            }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: currentTheme.colors.text }}>Statistics</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3 text-blue-500" />
                <span style={{ color: currentTheme.colors.textSecondary }}>Datasets:</span>
                <span className="font-semibold" style={{ color: currentTheme.colors.text }}>{graph?.datasets?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-green-500" />
                <span style={{ color: currentTheme.colors.textSecondary }}>Jobs:</span>
                <span className="font-semibold" style={{ color: currentTheme.colors.text }}>{graph?.jobs?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-purple-500" />
                <span style={{ color: currentTheme.colors.textSecondary }}>Transforms:</span>
                <span className="font-semibold" style={{ color: currentTheme.colors.text }}>{graph?.transforms?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Code className="w-3 h-3 text-yellow-500" />
                <span style={{ color: currentTheme.colors.textSecondary }}>Languages:</span>
                <span className="font-semibold" style={{ color: currentTheme.colors.text }}>{getLanguageCount()}</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <AutocompleteSearch
              onSearch={handleSearch}
              graph={graph}
              placeholder="Search datasets, jobs, or columns..."
            />
          </div>

          {/* Context-sensitive controls based on active tab */}
          {activeTab === 'graph' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: currentTheme.colors.text }}>
                  <Workflow className="w-4 h-4 inline mr-1" style={{ color: currentTheme.colors.primary }} />
                  Main Graph Layout
                </label>
              <div className="space-y-3">
                {/* Node Spacing */}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentTheme.colors.textSecondary }}>
                    Node Spacing: {layoutParams.nodeSpacing}px
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    value={layoutParams.nodeSpacing}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      console.log('🔧 Node Spacing changed to:', newValue);
                      console.log('🔧 Current layoutParams:', layoutParams);
                      console.log('🔧 onLayoutParamsChange function:', onLayoutParamsChange);
                      onLayoutParamsChange?.({ ...layoutParams, nodeSpacing: newValue });
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ 
                      backgroundColor: currentTheme.colors.border,
                      accentColor: currentTheme.colors.primary
                    }}
                  />
                </div>
                
                {/* Level Spacing */}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: currentTheme.colors.textSecondary }}>
                    Level Spacing: {layoutParams.levelSpacing}px
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="800"
                    step="20"
                    value={layoutParams.levelSpacing}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      console.log('🔧 Level Spacing changed to:', newValue);
                      onLayoutParamsChange?.({ ...layoutParams, levelSpacing: newValue });
                    }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ 
                      backgroundColor: currentTheme.colors.border,
                      accentColor: currentTheme.colors.primary
                    }}
                  />
                </div>
                
                
                {/* Force Layout Parameters */}
                {layoutAlgorithm === 'force' && (
                  <>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: currentTheme.colors.textSecondary }}>
                        Iterations: {layoutParams.iterations}
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="300"
                        step="10"
                        value={layoutParams.iterations}
                        onChange={(e) => onLayoutParamsChange?.({ ...layoutParams, iterations: parseInt(e.target.value) })}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ 
                      backgroundColor: currentTheme.colors.border,
                      accentColor: currentTheme.colors.primary
                    }}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: currentTheme.colors.textSecondary }}>
                        Damping: {layoutParams.damping}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={layoutParams.damping}
                        onChange={(e) => onLayoutParamsChange?.({ ...layoutParams, damping: parseFloat(e.target.value) })}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ 
                      backgroundColor: currentTheme.colors.border,
                      accentColor: currentTheme.colors.primary
                    }}
                      />
                    </div>
                  </>
                )}
              </div>
              </div>

              {/* Layout Controls */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: currentTheme.colors.text }}>
                  Layout Algorithm
                </label>
                <div className="grid grid-cols-2 gap-1 mb-3" data-testid="layout-selector">
                  {(['hierarchical', 'circular', 'grid', 'force', 'flow', 'dag', 'sugiyama', 'manual'] as LayoutAlgorithm[]).map((algo) => (
                    <button
                      key={algo}
                      data-testid={`layout-option-${algo}`}
                      onClick={() => {
                        console.log('🔧 ControlPanel: Layout button clicked:', algo);
                        onLayoutChange?.(algo);
                      }}
                      className="px-2 py-1 text-xs rounded transition-colors cursor-pointer"
                      style={{
                        backgroundColor: layoutAlgorithm === algo ? currentTheme.colors.primary : currentTheme.colors.background,
                        color: layoutAlgorithm === algo ? currentTheme.colors.text : currentTheme.colors.textSecondary,
                        border: `1px solid ${currentTheme.colors.border}`
                      }}
                      onMouseEnter={(e) => {
                        if (layoutAlgorithm !== algo) {
                          e.currentTarget.style.backgroundColor = currentTheme.colors.border;
                          e.currentTarget.style.color = currentTheme.colors.text;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (layoutAlgorithm !== algo) {
                          e.currentTarget.style.backgroundColor = currentTheme.colors.background;
                          e.currentTarget.style.color = currentTheme.colors.textSecondary;
                        }
                      }}
                    >
                      {algo.charAt(0).toUpperCase() + algo.slice(1)}
                    </button>
                  ))}
                </div>
                
              </div>
            </div>
          )}


        </div>
      ) : (
        /* Collapsed state - clean minimal view with hover hint */
        <div className="p-2 flex flex-col items-center space-y-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center group transition-colors"
            style={{ backgroundColor: currentTheme.colors.background }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.colors.border;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = currentTheme.colors.background;
            }}
          >
            <Settings className="w-4 h-4" style={{ color: currentTheme.colors.textSecondary }} />
          </div>
          <ThemeSelector isCollapsed={true} />
        </div>
      )}
    </div>
  );
};

export default ControlPanel;

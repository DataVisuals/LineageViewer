import React from 'react';
import { Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Database, Cpu, BarChart3, Code, GitBranch, Workflow } from 'lucide-react';
import { ViewMode } from '../types/lineage';
import AutocompleteSearch from './AutocompleteSearch';
import ThemeSelector from './ThemeSelector';

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
  onApplyLayout?: () => void;
  onFitView?: () => void;
  onRandomize?: () => void;
  edgeLength?: number;
  onEdgeLengthChange?: (length: number) => void;
  layoutParams?: {
    nodeSpacing?: number;
    levelSpacing?: number;
    iterations?: number;
    damping?: number;
  };
  onLayoutParamsChange?: (params: any) => void;
  activeTab?: 'graph' | 'browser' | 'columns';
  // Column lineage specific props
  columnLayout?: 'dagre' | 'hierarchical' | 'circular' | 'grid';
  onColumnLayoutChange?: (layout: 'dagre' | 'hierarchical' | 'circular' | 'grid') => void;
  showTransformNodes?: boolean;
  onShowTransformNodesChange?: (show: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  viewMode,
  onViewModeChange,
  onSearch,
  onFilter,
  graph,
  layoutAlgorithm = 'dag',
  onLayoutChange,
  onApplyLayout,
  onFitView,
  onRandomize,
  edgeLength = 150,
  onEdgeLengthChange,
  layoutParams = { nodeSpacing: 100, levelSpacing: 150, iterations: 150, damping: 0.7 },
  onLayoutParamsChange,
  activeTab = 'graph',
  columnLayout = 'dagre',
  onColumnLayoutChange,
  showTransformNodes = true,
  onShowTransformNodesChange,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isTransformTypesExpanded, setIsTransformTypesExpanded] = React.useState(false);

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
    <div className={`control-panel transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'} ${isCollapsed ? 'min-w-12' : 'min-w-80'} ${isCollapsed ? 'max-w-12' : 'max-w-80'} overflow-hidden bg-white border-r border-secondary-200 shadow-sm`}>
      {/* Header with collapse toggle */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4 p-4 border-b border-secondary-200`}>
        {!isCollapsed && <h2 className="text-lg font-semibold text-secondary-900">Lineage Controls</h2>}
        <div className="flex items-center gap-2">
          {!isCollapsed && <Settings className="w-5 h-5 text-secondary-500" />}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isCollapsed 
                ? 'hover:bg-secondary-100 hover:shadow-sm' 
                : 'hover:bg-secondary-100 hover:shadow-sm'
            }`}
            title={isCollapsed ? 'Expand controls panel' : 'Collapse controls panel'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-secondary-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-secondary-600" />
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
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Statistics</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600">Datasets:</span>
                <span className="font-semibold">{graph?.datasets?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-green-500" />
                <span className="text-gray-600">Jobs:</span>
                <span className="font-semibold">{graph?.jobs?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-purple-500" />
                <span className="text-gray-600">Transforms:</span>
                <span className="font-semibold">{graph?.transforms?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Code className="w-3 h-3 text-yellow-500" />
                <span className="text-gray-600">Languages:</span>
                <span className="font-semibold">{getLanguageCount()}</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <AutocompleteSearch
              onSearch={handleSearch}
              graph={graph}
              placeholder={
                activeTab === 'columns' 
                  ? "Search columns and transforms..." 
                  : "Search datasets, jobs, or columns..."
              }
            />
          </div>

          {/* Context-sensitive controls based on active tab */}
          {activeTab === 'graph' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-secondary-700 mb-2 block">
                  <Workflow className="w-4 h-4 inline mr-1" />
                  Main Graph Layout
                </label>
                <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                  💡 Adjust parameters below, then click "Re-apply" to update the layout
                </div>
              <div className="space-y-3">
                {/* Node Spacing */}
                <div>
                  <label className="text-xs text-secondary-600 mb-1 block">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                {/* Level Spacing */}
                <div>
                  <label className="text-xs text-secondary-600 mb-1 block">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                
                {/* Force Layout Parameters */}
                {layoutAlgorithm === 'force' && (
                  <>
                    <div>
                      <label className="text-xs text-secondary-600 mb-1 block">
                        Iterations: {layoutParams.iterations}
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="300"
                        step="10"
                        value={layoutParams.iterations}
                        onChange={(e) => onLayoutParamsChange?.({ ...layoutParams, iterations: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-secondary-600 mb-1 block">
                        Damping: {layoutParams.damping}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={layoutParams.damping}
                        onChange={(e) => onLayoutParamsChange?.({ ...layoutParams, damping: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>
              </div>

              {/* Layout Controls */}
              <div>
                <label className="text-sm font-medium text-secondary-700 mb-2 block">
                  Layout Algorithm
                </label>
                <div className="grid grid-cols-2 gap-1 mb-3">
                  {(['hierarchical', 'circular', 'grid', 'force', 'flow', 'dag', 'sugiyama', 'manual'] as LayoutAlgorithm[]).map((algo) => (
                    <button
                      key={algo}
                      onClick={() => {
                        console.log('🔧 ControlPanel: Layout button clicked:', algo);
                        onLayoutChange?.(algo);
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                        layoutAlgorithm === algo
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {algo.charAt(0).toUpperCase() + algo.slice(1)}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      console.log('🔧 ControlPanel: Re-apply button clicked');
                      onApplyLayout?.();
                    }}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors cursor-pointer"
                    title="Re-apply current layout"
                  >
                    Re-apply
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔧 ControlPanel: Fit View button clicked');
                      onFitView?.();
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    Fit View
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔧 ControlPanel: Randomize button clicked');
                      onRandomize?.();
                    }}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors cursor-pointer"
                  >
                    Randomize
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Column Lineage Controls */}
          {activeTab === 'columns' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-secondary-700 mb-2 block">
                  <GitBranch className="w-4 h-4 inline mr-1" />
                  Column Lineage Layout
                </label>
                <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                  💡 Choose layout algorithm for column lineage visualization
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-secondary-700 mb-2 block">
                      Layout Algorithm
                    </label>
                    <div className="grid grid-cols-2 gap-1 mb-3">
                      {(['dagre', 'hierarchical', 'circular', 'grid'] as const).map((layout) => (
                        <button
                          key={layout}
                          onClick={() => {
                            console.log('🔧 ControlPanel: Column layout button clicked:', layout);
                            onColumnLayoutChange?.(layout);
                          }}
                          className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                            columnLayout === layout
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {layout.charAt(0).toUpperCase() + layout.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={showTransformNodes}
                        onChange={(e) => {
                          console.log('🔧 ControlPanel: Show transform nodes changed:', e.target.checked);
                          onShowTransformNodesChange?.(e.target.checked);
                        }}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-secondary-600">Show Transform Nodes</span>
                    </label>
                    <div className="text-xs text-gray-500 mt-1">
                      Toggle intermediate transform nodes in the graph
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


            {/* Transform Types - Collapsible Sub-panel */}
            <div className="pt-4 border-t border-secondary-200">
              <button
                onClick={() => setIsTransformTypesExpanded(!isTransformTypesExpanded)}
                className="flex items-center justify-between w-full text-sm font-medium text-secondary-700 hover:text-secondary-900 transition-colors"
              >
                <span>Transform Types</span>
                {isTransformTypesExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {isTransformTypesExpanded && (
                <div className="mt-3 space-y-2">
                  {[
                    'SPARK_OPERATION',
                    'PANDAS_OPERATION',
                    'SQL_OPERATION',
                    'AGGREGATION',
                    'STRING_FUNCTION',
                    'TYPE_CONVERSION',
                  ].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                        defaultChecked
                      />
                      <span className="ml-2 text-sm text-secondary-600">{type}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed state - clean minimal view with hover hint */
        <div className="p-2 flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center group hover:bg-secondary-200 transition-colors">
            <Settings className="w-4 h-4 text-secondary-600 group-hover:text-secondary-800" />
          </div>
          <ThemeSelector isCollapsed={true} />
        </div>
      )}
    </div>
  );
};

export default ControlPanel;

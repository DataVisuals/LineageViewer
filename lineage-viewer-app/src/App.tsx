import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Workflow, Database } from 'lucide-react';
import CytoscapeLineageGraph from './components/CytoscapeLineageGraph';
import ControlPanel from './components/ControlPanel';
import DataBrowser from './components/DataBrowser';
import { marquezApi } from './services/marquezApi';
import { ViewMode } from './types/lineage';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Debug: Check what's being imported
console.log('🔧 App.tsx - marquezApi imported:', marquezApi);

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { currentTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>({
    showColumns: true,
    showTransforms: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'graph' | 'browser'>('graph');
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<'hierarchical' | 'circular' | 'grid' | 'force' | 'flow' | 'dag' | 'sugiyama' | 'manual'>('dag');
  const [edgeLength, setEdgeLength] = useState(100); // Default to shorter edges
  const [layoutParams, setLayoutParams] = useState({
    nodeSpacing: 100,
    levelSpacing: 150,
    iterations: 150,
    damping: 0.7
  });


  const { data: graph, isLoading, error } = useQuery({
    queryKey: ['lineage-graph'],
    queryFn: async () => {
      console.log('🔄 React Query: Starting data fetch...');
      console.log('🚨 TEST: React Query is working!');
      console.log('🚨 TEST: Current time:', new Date().toISOString());
      const result = await marquezApi.getLineageGraph();
      console.log('✅ React Query: Data fetched successfully:', result);
      console.log('📊 Graph nodes:', result?.nodes?.length || 0);
      console.log('📊 Graph edges:', result?.edges?.length || 0);
      console.log('📊 Graph jobs:', result?.jobs?.length || 0);
      console.log('📊 Graph datasets:', result?.datasets?.length || 0);
      console.log('📊 Graph transforms:', result?.transforms?.length || 0);
      return result;
    },
    refetchInterval: false, // Disable automatic refetching
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Debug logging - moved to individual API methods

  const handleViewModeChange = (mode: Partial<ViewMode>) => {
    setViewMode(prev => ({ ...prev, ...mode }));
  };

  const handleSearch = (query: string) => {
    console.log('🔍 Search query:', query);
    setSearchQuery(query);
  };

  const handleEdgeLengthChange = (length: number) => {
    console.log('📏 Edge length changed to:', length);
    setEdgeLength(length);
  };

  const handleLayoutParamsChange = (params: any) => {
    console.log('🔧 App.tsx: Layout parameters changed:', params);
    console.log('🔧 App.tsx: Previous layoutParams:', layoutParams);
    setLayoutParams(params);
    console.log('🔧 App.tsx: setLayoutParams called');
  };


  // Add highlighting to graph data based on search query
  const highlightedGraph = React.useMemo(() => {
    if (!graph) {
      return graph;
    }

    if (!searchQuery.trim()) {
      // Remove any existing highlighting
      return {
        ...graph,
        nodes: graph.nodes?.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            highlighted: false
          }
        })) || []
      };
    }

    const query = searchQuery.toLowerCase();
    console.log('🔍 Highlighting graph with query:', query);

    const highlightedNodes = graph.nodes?.map((node: any) => {
      const nodeData = node.data?.data;
      let isHighlighted = false;

      if (nodeData) {
        // Search in dataset names
        if (nodeData.name && nodeData.name.toLowerCase().includes(query)) {
          isHighlighted = true;
        }

        // Search in job names
        if (nodeData.type === 'job' && nodeData.name && nodeData.name.toLowerCase().includes(query)) {
          isHighlighted = true;
        }

        // Search in column names
        if (nodeData.columns) {
          const matchingColumns = nodeData.columns.filter((col: any) => 
            col.name && col.name.toLowerCase().includes(query)
          );
          if (matchingColumns.length > 0) {
            isHighlighted = true;
          }
        }

        // Search in transform names
        if (nodeData.transforms) {
          const matchingTransforms = nodeData.transforms.filter((transform: any) => 
            transform.name && transform.name.toLowerCase().includes(query)
          );
          if (matchingTransforms.length > 0) {
            isHighlighted = true;
          }
        }
      }

      return {
        ...node,
        data: {
          ...node.data,
          highlighted: isHighlighted
        }
      };
    }) || [];

    console.log('🔍 Highlighted results:', {
      totalNodes: highlightedNodes.length,
      highlightedCount: highlightedNodes.filter(n => n.data.highlighted).length
    });

    return {
      ...graph,
      nodes: highlightedNodes
    };
  }, [graph, searchQuery]);

  const handleNodeClick = (nodeId: string) => {
    console.log('Node clicked:', nodeId);
  };

  const handleLayoutChange = (algorithm: typeof layoutAlgorithm) => {
    console.log('🔧 App: Layout changed to:', algorithm);
    setLayoutAlgorithm(algorithm);
  };

  const handleApplyLayout = () => {
    console.log('🔧 App: Apply layout requested');
    // The LineageGraph component will handle this
  };

  const handleFitView = () => {
    console.log('🔧 App: Fit view requested');
    // The LineageGraph component will handle this
  };

  const handleRandomize = () => {
    console.log('🔧 App: Randomize requested');
    // The LineageGraph component will handle this
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: currentTheme.colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: currentTheme.colors.primary }}></div>
          <p style={{ color: currentTheme.colors.textSecondary }}>Loading lineage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: currentTheme.colors.background }}>
        <div className="text-center">
          <div className="mb-4" style={{ color: currentTheme.colors.error }}>
            <Database className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold" style={{ color: currentTheme.colors.text }}>Failed to load lineage data</p>
            <p className="text-sm mt-2" style={{ color: currentTheme.colors.textSecondary }}>
              Make sure Marquez is running on http://localhost:8080
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: currentTheme.colors.background }}>
      {/* Compact Header */}
      <header 
        className="shadow-lg"
        style={{ 
          backgroundColor: currentTheme.colors.surface,
          borderBottom: `1px solid ${currentTheme.colors.border}`
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-3">
              <div 
                className="rounded-lg p-2"
                style={{ 
                  backgroundColor: currentTheme.colors.background,
                  border: `1px solid ${currentTheme.colors.border}`
                }}
              >
                <Workflow 
                  className="w-6 h-6" 
                  style={{ 
                    color: currentTheme.colors.primary,
                    strokeWidth: 2
                  }} 
                />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: currentTheme.colors.text }}>Data Lineage Viewer</h1>
                <p className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>OpenLineage-powered visualization</p>
              </div>
            </div>
            
            {/* Right side - Search and Stats */}
            <div className="flex items-center gap-4">
              {searchQuery && (
                <div 
                  className="flex items-center gap-2 text-xs px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: currentTheme.colors.background,
                    border: `1px solid ${currentTheme.colors.border}`,
                    color: currentTheme.colors.text
                  }}
                >
                  <span>Search: "{searchQuery}"</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ color: currentTheme.colors.textSecondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = currentTheme.colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = currentTheme.colors.textSecondary;
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Control Panel */}
        <div className="border-r overflow-y-auto" style={{ backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }}>
          <ControlPanel
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onSearch={handleSearch}
            onFilter={() => {}}
            graph={highlightedGraph || graph}
            layoutAlgorithm={layoutAlgorithm}
            onLayoutChange={handleLayoutChange}
            onApplyLayout={handleApplyLayout}
            onFitView={handleFitView}
            onRandomize={handleRandomize}
            edgeLength={edgeLength}
            onEdgeLengthChange={handleEdgeLengthChange}
            layoutParams={layoutParams}
            onLayoutParamsChange={handleLayoutParamsChange}
            activeTab={activeTab}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b" style={{ backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }}>
            <div className="flex">
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-4 py-2 text-sm font-medium border-b-2`}
                style={{
                  borderBottomColor: activeTab === 'graph' ? currentTheme.colors.primary : 'transparent',
                  color: activeTab === 'graph' ? currentTheme.colors.primary : currentTheme.colors.textSecondary
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'graph') {
                    e.currentTarget.style.color = currentTheme.colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'graph') {
                    e.currentTarget.style.color = currentTheme.colors.textSecondary;
                  }
                }}
              >
                <Workflow className="w-4 h-4 inline mr-2" />
                Lineage Graph
              </button>
              <button
                onClick={() => setActiveTab('browser')}
                className={`px-4 py-2 text-sm font-medium border-b-2`}
                style={{
                  borderBottomColor: activeTab === 'browser' ? currentTheme.colors.primary : 'transparent',
                  color: activeTab === 'browser' ? currentTheme.colors.primary : currentTheme.colors.textSecondary
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'browser') {
                    e.currentTarget.style.color = currentTheme.colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'browser') {
                    e.currentTarget.style.color = currentTheme.colors.textSecondary;
                  }
                }}
              >
                <Database className="w-4 h-4 inline mr-2" />
                Data Browser
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 relative">
            {activeTab === 'graph' && highlightedGraph && highlightedGraph.nodes && highlightedGraph.edges && (
              <CytoscapeLineageGraph
                key={`graph-${layoutAlgorithm}`}
                graph={highlightedGraph}
                viewMode={viewMode}
                searchQuery={searchQuery}
                layoutAlgorithm={layoutAlgorithm}
                edgeLength={edgeLength}
                layoutParams={layoutParams}
                onNodeClick={(nodeId) => console.log('Node clicked:', nodeId)}
                onApplyLayout={handleApplyLayout}
                onFitView={handleFitView}
                onRandomize={handleRandomize}
              />
            )}
            {activeTab === 'browser' && highlightedGraph && (
              <DataBrowser
                jobs={highlightedGraph.jobs || []}
                datasets={highlightedGraph.datasets || []}
                transforms={highlightedGraph.transforms || []}
                onNodeClick={handleNodeClick}
              />
            )}
            {searchQuery && highlightedGraph && (!highlightedGraph.nodes || highlightedGraph.nodes.length === 0) && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-4" style={{ color: currentTheme.colors.textSecondary }} />
                  <p className="text-lg font-semibold" style={{ color: currentTheme.colors.text }}>No results found</p>
                  <p className="text-sm mt-2" style={{ color: currentTheme.colors.textSecondary }}>
                    No datasets, jobs, or transforms match "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 rounded-md transition-colors"
                    style={{ backgroundColor: currentTheme.colors.primary, color: currentTheme.colors.text }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.colors.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.colors.primary;
                    }}
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'browser' && !graph && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-4" style={{ color: currentTheme.colors.textSecondary }} />
                  <p style={{ color: currentTheme.colors.textSecondary }}>Loading data...</p>
                </div>
              </div>
            )}
            {activeTab === 'graph' && (!graph || !graph.nodes || !graph.edges) && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Workflow className="w-12 h-12 mx-auto mb-4" style={{ color: currentTheme.colors.textSecondary }} />
                  <p style={{ color: currentTheme.colors.textSecondary }}>No graph data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
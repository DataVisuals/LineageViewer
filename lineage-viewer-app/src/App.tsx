import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Workflow, Database, GitBranch } from 'lucide-react';
import CytoscapeLineageGraph from './components/CytoscapeLineageGraph';
import ControlPanel from './components/ControlPanel';
import ColumnTracer from './components/ColumnTracer';
import DataBrowser from './components/DataBrowser';
import ColumnLineageGraph from './components/ColumnLineageGraph';
import { marquezApi } from './services/marquezApi';
import { ViewMode, ColumnTransform } from './types/lineage';

// Debug: Check what's being imported
console.log('🔧 App.tsx - marquezApi imported:', marquezApi);

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>({
    showColumns: true,
    showTransforms: true,
  });
  const [selectedColumn, setSelectedColumn] = useState<ColumnTransform | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'graph' | 'browser' | 'columns'>('graph');
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
    // Find the column if it's a column-level click
    if (nodeId.includes('.')) {
      const [datasetId, columnName] = nodeId.split('.');
      const node = graph?.nodes?.find((n: any) => n.id === datasetId);
      if (node && node.data.type === 'dataset') {
        const column = (node.data.data as any).columns?.find((c: any) => c.name === columnName);
        if (column) {
          setSelectedColumn(column);
        }
      }
    }
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
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading lineage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Database className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Failed to load lineage data</p>
            <p className="text-sm text-secondary-600 mt-2">
              Make sure Marquez is running on http://localhost:8080
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Compact Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                <Workflow className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Data Lineage Viewer</h1>
                <p className="text-blue-100 text-xs">OpenLineage-powered visualization</p>
              </div>
            </div>
            
            {/* Right side - Search and Stats */}
            <div className="flex items-center gap-4">
              {searchQuery && (
                <div className="flex items-center gap-2 text-xs text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span>Search: "{searchQuery}"</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-white/80 hover:text-white"
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
        <div className="bg-white border-r border-secondary-200 overflow-y-auto">
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
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-secondary-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'graph'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-600 hover:text-secondary-900'
                }`}
              >
                <Workflow className="w-4 h-4 inline mr-2" />
                Lineage Graph
              </button>
              <button
                onClick={() => setActiveTab('browser')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'browser'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-600 hover:text-secondary-900'
                }`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                Data Browser
              </button>
              <button
                onClick={() => setActiveTab('columns')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'columns'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-600 hover:text-secondary-900'
                }`}
              >
                <GitBranch className="w-4 h-4 inline mr-2" />
                Column Lineage
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
            {activeTab === 'columns' && highlightedGraph && (
              <ColumnLineageGraph
                graph={highlightedGraph}
                selectedColumn={selectedColumn?.id}
                onColumnSelect={(columnKey) => {
                  console.log('Column selected:', columnKey);
                  // Find the column transform by the column key
                  const [namespace, dataset, field] = columnKey.split('.');
                  const transform = highlightedGraph.transforms?.find(t => 
                    t.inputFields.some(f => f.namespace === namespace && f.name === dataset && f.field === field) ||
                    t.outputField === field
                  );
                  if (transform) {
                    setSelectedColumn(transform);
                  }
                }}
                onTransformSelect={(transform) => {
                  console.log('Transform selected:', transform);
                  setSelectedColumn(transform);
                }}
              />
            )}
            {searchQuery && highlightedGraph && (!highlightedGraph.nodes || highlightedGraph.nodes.length === 0) && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Database className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
                  <p className="text-lg font-semibold text-secondary-600">No results found</p>
                  <p className="text-sm text-secondary-500 mt-2">
                    No datasets, jobs, or transforms match "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'browser' && !graph && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Database className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-600">Loading data...</p>
                </div>
              </div>
            )}
            {activeTab === 'graph' && (!graph || !graph.nodes || !graph.edges) && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Workflow className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-600">No graph data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column Tracer Modal */}
      {selectedColumn && (
        <ColumnTracer
          selectedColumn={selectedColumn}
          onClose={() => setSelectedColumn(undefined)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
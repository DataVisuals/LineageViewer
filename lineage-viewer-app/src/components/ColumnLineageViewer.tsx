import React, { useState, useMemo } from 'react';
import { LineageGraph, ColumnTransform, ColumnLineage } from '../types/lineage';

interface ColumnLineageViewerProps {
  graph: LineageGraph;
  selectedColumn?: string;
  onColumnSelect?: (column: string) => void;
}

interface ColumnFlow {
  column: string;
  dataset: string;
  namespace: string;
  transformations: Array<{
    transform: ColumnTransform;
    lineage: ColumnLineage;
  }>;
}

const ColumnLineageViewer: React.FC<ColumnLineageViewerProps> = ({
  graph,
  selectedColumn,
  onColumnSelect
}) => {
  const [expandedTransforms, setExpandedTransforms] = useState<Set<string>>(new Set());

  // Build column flow mapping
  const columnFlows = useMemo(() => {
    const flows: Map<string, ColumnFlow> = new Map();

    // Process all transforms to build column lineage
    graph.transforms.forEach(transform => {
      if (transform.columnLineage) {
        transform.columnLineage.forEach(lineage => {
          const inputKey = `${lineage.inputField.namespace}.${lineage.inputField.name}.${lineage.inputField.field}`;
          const outputKey = `${lineage.outputField.namespace}.${lineage.outputField.name}.${lineage.outputField.field}`;

          // Add input column flow
          if (!flows.has(inputKey)) {
            flows.set(inputKey, {
              column: lineage.inputField.field,
              dataset: lineage.inputField.name,
              namespace: lineage.inputField.namespace,
              transformations: []
            });
          }

          // Add output column flow
          if (!flows.has(outputKey)) {
            flows.set(outputKey, {
              column: lineage.outputField.field,
              dataset: lineage.outputField.name,
              namespace: lineage.outputField.name,
              transformations: []
            });
          }

          // Add transformation to input column
          const inputFlow = flows.get(inputKey)!;
          inputFlow.transformations.push({
            transform,
            lineage
          });
        });
      }
    });

    return Array.from(flows.values());
  }, [graph.transforms]);

  // Get transformations for a specific column
  const getColumnTransformations = (columnKey: string) => {
    return columnFlows.find(flow => 
      `${flow.namespace}.${flow.dataset}.${flow.column}` === columnKey
    )?.transformations || [];
  };

  // Get downstream columns for a specific column
  const getDownstreamColumns = (columnKey: string) => {
    const transformations = getColumnTransformations(columnKey);
    return transformations.map(t => 
      `${t.lineage.outputField.namespace}.${t.lineage.outputField.name}.${t.lineage.outputField.field}`
    );
  };

  // Get upstream columns for a specific column
  const getUpstreamColumns = (columnKey: string) => {
    const upstream: string[] = [];
    columnFlows.forEach(flow => {
      const flowKey = `${flow.namespace}.${flow.dataset}.${flow.column}`;
      const transformations = flow.transformations;
      const hasDownstream = transformations.some(t => 
        `${t.lineage.outputField.namespace}.${t.lineage.outputField.name}.${t.lineage.outputField.field}` === columnKey
      );
      if (hasDownstream) {
        upstream.push(flowKey);
      }
    });
    return upstream;
  };

  const toggleTransformExpansion = (transformId: string) => {
    const newExpanded = new Set(expandedTransforms);
    if (newExpanded.has(transformId)) {
      newExpanded.delete(transformId);
    } else {
      newExpanded.add(transformId);
    }
    setExpandedTransforms(newExpanded);
  };

  const getTransformTypeColor = (transformType: string) => {
    switch (transformType) {
      case 'DIRECT_COPY':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AGGREGATION':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CALCULATION':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CONDITIONAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'JOIN':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'FILTER':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Column-Level Lineage</h2>
        <p className="text-gray-600">
          Track how individual columns flow through your data pipeline, showing transformations from source to destination.
        </p>
      </div>

      {columnFlows.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">No Column Lineage Data</div>
          <p className="text-gray-500">Column-level lineage information will appear here when available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {columnFlows.map((flow, index) => {
            const flowKey = `${flow.namespace}.${flow.dataset}.${flow.column}`;
            const isSelected = selectedColumn === flowKey;
            const transformations = flow.transformations;
            const downstreamColumns = getDownstreamColumns(flowKey);
            const upstreamColumns = getUpstreamColumns(flowKey);

            return (
              <div
                key={flowKey}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => onColumnSelect?.(flowKey)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {flow.column}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {flow.namespace}.{flow.dataset}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {upstreamColumns.length > 0 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {upstreamColumns.length} upstream
                      </span>
                    )}
                    {downstreamColumns.length > 0 && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                        {downstreamColumns.length} downstream
                      </span>
                    )}
                  </div>
                </div>

                {/* Transformations */}
                {transformations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Transformations ({transformations.length})
                    </h4>
                    {transformations.map(({ transform, lineage }, transformIndex) => {
                      const isExpanded = expandedTransforms.has(transform.id);
                      
                      return (
                        <div
                          key={`${transform.id}-${transformIndex}`}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 text-xs rounded-full border ${getTransformTypeColor(lineage.transformType)}`}>
                                {lineage.transformType}
                              </span>
                              <span className="text-sm font-medium text-gray-700">
                                {transform.name}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTransformExpansion(transform.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          </div>

                          {/* Column Flow */}
                          <div className="mt-3 flex items-center space-x-2 text-sm">
                            <div className="flex items-center space-x-1 text-red-600">
                              <span className="font-medium">FROM:</span>
                              <span className="font-mono">
                                {lineage.inputField.namespace}.{lineage.inputField.name}.{lineage.inputField.field}
                              </span>
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="flex items-center space-x-1 text-green-600">
                              <span className="font-medium">TO:</span>
                              <span className="font-mono">
                                {lineage.outputField.namespace}.{lineage.outputField.name}.{lineage.outputField.field}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-4 space-y-3">
                              <div>
                                <h5 className="text-xs font-medium text-gray-600 mb-1">Description</h5>
                                <p className="text-sm text-gray-700">{lineage.description}</p>
                              </div>
                              
                              {lineage.sql && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-600 mb-1">SQL</h5>
                                  <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded border overflow-x-auto">
                                    {lineage.sql}
                                  </pre>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="font-medium text-gray-600">Transform ID:</span>
                                  <span className="ml-1 text-gray-700">{transform.id}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Language:</span>
                                  <span className="ml-1 text-gray-700">{transform.language || 'Unknown'}</span>
                                </div>
                                {transform.sourceFile && (
                                  <div className="col-span-2">
                                    <span className="font-medium text-gray-600">Source File:</span>
                                    <span className="ml-1 text-gray-700">{transform.sourceFile}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upstream/Downstream Columns */}
                {(upstreamColumns.length > 0 || downstreamColumns.length > 0) && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {upstreamColumns.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-600 mb-2">Upstream Columns</h5>
                        <div className="space-y-1">
                          {upstreamColumns.map(columnKey => (
                            <div
                              key={columnKey}
                              className="text-xs text-red-600 font-mono cursor-pointer hover:bg-red-50 p-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                onColumnSelect?.(columnKey);
                              }}
                            >
                              {columnKey}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {downstreamColumns.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-600 mb-2">Downstream Columns</h5>
                        <div className="space-y-1">
                          {downstreamColumns.map(columnKey => (
                            <div
                              key={columnKey}
                              className="text-xs text-green-600 font-mono cursor-pointer hover:bg-green-50 p-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                onColumnSelect?.(columnKey);
                              }}
                            >
                              {columnKey}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ColumnLineageViewer;

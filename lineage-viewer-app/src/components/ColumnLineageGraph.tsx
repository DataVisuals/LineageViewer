import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { LineageGraph, ColumnTransform, ColumnLineage } from '../types/lineage';
import { useTheme } from '../contexts/ThemeContext';

// Register the dagre layout
cytoscape.use(dagre);

interface ColumnLineageGraphProps {
  graph: LineageGraph;
  selectedColumn?: string;
  onColumnSelect?: (column: string) => void;
  onTransformSelect?: (transform: ColumnTransform) => void;
  layout?: 'dagre' | 'hierarchical' | 'circular' | 'grid';
  showTransformNodes?: boolean;
}

interface ColumnNode {
  id: string;
  name: string;
  dataset: string;
  namespace: string;
  type: 'column' | 'transform';
  transform?: ColumnTransform;
  lineage?: ColumnLineage;
}

const ColumnLineageGraph: React.FC<ColumnLineageGraphProps> = ({
  graph,
  selectedColumn,
  onColumnSelect,
  onTransformSelect,
  layout = 'dagre',
  showTransformNodes = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { currentTheme } = useTheme();
  
  // Tooltip state - same as main lineage graph
  const tooltipRef = useRef<HTMLElement | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerElementRef = useRef<HTMLElement | null>(null);
  const mouseLeaveHandlerRef = useRef<(() => void) | null>(null);

  // Build column lineage graph data
  const buildColumnGraph = useCallback(() => {
    const nodes: ColumnNode[] = [];
    const edges: Array<{ source: string; target: string; transform?: ColumnTransform; lineage?: ColumnLineage }> = [];
    const nodeMap = new Map<string, ColumnNode>();

    // Process all transforms to build column lineage
    graph.transforms.forEach(transform => {
      if (transform.columnLineage) {
        transform.columnLineage.forEach(lineage => {
          const inputKey = `${lineage.inputField.namespace}.${lineage.inputField.name}.${lineage.inputField.field}`;
          const outputKey = `${lineage.outputField.namespace}.${lineage.outputField.name}.${lineage.outputField.field}`;

          // Add input column node
          if (!nodeMap.has(inputKey)) {
            const inputNode: ColumnNode = {
              id: inputKey,
              name: lineage.inputField.field,
              dataset: lineage.inputField.name,
              namespace: lineage.inputField.namespace,
              type: 'column'
            };
            nodes.push(inputNode);
            nodeMap.set(inputKey, inputNode);
          }

          // Add output column node
          if (!nodeMap.has(outputKey)) {
            const outputNode: ColumnNode = {
              id: outputKey,
              name: lineage.outputField.field,
              dataset: lineage.outputField.name,
              namespace: lineage.outputField.namespace,
              type: 'column'
            };
            nodes.push(outputNode);
            nodeMap.set(outputKey, outputNode);
          }

          if (showTransformNodes) {
            // Add transform node
            const transformNodeId = `transform_${transform.id}_${lineage.inputField.field}_${lineage.outputField.field}`;
            const transformNode: ColumnNode = {
              id: transformNodeId,
              name: `${lineage.transformType}: ${transform.name}`,
              dataset: transform.dataset || 'transform',
              namespace: 'transform',
              type: 'transform',
              transform,
              lineage
            };
            nodes.push(transformNode);
            nodeMap.set(transformNodeId, transformNode);

            // Add edges: input -> transform -> output
            edges.push({
              source: inputKey,
              target: transformNodeId,
              transform,
              lineage
            });
            edges.push({
              source: transformNodeId,
              target: outputKey,
              transform,
              lineage
            });
          } else {
            // Direct edge from input to output
            edges.push({
              source: inputKey,
              target: outputKey,
              transform,
              lineage
            });
          }
        });
      }
    });

    return { nodes, edges };
  }, [graph.transforms, showTransformNodes]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const { nodes, edges } = buildColumnGraph();

    if (nodes.length === 0) {
      return;
    }

    // Clear existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Create Cytoscape instance
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map(node => ({
          data: {
            id: node.id,
            label: node.name,
            type: node.type,
            dataset: node.dataset,
            namespace: node.namespace,
            transform: node.transform,
            lineage: node.lineage,
            fullId: `${node.namespace}.${node.dataset}.${node.name}`
          }
        })),
        ...edges.map(edge => ({
          data: {
            id: `${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            transform: edge.transform,
            lineage: edge.lineage,
            transformType: edge.lineage?.transformType || 'UNKNOWN'
          }
        }))
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => {
              if (ele.data('highlighted')) return currentTheme.cytoscape.node.column.selected.background;
              const type = ele.data('type');
              switch (type) {
                case 'column':
                  return currentTheme.cytoscape.node.column.background;
                case 'transform':
                  return currentTheme.cytoscape.node.transform.background;
                default:
                  return currentTheme.colors.surface;
              }
            },
            'border-color': (ele: any) => {
              if (ele.data('highlighted')) return currentTheme.colors.accent;
              const type = ele.data('type');
              switch (type) {
                case 'column':
                  return currentTheme.cytoscape.node.column.border;
                case 'transform':
                  return currentTheme.cytoscape.node.transform.border;
                default:
                  return currentTheme.colors.border;
              }
            },
            'border-width': 2,
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': currentTheme.colors.text,
            'font-size': '12px',
            'font-weight': 'bold',
            'width': (ele: any) => {
              const type = ele.data('type');
              return type === 'column' ? '120px' : '140px';
            },
            'height': (ele: any) => {
              const type = ele.data('type');
              return type === 'column' ? '50px' : '60px';
            },
            'shape': (ele: any) => {
              const type = ele.data('type');
              return type === 'column' ? 'ellipse' : 'round-rectangle';
            },
            'text-wrap': 'wrap',
            'text-max-width': (ele: any) => {
              const type = ele.data('type');
              return type === 'column' ? '100px' : '120px';
            },
            'padding': '6px',
            'text-outline-width': 0,
            'text-outline-color': 'transparent',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': (ele: any) => {
              const transformType = ele.data('transformType');
              switch (transformType) {
                case 'DIRECT_COPY': return 2;
                case 'AGGREGATION': return 4;
                case 'CALCULATION': return 3;
                case 'CONDITIONAL': return 3;
                default: return 3;
              }
            },
            'line-color': (ele: any) => {
              const transformType = ele.data('transformType');
              switch (transformType) {
                case 'DIRECT_COPY': return currentTheme.cytoscape.edge.directCopy;
                case 'AGGREGATION': return currentTheme.cytoscape.edge.aggregation;
                case 'CALCULATION': return currentTheme.cytoscape.edge.calculation;
                case 'CONDITIONAL': return currentTheme.cytoscape.edge.conditional;
                case 'JOIN': return currentTheme.cytoscape.edge.join;
                case 'FILTER': return currentTheme.cytoscape.edge.filter;
                default: return currentTheme.cytoscape.edge.default;
              }
            },
            'target-arrow-color': (ele: any) => {
              const transformType = ele.data('transformType');
              switch (transformType) {
                case 'DIRECT_COPY': return currentTheme.cytoscape.edge.directCopy;
                case 'AGGREGATION': return currentTheme.cytoscape.edge.aggregation;
                case 'CALCULATION': return currentTheme.cytoscape.edge.calculation;
                case 'CONDITIONAL': return currentTheme.cytoscape.edge.conditional;
                case 'JOIN': return currentTheme.cytoscape.edge.join;
                case 'FILTER': return currentTheme.cytoscape.edge.filter;
                default: return currentTheme.cytoscape.edge.default;
              }
            },
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.8,
            'line-cap': 'round',
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': currentTheme.colors.error,
            'target-arrow-color': currentTheme.colors.error,
            'opacity': 1,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': currentTheme.colors.primary,
            'background-color': (ele: any) => {
              const type = ele.data('type');
              switch (type) {
                case 'column':
                  return currentTheme.cytoscape.node.column.selected.background;
                case 'transform':
                  return currentTheme.cytoscape.node.transform.selected.background;
                default:
                  return currentTheme.colors.surface;
              }
            },
            'font-size': '13px',
            'font-weight': 'bold',
          },
        }
      ],
      layout: {
        name: layout,
        ...(layout === 'dagre' ? {
          rankDir: 'TB',
          nodeSep: 50,
          rankSep: 100
        } : layout === 'hierarchical' ? {
          direction: 'TB',
          nodeSep: 50,
          rankSep: 100
        } : layout === 'circular' ? {
          radius: 200
        } : {})
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
      selectionType: 'single'
    });

    // Add event listeners
    cyRef.current.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeData = node.data();
      
      if (nodeData.type === 'column') {
        onColumnSelect?.(nodeData.fullId);
      } else if (nodeData.type === 'transform' && nodeData.transform) {
        onTransformSelect?.(nodeData.transform);
      }
    });

    // Add tooltip functionality - same as main lineage graph
    cyRef.current?.on('mouseover', 'node', (event) => {
      console.log('🔍 Column Lineage: Mouse over node event triggered!');
      
      // Clear any pending tooltip removal
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
      
      // Remove existing tooltip if any
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
        cyRef.current!.off('zoom pan');
      }
      
      // Add a small delay before showing tooltip to prevent flickering
      tooltipTimeoutRef.current = setTimeout(() => {
        const node = event.target;
        const data = node.data();
        console.log('🔍 Column Lineage: Node data extracted:', data);
      
        // Create tooltip element
        tooltipRef.current = document.createElement('div');
        tooltipRef.current.className = 'cytoscape-tooltip';
        tooltipRef.current.style.cssText = `
          position: absolute;
          background: ${currentTheme.cytoscape.tooltip.background};
          color: ${currentTheme.cytoscape.tooltip.text};
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          max-width: 300px;
          z-index: 1000;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border: 1px solid ${currentTheme.cytoscape.tooltip.border};
        `;

        // Build tooltip content
        let content = `<div style="font-weight: bold; margin-bottom: 12px; color: ${currentTheme.cytoscape.tooltip.accent}; font-size: 16px;">${data.label}</div>`;
      
        // Basic Information Section
        content += `<div style="margin-bottom: 12px; padding: 8px; background: ${currentTheme.colors.surface}; border-radius: 6px;">`;
        content += `<div style="color: ${currentTheme.colors.text}; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Basic Information</div>`;
        
        content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Type:</strong> ${data.type || 'Unknown'}</div>`;
        
        if (data.fullId) {
          content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Full ID:</strong> ${data.fullId}</div>`;
        }
        
        if (data.dataset) {
          content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Dataset:</strong> ${data.dataset}</div>`;
        }
        
        if (data.namespace) {
          content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Namespace:</strong> ${data.namespace}</div>`;
        }
        
        content += `</div>`;
        
        // Column Information Section (for columns)
        if (data.type === 'column') {
          content += `<div style="margin-bottom: 12px; padding: 8px; background: ${currentTheme.colors.surface}; border-radius: 6px;">`;
          content += `<div style="color: ${currentTheme.colors.text}; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Column Information</div>`;
          content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Field Name:</strong> ${data.label}</div>`;
          content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Dataset:</strong> ${data.dataset}</div>`;
          content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Namespace:</strong> ${data.namespace}</div>`;
          content += `</div>`;
        }
        
        // Transform Information Section (for transforms)
        if (data.type === 'transform') {
          const transform = data.transform;
          const lineage = data.lineage;
          
          content += `<div style="margin-bottom: 12px; padding: 8px; background: ${currentTheme.colors.surface}; border-radius: 6px;">`;
          content += `<div style="color: ${currentTheme.colors.text}; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Transform Information</div>`;
          
          if (transform?.name) {
            content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Transform Name:</strong> ${transform.name}</div>`;
          }
          
          if (lineage?.transformType) {
            content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Transform Type:</strong> ${lineage.transformType}</div>`;
          }
          
          if (lineage?.description) {
            content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Description:</strong> ${lineage.description}</div>`;
          }
          
          if (transform?.language) {
            content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Language:</strong> ${transform.language}</div>`;
          }
          
          if (transform?.sourceFile) {
            content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Source File:</strong> ${transform.sourceFile}</div>`;
          }
          
          // Show SQL if available
          if (lineage?.sql) {
            content += `<div style="margin-top: 8px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>SQL:</strong></div>`;
            const sqlPreview = lineage.sql.length > 200 ? lineage.sql.substring(0, 200) + '...' : lineage.sql;
            content += `<div style="margin-top: 4px; color: ${currentTheme.colors.text}; font-size: 9px; font-family: monospace; background: ${currentTheme.colors.background}; padding: 6px; border-radius: 4px; white-space: pre-wrap; border-left: 3px solid ${currentTheme.colors.success};">${sqlPreview}</div>`;
          }
          
          content += `</div>`;
        }

        tooltipRef.current.innerHTML = content;
        document.body.appendChild(tooltipRef.current);

        // Position tooltip
        const updateTooltipPosition = () => {
          if (tooltipRef.current) {
            const pos = node.renderedPosition();
            const containerRect = containerRef.current!.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            
            let left = containerRect.left + pos.x + 20;
            let top = containerRect.top + pos.y - tooltipRect.height / 2;
            
            // Keep tooltip within viewport
            if (left + tooltipRect.width > window.innerWidth) {
              left = containerRect.left + pos.x - tooltipRect.width - 20;
            }
            if (top < 0) {
              top = containerRect.top + pos.y + 20;
            }
            if (top + tooltipRect.height > window.innerHeight) {
              top = window.innerHeight - tooltipRect.height - 20;
            }
            
            tooltipRef.current.style.left = `${left}px`;
            tooltipRef.current.style.top = `${top}px`;
          }
        };

        updateTooltipPosition();
        
        // Update position on zoom/pan
        if (cyRef.current) {
          cyRef.current.on('zoom pan', updateTooltipPosition);
        }
      }, 200); // 200ms delay before showing tooltip
    });

    // Use a timeout to handle tooltip removal more reliably
    const removeTooltip = () => {
      if (tooltipRef.current) {
        console.log('🔍 Column Lineage: Removing tooltip');
        tooltipRef.current.remove();
        tooltipRef.current = null;
        if (cyRef.current) {
          cyRef.current.off('zoom pan');
        }
      }
    };

    cyRef.current?.on('mouseout', 'node', () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
      tooltipTimeoutRef.current = setTimeout(() => {
        removeTooltip();
      }, 150);
    });

    // Add mouse leave handler to container
    containerElementRef.current = containerRef.current;
    if (containerElementRef.current) {
      mouseLeaveHandlerRef.current = () => {
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
          tooltipTimeoutRef.current = null;
        }
        removeTooltip();
      };
      containerElementRef.current.addEventListener('mouseleave', mouseLeaveHandlerRef.current);
    }

    // Fit to view
    cyRef.current.fit();

    // Cleanup function
    return () => {
      // Clean up tooltip
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
      
      // Remove container event listener
      if (containerElementRef.current && mouseLeaveHandlerRef.current) {
        containerElementRef.current.removeEventListener('mouseleave', mouseLeaveHandlerRef.current);
      }
      
      // Destroy Cytoscape instance
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [buildColumnGraph, selectedColumn, layout, onColumnSelect, onTransformSelect]);

  // Update layout when it changes
  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.layout({
        name: layout,
        ...(layout === 'dagre' ? {
          rankDir: 'TB',
          nodeSep: 50,
          rankSep: 100
        } : layout === 'hierarchical' ? {
          direction: 'TB',
          nodeSep: 50,
          rankSep: 100
        } : layout === 'circular' ? {
          radius: 200
        } : {})
      }).run();
    }
  }, [layout]);


  const { nodes } = buildColumnGraph();
  const columnCount = nodes.filter(n => n.type === 'column').length;
  const transformCount = nodes.filter(n => n.type === 'transform').length;

  return (
    <div className="h-full flex flex-col">
      {/* Graph Container */}
      <div className="flex-1 relative">
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">No Column Lineage Data</div>
              <p className="text-gray-500">Column-level lineage information will appear here when available.</p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border-t border-gray-200 p-3">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Columns</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-gray-600">Transforms</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">Direct Copy</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-0.5 bg-purple-500"></div>
            <span className="text-gray-600">Aggregation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-0.5 bg-green-500"></div>
            <span className="text-gray-600">Calculation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-0.5 bg-amber-500"></div>
            <span className="text-gray-600">Conditional</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnLineageGraph;

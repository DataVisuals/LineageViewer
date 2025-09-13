import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { LineageGraph as LineageGraphType, ViewMode, LayoutAlgorithm } from '../types/lineage';

// Import and register dagre extension
const dagre = require('cytoscape-dagre');
cytoscape.use(dagre);

interface CytoscapeLineageGraphProps {
  graph: LineageGraphType | null;
  viewMode: ViewMode;
  searchQuery: string;
  layoutAlgorithm: LayoutAlgorithm;
  edgeLength: number;
  layoutParams: {
    nodeSpacing: number;
    levelSpacing: number;
    iterations: number;
    damping: number;
  };
  onNodeClick?: (nodeId: string) => void;
  onApplyLayout?: () => void;
  onFitView?: () => void;
  onRandomize?: () => void;
}

const CytoscapeLineageGraph: React.FC<CytoscapeLineageGraphProps> = ({
  graph,
  viewMode,
  searchQuery,
  layoutAlgorithm,
  edgeLength,
  layoutParams,
  onNodeClick,
  onApplyLayout,
  onFitView,
  onRandomize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  // Convert graph data to Cytoscape format
  const cytoscapeData = useMemo(() => {
    if (!graph?.nodes || !graph?.edges) return { nodes: [], edges: [] };

    const nodes = graph.nodes.map((node: any) => {
      // Extract full dataset name but remove common prefix (like data_pipeline)
      const fullId = node.id;
      const parts = fullId.split('.');
      
      // Common prefixes to remove
      const commonPrefixes = ['data_pipeline', 'pipeline', 'data'];
      
      let datasetName;
      let prefix = '';
      
      // Check if the first part is a common prefix
      if (parts.length > 1 && commonPrefixes.includes(parts[0])) {
        prefix = parts[0];
        datasetName = parts.slice(1).join('.'); // Remove prefix, keep rest
      } else {
        // No common prefix found, use full name
        datasetName = fullId;
      }
      
      return {
        data: {
          id: node.id,
          label: datasetName, // Show dataset name with common prefix removed
          prefix: prefix,
          fullId: fullId,
          fullLabel: node.data?.name || node.id,
          type: node.data?.type || 'dataset',
          highlighted: node.data?.highlighted || false,
          ...node.data,
        },
        position: node.position || { x: 0, y: 0 },
      };
    });

    // Create a set of valid node IDs for validation
    const validNodeIds = new Set(nodes.map(node => node.data.id));
    console.log('🔧 Cytoscape: Valid node IDs:', Array.from(validNodeIds));

    // Filter edges to only include those with valid source and target nodes
    const validEdges = graph.edges.filter((edge: any) => {
      const sourceExists = validNodeIds.has(edge.source);
      const targetExists = validNodeIds.has(edge.target);
      
      if (!sourceExists) {
        console.warn('🔧 Cytoscape: Edge source node not found:', edge.source);
      }
      if (!targetExists) {
        console.warn('🔧 Cytoscape: Edge target node not found:', edge.target);
      }
      
      return sourceExists && targetExists;
    });

    console.log('🔧 Cytoscape: Total edges:', graph.edges.length, 'Valid edges:', validEdges.length);

    const edges = validEdges.map((edge: any) => ({
      data: {
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'table',
      },
    }));

    return { nodes, edges };
  }, [graph]);

  // Tooltip state - moved outside useEffect to be accessible in cleanup
  const tooltipRef = useRef<HTMLElement | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerElementRef = useRef<HTMLElement | null>(null);
  const mouseLeaveHandlerRef = useRef<(() => void) | null>(null);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || !cytoscapeData.nodes.length) return;

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Create new Cytoscape instance
    console.log('🔧 Cytoscape: Creating instance with', cytoscapeData.nodes.length, 'nodes and', cytoscapeData.edges.length, 'edges');
    
    try {
      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: [...cytoscapeData.nodes, ...cytoscapeData.edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => {
              if (ele.data('highlighted')) return '#fef3c7';
              const type = ele.data('type');
              switch (type) {
                case 'dataset':
                  return '#eff6ff'; // Light blue background
                case 'job':
                  return '#ecfdf5'; // Light green background
                case 'transform':
                  return '#fffbeb'; // Light amber background
                default:
                  return '#f9fafb'; // Light gray background
              }
            },
            'border-color': (ele: any) => {
              if (ele.data('highlighted')) return '#f59e0b';
              const type = ele.data('type');
              switch (type) {
                case 'dataset':
                  return '#3b82f6'; // Blue border
                case 'job':
                  return '#10b981'; // Green border
                case 'transform':
                  return '#f59e0b'; // Amber border
                default:
                  return '#6b7280'; // Gray border
              }
            },
            'border-width': 2,
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#1f2937', // Dark gray/black text
            'font-size': '12px',
            'font-weight': 'bold',
            'width': 200,
            'height': 60,
            'shape': 'round-rectangle',
            'text-wrap': 'wrap',
            'text-max-width': '180px',
            'padding': '6px',
            'text-outline-width': 0,
            'text-outline-color': 'transparent',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#6b7280',
            'target-arrow-color': '#6b7280',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.8,
            'line-cap': 'round',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#ef4444',
            'border-width': 3,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'opacity': 1,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#6366f1',
            'background-color': (ele: any) => {
              const type = ele.data('type');
              switch (type) {
                case 'dataset':
                  return '#dbeafe'; // Darker blue on selection
                case 'job':
                  return '#d1fae5'; // Darker green on selection
                case 'transform':
                  return '#fef3c7'; // Darker amber on selection
                default:
                  return '#f3f4f6'; // Darker gray on selection
              }
            },
            'font-size': '13px',
            'font-weight': 'bold',
          },
        },
      ],
      layout: {
        name: 'preset',
        positions: (node: any) => node.position(),
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
      selectionType: 'single',
    });

    // Add event listeners
    cyRef.current?.on('tap', 'node', (event) => {
      const nodeId = event.target.id();
      console.log('🔧 Cytoscape: Node clicked:', nodeId);
      onNodeClick?.(nodeId);
    });

    // Add tooltip functionality

    cyRef.current?.on('mouseover', 'node', (event) => {
      console.log('🔍 Mouse over node event triggered!');
      
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
        console.log('🔍 Node data extracted:', data);
      
        // Create tooltip element
        tooltipRef.current = document.createElement('div');
        tooltipRef.current.className = 'cytoscape-tooltip';
        tooltipRef.current.style.cssText = `
          position: absolute;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          max-width: 300px;
          z-index: 1000;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border: 1px solid #374151;
        `;

        // Debug: Log the data being used for tooltip
        console.log('🔍 Tooltip data for node:', data.id, data);
        console.log('🔍 Full node data structure:', JSON.stringify(data, null, 2));
        console.log('🔍 Dataset fields:', data.fields);
        console.log('🔍 Job facets:', data.facets);
        console.log('🔍 Data type:', data.type);
        console.log('🔍 Data.data:', data.data);
      
        // Build tooltip content organized like Data Browser
        let content = `<div style="font-weight: bold; margin-bottom: 12px; color: #fbbf24; font-size: 16px;">${data.label}</div>`;
      
      // Basic Information Section
      content += `<div style="margin-bottom: 12px; padding: 8px; background: #1f2937; border-radius: 6px;">`;
      content += `<div style="color: #e5e7eb; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Basic Information</div>`;
      
      content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Type:</strong> ${data.type || 'Unknown'}</div>`;
      
      if (data.fullId) {
        content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Full ID:</strong> ${data.fullId}</div>`;
      }
      
      if (data.description) {
        content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Description:</strong> ${data.description}</div>`;
      }
      
      if (data.createdAt) {
        content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Created:</strong> ${new Date(data.createdAt).toLocaleString()}</div>`;
      }
      
      if (data.updatedAt) {
        content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Updated:</strong> ${new Date(data.updatedAt).toLocaleString()}</div>`;
      }
      
      content += `</div>`;
      
      // Dataset Information Section (for datasets)
      if (data.type === 'dataset') {
        const datasetData = data.data; // Get the actual dataset data
        content += `<div style="margin-bottom: 12px; padding: 8px; background: #1f2937; border-radius: 6px;">`;
        content += `<div style="color: #e5e7eb; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Dataset Information</div>`;
        
        if (datasetData?.dataset) {
          content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Parent Dataset:</strong> ${datasetData.dataset}</div>`;
        }
        
        // Show schema fields with types and descriptions
        if (datasetData?.fields && datasetData.fields.length > 0) {
          content += `<div style="margin-bottom: 6px; color: #9ca3af; font-size: 11px;"><strong>Fields (${datasetData.fields.length}):</strong></div>`;
          if (datasetData.fields.length <= 10) {
            datasetData.fields.forEach((field: any, index: number) => {
              const fieldName = field.name || field.fieldName || field;
              const fieldType = field.type || field.dataType || 'unknown';
              const fieldDescription = field.description || '';
              content += `<div style="margin-bottom: 4px; color: #6b7280; font-size: 10px; padding-left: 8px;">`;
              content += `• <strong>${fieldName}</strong> <span style="color: #9ca3af;">(${fieldType})</span>`;
              if (fieldDescription) {
                content += `<br><span style="color: #6b7280; font-style: italic; padding-left: 12px;">${fieldDescription}</span>`;
              }
              content += `</div>`;
            });
          } else {
            content += `<div style="margin-bottom: 4px; color: #6b7280; font-size: 10px;">Too many fields to display</div>`;
          }
        }
        
        // Show column lineage information if available
        if (datasetData?.facets && datasetData.facets.columnLineage) {
          const lineage = datasetData.facets.columnLineage;
          if (lineage.fields && Object.keys(lineage.fields).length > 0) {
            const fieldNames = Object.keys(lineage.fields);
            content += `<div style="margin-bottom: 6px; color: #9ca3af; font-size: 11px;"><strong>Column Lineage (${fieldNames.length}):</strong></div>`;
            if (fieldNames.length <= 10) {
              fieldNames.forEach((fieldName: string) => {
                const fieldData = lineage.fields[fieldName];
                const transformType = fieldData.transformationType || 'transform';
                content += `<div style="margin-bottom: 2px; color: #6b7280; font-size: 10px; padding-left: 8px;">• ${fieldName} <span style="color: #9ca3af;">(${transformType})</span></div>`;
              });
            } else {
              content += `<div style="margin-bottom: 4px; color: #6b7280; font-size: 10px;">Too many lineage fields to display</div>`;
            }
          }
        }
        
        content += `</div>`;
      }
      
      // Job Information Section (for jobs)
      if (data.type === 'job') {
        const jobData = data.data; // Get the actual job data
        content += `<div style="margin-bottom: 12px; padding: 8px; background: #1f2937; border-radius: 6px;">`;
        content += `<div style="color: #e5e7eb; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Job Information</div>`;
        
        if (jobData?.jobId) {
          content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Job ID:</strong> ${jobData.jobId}</div>`;
        }
        
        if (jobData?.namespace && jobData?.name) {
          content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Full Name:</strong> ${jobData.namespace}.${jobData.name}</div>`;
        }
        
        if (jobData?.language) {
          content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Language:</strong> ${jobData.language}</div>`;
        }
        
        if (jobData?.sourceFile) {
          content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Source File:</strong> ${jobData.sourceFile}</div>`;
        }
        
        if (jobData?.owner) {
          content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Owner:</strong> ${jobData.owner}</div>`;
        }
        
        if (jobData?.tags && jobData.tags.length > 0) {
          content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Tags:</strong> ${jobData.tags.join(', ')}</div>`;
        }
        
        // Show source code if available
        if (jobData?.facets && jobData.facets.sourceCode) {
          const sourceCode = jobData.facets.sourceCode;
          const language = sourceCode.language || 'unknown';
          const code = sourceCode.source || sourceCode.code || '';
          
          if (code) {
            content += `<div style="margin-top: 8px; color: #9ca3af; font-size: 11px;"><strong>${language.toUpperCase()} Code:</strong></div>`;
            const codePreview = code.length > 300 ? code.substring(0, 300) + '...' : code;
            content += `<div style="margin-top: 4px; color: #e5e7eb; font-size: 9px; font-family: monospace; background: #374151; padding: 6px; border-radius: 4px; white-space: pre-wrap; border-left: 3px solid #3b82f6;">${codePreview}</div>`;
          }
        }
        
        // Show SQL if available in facets
        if (jobData?.facets && jobData.facets.sql) {
          const sql = jobData.facets.sql;
          const sqlCode = sql.source || sql.code || sql.query || sql.statement || sql;
          
          if (sqlCode) {
            content += `<div style="margin-top: 8px; color: #9ca3af; font-size: 11px;"><strong>SQL:</strong></div>`;
            const sqlPreview = sqlCode.length > 300 ? sqlCode.substring(0, 300) + '...' : sqlCode;
            content += `<div style="margin-top: 4px; color: #e5e7eb; font-size: 9px; font-family: monospace; background: #374151; padding: 6px; border-radius: 4px; white-space: pre-wrap; border-left: 3px solid #10b981;">${sqlPreview}</div>`;
          }
        }
        
        // Show Python code if available in facets
        if (jobData?.facets && jobData.facets.pythonCode) {
          const pythonCode = jobData.facets.pythonCode;
          const code = pythonCode.source || pythonCode.code || pythonCode.script || pythonCode;
          
          if (code) {
            content += `<div style="margin-top: 8px; color: #9ca3af; font-size: 11px;"><strong>Python Code:</strong></div>`;
            const codePreview = code.length > 300 ? code.substring(0, 300) + '...' : code;
            content += `<div style="margin-top: 4px; color: #e5e7eb; font-size: 9px; font-family: monospace; background: #374151; padding: 6px; border-radius: 4px; white-space: pre-wrap; border-left: 3px solid #f59e0b;">${codePreview}</div>`;
          }
        }
        
        content += `</div>`;
      }
      
      // Transform Information Section (for jobs with transforms)
      if (data.type === 'job' && data.data?.transforms && data.data.transforms.length > 0) {
        const jobData = data.data;
        content += `<div style="margin-bottom: 12px; padding: 8px; background: #1f2937; border-radius: 6px;">`;
        content += `<div style="color: #e5e7eb; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Transforms (${jobData.transforms.length})</div>`;
        
        // Group transforms by type
        const transformsByType: { [key: string]: any[] } = {};
        jobData.transforms.forEach((transform: any) => {
          const type = transform.transformType || transform.type || transform.language || 'unknown';
          if (!transformsByType[type]) {
            transformsByType[type] = [];
          }
          transformsByType[type].push(transform);
        });
        
        // Display each transform type as a separate section
        Object.entries(transformsByType).forEach(([type, transforms]) => {
          content += `<div style="margin-bottom: 8px;">`;
          content += `<div style="color: #9ca3af; font-size: 11px; font-weight: bold; margin-bottom: 4px; text-transform: capitalize;">${type} (${transforms.length})</div>`;
          
          transforms.forEach((transform: any, index: number) => {
            content += `<div style="margin-bottom: 6px; padding: 4px; background: #374151; border-radius: 4px;">`;
            content += `<div style="color: #e5e7eb; font-size: 10px; font-weight: bold;">${transform.name || `Transform ${index + 1}`}</div>`;
            
            // Show transform code if available
            const sqlCode = transform.sql || transform.transformation || transform.sqlCode || transform.query || transform.statement;
            const pythonCode = transform.pythonCode || transform.python || transform.code || transform.script;
            const sparkCode = transform.sparkCode || transform.spark || transform.sparkSql || transform.sparkQuery;
            
            if (sqlCode) {
              const sqlPreview = sqlCode.length > 150 ? sqlCode.substring(0, 150) + '...' : sqlCode;
              content += `<div style="margin-top: 4px; color: #6b7280; font-size: 9px; font-family: monospace; background: #1f2937; padding: 3px; border-radius: 3px; white-space: pre-wrap;">${sqlPreview}</div>`;
            }
            
            if (pythonCode) {
              const codePreview = pythonCode.length > 150 ? pythonCode.substring(0, 150) + '...' : pythonCode;
              content += `<div style="margin-top: 4px; color: #6b7280; font-size: 9px; font-family: monospace; background: #1f2937; padding: 3px; border-radius: 3px; white-space: pre-wrap;">${codePreview}</div>`;
            }
            
            if (sparkCode) {
              const sparkPreview = sparkCode.length > 150 ? sparkCode.substring(0, 150) + '...' : sparkCode;
              content += `<div style="margin-top: 4px; color: #6b7280; font-size: 9px; font-family: monospace; background: #1f2937; padding: 3px; border-radius: 3px; white-space: pre-wrap;">${sparkPreview}</div>`;
            }
            
            content += `</div>`;
          });
          
          content += `</div>`;
        });
        
        content += `</div>`;
      }
      
      // Column Lineage Information Section (for transforms with column lineage)
      if (data.type === 'job' && data.data?.transforms) {
        const jobData = data.data;
        const transformsWithLineage = jobData.transforms.filter((transform: any) => 
          transform.columnLineage && transform.columnLineage.length > 0
        );
        
        if (transformsWithLineage.length > 0) {
          content += `<div style="margin-bottom: 12px; padding: 8px; background: #1f2937; border-radius: 6px;">`;
          content += `<div style="color: #e5e7eb; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Column Lineage</div>`;
          
          transformsWithLineage.forEach((transform: any, transformIndex: number) => {
            content += `<div style="margin-bottom: 8px; padding: 6px; background: #374151; border-radius: 4px;">`;
            content += `<div style="color: #fbbf24; font-size: 11px; font-weight: bold; margin-bottom: 4px;">${transform.name || `Transform ${transformIndex + 1}`}</div>`;
            
            transform.columnLineage.forEach((lineage: any, lineageIndex: number) => {
              const inputField = lineage.inputField;
              const outputField = lineage.outputField;
              const transformType = lineage.transformType || 'TRANSFORM';
              const description = lineage.description || '';
              
              content += `<div style="margin-bottom: 4px; padding: 4px; background: #1f2937; border-radius: 3px; border-left: 3px solid #3b82f6;">`;
              
              // Input field
              content += `<div style="color: #ef4444; font-size: 10px; margin-bottom: 2px;">`;
              content += `<strong>FROM:</strong> ${inputField.namespace}.${inputField.name}.${inputField.field}`;
              content += `</div>`;
              
              // Transform type and description
              content += `<div style="color: #fbbf24; font-size: 10px; margin-bottom: 2px;">`;
              content += `<strong>${transformType}:</strong> ${description}`;
              content += `</div>`;
              
              // Output field
              content += `<div style="color: #10b981; font-size: 10px;">`;
              content += `<strong>TO:</strong> ${outputField.namespace}.${outputField.name}.${outputField.field}`;
              content += `</div>`;
              
              // Show SQL if available
              if (lineage.sql) {
                const sqlPreview = lineage.sql.length > 100 ? lineage.sql.substring(0, 100) + '...' : lineage.sql;
                content += `<div style="margin-top: 3px; color: #6b7280; font-size: 9px; font-family: monospace; background: #111827; padding: 3px; border-radius: 2px; white-space: pre-wrap;">${sqlPreview}</div>`;
              }
              
              content += `</div>`;
            });
            
            content += `</div>`;
          });
          
          content += `</div>`;
        }
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
        console.log('🔍 Removing tooltip');
        tooltipRef.current.remove();
        tooltipRef.current = null;
        if (cyRef.current) {
          cyRef.current.off('zoom pan');
        }
      }
    };

    cyRef.current?.on('mouseout', 'node', () => {
      console.log('🔍 Mouse out of node');
      // Clear any existing timeout
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      // Set a small delay before removing tooltip to allow for mouse movement
      tooltipTimeoutRef.current = setTimeout(() => {
        removeTooltip();
      }, 150);
    });

    // Also add a global mouseout to catch cases where we leave the container
    cyRef.current?.on('mouseout', () => {
      console.log('🔍 Mouse out of container');
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      tooltipTimeoutRef.current = setTimeout(() => {
        removeTooltip();
      }, 150);
    });

    // Add mouse leave event to the container to ensure tooltip is removed
    containerElementRef.current = containerRef.current;
    
    if (containerElementRef.current) {
      mouseLeaveHandlerRef.current = () => {
        console.log('🔍 Mouse left container');
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
        }
        removeTooltip();
      };
      containerElementRef.current.addEventListener('mouseleave', mouseLeaveHandlerRef.current);
    }

    // Set zoom limits
    cyRef.current.minZoom(0.1);
    cyRef.current.maxZoom(4);
    
    } catch (error) {
      console.error('🔧 Cytoscape: Error creating instance:', error);
      cyRef.current = null;
    }

    return () => {
      // Clean up tooltip
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
      
      // Clear any pending timeouts
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
      
      // Remove container event listener
      if (containerElementRef.current && mouseLeaveHandlerRef.current) {
        containerElementRef.current.removeEventListener('mouseleave', mouseLeaveHandlerRef.current);
      }
      
      // Destroy cytoscape instance
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [cytoscapeData, onNodeClick]);

  // Apply layout algorithm
  const applyLayout = useCallback((algorithm: LayoutAlgorithm) => {
    if (!cyRef.current) return;

    console.log('🔧 Cytoscape: Applying layout algorithm:', algorithm);
    console.log('🔧 Cytoscape: Parameters:', { edgeLength, layoutParams });

    const layoutOptions: any = {
      name: algorithm,
      animate: true,
      animationDuration: 500,
      fit: true,
      padding: 20,
    };

    // Add algorithm-specific options
    switch (algorithm) {
      case 'hierarchical':
        layoutOptions.name = 'dagre';
        layoutOptions.rankDir = 'LR';
        layoutOptions.nodeSep = layoutParams.nodeSpacing;
        layoutOptions.rankSep = layoutParams.levelSpacing;
        layoutOptions.edgeSep = 10;
        break;

      case 'circular':
        layoutOptions.name = 'circle';
        layoutOptions.radius = Math.min(containerRef.current?.clientWidth || 800, containerRef.current?.clientHeight || 600) / 3;
        layoutOptions.startAngle = 0;
        layoutOptions.sweep = 2 * Math.PI;
        break;

      case 'grid':
        layoutOptions.name = 'grid';
        layoutOptions.rows = Math.ceil(Math.sqrt(cytoscapeData.nodes.length));
        layoutOptions.cols = Math.ceil(cytoscapeData.nodes.length / Math.ceil(Math.sqrt(cytoscapeData.nodes.length)));
        layoutOptions.nodeDimensionsIncludeLabels = true;
        break;

      case 'force':
        layoutOptions.name = 'cose';
        layoutOptions.nodeRepulsion = 4000;
        layoutOptions.idealEdgeLength = edgeLength;
        layoutOptions.edgeElasticity = 0.45;
        layoutOptions.nestingFactor = 0.1;
        layoutOptions.gravity = 0.25;
        layoutOptions.numIter = layoutParams.iterations;
        layoutOptions.initialTemp = 200;
        layoutOptions.coolingFactor = 0.95;
        layoutOptions.minTemp = 1.0;
        break;

      case 'flow':
        layoutOptions.name = 'dagre';
        layoutOptions.rankDir = 'LR';
        layoutOptions.nodeSep = layoutParams.nodeSpacing;
        layoutOptions.rankSep = layoutParams.levelSpacing;
        layoutOptions.edgeSep = 10;
        break;

      case 'dag':
        layoutOptions.name = 'dagre';
        layoutOptions.rankDir = 'TB';
        layoutOptions.nodeSep = layoutParams.nodeSpacing;
        layoutOptions.rankSep = layoutParams.levelSpacing;
        layoutOptions.edgeSep = 10;
        break;

      case 'sugiyama':
        layoutOptions.name = 'dagre';
        layoutOptions.rankDir = 'TB';
        layoutOptions.nodeSep = layoutParams.nodeSpacing;
        layoutOptions.rankSep = layoutParams.levelSpacing;
        layoutOptions.edgeSep = 10;
        layoutOptions.rankSep = layoutParams.levelSpacing * 1.5;
        break;

      case 'manual':
        // Keep current positions
        return;
    }

    // Apply the layout
    const layout = cyRef.current.layout(layoutOptions);
    layout.run();
  }, [edgeLength, layoutParams, cytoscapeData.nodes.length]);

  // Re-apply layout when algorithm changes
  useEffect(() => {
    if (cyRef.current && layoutAlgorithm !== 'manual') {
      applyLayout(layoutAlgorithm);
    }
  }, [layoutAlgorithm, applyLayout]);

  // Handle fit view
  const handleFitView = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50);
    }
  }, []);

  // Handle randomize
  const handleRandomize = useCallback(() => {
    if (cyRef.current) {
      const nodes = cyRef.current.nodes();
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;
      
      nodes.forEach((node: any) => {
        node.position({
          x: Math.random() * width,
          y: Math.random() * height,
        });
      });
      
      cyRef.current.fit(undefined, 50);
    }
  }, []);

  // Expose functions to parent using refs to avoid React Hook warnings
  const onFitViewRef = useRef(onFitView);
  const onRandomizeRef = useRef(onRandomize);
  
  useEffect(() => {
    onFitViewRef.current = handleFitView;
    onRandomizeRef.current = handleRandomize;
  }, [handleFitView, handleRandomize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (cyRef.current) {
        cyRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full relative">
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ 
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

export default CytoscapeLineageGraph;

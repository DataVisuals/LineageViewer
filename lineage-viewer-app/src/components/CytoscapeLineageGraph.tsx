import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import cytoscape from 'cytoscape';
import { LineageGraph as LineageGraphType, ViewMode, LayoutAlgorithm } from '../types/lineage';
import { useTheme } from '../contexts/ThemeContext';

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
}

const CytoscapeLineageGraph: React.FC<CytoscapeLineageGraphProps> = ({
  graph,
  viewMode,
  searchQuery,
  layoutAlgorithm,
  edgeLength,
  layoutParams,
  onNodeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { currentTheme } = useTheme();
  

  // Convert graph data to Cytoscape format
  const cytoscapeData = useMemo(() => {
    if (!graph?.nodes || !graph?.edges) return { nodes: [], edges: [] };

    const nodes = graph.nodes.map((node: any) => {
      const nodeType = node.data?.type || 'dataset';
      let label = node.id;
      
      
      if (nodeType === 'transform') {
        // For transform nodes, use the transform name or type
        label = node.data?.data?.name || node.data?.data?.transformType || 'Transform';
      } else if (nodeType === 'job') {
        // For job nodes, use the job name
        const jobName = node.data?.data?.name || node.id;
        label = jobName; // Main label without icon
      } else {
        // For dataset nodes, extract full dataset name but remove common prefix (like data_pipeline)
        const fullId = node.id;
        const parts = fullId.split('.');
        
        // Common prefixes to remove
        const commonPrefixes = ['data_pipeline', 'pipeline', 'data'];
        
        let datasetName;
        
        // Check if the first part is a common prefix
        if (parts.length > 1 && commonPrefixes.includes(parts[0])) {
          datasetName = parts.slice(1).join('.'); // Remove prefix, keep rest
        } else {
          // No common prefix found, use full name
          datasetName = fullId;
        }
        
        label = datasetName; // Main label without icon
      }
      
      return {
        data: {
          id: node.id,
          label: label,
          fullId: node.id,
          fullLabel: node.data?.data?.name || node.id,
          type: nodeType,
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
  const isTooltipHoveredRef = useRef<boolean>(false);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || !cytoscapeData.nodes.length) return;
    
    // Validate graph data
    if (!cytoscapeData.nodes || cytoscapeData.nodes.length === 0) {
      console.log('🔧 Cytoscape: No nodes available');
      return;
    }
    
    if (!cytoscapeData.edges) {
      console.log('🔧 Cytoscape: No edges available');
      return;
    }

    // Destroy existing instance with error handling
    if (cyRef.current) {
      try {
        if (!cyRef.current.destroyed()) {
          cyRef.current.destroy();
        }
      } catch (error) {
        console.error('Error destroying existing Cytoscape instance:', error);
      }
    }

    // Create new Cytoscape instance
    console.log('🔧 Cytoscape: Creating instance with', cytoscapeData.nodes.length, 'nodes and', cytoscapeData.edges.length, 'edges');
    
    // Check if container exists
    if (!containerRef.current) {
      console.error('🔧 Cytoscape: Container not available');
      return;
    }
    
    try {
      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: [...cytoscapeData.nodes, ...cytoscapeData.edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: any) => {
              if (ele.data('highlighted')) return currentTheme.cytoscape.node.dataset.selected.background;
              const type = ele.data('type');
              
              
              switch (type) {
                case 'dataset':
                  return currentTheme.cytoscape.node.dataset.background;
                case 'job':
                  return currentTheme.cytoscape.node.job.background;
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
                case 'dataset':
                  return currentTheme.cytoscape.node.dataset.border;
                case 'job':
                  return currentTheme.cytoscape.node.job.border;
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
            'font-size': '16px',
            'font-weight': 'bold',
            'width': 240,
            'height': 80,
            'shape': 'round-rectangle',
            'text-wrap': 'wrap',
            'text-max-width': '220px',
            'padding': '6px',
            'text-outline-width': 0,
            'text-outline-color': 'transparent',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': currentTheme.colors.border,
            'target-arrow-color': currentTheme.colors.border,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.8,
            'line-cap': 'round',
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
                case 'dataset':
                  return currentTheme.cytoscape.node.dataset.selected.background;
                case 'job':
                  return currentTheme.cytoscape.node.job.selected.background;
                case 'transform':
                  return currentTheme.cytoscape.node.transform.selected.background;
                default:
                  return currentTheme.colors.surface;
              }
            },
            'font-size': '13px',
            'font-weight': 'bold',
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': currentTheme.colors.error,
            'target-arrow-color': currentTheme.colors.error,
            'opacity': 1,
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
        
        // Reset hover flag for new tooltip
        isTooltipHoveredRef.current = false;
      
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
          pointer-events: auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border: 1px solid ${currentTheme.cytoscape.tooltip.border};
        `;

        // Debug: Log the data being used for tooltip
        console.log('🔍 Tooltip data for node:', data.id, data);
        console.log('🔍 Full node data structure:', JSON.stringify(data, null, 2));
        console.log('🔍 Dataset fields:', data.fields);
        console.log('🔍 Job facets:', data.facets);
        console.log('🔍 Data type:', data.type);
        console.log('🔍 Data.data:', data.data);
      
        // Build tooltip content organized like Data Browser
        let content = `<div style="font-weight: bold; margin-bottom: 12px; color: ${currentTheme.cytoscape.tooltip.accent}; font-size: 16px;">${data.label}</div>`;
      
      // Basic Information Section
      content += `<div style="margin-bottom: 12px; padding: 8px; background: ${currentTheme.colors.surface}; border-radius: 6px;">`;
      content += `<div style="color: ${currentTheme.colors.text}; font-size: 12px; font-weight: bold; margin-bottom: 6px;">Basic Information</div>`;
      
      content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Type:</strong> ${data.type || 'Unknown'}</div>`;
      
      if (data.fullId) {
        content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Full ID:</strong> ${data.fullId}</div>`;
      }
      
      if (data.description) {
        content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Description:</strong> ${data.description}</div>`;
      }
      
      if (data.createdAt) {
        content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Created:</strong> ${new Date(data.createdAt).toLocaleString()}</div>`;
      }
      
      if (data.updatedAt) {
        content += `<div style="margin-bottom: 4px; color: ${currentTheme.colors.textSecondary}; font-size: 11px;"><strong>Updated:</strong> ${new Date(data.updatedAt).toLocaleString()}</div>`;
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
        
        content += `</div>`;
      }
      
      // Job Information Section (for jobs)
      if (data.type === 'job') {
        const jobData = data.data; // Get the actual job data
        
        // Determine job type and get appropriate icon
        const getJobTypeIcon = (jobData: any) => {
          const language = jobData?.facets?.sourceCode?.language || jobData?.language || 'unknown';
          const jobName = jobData?.name || '';
          
          if (language === 'python' || jobName.includes('python')) {
            return '🐍'; // Python icon
          } else if (language === 'spark' || jobName.includes('spark')) {
            return '⚡'; // Spark icon
          } else if (language === 'sql' || jobName.includes('sql')) {
            return '🗃️'; // SQL icon
          } else if (language === 'java' || jobName.includes('java')) {
            return '☕'; // Java icon
          } else if (jobName.includes('dbt')) {
            return '🔧'; // DBT icon
          } else {
            return '⚙️'; // Default gear icon
          }
        };
        
        const jobIcon = getJobTypeIcon(jobData);
        const jobType = jobData?.facets?.sourceCode?.language || jobData?.language || 'unknown';
        
        content += `<div style="margin-bottom: 12px; padding: 8px; background: #1f2937; border-radius: 6px;">`;
        content += `<div style="color: #e5e7eb; font-size: 12px; font-weight: bold; margin-bottom: 6px;">${jobIcon} Job Information (${jobType.toUpperCase()})</div>`;
        
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
          const sourceFileName = jobData.sourceFile;
          const sourceFileContent = `# Source File: ${sourceFileName}

This file contains the source code for the job "${jobData.name || 'Unknown Job'}".

## Job Information:
- Job Name: ${jobData.name || 'Unknown'}
- Namespace: ${jobData.namespace || 'Unknown'}
- Language: ${jobData.language || 'Unknown'}
- Type: ${jobData.type || 'Unknown'}

## File Details:
- File Path: ${sourceFileName}
- Job ID: ${jobData.jobId || 'Unknown'}

Note: This is a reference to the source file. The actual file content is not available in the metadata. To view the complete source code, please access the file directly from your development environment.

## Related Code:
${jobData.facets?.sourceCode?.source || 'No source code available in metadata'}`;
          
          content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Source File:</strong> ${sourceFileName}</div>`;
        }
        
        if (jobData?.owner) {
          content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Owner:</strong> ${jobData.owner}</div>`;
        }
        
        if (jobData?.tags && jobData.tags.length > 0) {
          content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 11px;"><strong>Tags:</strong> ${jobData.tags.join(', ')}</div>`;
        }
        
        // Show source code if available (exclude Python as it's handled separately)
        if (jobData?.facets && jobData.facets.sourceCode) {
          const sourceCode = jobData.facets.sourceCode;
          const language = sourceCode.language || 'unknown';
          const code = sourceCode.source || sourceCode.code || '';
          
          // Skip Python code here as it's handled by the specific Python section below
          if (code && language !== 'python') {
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
        
        // Show Python code if available in facets (prioritize pythonCode, then sourceCode with python language)
        if (jobData?.facets && jobData.facets.pythonCode) {
          const pythonCode = jobData.facets.pythonCode;
          const code = pythonCode.source || pythonCode.code || pythonCode.script || pythonCode;
          
          if (code) {
            content += `<div style="margin-top: 8px; color: #9ca3af; font-size: 11px;"><strong>Python Code:</strong></div>`;
            const codePreview = code.length > 300 ? code.substring(0, 300) + '...' : code;
            content += `<div style="margin-top: 4px; color: #e5e7eb; font-size: 9px; font-family: monospace; background: #374151; padding: 6px; border-radius: 4px; white-space: pre-wrap; border-left: 3px solid #f59e0b;">${codePreview}</div>`;
          }
        } else if (jobData?.facets && jobData.facets.sourceCode && jobData.facets.sourceCode.language === 'python') {
          const pythonCode = jobData.facets.sourceCode;
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
        content += `<div style="color: #e5e7eb; font-size: 12px; font-weight: bold; margin-bottom: 8px;">Column Transformations (${jobData.transforms.length})</div>`;
        
        // Group transforms by type for better organization
        const transformsByType: { [key: string]: any[] } = {};
        jobData.transforms.forEach((transform: any) => {
          const type = transform.transformType || transform.type || 'unknown';
          if (!transformsByType[type]) {
            transformsByType[type] = [];
          }
          transformsByType[type].push(transform);
        });
        
        // Display each transform type as a separate subsection
        Object.entries(transformsByType).forEach(([type, transforms]) => {
          content += `<div style="margin-bottom: 12px;">`;
          content += `<div style="color: #9ca3af; font-size: 11px; font-weight: 600; margin-bottom: 6px; text-transform: capitalize; border-bottom: 1px solid #374151; padding-bottom: 2px;">${type.replace(/_/g, ' ')} (${transforms.length})</div>`;
          
          transforms.forEach((transform: any, index: number) => {
            content += `<div style="margin-bottom: 8px; padding: 6px; background: #374151; border-radius: 4px; border-left: 3px solid #60a5fa;">`;
            
            // Show the actual transformation function/operation
            if (transform.transformation || transform.transform) {
              const transformCode = transform.transformation || transform.transform;
              content += `<div style="color: #e5e7eb; font-size: 11px; font-weight: 600; margin-bottom: 4px; font-family: monospace;">${transformCode}</div>`;
            } else {
              content += `<div style="color: #e5e7eb; font-size: 11px; font-weight: 600; margin-bottom: 4px;">${transform.name || `Transform ${index + 1}`}</div>`;
            }
            
            // Show description if available
            if (transform.description) {
              content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 10px; font-style: italic;">${transform.description}</div>`;
            }
            
            // Show input fields with their transformations
            if (transform.inputFields && transform.inputFields.length > 0) {
              content += `<div style="margin-bottom: 4px; color: #9ca3af; font-size: 10px;"><strong>Input Columns:</strong></div>`;
              transform.inputFields.forEach((field: any) => {
                const fieldName = `${field.namespace}.${field.name}.${field.field}`;
                const transformDesc = field.transformationDescription || field.transformation || 'No transformation details';
                content += `<div style="margin-left: 8px; margin-bottom: 2px; color: #e5e7eb; font-size: 9px; font-family: monospace;">${fieldName}</div>`;
                content += `<div style="margin-left: 12px; margin-bottom: 4px; color: #9ca3af; font-size: 9px;">→ ${transformDesc}</div>`;
              });
            }
            
            // Show output fields if available
            if (transform.outputFields && transform.outputFields.length > 0) {
              content += `<div style="margin-top: 4px; color: #9ca3af; font-size: 10px;"><strong>Output Columns:</strong></div>`;
              transform.outputFields.forEach((field: any) => {
                content += `<div style="margin-left: 8px; color: #e5e7eb; font-size: 9px; font-family: monospace;">${field.name}</div>`;
              });
            }
            
            content += `</div>`;
          });
          
          content += `</div>`;
        });
        
        content += `</div>`;
      }


        tooltipRef.current.innerHTML = content;
        document.body.appendChild(tooltipRef.current);

        // Check if tooltip has clickable elements
        const hasClickableElements = content.includes('onclick=') || content.includes('cursor: pointer');
        
        if (hasClickableElements) {
          // For tooltips with clickable elements, COMPLETELY disable auto-removal
          console.log('🔍 Tooltip has clickable elements - DISABLING ALL auto-removal');
          
          // Set hover flag to true and keep it true
          isTooltipHoveredRef.current = true;
          
          // Add mouse enter handler to tooltip to ensure it stays open
          tooltipRef.current.addEventListener('mouseenter', () => {
            console.log('🔍 Mouse entered tooltip with clickables');
            isTooltipHoveredRef.current = true;
            if (tooltipTimeoutRef.current) {
              clearTimeout(tooltipTimeoutRef.current);
              tooltipTimeoutRef.current = null;
            }
          });

          // Add click handler to prevent tooltip removal when clicking
          tooltipRef.current.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🔍 Tooltip with clickables clicked');
            isTooltipHoveredRef.current = true;
          });

          // Add a close button to the tooltip for manual dismissal
          const closeButton = document.createElement('div');
          closeButton.innerHTML = '×';
          closeButton.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            width: 20px;
            height: 20px;
            background: #374151;
            color: #e5e7eb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            z-index: 1001;
          `;
          closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🔍 Close button clicked');
            removeTooltip();
          });
          tooltipRef.current.appendChild(closeButton);

          // NO mouseleave handler for clickable tooltips - they stay open until manually closed
        } else {
          // For tooltips without clickable elements, use normal behavior
          tooltipRef.current.addEventListener('mouseleave', () => {
            console.log('🔍 Mouse left tooltip');
            isTooltipHoveredRef.current = false;
            if (tooltipTimeoutRef.current) {
              clearTimeout(tooltipTimeoutRef.current);
            }
            tooltipTimeoutRef.current = setTimeout(() => {
              if (!isTooltipHoveredRef.current) {
                removeTooltip();
              }
            }, 200);
          });

          tooltipRef.current.addEventListener('mouseenter', () => {
            console.log('🔍 Mouse entered tooltip');
            isTooltipHoveredRef.current = true;
            if (tooltipTimeoutRef.current) {
              clearTimeout(tooltipTimeoutRef.current);
              tooltipTimeoutRef.current = null;
            }
          });
        }

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
      
      // Check if current tooltip has clickable elements
      const hasClickableElements = tooltipRef.current && (
        tooltipRef.current.innerHTML.includes('onclick=') || 
        tooltipRef.current.innerHTML.includes('cursor: pointer')
      );
      
      if (hasClickableElements) {
        // For tooltips with clickables, DO NOTHING - they stay open until manually closed
        console.log('🔍 Tooltip has clickables - IGNORING mouseout event');
        return;
      } else {
        // For normal tooltips, use normal behavior
        tooltipTimeoutRef.current = setTimeout(() => {
          if (!isTooltipHoveredRef.current) {
            removeTooltip();
          }
        }, 500); // Normal delay for non-clickable tooltips
      }
    });

    // Also add a global mouseout to catch cases where we leave the container
    cyRef.current?.on('mouseout', () => {
      console.log('🔍 Mouse out of container');
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      // Check if current tooltip has clickable elements
      const hasClickableElements = tooltipRef.current && (
        tooltipRef.current.innerHTML.includes('onclick=') || 
        tooltipRef.current.innerHTML.includes('cursor: pointer')
      );
      
      if (hasClickableElements) {
        // For tooltips with clickables, DO NOTHING - they stay open until manually closed
        console.log('🔍 Tooltip has clickables - IGNORING global mouseout event');
        return;
      } else {
        // For normal tooltips, use normal behavior
        tooltipTimeoutRef.current = setTimeout(() => {
          if (!isTooltipHoveredRef.current) {
            removeTooltip();
          }
        }, 200);
      }
    });

    // Add mouse leave event to the container to ensure tooltip is removed
    containerElementRef.current = containerRef.current;
    
    if (containerElementRef.current) {
      mouseLeaveHandlerRef.current = () => {
        console.log('🔍 Mouse left container');
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
        }
        
        // Check if current tooltip has clickable elements
        const hasClickableElements = tooltipRef.current && (
          tooltipRef.current.innerHTML.includes('onclick=') || 
          tooltipRef.current.innerHTML.includes('cursor: pointer')
        );
        
        if (hasClickableElements) {
          // For tooltips with clickables, DO NOTHING - they stay open until manually closed
          console.log('🔍 Tooltip has clickables - IGNORING container mouseleave event');
          return;
        } else {
          // For normal tooltips, use normal behavior
          if (!isTooltipHoveredRef.current) {
            removeTooltip();
          }
        }
      };
      containerElementRef.current.addEventListener('mouseleave', mouseLeaveHandlerRef.current);
    }

    // Set zoom limits with error handling
    try {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.minZoom(0.1);
        cyRef.current.maxZoom(4);
      }
    } catch (error) {
      console.error('Error setting zoom limits:', error);
    }
    
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
      
      // Destroy cytoscape instance with error handling
      if (cyRef.current) {
        try {
          if (!cyRef.current.destroyed()) {
            cyRef.current.destroy();
          }
        } catch (error) {
          console.error('Error destroying Cytoscape instance:', error);
        } finally {
          cyRef.current = null;
        }
      }
    };
  }, [cytoscapeData, onNodeClick, currentTheme]);

  // Apply layout algorithm
  const applyLayout = useCallback((algorithm: LayoutAlgorithm) => {
    if (!cyRef.current || cyRef.current.destroyed()) {
      console.log('🔧 Cytoscape: Instance not available or destroyed');
      return;
    }

    console.log('🔧 Cytoscape: Applying layout algorithm:', algorithm);
    console.log('🔧 Cytoscape: Parameters:', { edgeLength, layoutParams });

    // Check if there are any nodes to layout
    const nodes = cyRef.current.nodes();
    if (!nodes || nodes.length === 0) {
      console.log('🔧 Cytoscape: No nodes to layout');
      return;
    }

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

    // Apply the layout with error handling
    try {
      const layout = cyRef.current.layout(layoutOptions);
      if (layout && typeof layout.run === 'function') {
        layout.run();
      }
    } catch (error) {
      console.error('Error applying layout:', error);
    }
  }, [edgeLength, layoutParams, cytoscapeData.nodes.length]);

  // Re-apply layout when algorithm changes
  useEffect(() => {
    if (cyRef.current && layoutAlgorithm !== 'manual') {
      // Add a small delay to ensure Cytoscape is fully initialized
      const timeoutId = setTimeout(() => {
        if (cyRef.current && !cyRef.current.destroyed()) {
          applyLayout(layoutAlgorithm);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [layoutAlgorithm, applyLayout]);



  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        try {
          cyRef.current.resize();
        } catch (error) {
          console.error('Error resizing Cytoscape:', error);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full relative">
      <div 
        ref={containerRef} 
        data-testid="cytoscape-graph"
        className="w-full h-full"
        style={{ 
          background: currentTheme.colors.background,
          border: `1px solid ${currentTheme.colors.border}`,
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

export default CytoscapeLineageGraph;

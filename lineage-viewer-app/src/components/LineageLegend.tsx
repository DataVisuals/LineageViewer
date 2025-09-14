import React, { useState } from 'react';
import { Database, Workflow, ArrowRight, Info, ChevronUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LineageLegendProps {
  className?: string;
}

const LineageLegend: React.FC<LineageLegendProps> = ({ className = '' }) => {
  const { currentTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const legendItems = [
    {
      type: 'dataset',
      label: 'Dataset',
      description: 'Data tables or files',
      icon: Database,
      color: currentTheme.cytoscape.node.dataset.background,
      borderColor: currentTheme.cytoscape.node.dataset.border,
    },
    {
      type: 'job',
      label: 'Job',
      description: 'Data processing jobs',
      icon: Workflow,
      color: currentTheme.cytoscape.node.job.background,
      borderColor: currentTheme.cytoscape.node.job.border,
    },
  ];

  const edgeTypes = [
    {
      label: 'Data Flow',
      description: 'Shows data movement',
      color: currentTheme.colors.border,
    },
  ];

  return (
    <div 
      className={`absolute top-4 right-4 z-10 ${isCollapsed ? 'w-10 h-10' : 'max-w-xs'} ${className}`}
      style={{
        backgroundColor: currentTheme.colors.surface,
        border: `1px solid ${currentTheme.colors.border}`,
        borderRadius: isCollapsed ? '50%' : '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Header */}
      <div 
        className={`${isCollapsed ? 'w-full h-full flex items-center justify-center' : 'px-3 py-2 border-b'}`}
        style={{ 
          borderColor: currentTheme.colors.border,
          backgroundColor: isCollapsed ? currentTheme.colors.surface : currentTheme.colors.background 
        }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`${isCollapsed ? 'w-full h-full flex items-center justify-center hover:opacity-80 transition-opacity' : 'w-full flex items-center justify-between gap-2 hover:opacity-80 transition-opacity'}`}
        >
          {isCollapsed ? (
            <Info className="w-5 h-5" style={{ color: currentTheme.colors.text }} />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" style={{ color: currentTheme.colors.text }} />
                <h3 
                  className="text-sm font-semibold"
                  style={{ color: currentTheme.colors.text }}
                >
                  Legend
                </h3>
              </div>
              <ChevronUp className="w-3 h-3" style={{ color: currentTheme.colors.textSecondary }} />
            </>
          )}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-3">
          {/* Node Types */}
          <div>
            <h4 
              className="text-xs font-medium mb-2 uppercase tracking-wide"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Node Types
            </h4>
            <div className="space-y-2">
              {legendItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.type} className="flex items-start gap-2">
                    {/* Node Preview */}
                    <div 
                      className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center"
                      style={{
                        backgroundColor: item.color,
                        border: `1px solid ${item.borderColor}`,
                      }}
                    >
                      <IconComponent 
                        className="w-3 h-3" 
                        style={{ color: currentTheme.colors.text }}
                      />
                    </div>
                    
                    {/* Label and Description */}
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-xs font-medium"
                        style={{ color: currentTheme.colors.text }}
                      >
                        {item.label}
                      </div>
                      <div 
                        className="text-xs mt-0.5"
                        style={{ color: currentTheme.colors.textSecondary }}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edge Types */}
          <div>
            <h4 
              className="text-xs font-medium mb-2 uppercase tracking-wide"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Connections
            </h4>
            <div className="space-y-2">
              {edgeTypes.map((edge, index) => (
                <div key={index} className="flex items-center gap-2">
                  {/* Edge Preview */}
                  <div className="flex-shrink-0 flex items-center">
                    <div 
                      className="w-6 h-0.5"
                      style={{ backgroundColor: edge.color }}
                    />
                    <ArrowRight 
                      className="w-2 h-2 ml-1" 
                      style={{ color: edge.color }}
                    />
                  </div>
                  
                  {/* Label and Description */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-xs font-medium"
                      style={{ color: currentTheme.colors.text }}
                    >
                      {edge.label}
                    </div>
                    <div 
                      className="text-xs mt-0.5"
                      style={{ color: currentTheme.colors.textSecondary }}
                    >
                      {edge.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div 
            className="pt-2 border-t"
            style={{ borderColor: currentTheme.colors.border }}
          >
            <div 
              className="text-xs"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              <div className="mb-1">
                <strong>Hover</strong> jobs to see transforms
              </div>
              <div className="mb-1">
                <strong>Click</strong> nodes to view details
              </div>
              <div className="mb-1">
                <strong>Drag</strong> to move nodes
              </div>
              <div>
                <strong>Scroll</strong> to zoom in/out
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineageLegend;

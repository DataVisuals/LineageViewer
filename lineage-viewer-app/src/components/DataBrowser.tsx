import React, { useState } from 'react';
import { Database, Cpu, ChevronDown, ChevronRight, Zap } from 'lucide-react';

interface DataBrowserProps {
  jobs: any[];
  datasets: any[];
  transforms: any[];
  onNodeClick?: (nodeId: string) => void;
}

const TransformItem: React.FC<{ transform: any; onNodeClick?: (nodeId: string) => void }> = ({ transform, onNodeClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasLongTransform = transform.transform && transform.transform.length > 10;
  
  return (
    <div className="border-b border-secondary-100 last:border-b-0 hover:bg-secondary-50">
      <div 
        className="p-3 cursor-pointer"
        onClick={() => onNodeClick?.(transform.id)}
      >
        <div className="font-medium text-sm">{transform.name}</div>
        <div className="text-xs text-secondary-600 mt-1">
          {transform.transformType} • {transform.inputFields?.length || 0} inputs
        </div>
        {transform.description && (
          <div className="text-xs text-secondary-500 mt-1">{transform.description}</div>
        )}
      </div>
      
      {transform.transform && (
        <div className="px-3 pb-3">
          {hasLongTransform ? (
            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="flex items-center gap-1 text-xs text-secondary-600 hover:text-secondary-800 mb-2"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {isExpanded ? 'Hide SQL' : 'Show SQL'}
              </button>
              {isExpanded && (
                <div className="text-xs text-secondary-500 font-mono bg-secondary-100 px-2 py-2 rounded max-h-32 overflow-y-auto">
                  {transform.transform}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-secondary-500 font-mono bg-secondary-100 px-2 py-1 rounded">
              {transform.transform}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DataBrowser: React.FC<DataBrowserProps> = ({ jobs, datasets, transforms, onNodeClick }) => {
  console.log('🔍 DataBrowser received:', { jobs: jobs.length, datasets: datasets.length, transforms: transforms.length });
  console.log('📊 Jobs:', jobs);
  console.log('📊 Datasets:', datasets);
  console.log('📊 Transforms:', transforms);
  
  const [expandedSections, setExpandedSections] = useState({
    jobs: true,
    datasets: true,
    transforms: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4">Data Browser</h3>
      
      {/* Jobs Section */}
      <div className="border border-secondary-200 rounded-lg">
        <button
          onClick={() => toggleSection('jobs')}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary-50"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary-600" />
            <span className="font-medium">Jobs ({jobs.length})</span>
          </div>
          {expandedSections.jobs ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {expandedSections.jobs && (
          <div className="border-t border-secondary-200">
            {jobs.map((job, index) => (
              <div
                key={job.id || index}
                className="p-3 border-b border-secondary-100 last:border-b-0 hover:bg-secondary-50 cursor-pointer"
                onClick={() => onNodeClick?.(job.id)}
              >
                <div className="font-medium text-sm">{job.name}</div>
                <div className="text-xs text-secondary-600 mt-1">
                  {job.type} • {job.inputs?.length || 0} inputs • {job.outputs?.length || 0} outputs
                </div>
                {job.description && (
                  <div className="text-xs text-secondary-500 mt-1">{job.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Datasets Section */}
      <div className="border border-secondary-200 rounded-lg">
        <button
          onClick={() => toggleSection('datasets')}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary-50"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary-600" />
            <span className="font-medium">Datasets ({datasets.length})</span>
          </div>
          {expandedSections.datasets ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {expandedSections.datasets && (
          <div className="border-t border-secondary-200">
            {datasets.map((dataset, index) => (
              <div
                key={dataset.id || index}
                className="p-3 border-b border-secondary-100 last:border-b-0 hover:bg-secondary-50 cursor-pointer"
                onClick={() => onNodeClick?.(dataset.id)}
              >
                <div className="font-medium text-sm">{dataset.name}</div>
                <div className="text-xs text-secondary-600 mt-1">
                  {dataset.type} • {dataset.columns?.length || 0} columns
                </div>
                {dataset.description && (
                  <div className="text-xs text-secondary-500 mt-1">{dataset.description}</div>
                )}
                {dataset.columns && dataset.columns.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-secondary-700 mb-1">Columns:</div>
                    <div className="space-y-1">
                      {dataset.columns.slice(0, 3).map((column: any, colIndex: number) => (
                        <div key={colIndex} className="text-xs text-secondary-600 bg-secondary-100 px-2 py-1 rounded">
                          {column.name} ({column.transformType || 'N/A'})
                        </div>
                      ))}
                      {dataset.columns.length > 3 && (
                        <div className="text-xs text-secondary-500">
                          +{dataset.columns.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transforms Section */}
      <div className="border border-secondary-200 rounded-lg">
        <button
          onClick={() => toggleSection('transforms')}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary-50"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="font-medium">Transforms ({transforms.length})</span>
          </div>
          {expandedSections.transforms ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {expandedSections.transforms && (
          <div className="border-t border-secondary-200">
            {transforms.map((transform, index) => (
              <TransformItem
                key={transform.id || index}
                transform={transform}
                onNodeClick={onNodeClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataBrowser;

import React, { useState } from 'react';
import { ArrowRight, Search, X, Database } from 'lucide-react';
import { ColumnTransform } from '../types/lineage';

interface ColumnTracerProps {
  selectedColumn?: ColumnTransform;
  onClose: () => void;
}

const ColumnTracer: React.FC<ColumnTracerProps> = ({ selectedColumn, onClose }) => {
  const [tracePath, setTracePath] = useState<string[]>([]);
  const [isTracing, setIsTracing] = useState(false);

  const handleTrace = async () => {
    if (!selectedColumn) return;
    
    setIsTracing(true);
    // Simulate tracing logic
    setTimeout(() => {
      setTracePath([
        'raw_customers.email',
        'stg_customers.email',
        'mart_customer_summary.customer_count'
      ]);
      setIsTracing(false);
    }, 1000);
  };

  if (!selectedColumn) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-secondary-900">
            Column Lineage Tracer
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Selected Column Info */}
          <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-primary-900">
                {selectedColumn.name}
              </span>
            </div>
            <div className="text-sm text-primary-700 mb-2">
              Type: {selectedColumn.transformType}
            </div>
            <div className="text-sm text-primary-600">
              {selectedColumn.description}
            </div>
          </div>

          {/* Trace Button */}
          <div className="mb-6">
            <button
              onClick={handleTrace}
              disabled={isTracing}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              {isTracing ? 'Tracing...' : 'Trace to Source'}
            </button>
          </div>

          {/* Trace Path */}
          {tracePath.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-secondary-900">Lineage Path</h3>
              <div className="space-y-2">
                {tracePath.map((step, index) => {
                  const [dataset, column] = step.split('.');
                  const isLast = index === tracePath.length - 1;
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 p-3 bg-white border border-secondary-200 rounded-md flex-1">
                        <Database className="w-4 h-4 text-secondary-500" />
                        <span className="font-medium">{dataset}</span>
                        <span className="text-secondary-500">.</span>
                        <span className="text-primary-600">{column}</span>
                      </div>
                      
                      {!isLast && (
                        <ArrowRight className="w-4 h-4 text-secondary-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Fields */}
          {selectedColumn.inputFields.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-secondary-900 mb-3">Input Fields</h3>
              <div className="space-y-2">
                {selectedColumn.inputFields.map((input, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-secondary-50 rounded-md">
                    <Database className="w-4 h-4 text-secondary-500" />
                    <span className="text-sm">
                      {input.namespace}.{input.name}.{input.field}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transform Details */}
          {selectedColumn.transform && (
            <div className="mt-6">
              <h3 className="font-semibold text-secondary-900 mb-3">Transform Code</h3>
              <div className="bg-secondary-900 text-secondary-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
                {selectedColumn.transform}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColumnTracer;

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Database, Cpu, BarChart3 } from 'lucide-react';

interface SearchableItem {
  id: string;
  name: string;
  type: 'dataset' | 'job' | 'transform' | 'column';
  fullName?: string;
  description?: string;
}

interface AutocompleteSearchProps {
  onSearch: (query: string) => void;
  graph?: {
    jobs?: any[];
    datasets?: any[];
    transforms?: any[];
  };
  placeholder?: string;
  className?: string;
}

const AutocompleteSearch: React.FC<AutocompleteSearchProps> = ({
  onSearch,
  graph,
  placeholder = "Search datasets, jobs, or columns...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build searchable items cache from graph data
  const searchableItems = useMemo(() => {
    const items: SearchableItem[] = [];

    // Add datasets
    if (graph?.datasets) {
      graph.datasets.forEach(dataset => {
        items.push({
          id: dataset.id || `${dataset.namespace}.${dataset.name}`,
          name: dataset.name,
          type: 'dataset',
          fullName: `${dataset.namespace}.${dataset.name}`,
          description: dataset.description
        });

        // Add dataset columns
        if (dataset.columns) {
          dataset.columns.forEach((column: any) => {
            items.push({
              id: `${dataset.id}.${column.name}`,
              name: column.name,
              type: 'column',
              fullName: `${dataset.name}.${column.name}`,
              description: column.description || column.transformType
            });
          });
        }

        // Add dataset fields
        if (dataset.fields) {
          dataset.fields.forEach((field: any) => {
            const fieldName = field.name || field.fieldName || field;
            items.push({
              id: `${dataset.id}.${fieldName}`,
              name: fieldName,
              type: 'column',
              fullName: `${dataset.name}.${fieldName}`,
              description: field.type || field.dataType
            });
          });
        }
      });
    }

    // Add jobs
    if (graph?.jobs) {
      graph.jobs.forEach(job => {
        items.push({
          id: job.id || `${job.namespace}.${job.name}`,
          name: job.name,
          type: 'job',
          fullName: `${job.namespace}.${job.name}`,
          description: job.description || job.language
        });
      });
    }

    // Add transforms
    if (graph?.transforms) {
      graph.transforms.forEach(transform => {
        items.push({
          id: transform.id,
          name: transform.name,
          type: 'transform',
          fullName: transform.name,
          description: transform.transformType || transform.description
        });
      });
    }

    return items;
  }, [graph]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowercaseQuery = query.toLowerCase();
    return searchableItems
      .filter(item => 
        item.name.toLowerCase().includes(lowercaseQuery) ||
        item.fullName?.toLowerCase().includes(lowercaseQuery) ||
        item.description?.toLowerCase().includes(lowercaseQuery)
      )
      .slice(0, 10); // Limit to 10 results
  }, [query, searchableItems]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          handleItemSelect(filteredItems[selectedIndex]);
        } else if (query.trim()) {
          onSearch(query);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle item selection
  const handleItemSelect = (item: SearchableItem) => {
    setQuery(item.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearch(item.name);
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setIsOpen(false);
    }
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearch('');
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for item type
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'dataset':
        return <Database className="w-4 h-4 text-blue-500" />;
      case 'job':
        return <Cpu className="w-4 h-4 text-green-500" />;
      case 'transform':
        return <BarChart3 className="w-4 h-4 text-purple-500" />;
      case 'column':
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 border border-secondary-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {isOpen && filteredItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleItemSelect(item)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-secondary-50 text-secondary-700'
              }`}
            >
              {getItemIcon(item.type)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {item.name}
                </div>
                {item.fullName && item.fullName !== item.name && (
                  <div className="text-xs text-secondary-500 truncate">
                    {item.fullName}
                  </div>
                )}
                {item.description && (
                  <div className="text-xs text-secondary-400 truncate">
                    {item.description}
                  </div>
                )}
              </div>
              <div className="text-xs text-secondary-400 capitalize">
                {item.type}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length > 0 && filteredItems.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-md shadow-lg p-3 text-center text-secondary-500 text-sm">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
};

export default AutocompleteSearch;

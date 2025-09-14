import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Database, Cpu, BarChart3 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

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
  const { currentTheme } = useTheme();
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
        return <Database className="w-4 h-4" style={{ color: currentTheme.colors.primary }} />;
      case 'job':
        return <Cpu className="w-4 h-4" style={{ color: currentTheme.colors.success }} />;
      case 'transform':
        return <BarChart3 className="w-4 h-4" style={{ color: currentTheme.colors.accent }} />;
      case 'column':
        return <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentTheme.colors.textSecondary }} />;
      default:
        return <Search className="w-4 h-4" style={{ color: currentTheme.colors.textSecondary }} />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: currentTheme.colors.textSecondary }} />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          data-testid="search-input"
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2 rounded-md"
          style={{
            backgroundColor: currentTheme.colors.background,
            border: `1px solid ${currentTheme.colors.border}`,
            color: currentTheme.colors.text,
            outline: 'none',
            fontSize: '12px'
          }}
          onFocus={(e) => {
            if (query.length > 0) setIsOpen(true);
            e.target.style.borderColor = currentTheme.colors.primary;
            e.target.style.boxShadow = `0 0 0 2px ${currentTheme.colors.primary}20`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = currentTheme.colors.border;
            e.target.style.boxShadow = 'none';
          }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            style={{ color: currentTheme.colors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = currentTheme.colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = currentTheme.colors.textSecondary;
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {isOpen && filteredItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{
            backgroundColor: currentTheme.colors.surface,
            border: `1px solid ${currentTheme.colors.border}`
          }}
        >
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleItemSelect(item)}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
              style={{
                backgroundColor: index === selectedIndex ? currentTheme.colors.primary : 'transparent',
                color: index === selectedIndex ? currentTheme.colors.text : currentTheme.colors.textSecondary
              }}
              onMouseEnter={(e) => {
                if (index !== selectedIndex) {
                  e.currentTarget.style.backgroundColor = currentTheme.colors.border;
                  e.currentTarget.style.color = currentTheme.colors.text;
                }
              }}
              onMouseLeave={(e) => {
                if (index !== selectedIndex) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = currentTheme.colors.textSecondary;
                }
              }}
            >
              {getItemIcon(item.type)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {item.name}
                </div>
                {item.fullName && item.fullName !== item.name && (
                  <div className="text-xs truncate" style={{ color: currentTheme.colors.textSecondary }}>
                    {item.fullName}
                  </div>
                )}
                {item.description && (
                  <div className="text-xs truncate" style={{ color: currentTheme.colors.textSecondary }}>
                    {item.description}
                  </div>
                )}
              </div>
              <div className="text-xs capitalize" style={{ color: currentTheme.colors.textSecondary }}>
                {item.type}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length > 0 && filteredItems.length === 0 && (
        <div 
          className="absolute z-50 w-full mt-1 rounded-md shadow-lg p-3 text-center text-sm"
          style={{
            backgroundColor: currentTheme.colors.surface,
            border: `1px solid ${currentTheme.colors.border}`,
            color: currentTheme.colors.textSecondary
          }}
        >
          No results found for "{query}"
        </div>
      )}
    </div>
  );
};

export default AutocompleteSearch;

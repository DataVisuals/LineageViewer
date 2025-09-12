# Lineage Viewer React App

A beautiful, performant React application for visualizing OpenLineage data with interactive column-level lineage tracing.

## Features

- **Interactive Graph Visualization**: Built with React Flow for smooth, performant graph rendering
- **Column-Level Lineage**: Trace data flow from source to destination at the column level
- **Multiple View Modes**: Toggle between table-level and column-level views
- **Real-time Data**: Fetches live data from Marquez API
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Column Tracing**: Click on any column to trace its lineage back to source
- **Transform Details**: View detailed transformation information for each column

## Quick Start

### Prerequisites

1. Marquez must be running on `http://localhost:8080`
2. Lineage data must be loaded (run the Python scripts in the parent directory)

### Installation

```bash
npm install
```

### Development

```bash
npm start
```

The app will open at `http://localhost:3000`

### Production Build

```bash
npm run build
```

## Architecture

### Components

- **LineageGraph**: Main graph visualization using React Flow
- **LineageNode**: Custom node components for datasets and jobs
- **ControlPanel**: View controls and filters
- **ColumnTracer**: Modal for detailed column lineage tracing

### Services

- **marquezApi**: Service for fetching data from Marquez API
- **Proxy**: Handles CORS issues with Marquez API

### Key Features

1. **Graph Visualization**
   - Interactive nodes and edges
   - Zoom, pan, and fit-to-view controls
   - Mini-map for navigation
   - Auto-layout for optimal positioning

2. **Column-Level Tracing**
   - Click any column to see its lineage
   - Visual path from source to destination
   - Transform details and code
   - Input field mappings

3. **View Modes**
   - Table-level view (dataset to dataset)
   - Column-level view (column to column)
   - Transform visibility toggle
   - Filter by transform types

4. **Performance**
   - Virtualized rendering for large graphs
   - Efficient data fetching with React Query
   - Optimized re-renders
   - Smooth animations

## API Integration

The app connects to Marquez API endpoints:
- `/api/v1/namespaces/{namespace}/jobs` - Fetch jobs
- `/api/v1/namespaces/{namespace}/datasets` - Fetch datasets
- `/api/v1/namespaces/{namespace}/datasets/{dataset}` - Fetch dataset details with column lineage

## Styling

Built with Tailwind CSS for:
- Consistent design system
- Responsive layout
- Dark/light theme support
- Custom component styling

## Development

### Adding New Features

1. **New Node Types**: Add to `LineageNode.tsx`
2. **New View Modes**: Update `ViewMode` type and `ControlPanel.tsx`
3. **New API Endpoints**: Add to `marquezApi.ts`
4. **New Visualizations**: Create new components in `src/components/`

### Performance Tips

- Use React.memo for expensive components
- Implement proper key props for lists
- Use React Query for data caching
- Optimize graph rendering with React Flow

## Troubleshooting

### CORS Issues
The app includes a proxy configuration to handle CORS with Marquez API.

### Data Not Loading
1. Ensure Marquez is running on port 8080
2. Check that lineage data is loaded
3. Verify the namespace is `data_pipeline`

### Performance Issues
1. Reduce the number of visible nodes
2. Use table-level view for large datasets
3. Implement pagination for very large graphs
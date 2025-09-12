# Data Lineage Viewer

A comprehensive data lineage visualization tool that integrates with Marquez (OpenLineage) and supports DBT transformations with interactive graph visualization.

![Data Lineage Viewer](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Cytoscape.js](https://img.shields.io/badge/Cytoscape.js-3.0-green) ![Marquez](https://img.shields.io/badge/Marquez-OpenLineage-orange)

## ✨ Features

### 🎯 **Interactive Graph Visualization**
- **Cytoscape.js Integration**: High-performance graph rendering with smooth interactions
- **Multiple Layout Algorithms**: Hierarchical, circular, grid, force-directed, DAG, and Sugiyama layouts
- **Real-time Filtering**: Search and highlight nodes based on names, types, or content
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🔍 **Advanced Search & Discovery**
- **Intelligent Autocomplete**: Smart search with suggestions based on cached node names
- **Keyboard Navigation**: Full keyboard support with arrow keys, enter, and escape
- **Multi-source Search**: Search across datasets, jobs, transforms, and columns
- **Visual Type Indicators**: Icons and labels for different node types

### 📊 **Rich Data Integration**
- **Marquez API Support**: Full integration with OpenLineage metadata
- **DBT Transformations**: Support for DBT models, tests, and SQL transformations
- **Column-level Lineage**: Track field-level dependencies and transformations
- **Code Display**: Show SQL, Python, and Spark code in tooltips

### 🎨 **Enhanced User Experience**
- **Rich Hover Tooltips**: Detailed information with syntax-highlighted code
- **Collapsible Control Panel**: Space-efficient interface with expandable sections
- **Real-time Statistics**: Live counts of datasets, jobs, transforms, and languages
- **Smooth Animations**: Polished interactions and transitions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Marquez instance running on `localhost:8080`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DataVisuals/LineageViewer.git
   cd LineageViewer
   ```

2. **Install dependencies**
   ```bash
   # Install React app dependencies
   cd lineage-viewer-app
   npm install
   
   # Install Python dependencies (for data extraction)
   cd ..
   pip install -r requirements.txt
   ```

3. **Start the services**
   ```bash
   # Start backend proxy (port 3004)
   node backend-proxy.js
   
   # Start React app (port 3003)
   cd lineage-viewer-app
   PORT=3003 npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3003`

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18** with hooks and functional components
- **TypeScript** for type safety and better development experience
- **Cytoscape.js** for graph visualization and interaction
- **TanStack Query** for efficient data fetching and caching
- **Tailwind CSS** for responsive styling

### Backend Integration
- **Marquez API** for OpenLineage metadata
- **CORS Proxy** for cross-origin requests
- **DBT Integration** for SQL transformation support

### Data Sources
- **Marquez Jobs & Datasets**: Core lineage metadata
- **DBT Models**: SQL transformations and tests
- **Column Lineage**: Field-level dependency tracking
- **Transform Code**: SQL, Python, and Spark code extraction

## 📁 Project Structure

```
LineageViewer/
├── lineage-viewer-app/          # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── AutocompleteSearch.tsx
│   │   │   ├── CytoscapeLineageGraph.tsx
│   │   │   ├── ControlPanel.tsx
│   │   │   └── DataBrowser.tsx
│   │   ├── services/            # API services
│   │   │   └── marquezApi.ts
│   │   └── types/               # TypeScript definitions
│   │       └── lineage.ts
│   └── package.json
├── backend-proxy.js             # CORS proxy server
├── fixed_comprehensive_extractor.py  # Data extraction utilities
└── README.md
```

## 🔧 Configuration

### Environment Variables
```bash
# Marquez API URL (default: http://localhost:8080)
MARQUEZ_URL=http://localhost:8080

# React app port (default: 3003)
PORT=3003

# Backend proxy port (default: 3004)
PROXY_PORT=3004
```

### Marquez Setup
1. Start Marquez on `localhost:8080`
2. Ensure your data pipeline is sending OpenLineage events
3. Verify datasets and jobs are visible in Marquez UI

## 🎯 Usage

### Basic Navigation
- **Pan**: Click and drag on empty space
- **Zoom**: Mouse wheel or pinch gestures
- **Select**: Click on nodes to select them
- **Search**: Use the search bar with autocomplete

### Layout Controls
- **Algorithm Selection**: Choose from 8 different layout algorithms
- **Parameters**: Adjust node spacing, level spacing, and iterations
- **Re-apply**: Update layout with new parameters
- **Fit View**: Zoom to show all nodes
- **Randomize**: Randomize node positions

### Data Exploration
- **Hover Tooltips**: Rich information with code snippets
- **Search**: Find specific datasets, jobs, or transforms
- **Filter**: Highlight nodes based on search criteria
- **Statistics**: View counts and metadata in control panel

## 🔍 DBT Integration

The viewer supports DBT transformations with:

- **Model Visualization**: DBT models as datasets in the graph
- **SQL Code Display**: Show DBT SQL transformations in tooltips
- **Column Lineage**: Track field-level dependencies
- **Test Integration**: DBT tests as separate jobs
- **Layer Support**: Distinguish between staging and marts layers

### DBT Features
- **SQL Transformations**: Display DBT SQL code with syntax highlighting
- **Column Mapping**: Show input/output field relationships
- **Model Dependencies**: Visualize DBT model dependencies
- **Test Results**: Integration with DBT test results

## 🛠️ Development

### Available Scripts
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Code Structure
- **Components**: Reusable React components with TypeScript
- **Services**: API integration and data fetching
- **Types**: TypeScript definitions for data structures
- **Utils**: Helper functions and utilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Marquez](https://marquezproject.github.io/marquez/) for OpenLineage support
- [Cytoscape.js](https://js.cytoscape.org/) for graph visualization
- [DBT](https://www.getdbt.com/) for data transformation framework
- [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/) for the frontend

## 📞 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check the documentation
- Review the code examples

---

**Built with ❤️ for the data community**
# LineageViewer - Complete OpenLineage Solution

A comprehensive solution for extracting, loading, and visualizing column-level data lineage using Marquez with a beautiful React frontend.

## 🎯 What This Does

- **Extracts transforms** from dbt, Spark, Python, and SQL files in your data pipeline
- **Loads comprehensive column-level lineage** into Marquez using OpenLineage events
- **Visualizes lineage graphs** in both Marquez UI and a custom React app
- **Provides column-level tracing** to trace data flow from source to destination
- **Supports all transform types**: Spark operations, Pandas operations, SQL operations, dbt tests

## 🚀 Quick Start

### Option 1: All-in-One Startup
```bash
./start-lineage-viewer.sh
```

### Option 2: Manual Setup

1. **Start Marquez with Column-Level Lineage Support**
```bash
docker compose -f docker-compose-column-lineage.yml up -d
```

2. **Extract Transforms from Your Pipeline**
```bash
python fixed_comprehensive_extractor.py
```

3. **Load Column-Level Lineage into Marquez**
```bash
python working_comprehensive_loader.py
```

4. **Start React Lineage Viewer**
```bash
cd lineage-viewer-app
npm install
PORT=3003 npm start
```

## 📁 Project Structure

```
LineageViewer/
├── docker-compose-column-lineage.yml    # Marquez 0.45.0 with column lineage
├── fixed_comprehensive_extractor.py     # Extract transforms from all sources
├── working_comprehensive_loader.py      # Load lineage into Marquez
├── fixed_comprehensive_transforms.json  # Extracted transforms data
├── requirements.txt                     # Python dependencies
├── start-lineage-viewer.sh             # All-in-one startup script
├── lineage-viewer-app/                 # React frontend
│   ├── src/
│   │   ├── components/                 # React components
│   │   ├── services/                   # API services
│   │   ├── types/                      # TypeScript types
│   │   └── App.tsx                     # Main app component
│   ├── package.json                    # Node.js dependencies
│   └── README.md                       # React app documentation
└── README.md                           # This file
```

## 🎨 Two Visualization Options

### 1. Marquez UI (Official)
- **URL**: `http://localhost:3001`
- **Features**: Official Marquez interface with column-level lineage
- **Best for**: Production use, standard OpenLineage workflows

### 2. React Lineage Viewer (Custom)
- **URL**: `http://localhost:3003`
- **Features**: Interactive graph, column tracing, modern UI
- **Best for**: Development, exploration, custom visualizations

## 🔧 Configuration

### Marquez Configuration
- **API**: `http://localhost:8080`
- **UI**: `http://localhost:3001`
- **Namespace**: `data_pipeline`
- **Database**: PostgreSQL 13

### Transform Sources
The extractor looks for files in `/Users/andrewspruce/Lineage/`:
- **dbt**: `models/*.sql`, `models/schema.yml`
- **Spark**: `spark_pipeline*.py`, `test_spark_pipeline.py`
- **Python**: `data_transformer.py`, `data_pipeline.py`, etc.
- **SQL**: `*.sql` files outside dbt models

## 📊 What You'll See

### Jobs in Marquez
- `spark_pipeline` - Spark data processing job
- `spark_pipeline_simple` - Simplified Spark job
- `data_transformer` - Python/Pandas transformations
- `raw_data_ingestion` - Data ingestion job
- `customer_aggregation` - Data aggregation job

### Column-Level Lineage Details
- **Input/Output Mappings**: Clear data flow between datasets
- **Transformation Types**: SPARK_OPERATION, PANDAS_OPERATION, SQL_OPERATION
- **Transformation Descriptions**: Detailed descriptions of each transform
- **Transformation Code**: Actual code snippets showing the transformations

## 🎯 React App Features

### Interactive Graph Visualization
- **React Flow**: Smooth, performant graph rendering
- **Zoom & Pan**: Navigate large lineage graphs
- **Mini-map**: Quick navigation overview
- **Auto-layout**: Optimal node positioning

### Column-Level Tracing
- **Click to Trace**: Click any column to see its lineage
- **Visual Path**: Clear path from source to destination
- **Transform Details**: View transformation code and descriptions
- **Input Mappings**: See which input fields contribute to each column

### View Modes
- **Table-Level**: Dataset to dataset relationships
- **Column-Level**: Column to column transformations
- **Transform Toggle**: Show/hide transformation details
- **Filter Options**: Filter by transform types

### Modern UI
- **Tailwind CSS**: Beautiful, responsive design
- **Dark/Light Theme**: Adaptive color schemes
- **Real-time Updates**: Live data from Marquez API
- **Performance**: Optimized for large datasets

## 🛠️ Development

### Adding New Transform Types
1. Update `fixed_comprehensive_extractor.py` to recognize new patterns
2. Add new transform types to the classification logic
3. Update the React app to display new transform types

### Customizing the React App
1. **Styling**: Modify `src/index.css` and component styles
2. **Components**: Add new components in `src/components/`
3. **API**: Extend `src/services/marquezApi.ts` for new endpoints
4. **Types**: Update `src/types/lineage.ts` for new data structures

### Performance Optimization
- **Large Graphs**: Use table-level view for datasets with many columns
- **Caching**: React Query provides automatic data caching
- **Virtualization**: React Flow handles large graphs efficiently
- **Lazy Loading**: Load detailed column data on demand

## 🎉 Success Metrics

The solution typically extracts:
- **50-100+ transforms** from a typical data pipeline
- **Multiple transform types**: aggregations, string functions, type conversions, etc.
- **All languages**: dbt, Spark, Python, SQL
- **Column-level details**: input fields, transformation code, descriptions

## 🚨 Troubleshooting

### Marquez Not Starting
```bash
# Check if containers are running
docker ps | grep marquez

# Check logs
docker logs marquez-api-column
docker logs marquez-web-column
```

### React App Not Loading Data
1. Ensure Marquez is running on port 8080
2. Check that lineage data is loaded
3. Verify the namespace is `data_pipeline`
4. Check browser console for CORS errors

### Missing Transforms
- Check that your source files are in `/Users/andrewspruce/Lineage/`
- Verify file patterns match the extractor's expectations
- Run the extractor again to capture new changes

## 🎯 Next Steps

1. **Explore the Data**: Use both Marquez UI and React app to explore your lineage
2. **Customize Views**: Adjust the React app for your specific needs
3. **Add More Sources**: Extend the extractor for additional data sources
4. **Production Deploy**: Deploy the React app for team use

## 🎉 You're All Set!

You now have a complete OpenLineage solution with:
- ✅ Comprehensive transform extraction from all your data sources
- ✅ Column-level lineage loaded into Marquez
- ✅ Beautiful React app for interactive exploration
- ✅ Column-to-column tracing capabilities
- ✅ Modern, performant visualization

**Happy lineage exploring!** 🚀
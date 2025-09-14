# Testing the Lineage Viewer

This document provides instructions for running the Cypress tests to ensure layout changes don't generate errors.

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the CORS Proxy** (from project root)
   ```bash
   cd ..
   node cors-proxy.js
   ```
   Keep this running in a separate terminal.

3. **Start the React App**
   ```bash
   npm start
   ```
   The app should be available at http://localhost:3003

## Running Tests

### Option 1: Simple Test Runner (Recommended)
```bash
./run-tests-simple.sh
```
This assumes the app is already running. **This is the recommended approach for macOS users.**

### Option 2: Full Test Runner
```bash
./run-tests.sh
```
This starts the app and proxy automatically (requires `timeout` command or coreutils).

### Option 3: Manual Cypress
```bash
# Open Cypress Test Runner (interactive)
npm run cypress:open

# Run tests headlessly
npm run cypress:run
```

## Test Coverage

The tests verify:

### ✅ Layout Algorithms
- **dag** - Directed Acyclic Graph layout
- **hierarchical** - Hierarchical layout
- **circular** - Circular layout
- **grid** - Grid layout
- **force** - Force-directed layout
- **flow** - Flow layout
- **sugiyama** - Sugiyama layout

### ✅ Error Prevention
- Null reference errors in Cytoscape
- Layout application failures
- Graph rendering issues
- Console errors and warnings

### ✅ Edge Cases
- Rapid layout changes
- Window resize during layout changes
- Theme changes with different layouts
- Search functionality with different layouts
- Tab switching with different layouts

## Expected Results

All tests should pass without errors. The tests are specifically designed to catch:

1. **"Cannot read properties of null (reading 'notify')"** errors
2. **Layout application failures**
3. **Graph rendering issues**
4. **State corruption during layout changes**

## Troubleshooting

### Common Issues

1. **"App is not running"**
   - Make sure `npm start` is running
   - Check that the app is accessible at http://localhost:3003

2. **"CORS proxy not running"**
   - Start the proxy with `node cors-proxy.js` from the project root
   - Make sure it's running on port 3004

3. **Tests fail with layout errors**
   - Check the browser console for errors
   - Verify the graph data is loaded correctly
   - Ensure all layout algorithms are working

### Debug Mode

To run tests in debug mode:
```bash
npm run cypress:open
```
This opens the Cypress Test Runner where you can:
- See tests running in real-time
- Debug individual test steps
- Inspect the application state
- View console errors

## Continuous Integration

For CI/CD pipelines, use:
```bash
npm run cypress:run:headless
```

This runs tests in headless mode suitable for automated environments.

## Test Data Requirements

The tests expect:
- At least one job named "data_transformer"
- Graph with nodes and edges
- Layout controls in the sidebar
- Search functionality
- Tab navigation

If tests fail due to missing data, ensure the data loader has been run and the Marquez API is populated with test data.

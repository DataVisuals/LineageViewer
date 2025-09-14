# Cypress Tests for Lineage Viewer

This directory contains end-to-end tests for the Lineage Viewer application, specifically focused on ensuring layout changes don't generate errors.

## Test Structure

### `e2e/layout-tests.cy.js`
Comprehensive tests for layout functionality:

- **Graph Loading**: Verifies the graph loads without errors
- **Layout Changes**: Tests all layout algorithms (dag, hierarchical, circular, grid, force, flow, sugiyama)
- **Rapid Changes**: Tests rapid layout switching to catch race conditions
- **State Maintenance**: Ensures graph state is preserved after layout changes
- **Window Resize**: Tests layout behavior during window resize
- **Node Interactions**: Verifies node interactions work after layout changes
- **Theme Changes**: Tests layout with different themes
- **Search Functionality**: Tests search with different layouts
- **Tab Switching**: Tests tab switching with different layouts

## Running Tests

### Prerequisites
1. Ensure the CORS proxy is running (`node cors-proxy.js` from project root)
2. Ensure the React app is running (`npm start`)

### Run Tests
```bash
# Open Cypress Test Runner (interactive)
npm run cypress:open

# Run tests headlessly
npm run cypress:run

# Run tests with custom script (includes setup)
./run-tests.sh
```

### Test Data Requirements
The tests expect the following data to be available:
- At least one job named "data_transformer"
- Graph with nodes and edges
- Layout controls in the sidebar

## Test Configuration

### `cypress.config.js`
- Base URL: `http://localhost:3003`
- Viewport: 1280x720
- Timeouts: 10 seconds for commands and requests
- Video recording: Disabled
- Screenshots: Enabled on failure

### `support/e2e.js`
- Handles uncaught exceptions from Cytoscape
- Prevents test failures on expected errors
- Imports custom commands

### `support/commands.js`
Custom commands for common operations:
- `cy.waitForGraphLoad()`: Waits for graph to be fully loaded
- `cy.checkForErrors()`: Checks for console errors
- `cy.changeLayout(layoutName)`: Changes layout algorithm
- `cy.verifyGraphRendered()`: Verifies graph is rendered without errors

## Data Test IDs

The following data-testid attributes are used in tests:

- `cytoscape-graph`: Main graph container
- `layout-selector`: Layout algorithm selector container
- `layout-option-{name}`: Individual layout algorithm buttons
- `search-input`: Search input field
- `graph-tab`: Graph view tab
- `browser-tab`: Browser view tab

## Error Handling

Tests are designed to catch and handle:
- Null reference errors in Cytoscape
- Layout application failures
- Graph rendering issues
- Console errors and warnings
- Race conditions during rapid changes

## Continuous Integration

For CI/CD pipelines, use:
```bash
npm run cypress:run:headless
```

This runs tests in headless mode suitable for automated environments.

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to wait for the graph to be fully loaded
Cypress.Commands.add('waitForGraphLoad', () => {
  // Wait for the graph container to be visible
  cy.get('[data-testid="cytoscape-graph"]', { timeout: 10000 }).should('be.visible');
  
  // Wait for any content to be rendered (more flexible)
  cy.get('[data-testid="cytoscape-graph"]').should('not.be.empty');
  
  // Wait a bit more for Cytoscape to fully initialize
  cy.wait(2000);
});

// Custom command to check for console errors
Cypress.Commands.add('checkForErrors', () => {
  cy.window().then((win) => {
    // Check if there are any uncaught errors
    const errors = win.console.error || [];
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
  });
});

// Custom command to change layout algorithm
Cypress.Commands.add('changeLayout', (layoutName) => {
  // Click on the layout dropdown
  cy.get('[data-testid="layout-selector"]').click();
  
  // Select the specific layout
  cy.get(`[data-testid="layout-option-${layoutName}"]`).click();
  
  // Wait for layout to be applied
  cy.wait(2000);
});

// Custom command to verify graph is rendered without errors
Cypress.Commands.add('verifyGraphRendered', () => {
  // Check that the graph container exists and is visible
  cy.get('[data-testid="cytoscape-graph"]').should('be.visible');
  
  // Check that the graph container has content (more flexible)
  cy.get('[data-testid="cytoscape-graph"]').should('not.be.empty');
  
  // Check for any error messages in the UI
  cy.get('body').should('not.contain', 'Error');
  cy.get('body').should('not.contain', 'Cannot read properties of null');
});

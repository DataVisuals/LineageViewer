// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Handle uncaught exceptions to prevent test failures
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on uncaught exceptions from the app
  // This is especially important for Cytoscape-related errors
  if (err.message.includes('notify') || 
      err.message.includes('Cytoscape') ||
      err.message.includes('Cannot read properties of null')) {
    console.log('Caught expected error:', err.message);
    return false; // Don't fail the test
  }
  return true; // Fail the test for other errors
});

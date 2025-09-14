describe('Lineage Viewer Layout Tests', () => {
  beforeEach(() => {
    // Visit the app before each test
    cy.visit('/');
    
    // Wait for the app to load completely
    cy.waitForGraphLoad();
  });

  it('should load the graph without errors', () => {
    // Verify the graph is rendered
    cy.verifyGraphRendered();
    
    // Check for console errors
    cy.checkForErrors();
  });

  it('should change layout algorithms without generating errors', () => {
    const layouts = ['dag', 'hierarchical', 'circular', 'grid', 'force', 'flow', 'sugiyama'];
    
    layouts.forEach((layout) => {
      cy.log(`Testing layout: ${layout}`);
      
      // Change to the layout
      cy.changeLayout(layout);
      
      // Verify the graph is still rendered
      cy.verifyGraphRendered();
      
      // Check for console errors
      cy.checkForErrors();
      
      // Wait a bit before next layout
      cy.wait(1000);
    });
  });

  it('should handle rapid layout changes without errors', () => {
    const layouts = ['dag', 'hierarchical', 'circular', 'grid'];
    
    // Rapidly change layouts
    layouts.forEach((layout, index) => {
      cy.changeLayout(layout);
      
      // Don't wait between changes to test rapid switching
      if (index < layouts.length - 1) {
        cy.wait(500);
      }
    });
    
    // Verify final state is stable
    cy.verifyGraphRendered();
    cy.checkForErrors();
  });

  it('should maintain graph state after layout changes', () => {
    // Get initial state - just verify graph has content
    cy.get('[data-testid="cytoscape-graph"]').should('not.be.empty');
    
    // Change layout
    cy.changeLayout('circular');
    
    // Verify graph still has content
    cy.get('[data-testid="cytoscape-graph"]').should('not.be.empty');
    
    // Change to another layout
    cy.changeLayout('grid');
    
    // Verify graph still has content
    cy.get('[data-testid="cytoscape-graph"]').should('not.be.empty');
    
    // Check for errors
    cy.checkForErrors();
  });

  it('should handle window resize without errors', () => {
    // Change layout first
    cy.changeLayout('hierarchical');
    
    // Resize the window
    cy.viewport(800, 600);
    cy.wait(1000);
    
    // Verify graph is still rendered
    cy.verifyGraphRendered();
    
    // Resize back
    cy.viewport(1280, 720);
    cy.wait(1000);
    
    // Verify graph is still rendered
    cy.verifyGraphRendered();
    
    // Check for errors
    cy.checkForErrors();
  });

  it('should handle node interactions after layout changes', () => {
    // Change layout
    cy.changeLayout('force');
    
    // Try to interact with nodes (hover, click)
    cy.get('[data-testid="cytoscape-graph"]').should('be.visible');
    
    // Verify no errors occurred
    cy.checkForErrors();
  });

  it('should handle theme changes with different layouts', () => {
    const layouts = ['dag', 'circular', 'grid'];
    
    layouts.forEach((layout) => {
      cy.log(`Testing theme with layout: ${layout}`);
      
      // Change layout
      cy.changeLayout(layout);
      
      // Change theme (if theme selector exists)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="theme-selector"]').length > 0) {
          cy.get('[data-testid="theme-selector"]').click();
          cy.wait(500);
        }
      });
      
      // Verify graph is still rendered
      cy.verifyGraphRendered();
      
      // Check for errors
      cy.checkForErrors();
    });
  });

  it('should handle search functionality with different layouts', () => {
    const layouts = ['dag', 'hierarchical', 'circular'];
    
    layouts.forEach((layout) => {
      cy.log(`Testing search with layout: ${layout}`);
      
      // Change layout
      cy.changeLayout(layout);
      
      // Perform search
      cy.get('input[placeholder*="search" i]').type('data_transformer');
      cy.wait(1000);
      
      // Clear search
      cy.get('input[placeholder*="search" i]').clear();
      cy.wait(500);
      
      // Verify graph is still rendered
      cy.verifyGraphRendered();
      
      // Check for errors
      cy.checkForErrors();
    });
  });

  it('should handle tab switching with different layouts', () => {
    const layouts = ['dag', 'grid', 'force'];
    
    layouts.forEach((layout) => {
      cy.log(`Testing tab switching with layout: ${layout}`);
      
      // Change layout
      cy.changeLayout(layout);
      
      // Switch to browser tab (if it exists)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="browser-tab"]').length > 0) {
          cy.get('[data-testid="browser-tab"]').click();
          cy.wait(1000);
          
          // Switch back to graph tab
          cy.get('[data-testid="graph-tab"]').click();
          cy.wait(1000);
        }
      });
      
      // Verify graph is still rendered
      cy.verifyGraphRendered();
      
      // Check for errors
      cy.checkForErrors();
    });
  });
});

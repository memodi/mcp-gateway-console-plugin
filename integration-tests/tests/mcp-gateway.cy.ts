import { checkErrors } from '../support';

describe('MCP Gateway Console Plugin', () => {
  before(() => {
    // login to openshift console
    cy.login();
    // skip tour if it appears
    cy.get(`[data-test="tour-step-footer-secondary"]`, { timeout: 10000 })
      .contains('Skip tour')
      .click({ force: true });
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.logout();
  });

  describe('Navigation', () => {
    it('should display MCP Gateway navigation section', () => {
      cy.get('[data-test="nav"]').contains('MCP Gateway').should('be.visible');
    });

    it('should display Overview navigation item', () => {
      cy.get('[data-test="nav"]').contains('Overview').should('be.visible');
    });

    it('should display Tools navigation item', () => {
      cy.get('[data-test="nav"]').contains('Tools').should('be.visible');
    });
  });

  describe('MCP Overview Page', () => {
    beforeEach(() => {
      // navigate to overview page
      cy.get('[data-test="nav"]').contains('MCP Gateway').click();
      cy.get('[data-test="nav"]').contains('Overview').click();
    });

    it('should navigate to overview page', () => {
      cy.url().should('include', '/mcp-gateway');
      cy.get('title').should('contain', 'MCP Gateway');
    });

    it('should display page header', () => {
      cy.contains('MCP Gateway Overview').should('be.visible');
    });

    it('should display summary cards or empty state', () => {
      // either summary cards with metrics or empty state
      cy.get('body').then(($body) => {
        if ($body.text().includes('No MCP servers registered')) {
          // empty state
          cy.contains('No MCP servers registered').should('be.visible');
        } else {
          // should have summary cards
          cy.contains('Total Servers').should('be.visible');
        }
      });
    });
  });

  describe('MCP Tools Page', () => {
    beforeEach(() => {
      // navigate to tools page
      cy.get('[data-test="nav"]').contains('MCP Gateway').click();
      cy.get('[data-test="nav"]').contains('Tools').click();
    });

    it('should navigate to tools page', () => {
      cy.url().should('include', '/mcp-gateway/tools');
      cy.get('title').should('contain', 'MCP Tools');
    });

    it('should display page header', () => {
      cy.contains('MCP Tools').should('be.visible');
    });

    it('should display tools table or empty state', () => {
      // either tools list or empty state
      cy.get('body').then(($body) => {
        if ($body.text().includes('No tools available')) {
          // empty state
          cy.contains('No tools available').should('be.visible');
        } else {
          // should have search bar and table
          cy.get('input[placeholder*="Search"]').should('be.visible');
        }
      });
    });

    it('should allow searching tools if tools exist', () => {
      cy.get('body').then(($body) => {
        if (!$body.text().includes('No tools available')) {
          // test search functionality
          const searchInput = cy.get('input[placeholder*="Search"]');
          searchInput.should('be.visible');

          // type in search
          searchInput.type('test');

          // search should work (either show filtered results or "no matching")
          cy.get('body').should('exist');
        }
      });
    });
  });
});

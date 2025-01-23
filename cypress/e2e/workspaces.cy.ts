/// <reference types="cypress" />
import {initChannelIntercepts, setupDatabase} from '../setup';

const host: string = Cypress.env("DATABASE_HOST");
const database: string = Cypress.env("DATABASE_PATH");

describe("Basic Test", () => {
  before(() => {
    // Setup the database once before all tests in this describe block.
    setupDatabase(host, database);
  });

  beforeEach(() => {
    // Open the application.
    cy.visit("/");
  });

  it("should access programmatically created database", () => {
    // Basic test that logs in, opens workspace, opens channel, and checks post
    cy.login("user2");
    cy.openWorkspace("COMP 318");
    cy.openChannel("Project 1");
    cy.getPost("This post should appear first");
  });
});

describe('Workspaces Functionality', () => {
    before(() => {
        setupDatabase(host, database);

        });

    beforeEach(() => {
        cy.visit("/");
        cy.login("user 5"); // Custom command to log in
        cy.get('button#workspace-prompt').click();
    });

    afterEach(() => {
        cy.logout();
    });

    it('should display the list of workspaces', () => {
        cy.get('ul#workspace-list').should('be.visible');
        // cy.get('#.workspace-item').should('have.length.greaterThan', 0);
    });

    it('should refresh the workspaces', () => {
        cy.intercept("PUT", "*").as("createWorkspace");
        cy.createWorkspace("Refresh Workspace");
        cy.wait("@createWorkspace");
        cy.wait("@createWorkspace");
        cy.get('button#workspace-prompt').click();
        cy.get('.workspace-name').should('contain', 'Refresh Workspace');
        cy.get('button#refresh-account-button').scrollIntoView().click();
        cy.get('.workspace-name').should('contain', 'Refresh Workspace');
    });

    it('should create a new workspace', () => {
        cy.intercept("PUT", "*").as("createWorkspace");
        cy.createWorkspace("p22group22 workspace two");
        cy.wait("@createWorkspace");
        cy.get('.workspace-name').should('contain', 'p22group22 workspace two');
        cy.createWorkspace("New Workspace p22");
        cy.wait("@createWorkspace");
        cy.get('.workspace-name').should('contain', 'New Workspace p22');
    });

    it('should delete a workspace', () => {
        cy.deleteWorkspace("p22group22 workspace two");
        cy.get('ul#workspace-list').should('not.contain', 'p22group22 workspace two');
    });

    it('should open a workspace', () => {
        cy.intercept("GET", "*").as("getWorkspace");
        cy.openWorkspace("New Workspace p22");
        cy.wait("@getWorkspace");
        cy.get('.workspace-name').should('contain', 'New Workspace p22');
    });

    it('should not create a duplicate workspace', () => {
        cy.intercept("PUT", "*").as("createWorkspace");
        cy.createWorkspace("group22");
        cy.wait("@createWorkspace");
        cy.wait("@createWorkspace");
        cy.createWorkspace("group22");
        cy.get('ul#workspace-list').find('.workspace-name').contains("group22").should('have.length', '1');
    });

    it ('should not create a workspace with an invalid name', () => {
        cy.createWorkspace("/");
        cy.get('ul#workspace-list').should('not.contain', "/");
        cy.get('ul#workspace-list').find("label#error-display").contains(`Contains invalid character. Cannot contain '/', '.', '"' or '\\'`)
    })


});


// TODO: add more tests in the following sections
// server malfunctions (e.g. server down, server error, unauthorized, etc)
// 
/// <reference types="cypress" />
import {setupDatabase} from '../setup';

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


describe ('Login on Server Failure', () => {

    before(() => {
        setupDatabase(host, database);
    });

    it('should display an error message when the server fails to login', () => {
        cy.visit("/");
        cy.intercept("POST", "*", {
            statusCode: 500,
            body: "Error"
        }).as("login");
        cy.login("user 5");
        cy.get("p#error-message").should("be.visible")
    });
});

describe('Workspace on Server Failure', () => {
    const workspace = "failure workspace";
    before(() => {
        setupDatabase(host, database);
    });
    beforeEach(() => {
        cy.visit("/");
        cy.login("user 5");
    });

    afterEach(() => {
        cy.logout();
    });

    // it('should display an error message when the server fails to refresh workspaces', () => {
    //     cy.get("article.notification-bar").should("not.be.visible")
    //     // cy.replicateServerFailure("workspace);
    //     cy.get('button#workspace-prompt').click();
    //     cy.get("button#refresh-account-button").click();
    //     cy.get("article.notification-bar").should("be.visible")
    // });

    it('should display an error message when the server fails to create a workspace', () => {
        cy.get("article.notification-bar").should("not.be.visible")
        // cy.simulateServerFailure("PUT", workspace);
        cy.intercept("PUT", "*", {
            forceNetworkError: true
        }).as("createWorkspace");
        cy.createWorkspace(workspace);
        cy.get("article.notification-bar").should("be.visible")
    });

    it('should repoen workspace to edit and display an error message when the server fails to create a workspace', () => {
        cy.get("article.notification-bar").should("not.be.visible")
        // cy.simulateServerFailure("PUT", workspace);
        cy.intercept("PUT", "*", {
            forceNetworkError: true
        }).as("createWorkspace");
        cy.createWorkspace(workspace);
        cy.get("article.notification-bar").should("be.visible")
        cy.cancelRetry();
        cy.get("input#workspace-list-input:visible").should("have.value", workspace)
    });

    it('should display an error message when the server fails to select a workspace', () => {
        cy.get("article.notification-bar").should("not.be.visible")
        // cy.simulateServerFailure("GET", "COMP 318");
        cy.intercept("GET", "*", {
            forceNetworkError: true
        }).as("createWorkspace");
        cy.openWorkspace("COMP 318");
        cy.get("article.notification-bar").should("be.visible")
    });

    it ('should display an error message when the server fails to delete a workspace', () => {
        cy.intercept("PUT", "*" ).as("createWorkspace");
        cy.createWorkspace("cant delete")
        cy.wait("@createWorkspace");
        cy.get(".workspace-name").should("contain", "cant delete")
        cy.get("article.notification-bar").should("not.be.visible")
        // cy.simulateServerFailure("DELETE", "COMP 318");
        cy.intercept("DELETE", "*", {
            forceNetworkError: true
        }).as("deleteWorkspace");
        cy.deleteWorkspace("cant delete");
        cy.wait("@deleteWorkspace");
        cy.get("article.notification-bar").should("be.visible")
        cy.get(".workspace-name").should("contain", "cant delete")
    });

    it ('should close error display when the server fails to delete a workspace and the user closes', () => {
        cy.get("article.notification-bar").should("not.be.visible")
        // cy.simulateServerFailure("DELETE", "COMP 318");
        cy.intercept("DELETE", "*", {
            forceNetworkError: true
        }).as("createWorkspace");
        cy.deleteWorkspace("COMP 318");
        cy.get("article.notification-bar").should("be.visible")
        cy.cancelRetry();
        cy.get("article.notification-bar").should("not.be.visible")
    });

});

describe('Workspace on Unauthorized', () => {
    const workspace = "unauthorized workspace";
    before(() => {
        setupDatabase(host, database);
    });
    beforeEach(() => {
        cy.visit("/");
        cy.login("user 5");
    });



    it('should display an error message when the server is unauthorized to create a workspace', () => {
        cy.get("article.notification-bar").should("not.be.visible")

        cy.intercept("PUT", "*", {
            statusCode: 401,
            body: "Unauthorized"
        }).as("createWorkspace");
        cy.createWorkspace(workspace);
        cy.get("button#login-btn").should("be.visible")
    });


    it('should display an error message when the server is unauthorized to select a workspace', () => {
        cy.get("article.notification-bar").should("not.be.visible")
        // cy.simulateServerFailure("GET", "COMP 318");
        cy.intercept("GET", "*", {
            statusCode: 401,
            body: "Unauthorized"
        }).as("createWorkspace");
        cy.openWorkspace("COMP 318");
        cy.get("button#login-btn").should("be.visible")
    });

    it ('should display an error message when the server is unauthorized to delete a workspace', () => {
        cy.intercept("PUT", "*" ).as("createWorkspace");
        cy.createWorkspace("cant delete")
        cy.wait("@createWorkspace");
        cy.get(".workspace-name").should("contain", "cant delete")
        cy.get("article.notification-bar").should("not.be.visible")
        // cy.simulateServerFailure("DELETE", "COMP 318");
        cy.intercept("DELETE", `${host}/${database}/*`, {
            statusCode: 401,
            body: "Unauthorized"
        }).as("deleteWorkspace");
        cy.deleteWorkspace("cant delete");
        cy.wait("@deleteWorkspace");
        cy.get("button#login-btn").should("be.visible")
        cy.login("user 5");
        cy.openWorkspace("cant delete");
        cy.get("h1#channels-title").should("contain", "cant delete")
    });



});

// describe('Channel on Server Failure', () => {


// });

// describe('Post on Server Failure', () => {


// });

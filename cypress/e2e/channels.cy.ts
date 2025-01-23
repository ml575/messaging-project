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

describe('Channels Functionality', () => {
    
    before(() => {
        setupDatabase(host, database);
        cy.visit("/");
        cy.intercept("POST", "*").as("interceptLogin");
        cy.login("user 5"); // Custom command to log in
        cy.wait("@interceptLogin");
        cy.intercept("PUT", "*").as("createWorkspace");
        cy.createWorkspace("group22");
        cy.wait("@createWorkspace");
    });

    beforeEach(() => {
        cy.visit("/");
        cy.intercept("POST", `${host}/auth`).as("interceptLogin");
        cy.login("user 5"); // Custom command to log in
        cy.wait("@interceptLogin");
        // cy.intercept("GET", `${host}/${database}/*`).as("getWorkspace");
        cy.openWorkspace("group22");
        // cy.wait("@getWorkspace");
    });

    // afterEach(() => {
    //     cy.logout();
    // });

    it('should display the list of channels', () => {
        cy.intercept("PUT", "*").as("createChannel");
        cy.createChannel("Project 1");
        cy.wait("@createChannel");
        cy.createChannel("Project 2");
        cy.wait("@createChannel");
        cy.get('ul#channels-list').find('.workspace-name').should("contain", "Project 1");
    });

    it('should refresh the workspaces', () => {
        cy.intercept("PUT", "*").as("createChannel");
        cy.createChannel("Refresh Channel");
        cy.wait("@createChannel");
        cy.get('button#workspace-prompt').click();
        cy.get('.workspace-name').should('contain', 'Refresh Channel');
        cy.intercept("GET", "*").as("refreshChannel");
        cy.get('button#refresh-channel-button').scrollIntoView().click();
        cy.wait("@refreshChannel");
        cy.get('.workspace-name').should('contain', 'Refresh Channel');
    });

    it('should open a channel', () => {
        // cy.logout();
        // cy.login("user 5");
        cy.intercept("GET", "*").as("waitOnGet");
        cy.openWorkspace("group22");
        cy.wait("@waitOnGet");
        cy.openChannel("Project 1");
        cy.wait("@waitOnGet");
        cy.get('p#channel-name').should('contain', 'Project 1');
    });

    it('should create a new channel', () => {
        cy.intercept("PUT", "*").as("createChannel");
        cy.createChannel("New Channel");
        cy.wait("@createChannel");
        cy.get('ul#channels-list').find('.workspace-name').should("contain", "New Channel");
        cy.createChannel("New Channel Two");
        cy.wait("@createChannel");
        cy.get('ul#channels-list').find('.workspace-name').should("contain", "New Channel Two");
    });

    it('should delete a channel', () => {
        cy.intercept("DELETE", "*").as("deleteChannel");
        cy.deleteChannel("Project 1");
        cy.wait("@deleteChannel");
        cy.get('ul#channels-list').find('.workspace-name').should("not.contain", "Project 1");
        cy.deleteChannel("Project 2");
        cy.wait("@deleteChannel");
        cy.get('ul#channels-list').find('.workspace-name').should("not.contain", "Project 2");
    });

    it('should not create a duplicate channel', () => {
        cy.intercept("PUT", "*").as("createChannel");
        cy.createChannel("COMP 318");
        cy.wait("@createChannel");
        cy.createChannel("COMP 318");
        cy.get('ul#channels-list').find('.workspace-name').contains("COMP 318").should('have.length', '1');
        cy.get('ul#channels-list').find("label#error-display").contains(`Channel already exists`)
    });

    it ('should not create a channel with an invalid name', () => {
        cy.createChannel("/");
        cy.get('ul#channels-list').should('not.contain', "/");
        cy.get('ul#channels-list').find("label#error-display").contains(`Contains invalid character. Cannot contain '/', '.', '"' or '\\'`)
    })
});


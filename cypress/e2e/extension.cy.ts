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


describe('Extension Functionality', () => {
    it('should run properly', () => {
        cy.visit("/");
        cy.login("user 5");
        cy.get('button#surprise-button').click();
        cy.get('button#surprise-continue').click();
        cy.get('button#surprise-abort').click();
    });

    it('should timeout', () => {
        cy.visit("/");
        cy.login("user 5");
        cy.get('button#surprise-button').click();
        cy.get('button#surprise-continue').click();
        cy.get('button#surprise-abort', {timeout: 30000}).should('not.be.visible');
    });

    it('should allow users to cancel', () => {
        cy.visit("/");
        cy.login("user 5");
        cy.get('button#surprise-button').click();
        cy.get('button#surprise-cancel').click();
    });
});
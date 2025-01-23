// import { PostUpdateEvent } from "..../src/views/view";
/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

declare namespace Cypress {
  interface Chainable {
    login(username: string): Chainable<void>;
    logout(): Chainable<void>;
    openWorkspace(workspace: string): Chainable<void>;
    createWorkspace(workspace: string): Chainable<void>;
    deleteWorkspace(workspace: string): Chainable<void>;
    openChannel(channel: string): Chainable<void>;
    createChannel(channel: string): Chainable<void>;
    deleteChannel(channel: string): Chainable<void>;
    createPost(post: string): Chainable<void>;
    getPost(post: string): Chainable<JQuery<Element>>;
    replyToPost(reply: string): Chainable<void>;
    reactToPost(reaction: string): Chainable<void>;
    // simulateServerFailure(requestType: "GET"| "POST" | "DELETE"| "PUT", workspace: string, channel?: string): Chainable<void>;
    cancelRetry(): Chainable<void>;
  }
}

/*
 * This file contains the necessary custom commands to interact with your
 * application.  These commands should only do exactly what they say they do and
 * should only assume what the comments say they should assume.  These commands
 * can be used within your own tests and will be used by the machine grading
 * system to test your application.  It is therefore incredibly important you do
 * not change the behavior of these commands or the assumptions they make.
 *
 * Each command is likely to only be 2-3 lines of code that calls chained Cypress
 * commands.  If you find yourself writing a lot of code in a command, you may
 * want to ask for help or reconsider the structure of your application.
 *
 * Note that Cypress cannot "get" or "find" custom elements. However, as long as
 * the shadow DOM is created as "open", it can search within the shadow DOM. If
 * you need to return a custom element, you can "find" an element within the
 * shadow DOM and use ".parent()" as needed to return the custom element.
 */

/**
 * Login using given username.
 *
 * Assumes that no one is currently logged in.
 *
 * @param username Username to login with.
 */
Cypress.Commands.add("login", (username: string) => {
    // Cypress code to login.
    cy.visit('/');
    cy.get('input#username').type(username)
    // cy.get('.modal-overlay').parent().should('not.exist')
    cy.get('button#login-btn').click()
});

/**
 * Logout the currently logged in user.
 *
 * Assumes that a user is currently logged in.
 */
Cypress.Commands.add("logout", () => {
  // Cypress code to logout.
  cy.get('button#logout-btn').click()
});

/**
 * Open a workspace.
 *
 * Assumes that someone is logged in and that the workspace exists.
 *
 * @param workspace Name of the workspace to open.
 */
Cypress.Commands.add("openWorkspace", (workspace: string) => {
  // Cypress code to open the workspace.
    cy.get('button#workspace-prompt').click()
    cy.get('ul#workspace-list').find(`label.workspace-name`).contains(workspace).scrollIntoView().click()
});

/**
 * Create a workspace.
 *
 * Assumes that someone is logged in and that the workspace does not exist.
 *
 * @param workspace Name of the workspace to create.
 */
Cypress.Commands.add("createWorkspace", (workspace: string) => {
  // Cypress code to create the workspace.
  cy.get('button#workspace-prompt').click()
  cy.get('button#workspace-create').click()
  cy
  .get('ul#workspace-list')
  .find('input#workspace-list-input:visible')
  .last()
  // // .scrollIntoView()
  // .should('be.visible')
  .type(workspace)
  cy
  .get('button.workspace-confirm:visible')
  .last()
  .click()
});

/**
 * Delete a workspace.
 *
 * Assumes that someone is logged in and that the workspace exists.
 *
 * @param workspace Name of the workspace to delete.
 */
Cypress.Commands.add("deleteWorkspace", (workspace: string) => {
  // Cypress code to delete the workspace.
  cy.get('button#workspace-prompt').click()
  cy.get('ul#workspace-list')
  .find(`label.workspace-name`)
  .contains(workspace)
  .parent()
  .parent() // label container
  .scrollIntoView()
  .find('button.workspace-delete')
  .click()
  
});

/**
 * Open a channel.
 *
 * Assumes that someone is logged in, a workspace is open, and that the channel
 * exists in that workspace.
 *
 * @param channel Name of the channel to open.
 */
Cypress.Commands.add("openChannel", (channel: string) => {
  // Cypress code to open the channel.
  cy.get('ul#channels-list').find(`label.workspace-name`).contains(channel).click()
});

/**
 * Create a channel.
 *
 * Assumes that someone is logged in, a workspace is open, and that the channel
 * does not exist in that workspace.
 *
 * @param channel Name of the channel to create.
 */
Cypress.Commands.add("createChannel", (channel: string) => {
  // Cypress code to create the channel
  cy.get('button#create-channel-button').click()
  cy
  .get('ul#channels-list')
  .find('input#workspace-list-input:visible')
  .last()
  // .should('be.visible')
  .type(channel)
  .root()
  .get('button.workspace-confirm')
  .last()
  .click()
});

/**
 * Delete a channel.
 *
 * Assumes that someone is logged in, a workspace is open, and that the channel
 * exists in that workspace.
 *
 * @param channel Name of the channel to delete.
 */
Cypress.Commands.add("deleteChannel", (channel: string) => {
  // Cypress code to delete the channel.
  cy.get('ul#channels-list')
  .find('.workspace-name')
  .filter((index, el) => {
    return Cypress.$(el).text().trim() === channel;
  })
  .parent()
  .parent()
  .scrollIntoView()
  .find('button.workspace-delete')
  .click();
});

/**
 * Create a post.
 *
 * Assumes that someone is logged in, a workspace is open, and a channel is open.
 *
 * @param post Text of the post to create.
 */
Cypress.Commands.add("createPost", (post: string) => {
  // Cypress code to create the post.
  cy.get('textarea#input-box').type(post)
  cy.get('button#submit-button').click()
});

/**
 * Get a post.
 *
 * Assumes that someone is logged in, a workspace is open, and a channel is open.
 * Also can assume the text only appears in a single post in the channel.
 * The given searchText may not be the full text of the post, but the post should
 * contain the searchText in its entirety.
 *
 * @param searchText Text that appears in the post to get.
 * @returns The post element that contains the searchText.  This element will
 *          be passed to the replyToPost and reactToPost commands, so should
 *          be the enclosing post element that allows those actions.
 */
Cypress.Commands.add(
  "getPost",
  (searchText: string): Cypress.Chainable<JQuery<Element>> => {
    // Cypress code to get the post.
    // Must return an element that can be used by the replyToPost and reactToPost commands.
    return cy.get('post-element').find("p#post-body").contains(searchText).parent().parent();
  }
);

/**
 * Reply to a post.
 *
 * Assumes that someone is logged in, a workspace is open, a channel is open, and
 * that the provided post exists and came from the "getPost" command.
 *
 * @param subject The post to reply to (from getPost).
 * @param reply Text of the reply to create.
 */
Cypress.Commands.add(
  "replyToPost",
  { prevSubject: true },
  (subject, reply: string) => {
    // Cypress code to reply to the post.
    cy.wrap(subject).find("button#reply").first().click();
    cy.wrap(subject).find('textarea#reply-input-box:visible').scrollIntoView().type(reply)
    cy.wrap(subject).find('button#reply-submit-button').click()
  }
);

/**
 * React to a post.
 *
 * Assumes that someone is logged in, a workspace is open, a channel is open,
 * and that the provided post exists and came from the "getPost" command.
 *
 * @param subject The post to react to (from getPost).
 * @param reaction The reaction to react with (should be one of ":smile:",
 *                 ":frown:", ":like:", or ":celebrate:").
 */
Cypress.Commands.add(
  "reactToPost",
  { prevSubject: true },
  (subject, reaction: string) => {
    cy.wrap(subject).find(`button#${reaction.substring(1,reaction.length-1)}`).first().click()
  }
);

/**
 * Cancel an error retry.
 *
 * Assumes that someone is logged in, a valid request has been rendered, and the error display is visible.
 *
 * @param subject The post to react to (from getPost).
 * @param reaction The reaction to react with (should be one of ":smile:",
 *                 ":frown:", ":like:", or ":celebrate:").
 */
Cypress.Commands.add(
  "cancelRetry",
  ( ) => {
    cy.get('button#error-cancel').click()
  }
);

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

describe('Posts Functionality', () => {
    const testChannel = "channel test channel"
    before(() => {
        setupDatabase(host, database);
        cy.visit("/");
        cy.login("user 5"); // Custom command to log in
        cy.intercept("PUT", "*").as("createReq");
        cy.createWorkspace("channel test workspace");
        cy.wait("@createReq");
        cy.createChannel(testChannel);
        cy.wait("@createReq");
    });

    beforeEach(() => {
        cy.visit("/");
        cy.login("user 5"); // Custom command to log in
        // cy.intercept("GET", "*").as("getReq");
        cy.openWorkspace("channel test workspace");
        // cy.wait("@getReq");
        cy.openChannel(testChannel);
        // cy.wait("@getReq");
    });

    it ('should properly order posts', () => {
        // create a new channel
        cy.intercept("PUT", "*").as("createChannel");
        cy.createChannel("order channel");
        cy.wait("@createChannel");
        // dispatch two sse posts in reverse order
        cy.document().then((doc) => {

            doc.dispatchEvent(new CustomEvent("postUpdateEvent", 
                { 
                    detail: 
                        { 
                            path: "/channel test workspace/channels/order channel/third", 
                            doc: { 
                                msg: "This post should appear third" ,
                                parent: "",
                                reations: {
                                    ":smile:": 0,
                                    ":like:": 0,
                                    ":frown:": 0,
                                    ":celebrate:": 0
                                }
                            }, 
                            meta: {
                                createdAt: 20, 
                                createdBy: "user 5",
                                updatedAt: 20,
                                updatedBy: "user 5"
                            } 
                        }
                } ));
            doc.dispatchEvent(new CustomEvent("postUpdateEvent", 
                { 
                    detail: 
                        { 
                            path: "/channel test workspace/channels/order channel/secondPost", 
                            doc: { 
                                msg: "This post should appear second" ,
                                parent: "",
                                reations: {
                                    ":smile:": 0,
                                    ":like:": 0,
                                    ":frown:": 0,
                                    ":celebrate:": 0
                                }
                            }, 
                            meta: {
                                createdAt: 10, 
                                createdBy: "user 5",
                                updatedAt: 10,
                                updatedBy: "user 5"
                            } 
                        }
                } ));
            doc.dispatchEvent(new CustomEvent("postUpdateEvent", 
                { 
                    detail: 
                        { 
                            path: "/channel test workspace/channels/order channel/firstPost", 
                            doc: { 
                                msg: "This post should appear first" ,
                                parent: "",
                                reations: {
                                    ":smile:": 0,
                                    ":like:": 0,
                                    ":frown:": 0,
                                    ":celebrate:": 0
                                }
                            }, 
                            meta: {
                                createdAt: 0, 
                                createdBy: "user 5",
                                updatedAt: 0,
                                updatedBy: "user 5"
                            } 
                        }
                } ));
        });

        cy.get('ul#channel-posts').find('p#post-body').first().should("contain", "This post should appear first");
        cy.get('ul#channel-posts').find('p#post-body').last().should("contain", "This post should appear third");
    });

    it('should create a post', () => {
        cy.createPost("Project 1");
        cy.get('ul#channel-posts').find('p#post-body').should("contain", "Project 1");
    });

    it('should format a post properly', () => {
        cy.createPost("**bold***italicized*[chasegeyer.com](chasegeyer.com):smile::frown::like::celebrate:");
        cy.get('ul#channel-posts').find('p#post-body').find('strong').should("contain", "bold");
        cy.get('ul#channel-posts').find('p#post-body').find('em').should("contain", "italicized");
        cy.get('ul#channel-posts').find('p#post-body').find('a').should("contain", "chasegeyer.com");

    });

    it('should have a channel header', () => {
        cy.intercept("PUT", "*").as("createChannel");
        cy.createChannel("empty channel")
        cy.wait("@createChannel");
        cy.openChannel(testChannel);
        cy.get('p#channel-name').should('contain', testChannel);
    });

    it('should create a reply ', () => {
        cy.getPost("Project 1").replyToPost("Reply to Project 1");
        cy.getPost("Reply to Project 1").should("exist");
    });

    it('should react to a post', () => {
        cy.intercept("POST", "*").as("postCreate");
        cy.createPost("ummm gr8 post dude")
        cy.wait("@postCreate");
        cy.getPost("ummm gr8 post dude").reactToPost(":smile:");
        cy.getPost("ummm gr8 post dude").find(`button#smile`).first().should("exist").should("have.class", "clicked");
    });

    it ('should react to a reply', () => {
        cy.intercept("POST", "*").as("postCreate");
        cy.getPost("ummm gr8 post dude").replyToPost("thx babe")
        cy.wait("@postCreate");
        cy.getPost("thx babe").reactToPost(":like:");
        cy.getPost("thx babe").find(`button#like`).first().should("exist").should("have.class", "clicked");
    });

    it('should persistently display a post', () => {
        cy.createPost("This one should not be deleted on switching channels");
        cy.openChannel("empty channel");
        cy.openChannel(testChannel);
        cy.getPost("This one should not be deleted on switching channels").should("exist");
    });

    it ('should be able to react using all types to a reply', () => {
        cy.createPost("need to react to this one fs ong");
        cy.getPost("need to react to this one fs ong").replyToPost("this is the reply fs ong")
        for(let reaction of [":like:", ":smile:", ":frown:", ":celebrate:"]) {
            cy.getPost("this is the reply fs ong").reactToPost(reaction);
            cy.getPost("this is the reply fs ong").find(`button#${reaction.substring(1,reaction.length-1)}`).first().should("exist").should("have.class", "clicked");
        }
    });

    it ('should be able to use bold button to add in formatting', () => {
        cy.get('textarea#input-box').type("this is not formatted");
        cy.get('button#bold-button').click();
        cy.focused().type("this is bold");
        cy.get('button#submit-button').click()
        cy.getPost("this is bold").find('strong').should("exist");
    });

    it ('should be able to use italic button to add in formatting', () => {
        cy.get('textarea#input-box').type("this is not formatted");
        cy.get('button#italic-button').click();
        cy.focused().type("this is italicized");
        cy.get('button#submit-button').click()
        cy.getPost("this is italicized").find('em').should("exist");
    });

    it ('should be able to use italic button with selections to add in formatting', () => {
        cy.get('textarea#input-box').type("this is not formatted");
        cy.focused().type("this is italicized{shift}{leftArrow}{leftArrow}{leftArrow}{leftArrow}{leftArrow}");
        cy.get('button#italic-button').click();
        cy.focused().type("in the middle");
        cy.get('button#submit-button').click()
        cy.getPost("this is italicized").find('em').should("exist");
    });

    it ('should be able to use smile button to add in smile emoji', () => {
        cy.get('textarea#input-box').type("this is the smile post");
        cy.get('button#smile-button').click();
        cy.get('button#submit-button').click()
        cy.getPost("this is the smile post").find('p#post-body iconify-icon[icon="fa-regular:smile"]').should("exist");
    });

    it ('should be able to use frown button to add in frown emoji', () => {
        cy.get('textarea#input-box').type("this is the frown post");
        cy.get('button#frown-button').click();
        cy.get('button#submit-button').click()
        cy.getPost("this is the frown post").find('p#post-body iconify-icon[icon="fa-regular:frown"]').should("exist");
    });

    it ('should be able to use like button to add in like emoji', () => {
        cy.get('textarea#input-box').type("this is the like post");
        cy.get('button#like-button').click();
        cy.get('button#submit-button').click()
        cy.getPost("this is the like post").find('p#post-body iconify-icon[icon="mdi:like"]').should("exist");
    });

    it ('should be able to use celebrate button to add in celebrate emoji', () => {
        cy.get('textarea#input-box').type("this is the celebrate post");
        cy.get('textarea#input-box').click();
        cy.focused().type("this is the celebrate post");
        cy.get('button#celebrate-button').click();
        cy.get('button#submit-button').click()
        cy.getPost("this is the celebrate post").find('p#post-body iconify-icon[icon="mingcute:celebrate-fill"]').should("exist");
    });
});

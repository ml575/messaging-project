/// <reference types="cypress" />



  export function setupDatabase(host: string, database: string): void {
    const bearerToken = "user1token";
    const date = new Date();
    const workspacesUrl = `${host}${database?.substring(0, database.length - 1)}`;

    cy.request({
      method: "DELETE",
      url: workspacesUrl,
      headers: {
        Authorization: "Bearer user1token",
      },
      failOnStatusCode: false,
    });


    cy.request({
      method: 'PUT',
      url: workspacesUrl,
      headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
      },
      body: {}
    }).then((response) => {
      expect(response.status).to.eq(201);
      console.log(response);

      cy.request({
      method: 'PUT',
      url: `${workspacesUrl}/COMP 318`,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: {}
      }).then(() => {
      cy.request({
        method: 'PUT',
        url: `${workspacesUrl}/COMP 318/channels/`,
        headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
        },
        body: {}
      }).then(() => {
        cy.request({
        method: 'PUT',
        url: `${workspacesUrl}/COMP 318/channels/Project 1`,
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: {}
        }).then(() => {
        cy.request({
          method: 'PUT',
          url: `${workspacesUrl}/COMP 318/channels/Project 1/posts/`,
          headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          },
          body: {}
        }).then(() => {
          cy.request({
          method: 'POST',
          url: `${workspacesUrl}/COMP 318/channels/Project 1/posts/`,
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
          body: {
            msg: "This post should appear first"
          }
          });
        });
        });
        cy.request({
        method: 'PUT',
        url: `${workspacesUrl}/COMP 318/channels/Project 2`,
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: {}
        }).then(() => {
        cy.request({
          method: 'PUT',
          url: `${workspacesUrl}/COMP 318/channels/Project 2/posts/`,
          headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          },
          body: {}
        });
        });
        cy.request({
        method: 'PUT',
        url: `${workspacesUrl}/COMP 318/channels/Tutorials`,
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: {}
        }).then(() => {
        cy.request({
          method: 'PUT',
          url: `${workspacesUrl}/COMP 318/channels/Tutorials/posts/`,
          headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          },
          body: {}
        }).then(() => {
          cy.request({
          method: 'POST',
          url: `${workspacesUrl}/COMP 318/channels/Tutorials/posts/`,
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
          body: {
            msg: "No response?"
          }
          });
        });
        });
      });
      });

      cy.request({
      method: 'PUT',
      url: `${workspacesUrl}/COMP 321`,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: {}
      }).then(() => {
      cy.request({
        method: 'PUT',
        url: `${workspacesUrl}/COMP 321/channels/`,
        headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
        },
        body: {}
      });
      });

      cy.request({
      method: 'PUT',
      url: `${workspacesUrl}/Messaging`,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: {}
      }).then(() => {
      cy.request({
        method: 'PUT',
        url: `${workspacesUrl}/Messaging/channels/`,
        headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
        },
        body: {}
      }).then(() => {
        cy.request({
        method: 'PUT',
        url: `${workspacesUrl}/Messaging/channels/General`,
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: {}
        }).then(() => {
        cy.request({
          method: 'PUT',
          url: `${workspacesUrl}/Messaging/channels/General/posts/`,
          headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
          },
          body: {}
        });
        });
      });
      });
    });
  }

  type RequestType = "GET" | "POST" | "PUT" | "DELETE";
  export function initChannelIntercepts(workspace: string, channel: string, requestType: RequestType): void {
    cy.intercept(requestType, `${Cypress.env("DATABASE_HOST")}/${Cypress.env("DATABASE_PATH")}/workspaces/${workspace}/channels/${channel}`).as(
      `${requestType}Channel`
    );

    cy.intercept("GET", `${Cypress.env("DATABASE_HOST")}/${Cypress.env("DATABASE_PATH")}/workspaces/${workspace}/channels/${channel}?mode=subscribe`, (req) =>{
      req.reply((res) => {
        res.statusCode = 404;
        res.statusMessage = "Not Found";
      });
    }).as(
      `GetPostsNotFound`
    );
  }

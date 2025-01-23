import { slog } from "./slog";
import { createWorkspaceView } from "./views/workspace-view";
import { Model, PostModel } from "./models/model";
import { initChannelContentComp } from "./components/channel-content";
import { initPostComp } from "./components/post-element";
import { initReplyBoxComp } from "./components/reply-box";
import { getTemplate } from "./util";
import {
  createContainerItem,
  initContainerContent,
} from "./components/container-item";
import {
  initView,
  SelectChannelEvent,
  SelectWorkspaceEvent,
  CreateWorkspaceEvent,
  CreateChannelEvent,
  DeleteWorkspaceEvent,
  DeleteChannelEvent,
  RefreshWorkspaceEvent,
  CreatePostEvent,
  ReactEvent,
  RefreshChannelEvent,
  ReplyModeOnEvent,
  ReplyModeOffEvent,
  CreateReplyEvent,
  ReverseCreateEvent,
  ReverseDeleteEvent,
  PostUpdateEvent,
  SubscriptionErrorEvent,
} from "./views/view";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { initLoginView } from "./components/login-dialog";
import { createChannelView } from "./views/channel-view";
import { wrapCompilerAsTypeGuard, $Compiler } from "json-schema-to-ts";
import Ajv from "ajv";
import { createErrorView } from "./views/error-view";
import { initExtensionView } from "./views/extension-view";

/**
 * Declare names and types of environment variables.
 */
declare const process: {
  env: {
    DATABASE_HOST: string;
    DATABASE_PATH: string;
    AUTH_PATH: string;
  };
};

/**
 * The main entry point of the application:
 * - Initializes UI components (channel content, posts, replies).
 * - Initializes views (workspace view, channel view, etc.).
 * - Sets up event listeners for login, logout, selecting workspaces/channels, creating and deleting resources, reacting to posts, subscribing to real-time updates, and handling errors.
 */
function main(): void {
  initContainerContent(getTemplate);
  initChannelContentComp(getTemplate);
  initPostComp(getTemplate);
  initReplyBoxComp(getTemplate);
  const view = initView();
  const loginDialog = initLoginView(getTemplate);
  initExtensionView();
  const workspaceView = createWorkspaceView(() =>
    createContainerItem("Workspace"),
  );
  const errorView = createErrorView();
  const channelView = createChannelView(() => createContainerItem("Channel"));

  const ajv = new Ajv();
  const $compile: $Compiler = (schema) => ajv.compile(schema);
  const compile = wrapCompilerAsTypeGuard($compile);

  const model = Model.getInstance(
    `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}`,
    fetchEventSource,
    compile,
  );

  // Handle login attempts
  document.addEventListener("login-attempt", () => {
    console.log("login attempt");
    const username = loginDialog.getUsername();
    model
      .login(username)
      .then(() => {
        loginDialog.close();
        model
          .getWorkspaces()
          .then((workspaces) => {
            // displaying all workspaces in the collection
            workspaces.sort((a, b) => a.meta.createdAt - b.meta.createdAt);
            view.displayAllWorkspaces(workspaces);
          })
          .catch((error) => {
            console.log("error", error, "status", error.status);
            // Display the error message
            if (error.message === "Not Found") {
              errorView.show(
                "Database doesn't exist. Please contact the administrator or reload your page.",
              );
            } else if (error.message === "Aborted.") {
              errorView.show(
                "Server under heavy load. Try again later or choose different workspace.",
              );
            } else {
              errorView.show(error.message || "Failed to fetch workspaces");
            }
          });
        document.dispatchEvent(
          new CustomEvent("login-success", { detail: { username } }),
        );
      })
      .catch((error) => {
        loginDialog.displayError(error.message || "Login failed");
      });
  });

  // Handle logout attempts
  document.addEventListener("logout-attempt", () => {
    model.abortPreviousRequests(); // abort any previous requests
    errorView.close(); // close any error display
    model
      .logout()
      .then(() => {
        loginDialog.clearUsername();
        loginDialog.open();
        document.dispatchEvent(new CustomEvent("logout-success"));
        view.clearChannelList();
        view.clearContentArea();
        channelView.disable();
      })
      .catch((error) => {
        loginDialog.displayError(error.message || "Logout failed");
      });
  });

  // Handle selecting a workspace
  document.addEventListener(
    "selectWorkspaceEvent",
    function (event: CustomEvent<SelectWorkspaceEvent>) {
      model.abortPreviousRequests(); // abort any previous requests
      errorView.close(); // close any error display
      const workspaceId = event.detail.workspaceName;
      model
        .getChannels(workspaceId)
        .then((channels) => {
          channels.sort((a, b) => a.meta.createdAt - b.meta.createdAt); // sort channels by creation date
          view.displayAllChannels(channels, workspaceId); // display all channels in the workspace
          channelView.setWorkspace(workspaceId); // set the workspace in the channelView for channel events
          channelView.enable(); // enable the channelView buttons
        })
        .catch((error) => {
          if (error.message === "Failed to fetch") {
            errorView.showRetriableError(
              event,
              "Server not responding",
              new CustomEvent<RefreshWorkspaceEvent>("refreshWorkspaceEvent"),
            ); // display error message and set retry loop
          }
          if (error.message === "Not Found") {
            errorView.show("Workspace was not found");
            view.clearChannelList();
            channelView.disable();
            view.deleteWorkspace(event.detail.uuid);
          } else if (error.message === "Unauthorized") {
            document.dispatchEvent(new CustomEvent("logout-attempt"));
          } else {
            errorView.show(error.message || "Failed to fetch channels");
          }
        });
      view.clearContentArea();
    },
  );

  // Handle selecting a channel
  document.addEventListener(
    "selectChannelEvent",
    function (event: CustomEvent<SelectChannelEvent>) {
      model.abortPreviousRequests(); // abort any previous requests
      model.unsubscribeFromPosts(); // unsubscribe from previous channel
      errorView.close(); // close any error display
      console.log("channel selected");

      model
        .subscribeToPosts(event.detail.workspaceName, event.detail.channelName)
        .then(() => {
          return model.getAllPosts(
            event.detail.channelName,
            event.detail.workspaceName,
          );
        })
        .then((response: Array<PostModel>) => {
          // Sorted Responses
          response.sort((a, b) => a.meta.createdAt - b.meta.createdAt);
          // Iterate through all PostModels from response to convert to ViewPost w/ recursive structure
          response.forEach((retrievedPost: PostModel) => {
            console.log("post retrieved: ", retrievedPost.path);
          });
          view.displayChannelContent(
            event.detail.channelName,
            response,
            event.detail.workspaceName,
            loginDialog.getUsername(),
            // event.detail.username
          );
        })
        .catch((error) => {
          console.log("error", error, "status", error.status);
          if (error.message === "Failed to fetch") {
            errorView.showRetriableError(
              event,
              "Server not responding",
              new CustomEvent<RefreshWorkspaceEvent>("refreshWorkspaceEvent"),
            ); // display error message and set retry loop
          } else if (error.message === "Not Found") {
            errorView.show("Channel not found in server");
            view.clearContentArea();
            view.deleteChannel(event.detail.uuid);
          } else if (error.message === "Unauthorized") {
            document.dispatchEvent(new CustomEvent("logout-attempt"));
          } else {
            errorView.show(error.message || "Failed to fetch channels");
          }
        });
    },
  );

  // Handle creating a workspace
  document.addEventListener(
    "createWorkspaceEvent",
    (event: CustomEvent<CreateWorkspaceEvent>) => {
      errorView.close(); // close any error display
      console.log("create workspace event", event.detail.workspaceName);
      const workspaceName = event.detail.workspaceName;
      const workspaceId = event.detail.uuid;
      model
        .putWorkspace(workspaceName)
        .then((response) => {
          console.log("Workspace succesfully created");
          model
            .createChannelsDocument(workspaceName)
            .then((response) => {
              view.updateWorkspace(event.detail.uuid);
              view.displayAllChannels([], workspaceId);
              channelView.setWorkspace(workspaceName);
              channelView.enable();
              view.clearContentArea();
              workspaceView.close();
            })
            .catch((error) => {
              slog.error("Failed to create channels document", error);
            });
          // view.updateWorkspace(event.detail.uuid);
        })
        .catch((error) => {
          console.log(error.message);
          if (error.message === "Precondition Failed") {
            document.dispatchEvent(
              new CustomEvent("reverseCreateEvent", {
                detail: {
                  msg: "Workspace already exists",
                  uuid: event.detail.uuid,
                  isWorkspace: true,
                },
                bubbles: true,
              }),
            );
          } else if (error.message === "Failed to fetch") {
            errorView.showRetriableError(
              event,
              "Server not responding",
              new CustomEvent("reverseCreateEvent", {
                detail: {
                  msg: "retry denied",
                  uuid: event.detail.uuid,
                  isWorkspace: true,
                },
                bubbles: true,
                composed: true,
              }),
            );
          } else if (error.message === "Unauthorized") {
            document.dispatchEvent(new CustomEvent("logout-attempt"));
          } else {
            errorView.show(error.message || "Failed to create workspace");
            view.deleteWorkspace(event.detail.uuid);
          }
        });
    },
  );

  // Handle creating a channel
  document.addEventListener(
    "createChannelEvent",
    function (event: CustomEvent<CreateChannelEvent>) {
      errorView.close(); // close any error display

      console.log("create workspace event", event.detail.workspaceName);
      const workspaceName = event.detail.workspaceName;
      const channelName = event.detail.channelName;
      model
        .putChannel(workspaceName, channelName)
        .then((response) => {
          model
            .putPostsDocument(workspaceName, channelName)
            .then((response) => {
              view.updateChannel(event.detail.uuid);
              view.displayChannelContent(
                channelName,
                [],
                workspaceName,
                loginDialog.getUsername(),
              );
              model.subscribeToPosts(workspaceName, channelName);
            });
        })
        .catch((error) => {
          console.log(error.status);
          if (error.message === "Precondition Failed") {
            document.dispatchEvent(
              new CustomEvent("reverseCreateEvent", {
                detail: {
                  msg: "Channel already exists",
                  uuid: event.detail.uuid,
                  isWorkspace: false,
                },
                bubbles: true,
                composed: true,
              }),
            );
          } else if (error.message === "Failed to fetch") {
            errorView.showRetriableError(
              event,
              "Server not responding",
              new CustomEvent("reverseCreateEvent", {
                detail: {
                  msg: "retry denied",
                  uuid: event.detail.uuid,
                  isWorkspace: false,
                },
                bubbles: true,
                composed: true,
              }),
            );
          } else if (error.message === "Unauthorized") {
            document.dispatchEvent(new CustomEvent("logout-attempt"));
          } else {
            console.log("In error block for createChannelEvent");
            errorView.show(error.message || "Failed to create channel");
            view.deleteChannel(event.detail.uuid);
          }
        });
    },
  );

  // Handle deleting a workspace
  document.addEventListener(
    "deleteWorkspaceEvent",
    (event: CustomEvent<DeleteWorkspaceEvent>) => {
      errorView.close(); // close any error display
      console.log("delete workspace event", event);
      model
        .deleteWorkspace(event.detail.workspaceName)
        .then(() => {
          view.deleteWorkspace(event.detail.uuid);
          view.clearChannelList();
          view.clearContentArea();
          channelView.disable();

          // view.updateWorkspace(event.detail.uuid);
        })
        .catch((error) => {
          if (error.message === "Not Found") {
            errorView.show("Workspace was not found");
            view.deleteWorkspace(event.detail.uuid);
          } else if (error.message === "Failed to fetch") {
            errorView.showRetriableError(
              event,
              "Server not responding",
              new CustomEvent("reverseDeleteEvent", {
                detail: {
                  msg: "Server not responding.",
                  uuid: event.detail.uuid,
                  isWorkspace: true,
                },
                bubbles: true,
                composed: true,
              }),
            );
          } else if (error.message === "Unauthorized") {
            document.dispatchEvent(new CustomEvent("logout-attempt"));
            view.updateWorkspace(event.detail.uuid);
          } else {
            errorView.show(error.message || "Failed to create workspace");
            view.updateWorkspace(event.detail.uuid);
          }
        });
    },
  );

  // Handle deleting a channel
  document.addEventListener(
    "deleteChannelEvent",
    (event: CustomEvent<DeleteChannelEvent>) => {
      errorView.close(); // close any error display
      console.log("delete workspace event", event);
      model
        .deleteChannel(event.detail.workspaceName, event.detail.channelName)
        .then((response) => {
          view.deleteChannel(event.detail.uuid);
          // view.updateWorkspace(event.detail.uuid);
          view.clearContentArea();
        })
        .catch((error) => {
          if (error.message === "Not Found") {
            errorView.show("Channel was not found");
            view.deleteChannel(event.detail.uuid);
          } else if (error.message === "Failed to fetch") {
            errorView.showRetriableError(
              event,
              "Server not responding",
              new CustomEvent("reverseDeleteEvent", {
                detail: {
                  msg: "Server not responding.",
                  uuid: event.detail.uuid,
                  isWorkspace: false,
                },
                bubbles: true,
                composed: true,
              }),
            );
            return;
          } else if (error.message === "Unauthorized") {
            document.dispatchEvent(new CustomEvent("logout-attempt"));
            view.updateChannel(event.detail.uuid);
          } else {
            errorView.show(error.message || "Failed to create workspace");
            view.updateChannel(event.detail.uuid);
          }
        });
    },
  );

  // Handle refreshing workspace list
  document.addEventListener(
    "refreshWorkspaceEvent",
    (event: CustomEvent<RefreshWorkspaceEvent>) => {
      console.log("refresh workspace event", event);
      model.abortPreviousRequests(); // abort any previous requests
      errorView.close(); // close any error display
      model
        .getWorkspaces()
        .then((workspaces) => {
          workspaces.sort((a, b) => a.meta.createdAt - b.meta.createdAt);
          view.displayAllWorkspaces(workspaces);
        })
        .catch((error) => {
          if (error.message === "Failed to fetch") {
            errorView.showRetriableError(
              event,
              "Server not responding",
              new CustomEvent(""),
            ); // TODO: think about what this would react as
            return;
          } else if (error.message === "Aborted.") {
            errorView.show("Server under heavy load. Try again later.");
          } else if (error.message === "Unauthorized") {
            document.dispatchEvent(new CustomEvent("logout-attempt"));
          } else {
            console.error(error);
            errorView.show(error.message || "Failed to fetch workspaces");
          }
        });
    },
  );

  // Handle refreshing channel list
  document.addEventListener(
    "refreshChannelEvent",
    (event: CustomEvent<RefreshChannelEvent>) => {
      errorView.close(); // close any error display
      model.abortPreviousRequests(); // abort any previous requests
      console.log("refresh channel event", event);
      const workspaceName = event.detail.workspaceName;
      model
        .getChannels(workspaceName)
        .then((channels) => {
          channels.sort((a, b) => a.meta.createdAt - b.meta.createdAt);
          view.displayAllChannels(channels, workspaceName);
        })
        .catch((error) => {
          if (error.message === "Failed to fetch") {
            errorView.showRetriableError(
              event,
              "Server not responding",
              new CustomEvent(""),
            );
            return;
          } else if (error.message === "Unauthorized") {
            document.dispatchEvent(new CustomEvent("logout-attempt"));
          } else {
            errorView.show(error.message || "Failed to fetch workspaces");
          }
        });
    },
  );

  // Handle creating a post
  document.addEventListener(
    "createPostEvent",
    function (event: CustomEvent<CreatePostEvent>) {
      errorView.close(); // close any error display
      model
        .createPost(
          event.detail.postMsg,
          event.detail.channelName,
          event.detail.workspaceName,
        )
        .catch((error) => {
          if (error.message === "Failed to fetch") {
            errorView.showRetriableError(
              event,
              "Server not responding",
              new CustomEvent(""),
            );
          } else if (error.message === "Unauthorized") {
            document.dispatchEvent(new CustomEvent("logout-attempt"));
          } else if (error.message === "Not Found") {
            errorView.show("Your place in the channel has been lost. ");
            view.clearContentArea();
            view.clearChannelList();
            channelView.disable();
          } else {
            errorView.show(
              error.message || "Failed to rerender posts of channel",
            );
          }
        });
    },
  );

  // Reacting to a Post
  document.addEventListener(
    "reactEvent",
    function (event: CustomEvent<ReactEvent>) {
      errorView.close(); // close any error display
      model
        .doReaction(
          event.detail.reactionType,
          loginDialog.getUsername(),
          event.detail.postId,
          event.detail.clicked,
        )
        .catch((error) => {
          if (error.message === "Failed to fetch") {
            errorView.showRetriableError(
              event,
              "Server not responding",
              new CustomEvent(""),
            );
          } else if (error.message === "Unauthorized") {
            document.dispatchEvent(new CustomEvent("logout-attempt"));
          } else {
            errorView.show(error.message || "Failed to patch reactions");
          }
          // view.displayError(error.message || "Failed to patch reactions");
        });
    },
  );

  // Handle enabling reply mode for a post
  document.addEventListener(
    "replyModeOnEvent",
    function (event: CustomEvent<ReplyModeOnEvent>) {
      errorView.close(); // close any error display
      view.replyModeOn(
        event.detail.postId,
        event.detail.channelName,
        event.detail.workspaceName,
      );
    },
  );

  // Handle disabling reply mode for a post
  document.addEventListener(
    "replyModeOffEvent",
    function (event: CustomEvent<ReplyModeOffEvent>) {
      errorView.close(); // close any error display
      view.replyModeOff(event.detail.postId);
    },
  );

  // Creating a Reply
  document.addEventListener(
    "createReplyEvent",
    function (event: CustomEvent<CreateReplyEvent>) {
      errorView.close(); // close any error display
      model
        .createReply(
          event.detail.postMsg,
          event.detail.channelName,
          event.detail.workspaceName,
          event.detail.parent,
        )
        .catch((error) => {
          errorView.show(
            error.message || "Failed to rerender posts of channel",
          );
        });
    },
  );

  // Handle reversing a failed creation attempt (workspace/channel)
  document.addEventListener(
    "reverseCreateEvent",
    (event: CustomEvent<ReverseCreateEvent>) => {
      console.log("reverse create event", event);
      if (event.detail.isWorkspace) {
        view.reopenWorkspace(event.detail.uuid, event.detail.msg);
      } else {
        view.reopenChannel(event.detail.uuid, event.detail.msg);
      }
    },
  );

  // Handle reversing a failed deletion attempt (workspace/channel)
  document.addEventListener(
    "reverseDeleteEvent",
    (event: CustomEvent<ReverseDeleteEvent>) => {
      console.log("reverse delete event", event);
      if (event.detail.isWorkspace) {
        view.updateWorkspace(event.detail.uuid, event.detail.msg);
      } else {
        view.updateChannel(event.detail.uuid, event.detail.msg);
      }
    },
  );

  // Handle post updates from the subscription (SSE)
  document.addEventListener(
    "postUpdateEvent",
    (event: CustomEvent<PostUpdateEvent>) => {
      console.log("Post update event PATH: ", event.detail.path); // of form /workspaceName/channels/channelName...
      console.log("Post update event DOC: ", event.detail.doc);
      console.log("Post update META: ", event.detail.meta);

      const splitPath = event.detail.path.split("/");
      const workspaceName = splitPath[1];
      const channelName = splitPath[3];

      view.handleUpdate(
        channelName,
        event.detail,
        workspaceName,
        loginDialog.getUsername(),
      );
    },
  );

  // Handle subscription event
  document.addEventListener(
    "subscriptionErrorEvent",
    (event: CustomEvent<SubscriptionErrorEvent>) => {
      errorView.show(
        event.detail.error.message || "Failed to subscribe to posts",
      );
    },
  );
  slog.info("Using database", [
    "database",
    `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}`,
  ]);
}

document.addEventListener("DOMContentLoaded", () => {
  main();
});

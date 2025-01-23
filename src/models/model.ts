import type { JSONSchema, FromSchema } from "json-schema-to-ts";
import {
  workspaceSchema,
  channelSchema,
  postSchema,
  creationDeletionResponse,
  patchResponseSchema,
} from "../schemas/schema";
import { slog } from "../slog";

/**
 * Represents a Workspace object, including path, doc properties, and metadata.
 */
export type Workspace = {
  path: string;
  doc: {};
  meta: {
    createdAt: number;
    createdBy: string;
    lastModifiedAt: number;
    lastModifiedBy: string;
  };
};

/**
 * Represents a Channel object, including path, doc properties, and metadata.
 */
export type Channel = {
  path: string;
  doc: {};
  meta: {
    createdAt: number;
    createdBy: string;
    lastModifiedAt: number;
    lastModifiedBy: string;
  };
};

/**
 * Represents a set of reactions keyed by emoji strings, each mapping to an array of usernames who reacted.
 */
export type Reactions = {
  ":smile:": Array<string>;
  ":frown:": Array<string>;
  ":like:": Array<string>;
  ":celebrate:": Array<string>;
};

export type Extensions = {};

/**
 * Represents a response object after creating or deleting a resource.
 */
export type PostResponse = {
  uri: string;
};

/**
 * Represents a response object returned after applying a patch.
 */
export type PatchResponse = {
  uri: string;
  patchFailed: boolean;
  message: string;
};

// Types for EventSource
interface ESMessage {
  id: string;
  event: string;
  data: string;
}

interface ESInit extends RequestInit {
  headers?: Record<string, string>;
  onmessage?: (msg: ESMessage) => void;
  onerror?: (error: Error) => void;
  signal?: AbortSignal;
  openWhenHidden?: boolean;
}

type ESFunction = (input: RequestInfo, options: ESInit) => Promise<void>;

/**
 * Post type stored in OwlDB.
 */
export type PostModel = {
  path: string;
  doc: {
    msg: string;
    parent?: string;
    reactions?: Reactions;
    extensions?: {};
  };
  meta: {
    createdAt: number;
    createdBy: string;
    lastModifiedAt: number;
    lastModifiedBy: string;
  };
  //   extensions:
};

export type WorkspaceResponse = FromSchema<typeof WorkspaceSchema>;
export type ChannelResponse = FromSchema<typeof ChannelSchema>;

const WorkspaceSchema: JSONSchema = workspaceSchema;

const ChannelSchema: JSONSchema = channelSchema;

const PostSchema: JSONSchema = postSchema;

const CreationDeletionResponse: JSONSchema = creationDeletionResponse;

const PatchResponseSchema: JSONSchema = patchResponseSchema;

export type TypeGuard<T> = (data: unknown) => data is T;

/**
 * Wrapper around fetch to return a Promise that resolves to the desired type.
 *
 * Returns null if the response body is empty. Use isT() and isEmpty() to
 * validate.
 *
 * @param url      url to fetch from
 * @param validate TypeGuard that validates the response
 * @param options  fetch options
 * @returns        a Promise that resolves to the unmarshaled JSON response
 * @throws         an error if the fetch fails, there is no response body, or
 *                 the response is not valid JSON
 */
function typedFetch<T>(
  url: string,
  validate: TypeGuard<T>,
  options?: RequestInit,
  // timeout: number = 5000,
): Promise<T> {
  console.log("fetching url", url);

  const req: Request = new Request(url, options);
  return fetch(req).then((response: Response) => {
    console.log("response:", response);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.text().then((text: string) => {
      let data: unknown;

      if (text.length !== 0) {
        // Will throw an exception if the response is not valid JSON
        data = JSON.parse(text);
      }

      // Type of unmarshaled response needs to be validated
      if (validate(data)) {
        return data;
      }

      throw new Error(`invalid response: ${text}`);
    });
  });
}

/**
 * Encode a string to a URI component, ensuring certain characters are replaced.
 *
 * @param {string} name - The string to encode.
 * @returns {string} The encoded URI component.
 */
function format(name: string): string {
  return fixedEncodeURIComponent(name);
}

/**
 * A fixed version of encodeURIComponent that also encodes '.', '!', '(', ')', '*'.
 *
 * @param {string} str - The string to encode.
 * @returns {string} The encoded string.
 */
function fixedEncodeURIComponent(str: string): string {
  return encodeURIComponent(str).replace(/[\.!'()*]/g, function (c) {
    return "%" + c.charCodeAt(0).toString(16);
  });
}

/**
 * Model class for interacting with the backend database system. Provides methods to:
 * - Authenticate (login, logout)
 * - Retrieve and manage workspaces, channels, and posts
 * - Handle patch operations (e.g. reactions)
 * - Subscribe/unsubscribe to post updates via server-sent events
 */
export class Model {
  private static instance: Model;
  private url: string;
  private bearerToken: string | null = null;
  private isWorkspacesArray: (data: unknown) => data is Array<Workspace>;
  private isChannelArray: (data: unknown) => data is Array<Channel>;
  private isPostsArray: (data: unknown) => data is Array<PostModel>;
  private isPostData: (data: unknown) => data is PostModel;
  private eventSource: ESFunction;
  private controller: AbortController;
  private sseController: AbortController | null = null;
  private isCreationDeletionResponse: (data: unknown) => data is PostResponse;
  private isPatchResponse: (data: unknown) => data is PatchResponse;

  /**
   * Private constructor to enforce singleton pattern.
   *
   * @param {string} url - Base URL for data access.
   * @param {ESFunction} eventSource - A function to handle EventSource logic.
   * @param {<T>(schema: JSONSchema) => (data: unknown) => data is T} compileSchema - Function to compile a JSON schema into a TypeGuard.
   */
  private constructor(
    url: string,
    eventSource: ESFunction,
    compileSchema: <T>(schema: JSONSchema) => (data: unknown) => data is T,
  ) {
    this.url = url;
    this.isWorkspacesArray = compileSchema({
      type: "array",
      items: WorkspaceSchema,
    });
    this.isChannelArray = compileSchema({
      type: "array",
      items: ChannelSchema,
    });
    this.isPostsArray = compileSchema({
      $id: "posts.json",
      type: "array",
      items: PostSchema,
    });
    this.isPostData = compileSchema({
      $id: "post.json",
      ...postSchema,
    });

    this.isCreationDeletionResponse = compileSchema(CreationDeletionResponse);

    this.isPatchResponse = compileSchema(PatchResponseSchema);

    this.eventSource = eventSource;

    this.controller = new AbortController();
  }

  /**
   * Get or create the singleton Model instance.
   *
   * @param {string} url - Base URL for data.
   * @param {ESFunction} eventSource - EventSource function for subscriptions.
   * @param {<T>(schema: JSONSchema) => (data: unknown) => data is T} compileSchema - Schema compilation function.
   * @returns {Model} The singleton Model instance.
   */
  public static getInstance(
    url: string,
    eventSource: ESFunction,
    compileSchema: <T>(schema: JSONSchema) => (data: unknown) => data is T,
  ): Model {
    Model.instance = new Model(url, eventSource, compileSchema);
    return Model.instance;
  }

  /**
   * Logs in the user with the given username and retrieves a bearer token.
   *
   * @param {string} username - The username to log in.
   * @returns {Promise<void>} Promise that resolves when login is successful.
   * @throws Will throw an error if login fails.
   */
  public login(username: string): Promise<void> {
    const loginUrl = `${process.env.DATABASE_HOST}${process.env.AUTH_PATH}`;

    return fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Login request invalid");
        }
        return response.json();
      })
      .then((data) => {
        slog.debug("data", data);
        this.bearerToken = data.token;
      })
      .catch(() => {
        throw new Error("Login failed. Check your internet connection");
      });
  }

  /**
   * Logs out the currently logged-in user by invalidating the bearer token.
   *
   * @returns {Promise<void>} Promise that resolves when logout is successful.
   * @throws Will throw an error if not logged in or if logout fails.
   */
  public logout(): Promise<void> {
    if (!this.bearerToken) {
      throw new Error("Not logged in");
    }
    const logoutUrl = `${process.env.DATABASE_HOST}${process.env.AUTH_PATH}`;
    return fetch(logoutUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Logout failed");
        }
        this.bearerToken = null;
      })
      .catch(() => {
        throw new Error("Logout failed. Check your internet connection");
      });
  }

  /**
   * Retrieves an array of Workspaces from the server.
   *
   * @returns {Promise<Array<Workspace>>} Promise that resolves to an array of Workspaces.
   * @throws Will throw an error if not logged in or on network/validation errors.
   */
  public getWorkspaces(): Promise<Array<Workspace>> {
    if (!this.bearerToken) {
      throw new Error("Get Workspaces incomplete. Not logged in");
    }

    const signal = this.controller.signal;
    console.log("bearer token before request", this.bearerToken);
    const workspacesUrl = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}`;
    console.log("workspace url", workspacesUrl);
    return typedFetch<Array<Workspace>>(workspacesUrl, this.isWorkspacesArray, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.bearerToken}` },
      signal: signal,
    })
      .then((response) => {
        console.log(response);
        return response;
      })
      .catch((error: Error) => {
        if (signal.aborted) {
          throw new Error("Aborted.");
        } else {
          throw error;
        }
      });
  }

  /**
   * Creates a new workspace resource (no-overwrite mode) with the given name.
   *
   * @param {string} workspaceName - The name of the workspace to create.
   * @returns {Promise<PostResponse>} The response containing the resource URI.
   * @throws Will throw an error if not logged in or on network/validation errors.
   */
  public putWorkspace(workspaceName: string): Promise<PostResponse> {
    if (!this.bearerToken) {
      throw new Error("Not logged in");
    }

    const workspacesUrl = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}`;
    console.log("workspace url", workspacesUrl);
    console.log("workspace encoded name", workspaceName);
    console.log("bearer token before request", this.bearerToken);
    const finalURL =
      workspacesUrl +
      format(workspaceName) +
      "?" +
      new URLSearchParams({
        mode: "nooverwrite",
      });
    console.log("final workspace url", finalURL);
    return typedFetch<PostResponse>(finalURL, this.isCreationDeletionResponse, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      signal: this.controller.signal,
    })
      .then((response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        console.log("error", error, error.status);
        throw error;
      });
  }

  /**
   * Deletes a workspace with the given name.
   *
   * @param {string} workspaceName - The name of the workspace to delete.
   * @returns {Promise<PostResponse>} The response containing the resource URI of the deleted workspace.
   * @throws Will throw an error if not logged in or on network/validation errors.
   */
  public deleteWorkspace(workspaceName: string): Promise<PostResponse> {
    if (!this.bearerToken) {
      throw new Error("Delete Workspaces incomplete, Not logged in");
    }
    const workspacesUrl = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}`;
    console.log("workspace url", workspacesUrl);
    console.log("bearer token before request", this.bearerToken);
    return typedFetch<PostResponse>(
      workspacesUrl + `${format(workspaceName)}`,
      this.isCreationDeletionResponse,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          "Content-Type": "application/json",
        },
      },
    )
      .then((response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        console.log("error", error);
        throw error;
      });
  }

  /**
   * Retrieves an array of Channels for a given workspace.
   *
   * @param {string} workspace - The name of the workspace.
   * @returns {Promise<Array<Channel>>} Promise that resolves to an array of Channels.
   * @throws Will throw an error if not logged in or on network/validation errors.
   */
  public getChannels(workspace: string): Promise<Array<Channel>> {
    if (!this.bearerToken) {
      throw new Error("Not logged in");
    }

    const channelUrl = `${this.url}${format(workspace)}/channels/`;
    console.log("channel url", channelUrl);
    return typedFetch<Array<Channel>>(channelUrl, this.isChannelArray, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.bearerToken}` },
      signal: this.controller.signal,
    });
  }

  /**
   * Creates the channels document for a given workspace, if it doesn't exist.
   *
   * @param {string} workspace - The workspace name.
   * @returns {Promise<unknown>} The creation response or null if empty.
   * @throws Will throw an error if not logged in or on network/validation errors.
   */
  public createChannelsDocument(workspace: string): Promise<unknown> {
    if (!this.bearerToken) {
      throw new Error("Not logged in");
    }
    const channelUrl = `${this.url}${format(workspace)}/channels/`;
    console.log("channel url", channelUrl);
    return typedFetch(channelUrl, this.isCreationDeletionResponse, {
      method: "PUT",
      headers: { Authorization: `Bearer ${this.bearerToken}` },
    })
      .then((response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        console.log("error", error);
        throw error;
      });
  }

  /**
   * Creates a channel within a given workspace.
   *
   * @param {string} workspace - The workspace name.
   * @param {string} channel - The channel name.
   * @returns {Promise<PostResponse>} The response containing the created channel's URI.
   * @throws Will throw an error if not logged in or on network/validation errors.
   */
  public putChannel(workspace: string, channel: string): Promise<PostResponse> {
    if (!this.bearerToken) {
      throw new Error("Not logged in");
    }
    const channelUrl =
      `${this.url}${format(workspace)}/channels/${format(channel)}` +
      "?" +
      new URLSearchParams({
        mode: "nooverwrite",
      });
    console.log("channel url", channelUrl);
    return typedFetch(channelUrl, this.isCreationDeletionResponse, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        console.log("error", error);
        throw error;
      });
  }

  /**
   * Deletes a channel within a given workspace.
   *
   * @param {string} workspace - The workspace name.
   * @param {string} channel - The channel name.
   * @returns {Promise<PostResponse>} The response containing the deleted channel's URI.
   * @throws Will throw an error if not logged in or on network/validation errors.
   */
  public deleteChannel(
    workspace: string,
    channel: string,
  ): Promise<PostResponse> {
    if (!this.bearerToken) {
      throw new Error("Not logged in");
    }
    const channelUrl = `${this.url}${format(workspace)}/channels/${format(channel)}`;
    console.log("workspace url", channelUrl);
    console.log("bearer token before request", this.bearerToken);
    return typedFetch<PostResponse>(
      channelUrl,
      this.isCreationDeletionResponse,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          "Content-Type": "application/json",
        },
      },
    )
      .then((response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        console.log("error", error);
        throw error;
      });
  }

  /**
   * Creates the posts document for a given channel in a given workspace, if it doesn't exist.
   *
   * @param {string} workspace - The workspace name.
   * @param {string} channel - The channel name.
   * @returns {Promise<unknown>} The creation response or null if empty.
   * @throws Will throw an error if not logged in or on network/validation errors.
   */
  public putPostsDocument(
    workspace: string,
    channel: string,
  ): Promise<unknown> {
    if (!this.bearerToken) {
      throw new Error("Not logged in");
    }
    const channelUrl = `${this.url}${format(workspace)}/channels/${format(channel)}/posts/`;
    console.log("channel url", channelUrl);
    return typedFetch(channelUrl, this.isCreationDeletionResponse, {
      method: "PUT",
      headers: { Authorization: `Bearer ${this.bearerToken}` },
    })
      .then((response) => {
        console.log(response);
        return response;
      })
      .catch((error) => {
        console.log("error", error);
        throw error;
      });
  }

  /**
   * Get the post in the given workspace and channel with the given uri.
   *
   * @returns a promise that resolves to a PostModel.
   */
  public getPost(uri: string): Promise<PostModel> {
    // Should use a real TypeGuard that validates the response
    return typedFetch<PostModel>(
      `${process.env.DATABASE_HOST}${uri}`,
      this.isPostData,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${this.bearerToken}` },
      },
    );
  }

  /**
   * Get all posts in the given workspace and channel.
   *
   * @returns a promise that resolves to an array of PostModels.
   */
  public getAllPosts(
    channelName: string,
    workspaceName: string,
  ): Promise<Array<PostModel>> {
    if (!this.bearerToken) {
      throw new Error("Not logged in");
    }

    return typedFetch<Array<PostModel>>(
      `${this.url}${format(workspaceName)}/channels/${format(channelName)}/posts/`,
      this.isPostsArray,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${this.bearerToken}` },
        signal: this.controller.signal,
      },
    );
  }

  /**
   * Create a new post in a given channel in a given workspace.
   *
   * @param {string} postContent - The message content of the post.
   * @param {string} channelName - The channel name.
   * @param {string} workspaceName - The workspace name.
   * @returns {Promise<PostResponse>} The response containing the new post's URI.
   * @throws Will throw if not logged in or on network/validation errors.
   */
  public createPost(
    postContent: string,
    channelName: string,
    workspaceName: string,
  ): Promise<PostResponse> {
    const reactions: Reactions = {
      ":smile:": [],
      ":frown:": [],
      ":like:": [],
      ":celebrate:": [],
    };
    const extensions: Extensions = {};
    console.log("inside createPost()");
    console.log(
      `${this.url}${format(workspaceName)}/channels/${format(channelName)}/posts/`,
    );
    return typedFetch<PostResponse>(
      `${this.url}${format(workspaceName)}/channels/${format(channelName)}/posts/`,
      this.isCreationDeletionResponse, // TypeGuard to validate the response
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          "Content-Type": "application/json", // Ensure the content type is set
        },
        body: JSON.stringify({
          msg: postContent,
          parent: "",
          reactions: reactions,
          extensions: extensions,
        }), // Send post content in the body
      },
    );
  }

  /**
   * Create a reply (child post) for a given parent post within a channel and workspace.
   *
   * @param {string} postContent - The reply's message content.
   * @param {string} channelName - The channel name.
   * @param {string} workspaceName - The workspace name.
   * @param {string} parent - The URI or ID of the parent post.
   * @returns {Promise<PostResponse>} The response containing the new reply's URI.
   * @throws Will throw if not logged in or on network/validation errors.
   */
  public createReply(
    postContent: string,
    channelName: string,
    workspaceName: string,
    parent: string,
  ): Promise<PostResponse> {
    const reactions: Reactions = {
      ":smile:": [],
      ":frown:": [],
      ":like:": [],
      ":celebrate:": [],
    };
    const extensions: Extensions = {};

    return typedFetch<PostResponse>(
      `${this.url}${workspaceName}/channels/${channelName}/posts/`,
      this.isCreationDeletionResponse, // TypeGuard to validate the response
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          "Content-Type": "application/json", // Ensure the content type is set
        },
        body: JSON.stringify({
          msg: postContent,
          parent: parent,
          reactions: reactions,
          extensions: extensions,
        }), // Send post content in the body
      },
    );
  }

  /**
   * Initialize reactions for a post if they don't already exist, and add a specific reaction type.
   *
   * @param {string} reactionType - The type of reaction to initialize.
   * @param {string} postId - The post ID or URI.
   * @returns {Promise<PatchResponse>} The response describing the patch result.
   * @throws Will throw if not logged in or on network/validation errors.
   */
  public initReaction(
    reactionType: string,
    postId: string,
  ): Promise<PatchResponse> {
    const formattedpostId = `${this.url}${postId.split("/").map(format).join("/").substring(1)}`;
    slog.info("formatted reaction id", ["id", formattedpostId]);

    return typedFetch<PatchResponse>(
      `${formattedpostId}`,
      this.isPatchResponse, // TypeGuard to validate the response
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          "Content-Type": "application/json", // Ensure the content type is set
        },
        body: JSON.stringify([
          {
            op: "ObjectAdd",
            path: `/reactions`,
            value: {},
          },
          {
            op: "ObjectAdd",
            path: `/reactions/:${reactionType}:`,
            value: [],
          },
        ]), // Send patch content in the body
      },
    );
  }

  /**
   * Add or remove a user's reaction on a post.
   *
   * @param {string} reactionType - The type of reaction.
   * @param {string} username - The user's name.
   * @param {string} postId - The post ID or URI.
   * @param {boolean} clicked - If true, remove the reaction; otherwise add it.
   * @returns {Promise<PatchResponse>} The response describing the patch result.
   * @throws Will throw if not logged in or on network/validation errors.
   */
  public doReaction(
    reactionType: string,
    username: string,
    postId: string,
    clicked: boolean,
  ): Promise<PatchResponse> {
    const formattedpostId = `${this.url}${postId.split("/").map(format).join("/").substring(1)}`;
    slog.info("formatted reaction id", ["id", formattedpostId]);
    if (clicked) {
      // Unreact handler
      return typedFetch<PatchResponse>(
        `${formattedpostId}`,
        this.isPatchResponse, // TypeGuard to validate the response
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
            "Content-Type": "application/json", // Ensure the content type is set
          },
          body: JSON.stringify([
            {
              op: "ObjectAdd",
              path: `/reactions`,
              value: {},
            },
            {
              op: "ObjectAdd",
              path: `/reactions/:${reactionType}:`,
              value: [],
            },
            {
              op: "ArrayRemove",
              path: `/reactions/:${reactionType}:`,
              value: username,
            },
          ]), // Send patch content in the body
        },
      );
    } else {
      // React handler
      return typedFetch<PatchResponse>(
        `${formattedpostId}`,
        this.isPatchResponse, // TypeGuard to validate the response
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
            "Content-Type": "application/json", // Ensure the content type is set
          },
          body: JSON.stringify([
            {
              op: "ObjectAdd",
              path: `/reactions`,
              value: {},
            },
            {
              op: "ObjectAdd",
              path: `/reactions/:${reactionType}:`,
              value: [],
            },
            {
              op: "ArrayAdd",
              path: `/reactions/:${reactionType}:`,
              value: username,
            },
          ]), // Send patch content in the body
        },
      );
    }
  }

  /**
   * Subscribe to post updates for a given workspace and channel. Received posts trigger a "postUpdateEvent".
   *
   * @param {string} workspaceName - The workspace name.
   * @param {string} channelName - The channel name.
   * @returns {Promise<void>} Resolves when subscription is initialized.
   * @throws Will throw if not logged in or on SSE errors.
   */
  public subscribeToPosts(
    workspaceName: string,
    channelName: string,
  ): Promise<void> {
    const channelUrl = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${format(workspaceName)}/channels/${format(channelName)}/posts/`;
    this.sseController = new AbortController(); //might need

    this.eventSource(
      channelUrl + "?" + new URLSearchParams({ mode: "subscribe" }),
      {
        onmessage: (msg: ESMessage) => {
          console.log("received msg", msg);

          const postData: unknown = JSON.parse(msg.data);
          if (this.isPostData(postData)) {
            console.log("emitting event", postData);
            const postUpdateEvent = new CustomEvent("postUpdateEvent", {
              detail: {
                path: postData.path,
                doc: postData.doc,
                meta: postData.meta,
              },
            });

            // Dispatch the event to the window
            document.dispatchEvent(postUpdateEvent);
          } else {
            console.error("Invalid post data received");
            document.dispatchEvent(
              new CustomEvent("subscriptionErrorEvent", {
                detail: {
                  error: new Error("Invalid post data received"),
                },
              }),
            );
            // console.error("Invalid post data received");
          }
        },

        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
        signal: this.sseController.signal,
        openWhenHidden: true,
      },
    ).catch((error: Error) => {
      console.error("Error in event source", error);
      document.dispatchEvent(
        new CustomEvent("subscriptionErrorEvent", {
          detail: {
            error: error,
          },
        }),
      );
      this.unsubscribeFromPosts();
    });

    return Promise.resolve();
  }

  /**
   * Unsubscribe from post updates
   */
  public unsubscribeFromPosts() {
    this.sseController?.abort();
    this.sseController = null;
  }

  /**
   * Abort previous requests
   */
  public abortPreviousRequests() {
    this.controller.abort("Stopped previous selections");
    this.controller = new AbortController();
  }
}

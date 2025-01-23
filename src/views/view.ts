import { ChannelContent } from "../components/channel-content";
import { PostElement } from "../components/post-element";
import { ContainerItem } from "../components/container-item";
import { ReplyBox } from "../components/reply-box";

/**
 * Fired when a workspace is selected.
 */
export type SelectWorkspaceEvent = {
  workspaceName: string;
  channelName: string;
  uuid: string;
};

/**
 * Fired when a channel is selected.
 */
export type SelectChannelEvent = {
  workspaceName: string;
  channelName: string;
  uuid: string;
};

/**
 * Fired when a workspace is created.
 */
export type CreateWorkspaceEvent = {
  workspaceName: string;
  channelName: string;
  uuid: string;
};

/**
 * Fired when a channel is created.
 */
export type CreateChannelEvent = {
  workspaceName: string;
  channelName: string;
  uuid: string;
};

/**
 * Fired when a workspace is deleted.
 */
export type DeleteWorkspaceEvent = {
  workspaceName: string;
  channelName: string;
  uuid: string;
};

/**
 * Fired when a channel is deleted.
 */
export type DeleteChannelEvent = {
  workspaceName: string;
  channelName: string;
  uuid: string;
};

export type RefreshWorkspaceEvent = {};

/**
 * Fired when a post is created.
 */
export type CreatePostEvent = {
  postMsg: string;
  channelName: string;
  workspaceName: string;
};

/**
 * Fired when a reaction is applied or removed from a post.
 */
export type ReactEvent = {
  reactionType: string;
  postId: string;
  clicked: boolean;
};

/**
 * Fired when the channel list should be refreshed.
 */
export type RefreshChannelEvent = {
  workspaceName: string;
};

/**
 * Fired when reply mode is enabled for a post.
 */
export type ReplyModeOnEvent = {
  postId: string;
  channelName: string;
  workspaceName: string;
};

/**
 * Fired when reply mode is disabled for a post.
 */
export type ReplyModeOffEvent = {
  postId: string;
};

/**
 * Fired when a reply to a post is created.
 */
export type CreateReplyEvent = {
  postMsg: string;
  channelName: string;
  workspaceName: string;
  parent: string;
};

/**
 * Fired when creation of a workspace or channel fails and must be reverted.
 */
export type ReverseCreateEvent = {
  msg: string;
  uuid: string;
  isWorkspace: boolean;
};

/**
 * Fired when deletion of a workspace or channel fails and must be reverted.
 */
export type ReverseDeleteEvent = {
  msg: string;
  uuid: string;
  isWorkspace: boolean;
};

/**
 * Fired when a subscription (SSE) fails.
 */
export type SubscriptionErrorEvent = {
  error: Error;
};

/**
 * Fired when a post is updated via subscription (SSE).
 */
export type PostUpdateEvent = {
  path: string;
  doc: {
    msg: string;
    parent?: string;
    reactions?: ViewReactions;
    extensions?: {};
  };
  meta: {
    createdAt: number;
    createdBy: string;
    lastModifiedAt: number;
    lastModifiedBy: string;
  };
};

// Declare custom event types
declare global {
  interface DocumentEventMap {
    createWorkspaceEvent: CustomEvent<CreateWorkspaceEvent>; // create workspace event
    deleteWorkspaceEvent: CustomEvent<DeleteWorkspaceEvent>; // delete workspace event
    selectWorkspaceEvent: CustomEvent<SelectWorkspaceEvent>; // select workspace event
    selectChannelEvent: CustomEvent<SelectChannelEvent>; // select channel event
    refreshWorkspaceEvent: CustomEvent<RefreshWorkspaceEvent>; // refresh workspace event
    createPostEvent: CustomEvent<CreatePostEvent>; // create post event
    createChannelEvent: CustomEvent<CreateChannelEvent>; // create channel event
    deleteChannelEvent: CustomEvent<DeleteChannelEvent>; // delete channel event
    reactEvent: CustomEvent<ReactEvent>; // react event
    refreshChannelEvent: CustomEvent<RefreshChannelEvent>; // refresh channel event
    replyModeOnEvent: CustomEvent<ReplyModeOnEvent>; // reply mode on event
    replyModeOffEvent: CustomEvent<ReplyModeOffEvent>; // reply mode off event
    createReplyEvent: CustomEvent<CreateReplyEvent>; // create reply event
    reverseCreateEvent: CustomEvent<ReverseCreateEvent>; // reverse create event
    reverseDeleteEvent: CustomEvent<ReverseDeleteEvent>; //
    subscriptionErrorEvent: CustomEvent<SubscriptionErrorEvent>;
    postUpdateEvent: CustomEvent<PostUpdateEvent>;
  }
}

type ViewReactions = {
  ":smile:": Array<string>;
  ":frown:": Array<string>;
  ":like:": Array<string>;
  ":celebrate:": Array<string>;
};

type ViewWorkspace = {
  path: string;
  doc: {};
  meta: {
    createdAt: number;
    createdBy: string;
    lastModifiedAt: number;
    lastModifiedBy: string;
  };
};

type ViewChannel = {
  path: string;
  doc: {};
  meta: {
    createdAt: number;
    createdBy: string;
    lastModifiedAt: number;
    lastModifiedBy: string;
  };
};

type ViewPost = {
  path: string;
  doc: {
    msg: string;
    parent?: string;
    reactions?: ViewReactions;
    extensions?: {};
  };
  meta: {
    createdAt: number;
    createdBy: string;
    lastModifiedAt: number;
    lastModifiedBy: string;
  };
  children?: Array<ViewPost>;
};

/**
 * Initialize and return the main View instance.
 *
 * @returns {View} The initialized View.
 * @throws Will throw if required DOM elements are not found.
 */
export function initView(): View {
  const workspaceList = document.querySelector("#workspace-list");
  const channelList = document.querySelector("#channels-list");
  const contentArea = document.querySelector("#content-area");
  // Ensure that the elements exist and are of the correct type
  if (!(workspaceList instanceof HTMLUListElement)) {
    console.error("Error: #workspace-list is not a UL list:", workspaceList);
    throw new Error("list does not exist");
  }

  if (!(channelList instanceof HTMLUListElement)) {
    console.error("Error: #channels-list is not a UL list:", channelList);
    throw new Error("list does not exist");
  }

  // Ensure that the elements exist and are of the correct type
  if (!(contentArea instanceof HTMLElement)) {
    console.error("Error: Element for contentArea not found: ", contentArea);
    throw new Error("contentArea does not exist");
  }

  return new View(workspaceList, channelList, contentArea);
}

/**
 * The View class is responsible for:
 * - Managing and rendering the list of workspaces and channels.
 * - Displaying channel content, including posts and replies.
 * - Handling updates to posts, such as new replies and reaction changes.
 * - Managing reply mode (where a user can reply to a specific post).
 */
export class View {
  private workspaceList: HTMLUListElement; // The list of workspaces
  private channelList: HTMLUListElement; // The list of channels
  private contentArea: HTMLElement; // The content area
  private currContent: ChannelContent; // The current content area
  private activePosts: Map<string, PostElement>; // this maps path to element
  private replyBuffer: Map<string, PostElement>; // this maps PARENT's path to element
  private activeReply: string | null; // path of the post that is currently in reply mode
  private activeReplyBox: ReplyBox | null; // the reply box that is currently active

  /**
   * Constructs a new View instance.
   *
   * @param {HTMLUListElement} workspaceList - The UL element displaying workspaces.
   * @param {HTMLUListElement} channelList - The UL element displaying channels.
   * @param {HTMLElement} contentArea - The main content area where channel posts are displayed.
   */
  constructor(
    workspaceList: HTMLUListElement,
    channelList: HTMLUListElement,
    contentArea: HTMLElement,
  ) {
    // Store references to the DOM elements
    this.workspaceList = workspaceList;
    this.channelList = channelList;
    this.contentArea = contentArea;

    // Initialize the current content area
    this.currContent = new ChannelContent("no channel", "no workspace");
    this.activePosts = new Map();
    this.replyBuffer = new Map();
    this.activeReply = null;
    this.activeReplyBox = null;
  }

  /**
   * Display all of the given Workspaces (and remove any others).
   *
   * @param workspaces array of Workspaces to display
   */
  public displayAllWorkspaces(workspaces: Array<ViewWorkspace>): void {
    // Clear the workspace list
    let i = 0;
    for (
      ;
      i < Math.min(this.workspaceList.children.length, workspaces.length);
      i++
    ) {
      // Check if the workspace at this index is the same as the new workspace
      const newWorkspace = workspaces[i];
      const existingWorkspace = this.workspaceList.children[i];

      // Check if the existing workspace is a ContainerItem
      if (!(existingWorkspace instanceof ContainerItem)) {
        throw new Error("workspace not found" + existingWorkspace);
      }

      // Check if the existing workspace has the same name as the new workspace
      if (newWorkspace.path.split("/")[3] !== existingWorkspace.getName()) {
        existingWorkspace.remove();
        i--;
      }
    }

    if (i < workspaces.length) {
      for (; i < workspaces.length; i++) {
        const currWorkspace = workspaces[i];
        // Create a new instance of our web component
        const workspace = new ContainerItem("Workspace");
        if (!workspace.shadowRoot) {
          throw new Error("workspace shadowRoot not properly initialized");
        }

        // Find the workspace label in the shadow DOM
        const workspaceLabel = workspace.shadowRoot.querySelector("label");
        if (!(workspaceLabel instanceof HTMLLabelElement)) {
          throw new Error("workspace label not found");
        }

        // Set the workspace's label to the workspace component of the path
        workspaceLabel.textContent = currWorkspace.path.split("/")[1];
        this.workspaceList.append(workspace);
      }
    } else if (i < this.workspaceList.children.length) {
      for (; i < this.workspaceList.children.length; i++) {
        // Remove any extra workspaces
        const existingWorkspace = this.workspaceList.children[i];
        if (!(existingWorkspace instanceof ContainerItem)) {
          throw new Error("channel not found");
        }
        existingWorkspace.remove();
        i--;
      }
    }
  }

  /**
   * Display all of the given channels (and remove any others).
   *
   * @param channels array of channels to display
   */
  public displayAllChannels(
    channels: Array<ViewChannel>,
    workspaceName: string,
  ): void {
    if (this.channelList.children.length === 0) {
    }
    let i = 0;
    for (
      ;
      i < Math.min(this.channelList.children.length, channels.length);
      i++
    ) {
      // Check if the channel at this index is the same as the new channel
      const newChannel = channels[i];
      const existingChannel = this.channelList.children[i];
      // Check if the existing channel is a ContainerItem
      if (!(existingChannel instanceof ContainerItem)) {
        throw new Error("channel not found");
      }
      if (newChannel.path.split("/")[3] !== existingChannel.getName()) {
        existingChannel.remove();
        i--;
      }
    }

    // Add any new channels
    if (i < channels.length) {
      for (; i < channels.length; i++) {
        const newChannel = channels[i];
        const channel = new ContainerItem("Channel");
        // Check if the channel has a shadowRoot
        if (!channel.shadowRoot) {
          throw new Error("channel shadowRoot not properly initialized");
        }
        // Find the channel label in the shadow DOM
        const channelLabel = channel.shadowRoot.querySelector("label");
        if (!(channelLabel instanceof HTMLLabelElement)) {
          throw new Error("channel label not found");
        }
        // Set the channel's parent name in the container item component
        channel.setParentName(workspaceName);
        // Set the channel's label to the channel component of the path
        channelLabel.textContent = newChannel.path.split("/")[3];
        this.channelList.append(channel);
      }
    } else if (i < this.channelList.children.length) {
      for (; i < this.channelList.children.length; i++) {
        const existingChannel = this.channelList.children[i];
        if (!(existingChannel instanceof ContainerItem)) {
          throw new Error("channel not found");
        }
        existingChannel.remove();
        i--;
      }
    }
  }

  /**
   * Update a workspace item to reflect successful creation or another post-creation state.
   *
   * @param {string} uuid - The workspace's unique ID.
   * @param {string|null} msg - An optional message (e.g. error message).
   */
  public updateWorkspace(uuid: string, msg: string | null = null): void {
    // Create a new instance of our web component
    const finishedWorkspace = this.workspaceList.querySelector(
      `[data-id="${uuid}"]`,
    );
    if (
      !(
        finishedWorkspace instanceof ContainerItem &&
        finishedWorkspace.getType() === "Workspace"
      )
    ) {
      throw new Error("in View, workspace not found");
    }

    finishedWorkspace.enableItem();
    if (msg) {
      finishedWorkspace.showError(msg);
    }
  }

  /**
   * Update a channel item to reflect successful creation or another post-creation state.
   *
   * @param {string} uuid - The channel's unique ID.
   * @param {string|null} msg - An optional message (e.g. error message).
   */
  public updateChannel(uuid: string, msg: string | null = null): void {
    // Create a new instance of our web component
    const finishedChannel = this.channelList.querySelector(
      `[data-id="${uuid}"]`,
    );
    if (
      !(
        finishedChannel instanceof ContainerItem &&
        finishedChannel.getType() === "Channel"
      )
    ) {
      throw new Error("in View, channel not found");
    }
    finishedChannel.enableItem();
    if (msg) {
      finishedChannel.showError(msg);
    }
  }

  /**
   * Reopen a workspace item for editing after a failed creation, showing an error message.
   *
   * @param {string} uuid - The workspace's unique ID.
   * @param {string} errorMsg - The error message to display.
   */
  public reopenWorkspace(uuid: string, errorMsg: string): void {
    console.log("reopening workspace");
    const finishedWorkspace = this.workspaceList.querySelector(
      `[data-id="${uuid}"]`,
    );
    if (
      !(
        finishedWorkspace instanceof ContainerItem &&
        finishedWorkspace.getType() === "Workspace"
      )
    ) {
      throw new Error("in View, workspace not found");
    }

    // Re-enable the workspace item and show the error message
    finishedWorkspace.enableItem();
    finishedWorkspace.clickEditBtn();
    finishedWorkspace.showError(errorMsg);
  }

  /**
   * Reopen a channel item for editing after a failed creation, showing an error message.
   *
   * @param {string} uuid - The channel's unique ID.
   * @param {string} errorMsg - The error message to display.
   */
  public reopenChannel(uuid: string, errorMsg: string): void {
    const finishedChannel = this.channelList.querySelector(
      `[data-id="${uuid}"]`,
    );
    if (
      !(
        finishedChannel instanceof ContainerItem &&
        finishedChannel.getType() === "Channel"
      )
    ) {
      throw new Error("in View, workspace not found");
    }

    // Re-enable the channel item and show the error message
    finishedChannel.enableItem();
    finishedChannel.clickEditBtn();
    finishedChannel.showError(errorMsg);
  }

  /**
   * Delete a workspace item from the UI.
   *
   * @param {string} uuid - The workspace's unique ID.
   */
  public deleteWorkspace(uuid: string): void {
    // Create a new instance of our web component
    const finishedWorkspace = this.workspaceList.querySelector(
      `[data-id="${uuid}"]`,
    );
    if (
      !(
        finishedWorkspace instanceof ContainerItem &&
        finishedWorkspace.getType() === "Workspace"
      )
    ) {
      throw new Error("in View, workspace not found");
    }

    finishedWorkspace.remove();
  }

  /**
   * Delete a channel item from the UI.
   *
   * @param {string} uuid - The channel's unique ID.
   */
  public deleteChannel(uuid: string): void {
    // Create a new instance of our web component
    const finishedChannel = this.channelList.querySelector(
      `[data-id="${uuid}"]`,
    );
    if (
      !(
        finishedChannel instanceof ContainerItem &&
        finishedChannel.getType() === "Channel"
      )
    ) {
      throw new Error("in View, channel not found");
    }

    // Remove the channel item from the list
    finishedChannel.remove();
  }

  /**
   * Display an error message in the workspace list area.
   *
   * @param {string} message - The error message to display.
   */
  public workspacesError(message: string): void {
    this.workspaceList.innerHTML = `<p>${message}</p>`;
    this.workspaceList.setAttribute("color", "red;");
    this.workspaceList.classList.add("small");
  }

  /**
   * Display an error message in the channel list area.
   *
   * @param {string} message - The error message to display.
   */
  public channelError(message: string): void {
    this.channelList.innerHTML = `<p>${message}</p>`;
  }

  /**
   * Display channel content (posts and replies) in the main content area.
   *
   * @param {string} channelName - The channel name.
   * @param {Array<ViewPost>} posts - The posts to display.
   * @param {string} workspaceName - The workspace name.
   * @param {string} username - The logged-in user's username.
   */
  public displayChannelContent(
    channelName: string,
    posts: Array<ViewPost>,
    workspaceName: string,
    username: string,
  ): void {
    this.contentArea.innerHTML = "";
    this.activePosts.clear();

    const content = new ChannelContent(channelName, workspaceName);
    this.currContent = content;
    let structuredPosts: Array<ViewPost> = [];

    posts.forEach((post: ViewPost) => {
      // Converting all PostModel to ViewPost
      let newViewPost = {
        path: post.path,
        doc: post.doc,
        meta: post.meta,
        children: [], // Initialize an empty array for child posts
      };
      structuredPosts.push(newViewPost);
      // Checking posts that are replies (parent attribute is not empty) --> add replies
      // into the children array for that parent post
      if (
        "parent" in Object.keys(newViewPost.doc) &&
        newViewPost.doc.parent !== ""
      ) {
        console.log(
          "not a top level post:",
          post.path,
          "; parent is: ",
          post.doc.parent,
        );
        structuredPosts.forEach((parentPost: ViewPost) => {
          if (
            parentPost.children &&
            newViewPost.doc.parent === parentPost.path
          ) {
            parentPost.children.push(newViewPost);
            console.log(parentPost.children);
          }
        });
      }
    });

    structuredPosts.forEach((post: ViewPost) => {
      if (!post.children) {
        throw new Error("Root post does not have children");
      }
      if (!post.doc.parent) {
        console.log("top level post: ", post.path);

        const newPostElement = this.createNestedPosts(
          post,
          username,
          channelName,
          workspaceName,
        );
        content.displayPost(newPostElement);
      }
    });
    content.focusPostBox();
    const inputBox = content.returnReplyBox();
    this.contentArea.append(content);
    inputBox.focus();
  }

  /**
   * Recursively create post elements for a post and its children, nesting replies.
   *
   * @private
   * @param {ViewPost} post - The post to render.
   * @param {string} username - The current username.
   * @param {string} channelName - The channel name.
   * @param {string} workspaceName - The workspace name.
   * @returns {PostElement} The root PostElement for this post.
   */
  private createNestedPosts(
    post: ViewPost,
    username: string,
    channelName: string,
    workspaceName: string,
  ): PostElement {
    const newPostElement = new PostElement(
      `${post.meta.createdBy} - ${new Date(post.meta.createdAt).toLocaleString()}`,
      post.doc.msg,
      post.doc.reactions,
      `${post.path}`,
      username,
      channelName,
      workspaceName,
      post.meta.createdAt,
    );
    this.activePosts.set(`${post.path}`, newPostElement);

    if (post.children?.length) {
      post.children.forEach((child: ViewPost) => {
        console.log(post.path, " has a child: ", child.path);
        if (!child.children) {
          throw new Error("Child post has no children");
        }

        // const childPostElement = new PostElement(`${child.meta.createdBy} - ${new Date(child.meta.createdAt).toLocaleString()}`,
        // child.doc.msg, child.doc.reactions, child.path, username, channelName, workspaceName);

        const childPostElement = this.createNestedPosts(
          child,
          username,
          channelName,
          workspaceName,
        );

        newPostElement.addReply(childPostElement);
      });
    } else {
      console.log(post.path, " has no children");
    }

    return newPostElement;
  }

  public clearContentArea(): void {
    this.contentArea.innerHTML = "";
  }

  public clearChannelList(): void {
    this.channelList.innerHTML = "";
  }

  /**
   * Handle a post update from a subscription (SSE), inserting or updating posts in the view.
   *
   * @param {string} channelName - The channel name.
   * @param {ViewPost} post - The updated post data.
   * @param {string} workspaceName - The workspace name.
   * @param {string} username - The current username.
   */
  public handleUpdate(
    channelName: string,
    post: ViewPost,
    workspaceName: string,
    username: string,
  ): void {
    console.log("handling update for post", post.path);
    console.log("username of update: ", username);
    if (this.activePosts.has(post.path) && post.doc.reactions) {
      console.log(
        "post already exists in activePosts, means this SSE update is a reaction",
      );
      this.updateReactions(post.doc.reactions, post.path, username);
      return;
    }

    const newPostElement = new PostElement(
      `${post.meta.createdBy} - ${new Date(post.meta.createdAt).toLocaleString()}`,
      post.doc.msg,
      post.doc.reactions,
      post.path,
      username,
      channelName,
      workspaceName,
      post.meta.createdAt,
    );

    this.activePosts.set(newPostElement.getPath(), newPostElement);
    console.log("path set in activePosts: ", newPostElement.getPath());

    // Check if the new post is a reply to an existing post
    let parentPost;
    if (post.doc.parent && post.doc.parent !== "") {
      parentPost = this.activePosts.get(post.doc.parent);
      console.log(parentPost);
      if (!parentPost) {
        this.replyBuffer.set(post.doc.parent, newPostElement);
        return;
      }
    } else {
      parentPost = undefined;
    }

    // Get the list of posts or replies to insert into
    let postList: PostElement[];
    if (parentPost) {
      postList = Array.from(parentPost.getReplies().children) as PostElement[];
    } else {
      postList = Array.from(
        this.currContent.getTopLevelPosts().children,
      ) as PostElement[];
    }

    // Insert the new post element into the correct position in the list
    this.insertPost(newPostElement, parentPost, postList);

    // Scroll to the new post element
    if (post.doc.parent && post.meta.createdBy === username) {
      this.replyModeOff(post.doc.parent);
      newPostElement.scrollIntoView();
    }
  }

  /**
   * Inserts a new post element into the correct position in the sorted list of posts or replies.
   *
   * @private
   * @param {PostElement} newPostElement - The new post to insert.
   * @param {PostElement|undefined} parentPost - The parent post, if this is a reply.
   * @param {PostElement[]} postList - The current list of posts or replies to insert into.
   */
  private insertPost(
    newPostElement: PostElement,
    parentPost: PostElement | undefined,
    postList: PostElement[],
  ): void {
    let earliestDate = Infinity;
    let insertHere: PostElement | unknown = null;
    // Find the earliest date in the list of posts
    postList.forEach((reply) => {
      if (reply instanceof PostElement) {
        const currDate = reply.getCreateDate();
        console.log("compare against post created at ", currDate);
        if (
          newPostElement.getCreateDate() < currDate &&
          currDate < earliestDate
        ) {
          console.log("early exit");
          earliestDate = currDate;
          insertHere = reply;
        }
      }
    });

    // Insert the new post element before the earliest post
    if (insertHere instanceof PostElement) {
      insertHere.insertAdjacentElement("beforebegin", newPostElement);
    } else {
      if (parentPost) {
        parentPost.addReply(newPostElement);
      } else {
        this.currContent.displayPost(newPostElement);
      }
    }

    const newPostPath = newPostElement.getPath();

    // Check if the new post is a reply to an existing post
    this.replyBuffer.forEach(
      (value: PostElement, key: string, map: Map<string, PostElement>) => {
        if (key === newPostPath) {
          const newPostReplies = Array.from(
            newPostElement.getReplies().children,
          ) as PostElement[];
          this.insertPost(value, newPostElement, newPostReplies);
        }
      },
    );
  }

  public logActivePosts() {
    console.log(this.activePosts);
  }

  /**
   * Enables reply mode for a specific post, hiding the main post box and showing a reply box.
   *
   * @param {string} postId - The ID of the post to reply to.
   * @param {string} channelName - The channel name.
   * @param {string} workspaceName - The workspace name.
   */
  public replyModeOn(
    postId: string,
    channelName: string,
    workspaceName: string,
  ): void {
    this.currContent.hidePostBox();

    // Close any existing reply boxes
    if (this.activeReply) {
      console.log("activeReply true, need to close a replybox");
      const currReplyTarget = this.activePosts.get(this.activeReply);
      if (currReplyTarget) {
        currReplyTarget.closeReplyMode();
        this.activeReplyBox?.remove();
      }
    }

    //  Open a new reply box
    const targetPost = this.activePosts.get(postId);
    if (targetPost) {
      console.log("open new reply box");
      this.activeReply = postId;
      const replyBox = new ReplyBox(postId, channelName, workspaceName);
      this.activeReplyBox = replyBox;
      targetPost.addReply(replyBox);
    }
  }

  /**
   * Disables reply mode for a specific post, revealing the main post box and removing the reply box.
   *
   * @param {string} postId - The ID of the post whose reply mode to turn off.
   */
  public replyModeOff(postId: string): void {
    this.currContent.revealPostBox();
    console.log(
      "replyModeOff called for",
      postId,
      " , current ReplyBox:\n",
      this.activeReplyBox,
    );

    // Close the reply box for the target post
    const targetPost = this.activePosts.get(postId);
    if (targetPost) {
      console.log("Close this input box: ", targetPost);
      targetPost.closeReplyMode();
      this.activeReplyBox?.remove();
      this.activeReply = null;
      this.activeReplyBox = null;
    }
  }

  /**
   * Updates the reactions displayed on a specific post, reflecting the current reaction state.
   *
   * @private
   * @param {ViewReactions} newReactions - The updated reactions map.
   * @param {string} postId - The ID of the post to update.
   * @param {string} username - The current username, to determine if the user is part of these reactions.
   */
  private updateReactions(
    newReactions: ViewReactions,
    postId: string,
    username: string,
  ): void {
    console.log("updating reactions");

    // initialize all variables to undefined
    let smileCnt,
      inSmile,
      frownCnt,
      inFrown,
      likeCnt,
      inLike,
      celebrateCnt,
      inCelebrate;

    // check if the reaction exists in the newReactions object
    if (newReactions[":smile:"]) {
      smileCnt = newReactions[":smile:"].length;
      inSmile = newReactions[":smile:"].includes(username);
    } else {
      smileCnt = 0;
      inSmile = false;
    }

    // check if the reaction exists in the newReactions object
    if (newReactions[":frown:"]) {
      frownCnt = newReactions[":frown:"].length;
      inFrown = newReactions[":frown:"].includes(username);
    } else {
      frownCnt = 0;
      inFrown = false;
    }

    // check if the reaction exists in the newReactions object
    if (newReactions[":like:"]) {
      likeCnt = newReactions[":like:"].length;
      inLike = newReactions[":like:"].includes(username);
    } else {
      likeCnt = 0;
      inLike = false;
    }

    // check if the reaction exists in the newReactions object
    if (newReactions[":celebrate:"]) {
      celebrateCnt = newReactions[":celebrate:"].length;
      inCelebrate = newReactions[":celebrate:"].includes(username);
    } else {
      celebrateCnt = 0;
      inCelebrate = false;
    }

    // get the target post
    const targetPost = this.activePosts.get(postId);
    console.log(targetPost);
    console.log("username for updateReactions", username);
    if (targetPost) {
      targetPost.renderReactions(
        smileCnt,
        inSmile,
        frownCnt,
        inFrown,
        likeCnt,
        inLike,
        celebrateCnt,
        inCelebrate,
      );
    }
  }
}

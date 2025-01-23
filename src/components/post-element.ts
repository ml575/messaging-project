import { slog } from "../slog";

type PostReactions = {
  ":smile:": Array<string>;
  ":frown:": Array<string>;
  ":like:": Array<string>;
  ":celebrate:": Array<string>;
};

/*
    Each post has:
    - post header containing author and post date+time
    - post body containing message
    - post reactions showing the possible reactions to the post + how many of each reaction
    - reply button
    - info on the post's parent (if any) to determine position in hierarchy for view purposes
*/

/* A web component to display posts */
export class PostElement extends HTMLElement {
  // Template for the post element
  private static template: HTMLTemplateElement;

  /*
    Initialize the post element
    This function must be called after the DOM has loaded,
    but before any post elements are created.
  */
  static initialize(
    getTemplate: (templateID: string) => HTMLTemplateElement,
  ): void {
    PostElement.template = getTemplate("#post-template");
  }

  // Shadow DOM for the post element
  private shadow: ShadowRoot;
  // Controller for aborting event listeners
  private controller: AbortController | null = null;
  // Post header containing author and post date+time
  private header: HTMLParagraphElement;
  // Post body containing message
  private body: HTMLParagraphElement;
  // Post reactions showing the possible reactions to the post + how many of each reaction
  private smileBtn: HTMLButtonElement; // smile button
  private smileCnt: HTMLParagraphElement; // count of users who have smiled
  private frownBtn: HTMLButtonElement; // frown button
  private frownCnt: HTMLParagraphElement; // count of users who have frowned
  private likeBtn: HTMLButtonElement; // like button
  private likeCnt: HTMLParagraphElement; // count of users who have liked
  private celebrateBtn: HTMLButtonElement; // celebrate button
  private celebrateCnt: HTMLParagraphElement; // count of users who have celebrated
  private replyBtn: HTMLButtonElement; // reply button
  // Container for post replies
  private replies: HTMLUListElement;
  // Whether the post is in reply mode
  private replyMode: boolean;
  // Post ID for view to reference
  private postId: string;
  // Current user to show correct coloring of reactions
  private currUser: string;
  // Channel name to determine where to send replies
  private channelName: string;
  // Workspace name to determine where to send replies
  private workspaceName: string;
  // Post creation date+time
  private createdAt: number;

  /*
    Construct a post element
    @param headerText the header text for the post
    @param bodyText the body text for the post
    @param reactionsObj the reactions object for the post
    @param postId the post ID for the post
    @param currUser the current user
    @param channelName the channel name
    @param workspaceName the workspace name
    @param createdAt the creation date+time for the post
  */
  constructor(
    headerText: string,
    bodyText: string,
    reactionsObj: PostReactions | undefined,
    postId: string,
    currUser: string,
    channelName: string,
    workspaceName: string,
    createdAt: number,
  ) {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    // Append the template content to the shadow root
    this.shadow.append(PostElement.template.content.cloneNode(true));

    // Check existing post arguments
    slog.info(
      "PostElement args: ",
      ["header text", headerText],
      ["body text", bodyText],
      ["reactions object", reactionsObj],
      ["postId", postId],
      ["current user", currUser],
      ["channel name", channelName],
      ["workspace name", workspaceName],
      ["created at timestamp", createdAt],
    );

    // Ensure all elements are present and of the correct types
    const header = this.shadow.querySelector("#post-header");
    if (!(header instanceof HTMLParagraphElement)) {
      throw new Error("header paragraph not found");
    }

    const body = this.shadow.querySelector("#post-body");
    if (!(body instanceof HTMLParagraphElement)) {
      throw new Error("body paragraph not found");
    }

    const smileBtn = this.shadow.querySelector("#smile");
    if (!(smileBtn instanceof HTMLButtonElement)) {
      throw new Error("smile button not found");
    }

    const smileCnt = this.shadow.querySelector("#smile-count");
    if (!(smileCnt instanceof HTMLParagraphElement)) {
      throw new Error("smile count not found");
    }

    const frownBtn = this.shadow.querySelector("#frown");
    if (!(frownBtn instanceof HTMLButtonElement)) {
      throw new Error("smile button not found");
    }

    const frownCnt = this.shadow.querySelector("#frown-count");
    if (!(frownCnt instanceof HTMLParagraphElement)) {
      throw new Error("smile count not found");
    }

    const likeBtn = this.shadow.querySelector("#like");
    if (!(likeBtn instanceof HTMLButtonElement)) {
      throw new Error("smile button not found");
    }

    const likeCnt = this.shadow.querySelector("#like-count");
    if (!(likeCnt instanceof HTMLParagraphElement)) {
      throw new Error("smile count not found");
    }

    const celebrateBtn = this.shadow.querySelector("#celebrate");
    if (!(celebrateBtn instanceof HTMLButtonElement)) {
      throw new Error("smile button not found");
    }

    const celebrateCnt = this.shadow.querySelector("#celebrate-count");
    if (!(celebrateCnt instanceof HTMLParagraphElement)) {
      throw new Error("smile count not found");
    }

    const replyBtn = this.shadow.querySelector("#reply");
    if (!(replyBtn instanceof HTMLButtonElement)) {
      throw new Error("reply button not found");
    }

    const replies = this.shadow.querySelector("#post-replies");
    if (!(replies instanceof HTMLUListElement)) {
      throw new Error("post replies area not found");
    }

    // Set all elements
    this.header = header;
    this.body = body;
    this.smileBtn = smileBtn;
    this.smileCnt = smileCnt;
    this.frownBtn = frownBtn;
    this.frownCnt = frownCnt;
    this.likeBtn = likeBtn;
    this.likeCnt = likeCnt;
    this.celebrateBtn = celebrateBtn;
    this.celebrateCnt = celebrateCnt;
    this.replyBtn = replyBtn;
    this.replies = replies;
    // initialize with reply box hidden
    this.replyMode = false;

    this.header.innerText = headerText;
    this.body.innerText = bodyText;

    // apply proper formatting to post message
    this.body.innerHTML = this.parseMessage(bodyText);

    // attach non-aesthetic data to the post element
    this.postId = postId;
    this.currUser = currUser;
    this.channelName = channelName;
    this.workspaceName = workspaceName;
    this.createdAt = createdAt;

    slog.info(this.postId);

    // render reactions
    if (reactionsObj != undefined) {
      // render smiles if it exists
      if (":smile:" in reactionsObj) {
        this.smileCnt.innerText = `${reactionsObj[":smile:"].length}`;
        if (reactionsObj[":smile:"].includes(this.currUser)) {
          this.smileBtn.classList.add("clicked");
        }
      } else {
        this.smileCnt.innerText = `0`;
      }

      // render frowns if it exists
      if (":frown:" in reactionsObj) {
        this.frownCnt.innerText = `${reactionsObj[":frown:"].length}`;
        if (reactionsObj[":frown:"].includes(this.currUser)) {
          this.frownBtn.classList.add("clicked");
        }
      } else {
        this.frownCnt.innerText = `0`;
      }

      // render likes if it exists
      if (":like:" in reactionsObj) {
        this.likeCnt.innerText = `${reactionsObj[":like:"].length}`;
        if (reactionsObj[":like:"].includes(this.currUser)) {
          this.likeBtn.classList.add("clicked");
        }
      } else {
        this.likeCnt.innerText = `0`;
      }

      // render celebrations if it exists
      if (":celebrate:" in reactionsObj) {
        this.celebrateCnt.innerText = `${reactionsObj[":celebrate:"].length}`;
        if (reactionsObj[":celebrate:"].includes(this.currUser)) {
          this.celebrateBtn.classList.add("clicked");
        }
      } else {
        this.celebrateCnt.innerText = `0`;
      }
    } else {
      // initialize all counts to 0 if no reactions
      this.smileCnt.innerText = "0";
      this.frownCnt.innerText = "0";
      this.likeCnt.innerText = "0";
      this.celebrateCnt.innerText = "0";
    }
  }

  connectedCallback(): void {
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };

    // Reply handler
    this.replyBtn.addEventListener(
      "click",
      this.openReplyMode.bind(this),
      options,
    );

    // Reaction handlers
    this.smileBtn.addEventListener("click", this.react.bind(this), options); // smile button
    this.frownBtn.addEventListener("click", this.react.bind(this), options); // frown button
    this.likeBtn.addEventListener("click", this.react.bind(this), options); // like button
    this.celebrateBtn.addEventListener("click", this.react.bind(this), options); // celebrate button
    slog.info("all event listeners added for post ", ["post id", this.postId]);
  }

  disconnectedCallback(): void {
    // Remove all event listeners
    this.controller?.abort();
    this.controller = null;
  }

  /*
   * Get the post path
   * @returns the post path
   */
  public getPath(): string {
    return this.postId;
  }

  /*
   * Get the post replies
   * @returns the post replies as an unordered list element
   */
  public getReplies(): HTMLUListElement {
    return this.replies;
  }

  /*
   * Get the post creation timestamp
   * @returns the post creation timestamp as a number
   */
  public getCreateDate(): number {
    return this.createdAt;
  }

  /**
   * Switch input box to reply mode under the desired post
   *
   * @param event mouse click event
   */
  private openReplyMode(event: MouseEvent): void {
    // Prevent the click event from computing if the reply mode is already active
    if (this.replyMode) {
      slog.info("reply mode already active for this post", [
        "post id",
        this.postId,
      ]);
      return;
    }

    slog.info("reply button clicked for post ", ["post id", this.postId]);
    this.replyMode = true;

    // Dispatch event to turn reply mode on for this post by communicating with reply-box
    const replyModeOnEvent = new CustomEvent("replyModeOnEvent", {
      detail: {
        postId: this.postId,
        channelName: this.channelName,
        workspaceName: this.workspaceName,
      },
    });

    document.dispatchEvent(replyModeOnEvent);
  }

  /*
   * Close the reply mode for the post
   */
  public closeReplyMode(): void {
    slog.info("turn reply mode off for this post", ["post id", this.postId]);
    this.replyMode = false;
  }

  public addReply(newReply: HTMLElement): void {
    this.replies.append(newReply);
  }

  private react(event: MouseEvent): void {
    slog.info("react method recieved event target", [
      "event target",
      event.target,
    ]);

    // Guarantees event.target exists
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    let button;
    // Handles case where the click is on the nested iconify-icon element
    if (!(event.target instanceof HTMLButtonElement)) {
      button = event.target.closest("button");
      // Needed to guarantee that button (event.target.closest("button")) exists
      if (!button) {
        return;
      }
    } else {
      button = event.target;
    }

    button.disabled = true;

    // See if this click should react or unreact
    const clicked = button.classList.contains("clicked");

    const reactEvent = new CustomEvent("reactEvent", {
      detail: { reactionType: button.id, postId: this.postId, clicked },
    });

    document.dispatchEvent(reactEvent);
  }

  /*
   * Render the reactions for the post
   * @param smileCnt the number of users who have smiled
   * @param inSmile whether the current user has smiled
   * @param frownCnt the number of users who have frowned
   * @param inFrown whether the current user has frowned
   * @param likeCnt the number of users who have liked
   * @param inLike whether the current user has liked
   * @param celebrateCnt the number of users who have celebrated
   * @param inCelebrate whether the current user has celebrated
   * @returns void
   * */
  public renderReactions(
    smileCnt: number,
    inSmile: boolean,
    frownCnt: number,
    inFrown: boolean,
    likeCnt: number,
    inLike: boolean,
    celebrateCnt: number,
    inCelebrate: boolean,
  ): void {
    slog.info(
      "Arguments for renderReactions: ",
      ["smile count", smileCnt],
      ["current user has smiled", inSmile],
      ["frown count", frownCnt],
      ["current user has frowned", inFrown],
      ["like count", likeCnt],
      ["current user has liked", inLike],
      ["celebrate count", celebrateCnt],
      ["current user has celebrated", inCelebrate],
    );

    // Update the reaction counts and button states
    this.smileCnt.innerText = smileCnt.toString();

    // update the smile button state based on previous button state
    if (
      this.smileBtn.disabled && // user has clicked btn
      this.smileBtn.classList.contains("clicked") !== inSmile // inSmile is different from current state
    ) {
      // update the button state based on current instance
      if (inSmile) {
        this.smileBtn.classList.add("clicked");
      } else {
        this.smileBtn.classList.remove("clicked");
      }
      this.smileBtn.disabled = false;
    } else {
      // update the button state based on remote instance
      if (inSmile) {
        this.smileBtn.classList.add("clicked");
      } else {
        this.smileBtn.classList.remove("clicked");
      }
    }

    // update the frown button state based on previous button state
    this.frownCnt.innerText = frownCnt.toString();
    if (
      this.frownBtn.disabled &&
      this.frownBtn.classList.contains("clicked") !== inFrown
    ) {
      // update the button state based on current instance
      if (inFrown) {
        this.frownBtn.classList.add("clicked");
      } else {
        this.frownBtn.classList.remove("clicked");
      }
      this.frownBtn.disabled = false;
    } else {
      // update the button state based on remote instance
      if (inFrown) {
        this.frownBtn.classList.add("clicked");
      } else {
        this.frownBtn.classList.remove("clicked");
      }
    }

    // update the like button state based on previous button state
    this.likeCnt.innerText = likeCnt.toString();
    if (
      this.likeBtn.disabled &&
      this.likeBtn.classList.contains("clicked") !== inLike
    ) {
      // update the button state based on current instance
      if (inLike) {
        this.likeBtn.classList.add("clicked");
      } else {
        this.likeBtn.classList.remove("clicked");
      }
      this.likeBtn.disabled = false;
    } else {
      // update the button state based on remote instance
      if (inLike) {
        this.likeBtn.classList.add("clicked");
      } else {
        this.likeBtn.classList.remove("clicked");
      }
    }

    // update the celebrate button state based on previous button state
    this.celebrateCnt.innerText = celebrateCnt.toString();
    if (
      this.celebrateBtn.disabled &&
      this.celebrateBtn.classList.contains("clicked") !== inCelebrate
    ) {
      // update the button state based on current instance
      if (inCelebrate) {
        this.celebrateBtn.classList.add("clicked");
      } else {
        this.celebrateBtn.classList.remove("clicked");
      }
      this.celebrateBtn.disabled = false;
    } else {
      // update the button state based on remote instance
      if (inCelebrate) {
        this.celebrateBtn.classList.add("clicked");
      } else {
        this.celebrateBtn.classList.remove("clicked");
      }
    }
  }

  /**
   * Parse the message content and return HTML
   *
   * @param message the message content
   * @returns the HTML string
   */
  private parseMessage(message: string): string {
    // Escape HTML special characters to prevent XSS
    let escapedText = this.escapeHtml(message);

    // Replace newlines with <br>
    escapedText = escapedText.replace(/\n/g, "<br>");

    // Replace **text** with <strong>text</strong>
    escapedText = escapedText.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Replace *text* with <em>text</em>
    escapedText = escapedText.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Replace [text](url) with <a href="url" target="_blank">text</a>
    escapedText = escapedText.replace(
      /\[(.+?)\]\((.+?)\)/g,
      (_match, text, url) => {
        // If url does not start with http:// or https://, add http://
        if (!/^https?:\/\//i.test(url)) {
          url = "http://" + url;
        }
        // Return the <a> tag with target="_blank"
        return `<a href="${url}" target="_blank">${text}</a>`;
      },
    );

    // Replace reactions with iconify icons
    escapedText = escapedText.replace(
      /:smile:/g,
      '<iconify-icon icon="fa-regular:smile" width="1.25em" height="1.25em"></iconify-icon>',
    );
    escapedText = escapedText.replace(
      /:frown:/g,
      '<iconify-icon icon="fa-regular:frown" width="1.25em" height="1.25em"></iconify-icon>',
    );
    escapedText = escapedText.replace(
      /:like:/g,
      '<iconify-icon icon="mdi:like" width="1.25em" height="1.25em"></iconify-icon>',
    );
    escapedText = escapedText.replace(
      /:celebrate:/g,
      '<iconify-icon icon="mingcute:celebrate-fill" width="1.25em" height="1.25em"></iconify-icon>',
    );

    return escapedText;
  }

  /**
   * Escape HTML special characters
   *
   * @param text the text to escape
   * @returns the escaped text
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;") // escaping html special characters
      .replace(/</g, "&lt;") // escaping html open angle bracked
      .replace(/>/g, "&gt;") // escaping html open angle bracked
      .replace(/"/g, "&quot;") // escaping html double quote
      .replace(/'/g, "&#039;"); // escaping html single quote
  }
}

/**
 * Initialize the components
 *
 * This function must be called after the DOM has loaded,
 * but before any components are created.
 */
export function initPostComp(
  getTemplate: (templateID: string) => HTMLTemplateElement,
): void {
  PostElement.initialize(getTemplate);

  customElements.define("post-element", PostElement);
}

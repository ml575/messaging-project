/**
 * A custom web component that displays posts for a given channel.
 *
 * This component includes:
 * - A title indicating the current channel
 * - A post input area with formatting and emoji insertion tools
 * - A list of posts
 *
 * When integrated into the DOM, it can:
 * - Listen for user input in the form of new posts
 * - Dispatch a custom event when a new post is created
 */
export class ChannelContent extends HTMLElement {
  private static template: HTMLTemplateElement;
  static initialize(
    getTemplate: (templateID: string) => HTMLTemplateElement,
  ): void {
    ChannelContent.template = getTemplate("#channel-content-template");
  }

  private shadow: ShadowRoot;
  private controller: AbortController | null = null;
  private channelTitle: HTMLParagraphElement;
  private workspaceTitle: string;
  private channelPosts: HTMLUListElement;
  private createPostForm: HTMLElement;
  private inputBox: HTMLTextAreaElement;
  private submitBtn: HTMLButtonElement;
  // private refreshBtn: HTMLButtonElement;
  // private displayPost: (post: Post,parent: HTMLElement) => void;
  // private channelId: string;

  // Added properties for new buttons
  private boldButton: HTMLButtonElement;
  private italicButton: HTMLButtonElement;
  private linkButton: HTMLButtonElement;
  private smileButton: HTMLButtonElement;
  private frownButton: HTMLButtonElement;
  private likeButton: HTMLButtonElement;
  private celebrateButton: HTMLButtonElement;

  /**
   * Constructs a new ChannelContent element.
   *
   * @param {string} channelName - The name of the channel to be displayed
   * @param {string} workspaceName - The name of the workspace associated with the channel
   */
  constructor(channelName: string, workspaceName: string) {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    // Append the template content to the shadow root
    this.shadow.append(ChannelContent.template.content.cloneNode(true));

    // Ensure all elements are present and of the correct types
    const channelTitle = this.shadow.querySelector("#channel-name");
    if (!(channelTitle instanceof HTMLParagraphElement)) {
      throw new Error("channel name paragraph not found");
    }

    const channelPosts = this.shadow.querySelector("#channel-posts");
    if (!(channelPosts instanceof HTMLUListElement)) {
      throw new Error("channel posts area not found");
    }

    const createPostForm = this.shadow.querySelector("#create-post-form");
    if (!(createPostForm instanceof HTMLElement)) {
      throw new Error("create post form not found");
    }

    const inputBox = this.shadow.querySelector("#input-box");
    if (!(inputBox instanceof HTMLTextAreaElement)) {
      throw new Error("input box not found");
    }

    const submitBtn = this.shadow.querySelector(`#submit-button`);
    if (!(submitBtn instanceof HTMLButtonElement)) {
      throw new Error("input box post button not found");
    }

    // Get the bold button
    const boldButton = this.shadow.querySelector("#bold-button");
    if (!(boldButton instanceof HTMLButtonElement)) {
      throw new Error("Bold button not found");
    }

    // Get the italic button
    const italicButton = this.shadow.querySelector("#italic-button");
    if (!(italicButton instanceof HTMLButtonElement)) {
      throw new Error("Italic button not found");
    }

    // Get the link button
    const linkButton = this.shadow.querySelector("#link-button");
    if (!(linkButton instanceof HTMLButtonElement)) {
      throw new Error("Link button not found");
    }

    // Get the reaction buttons
    const smileButton = this.shadow.querySelector("#smile-button");
    if (!(smileButton instanceof HTMLButtonElement)) {
      throw new Error("Smile button not found");
    }

    const frownButton = this.shadow.querySelector("#frown-button");
    if (!(frownButton instanceof HTMLButtonElement)) {
      throw new Error("Frown button not found");
    }

    const likeButton = this.shadow.querySelector("#like-button");
    if (!(likeButton instanceof HTMLButtonElement)) {
      throw new Error("Like button not found");
    }

    const celebrateButton = this.shadow.querySelector("#celebrate-button");
    if (!(celebrateButton instanceof HTMLButtonElement)) {
      throw new Error("Celebrate button not found");
    }

    this.channelTitle = channelTitle;
    this.channelPosts = channelPosts;
    this.createPostForm = createPostForm;
    this.inputBox = inputBox;
    this.submitBtn = submitBtn;

    this.boldButton = boldButton;
    this.italicButton = italicButton;
    this.linkButton = linkButton;
    this.smileButton = smileButton;
    this.frownButton = frownButton;
    this.likeButton = likeButton;
    this.celebrateButton = celebrateButton;

    this.channelTitle.innerText = channelName;
    this.workspaceTitle = workspaceName;
  }

  /**
   * Called when the element is inserted into the DOM.
   * Adds all necessary event listeners for posting and text formatting.
   */
  connectedCallback(): void {
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };

    // Submit new post handler
    this.submitBtn.addEventListener(
      "click",
      this.createPost.bind(this),
      options,
    );
    this.inputBox.addEventListener(
      "keydown",
      this.createPost.bind(this),
      options,
    );

    // Add event listeners for formatting and emoji buttons
    this.boldButton.addEventListener(
      "click",
      this.handleBoldClick.bind(this),
      options,
    );
    this.italicButton.addEventListener(
      "click",
      this.handleItalicClick.bind(this),
      options,
    );
    this.linkButton.addEventListener(
      "click",
      this.handleLinkClick.bind(this),
      options,
    );
    this.smileButton.addEventListener(
      "click",
      this.handleSmileClick.bind(this),
      options,
    );
    this.frownButton.addEventListener(
      "click",
      this.handleFrownClick.bind(this),
      options,
    );
    this.likeButton.addEventListener(
      "click",
      this.handleLikeClick.bind(this),
      options,
    );
    this.celebrateButton.addEventListener(
      "click",
      this.handleCelebrateClick.bind(this),
      options,
    );
  }

  disconnectedCallback(): void {
    // Remove all event listeners
    this.controller?.abort();
    this.controller = null;
  }

  /**
   * Create a post whose text is the current contents of the post input box.
   *
   * @param event mouse click event or pressing enter while focus is on post input box
   */
  private createPost(event: MouseEvent | KeyboardEvent): void {
    console.log("create post clicked, msg: ", this.inputBox.textContent);
    if (
      event instanceof KeyboardEvent &&
      (event.shiftKey || event.key !== "Enter")
    ) {
      console.log("do nothing");
      return;
    }

    this.inputBox.blur();

    if (this.inputBox.value === "") {
      console.log("empty input");
      return;
    }

    const createPostEvent = new CustomEvent("createPostEvent", {
      detail: {
        postMsg: this.inputBox.value,
        channelName: this.channelTitle.textContent,
        workspaceName: this.workspaceTitle,
      },
    });

    this.inputBox.value = "";

    // Submit notification
    document.dispatchEvent(createPostEvent);
  }

  /**
   * Enable the post submit button (useful if disabled externally).
   */
  public enablePost(): void {
    this.submitBtn.disabled = false;
  }

  /**
   * Sets focus on the post input box.
   */
  public focusPostBox(): void {
    this.inputBox.focus();
  }

  /**
   * Returns the reference to the main input box (useful for external manipulations).
   *
   * @returns {HTMLTextAreaElement} The textarea element for composing posts.
   */
  public returnReplyBox(): HTMLTextAreaElement {
    return this.inputBox;
  }

  /**
   * Appends a given post HTMLElement to the channel posts list.
   *
   * @param {HTMLElement} post - The post element to be appended
   */
  public displayPost(post: HTMLElement): void {
    this.channelPosts.append(post);
  }

  /**
   * Hides the post input box form, preventing new posts from being created.
   */
  public hidePostBox(): void {
    this.inputBox.value = "";
    this.createPostForm.style.visibility = "hidden";
  }

  /**
   * Reveals the post input box form, allowing the user to create new posts.
   * Also sets focus into the input box.
   */
  public revealPostBox(): void {
    this.createPostForm.style.visibility = "visible";
    this.inputBox.focus();
  }

  /**
   * Get the top-level posts container (the <ul> element).
   *
   * @returns {HTMLUListElement} The <ul> element containing top-level posts.
   */
  public getTopLevelPosts(): HTMLUListElement {
    return this.channelPosts;
  }

  // Handler methods for formatting
  private handleBoldClick(event: MouseEvent): void {
    this.insertFormatting("**");
  }

  // Handler methods for formatting
  private handleItalicClick(event: MouseEvent): void {
    this.insertFormatting("*");
  }

  /**
   * Handle a click on the link button.
   * Inserts a Markdown-style link or modifies the selected text into a link.
   *
   * @param {MouseEvent} event - The link button click event
   */
  private handleLinkClick(event: MouseEvent): void {
    const input = this.inputBox;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selectedText = input.value.substring(start, end);
    if (selectedText) {
      // Wrap selected text with []()
      const newText = `[${selectedText}]()`;
      input.setRangeText(newText, start, end, "end");
      // Place cursor inside the parentheses
      const cursorPosition = start + newText.length - 1;
      input.setSelectionRange(cursorPosition, cursorPosition);
    } else {
      // No selection, insert []() and place cursor inside the brackets
      const newText = "[]()";
      input.setRangeText(newText, start, start, "end");
      // Place cursor between the brackets
      const cursorPosition = start + 1;
      input.setSelectionRange(cursorPosition, cursorPosition);
    }
    input.focus();
  }

  private handleSmileClick(event: MouseEvent): void {
    this.insertAtCursor(":smile:");
  }

  private handleFrownClick(event: MouseEvent): void {
    this.insertAtCursor(":frown:");
  }

  private handleLikeClick(event: MouseEvent): void {
    this.insertAtCursor(":like:");
  }

  private handleCelebrateClick(event: MouseEvent): void {
    this.insertAtCursor(":celebrate:");
  }

  /**
   * Insert a formatting symbol or wrap selected text with it.
   * Used for bold and italic formatting.
   *
   * @param {string} symbol - The formatting symbol(s) to insert (e.g., '**' or '*')
   */
  private insertFormatting(symbol: string): void {
    const input = this.inputBox;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selectedText = input.value.substring(start, end);
    if (selectedText) {
      // Wrap the selected text
      const newText = symbol + selectedText + symbol;
      input.setRangeText(newText, start, end, "end");
      // Move cursor to after the inserted text
      const cursorPosition = start + newText.length;
      input.setSelectionRange(cursorPosition, cursorPosition);
    } else {
      // Insert the symbols and place cursor in between
      const newText = symbol + symbol;
      input.setRangeText(newText, start, start, "end");
      const cursorPosition = start + symbol.length;
      input.setSelectionRange(cursorPosition, cursorPosition);
    }
    input.focus();
  }

  /**
   * Insert a given text (like an emoji code) at the current cursor position.
   *
   * @param {string} text - The text to insert into the input box
   */
  private insertAtCursor(text: string): void {
    const input = this.inputBox;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    input.setRangeText(text, start, end, "end");
    const cursorPosition = start + text.length;
    input.setSelectionRange(cursorPosition, cursorPosition);
    input.focus();
  }
}

/**
 * Initialize the components
 *
 * This function must be called after the DOM has loaded,
 * but before any components are created.
 */
export function initChannelContentComp(
  getTemplate: (templateID: string) => HTMLTemplateElement,
) {
  ChannelContent.initialize(getTemplate);
  customElements.define("channel-content", ChannelContent);
}

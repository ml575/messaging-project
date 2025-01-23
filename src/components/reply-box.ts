/* A web component to display posts */
export class ReplyBox extends HTMLElement {
  // Static property to hold the template element
  private static template: HTMLTemplateElement;
  // Must be called before the component is defined
  // but after the DOM has been loaded
  static initialize(
    getTemplate: (templateID: string) => HTMLTemplateElement,
  ): void {
    ReplyBox.template = getTemplate("#reply-box-template");
  }

  // Instance properties
  private shadow: ShadowRoot;
  private controller: AbortController | null = null;

  // HTML Elements
  private replyInputBox: HTMLTextAreaElement; // The input box for the reply
  private replySubmitBtn: HTMLButtonElement; // The button to submit the reply
  private replyQuitBtn: HTMLButtonElement; // The button to quit reply mode
  private parentPost: string; // The post to which the reply is being made
  private channelName: string; // The channel in which the reply is being made
  private workspaceName: string; // The workspace in which the reply is being made
  private replyBoldButton: HTMLButtonElement; // The button to bold text in the reply input box
  private replyItalicButton: HTMLButtonElement; // The button to italicize text in the reply input box
  private replyLinkButton: HTMLButtonElement;
  private replySmileButton: HTMLButtonElement;
  private replyFrownButton: HTMLButtonElement;
  private replyLikeButton: HTMLButtonElement;
  private replyCelebrateButton: HTMLButtonElement;

  constructor(parentPost: string, channelName: string, workspaceName: string) {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    // Append the template content to the shadow root
    this.shadow.append(ReplyBox.template.content.cloneNode(true));

    // Ensure all elements are present and of the correct types
    const replyInputBox = this.shadow.querySelector("#reply-input-box");
    if (!(replyInputBox instanceof HTMLTextAreaElement)) {
      throw new Error("input box not found");
    }

    const replySubmitBtn = this.shadow.querySelector(`#reply-submit-button`);
    if (!(replySubmitBtn instanceof HTMLButtonElement)) {
      throw new Error("input box post button not found");
    }

    const replyQuitBtn = this.shadow.querySelector("#reply-quit-button");
    if (!(replyQuitBtn instanceof HTMLButtonElement)) {
      throw new Error("reply quit button not found");
    }

    // Get the formatting and emoji buttons for the reply input box
    const replyBoldButton = this.shadow.querySelector("#reply-bold-button");
    if (!(replyBoldButton instanceof HTMLButtonElement)) {
      throw new Error("Reply bold button not found");
    }

    const replyItalicButton = this.shadow.querySelector("#reply-italic-button");
    if (!(replyItalicButton instanceof HTMLButtonElement)) {
      throw new Error("Reply italic button not found");
    }

    const replyLinkButton = this.shadow.querySelector("#reply-link-button");
    if (!(replyLinkButton instanceof HTMLButtonElement)) {
      throw new Error("Reply link button not found");
    }

    const replySmileButton = this.shadow.querySelector("#reply-smile-button");
    if (!(replySmileButton instanceof HTMLButtonElement)) {
      throw new Error("Reply smile button not found");
    }

    const replyFrownButton = this.shadow.querySelector("#reply-frown-button");
    if (!(replyFrownButton instanceof HTMLButtonElement)) {
      throw new Error("Reply frown button not found");
    }

    const replyLikeButton = this.shadow.querySelector("#reply-like-button");
    if (!(replyLikeButton instanceof HTMLButtonElement)) {
      throw new Error("Reply like button not found");
    }

    const replyCelebrateButton = this.shadow.querySelector(
      "#reply-celebrate-button",
    );
    if (!(replyCelebrateButton instanceof HTMLButtonElement)) {
      throw new Error("Reply celebrate button not found");
    }

    this.replyInputBox = replyInputBox;
    this.replySubmitBtn = replySubmitBtn;
    this.replyQuitBtn = replyQuitBtn;
    this.replyBoldButton = replyBoldButton;
    this.replyItalicButton = replyItalicButton;

    this.replyLinkButton = replyLinkButton;
    this.replySmileButton = replySmileButton;
    this.replyFrownButton = replyFrownButton;
    this.replyLikeButton = replyLikeButton;
    this.replyCelebrateButton = replyCelebrateButton;

    this.parentPost = parentPost;
    this.channelName = channelName;
    this.workspaceName = workspaceName;
  }

  connectedCallback(): void {
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };

    console.log("turn reply mode on for post ", this.parentPost);

    // Submit reply handler
    this.replySubmitBtn.addEventListener(
      "click",
      this.createReply.bind(this),
      options,
    );
    this.replyInputBox.addEventListener(
      "keydown",
      this.createReply.bind(this),
      options,
    );

    // Quit reply mode
    this.replyQuitBtn.addEventListener(
      "click",
      this.quitReply.bind(this),
      options,
    );

    // Add event listeners for formatting and emoji buttons in the reply input box
    this.replyBoldButton.addEventListener(
      "click",
      this.handleReplyBoldClick.bind(this),
      options,
    );
    this.replyItalicButton.addEventListener(
      "click",
      this.handleReplyItalicClick.bind(this),
      options,
    );
    this.replyLinkButton.addEventListener(
      "click",
      this.handleReplyLinkClick.bind(this),
      options,
    );
    this.replySmileButton.addEventListener(
      "click",
      this.handleReplySmileClick.bind(this),
      options,
    );
    this.replyFrownButton.addEventListener(
      "click",
      this.handleReplyFrownClick.bind(this),
      options,
    );
    this.replyLikeButton.addEventListener(
      "click",
      this.handleReplyLikeClick.bind(this),
      options,
    );
    this.replyCelebrateButton.addEventListener(
      "click",
      this.handleReplyCelebrateClick.bind(this),
      options,
    );

    this.replyInputBox.focus();
  }

  disconnectedCallback(): void {
    // Remove all event listeners
    this.controller?.abort();
    this.controller = null;
  }

  /**
   * Create a reply to a post.
   *
   * @param event mouse click event or pressing enter while focus is on reply box
   */
  private createReply(event: MouseEvent | KeyboardEvent): void {
    console.log("create reply clicked, msg: ", this.replyInputBox.value);
    if (
      (event instanceof KeyboardEvent &&
        (event.shiftKey || event.key !== "Enter")) ||
      this.replyInputBox.disabled
    ) {
      console.log("do nothing");
      return;
    }

    this.replyInputBox.blur();

    if (this.replyInputBox.value === "") {
      console.log("empty input");
      return;
    }

    const createReplyEvent = new CustomEvent("createReplyEvent", {
      detail: {
        postMsg: this.replyInputBox.value,
        channelName: this.channelName,
        workspaceName: this.workspaceName,
        parent: this.parentPost,
      },
    });

    this.replyInputBox.value = "";

    // Submit notification
    document.dispatchEvent(createReplyEvent);
  }

  /**
   * Switch input box off reply mode for the desired post
   *
   * @param event mouse click event
   */
  private quitReply(event: MouseEvent): void {
    // TODO: Review the concurrency of this???
    if (this.replyQuitBtn.disabled) {
      return;
    }

    this.replyQuitBtn.disabled = true;

    const replyModeOffEvent = new CustomEvent("replyModeOffEvent", {
      detail: {
        postId: this.parentPost,
      },
    });

    document.dispatchEvent(replyModeOffEvent);
  }

  // Handler methods for formatting and emoji buttons in the reply input box

  private handleReplyBoldClick(event: MouseEvent): void {
    this.insertFormatting("**", this.replyInputBox);
  }

  private handleReplyItalicClick(event: MouseEvent): void {
    this.insertFormatting("*", this.replyInputBox);
  }

  private handleReplyLinkClick(event: MouseEvent): void {
    const input = this.replyInputBox;
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

  private handleReplySmileClick(event: MouseEvent): void {
    this.insertAtCursor(":smile:", this.replyInputBox);
  }

  private handleReplyFrownClick(event: MouseEvent): void {
    this.insertAtCursor(":frown:", this.replyInputBox);
  }

  private handleReplyLikeClick(event: MouseEvent): void {
    this.insertAtCursor(":like:", this.replyInputBox);
  }

  private handleReplyCelebrateClick(event: MouseEvent): void {
    this.insertAtCursor(":celebrate:", this.replyInputBox);
  }

  private insertFormatting(symbol: string, input: HTMLTextAreaElement): void {
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

  private insertAtCursor(text: string, input: HTMLTextAreaElement): void {
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
export function initReplyBoxComp(
  getTemplate: (templateID: string) => HTMLTemplateElement,
) {
  ReplyBox.initialize(getTemplate);
  customElements.define("reply-box", ReplyBox);
}

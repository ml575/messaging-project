/**
 * A custom web component representing a login dialog. It provides functionality
 * for user login, logout, and error handling. The dialog uses Shadow DOM
 * for encapsulation.
 */

const loginTemplateId = "#login-dialog-template";

export class LoginDialogComponent extends HTMLElement {
  // Static template property for reusing the dialog template
  private static template: HTMLTemplateElement;

  // Shadow DOM root for encapsulating styles and markup
  private shadow: ShadowRoot;

  // Elements for login dialog
  private logoutButton: HTMLButtonElement;
  private usernameDisplay: HTMLElement;
  private usernameInput: HTMLInputElement;
  private loginButton: HTMLButtonElement;
  private errorDisplay: HTMLElement;
  private workspaceButton: HTMLButtonElement;

  /*
   * Initializes the component with a template element.
   * @param getTemplate - A function to get the template element by ID.
   */
  static initialize(
    getTemplate: (templateID: string) => HTMLTemplateElement,
  ): void {
    LoginDialogComponent.template = getTemplate(loginTemplateId);
  }

  /*
   * Constructor for the LoginDialogComponent.
   */
  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.appendChild(
      LoginDialogComponent.template.content.cloneNode(true),
    );

    // Find and store references to the dialog elements
    const workspaceButton = document.querySelector("#workspace-prompt");
    if (!(workspaceButton instanceof HTMLButtonElement)) {
      throw new Error("Could not find workspace button");
    }

    const usernameDisplay = document.querySelector(".username");
    if (!(usernameDisplay instanceof HTMLElement)) {
      throw new Error(".username element not found");
    }

    const logoutButton = document.querySelector("#logout-btn");
    if (!(logoutButton instanceof HTMLButtonElement)) {
      throw new Error("#logout-button element not found");
    }

    const usernameInput = this.shadow.querySelector("#username");
    if (!(usernameInput instanceof HTMLInputElement)) {
      throw new Error("#username element not found");
    }

    const loginButton = this.shadow.querySelector("#login-btn");

    if (!(loginButton instanceof HTMLButtonElement)) {
      throw new Error("#login-btn element not found");
    }

    const errorDisplay = this.shadow.querySelector("#error-message");
    if (!(errorDisplay instanceof HTMLElement)) {
      throw new Error("#error-message element not found");
    }

    // Store the elements for later use in object
    this.usernameInput = usernameInput;
    this.loginButton = loginButton;
    this.errorDisplay = errorDisplay;
    this.logoutButton = logoutButton;
    this.workspaceButton = workspaceButton;
    this.usernameDisplay = usernameDisplay;

    // Append the dialog to the body
    document.body.appendChild(this);
  }

  /*
   * Handles the login event when the user presses the Enter key.
   * @param event - The keyboard event.
   */
  private handleLoginOnEnter(event: KeyboardEvent): void {
    // console.log("clicked key", event.key)
    if (event.key === "Enter") {
      this.handleLogin();
    }
  }

  /*
   * Handles the login event when the user presses the login button.
   */
  private handleLogin(): void {
    const usernameVal = this.usernameInput.value.trim();
    // if the username is not empty, dispatch a login event
    if (usernameVal) {
      const loginEvent = new CustomEvent("login-attempt", {
        detail: { username: usernameVal },
        bubbles: true,
        composed: true,
      });
      this.usernameInput.disabled = true;
      this.usernameInput.classList.add("waiting");
      this.loginButton.disabled = true;
      this.loginButton.classList.add("waiting");

      // hide username and add in spinner
      this.usernameDisplay.hidden = true;
      this.usernameDisplay.textContent = usernameVal;
      this.usernameDisplay.classList.add("spinner");
      this.dispatchEvent(loginEvent);
    } else {
      this.displayError("Please enter a username.");
    }
  }

  /*
   * Displays an error message to the user.
   * @param message - The error message to display.
   */
  public displayError(message: string): void {
    this.errorDisplay.textContent = message;
    this.usernameInput.disabled = false;
    this.loginButton.disabled = false;
    this.loginButton.classList.remove("waiting");
    this.usernameInput.classList.remove("waiting");
  }

  /*
   * Clears the username input
   */
  public clearUsername(): void {
    this.usernameInput.value = "";
    this.usernameDisplay.textContent = "username";
  }

  /*
   * Opens the login dialog.
   */
  public open(): void {
    this.usernameInput.value = "";
    this.errorDisplay.textContent = "";
    this.style.display = "block";
    // enables the username input and login button until the dialog is closed
    this.usernameInput.disabled = false;
    this.loginButton.disabled = false;
    this.usernameInput.focus();

    // disable workspace and logout buttons to prevent user confusion
    this.workspaceButton.disabled = true;
    this.logoutButton.disabled = true;
    document.body.classList.add("modal-open");
  }

  /*
   * Closes the login dialog.
   */
  public close(): void {
    this.style.display = "none";
    // remove user-facing css for waiting state
    this.loginButton.classList.remove("waiting");
    this.usernameInput.classList.remove("waiting");
    this.usernameDisplay.classList.remove("spinner");
    // enable the workspace and logout buttons
    this.usernameDisplay.hidden = false;
    this.workspaceButton.disabled = false;
    this.logoutButton.disabled = false;
    document.body.classList.remove("modal-open");
  }

  /*
   * Lifecycle method called when the component is added to the DOM.
   */
  connectedCallback(): void {
    this.open();
    // add event listeners for the login and logout buttons
    this.logoutButton.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("logout-attempt"));
    });
    this.loginButton.addEventListener("click", this.handleLogin.bind(this));
    this.usernameInput.addEventListener(
      "keydown",
      this.handleLoginOnEnter.bind(this),
    );
  }

  /*
   * Returns the username of the logged-in user.
   */
  public getUsername(): string {
    return this.usernameDisplay.textContent
      ? this.usernameDisplay.textContent
      : "";
  }
}

/*
 * Initializes the login dialog view.
 * @param getTemplate - A function to get the template element by ID.
 */
export function initLoginView(
  getTemplate: (templateID: string) => HTMLTemplateElement,
): LoginDialogComponent {
  LoginDialogComponent.initialize(getTemplate);
  customElements.define("login-dialog", LoginDialogComponent);
  return new LoginDialogComponent();
}

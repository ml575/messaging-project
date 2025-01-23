import { slog } from "../slog";

/**
 * Represents the type of a container.
 *
 * @typedef {("Workspace" | "Channel")} ContainerType
 *
 * @property {"Workspace"} Workspace - Represents a workspace container.
 * @property {"Channel"} Channel - Represents a channel container.
 */
type ContainerType = "Workspace" | "Channel";

/**
 * Represents a custom HTML element for a container item with various interactive elements.
 *
 * @extends HTMLElement
 *
 * @property {HTMLTemplateElement} template - The template for the container item.
 * @property {ShadowRoot} shadow - The shadow DOM of the container item.
 * @property {AbortController | null} controller - The controller for managing event listeners.
 * @property {HTMLLabelElement} containerNameLabel - The label element within the container.
 * @property {HTMLButtonElement} trashBtn - The button element for deleting the container item.
 * @property {HTMLButtonElement} createBtn - The button element for editing the container item.
 * @property {HTMLButtonElement} confirmBtn - The button element for confirming actions.
 * @property {HTMLInputElement} input - The input element within the container.
 * @property {ContainerType} type - The type of the container.
 * @property {string} parentName - The name of the parent container.
 * @property {boolean} disabled - Indicates whether the container item is disabled.
 * @property {HTMLElement} errorIcon - The icon element for displaying errors.
 * @property {HTMLLabelElement} errorDisplay - The label element for displaying error messages.
 * @property {HTMLButtonElement} dismissBtn - The button element for dismissing error messages.
 * @property {HTMLElement} inputBox - The container for the input element.
 *
 * @constructor
 * @param {ContainerType} type - The type of the container.
 *
 * @throws {Error} If any of the required elements are not found or are of incorrect types.
 *
 * @method static initialize - Initializes the template for the container item.
 * @method connectedCallback - Lifecycle method called when the custom element is appended to the document's DOM.
 * @method setParentName - Sets the parent name for the container item.
 * @method submit - Handles the submit event for the container item.
 * @method delete - Handles the delete event for the container item.
 * @method create - Reveals the editing component for the container item.
 * @method selectContainer - Handles the selection of the container item.
 * @method disableItem - Disables the current item.
 * @method enableItem - Enables the current item.
 * @method getType - Retrieves the type of the container item.
 * @method showError - Displays an error message.
 * @method removeError - Removes the error display from the container item.
 * @method getName - Retrieves the name of the container.
 * @method clickEditBtn - Triggers a click event on the create button.
 * @method disconnectedCallback - Lifecycle method called when the custom element is disconnected from the document's DOM.
 */
export class ContainerItem extends HTMLElement {
  private static template: HTMLTemplateElement;
  // but after the DOM has been loaded
  static initialize(
    getTemplate: (templateID: string) => HTMLTemplateElement,
  ): void {
    ContainerItem.template = getTemplate("#list-item-template");
  }

  /**
   * @private
   * A reference to the Shadow DOM root of the component.
   */
  private shadow: ShadowRoot;
  /**
   * A controller to manage and abort ongoing fetch requests.
   * Initialized as `null` and can be assigned an instance of `AbortController`.
   *
   * @private
   * @type {AbortController | null}
   */
  private controller: AbortController | null = null;
  /**
   * A label element representing the name of the container.
   * @private
   */
  private containerNameLabel: HTMLLabelElement;
  /**
   * A button element that triggers the trash action.
   * This button is used to delete or remove an item from the container.
   */
  private trashBtn: HTMLButtonElement;
  /**
   * A reference to the button element created within the container item component.
   * This button can be used to trigger specific actions or events.
   */
  private createBtn: HTMLButtonElement;
  /**
   * A reference to the confirm button element.
   * This button is used to confirm an action within the container item component.
   */
  private confirmBtn: HTMLButtonElement;
  /**
   * A private member variable that holds a reference to an HTML input element.
   */
  private input: HTMLInputElement;
  /**
   * The type of the container item.
   * This property holds the specific type of the container, which is defined by the `ContainerType` enum.
   */
  private type: ContainerType;
  /**
   * The name of the parent component.
   * This property holds the name of the parent component to which this container item belongs.
   */
  private parentName: string;
  /**
   * Indicates whether the container item is disabled.
   * When set to `true`, the item is not interactive and may appear visually different.
   */
  private disabled: boolean;
  /**
   * Represents an HTML element that displays an error icon.
   * This element is used to indicate an error state within the container item component.
   */
  private errorIcon: HTMLElement;
  /**
   * A label element used to display error messages.
   * @private
   */
  private errorDisplay: HTMLLabelElement;
  /**
   * A reference to the dismiss button element.
   * This button is used to dismiss or close the container item.
   */
  private dismissBtn: HTMLButtonElement;
  /**
   * A reference to the input box element within the container item.
   * This element is used for user input within the component.
   */
  private inputBox: HTMLElement;

  //   private todoId: string;
  // private workspaceName: string;

  /**
   * Constructs a new ContainerItem instance.
   *
   * @param {ContainerType} type - The type of the container.
   *
   * @throws {Error} If any of the required elements are not found or are of incorrect types.
   *
   * @property {ShadowRoot} shadow - The shadow DOM of the container item.
   * @property {string} id - The ID of the container item, based on the type.
   * @property {HTMLLabelElement} containerNameLabel - The label element within the container.
   * @property {HTMLButtonElement} trashBtn - The button element for deleting the container item.
   * @property {HTMLButtonElement} createBtn - The button element for editing the container item.
   * @property {HTMLInputElement} input - The input element within the container.
   * @property {HTMLButtonElement} confirmBtn - The button element for confirming actions.
   * @property {HTMLElement} inputBox - The container for the input element.
   * @property {HTMLElement} errorIcon - The icon element for displaying errors.
   * @property {HTMLLabelElement} errorDisplay - The label element for displaying error messages.
   * @property {HTMLButtonElement} dismissBtn - The button element for dismissing error messages.
   * @property {boolean} disabled - Indicates whether the container item is disabled.
   * @property {string} parentName - The name of the parent container.
   * @property {string} dataset.id - A unique identifier for the container item.
   */
  constructor(type: ContainerType) {
    super();

    this.shadow = this.attachShadow({ mode: "open" });
    this.type = type;
    // Append the template content to the shadow root
    this.shadow.append(ContainerItem.template.content.cloneNode(true));
    this.id = `${type}-list-item`;

    // Ensure all elements are present and of the correct types
    const label = this.shadow.querySelector("label");
    if (!(label instanceof HTMLLabelElement)) {
      throw new Error(`${type} label not found`);
    }

    const trashBtn = this.shadow.querySelector('[data-button="delete"]');
    if (!(trashBtn instanceof HTMLButtonElement)) {
      throw new Error(`${type}-delete button not found`);
    }

    const createBtn = this.shadow.querySelector('[data-button="edit"]');
    if (!(createBtn instanceof HTMLButtonElement)) {
      throw new Error(`${type}-create button not found`);
    }

    const input = this.shadow.querySelector("#workspace-list-input");
    if (!(input instanceof HTMLInputElement)) {
      throw new Error(`${type} input button not found`);
    }

    const confirmBtn = this.shadow.querySelector('[data-button="confirm"]');
    if (!(confirmBtn instanceof HTMLButtonElement)) {
      throw new Error(`${type}-confirm button not found`);
    }

    const inputBox = this.shadow.querySelector("#input-container");
    if (!(inputBox instanceof HTMLElement)) {
      throw new Error("input box not found");
    }

    const errorIcon = this.shadow.querySelector("#error-icon");
    if (!(errorIcon instanceof HTMLElement)) {
      throw new Error("error icon not found");
    }

    const errorDisplay = this.shadow.querySelector("#error-display");
    if (!(errorDisplay instanceof HTMLLabelElement)) {
      throw new Error("error display not found");
    }

    const dismissBtn = this.shadow.querySelector("#dismiss-error");
    if (!(dismissBtn instanceof HTMLButtonElement)) {
      throw new Error("dismiss button not found");
    }
    this.tabIndex = 0;
    this.dismissBtn = dismissBtn;
    this.inputBox = inputBox;
    this.containerNameLabel = label;
    this.trashBtn = trashBtn;
    this.createBtn = createBtn;
    this.confirmBtn = confirmBtn;
    this.input = input;
    this.input.hidden = true;
    this.errorIcon = errorIcon;
    this.errorDisplay = errorDisplay;
    this.disabled = false;
    this.parentName = "";
    this.dataset.id = crypto.randomUUID();
  }

  /**
   * Lifecycle method called when the custom element is appended to the document's DOM.
   * Initializes event listeners for various user interactions such as keyup, click, and keydown.
   *
   * - Sets up an `AbortController` to manage event listener removal.
   * - Adds a keyup event listener to the input element to handle form submission.
   * - Adds a click event listener to the input element to log clicks and stop propagation.
   * - Adds a click event listener to the trash button to handle item deletion.
   * - Adds a click event listener to the create button to handle item creation.
   * - Adds a click event listener to the dismiss button to handle error dismissal.
   * - Adds a click event listener to the confirm button to handle form submission.
   * - Adds a click event listener to the container to handle container selection.
   * - Adds a keydown event listener to the container to handle Enter key for container selection.
   */
  connectedCallback(): void {
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };

    this.input.addEventListener("keyup", this.submit.bind(this), options);

    this.input.addEventListener(
      "click",
      (event) => {
        slog.debug("Click on input");
        event.stopPropagation();
      },
      options,
    );
    // Delete handler
    this.trashBtn.addEventListener("click", this.delete.bind(this), options);

    // Edit handler
    this.createBtn.addEventListener("click", this.create.bind(this), options);

    // dismissing error handler
    this.dismissBtn.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        this.removeError();
      },
      options,
    );

    // Select handler
    this.confirmBtn.addEventListener("click", this.submit.bind(this), options);
    this.addEventListener("click", this.selectContainer.bind(this), options);
    this.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.selectContainer();
      }
    });
  }

  /**
   * Sets the parent name for the container item.
   *
   * @param name - The name to set as the parent name.
   * @returns void
   */
  public setParentName(name: string): void {
    this.parentName = name;
    slog.debug(
      "setting parent name",
      ["child", this.containerNameLabel.innerText],
      ["parent", this.parentName],
    );
  }

  /**
   * Handles the submit event for the container item.
   *
   * @param event - The event object representing the user interaction.
   *
   * The method performs the following actions based on the type of event:
   * - Stops the propagation of the event.
   * - Logs the event using `slog.info`.
   * - If the event is a `KeyboardEvent` and the key is "Escape", it removes the container item.
   * - If the event is a `KeyboardEvent` with the key "Enter" or a `MouseEvent`, it processes the input value.
   *
   * The method performs several checks on the input value:
   * - If the item is disabled, it logs "Already handled" and returns.
   * - If the input value is empty, it shows an error message "Empty input" and returns.
   * - If the input value contains invalid characters ("/", ".", "..", "\", or "\""), it shows an error message and returns.
   *
   * If the input value passes all checks, the method:
   * - Removes any error messages.
   * - Updates the container name label with the input value.
   * - Disables the item and hides the input box.
   *
   * Finally, it dispatches a custom event (`createWorkspaceEvent` or `createChannelEvent`) with the workspace name, channel name, and UUID.
   */
  private submit(event: Event): void {
    event.stopPropagation();
    slog.info("input box event", ["event", event]);
    if (event instanceof KeyboardEvent && event.key === "Escape") {
      this.remove();
    } else if (
      (event instanceof KeyboardEvent && event.key === "Enter") ||
      event instanceof MouseEvent
    ) {
      slog.debug("Enter key pressed");
      if (this.disabled == true) {
        slog.debug("Submit already handled");
        return;
      }

      if (this.input.value === "") {
        // this.input.classList.add("error");
        this.showError("Empty input");
        // throw new Error("Empty input");
        return;
      }
      if (
        this.input.value.includes("/") ||
        this.input.value === "." ||
        this.input.value === ".." ||
        this.input.value.includes("\\") ||
        this.input.value.includes('"')
      ) {
        this.showError(
          "Contains invalid character. Cannot contain '/', '.', '\"' or '\\'",
        );
        return;
      }
      this.removeError();
      this.containerNameLabel.textContent = this.input.value;
      this.disableItem();
      this.input.hidden = true;
      this.containerNameLabel.hidden = false;
      this.inputBox.classList.remove("show");
      this.inputBox.hidden = true;

      let workspace = "";
      let channel = "";
      if (this.type == "Workspace") {
        workspace = this.input.value;
      } else {
        channel = this.input.value;
        workspace = this.parentName;
      }

      const createEvent = new CustomEvent(`create${this.type}Event`, {
        detail: {
          workspaceName: workspace,
          channelName: channel,
          uuid: this.dataset.id,
        },
        bubbles: true,
        composed: true,
      });
      slog.debug("dispatching event", ["event", createEvent]);
      document.dispatchEvent(createEvent);
    }
  }

  /**
   * Delete the workspace
   *
   * @param event mouse click event
   */
  private delete(event: MouseEvent): void {
    if (this.disabled == true) {
      slog.debug("Already handled");
      return;
    }
    if (this.input.hidden == false) {
      event.stopPropagation();
      this.remove();
      return;
    }
    if (this.containerNameLabel.textContent === null) {
      console.error("No content in container name");
      this.remove();
      return;
    }
    slog.debug("Delete button clicked");
    this.removeError();
    this.disableItem();
    let workspace = "";
    let channel = "";
    if (this.type == "Workspace") {
      workspace = this.containerNameLabel.textContent;
    } else {
      channel = this.containerNameLabel.textContent;
      workspace = this.parentName;
    }
    event.stopPropagation();
    const deleteEvent = new CustomEvent(`delete${this.type}Event`, {
      detail: {
        uuid: this.dataset.id,
        workspaceName: workspace,
        channelName: channel,
      },
    });

    // Delete notification
    document.dispatchEvent(deleteEvent);
  }

  /**
   * Reveal the editing component for this workspace item.
   *
   * @param event mouse click event
   */
  private create(event: MouseEvent): void {
    event.stopPropagation();
    slog.debug("Edit button clicked");
    this.inputBox.hidden = false;
    this.inputBox.classList.add("show");
    this.containerNameLabel.textContent = "";
    this.input.hidden = false;
    this.confirmBtn.hidden = false;
    this.scrollIntoView();
    this.input.focus();
  }

  private selectContainer(): void {
    if (this.input.hidden == false) {
      console.error("Cannot select while editing");
      return;
    } else if (this.containerNameLabel.textContent === null) {
      console.error("No content in container name");
      return;
    }
    slog.debug(`${this.type} selected`);
    let workspace = "";
    let channel = "";
    if (this.type == "Workspace") {
      workspace = this.containerNameLabel.textContent;
    } else {
      channel = this.containerNameLabel.textContent;
      workspace = this.parentName;
    }
    const selectEvent = new CustomEvent(`select${this.type}Event`, {
      detail: {
        workspaceName: workspace,
        channelName: channel,
        uuid: this.dataset.id,
      },
      bubbles: true,
      composed: true,
    });

    // Select notification
    document.dispatchEvent(selectEvent);
  }

  /**
   * Disables the current item by setting its `disabled` property to `true`,
   * updating its `tabIndex` to `-1`, and adding the "waiting" and "spinner" classes.
   * Also disables and updates the `tabIndex` of the `trashBtn` and `createBtn` elements.
   */
  private disableItem(): void {
    this.disabled = true;
    this.tabIndex = -1;
    this.classList.add("waiting");
    this.classList.add("spinner");

    this.trashBtn.disabled = true;
    this.trashBtn.tabIndex = -1;
    this.createBtn.disabled = true;
    this.createBtn.tabIndex = -1;
  }

  //TODO: Move behavior to view

  /**
   * Enables the item by performing the following actions:
   * - Sets the `disabled` property to `false`.
   * - Removes the "waiting", "spinner", and "show" classes from the element's class list.
   * - Calls the `removeError` method to clear any error state.
   * - Hides the error icon.
   * - Enables the trash button and create button.
   * - Makes the trash button visible and sets its tab index to 0.
   * - Hides the confirm button.
   */
  public enableItem(): void {
    this.disabled = false;
    this.classList.remove("waiting");
    this.classList.remove("spinner");
    this.classList.remove("show");
    this.removeError();
    this.errorIcon.hidden = true;
    this.trashBtn.disabled = false;
    this.createBtn.disabled = false;
    this.trashBtn.hidden = false;
    this.trashBtn.tabIndex = 0;
    this.confirmBtn.hidden = true;
  }

  /**
   * Retrieves the type of the container item.
   *
   * @returns {string} The type of the container item.
   */
  public getType(): string {
    return this.type;
  }

  /**
   * Displays an error message and updates the UI to reflect the error state.
   *
   * @param msg - The error message to display.
   */
  public showError(msg: string): void {
    console.error(msg);
    this.errorDisplay.innerText = msg;
    this.dismissBtn.classList.add("show");
    this.input.classList.add("error");
    this.errorIcon.classList.add("show");
    this.errorIcon.dataset.icon = "material-symbols:dangerous";
  }

  /**
   * Removes the error display from the container item.
   *
   * This method clears the error message, hides the error icon and dismiss button,
   * resets the error icon data attribute, and removes the error class from the input element.
   */
  private removeError() {
    this.errorDisplay.innerText = "";
    this.errorIcon.classList.remove("show");
    this.dismissBtn.classList.remove("show");
    this.errorIcon.dataset.icon = "";
    this.input.classList.remove("error");
  }

  /**
   * Retrieves the name of the container.
   *
   * @returns {string} The text content of the container name label, or an empty string if the label is not set.
   */
  public getName(): string {
    return this.containerNameLabel.textContent || "";
  }

  /**
   * Triggers a click event on the create button.
   * This method simulates a user clicking the edit button,
   * which in turn clicks the create button.
   */
  public clickEditBtn() {
    this.createBtn.click();
  }

  /**
   * Called when the custom element is disconnected from the document's DOM.
   * This method removes all event listeners by aborting the associated controller
   * and sets the controller to null.
   */
  disconnectedCallback(): void {
    // Remove all event listeners
    this.controller?.abort();
    this.controller = null;
  }
}

/**
 * Creates a new instance of `ContainerItem` with the specified type.
 *
 * @param type - The type of the container item.
 * @returns A new `ContainerItem` instance.
 */
export function createContainerItem(type: ContainerType): ContainerItem {
  return new ContainerItem(type);
}

/**
 * Initializes the content of the container by performing the following actions:
 * 1. Calls the `initialize` method on the `ContainerItem` object.
 * 2. Defines a custom element with the tag name "list-item" using the `ContainerItem` class.
 * 3. Logs a message indicating that the Workspace and Channel objects have been created.
 */
export function initContainerContent(
  getTemplate: (templateID: string) => HTMLTemplateElement,
) {
  ContainerItem.initialize(getTemplate);
  customElements.define("list-item", ContainerItem);
  slog.info("Workspace and Channel objects created");
}

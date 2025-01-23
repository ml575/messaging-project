import { slog } from "../slog";

/**
 * A custom interface extending HTMLElement, representing a container element
 * that can have a parent name set. This is used for workspace or channel items.
 */
interface ContainerElement extends HTMLElement {
  setParentName(name: string): void;
}

/**
 * The ChannelView class manages the UI and interactions related to
 * channel creation and refreshing within the currently selected workspace.
 *
 * Responsibilities:
 * - Handles "Create Channel" button to add a new channel container item to the list.
 * - Handles "Refresh" button to refresh channels of the current workspace.
 * - Can be enabled or disabled depending on whether a workspace is selected.
 */
export class ChannelView {
  private button: HTMLButtonElement;
  private channelList: HTMLUListElement;
  private currWorkspace: string;
  private refreshBtn: HTMLButtonElement;
  private channelTitle: HTMLHeadingElement;
  private createContainer: (type: string) => ContainerElement;

  /**
   * Constructs a new ChannelView instance.
   *
   * @param {() => ContainerElement} createContainer - A factory function that creates a new ContainerElement (e.g., for a new channel).
   * @throws Will throw if the required DOM elements are not found.
   */
  constructor(createContainer: () => ContainerElement) {
    const button = document.querySelector("#create-channel-button");
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("Channel creator button not found");
    }
    const channelList = document.querySelector("#channels-list");
    if (!(channelList instanceof HTMLUListElement)) {
      throw new Error("Channel list element not found");
    }

    const refreshButton = document.querySelector("#refresh-channel-button");
    if (!(refreshButton instanceof HTMLButtonElement)) {
      throw new Error("Could not find refresh button");
    }

    const channelTitle = document.querySelector("#channels-title");
    if (!(channelTitle instanceof HTMLHeadingElement)) {
      throw new Error("Could not find channel title");
    }

    this.createContainer = createContainer;
    this.channelTitle = channelTitle;
    this.refreshBtn = refreshButton;
    this.button = button;
    this.channelList = channelList;
    this.currWorkspace = "";
    this.button.textContent = "Create Channel";
    this.disable();
    this.button.addEventListener("click", () => this.create());
    this.refreshBtn.addEventListener("click", this.refresh.bind(this));
    slog.info("ChannelView created");
  }

  /**
   * Create a new channel item:
   * - Instantiates a new container item (a channel element).
   * - Sets its parent workspace name.
   * - Appends it to the channel list.
   * - Simulates a click on the edit button to start editing channel name immediately.
   * @private
   */
  private create() {
    slog.info("Create button clicked");

    const channelItem = this.createContainer("Channel");
    slog.info("created workspace item");
    channelItem.setParentName(this.currWorkspace);
    this.channelList.appendChild(channelItem);

    if (!channelItem.shadowRoot) {
      slog.info("shadow root not found");
      throw new Error("shadow root not found");
    }

    const editBtn = channelItem.shadowRoot.querySelector(
      '[data-button="edit"]',
    );
    if (!(editBtn instanceof HTMLButtonElement)) {
      slog.info("edit button not found");
      throw new Error("edit-todo button not found");
    }

    editBtn.click();
  }

  /**
   * Dispatches a custom event to refresh the channel list for the current workspace.
   * @private
   */
  private refresh() {
    slog.info("Refresh button clicked");
    const refreshEvent = new CustomEvent("refreshChannelEvent", {
      detail: { workspaceName: this.currWorkspace },
    });

    // Delete notification
    document.dispatchEvent(refreshEvent);
  }

  /**
   * Enables the channel creation and refresh buttons and removes waiting style.
   */
  public enable() {
    this.button.disabled = false;
    this.button.classList.remove("waiting");
    this.refreshBtn.disabled = false;
    this.refreshBtn.classList.remove("waiting");
  }

  /**
   * Disables the channel creation and refresh buttons and updates the title,
   * indicating that no workspace is currently selected.
   */
  public disable() {
    this.channelTitle.textContent = "Select a workspace";
    this.button.disabled = true;
    this.refreshBtn.disabled = true;
    this.refreshBtn.classList.add("waiting");
    this.button.classList.add("waiting");
  }

  /**
   * Sets the current workspace name and updates the title displayed above the channel list.
   *
   * @param {string} currWorkspace - The currently selected workspace name.
   */
  public setWorkspace(currWorkspace: string) {
    this.channelTitle.textContent = currWorkspace;
    slog.info("Current workspace");
    this.currWorkspace = currWorkspace;
  }
}

/**
 * Factory function to create a new ChannelView instance.
 *
 * @param {() => ContainerElement} createContainer - A factory function that creates a new ContainerElement.
 * @returns {ChannelView} A new instance of ChannelView.
 */
export function createChannelView(
  createContainer: () => ContainerElement,
): ChannelView {
  const CC = new ChannelView(createContainer);
  slog.info("Channel objects created");
  return CC;
}

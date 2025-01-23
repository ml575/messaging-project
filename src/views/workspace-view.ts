import { slog } from "../slog";

/**
 * A custom interface extending HTMLElement for container elements that
 * belong to a parent (e.g., a workspace). This allows setting the parent name.
 */
interface ContainerElement extends HTMLElement {
  setParentName(name: string): void;
}

/**
 * The WorkspaceView class manages the workspace modal and its associated UI elements:
 * - Allows creating a new workspace container item.
 * - Allows refreshing the list of workspaces.
 * - Provides the option to close the modal when clicking outside or selecting a workspace.
 */
class WorkspaceView {
  private modal: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private workspaceBtn: HTMLButtonElement;
  private createBtn: HTMLButtonElement;
  private workspaceList: HTMLUListElement;
  private reloadbtn: HTMLButtonElement;
  private createContainer: () => ContainerElement;

  /**
   * Constructs a new WorkspaceView instance.
   *
   * @param {() => ContainerElement} createContainer - A factory function that creates a new ContainerElement (e.g., for a new workspace).
   * @throws Will throw if any required DOM elements are not found.
   */
  constructor(createContainer: () => ContainerElement) {
    const workspaceBtn = document.querySelector("#workspace-prompt");
    if (!(workspaceBtn instanceof HTMLButtonElement)) {
      throw new Error("Could not find workspace button");
    }
    const modal = document.querySelector("#workspace-modal-container");
    if (!(modal instanceof HTMLElement)) {
      throw new Error("Could not find workspace modal");
    }
    this.modal = modal;
    const closeBtn = this.modal.querySelector("#workspace-modal-close");
    if (!(closeBtn instanceof HTMLButtonElement)) {
      throw new Error("Could not find close button in workspace modal");
    }
    const createBtn = this.modal.querySelector("#workspace-create");
    if (!(createBtn instanceof HTMLButtonElement)) {
      throw new Error("Could not find create button in workspace modal");
    }
    const reloadbtn = this.modal.querySelector("#refresh-account-button");
    if (!(reloadbtn instanceof HTMLButtonElement)) {
      throw new Error("Could not find reload button in workspace modal");
    }
    const workspaceList = document.querySelector("#workspace-list");
    if (!(workspaceList instanceof HTMLUListElement)) {
      throw new Error("Could not find workspace list");
    }
    this.reloadbtn = reloadbtn;
    this.closeBtn = closeBtn;
    this.createBtn = createBtn;
    this.workspaceBtn = workspaceBtn;
    this.workspaceList = workspaceList;
    this.createContainer = createContainer;
    this.createBtn.addEventListener("click", this.create.bind(this));
    this.closeBtn.addEventListener("click", this.close.bind(this));
    this.workspaceBtn.addEventListener("click", this.open.bind(this));
    this.reloadbtn.addEventListener("click", this.refresh.bind(this));
    document.addEventListener("click", this.handleOutsideClick.bind(this));
    document.addEventListener("selectWorkspaceEvent", this.close.bind(this));
    slog.info("Modal connected");
  }

  /**
   * Handles clicks outside the workspace modal to close it if visible.
   *
   * @private
   * @param {MouseEvent} event - The click event.
   */
  private handleOutsideClick(event: MouseEvent) {
    if (
      event.target instanceof HTMLElement &&
      this.workspaceBtn != event.target &&
      !this.modal.contains(event.target) &&
      this.modal.style.display != "none"
    ) {
      this.close();
    }
  }

  /**
   * Dispatches an event to refresh the list of workspaces.
   *
   * @private
   */
  private refresh() {
    slog.info("Refresh button clicked");
    const refreshEvent = new CustomEvent("refreshWorkspaceEvent");

    // Delete notification
    document.dispatchEvent(refreshEvent);
  }

  /**
   * Closes the workspace modal.
   */
  public close() {
    // this.modal.hidden = true;
    this.modal.style.display = "none";
    slog.info("Modal closed");
  }

  /**
   * Opens the workspace modal.
   *
   * @private
   */
  private open() {
    this.modal.style.display = "flex";
    slog.info("Modal opened");
  }

  /**
   * Creates a new workspace item by using the createContainer function and simulates a click on the edit button to start editing immediately.
   *
   * @private
   * @throws Will throw if the workspace item's shadow root or edit button is not found.
   */
  private create() {
    slog.info("Create button clicked");

    const workspaceItem = this.createContainer();
    slog.info("created workspace item");
    this.workspaceList.appendChild(workspaceItem);

    if (!workspaceItem.shadowRoot) {
      slog.info("shadow root not found");
      throw new Error("shadow root not found");
    }

    const editBtn = workspaceItem.shadowRoot.querySelector(
      '[data-button="edit"]',
    );
    if (!(editBtn instanceof HTMLButtonElement)) {
      slog.info("edit button not found");
      throw new Error("edit-todo button not found");
    }

    editBtn.click();
  }
}

/**
 * Factory function to create a new WorkspaceView instance.
 *
 * @param {() => ContainerElement} createContainer - A factory function that creates a new ContainerElement.
 * @returns {WorkspaceView} A new instance of WorkspaceView.
 */
export function createWorkspaceView(
  createContainer: () => ContainerElement,
): WorkspaceView {
  slog.info("Modal objects created");
  return new WorkspaceView(createContainer);
}

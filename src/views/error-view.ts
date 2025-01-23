import { slog } from "../slog";

/**
 * The ErrorView class manages displaying an error notification bar to the user.
 * It can show a simple error message, or show a retriable error message with a countdown,
 * allowing the user to retry the operation or cancel it.
 */
class ErrorView {
  private errorMsg: HTMLLabelElement;
  private retryBtn: HTMLButtonElement;
  private cancelBtn: HTMLButtonElement;
  private errorBox: HTMLElement;
  private timeoutId: number | null = null;
  private controller: AbortController;
  private msg: string;

  /**
   * Constructs a new ErrorView instance.
   *
   * @throws Will throw if required DOM elements are not found.
   */
  constructor() {
    const errorBox = document.querySelector(".notification-bar");
    if (!(errorBox instanceof HTMLElement)) {
      throw new Error("Could not find notification bar");
    }
    this.errorBox = errorBox;

    const cancelBtn = this.errorBox.querySelector("#error-cancel");
    if (!(cancelBtn instanceof HTMLButtonElement)) {
      throw new Error("Could not find cancel button in notification bar");
    }
    const retryBtn = this.errorBox.querySelector("#error-retry");
    if (!(retryBtn instanceof HTMLButtonElement)) {
      throw new Error("Could not find retry button in notification bar");
    }
    const errorMsg = this.errorBox.querySelector(".notification-text");
    if (!(errorMsg instanceof HTMLLabelElement)) {
      throw new Error("Could not find error message in notification bar");
    }
    this.cancelBtn = cancelBtn;
    this.retryBtn = retryBtn;
    this.errorMsg = errorMsg;
    this.controller = new AbortController();
    this.msg = "";
    slog.info("Modal connected");
  }

  /**
   * Displays a simple error message without retry logic.
   *
   * @param {string} msg - The error message to display.
   */
  public show(msg: string): void {
    this.controller.abort();
    this.controller = new AbortController();
    this.errorMsg.innerText = msg;
    this.msg = msg;
    this.errorBox.style.display = "flex";
    this.retryBtn.hidden = true;
    this.cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.close();
    });
  }

  /**
   * Displays a retriable error message, providing a retry button, a cancel button,
   * and a countdown before automatically retrying if the user does not cancel.
   *
   * @param {Event} event - The event to dispatch when retrying.
   * @param {string} msg - The error message to display.
   * @param {Event} reverseEvent - The event to dispatch if the user cancels.
   * @param {number} [secondsBeforeRetry=10] - How many seconds before automatically retrying.
   */
  public showRetriableError(
    event: Event,
    msg: string,
    reverseEvent: Event,
    secondsBeforeRetry: number = 10,
  ): void {
    this.controller.abort();
    this.controller = new AbortController();
    this.retryBtn.hidden = false;
    this.cancelBtn.hidden = false;
    this.errorMsg.innerText = msg;
    this.msg = msg;
    this.errorBox.style.display = "flex";
    this.cancelBtn.addEventListener(
      "click",
      (e) => {
        slog.info("clicked cancel btn");
        this.abortClose(e, reverseEvent);
      },
      { signal: this.controller.signal },
    );
    this.retryBtn.addEventListener("click", this.retry.bind(this, event), {
      signal: this.controller.signal,
    });
    this.timeoutId = setTimeout(
      this.retry.bind(this, event),
      secondsBeforeRetry * 1000,
      { signal: this.controller.signal },
    );
    this.startCountdown(secondsBeforeRetry);
  }

  /**
   * Starts a countdown in the error message, updating every second.
   *
   * @param {number} seconds - The number of seconds to count down before retry.
   */
  public startCountdown(seconds: number): void {
    let timeRemaining = seconds;

    const intervalId = setInterval(() => {
      if (timeRemaining <= 0) {
        clearInterval(intervalId);
      } else {
        this.errorMsg.innerText = `${this.msg}. Retrying in ${timeRemaining} seconds`;
        timeRemaining--;
      }
    }, 1000); // 1000 milliseconds = 1 second
  }

  /**
   * Retries the originally intended event by dispatching it again, then closes the error view.
   *
   * @private
   * @param {Event} event - The event to dispatch on retry.
   */
  private retry(event: Event) {
    slog.info("Retrying event");
    document.dispatchEvent(event);
    this.controller.abort();
    this.close();
  }

  /**
   * Handles aborting and closing the error view when the user clicks cancel,
   * also dispatching a reverse event to roll back any previous attempted operation.
   *
   * @private
   * @param {MouseEvent} event - The click event from the cancel button.
   * @param {Event} reverseEvent - The reverse event to dispatch.
   */
  private abortClose(event: MouseEvent, reverseEvent: Event) {
    event.stopPropagation();
    this.controller.abort();
    this.close(reverseEvent);
  }

  /**
   * Closes the error view. If a reverseEvent is provided, it is dispatched to revert any changes.
   *
   * @param {Event | null} [reverseEvent=null] - The event to dispatch upon closing, or null if none.
   */
  public close(reverseEvent: Event | null = null) {
    if (reverseEvent) {
      slog.info("Dispatching reverse event");
      document.dispatchEvent(reverseEvent);
    } else {
      slog.info("No reverse event to dispatch");
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.errorBox.style.display = "none";
    slog.info("Error display closed");
  }
}

/**
 * Factory function to create a new ErrorView instance.
 *
 * @returns {ErrorView} A new instance of ErrorView.
 */
export function createErrorView(): ErrorView {
  slog.info("Modal objects created");
  return new ErrorView();
}

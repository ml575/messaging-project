/**
 * Initializes the ExtensionView by selecting required DOM elements and instantiating a new ExtensionView instance.
 *
 * @returns {ExtensionView} A new instance of ExtensionView.
 * @throws Will throw an error if any required DOM elements are not found.
 */
export function initExtensionView(): ExtensionView {
  const surpriseBtn = document.querySelector("#surprise-button");
  if (!(surpriseBtn instanceof HTMLButtonElement)) {
    console.error(
      "Error: #surprise-button is not a button element:",
      surpriseBtn,
    );
    throw new Error("surprise button does not exist");
  }

  const surpriseModal = document.querySelector("#surprise-modal-container");
  if (!(surpriseModal instanceof HTMLElement)) {
    console.error(
      "Error: #surprise-modal-container is not an HTML element:",
      surpriseModal,
    );
    throw new Error("surprise modal does not exist");
  }

  const surpriseOverlay = document.querySelector("#surprise-modal-overlay");
  if (!(surpriseOverlay instanceof HTMLElement)) {
    console.error(
      "Error: #surprise-modal-overlay is not an HTML element:",
      surpriseOverlay,
    );
    throw new Error("surprise modal overlay does not exist");
  }

  const surpriseDisco = document.querySelector("#surprise-disco");
  if (!(surpriseDisco instanceof HTMLElement)) {
    console.error(
      "Error: #surprise-disco is not an HTML element:",
      surpriseDisco,
    );
    throw new Error("surprise modal disco does not exist");
  }

  const surpriseContent = document.querySelector("#surprise-modal-content");
  if (!(surpriseContent instanceof HTMLElement)) {
    console.error(
      "Error: #surprise-modal-content is not an HTML element:",
      surpriseContent,
    );
    throw new Error("surprise content does not exist");
  }

  const cancelBtn = document.querySelector("#surprise-cancel");
  if (!(cancelBtn instanceof HTMLButtonElement)) {
    console.error(
      "Error: #surprise-cancel is not a button element:",
      cancelBtn,
    );
    throw new Error("cancel button does not exist");
  }

  const continueBtn = document.querySelector("#surprise-continue");
  if (!(continueBtn instanceof HTMLButtonElement)) {
    console.error(
      "Error: #surprise-continue is not a button element:",
      continueBtn,
    );
    throw new Error("continue button does not exist");
  }

  const abortBtn = document.querySelector("#surprise-abort");
  if (!(abortBtn instanceof HTMLButtonElement)) {
    console.error("Error: #surprise-abort is not a button element:", abortBtn);
    throw new Error("abort button does not exist");
  }

  return new ExtensionView(
    surpriseBtn,
    surpriseModal,
    surpriseOverlay,
    surpriseDisco,
    surpriseContent,
    cancelBtn,
    continueBtn,
    abortBtn,
  );
}

/**
 * The ExtensionView class manages the "surprise" modal, including:
 * - Displaying a warning before showing flashy elements.
 * - Providing controls to continue, cancel, or abort the "celebration" (flashy elements).
 * - Timing and color changes during the "disco" animation effect.
 */
export class ExtensionView {
  private surpriseBtn: HTMLElement;
  private surpriseModal: HTMLElement;
  private surpriseOverlay: HTMLElement;
  private surpriseDisco: HTMLElement;
  private surpriseContent: HTMLElement;
  private cancelBtn: HTMLButtonElement;
  private continueBtn: HTMLButtonElement;
  private abortBtn: HTMLButtonElement;
  private timeoutIdList: number[];

  /**
   * Constructs a new ExtensionView instance.
   *
   * @param {HTMLButtonElement} surpriseBtn - The button that opens the surprise modal.
   * @param {HTMLElement} surpriseModal - The container for the surprise modal.
   * @param {HTMLElement} surpriseOverlay - The overlay element for the modal.
   * @param {HTMLElement} surpriseDisco - The container where the disco visuals are displayed.
   * @param {HTMLElement} surpriseContent - The content section of the modal (warning message and buttons).
   * @param {HTMLButtonElement} cancelBtn - The cancel button to close the modal without celebrating.
   * @param {HTMLButtonElement} continueBtn - The continue button to start the celebration.
   * @param {HTMLButtonElement} abortBtn - The abort button to stop the ongoing celebration.
   */
  constructor(
    surpriseBtn: HTMLButtonElement,
    surpriseModal: HTMLElement,
    surpriseOverlay: HTMLElement,
    surpriseDisco: HTMLElement,
    surpriseContent: HTMLElement,
    cancelBtn: HTMLButtonElement,
    continueBtn: HTMLButtonElement,
    abortBtn: HTMLButtonElement,
  ) {
    this.surpriseBtn = surpriseBtn;
    this.surpriseModal = surpriseModal;
    this.surpriseOverlay = surpriseOverlay;
    this.surpriseDisco = surpriseDisco;
    this.surpriseContent = surpriseContent;
    this.cancelBtn = cancelBtn;
    this.continueBtn = continueBtn;
    this.abortBtn = abortBtn;
    this.timeoutIdList = [];

    this.surpriseBtn.addEventListener("click", this.open.bind(this));
    this.cancelBtn.addEventListener("click", this.close.bind(this));
    this.continueBtn.addEventListener("click", this.celebrate.bind(this));
    this.abortBtn.addEventListener("click", this.close.bind(this));
    document.addEventListener("click", this.handleOutsideClick.bind(this));
    console.log("Extension modal connected");
  }

  /**
   * Handles clicks outside the modal content to close the modal if it is open.
   *
   * @private
   * @param {MouseEvent} event - The click event.
   */
  private handleOutsideClick(event: MouseEvent) {
    console.log(this.surpriseOverlay.style.backgroundColor);
    if (
      event.target instanceof HTMLElement &&
      this.surpriseBtn != event.target &&
      !this.surpriseContent.contains(event.target) &&
      this.surpriseModal.style.display !== "none" &&
      this.surpriseContent.style.display !== "none"
    ) {
      this.close();
    }
  }

  /**
   * Closes the surprise modal, clears any ongoing timeouts, and resets UI elements.
   *
   * @private
   */
  private close() {
    // this.modal.hidden = true;
    if (this.surpriseModal.style.display !== "none") {
      this.timeoutIdList.forEach((id) => {
        window.clearTimeout(id);
      });
      this.surpriseDisco.style.display = "none";
      this.surpriseOverlay.style.backgroundColor = "transparent";
      this.timeoutIdList = [];
      this.abortBtn.style.display = "none";
      this.surpriseModal.style.display = "none";
    }
    console.log("Modal closed");
  }

  /**
   * Opens the surprise modal, showing the initial warning content.
   *
   * @private
   */
  private open() {
    this.surpriseModal.style.display = "flex";
    this.surpriseContent.style.display = "block";
    console.log("Modal opened");
  }

  /**
   * Initiates the "celebrate" mode, hiding the warning content and displaying the disco lights.
   * It also schedules a series of timed color changes for the overlay background.
   *
   * @private
   */
  private celebrate() {
    this.surpriseContent.style.display = "none";
    this.surpriseOverlay.style.backgroundColor = "rgba(246, 42, 42, 0.3)";
    this.abortBtn.style.display = "block";
    this.displayDisco();

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(246, 152, 74, 0.3)";
      }, 1000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(246, 226, 74, 0.3)";
      }, 2000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(111, 246, 74, 0.3)";
      }, 3000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 246, 151, 0.3)";
      }, 4000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 246, 243, 0.3)";
      }, 5000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 143, 246, 0.3)";
      }, 6000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 77, 246, 0.3)";
      }, 7000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(172, 74, 246, 0.3)";
      }, 8000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(246, 42, 42, 0.3)";
      }, 9000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(246, 152, 74, 0.3)";
      }, 10000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(246, 226, 74, 0.3)";
      }, 11000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(111, 246, 74, 0.3)";
      }, 12000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 246, 151, 0.3)";
      }, 13000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 246, 243, 0.3)";
      }, 14000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 143, 246, 0.3)";
      }, 15000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 77, 246, 0.3)";
      }, 16000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(172, 74, 246, 0.3)";
      }, 17000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(246, 42, 42, 0.3)";
      }, 18000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(246, 152, 74, 0.3)";
      }, 19000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(246, 226, 74, 0.3)";
      }, 20000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(111, 246, 74, 0.3)";
      }, 21000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 246, 151, 0.3)";
      }, 22000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 246, 243, 0.3)";
      }, 23000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 143, 246, 0.3)";
      }, 24000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(74, 77, 246, 0.3)";
      }, 25000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.surpriseOverlay.style.backgroundColor = "rgba(246, 42, 42, 0.3)";
      }, 26000),
    );

    this.timeoutIdList.push(
      window.setTimeout(() => {
        this.close();
      }, 26000),
    );
  }

  /**
   * Displays a disco-like sphere made up of colored tiles.
   * This method creates and positions a series of panels to create a disco ball effect.
   *
   * @private
   */
  private displayDisco() {
    this.surpriseDisco.style.display = "block";

    const rad = 75;
    const numPanels = 45;
    const panelSize = 15;
    const offset = 0.005;
    const step = (Math.PI - offset) / numPanels;

    this.surpriseDisco.innerHTML = "";

    for (let angle = offset; angle < Math.PI; angle += step) {
      const vertLoc = rad * Math.cos(angle);
      const horizontalRad =
        Math.abs(
          rad * Math.cos(0) * Math.sin(angle) -
            rad * Math.cos(Math.PI) * Math.sin(angle),
        ) / 2.5;
      const circ = Math.abs(2 * Math.PI * horizontalRad);
      const panelCap = Math.floor(circ / panelSize);
      const angleStep = (Math.PI * 2 - offset) / panelCap;

      for (
        var curveAngle = angleStep / 2 + offset;
        curveAngle < Math.PI * 2;
        curveAngle += angleStep
      ) {
        const panel = document.createElement("section");
        panel.className = "panel";

        const xPos = Math.cos(curveAngle) * Math.sin(angle) * rad;
        const yPos = Math.sin(curveAngle) * Math.sin(angle) * rad;
        panel.style.transform =
          "translateX(" +
          xPos +
          "px) translateY(" +
          yPos +
          "px) translateZ(" +
          vertLoc +
          "px)";

        const squareTile = document.createElement("section");
        squareTile.style.width = panelSize + "px";
        squareTile.style.height = panelSize + "px";

        const hue = Math.floor(Math.random() * 361);
        const sat = 100;
        const light = Math.floor(Math.random() * 21) + 65;
        squareTile.style.backgroundColor = `hsl(${hue}, ${sat}%, ${light}%)`;
        squareTile.style.transform =
          "rotate(" + -curveAngle + "rad) rotateY(" + -angle + "rad)";

        panel.appendChild(squareTile);

        this.surpriseDisco.appendChild(panel);
      }
    }
  }
}

export function setCardDragPoint(cardEl: HTMLDivElement, e: DragEvent) {
  const userAgent = navigator.userAgent.toLowerCase();
  const rect = cardEl.getBoundingClientRect();
  let offsetX;
  let offsetY;

  // these magic numbers came from dragging a card out of dock and checking that it placed on the board as expected
  if (userAgent.includes("safari") && !userAgent.includes("chrome")) {  // Safari
    offsetX = rect.width / 2;
    offsetY = rect.height / 2;
  } else if (userAgent.includes("firefox")) {  // Firefox
    offsetX = rect.width / 1.3;
    offsetY = rect.height / 1.3;
  } else {  // Chrome and other browsers
    offsetX = rect.width / 1.5;
    offsetY = rect.height / 2;
  }

  e.dataTransfer!.setDragImage(cardEl, offsetX, offsetY);
}

type ElementType = 'kwToken' | 'card';
type AgentType = 'safari' | 'chrome' | 'firefox';
interface Offsets {
  x: number,
  y: number
}

function getAgentString(): AgentType {
  const userAgent: string = navigator.userAgent.toLowerCase();

  if (userAgent.includes("safari") && !userAgent.includes("chrome")) {  // Safari
    return 'safari';
  } else if (userAgent.includes("firefox")) {  // Firefox
    return 'firefox';
  } else {  // Chrome and other browsers
    return 'chrome';
  }
}

function getOffsets(element: HTMLDivElement, elementType: ElementType): Offsets {
  // these magic numbers came from dragging a card out of dock and checking that it placed on the board as expected
  const divisionModifiers: Record<AgentType, Record<ElementType, Record<string, number>>> = {
    safari: {
      card: {x: 2, y: 2,},
      kwToken: {x: 2, y: 2,},
    },
    firefox: {
      card: {x: 1.3, y: 1.3,},
      kwToken: {x: 1, y: 1,},
    },
    chrome: {
      card: {x: 1.5, y: 2,},
      kwToken: {x: 1.5, y: 1.3,},
    },
  }

  const rect = element.getBoundingClientRect();
  let agent:AgentType = getAgentString();

  const x: number = rect.width / divisionModifiers[agent][elementType]['x'];
  const y:number = rect.height / divisionModifiers[agent][elementType]['y'];
  return {x, y};
}

export function setElementDragPoint(element: HTMLDivElement, e: DragEvent, elementType: ElementType): void {
  const offsets: Offsets = getOffsets(element, elementType);

  let offsetX:number = offsets.x;
  let offsetY:number = offsets.y;

  e.dataTransfer!.setDragImage(element, offsetX, offsetY);
}

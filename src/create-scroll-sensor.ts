import { createEffect, onCleanup } from "solid-js";

import { Coordinates, useDragDropContext } from "./drag-drop-context";

interface ScrollSensorOptions {
  // Distance in pixels from a scroll edge at which auto-scroll kicks in.
  threshold?: number;
  // Maximum auto-scroll speed in pixels per animation frame.
  maxSpeed?: number;
}

const isScrollable = (element: Element): boolean => {
  const style = getComputedStyle(element);
  return /(auto|scroll|overlay)/.test(
    style.overflow + style.overflowX + style.overflowY
  );
};

const getScrollableAncestors = (node: Element | null): Element[] => {
  const ancestors: Element[] = [];
  let element: Element | null = node?.parentElement ?? null;
  while (element) {
    if (isScrollable(element)) {
      ancestors.push(element);
    }
    element = element.parentElement;
  }
  return ancestors;
};

// Auto-scroll scroll containers (and the window) when a drag nears their edges,
// and keep droppable geometry correct while any scrolling happens during a
// drag. Mount inside a DragDropProvider (DragDropSensors does this for you).
const createScrollSensor = (options: ScrollSensorOptions = {}): void => {
  const [state, { recomputeLayouts, detectCollisions }] = useDragDropContext()!;

  const threshold = options.threshold ?? 40; // pixels
  const maxSpeed = options.maxSpeed ?? 20; // pixels per frame

  let frameId: number | null = null;
  let scrolling = false;

  // Distance from an edge maps to a speed: at the edge -> maxSpeed, at the
  // threshold -> 0. Distances beyond the threshold produce no scroll.
  const speedFor = (distanceFromEdge: number): number => {
    if (distanceFromEdge >= threshold) return 0;
    return maxSpeed * (1 - Math.max(distanceFromEdge, 0) / threshold);
  };

  const scrollContainer = (element: Element, point: Coordinates): boolean => {
    const rect = element.getBoundingClientRect();
    // Only act on the container the pointer is actually over.
    if (
      point.x < rect.left ||
      point.x > rect.right ||
      point.y < rect.top ||
      point.y > rect.bottom
    ) {
      return false;
    }

    let dx = 0;
    let dy = 0;
    const topDistance = point.y - rect.top;
    const bottomDistance = rect.bottom - point.y;
    const leftDistance = point.x - rect.left;
    const rightDistance = rect.right - point.x;

    if (topDistance < threshold) dy = -speedFor(topDistance);
    else if (bottomDistance < threshold) dy = speedFor(bottomDistance);
    if (leftDistance < threshold) dx = -speedFor(leftDistance);
    else if (rightDistance < threshold) dx = speedFor(rightDistance);

    if (dx === 0 && dy === 0) return false;

    const beforeTop = element.scrollTop;
    const beforeLeft = element.scrollLeft;
    element.scrollTop += dy;
    element.scrollLeft += dx;
    return element.scrollTop !== beforeTop || element.scrollLeft !== beforeLeft;
  };

  const scrollWindow = (point: Coordinates): boolean => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    let dx = 0;
    let dy = 0;
    if (point.y < threshold) dy = -speedFor(point.y);
    else if (height - point.y < threshold) dy = speedFor(height - point.y);
    if (point.x < threshold) dx = -speedFor(point.x);
    else if (width - point.x < threshold) dx = speedFor(width - point.x);

    if (dx === 0 && dy === 0) return false;
    window.scrollBy(dx, dy);
    return true;
  };

  const step = (): void => {
    const point = state.active.sensor?.coordinates.current;
    if (!point) return;

    // Prefer the container under the current drop target, then the dragged
    // element, then fall back to the window.
    const node =
      state.active.droppable?.node ?? state.active.draggable?.node ?? null;

    for (const container of getScrollableAncestors(node)) {
      if (scrollContainer(container, point)) return;
    }
    scrollWindow(point);
  };

  const loop = (): void => {
    step();
    frameId = requestAnimationFrame(loop);
  };

  // Recompute droppable layouts and the active collision on every scroll during
  // a drag (whether from auto-scroll above or a user scrolling the container),
  // otherwise drop targets drift from where they visually are.
  const onScroll = (): void => {
    recomputeLayouts();
    detectCollisions();
  };

  const start = (): void => {
    if (scrolling) return;
    scrolling = true;
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    frameId = requestAnimationFrame(loop);
  };

  const stop = (): void => {
    if (!scrolling) return;
    scrolling = false;
    document.removeEventListener("scroll", onScroll, { capture: true });
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  createEffect(() => {
    if (state.active.draggableId !== null) {
      start();
    } else {
      stop();
    }
  });

  onCleanup(stop);
};

export { createScrollSensor };
export type { ScrollSensorOptions };

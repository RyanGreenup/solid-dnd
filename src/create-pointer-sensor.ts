import { onCleanup, onMount } from "solid-js";

import {
  Coordinates,
  Id,
  SensorActivator,
  useDragDropContext,
} from "./drag-drop-context";
import { Transform } from "./layout";

interface PointerSensorOptions {
  // Milliseconds to hold still before a drag activates (long-press style).
  activationDelay?: number;
  // Pixels of pointer movement that activate a drag before the delay elapses.
  activationDistance?: number;
}

const createPointerSensor = (
  id: Id = "pointer-sensor",
  options: PointerSensorOptions = {}
): void => {
  const [
    state,
    {
      addSensor,
      removeSensor,
      sensorStart,
      sensorMove,
      sensorEnd,
      dragStart,
      dragEnd,
    },
  ] = useDragDropContext()!;
  const activationDelay = options.activationDelay ?? 250; // milliseconds
  const activationDistance = options.activationDistance ?? 10; // pixels

  onMount(() => {
    addSensor({ id, activators: { pointerdown: attach } });
  });

  onCleanup(() => {
    // Tear down any in-flight drag listeners/timer before removing the sensor,
    // otherwise unmounting mid-drag (route change, item filtered out of a list)
    // leaks document listeners and the pending activation timeout until the
    // next pointerup, which may never come.
    detach();
    removeSensor(id);
  });

  const isActiveSensor = () => state.active.sensorId === id;

  const initialCoordinates: Coordinates = { x: 0, y: 0 };

  let activationDelayTimeoutId: number | null = null;
  let activationDraggableId: Id | null = null;
  let activationPointerType: string = "";

  const attach: SensorActivator<"pointerdown"> = (event, draggableId) => {
    if (event.button !== 0) return;

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
    // Suppress the iOS/Safari long-press callout and context menu that would
    // otherwise fire mid-drag and steal the gesture.
    document.addEventListener("contextmenu", onContextMenu);

    activationDraggableId = draggableId;
    activationPointerType = event.pointerType;
    initialCoordinates.x = event.clientX;
    initialCoordinates.y = event.clientY;

    activationDelayTimeoutId = window.setTimeout(onActivate, activationDelay);
  };

  const detach = (): void => {
    if (activationDelayTimeoutId) {
      clearTimeout(activationDelayTimeoutId);
      activationDelayTimeoutId = null;
    }

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerCancel);
    document.removeEventListener("contextmenu", onContextMenu);
    document.removeEventListener("selectionchange", clearSelection);
  };

  const onActivate = (): void => {
    if (!state.active.sensor) {
      sensorStart(id, initialCoordinates);
      dragStart(activationDraggableId!);

      clearSelection();
      document.addEventListener("selectionchange", clearSelection);
    } else if (!isActiveSensor()) {
      detach();
    }
  };

  const onPointerMove = (event: PointerEvent): void => {
    const coordinates: Coordinates = { x: event.clientX, y: event.clientY };

    if (!state.active.sensor) {
      const transform: Transform = {
        x: coordinates.x - initialCoordinates.x,
        y: coordinates.y - initialCoordinates.y,
      };

      if (Math.sqrt(transform.x ** 2 + transform.y ** 2) > activationDistance) {
        if (activationPointerType === "touch") {
          // Moving a touch before the long-press delay elapses is a scroll,
          // not a drag. Abort the pending activation and let the browser (and
          // pointercancel) take over so the list scrolls normally.
          detach();
        } else {
          onActivate();
        }
      }
    }

    if (isActiveSensor()) {
      event.preventDefault();
      sensorMove(coordinates);
    }
  };

  const onPointerUp = (event: PointerEvent): void => {
    detach();
    if (isActiveSensor()) {
      event.preventDefault();
      dragEnd();
      sensorEnd();
    }
  };

  const onPointerCancel = (event: PointerEvent): void => {
    // The OS or browser reclaimed the pointer (scroll takeover, incoming call,
    // gesture, app switch). End any active drag cleanly so it cannot get stuck.
    detach();
    if (isActiveSensor()) {
      event.preventDefault();
      dragEnd();
      sensorEnd();
    }
  };

  const onContextMenu = (event: Event): void => {
    if (isActiveSensor()) {
      event.preventDefault();
    }
  };

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
  };
};

export { createPointerSensor };
export type { PointerSensorOptions };

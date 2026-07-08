import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@solidjs/testing-library";

import { DragDropProvider } from "../drag-drop-context";
import { DragDropSensors } from "../drag-drop-sensors";
import { createDraggable } from "../create-draggable";
import { useDragDropContext } from "../drag-drop-context";
import type { DragDropState } from "../drag-drop-context";

// Render a single draggable inside a provider with only the pointer sensor
// (auto-scroll disabled so its rAF loop does not interfere with fake timers).
// `capture` hands the store back to the test so it can assert active state.
const renderDraggable = (
  capture: (state: DragDropState) => void,
  show = true
) => {
  const Item = () => {
    const draggable = createDraggable(1);
    return <div ref={draggable} data-testid="item" />;
  };

  const Capture = () => {
    const [state] = useDragDropContext()!;
    capture(state);
    return null;
  };

  return render(() => (
    <DragDropProvider>
      <DragDropSensors scrollSensor={false}>
        <Capture />
        {show ? <Item /> : null}
      </DragDropSensors>
    </DragDropProvider>
  ));
};

const pointerdownAt = (element: Element, x = 0, y = 0) => {
  element.dispatchEvent(
    new MouseEvent("pointerdown", {
      button: 0,
      clientX: x,
      clientY: y,
      bubbles: true,
    })
  );
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createPointerSensor", () => {
  it("removes all document listeners and cancels activation on unmount mid-press (leak regression)", () => {
    vi.useFakeTimers();
    let state!: DragDropState;
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const { getByTestId, unmount } = renderDraggable((s) => (state = s));

    pointerdownAt(getByTestId("item"));

    // Unmount while the activation timer is still pending.
    unmount();

    for (const type of [
      "pointermove",
      "pointerup",
      "pointercancel",
      "contextmenu",
    ]) {
      expect(removeSpy).toHaveBeenCalledWith(type, expect.any(Function));
    }

    // The pending activation timer must have been cleared: advancing past the
    // delay must NOT start a drag on the torn-down component.
    vi.advanceTimersByTime(1000);
    expect(state.active.draggableId).toBeNull();
  });

  it("ends a stuck drag when the pointer is cancelled (pointercancel regression)", () => {
    vi.useFakeTimers();
    let state!: DragDropState;

    const { getByTestId } = renderDraggable((s) => (state = s));

    pointerdownAt(getByTestId("item"));
    // Hold still past the activation delay so the drag activates.
    vi.advanceTimersByTime(300);
    expect(state.active.draggableId).toBe(1);

    // The OS/browser reclaims the pointer.
    document.dispatchEvent(new MouseEvent("pointercancel", { bubbles: true }));
    expect(state.active.draggableId).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { closestCenter, closestCorners, mostIntersecting } from "../collision";
import { Draggable, Droppable } from "../drag-drop-context";
import { Layout } from "../layout";

const draggableAt = (
  x: number,
  y: number,
  width = 10,
  height = 10
): Draggable =>
  ({
    transformed: new Layout({ x, y, width, height }),
  } as unknown as Draggable);

const droppableAt = (
  id: string,
  x: number,
  y: number,
  width = 10,
  height = 10
): Droppable =>
  ({
    id,
    layout: new Layout({ x, y, width, height }),
  } as unknown as Droppable);

const noActive = { activeDroppableId: null };

describe("mostIntersecting", () => {
  it("picks the droppable with the greatest overlap", () => {
    const draggable = draggableAt(4, 0);
    const droppables = [droppableAt("a", 0, 0), droppableAt("b", 100, 0)];
    expect(mostIntersecting(draggable, droppables, noActive)?.id).toBe("a");
  });

  it("returns null when nothing overlaps", () => {
    const draggable = draggableAt(500, 500);
    const droppables = [droppableAt("a", 0, 0), droppableAt("b", 100, 0)];
    expect(mostIntersecting(draggable, droppables, noActive)).toBeNull();
  });

  it("keeps the active droppable on an equal-overlap tie", () => {
    // Draggable overlaps both a and b by an identical 5x10 strip.
    const draggable = draggableAt(5, 0, 10, 10);
    const droppables = [droppableAt("a", 0, 0), droppableAt("b", 10, 0)];
    expect(
      mostIntersecting(draggable, droppables, { activeDroppableId: "b" })?.id
    ).toBe("b");
  });
});

describe("closestCenter", () => {
  it("picks the droppable whose center is nearest", () => {
    const draggable = draggableAt(0, 0);
    const droppables = [droppableAt("a", 3, 0), droppableAt("b", 80, 0)];
    expect(closestCenter(draggable, droppables, noActive)?.id).toBe("a");
  });
});

describe("closestCorners", () => {
  it("picks the droppable whose corners are nearest", () => {
    const draggable = draggableAt(0, 0);
    const droppables = [droppableAt("a", 2, 2), droppableAt("b", 90, 90)];
    expect(closestCorners(draggable, droppables, noActive)?.id).toBe("a");
  });
});

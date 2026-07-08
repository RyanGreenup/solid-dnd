import { describe, expect, it } from "vitest";

import {
  Layout,
  distanceBetweenPoints,
  intersectionRatioOfLayouts,
  layoutsAreEqual,
  stripTransformFromLayout,
  transformLayout,
} from "../layout";

const layout = (x: number, y: number, width: number, height: number): Layout =>
  new Layout({ x, y, width, height });

describe("Layout", () => {
  it("floors its rect and derives edges, center and corners", () => {
    const l = layout(10.9, 20.9, 100.9, 50.9);
    expect(l.rect).toEqual({ x: 10, y: 20, width: 100, height: 50 });
    expect(l.right).toBe(110);
    expect(l.bottom).toBe(70);
    expect(l.center).toEqual({ x: 60, y: 45 });
    expect(l.corners.topLeft).toEqual({ x: 10, y: 20 });
    expect(l.corners.bottomRight).toEqual({ x: 10, y: 70 });
  });
});

describe("distanceBetweenPoints", () => {
  it("computes euclidean distance", () => {
    expect(distanceBetweenPoints({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("transformLayout", () => {
  it("offsets a layout by a transform", () => {
    const result = transformLayout(layout(10, 10, 20, 20), { x: 5, y: -3 });
    expect(result.rect).toEqual({ x: 15, y: 7, width: 20, height: 20 });
  });
});

describe("layoutsAreEqual", () => {
  it("is true for identical rects and false otherwise", () => {
    expect(layoutsAreEqual(layout(0, 0, 10, 10), layout(0, 0, 10, 10))).toBe(
      true
    );
    expect(layoutsAreEqual(layout(0, 0, 10, 10), layout(1, 0, 10, 10))).toBe(
      false
    );
  });
});

describe("intersectionRatioOfLayouts", () => {
  it("returns 0 for non-overlapping layouts", () => {
    expect(
      intersectionRatioOfLayouts(layout(0, 0, 10, 10), layout(100, 100, 10, 10))
    ).toBe(0);
  });

  it("returns 1 for identical layouts", () => {
    expect(
      intersectionRatioOfLayouts(layout(0, 0, 10, 10), layout(0, 0, 10, 10))
    ).toBe(1);
  });

  it("returns the intersection-over-union for partial overlap", () => {
    // Two 10x10 boxes overlapping in a 5x5 corner: IoU = 25 / (100 + 100 - 25).
    expect(
      intersectionRatioOfLayouts(layout(0, 0, 10, 10), layout(5, 5, 10, 10))
    ).toBeCloseTo(25 / 175, 6);
  });
});

describe("stripTransformFromLayout", () => {
  it("removes a 2d matrix translation", () => {
    const stripped = stripTransformFromLayout(
      layout(30, 40, 10, 10),
      "matrix(1, 0, 0, 1, 20, 15)"
    );
    expect(stripped.rect).toEqual({ x: 10, y: 25, width: 10, height: 10 });
  });

  it("removes a 3d matrix translation", () => {
    const stripped = stripTransformFromLayout(
      layout(30, 40, 10, 10),
      "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 20, 15, 0, 1)"
    );
    expect(stripped.rect).toEqual({ x: 10, y: 25, width: 10, height: 10 });
  });

  it("leaves the layout unchanged when there is no transform", () => {
    const stripped = stripTransformFromLayout(layout(30, 40, 10, 10), "none");
    expect(stripped.rect).toEqual({ x: 30, y: 40, width: 10, height: 10 });
  });
});

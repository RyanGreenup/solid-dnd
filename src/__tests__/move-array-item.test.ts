import { describe, expect, it } from "vitest";

import { moveArrayItem } from "../move-array-item";

describe("moveArrayItem", () => {
  it("moves an item to a later index", () => {
    expect(moveArrayItem(["a", "b", "c", "d"], 0, 2)).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("moves an item to an earlier index", () => {
    expect(moveArrayItem(["a", "b", "c", "d"], 3, 1)).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("is a no-op when from and to are equal", () => {
    expect(moveArrayItem(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the source array", () => {
    const source = ["a", "b", "c"];
    moveArrayItem(source, 0, 2);
    expect(source).toEqual(["a", "b", "c"]);
  });
});

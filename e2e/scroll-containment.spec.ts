import { test, expect } from "@playwright/test";

// Conventional scroll UX: scrolling the drag-and-drop region must not "chain"
// into the outer page once the region reaches its own scroll boundary. A user
// scrolling within the sortable list expects only that list to move, not the
// whole page underneath it.
test.describe("scroll containment", () => {
  test("scrolling the sortable region to its edge does not scroll the outer page", async ({
    page,
  }) => {
    await page.goto("/");

    const region = page.locator(".scroll-container");
    await expect(region).toBeVisible();

    // Precondition: the page itself must be taller than the viewport, otherwise
    // "the page did not scroll" would pass trivially and prove nothing.
    const pageIsScrollable = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight
    );
    expect(pageIsScrollable, "page should be taller than the viewport").toBe(
      true
    );

    // Start from the very top.
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // Park the pointer over the middle of the region and wheel far past its own
    // scroll range so it saturates. Without containment the surplus chains to
    // the window.
    const box = await region.boundingBox();
    if (!box) throw new Error("scroll region has no layout box");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(150);

    const innerScrollTop = await region.evaluate((el) => el.scrollTop);
    const pageScrollY = await page.evaluate(() => window.scrollY);

    // The region absorbed the scroll (it did move)...
    expect(innerScrollTop, "inner region should have scrolled").toBeGreaterThan(
      0
    );
    // ...and the outer page stayed put (no scroll chaining / double scroll).
    expect(pageScrollY, "outer page must not chain-scroll").toBe(0);
  });
});

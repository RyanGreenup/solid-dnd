# Production-readiness checklist

Exhaustive list of what stood between `@thisbeyond/solid-dnd` (vendored copy) and
a production launch that must work on mobile, iPad, and desktop. Items are
grouped and ordered by how likely they are to block a real deployment.

This is a living document. The **hardening pass** section below tracks the work
done on the `harden-mobile-prod` branch; the P0-P5 sections are the full gap
inventory with per-item status.

Legend: `[x]` done, `[ ]` not done, `[~]` partial / documented-only.

## Hardening pass status (branch: harden-mobile-prod)

In scope this pass (mobile/iPad/desktop blockers + pragmatic hardening):

- [x] Sensor detach on mid-drag unmount (leak fix)
- [x] `pointercancel` handling (no stuck drag on interrupted touch)
- [x] `pointerType`-aware activation (touch move = scroll, mouse/pen = drag)
- [x] Configurable sensor activation (`activationDelay`, `activationDistance`)
- [x] iOS text-callout / context-menu suppression during drag
- [x] Opt-in drag-handle touch helper (`dragHandleTouchStyle`)
- [x] Auto-scroll near scroll-container edges during drag
- [x] Layout recompute on scroll during drag
- [x] vitest + jsdom test infrastructure
- [x] Unit tests (collision, layout, move-array-item)
- [x] Regression tests (sensor leak + pointercancel)
- [x] Docs (touch/mobile + known limitations) and changelog entry

Explicitly deferred (see rationale inline in the sections below): keyboard/ARIA
a11y, CI, dependency refresh, fork/maintenance strategy, feature gaps
(disabled state, axis constraints, horizontal/grid sortable).

## P0 - Blockers (must have before prod)

**Accessibility** (deferred: not trivial; needs a dedicated keyboard sensor plus
live-region announcer. Tracked as a follow-up, per agreed scope.)

- [ ] Keyboard drag sensor (activate/move/drop via keyboard): no keyboard sensor exists; only `create-pointer-sensor.ts`
- [ ] Screen-reader live-region announcements for drag start / over / end / cancel (none present)
- [ ] ARIA roles/attributes on draggables & droppables (`aria-grabbed`/`aria-dropeffect` or `roledescription` pattern): zero `aria`/`role`/`tabindex` in `src/`
- [ ] Focus management (move focus with the item; restore focus on drop/cancel)
- [ ] `Esc`-to-cancel drag semantics (no cancel path exists; drag only ends on `pointerup`)
- [ ] Reduced-motion handling (`prefers-reduced-motion`) for the transform transitions

**Testing & CI**

- [x] Any automated tests at all: vitest + jsdom suite added under `src/__tests__/`
- [x] Unit tests: `collision.ts`, `layout.ts` (intersection, transform stripping), `move-array-item.ts`
- [ ] Component/integration tests for draggable/droppable/sortable lifecycle (add/remove/reorder-remount)
- [ ] SSR/hydration smoke test (SolidStart): no proof DOM access is guarded
- [ ] CI pipeline (`.github/` absent): typecheck, test, build, lint on PR (deferred: process, not a runtime blocker)
- [ ] Cross-browser / touch-device test matrix (Safari, Firefox, iOS, Android) (deferred: manual, documented in verification)

## P1 - Correctness & robustness gaps

- [x] **Listener leak on mid-drag unmount**: `onCleanup` now calls `detach()` before `removeSensor(id)`, clearing all document listeners and the pending timer (regression test added)
- [x] **Touch scroll conflict**: `dragHandleTouchStyle`/`applyDragHandleTouch` set `touch-action: none` on handles; touch move before activation is treated as scroll
- [x] **Drag cancellation (internal)**: `pointercancel` ends the drag cleanly
- [x] **Auto-scroll** when dragging near a scroll-container edge: `createScrollSensor` (in `DragDropSensors` by default)
- [x] **Scroll-during-drag correctness**: capturing scroll listener recomputes layouts + collisions during a drag
- [ ] **Nested scroll containers / non-body offset parents**: `elementLayout` uses viewport `getBoundingClientRect`; behavior inside transformed/scrolled ancestors is untested (deferred: app-specific, revisit with UX testing)
- [ ] **Multiple / nested `DragDropProvider`** support and isolation (deferred: documented as supported upstream, untested here)
- [x] **`pointercancel` / interrupted touch**: handled; interrupted touches end the drag cleanly (regression test added)
- [ ] **Pointer capture** not used (`setPointerCapture`) (deferred: document-level listeners are sufficient with the leak + cancel fixes)
- [ ] `active.draggable` typed `Draggable | null` but getter can return `undefined` after removal (`drag-drop-context.tsx:162-166`) (deferred: low-probability, no reported failure)
- [x] `stripTransformFromLayout` matrix parsing (`layout.ts:77-101`) current behavior pinned by unit tests (matrix + matrix3d translate); non-translate transforms still unsupported (deferred)

## P2 - API completeness & configurability

- [x] Configurable activation constraints: `activationDelay` / `activationDistance` now options on `createPointerSensor` / `DragDropSensors`
- [ ] Drop-rejection / `disabled` state for draggables & droppables (deferred: add if product needs it)
- [ ] `onDragCancel` event (deferred: internal cancel handled; public event is a follow-up)
- [ ] Constrain-to-axis / bounds / snap modifiers (deferred: transformer pipeline primitive already supports building these)
- [ ] Multi-sensor coordination docs/guarantees (deferred)
- [ ] Public, documented way to build a custom sensor (deferred: pattern exists, doc is a follow-up)

## P3 - Types, SSR, build

- [ ] Remove `as unknown as` casts in hook factories (deferred: cosmetic)
- [ ] Explicit SSR guards / documented SSR story (deferred: DOM access is `onMount`/`Portal` guarded; smoke test is a follow-up)
- [ ] Exported types for sensor authors and collision-detector context (deferred)
- [ ] `exports` map validation for modern bundlers (deferred)

## P4 - Supply-chain & maintenance (the "owning it" checklist)

All deferred: strategic risks, not runtime blockers. Flagged for the team.

- [ ] **Maintenance status**: last release 2023-11-17; treat as unmaintained. Decide fork-and-own vs. replace
- [ ] Dependency currency: pins `typescript@4.8`, `prettier@2`, `tsup@6`, `solid-js@^1.5`; no Renovate/Dependabot
- [ ] Security posture: no `npm audit` gate, no lockfile-only CI, no provenance/publish attestation
- [ ] License compliance check (MIT: confirm for your org's redistribution)
- [ ] `CONTRIBUTING`/issue triage plan if forked internally
- [ ] Changelog/versioning discipline for your fork

## P5 - Docs & DX

- [x] Documented touch/`touch-action` requirements and mobile caveats (README "Touch, iPad and mobile")
- [ ] Accessibility usage guide (deferred: once keyboard a11y exists)
- [ ] Performance guidance for large lists (layout recompute on `dragStart` scales with item count) (deferred)
- [ ] Migration / API-stability statement (still `0.x`) (deferred)

---

**Bottom line on scope:** the mobile/iPad/desktop blockers (sensor leak,
`pointercancel`, touch-readiness, auto-scroll) plus a test net are addressed in
this pass. Keyboard/ARIA accessibility remains the largest deferred item and is
a multi-week effort in its own right; if an accessibility audit is in your
future, treat that as a separate project on top of this hardening.

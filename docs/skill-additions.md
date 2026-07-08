# Skill additions enabled by this fork

The upstream `solid-dnd` skill documents several mobile gaps as consumer
responsibilities or "write a custom sensor". This fork (branch
`harden-mobile-prod`) turns most of them into first-class, built-in behavior.

This file is a staging ground: if the skill is ever pointed at this fork (or
upstream adopts these changes), the notes and snippets below can be lifted
straight into `SKILL.md` / `references/advanced.md`. Everything here is real,
exported API in this repo. Do NOT add these to the upstream skill, they do not
exist in `@thisbeyond/solid-dnd@0.7.5`.

## What changes for a consumer

| Upstream skill note | This fork |
| --- | --- |
| Touch drag needs `touch-action: none`, you add the CSS by hand | `dragHandleTouchStyle` / `applyDragHandleTouch` exports |
| Activation (250ms / 10px) is not configurable without forking | `DragDropSensors pointerSensor={{ activationDelay, activationDistance }}` |
| No auto-scroll; build it yourself | `createScrollSensor`, on by default via `DragDropSensors` |
| Scrolling mid-drag desyncs collisions | auto-recompute on scroll during a drag (part of `createScrollSensor`) |
| Interrupted touches can stick (`pointercancel` unhandled) | pointer sensor handles `pointercancel`, ends the drag cleanly |
| Removing the dragged item mid-drag leaks listeners | sensor detaches in `onCleanup` |
| Touch move competes with scroll | activation is `pointerType`-aware (touch move before the hold is treated as scroll) |

`overscroll-behavior: contain` on the scroll container is still the consumer's
job in both upstream and this fork (it is plain CSS, not a library concern), and
should stay in the skill regardless.

## Snippets to fold into the skill

### Touch-ready drag handle

```tsx
import { createSortable, dragHandleTouchStyle } from "@thisbeyond/solid-dnd";

const Item = (props: { id: number }) => {
  const sortable = createSortable(props.id);
  return (
    <li use:sortable>
      {/* touch-action:none + callout/selection suppression, all in one */}
      <span class="handle" style={dragHandleTouchStyle} {...sortable.dragActivators}>
        ::
      </span>
      <span>Item {props.id}</span>
    </li>
  );
};
```

`applyDragHandleTouch(el)` is the imperative form for when you hold an element
ref instead of spreading a style object.

### Configuring the sensors

```tsx
<DragDropSensors
  pointerSensor={{ activationDelay: 250, activationDistance: 10 }}
  scrollSensor={{ threshold: 40, maxSpeed: 20 }} // or scrollSensor={false} to disable
>
  ...
</DragDropSensors>
```

On touch, moving beyond `activationDistance` before `activationDelay` elapses is
treated as a scroll (the drag is abandoned), so a quick swipe scrolls and a short
hold picks the item up. Auto-scroll near a scroll container edge is on by default
and keeps droppable layouts recomputed as the container scrolls.

### Standalone auto-scroll sensor

`createScrollSensor(options?)` is exported for composing your own sensor set:

```tsx
import { createScrollSensor, createPointerSensor } from "@thisbeyond/solid-dnd";

const MySensors = (props) => {
  createPointerSensor();
  createScrollSensor({ threshold: 60, maxSpeed: 24 });
  return <>{props.children}</>;
};
```

## Where these would land in the skill

- `SKILL.md` mental model: note `DragDropSensors` now takes `pointerSensor` /
  `scrollSensor` options and auto-scroll is on by default.
- `SKILL.md` gotchas: the "touch flaky" and "stuck drag / leak" gotchas become
  "handled; use `dragHandleTouchStyle` and the built-in `pointercancel`/cleanup".
- `references/advanced.md` "Touch, scrolling, and mobile": replace the
  "you must build it / write a custom sensor" guidance with the built-in
  `dragHandleTouchStyle`, sensor options, and `createScrollSensor`.
- `references/advanced.md` "Custom sensors": keep as-is for consumers who still
  need bespoke behavior, but note the common cases are now built in.

## Provenance

These additions and their rationale are tracked in this repo:

- `CHECKLIST.md` (production-readiness status)
- `CHANGELOG.md` (unreleased section)
- `README.md` ("Touch, iPad and mobile", "Known limitations")
- `playground/` (browser harness to feel the behavior)
- `e2e/scroll-containment.spec.ts` (overscroll containment regression)

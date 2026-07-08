import { JSX } from "solid-js/jsx-runtime";

import { Layout, noopTransform, Transform, transformsAreEqual } from "./layout";

const layoutStyle = (layout: Layout): JSX.CSSProperties => {
  return {
    top: `${layout.y}px`,
    left: `${layout.x}px`,
    width: `${layout.width}px`,
    height: `${layout.height}px`,
  };
};

const transformStyle = (transform: Transform): JSX.CSSProperties => {
  return { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` };
};

const maybeTransformStyle = (transform: Transform): JSX.CSSProperties => {
  return transformsAreEqual(transform, noopTransform())
    ? {}
    : transformStyle(transform);
};

// Styles that make an element reliably draggable by touch. Spread onto the
// element that carries the drag activators (a dedicated drag handle is the
// recommended pattern so the rest of the row stays scrollable):
//
//   <div use:draggable style={dragHandleTouchStyle}> ... a handle ... </div>
//
// - touch-action: none  -> the browser never claims the gesture for scrolling,
//   so a drag starts reliably instead of the page panning.
// - -webkit-touch-callout: none + user-select: none -> suppress the iOS
//   long-press callout and text selection that otherwise fight the drag.
const dragHandleTouchStyle: JSX.CSSProperties = {
  "touch-action": "none",
  "-webkit-touch-callout": "none",
  "user-select": "none",
  "-webkit-user-select": "none",
};

// Imperative equivalent of dragHandleTouchStyle for cases where you hold an
// element reference rather than spreading a style object.
const applyDragHandleTouch = (element: HTMLElement): void => {
  element.style.touchAction = "none";
  element.style.setProperty("-webkit-touch-callout", "none");
  element.style.userSelect = "none";
  element.style.setProperty("-webkit-user-select", "none");
};

export {
  layoutStyle,
  transformStyle,
  maybeTransformStyle,
  dragHandleTouchStyle,
  applyDragHandleTouch,
};

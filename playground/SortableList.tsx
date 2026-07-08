import { For, Show } from "solid-js";

import {
  SortableProvider,
  createSortable,
  useDragDropContext,
  dragHandleTouchStyle,
} from "../src";

interface SortableListProps {
  items: () => number[];
  handleOnly: () => boolean;
  onRemove: (id: number) => void;
}

const SortableRow = (props: {
  id: number;
  handleOnly: boolean;
  onRemove: (id: number) => void;
}) => {
  const sortable = createSortable(props.id);
  const [state] = useDragDropContext()!;

  // In "handle only" mode only the grip carries `touch-action: none`, so the
  // row body still scrolls by touch. In "whole row" mode the row itself gets
  // it, so any touch on the row starts a drag (and the row cannot scroll).
  const rowTouchStyle = () =>
    props.handleOnly ? undefined : dragHandleTouchStyle;
  const handleTouchStyle = () =>
    props.handleOnly ? dragHandleTouchStyle : undefined;

  return (
    <li
      // `ref={sortable}` binds drag + drop + transform to the row (equivalent to
      // `use:sortable`, without the directive typings).
      ref={sortable}
      class="row"
      classList={{
        dragging: sortable.isActiveDraggable,
        settling: state.active.draggableId !== null,
      }}
      style={rowTouchStyle()}
    >
      <span
        class="handle"
        classList={{ "handle-live": props.handleOnly }}
        style={handleTouchStyle()}
        aria-hidden="true"
      >
        ::::
      </span>
      <span class="label">Item {props.id}</span>
      <button
        class="remove"
        title="Remove (press mid-drag to exercise the unmount leak fix)"
        // Do not let a press on the button start a drag on the row.
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => props.onRemove(props.id)}
      >
        remove
      </button>
    </li>
  );
};

const SortableList = (props: SortableListProps) => {
  return (
    <div class="scroll-container" aria-label="scrollable sortable list">
      <Show
        when={props.items().length > 0}
        fallback={<p class="empty">List is empty. Reset it from the panel.</p>}
      >
        <ul class="list">
          <SortableProvider ids={props.items()}>
            <For each={props.items()}>
              {(id) => (
                <SortableRow
                  id={id}
                  handleOnly={props.handleOnly()}
                  onRemove={props.onRemove}
                />
              )}
            </For>
          </SortableProvider>
        </ul>
      </Show>
    </div>
  );
};

export { SortableList };

import {
  Accessor,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";

import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  useDragDropContext,
} from "../src";
import { SortableList } from "./SortableList";

interface Config {
  activationDelay: number;
  activationDistance: number;
  scrollEnabled: boolean;
  scrollThreshold: number;
  scrollMaxSpeed: number;
  handleOnly: boolean;
}

const DEFAULT_CONFIG: Config = {
  activationDelay: 250,
  activationDistance: 10,
  scrollEnabled: true,
  scrollThreshold: 60,
  scrollMaxSpeed: 20,
  handleOnly: true,
};

const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

// Live readout of the drag state, from inside the provider.
const StateReadout = () => {
  const [state] = useDragDropContext()!;
  return (
    <div class="readout" role="status">
      <span>
        active draggable:{" "}
        <b>{state.active.draggableId === null ? "none" : state.active.draggableId}</b>
      </span>
      <span>
        over droppable:{" "}
        <b>{state.active.droppableId === null ? "none" : state.active.droppableId}</b>
      </span>
    </div>
  );
};

const Demo = (props: {
  config: Config;
  items: Accessor<number[]>;
  setItems: (items: number[]) => void;
  onRemove: (id: number) => void;
}) => {
  const commitReorder = (event: {
    draggable: { id: number | string } | null;
    droppable?: { id: number | string } | null;
  }) => {
    const { draggable, droppable } = event;
    if (draggable && droppable && draggable.id !== droppable.id) {
      const current = props.items();
      const from = current.indexOf(draggable.id as number);
      const to = current.indexOf(droppable.id as number);
      if (from !== -1 && to !== -1 && from !== to) {
        const updated = current.slice();
        updated.splice(to, 0, ...updated.splice(from, 1));
        props.setItems(updated);
      }
    }
  };

  return (
    <DragDropProvider onDragEnd={commitReorder}>
      <DragDropSensors
        pointerSensor={{
          activationDelay: props.config.activationDelay,
          activationDistance: props.config.activationDistance,
        }}
        scrollSensor={
          props.config.scrollEnabled
            ? {
                threshold: props.config.scrollThreshold,
                maxSpeed: props.config.scrollMaxSpeed,
              }
            : false
        }
      >
        <StateReadout />
        <SortableList
          items={props.items}
          handleOnly={() => props.config.handleOnly}
          onRemove={props.onRemove}
        />
        <DragOverlay>
          {(draggable) => (
            <div class="row overlay">
              <span class="handle">::::</span>
              <span class="label">Item {draggable?.id}</span>
            </div>
          )}
        </DragOverlay>
      </DragDropSensors>
    </DragDropProvider>
  );
};

const Controls = (props: {
  config: Config;
  setConfig: SetStoreFunction<Config>;
  pointerType: Accessor<string>;
  viewport: Accessor<number>;
  coarse: Accessor<boolean>;
  count: Accessor<number>;
  onReset: () => void;
}) => {
  const num = (key: keyof Config) => (event: { currentTarget: HTMLInputElement }) =>
    props.setConfig(key as any, Number(event.currentTarget.value));
  const bool = (key: keyof Config) => (event: { currentTarget: HTMLInputElement }) =>
    props.setConfig(key as any, event.currentTarget.checked);

  return (
    <aside class="panel">
      <div class="panel-group device">
        <h2>Device</h2>
        <div class="kv">
          <span>viewport</span>
          <b>{props.viewport()}px</b>
        </div>
        <div class="kv">
          <span>pointer</span>
          <b>{props.coarse() ? "coarse (touch)" : "fine (mouse)"}</b>
        </div>
        <div class="kv">
          <span>last pointerdown</span>
          <b>{props.pointerType()}</b>
        </div>
        <p class="hint">
          Open Chrome DevTools, toggle the device toolbar, pick an iPhone/iPad,
          and reload. "pointer" should flip to coarse (touch).
        </p>
      </div>

      <div class="panel-group">
        <h2>Interaction model</h2>
        <label class="check">
          <input
            type="checkbox"
            checked={props.config.handleOnly}
            onChange={bool("handleOnly")}
          />
          handle only (row body stays scrollable)
        </label>
        <p class="hint">
          Off = whole row is touch-draggable and no longer scrolls by touch.
        </p>
      </div>

      <div class="panel-group">
        <h2>Pointer sensor</h2>
        <label class="field">
          activation delay (ms)
          <input
            type="number"
            min="0"
            step="50"
            value={props.config.activationDelay}
            onInput={num("activationDelay")}
          />
        </label>
        <label class="field">
          activation distance (px)
          <input
            type="number"
            min="0"
            step="1"
            value={props.config.activationDistance}
            onInput={num("activationDistance")}
          />
        </label>
      </div>

      <div class="panel-group">
        <h2>Auto-scroll</h2>
        <label class="check">
          <input
            type="checkbox"
            checked={props.config.scrollEnabled}
            onChange={bool("scrollEnabled")}
          />
          enabled
        </label>
        <label class="field">
          edge threshold (px)
          <input
            type="number"
            min="0"
            step="10"
            value={props.config.scrollThreshold}
            onInput={num("scrollThreshold")}
          />
        </label>
        <label class="field">
          max speed (px/frame)
          <input
            type="number"
            min="1"
            step="1"
            value={props.config.scrollMaxSpeed}
            onInput={num("scrollMaxSpeed")}
          />
        </label>
      </div>

      <div class="panel-group">
        <h2>List</h2>
        <div class="kv">
          <span>items</span>
          <b>{props.count()}</b>
        </div>
        <button class="reset" onClick={props.onReset}>
          reset list
        </button>
      </div>
    </aside>
  );
};

const App = () => {
  const [items, setItems] = createSignal<number[]>(range(1, 40));
  const [config, setConfig] = createStore<Config>({ ...DEFAULT_CONFIG });

  const [pointerType, setPointerType] = createSignal("none");
  const [viewport, setViewport] = createSignal(window.innerWidth);
  const [coarse, setCoarse] = createSignal(
    window.matchMedia("(pointer: coarse)").matches
  );

  const onPointerDown = (event: PointerEvent) =>
    setPointerType(event.pointerType || "unknown");
  const onResize = () => {
    setViewport(window.innerWidth);
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  };

  onMount(() => {
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("resize", onResize);
  });
  onCleanup(() => {
    window.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("resize", onResize);
  });

  const removeItem = (id: number) =>
    setItems(items().filter((item) => item !== id));
  const resetList = () => setItems(range(1, 40));

  // Only the sensor-affecting options require re-instantiating the sensors, so
  // key the DnD subtree on those. `handleOnly` is applied reactively without a
  // remount (see SortableList), which keeps scroll position on toggle.
  const sensorKey = createMemo(() =>
    JSON.stringify({
      activationDelay: config.activationDelay,
      activationDistance: config.activationDistance,
      scrollEnabled: config.scrollEnabled,
      scrollThreshold: config.scrollThreshold,
      scrollMaxSpeed: config.scrollMaxSpeed,
    })
  );

  return (
    <div class="app">
      <header class="masthead">
        <h1>solid-dnd playground</h1>
        <p>
          Drag rows by the grip. Try it with the mouse, then switch on Chrome's
          device toolbar (touch) and compare. Drag to the top/bottom edge of the
          inner list or the window to see auto-scroll; press a row's "remove"
          mid-drag to exercise the unmount cleanup.
        </p>
      </header>

      <div class="layout">
        <Controls
          config={config}
          setConfig={setConfig}
          pointerType={pointerType}
          viewport={viewport}
          coarse={coarse}
          count={() => items().length}
          onReset={resetList}
        />

        <main class="stage">
          <Show when={sensorKey()} keyed>
            {() => (
              <Demo
                config={config}
                items={items}
                setItems={setItems}
                onRemove={removeItem}
              />
            )}
          </Show>
        </main>
      </div>

      <div class="tail">
        Extra space below the fold so window-level auto-scroll has somewhere to
        go. Drag a row down here.
      </div>
    </div>
  );
};

export { App };

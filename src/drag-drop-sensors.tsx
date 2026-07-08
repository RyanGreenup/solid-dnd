import { ParentComponent } from "solid-js";

import {
  createPointerSensor,
  PointerSensorOptions,
} from "./create-pointer-sensor";
import {
  createScrollSensor,
  ScrollSensorOptions,
} from "./create-scroll-sensor";

interface DragDropSensorsProps {
  // Tune pointer activation (long-press delay / movement distance). Kept
  // optional so the interaction model stays swappable without forking.
  pointerSensor?: PointerSensorOptions;
  // Tune edge auto-scroll, or disable it by passing `scrollSensor={false}`.
  scrollSensor?: ScrollSensorOptions | false;
}

const DragDropSensors: ParentComponent<DragDropSensorsProps> = (props) => {
  createPointerSensor(undefined, props.pointerSensor);
  if (props.scrollSensor !== false) {
    createScrollSensor(props.scrollSensor || undefined);
  }
  return <>{props.children}</>;
};

export { DragDropSensors };
export type { DragDropSensorsProps };

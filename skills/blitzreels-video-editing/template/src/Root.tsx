import { Composition } from "remotion";
import { Short, timeline } from "./edit/Edit";
import { durationInFrames } from "./kit/timeline";

export const Root = () => (
  <Composition
    id="short"
    component={Short}
    width={timeline.width}
    height={timeline.height}
    fps={timeline.fps}
    durationInFrames={durationInFrames({ timeline })}
  />
);

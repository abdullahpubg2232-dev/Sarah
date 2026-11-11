import { Composition } from "remotion";
import { DURATION, Edit, FPS, HEIGHT, WIDTH } from "./Edit";

export const MyComposition = () => {
  return (
    <Composition
      id="WeatherEdit"
      component={Edit}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

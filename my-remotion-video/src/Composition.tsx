import { Composition } from "remotion";
import { DURATION, Edit, FPS, HEIGHT, WIDTH } from "./Edit";
import { EN_DURATION, EN_FPS, EnglishEdit } from "./EnglishEdit";

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="WeatherEdit"
        component={Edit}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="EnglishEdit"
        component={EnglishEdit}
        durationInFrames={EN_DURATION}
        fps={EN_FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};

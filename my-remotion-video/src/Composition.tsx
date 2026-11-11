import { Composition, Still } from "remotion";
import { Cover } from "./Cover";
import { DURATION, Edit, FPS, HEIGHT, WIDTH } from "./Edit";
import { EN_DURATION, EN_FPS, EnglishEdit } from "./EnglishEdit";
import { AN_DURATION, AN_FPS, AngryEdit } from "./AngryEdit";

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
      <Composition
        id="AngryEdit"
        component={AngryEdit}
        durationInFrames={AN_DURATION}
        fps={AN_FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Still id="AngryCover" component={Cover} width={WIDTH} height={HEIGHT} />
    </>
  );
};

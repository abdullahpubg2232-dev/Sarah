import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const HelloWorld: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 200 } });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #312e81 100%)",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, sans-serif",
        opacity: fadeOut,
      }}
    >
      <h1
        style={{
          color: "white",
          fontSize: 140,
          margin: 0,
          transform: `scale(${scale})`,
        }}
      >
        {title}
      </h1>
      <p style={{ color: "#c7d2fe", fontSize: 48, opacity: subtitleOpacity }}>
        Videos, written in React.
      </p>
    </AbsoluteFill>
  );
};

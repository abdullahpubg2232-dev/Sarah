import React from "react";
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFonts, LATIN, ARABIC } from "./fonts";

loadFonts();

export const FPS = 60;
export const WIDTH = 2160;
export const HEIGHT = 3840;
export const DURATION = 732; // 12.2 s, the full audio track

const YELLOW = "#FFD23F";
const INK = "#0B0B0B";

// Word timings (seconds) from the transcription of the clip.
type Word = { w: string; s: number; e: number };
const LINE_1: Word[] = [
  { w: "The", s: 4.36, e: 4.72 },
  { w: "weather", s: 4.72, e: 5.56 },
  { w: "is", s: 5.56, e: 6.0 },
  { w: "beautiful", s: 6.0, e: 6.48 },
  { w: "today", s: 6.48, e: 6.95 },
];
const LINE_2: Word[] = [
  { w: "The", s: 7.56, e: 8.28 },
  { w: "weather", s: 8.28, e: 9.0 },
  { w: "is", s: 9.0, e: 9.72 },
  { w: "beautiful", s: 9.72, e: 10.26 },
  { w: "today", s: 10.26, e: 10.8 },
];
const PUNCH_TIMES = [6.0, 9.72]; // "beautiful"
const PULSE_TIMES = [4.72, 6.0, 8.28, 9.72]; // "weather", "beautiful"

const sec = (s: number) => Math.round(s * FPS);

const useSpring = (startSec: number, stiff = 170, damping = 18) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - sec(startSec),
    fps,
    config: { stiffness: stiff, damping, mass: 1 },
  });
};

/* ---------------- Footage with camera moves and grade ---------------- */

const Footage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Slow push-in across the whole clip.
  let scale = interpolate(t, [0, 12.2], [1.03, 1.1], {
    easing: Easing.inOut(Easing.quad),
  });
  // Punch-in on "beautiful", relaxing back.
  for (const p of PUNCH_TIMES) {
    const inS = spring({
      frame: frame - sec(p),
      fps,
      config: { stiffness: 220, damping: 22 },
    });
    const out = interpolate(t, [p + 0.6, p + 1.4], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    scale += 0.07 * inS * (1 - out);
  }
  // Gentle hand-held drift so the push never feels static.
  const dx = Math.sin(t * 0.9) * 10;
  const dy = Math.cos(t * 0.7) * 8;

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
          transformOrigin: "50% 38%",
        }}
      >
        <OffthreadVideo
          src={staticFile("footage.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Grade: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Warm light sweep at the open and on each "beautiful".
  const sweeps = [0.1, 6.0, 9.72].map((s) =>
    interpolate(t, [s, s + 1.1], [-0.6, 1.6], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }),
  );
  const sweepOpacity = (s: number) =>
    interpolate(t, [s, s + 0.25, s + 0.85, s + 1.1], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)",
        }}
      />
      {/* Readability shade behind the captions */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 52%, rgba(0,0,0,0.5) 78%, rgba(0,0,0,0.62) 100%)",
        }}
      />
      {/* Warm light sweeps */}
      {[0.1, 6.0, 9.72].map((s, i) => (
        <AbsoluteFill
          key={s}
          style={{
            opacity: sweepOpacity(s) * 0.55,
            mixBlendMode: "screen",
            background: `linear-gradient(115deg, rgba(255,170,60,0) ${
              sweeps[i] * 100 - 55
            }%, rgba(255,190,90,0.45) ${sweeps[i] * 100}%, rgba(255,170,60,0) ${
              sweeps[i] * 100 + 55
            }%)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* ---------------- Sun ---------------- */

const Sun: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const enter = useSpring(1.55, 120, 16);
  const exit = interpolate(t, [11.6, 12.1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let pulse = 0;
  for (const p of PULSE_TIMES) {
    const s = spring({
      frame: frame - sec(p),
      fps,
      config: { stiffness: 260, damping: 14 },
    });
    const decay = interpolate(t, [p + 0.2, p + 0.8], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    pulse = Math.max(pulse, s * decay);
  }

  const size = 360;
  const y = interpolate(enter, [0, 1], [-420, 360]);
  const rot = t * 18;
  const rays = Array.from({ length: 12 });

  return (
    <div
      style={{
        position: "absolute",
        right: 170,
        top: y,
        width: size,
        height: size,
        opacity: enter * (1 - exit),
        transform: `scale(${(0.6 + 0.4 * enter) * (1 + 0.18 * pulse)})`,
        filter: "drop-shadow(0 12px 40px rgba(255,140,0,0.45))",
      }}
    >
      <svg viewBox="-100 -100 200 200" width={size} height={size}>
        <g transform={`rotate(${rot})`}>
          {rays.map((_, i) => (
            <rect
              key={i}
              x={-6}
              y={-96}
              width={12}
              height={30 + 8 * pulse}
              rx={6}
              fill={YELLOW}
              transform={`rotate(${(i * 360) / rays.length})`}
            />
          ))}
        </g>
        <circle r={50} fill={YELLOW} />
        <circle r={50} fill="url(#sunShade)" />
        <defs>
          <radialGradient id="sunShade" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#FFF4C2" />
            <stop offset="100%" stopColor="#FFB000" stopOpacity="0.9" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

/* ---------------- Greeting (0 – 1.45 s) ---------------- */

const Greeting: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const a = useSpring(0.05, 180, 16);
  const b = useSpring(0.45, 180, 18);
  const bar = useSpring(0.25, 140, 20);
  const out = interpolate(t, [1.3, 1.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  if (t > 1.7) return null;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 760,
        opacity: 1 - out,
        filter: `blur(${out * 24}px)`,
        transform: `translateY(${-out * 80}px)`,
      }}
    >
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 40,
            bottom: 150,
            left: -60,
            right: -60,
            background: YELLOW,
            borderRadius: 48,
            transform: `scaleX(${bar})`,
            transformOrigin: "50% 50%",
          }}
        />
        <div
          dir="rtl"
          style={{
            position: "relative",
            fontFamily: ARABIC,
            fontWeight: 900,
            fontSize: 250,
            lineHeight: 1.25,
            color: INK,
            padding: "10px 30px",
            transform: `scale(${0.55 + 0.45 * a}) translateY(${(1 - a) * 60}px)`,
            opacity: a,
          }}
        >
          السلام عليكم
        </div>
        <div
          style={{
            position: "relative",
            marginTop: 40,
            fontFamily: LATIN,
            fontWeight: 800,
            fontSize: 96,
            letterSpacing: 14,
            color: "white",
            textTransform: "uppercase",
            textShadow: "0 6px 30px rgba(0,0,0,0.55)",
            opacity: b,
            transform: `translateY(${(1 - b) * 50}px)`,
          }}
        >
          Assalamu Alaikum
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Line 1: word-by-word captions ---------------- */

const CaptionWord: React.FC<{ word: Word; active: boolean; big?: boolean }> = ({
  word,
  active,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - sec(word.s - 0.04),
    fps,
    config: { stiffness: 260, damping: 18 },
  });
  const act = spring({
    frame: frame - sec(word.s),
    fps,
    config: { stiffness: 300, damping: 22 },
  });
  const isBeautiful = word.w === "beautiful";
  const visible = frame >= sec(word.s - 0.04);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        margin: "0 22px",
        opacity: visible ? enter : 0,
        filter: `blur(${(1 - enter) * 14}px)`,
        transform: `translateY(${(1 - enter) * 70}px) scale(${
          0.7 + 0.3 * enter + (active ? 0.08 * act : 0)
        })`,
      }}
    >
      {active ? (
        <span
          style={{
            position: "absolute",
            inset: "6px -26px 0px -26px",
            borderRadius: 36,
            background: isBeautiful ? "linear-gradient(135deg,#FFE066,#FF9F1C)" : YELLOW,
            transform: `scale(${act})`,
            zIndex: 0,
          }}
        />
      ) : null}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          color: active ? INK : "white",
          textShadow: active ? "none" : "0 8px 34px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        {word.w}
      </span>
    </span>
  );
};

const LineOne: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < 4.2 || t > 7.45) return null;
  const out = interpolate(t, [7.1, 7.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const activeIdx = LINE_1.findIndex((w, i) => {
    const next = LINE_1[i + 1];
    return t >= w.s && t < (next ? next.s : w.e + 0.25);
  });
  const rows = [LINE_1.slice(0, 3), LINE_1.slice(3)];
  let k = 0;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 720,
        opacity: 1 - out,
        filter: `blur(${out * 20}px)`,
        transform: `translateY(${-out * 60}px)`,
      }}
    >
      {rows.map((row, r) => (
        <div
          key={r}
          style={{
            fontFamily: LATIN,
            fontWeight: 900,
            fontSize: 168,
            lineHeight: 1.32,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {row.map((w) => {
            const idx = k++;
            return <CaptionWord key={idx} word={w} active={idx === activeIdx} />;
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/* ---------------- Line 2: one huge word at a time + karaoke line ---------------- */

const BigWord: React.FC<{ word: Word; until: number }> = ({ word, until }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (t < word.s - 0.05 || t > until + 0.2) return null;
  const enter = spring({
    frame: frame - sec(word.s - 0.05),
    fps,
    config: { stiffness: 240, damping: 17 },
  });
  const out = interpolate(t, [until - 0.02, until + 0.16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isBeautiful = word.w === "beautiful";
  const size = isBeautiful ? 330 : word.w.length <= 3 ? 330 : 300;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 980,
        textAlign: "center",
        fontFamily: LATIN,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: -6,
        lineHeight: 1,
        textTransform: "uppercase",
        opacity: enter * (1 - out),
        filter: `blur(${(1 - enter) * 18 + out * 22}px)`,
        transform: `translateY(${(1 - enter) * 120 - out * 90}px) scale(${
          0.6 + 0.4 * enter + out * 0.15
        })`,
      }}
    >
      <span
        style={
          isBeautiful
            ? {
                background: "linear-gradient(180deg,#FFF1A8 0%,#FFD23F 45%,#FF8A00 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 14px 40px rgba(0,0,0,0.55))",
              }
            : {
                color: "white",
                textShadow: "0 14px 50px rgba(0,0,0,0.6), 0 3px 6px rgba(0,0,0,0.45)",
              }
        }
      >
        {word.w}
      </span>
    </div>
  );
};

const LineTwo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const bar = useSpring(7.5, 160, 20);
  if (t < 7.4 || t > 11.0) return null;
  const out = interpolate(t, [10.75, 10.95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      {LINE_2.map((w, i) => (
        <BigWord key={i} word={w} until={LINE_2[i + 1] ? LINE_2[i + 1].s : 10.8} />
      ))}
      {/* Karaoke line under the big word */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 700,
          display: "flex",
          justifyContent: "center",
          opacity: bar * (1 - out),
          transform: `translateY(${(1 - bar) * 40}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 30,
            padding: "26px 54px",
            borderRadius: 999,
            background: "rgba(11,11,11,0.55)",
            backdropFilter: "blur(18px)",
            fontFamily: LATIN,
            fontWeight: 800,
            fontSize: 84,
          }}
        >
          {LINE_2.map((w, i) => {
            const lit = interpolate(t, [w.s - 0.03, w.s + 0.12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={i}
                style={{
                  color: lit > 0.5 ? YELLOW : "rgba(255,255,255,0.45)",
                  transform: `translateY(${-8 * lit * (1 - lit) * 4}px)`,
                  display: "inline-block",
                }}
              >
                {w.w}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Outro card (10.85 – 12.2 s) ---------------- */

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const a = useSpring(10.85, 170, 19);
  if (t < 10.8) return null;
  const line = interpolate(t, [11.0, 11.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 760 }}>
      <div
        style={{
          background: "rgba(255,255,255,0.96)",
          borderRadius: 72,
          padding: "70px 90px 80px",
          boxShadow: "0 40px 120px rgba(0,0,0,0.45)",
          transform: `translateY(${(1 - a) * 260}px) scale(${0.85 + 0.15 * a})`,
          opacity: a,
          textAlign: "center",
          fontFamily: LATIN,
          color: INK,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 132, lineHeight: 1.12 }}>
          The weather is
          <br />
          <span style={{ position: "relative", display: "inline-block" }}>
            beautiful today
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -6,
                height: 22,
                borderRadius: 11,
                background: YELLOW,
                transform: `scaleX(${line})`,
                transformOrigin: "0 50%",
                zIndex: -1,
              }}
            />
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Final fade ---------------- */

const Fade: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const inO = interpolate(t, [0, 0.25], [1, 0], { extrapolateRight: "clamp" });
  const outO = interpolate(t, [11.8, 12.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: "black", opacity: Math.max(inO, outO) }} />;
};

export const Edit: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Footage />
      <Grade />
      <Sun />
      <Greeting />
      <LineOne />
      <LineTwo />
      <Outro />
      <Fade />
    </AbsoluteFill>
  );
};

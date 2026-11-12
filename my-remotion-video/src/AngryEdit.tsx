import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFonts, LATIN } from "./fonts";
import { FollowOutro } from "./FollowOutro";

loadFonts();

export const AN_FPS = 60;
export const AN_DURATION = 1008; // footage + lesson summary + follow outro (16.8 s)
const FOOTAGE_END = 11.55;
const SUMMARY = 11.3;
const OUTRO = 13.2;

const INK = "#0B0B0B";
const YELLOW = "#FFD23F";
const ORANGE = "#FF8A1F";
const RED = "#FF2D2D";

// Timings (seconds) from the transcription. i = "I'm", v = "very", a = "angry".
type Rep = { i: number; v: number; a: number; end: number; strong: boolean };
const REPS: Rep[] = [
  { i: 2.74, v: 2.95, a: 3.14, end: 3.95, strong: true },
  { i: 4.02, v: 4.18, a: 4.34, end: 4.64, strong: false },
  { i: 4.68, v: 4.98, a: 5.14, end: 5.52, strong: true },
  { i: 5.56, v: 5.7, a: 5.86, end: 6.4, strong: false },
];
type Fury = { i: number; f: number; end: number };
const FURY: Fury[] = [
  { i: 8.38, f: 8.74, end: 9.6 },
  { i: 9.78, f: 10.2, end: 11.1 },
];

// Anger meter level after each line.
const LEVELS: [number, number][] = [
  [2.6, 0.12],
  [3.14, 0.3],
  [4.34, 0.45],
  [5.14, 0.6],
  [5.86, 0.72],
  [8.74, 0.9],
  [10.2, 1],
];

const sec = (s: number) => Math.round(s * AN_FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, t: frame / fps };
};
const sp = (frame: number, fps: number, at: number, stiffness = 200, damping = 18) =>
  spring({ frame: frame - sec(at), fps, config: { stiffness, damping } });

// Decaying screen shake after a hit.
const shakeAt = (t: number, at: number, amp: number) => {
  const d = t - at;
  if (d < 0 || d > 0.55) return { x: 0, y: 0, r: 0 };
  const k = Math.exp(-d * 7) * amp;
  return {
    x: Math.sin(d * 95) * k,
    y: Math.cos(d * 77) * k * 0.7,
    r: Math.sin(d * 61) * k * 0.012,
  };
};
const totalShake = (t: number, scale = 1) => {
  let x = 0;
  let y = 0;
  let r = 0;
  FURY.forEach((f, idx) => {
    const s = shakeAt(t, f.f, (idx === 0 ? 34 : 50) * scale);
    x += s.x;
    y += s.y;
    r += s.r;
  });
  return { x, y, r };
};

const level = (frame: number, fps: number) => {
  let v = 0;
  for (let k = 0; k < LEVELS.length; k++) {
    const [at, target] = LEVELS[k];
    const prev = k === 0 ? 0 : LEVELS[k - 1][1];
    v += (target - prev) * sp(frame, fps, at, 160, 16);
  }
  return v;
};

/* ---------------- Footage ---------------- */

const Footage: React.FC = () => {
  const { frame, fps, t } = useT();
  let scale = interpolate(t, [0, 11.55], [1.03, 1.1], { easing: Easing.inOut(Easing.quad) });
  for (const r of REPS.filter((x) => x.strong)) {
    const p = sp(frame, fps, r.a, 240, 22);
    const out = interpolate(t, [r.a + 0.35, r.a + 0.9], [0, 1], clamp);
    scale += 0.05 * p * (1 - out);
  }
  FURY.forEach((f, idx) => {
    const p = sp(frame, fps, f.f, 260, 20);
    const out = interpolate(t, [f.f + 0.6, f.f + 1.2], [0, 1], clamp);
    scale += (idx === 0 ? 0.08 : 0.12) * p * (1 - out);
  });
  const sh = totalShake(t);
  const dx = Math.sin(t * 0.9) * 10 + sh.x;
  const dy = Math.cos(t * 0.7) * 8 + sh.y;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) rotate(${sh.r}rad) scale(${scale})`,
          transformOrigin: "50% 30%",
        }}
      >
        <OffthreadVideo
          src={staticFile("footage3.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Grade: React.FC = () => {
  const { frame, fps, t } = useT();
  const lv = level(frame, fps);
  const flash = Math.max(
    ...FURY.map((f, idx) =>
      interpolate(t, [f.f, f.f + 0.06, f.f + 0.5], [0, idx === 0 ? 0.35 : 0.5, 0], clamp),
    ),
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 35%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)",
        }}
      />
      {/* Red edge glow that grows with the anger level */}
      <AbsoluteFill
        style={{
          opacity: lv * 0.45,
          background:
            "radial-gradient(ellipse 70% 58% at 50% 40%, rgba(255,30,30,0) 50%, rgba(255,30,30,0.55) 100%)",
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 76%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <AbsoluteFill style={{ backgroundColor: RED, opacity: flash, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

/* ---------------- Anger meter ---------------- */

const AngryFace: React.FC<{ size: number; lv: number }> = ({ size, lv }) => {
  const c = interpolateColors(lv, [0, 0.5, 1], [YELLOW, ORANGE, RED]);
  const brow = 6 + 14 * lv;
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size}>
      <circle r={46} fill={c} />
      <g stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none">
        <line x1={-30} y1={-22 + brow * 0.2} x2={-8} y2={-22 + brow} />
        <line x1={30} y1={-22 + brow * 0.2} x2={8} y2={-22 + brow} />
        <path d={`M -18 ${24 + 6 * lv} Q 0 ${12 - 4 * lv} 18 ${24 + 6 * lv}`} />
      </g>
      <circle cx={-16} cy={0} r={5} fill={INK} />
      <circle cx={16} cy={0} r={5} fill={INK} />
    </svg>
  );
};

const AngerMeter: React.FC = () => {
  const { frame, fps, t } = useT();
  const enter = sp(frame, fps, 2.55, 170, 20);
  const out = interpolate(t, [11.0, 11.3], [0, 1], clamp);
  if (t < 2.5) return null;
  const lv = level(frame, fps);
  const sh = totalShake(t, 0.5);
  const fill = interpolateColors(lv, [0, 0.45, 0.8, 1], [YELLOW, ORANGE, RED, "#C80000"]);
  const maxPulse = t > 10.2 ? 1 + 0.04 * Math.sin((t - 10.2) * 18) : 1;
  return (
    <div
      style={{
        position: "absolute",
        top: 230,
        left: "50%",
        width: 1500,
        marginLeft: -750,
        height: 200,
        borderRadius: 100,
        background: "rgba(11,11,11,0.62)",
        backdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        padding: "0 30px",
        gap: 34,
        opacity: enter * (1 - out),
        transform: `translate(${sh.x}px, ${(1 - enter) * -160 + sh.y}px) scale(${(0.8 + 0.2 * enter) * maxPulse})`,
      }}
    >
      <div style={{ transform: `scale(${1 + 0.06 * Math.sin(t * 9) * lv})` }}>
        <AngryFace size={150} lv={lv} />
      </div>
      <div
        style={{
          fontFamily: LATIN,
          fontWeight: 900,
          fontSize: 80,
          letterSpacing: 8,
          color: "white",
        }}
      >
        ANGER
      </div>
      <div
        style={{
          position: "relative",
          flex: 1,
          height: 70,
          marginRight: 30,
          borderRadius: 35,
          background: "rgba(255,255,255,0.16)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.max(0, Math.min(1, lv)) * 100}%`,
            borderRadius: 35,
            background: `linear-gradient(90deg, ${YELLOW}, ${fill})`,
          }}
        />
        {/* tick marks */}
        {[0.25, 0.5, 0.75].map((x) => (
          <div
            key={x}
            style={{
              position: "absolute",
              left: `${x * 100}%`,
              top: 14,
              bottom: 14,
              width: 6,
              borderRadius: 3,
              background: "rgba(11,11,11,0.25)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* ---------------- "I'm very angry" captions ---------------- */

const RepCaption: React.FC<{ rep: Rep; n: number; next: number }> = ({ rep, n, next }) => {
  const { frame, fps, t } = useT();
  if (t < rep.i - 0.05 || t > next + 0.12) return null;
  const card = sp(frame, fps, rep.i - 0.05, 300, 18);
  const out = interpolate(t, [next - 0.04, next + 0.1], [0, 1], clamp);
  const size = 150 + n * 22;
  const words = [
    { w: "I'm", s: rep.i },
    { w: "very", s: rep.v },
    { w: "angry", s: rep.a },
  ];
  const activeIdx = t >= rep.a ? 2 : t >= rep.v ? 1 : 0;
  const tilt = (n % 2 === 0 ? -1 : 1) * 2.5;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 780,
        opacity: card * (1 - out),
        filter: `blur(${out * 16}px)`,
        transform: `rotate(${tilt * card}deg) scale(${(0.6 + 0.4 * card) * (1 + out * 0.2)})`,
      }}
    >
      <div
        style={{
          fontFamily: LATIN,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {words.map((w, idx) => {
          const e = sp(frame, fps, w.s - 0.03, 320, 18);
          const act = sp(frame, fps, w.s, 320, 20);
          const active = idx === activeIdx;
          const pill = idx === 2 ? RED : idx === 1 ? ORANGE : YELLOW;
          return (
            <span
              key={idx}
              style={{
                position: "relative",
                display: "inline-block",
                margin: "0 52px",
                opacity: frame >= sec(w.s - 0.03) ? e : 0,
                transform: `translateY(${(1 - e) * 60}px) scale(${0.6 + 0.4 * e + (active ? 0.1 * act : 0)})`,
              }}
            >
              {active ? (
                <span
                  style={{
                    position: "absolute",
                    inset: "8px -30px 0 -30px",
                    borderRadius: 40,
                    background: pill,
                    transform: `scale(${act})`,
                  }}
                />
              ) : null}
              <span
                style={{
                  position: "relative",
                  textTransform: idx === 2 ? "uppercase" : "none",
                  color: active ? (idx === 2 ? "white" : INK) : "white",
                  textShadow: active ? "none" : "0 8px 34px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                {w.w}
              </span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- FURIOUS ---------------- */

const FuryCaption: React.FC<{ f: Fury; big: boolean }> = ({ f, big }) => {
  const { frame, fps, t } = useT();
  if (t < f.i - 0.05 || t > f.end + 0.15) return null;
  const im = sp(frame, fps, f.i - 0.05, 300, 18);
  const hit = sp(frame, fps, f.f - 0.03, 380, 14);
  const out = interpolate(t, [f.end - 0.05, f.end + 0.12], [0, 1], clamp);
  const sh = shakeAt(t, f.f, big ? 40 : 28);
  const size = big ? 400 : 320;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: big ? 820 : 800,
        opacity: 1 - out,
        filter: `blur(${out * 20}px)`,
        transform: `translate(${sh.x}px, ${sh.y}px)`,
      }}
    >
      <div
        style={{
          fontFamily: LATIN,
          fontWeight: 900,
          fontSize: 140,
          color: "white",
          textShadow: "0 8px 34px rgba(0,0,0,0.6)",
          opacity: im,
          transform: `translateY(${(1 - im) * 50}px)`,
          marginBottom: 10,
        }}
      >
        I&apos;m
      </div>
      <div
        style={{
          fontFamily: LATIN,
          fontWeight: 900,
          fontSize: size,
          letterSpacing: -8,
          lineHeight: 1,
          opacity: frame >= sec(f.f - 0.03) ? Math.min(1, hit * 1.4) : 0,
          transform: `scale(${interpolate(hit, [0, 1], [2.2, 1])}) rotate(${(1 - hit) * -6}deg)`,
        }}
      >
        <span
          style={{
            background: "linear-gradient(180deg,#FFB3A1 0%,#FF3B2F 45%,#B30000 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 16px 44px rgba(0,0,0,0.6))",
          }}
        >
          FURIOUS
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Lesson: title card (0.3 – 2.6 s) ---------------- */

const LessonTitle: React.FC = () => {
  const { frame, fps, t } = useT();
  const tag = sp(frame, fps, 0.3, 200, 18);
  const a = sp(frame, fps, 0.5, 200, 17);
  const b = sp(frame, fps, 0.75, 200, 17);
  const c = sp(frame, fps, 1.0, 200, 17);
  const out = interpolate(t, [2.35, 2.62], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  if (t > 2.7) return null;
  const word = (e: number, extra: React.CSSProperties) => ({
    display: "inline-block",
    opacity: e,
    transform: `translateY(${(1 - e) * 70}px) scale(${0.6 + 0.4 * e})`,
    filter: `blur(${(1 - e) * 12}px)`,
    ...extra,
  });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 760,
        opacity: 1 - out,
        filter: `blur(${out * 22}px)`,
        transform: `translateY(${-out * 70}px)`,
      }}
    >
      <div
        style={{
          padding: "22px 54px",
          borderRadius: 999,
          background: YELLOW,
          color: INK,
          fontFamily: LATIN,
          fontWeight: 900,
          fontSize: 76,
          letterSpacing: 12,
          marginBottom: 50,
          opacity: tag,
          transform: `scale(${0.7 + 0.3 * tag})`,
        }}
      >
        ENGLISH LESSON
      </div>
      <div
        style={{
          fontFamily: LATIN,
          fontWeight: 900,
          fontSize: 210,
          lineHeight: 1.1,
          textAlign: "center",
          whiteSpace: "nowrap",
          textShadow: "0 12px 44px rgba(0,0,0,0.6)",
        }}
      >
        <span style={word(a, { color: "white" })}>Angry</span>{" "}
        <span style={word(b, { color: "rgba(255,255,255,0.75)", fontSize: 130, margin: "0 30px" })}>vs</span>{" "}
        <span
          style={word(c, {
            background: "linear-gradient(180deg,#FFB3A1 0%,#FF3B2F 50%,#B30000 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          })}
        >
          Furious
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Lesson: vocabulary cards ---------------- */

const VocabCard: React.FC<{ word: string; meaning: string; color: string; from: number; to: number }> = ({
  word,
  meaning,
  color,
  from,
  to,
}) => {
  const { frame, fps, t } = useT();
  const e = sp(frame, fps, from, 210, 19);
  const out = interpolate(t, [to - 0.25, to], [0, 1], clamp);
  if (t < from - 0.05 || t > to + 0.05) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 470,
        left: "50%",
        width: 1300,
        marginLeft: -650,
        display: "flex",
        alignItems: "center",
        gap: 40,
        padding: "34px 50px",
        borderRadius: 56,
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        opacity: e * (1 - out),
        transform: `translateY(${(1 - e) * -80 - out * 40}px) scale(${0.85 + 0.15 * e})`,
        fontFamily: LATIN,
      }}
    >
      <div style={{ width: 22, alignSelf: "stretch", borderRadius: 11, background: color }} />
      <div>
        <div style={{ fontWeight: 900, fontSize: 96, color, letterSpacing: 4, lineHeight: 1.1 }}>{word}</div>
        <div style={{ fontWeight: 800, fontSize: 70, color: INK, lineHeight: 1.2 }}>= {meaning}</div>
      </div>
    </div>
  );
};

/* ---------------- Lesson: summary card (11.3 s →) ---------------- */

const Summary: React.FC = () => {
  const { frame, fps, t } = useT();
  const bg = interpolate(t, [SUMMARY - 0.1, SUMMARY + 0.3], [0, 1], clamp);
  const head = sp(frame, fps, SUMMARY + 0.15, 200, 18);
  const r1 = sp(frame, fps, SUMMARY + 0.45, 200, 18);
  const r2 = sp(frame, fps, SUMMARY + 0.85, 200, 18);
  const b1 = interpolate(t, [SUMMARY + 0.55, SUMMARY + 1.1], [0, 0.65], { ...clamp, easing: Easing.out(Easing.cubic) });
  const b2 = interpolate(t, [SUMMARY + 0.95, SUMMARY + 1.5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (t < SUMMARY - 0.15) return null;
  const row = (e: number, label: string, fill: number, color: string, note: string) => (
    <div style={{ opacity: e, transform: `translateX(${(1 - e) * -120}px)`, marginBottom: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 26 }}>
        <span style={{ fontWeight: 900, fontSize: 130, color: "white" }}>{label}</span>
        <span style={{ fontWeight: 800, fontSize: 64, color: "rgba(255,255,255,0.7)" }}>{note}</span>
      </div>
      <div style={{ height: 70, borderRadius: 35, background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
        <div
          style={{
            width: `${fill * 100}%`,
            height: "100%",
            borderRadius: 35,
            background: `linear-gradient(90deg, ${YELLOW}, ${color})`,
          }}
        />
      </div>
    </div>
  );
  return (
    <AbsoluteFill
      style={{
        opacity: bg,
        background: "radial-gradient(ellipse 90% 70% at 50% 45%, #3A0A0A 0%, #120303 70%, #070101 100%)",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: LATIN,
      }}
    >
      <div style={{ width: 1700 }}>
        <div
          style={{
            display: "inline-block",
            padding: "22px 54px",
            borderRadius: 999,
            background: YELLOW,
            color: INK,
            fontWeight: 900,
            fontSize: 76,
            letterSpacing: 12,
            marginBottom: 120,
            opacity: head,
            transform: `scale(${0.7 + 0.3 * head})`,
            transformOrigin: "0 50%",
          }}
        >
          REMEMBER
        </div>
        {row(r1, "very angry", b1, ORANGE, "strong")}
        {row(r2, "furious", b2, RED, "stronger!")}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Sound effects ---------------- */

type Sfx = { at: number; src: string; vol: number };
const SFX: Sfx[] = [
  // A pop each time a caption appears.
  ...REPS.map((r) => ({ at: r.i - 0.05, src: r.strong ? "sfx/pop.ogg" : "sfx/pop2.ogg", vol: 0.55 })),
  // A lighter pop as "ANGRY" lands on the stressed lines.
  ...REPS.filter((r) => r.strong).map((r) => ({ at: r.a - 0.02, src: "sfx/pop2.ogg", vol: 0.35 })),
  // Lesson graphics.
  { at: 0.3, src: "sfx/pop.ogg", vol: 0.5 },
  { at: 1.0, src: "sfx/pop2.ogg", vol: 0.4 },
  { at: 3.3, src: "sfx/pop2.ogg", vol: 0.4 },
  { at: 8.9, src: "sfx/pop2.ogg", vol: 0.4 },
  { at: SUMMARY + 0.15, src: "sfx/pop.ogg", vol: 0.5 },
  { at: SUMMARY + 0.45, src: "sfx/pop2.ogg", vol: 0.45 },
  { at: SUMMARY + 0.85, src: "sfx/pop2.ogg", vol: 0.45 },
  // FURIOUS: pop for "I'm", punch for the word.
  ...FURY.map((f) => ({ at: f.i - 0.05, src: "sfx/pop.ogg", vol: 0.55 })),
  ...FURY.map((f, idx) => ({ at: f.f - 0.03, src: "sfx/punch.ogg", vol: idx === 0 ? 0.5 : 0.65 })),
];

const SoundFx: React.FC = () => (
  <>
    {SFX.map((s, k) => (
      <Sequence key={k} from={sec(s.at)} durationInFrames={sec(1.2)} layout="none">
        <Audio src={staticFile(s.src)} volume={s.vol} />
      </Sequence>
    ))}
  </>
);

const Fade: React.FC = () => {
  const { t } = useT();
  const inO = interpolate(t, [0, 0.25], [1, 0], { extrapolateRight: "clamp" });
  const outO = 0;
  return <AbsoluteFill style={{ backgroundColor: "black", opacity: Math.max(inO, outO) }} />;
};

export const AngryEdit: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    <Sequence durationInFrames={sec(FOOTAGE_END)} layout="none">
      <Footage />
    </Sequence>
    <Grade />
    <LessonTitle />
    <VocabCard word="ANGRY" meaning="upset, mad" color={ORANGE} from={3.3} to={6.4} />
    <VocabCard word="FURIOUS" meaning="extremely angry" color={RED} from={8.9} to={11.1} />
    <AngerMeter />
    {REPS.map((r, n) => (
      <RepCaption key={n} rep={r} n={n} next={REPS[n + 1] ? REPS[n + 1].i - 0.05 : r.end} />
    ))}
    {FURY.map((f, idx) => (
      <FuryCaption key={idx} f={f} big={idx === 1} />
    ))}
    <Summary />
    <SoundFx />
    <Fade />
    <FollowOutro start={OUTRO} />
  </AbsoluteFill>
);

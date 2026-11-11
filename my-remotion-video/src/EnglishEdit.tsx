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

export const EN_FPS = 60;
export const EN_DURATION = 669; // 11.15 s

const YELLOW = "#FFD23F";
const PINK = "#FF4D6D";
const INK = "#0B0B0B";

type Word = { w: string; s: number };

// Timings (seconds) from the transcription.
const AR_LINE: Word[] = [
  { w: "يعجبني", s: 2.36 },
  { w: "نتعلم", s: 2.86 },
  { w: "الإنجليزية", s: 3.2 },
];
const EN_1: Word[] = [
  { w: "I", s: 4.55 },
  { w: "love", s: 5.32 },
  { w: "learning", s: 5.66 },
  { w: "English", s: 6.46 },
];
const EN_1_END = 7.1;
const EN_2: Word[] = [
  { w: "I", s: 7.7 },
  { w: "love", s: 8.0 },
  { w: "learning", s: 8.64 },
  { w: "English", s: 9.36 },
];
const EN_2_END = 10.05;
const PEACE = 10.3;
const LOVE_TIMES = [5.32, 8.0];

const sec = (s: number) => Math.round(s * EN_FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, t: frame / fps };
};

const sp = (frame: number, fps: number, at: number, stiffness = 200, damping = 18) =>
  spring({ frame: frame - sec(at), fps, config: { stiffness, damping } });

/* ---------------- Footage ---------------- */

const Footage: React.FC = () => {
  const { frame, fps, t } = useT();
  let scale = interpolate(t, [0, 11.15], [1.03, 1.1], {
    easing: Easing.inOut(Easing.quad),
  });
  for (const p of [...LOVE_TIMES, PEACE]) {
    const inS = sp(frame, fps, p, 220, 22);
    const out = interpolate(t, [p + 0.6, p + 1.3], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
    scale += 0.06 * inS * (1 - out);
  }
  const dx = Math.sin(t * 0.9) * 10;
  const dy = Math.cos(t * 0.7) * 8;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
          transformOrigin: "50% 30%",
        }}
      >
        <OffthreadVideo
          src={staticFile("footage2.mp4")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SWEEPS = [0.1, 5.32, PEACE];

const Grade: React.FC = () => {
  const { t } = useT();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 35%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.4) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 76%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      {SWEEPS.map((s) => {
        const pos = interpolate(t, [s, s + 1.1], [-0.6, 1.6], {
          ...clamp,
          easing: Easing.inOut(Easing.cubic),
        });
        const o = interpolate(t, [s, s + 0.25, s + 0.85, s + 1.1], [0, 1, 1, 0], clamp);
        return (
          <AbsoluteFill
            key={s}
            style={{
              opacity: o * 0.5,
              mixBlendMode: "screen",
              background: `linear-gradient(115deg, rgba(255,170,90,0) ${pos * 100 - 55}%, rgba(255,200,120,0.45) ${
                pos * 100
              }%, rgba(255,170,90,0) ${pos * 100 + 55}%)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------- Language pill (ARABIC → ENGLISH) ---------------- */

const LangPill: React.FC = () => {
  const { frame, fps, t } = useT();
  const enter = sp(frame, fps, 0.35, 170, 20);
  const sw = sp(frame, fps, 4.45, 210, 20);
  const out = interpolate(t, [7.2, 7.5], [0, 1], clamp);
  if (t > 7.6) return null;
  const width = interpolate(sw, [0, 1], [560, 640]);
  const a = interpolate(sw, [0, 0.45], [1, 0], clamp);
  const b = interpolate(sw, [0.45, 1], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 250,
        left: "50%",
        width,
        height: 150,
        marginLeft: -width / 2,
        borderRadius: 75,
        background: sw > 0.45 ? YELLOW : "rgba(11,11,11,0.62)",
        backdropFilter: "blur(20px)",
        opacity: enter * (1 - out),
        transform: `translateY(${(1 - enter) * -120 - out * 60}px) scale(${0.8 + 0.2 * enter})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: LATIN,
        fontWeight: 800,
        fontSize: 70,
        letterSpacing: 10,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          color: "white",
          opacity: a,
          transform: `translateY(${-60 * (1 - a)}px)`,
          filter: `blur(${(1 - a) * 10}px)`,
        }}
      >
        ARABIC
      </span>
      <span
        style={{
          position: "absolute",
          color: INK,
          opacity: b,
          transform: `translateY(${60 * (1 - b)}px)`,
          filter: `blur(${(1 - b) * 10}px)`,
        }}
      >
        ENGLISH
      </span>
    </div>
  );
};

/* ---------------- Salam (0 – 2.3 s) ---------------- */

const Salam: React.FC = () => {
  const { frame, fps, t } = useT();
  const a = sp(frame, fps, 0.05, 180, 16);
  const bar = sp(frame, fps, 0.2, 140, 20);
  const b = sp(frame, fps, 0.5, 180, 18);
  const out = interpolate(t, [2.05, 2.35], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  if (t > 2.45) return null;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 820,
        opacity: 1 - out,
        filter: `blur(${out * 24}px)`,
        transform: `translateY(${-out * 80}px)`,
      }}
    >
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 30,
            bottom: 150,
            left: -90,
            right: -90,
            background: YELLOW,
            borderRadius: 56,
            transform: `scaleX(${bar})`,
          }}
        />
        <div
          dir="rtl"
          style={{
            position: "relative",
            fontFamily: ARABIC,
            fontWeight: 900,
            fontSize: 300,
            lineHeight: 1.2,
            color: INK,
            padding: "0 30px",
            opacity: a,
            transform: `scale(${0.55 + 0.45 * a}) translateY(${(1 - a) * 60}px)`,
          }}
        >
          سلام
        </div>
        <div
          style={{
            position: "relative",
            marginTop: 50,
            fontFamily: LATIN,
            fontWeight: 800,
            fontSize: 96,
            letterSpacing: 22,
            color: "white",
            textShadow: "0 6px 30px rgba(0,0,0,0.55)",
            opacity: b,
            transform: `translateY(${(1 - b) * 50}px)`,
          }}
        >
          SALAM
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Arabic subtitle (2.36 – 4.5 s) ---------------- */

const ArabicLine: React.FC = () => {
  const { frame, fps, t } = useT();
  const box = sp(frame, fps, 2.3, 170, 20);
  const out = interpolate(t, [4.3, 4.55], [0, 1], clamp);
  if (t < 2.25 || t > 4.65) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 800 }}>
      <div
        dir="rtl"
        style={{
          display: "flex",
          gap: 40,
          padding: "40px 80px 60px",
          borderRadius: 64,
          background: "rgba(11,11,11,0.58)",
          backdropFilter: "blur(22px)",
          opacity: box * (1 - out),
          filter: `blur(${out * 18}px)`,
          transform: `scale(${0.85 + 0.15 * box}) translateY(${(1 - box) * 60 - out * 60}px)`,
          fontFamily: ARABIC,
          fontWeight: 900,
          fontSize: 150,
          lineHeight: 1.35,
        }}
      >
        {AR_LINE.map((w, i) => {
          const e = sp(frame, fps, w.s - 0.04, 260, 18);
          const next = AR_LINE[i + 1];
          const active = t >= w.s && t < (next ? next.s : 4.4);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color: active ? YELLOW : "white",
                opacity: frame >= sec(w.s - 0.04) ? e : 0,
                transform: `translateY(${(1 - e) * 60}px) scale(${0.75 + 0.25 * e})`,
                filter: `blur(${(1 - e) * 12}px)`,
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Heart ---------------- */

const HeartSvg: React.FC<{ size: number; color?: string }> = ({ size, color = PINK }) => (
  <svg viewBox="0 0 100 92" width={size} height={size * 0.92}>
    <defs>
      <linearGradient id={`hg${size}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF8FA3" />
        <stop offset="100%" stopColor={color} />
      </linearGradient>
    </defs>
    <path
      d="M50 88 C20 66 2 50 2 28 C2 13 14 2 28 2 C38 2 46 8 50 16 C54 8 62 2 72 2 C86 2 98 13 98 28 C98 50 80 66 50 88 Z"
      fill={`url(#hg${size})`}
    />
  </svg>
);

/* ---------------- English line 1: word-by-word ---------------- */

const EnglishOne: React.FC = () => {
  const { frame, fps, t } = useT();
  const out = interpolate(t, [EN_1_END + 0.1, EN_1_END + 0.4], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  if (t < 4.4 || t > EN_1_END + 0.5) return null;
  const activeIdx = EN_1.findIndex((w, i) => {
    const next = EN_1[i + 1];
    return t >= w.s && t < (next ? next.s : EN_1_END + 0.2);
  });
  const heart = sp(frame, fps, 5.32, 260, 12);
  const beat = 1 + 0.08 * Math.max(0, Math.sin((t - 5.32) * Math.PI * 2.4)) * (t > 5.6 ? 1 : 0);
  const rows = [EN_1.slice(0, 2), EN_1.slice(2)];
  let k = 0;
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 760,
        opacity: 1 - out,
        filter: `blur(${out * 20}px)`,
        transform: `translateY(${-out * 60}px)`,
      }}
    >
      <div
        style={{
          marginBottom: 30,
          opacity: frame >= sec(5.32) ? heart : 0,
          transform: `scale(${heart * beat}) rotate(${(1 - heart) * -20}deg)`,
          filter: "drop-shadow(0 18px 40px rgba(255,77,109,0.5))",
        }}
      >
        <HeartSvg size={230} />
      </div>
      {rows.map((row, r) => (
        <div
          key={r}
          style={{
            fontFamily: LATIN,
            fontWeight: 900,
            fontSize: 180,
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          {row.map((w) => {
            const idx = k++;
            const active = idx === activeIdx;
            const e = sp(frame, fps, w.s - 0.04, 260, 18);
            const act = sp(frame, fps, w.s, 300, 22);
            const isLove = w.w === "love";
            return (
              <span
                key={idx}
                style={{
                  position: "relative",
                  display: "inline-block",
                  margin: "0 24px",
                  opacity: frame >= sec(w.s - 0.04) ? e : 0,
                  filter: `blur(${(1 - e) * 14}px)`,
                  transform: `translateY(${(1 - e) * 70}px) scale(${0.7 + 0.3 * e + (active ? 0.08 * act : 0)})`,
                }}
              >
                {active ? (
                  <span
                    style={{
                      position: "absolute",
                      inset: "8px -28px 0 -28px",
                      borderRadius: 38,
                      background: isLove ? `linear-gradient(135deg,#FF8FA3,${PINK})` : YELLOW,
                      transform: `scale(${act})`,
                    }}
                  />
                ) : null}
                <span
                  style={{
                    position: "relative",
                    color: active ? (isLove ? "white" : INK) : "white",
                    textShadow: active ? "none" : "0 8px 34px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {w.w}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/* ---------------- English line 2: big words + karaoke ---------------- */

const BigWord: React.FC<{ word: Word; until: number }> = ({ word, until }) => {
  const { frame, fps, t } = useT();
  if (t < word.s - 0.05 || t > until + 0.2) return null;
  const enter = sp(frame, fps, word.s - 0.05, 240, 17);
  const out = interpolate(t, [until - 0.02, until + 0.16], [0, 1], clamp);
  const isLove = word.w === "love";
  const isEnglish = word.w === "English";
  const gradient = isLove
    ? "linear-gradient(180deg,#FFC2CE 0%,#FF6F8A 45%,#E8174A 100%)"
    : isEnglish
      ? "linear-gradient(180deg,#FFF1A8 0%,#FFD23F 45%,#FF8A00 100%)"
      : null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 1000,
        textAlign: "center",
        fontFamily: LATIN,
        fontWeight: 900,
        fontSize: word.w.length > 6 ? 300 : 360,
        letterSpacing: -6,
        lineHeight: 1,
        textTransform: "uppercase",
        opacity: enter * (1 - out),
        filter: `blur(${(1 - enter) * 18 + out * 22}px)`,
        transform: `translateY(${(1 - enter) * 120 - out * 90}px) scale(${0.6 + 0.4 * enter + out * 0.15})`,
      }}
    >
      {isLove ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -280,
            marginLeft: -110,
            transform: `scale(${1 + 0.1 * Math.max(0, Math.sin((t - word.s) * Math.PI * 2.6))})`,
            filter: "drop-shadow(0 18px 40px rgba(255,77,109,0.5))",
          }}
        >
          <HeartSvg size={220} />
        </div>
      ) : null}
      <span
        style={
          gradient
            ? {
                background: gradient,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 14px 40px rgba(0,0,0,0.55))",
              }
            : { color: "white", textShadow: "0 14px 50px rgba(0,0,0,0.6), 0 3px 6px rgba(0,0,0,0.45)" }
        }
      >
        {word.w}
      </span>
    </div>
  );
};

const EnglishTwo: React.FC = () => {
  const { frame, fps, t } = useT();
  const bar = sp(frame, fps, 7.65, 160, 20);
  const out = interpolate(t, [EN_2_END + 0.05, EN_2_END + 0.25], [0, 1], clamp);
  if (t < 7.5 || t > EN_2_END + 0.35) return null;
  return (
    <AbsoluteFill>
      {EN_2.map((w, i) => (
        <BigWord key={i} word={w} until={EN_2[i + 1] ? EN_2[i + 1].s : EN_2_END} />
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 720,
          display: "flex",
          justifyContent: "center",
          opacity: bar * (1 - out),
          transform: `translateY(${(1 - bar) * 40}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 34,
            padding: "28px 60px",
            borderRadius: 999,
            background: "rgba(11,11,11,0.55)",
            backdropFilter: "blur(18px)",
            fontFamily: LATIN,
            fontWeight: 800,
            fontSize: 92,
          }}
        >
          {EN_2.map((w, i) => {
            const lit = interpolate(t, [w.s - 0.03, w.s + 0.12], [0, 1], clamp);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  color: lit > 0.5 ? (w.w === "love" ? "#FF7A93" : YELLOW) : "rgba(255,255,255,0.45)",
                  transform: `translateY(${-32 * lit * (1 - lit)}px)`,
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

/* ---------------- Peace (10.3 s →) ---------------- */

const Peace: React.FC = () => {
  const { frame, fps, t } = useT();
  const e = sp(frame, fps, PEACE - 0.05, 220, 15);
  const draw = interpolate(t, [PEACE, PEACE + 0.55], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  if (t < PEACE - 0.1) return null;
  const R = 2 * Math.PI * 80;
  const rings = [0, 0.18, 0.36].map((d) =>
    interpolate(t, [PEACE + d, PEACE + d + 0.9], [0, 1], clamp),
  );
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 820 }}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: 360, height: 360, marginBottom: 40 }}>
          {rings.map((r, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `10px solid ${YELLOW}`,
                opacity: (1 - r) * (r > 0 ? 0.8 : 0),
                transform: `scale(${1 + r * 1.2})`,
              }}
            />
          ))}
          <svg
            viewBox="-100 -100 200 200"
            width={360}
            height={360}
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${0.6 + 0.4 * e}) rotate(${(1 - e) * -90}deg)`,
              opacity: e,
              filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.5))",
            }}
          >
            <circle r={92} fill="rgba(11,11,11,0.55)" />
            <g stroke={YELLOW} strokeWidth={16} strokeLinecap="round" fill="none">
              <circle r={80} strokeDasharray={R} strokeDashoffset={R * (1 - draw)} transform="rotate(-90)" />
              <line x1={0} y1={-80} x2={0} y2={-80 + 160 * draw} />
              <line x1={0} y1={0} x2={-56 * draw} y2={56 * draw} />
              <line x1={0} y1={0} x2={56 * draw} y2={56 * draw} />
            </g>
          </svg>
        </div>
        <div
          style={{
            fontFamily: LATIN,
            fontWeight: 900,
            fontSize: 330,
            letterSpacing: 6,
            lineHeight: 1,
            color: "white",
            textShadow: "0 14px 50px rgba(0,0,0,0.6)",
            opacity: e,
            transform: `translateY(${(1 - e) * 120}px) scale(${0.6 + 0.4 * e})`,
            filter: `blur(${(1 - e) * 16}px)`,
          }}
        >
          PEACE
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Fade: React.FC = () => {
  const { t } = useT();
  const inO = interpolate(t, [0, 0.25], [1, 0], { extrapolateRight: "clamp" });
  const outO = interpolate(t, [10.8, 11.15], [0, 1], clamp);
  return <AbsoluteFill style={{ backgroundColor: "black", opacity: Math.max(inO, outO) }} />;
};

export const EnglishEdit: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    <Footage />
    <Grade />
    <LangPill />
    <Salam />
    <ArabicLine />
    <EnglishOne />
    <EnglishTwo />
    <Peace />
    <Fade />
  </AbsoluteFill>
);

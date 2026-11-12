import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFonts, LATIN, ARABIC } from "./fonts";

loadFonts();

const BLUE = "#1877F2";
const YELLOW = "#FFD23F";
const GREY_BTN = "rgba(255,255,255,0.14)";
const MUTED = "#B0B3B8";
const GREEN = "#31A24C";

export const FOLLOW_OUTRO_SECONDS = 4.2;

// Page details from the creator's profile.
const PAGE_NAME = "English Mastery with Sara";
const FOLLOWERS = 302;
const FOLLOWING = 24;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------------- Icons ---------------- */

const PlusIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M12 4v16M4 12h16" stroke="white" strokeWidth={3.2} strokeLinecap="round" />
  </svg>
);
const CheckIcon: React.FC<{ size: number; color: string; draw: number; width?: number }> = ({
  size,
  color,
  draw,
  width = 3.2,
}) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path
      d="M4 12.5l5 5L20 6.5"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      strokeDasharray={26}
      strokeDashoffset={26 * (1 - draw)}
    />
  </svg>
);
const ChatIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path
      d="M12 3C6.9 3 3 6.7 3 11.4c0 2.6 1.2 4.9 3.2 6.4V21l3-1.7c.9.2 1.8.4 2.8.4 5.1 0 9-3.7 9-8.4S17.1 3 12 3z"
      fill="white"
    />
    <path
      d="M7.5 13.5l3-3 2.2 2 3.8-3.5-3 3.6-2.2-2z"
      fill={BLUE}
      stroke={BLUE}
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
  </svg>
);
const BellIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path
      d="M12 3a6 6 0 0 0-6 6v3.6L4.4 15.4c-.4.7.1 1.6.9 1.6h13.4c.8 0 1.3-.9.9-1.6L18 12.6V9a6 6 0 0 0-6-6z"
      fill={YELLOW}
    />
    <path d="M9.5 19a2.5 2.5 0 0 0 5 0" fill={YELLOW} />
  </svg>
);
const HandIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    <path
      d="M24 6c3 0 5 2.2 5 5v17l2-1.2c2.6-1.4 5.6.3 5.9 3.2l.1.9 1.6-.8c2.6-1.3 5.6.4 5.8 3.3l.1 1.3 1.4-.6c2.7-1.1 5.6.8 5.6 3.7V48c0 7.7-6.3 14-14 14h-6.2c-4.4 0-8.5-2.1-11.1-5.6L9.6 42.4c-1.8-2.4-1.2-5.8 1.3-7.4 2.2-1.4 5.1-1 6.8 1l1.3 1.5V11c0-2.8 2.2-5 5-5z"
      fill="white"
      stroke="#0B0B0B"
      strokeWidth={2.5}
      strokeLinejoin="round"
    />
  </svg>
);

/* ---------------- Outro ---------------- */

export const FollowOutro: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - start; // local time
  if (t < -0.05) return null;

  const at = (s: number) => Math.round((start + s) * fps);
  const sp = (s: number, stiffness = 210, damping = 19) =>
    spring({ frame: frame - at(s), fps, config: { stiffness, damping } });

  // Exit: everything pops out in reverse order, then the frame goes black.
  const EXIT = 3.45;
  const popOut = (order: number) =>
    interpolate(t, [EXIT + order * 0.045, EXIT + order * 0.045 + 0.22], [0, 1], {
      ...clamp,
      easing: Easing.in(Easing.back(1.6)),
    });

  // An element that pops in with spring + blur and pops out on exit.
  const pop = (inAt: number, outOrder: number, lift = 50) => {
    const e = sp(inAt);
    const o = popOut(outOrder);
    return {
      opacity: Math.min(1, e * 1.3) * (1 - o),
      transform: `translateY(${(1 - e) * lift}px) scale(${(0.82 + 0.18 * e) * (1 - 0.6 * o)})`,
      filter: `blur(${(1 - e) * 16 + o * 18}px)`,
    } as React.CSSProperties;
  };

  const bgIn = interpolate(t, [0, 0.35], [0, 1], clamp);
  const bgOut = interpolate(t, [3.85, FOLLOW_OUTRO_SECONDS], [0, 1], clamp);
  const zoom = interpolate(t, [0, FOLLOW_OUTRO_SECONDS], [1.12, 1.22]);

  // Card: 3D tilt-in.
  const card = sp(0.32, 150, 18);
  const cardOut = popOut(6);
  const sweep = interpolate(t, [1.0, 1.7], [-0.4, 1.4], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  const avatar = sp(0.48, 230, 13);
  const ring = interpolate(t, [0.5, 1.05], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  // Finger + tap
  const TAP = 1.85;
  const handIn = interpolate(t, [1.15, 1.7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const press = interpolate(t, [TAP - 0.08, TAP, TAP + 0.12], [0, 1, 0], clamp);
  const handOut = interpolate(t, [2.4, 2.75], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const ripple = interpolate(t, [TAP, TAP + 0.5], [0, 1], clamp);
  const burst = interpolate(t, [TAP + 0.02, TAP + 0.45], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  const flip = sp(TAP + 0.05, 260, 20);
  const check = interpolate(t, [TAP + 0.1, TAP + 0.4], [0, 1], clamp);
  const count = sp(TAP + 0.12, 220, 18);
  const btnColor = interpolateColors(flip, [0, 1], [BLUE, GREY_BTN]);
  const followW = interpolate(flip, [0, 1], [760, 820]);
  const bell = t > TAP + 0.1 ? Math.sin((t - TAP) * 30) * Math.exp(-(t - TAP) * 3) * 22 : 0;

  // Toast notification drops from the top.
  const toastIn = sp(2.15, 230, 17);
  const toastOut = interpolate(t, [3.2, 3.45], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const toastCheck = interpolate(t, [2.3, 2.6], [0, 1], clamp);

  const sfx: { s: number; src: string; vol: number }[] = [
    { s: 0.05, src: "sfx/whoosh.ogg", vol: 0.35 },
    { s: 0.12, src: "sfx/pop.ogg", vol: 0.5 },
    { s: 0.48, src: "sfx/pop2.ogg", vol: 0.45 },
    { s: 0.86, src: "sfx/pop2.ogg", vol: 0.3 },
    { s: TAP, src: "sfx/click.ogg", vol: 0.8 },
    { s: TAP + 0.06, src: "sfx/ding.ogg", vol: 0.5 },
    { s: 2.15, src: "sfx/pop.ogg", vol: 0.45 },
    { s: EXIT, src: "sfx/whoosh.ogg", vol: 0.35 },
  ];

  return (
    <AbsoluteFill style={{ opacity: bgIn, overflow: "hidden" }}>
      {/* Background: her photo, blurred and dark, slowly zooming */}
      <AbsoluteFill style={{ backgroundColor: "#07090F" }} />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, filter: "blur(60px) saturate(1.2)", opacity: 0.55 }}>
        <Img src={staticFile("cover-bg.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 52%, rgba(24,119,242,0.32) 0%, rgba(7,9,15,0.55) 55%, rgba(7,9,15,0.92) 100%)",
        }}
      />

      {/* Toast notification */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: "50%",
          width: 1760,
          marginLeft: -880,
          display: "flex",
          alignItems: "center",
          gap: 44,
          padding: "40px 56px",
          borderRadius: 64,
          background: "rgba(255,255,255,0.97)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.45)",
          opacity: t > 2.1 ? toastIn * (1 - toastOut) : 0,
          transform: `translateY(${(1 - toastIn) * -420 - toastOut * 300}px) scale(${0.9 + 0.1 * toastIn})`,
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            flexShrink: 0,
            borderRadius: "50%",
            background: GREEN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${sp(2.25, 300, 12)})`,
          }}
        >
          <CheckIcon size={100} color="white" draw={toastCheck} width={3.6} />
        </div>
        <div style={{ fontFamily: LATIN, lineHeight: 1.25, whiteSpace: "nowrap" }}>
          <div style={{ fontWeight: 900, fontSize: 82, color: "#0B0B0B" }}>You&apos;re now following</div>
          <div style={{ fontWeight: 700, fontSize: 64, color: "#65676B" }}>{PAGE_NAME}</div>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 820,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
          ...pop(0.1, 8, -70),
        }}
      >
        <div style={{ transform: `rotate(${bell}deg)`, transformOrigin: "50% 10%" }}>
          <BellIcon size={170} />
        </div>
        <div
          style={{
            fontFamily: LATIN,
            fontWeight: 900,
            fontSize: 165,
            color: "white",
            letterSpacing: 2,
            whiteSpace: "nowrap",
            textShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          FOLLOW FOR MORE
        </div>
      </div>
      <div
        dir="rtl"
        style={{
          position: "absolute",
          top: 1090,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: ARABIC,
          fontWeight: 900,
          fontSize: 110,
          color: YELLOW,
          ...pop(0.22, 7),
        }}
      >
        تابعني باش متفوتكش الدروس الجاية
      </div>

      {/* Profile card (glass) with 3D tilt-in */}
      <div style={{ position: "absolute", inset: 0, perspective: 2400 }}>
        <div
          style={{
            position: "absolute",
            top: 1900,
            left: "50%",
            width: 1800,
            marginLeft: -900,
            padding: "0 90px 110px",
            borderRadius: 90,
            background: "linear-gradient(160deg, rgba(58,59,60,0.92), rgba(36,37,38,0.92))",
            border: "3px solid rgba(255,255,255,0.12)",
            boxShadow: "0 60px 160px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: Math.min(1, card * 1.4) * (1 - cardOut),
            transform: `translateY(${(1 - card) * 300}px) rotateX(${(1 - card) * 28}deg) scale(${
              (0.88 + 0.12 * card) * (1 - 0.5 * cardOut)
            })`,
            filter: `blur(${cardOut * 20}px)`,
            transformOrigin: "50% 100%",
          }}
        >
          {/* Light sweep across the card */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 90,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -200,
                bottom: -200,
                width: 380,
                left: `${sweep * 100}%`,
                transform: "rotate(18deg)",
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.14), rgba(255,255,255,0))",
              }}
            />
          </div>

          {/* Avatar with a ring that draws itself */}
          <div
            style={{
              position: "relative",
              width: 640,
              height: 640,
              marginTop: -320,
              ...pop(0.48, 5, 0),
              transform: `scale(${avatar * (1 - 0.6 * popOut(5))})`,
            }}
          >
            <svg viewBox="0 0 640 640" width={640} height={640} style={{ position: "absolute", inset: 0 }}>
              <circle cx={320} cy={320} r={309} fill="#242526" />
              <circle
                cx={320}
                cy={320}
                r={309}
                fill="none"
                stroke={BLUE}
                strokeWidth={22}
                strokeDasharray={2 * Math.PI * 309}
                strokeDashoffset={2 * Math.PI * 309 * (1 - ring)}
                strokeLinecap="round"
                transform="rotate(-90 320 320)"
              />
            </svg>
            <Img
              src={staticFile("pfp.jpg")}
              style={{
                position: "absolute",
                inset: 36,
                width: 568,
                height: 568,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 40,
                bottom: 40,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: GREEN,
                border: "16px solid #2E2F30",
                transform: `scale(${sp(0.9, 300, 11)})`,
              }}
            />
          </div>

          <div
            style={{
              marginTop: 60,
              fontFamily: LATIN,
              fontWeight: 800,
              fontSize: 118,
              color: "white",
              whiteSpace: "nowrap",
              ...pop(0.62, 4),
            }}
          >
            {PAGE_NAME}
          </div>

          {/* Followers, count rolls 302 → 303 */}
          <div
            style={{
              marginTop: 26,
              display: "flex",
              alignItems: "center",
              gap: 24,
              fontFamily: LATIN,
              fontWeight: 700,
              fontSize: 76,
              color: "white",
              ...pop(0.7, 3),
            }}
          >
            <span
              style={{
                position: "relative",
                display: "inline-block",
                height: 100,
                width: 170,
                overflow: "hidden",
                textAlign: "right",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  transform: `translateY(${-count * 100}px)`,
                  opacity: 1 - count,
                }}
              >
                {FOLLOWERS}
              </span>
              <span
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  color: YELLOW,
                  transform: `translateY(${(1 - count) * 100}px) scale(${1 + 0.15 * Math.sin(count * Math.PI)})`,
                  opacity: count,
                }}
              >
                {FOLLOWERS + 1}
              </span>
            </span>
            <span>followers</span>
            <span style={{ color: MUTED }}>·</span>
            <span>{FOLLOWING} following</span>
          </div>
          <div
            style={{
              marginTop: 20,
              fontFamily: LATIN,
              fontWeight: 600,
              fontSize: 62,
              color: MUTED,
              ...pop(0.78, 2),
            }}
          >
            Digital creator
          </div>

          {/* Buttons */}
          <div style={{ marginTop: 80, display: "flex", gap: 40, ...pop(0.86, 1, 70) }}>
            <div style={{ position: "relative" }}>
              {/* Burst rays around the Follow button */}
              {Array.from({ length: 12 }).map((_, k) => {
                const a = (k / 12) * Math.PI * 2;
                const r0 = 230 + burst * 160;
                return (
                  <div
                    key={k}
                    style={{
                      position: "absolute",
                      left: followW / 2 + Math.cos(a) * r0 * 1.9 - 7,
                      top: 95 + Math.sin(a) * r0 * 0.75 - 30,
                      width: 14,
                      height: 60 * (1 - burst) + 8,
                      borderRadius: 7,
                      background: k % 2 ? YELLOW : "white",
                      opacity: burst > 0 && burst < 1 ? 1 - burst : 0,
                      transform: `rotate(${(a * 180) / Math.PI + 90}deg)`,
                    }}
                  />
                );
              })}
              <div
                style={{
                  position: "relative",
                  width: followW,
                  height: 190,
                  borderRadius: 40,
                  background: btnColor,
                  boxShadow: flip < 0.5 ? `0 ${20 - 14 * press}px 50px rgba(24,119,242,0.45)` : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 30,
                  fontFamily: LATIN,
                  fontWeight: 700,
                  fontSize: 82,
                  color: "white",
                  transform: `scale(${1 - 0.06 * press + 0.05 * Math.sin(Math.min(1, flip) * Math.PI)})`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 900,
                    height: 900,
                    marginLeft: -450,
                    marginTop: -450,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.35)",
                    transform: `scale(${ripple})`,
                    opacity: ripple > 0 ? 1 - ripple : 0,
                  }}
                />
                {flip < 0.5 ? (
                  <>
                    <PlusIcon size={80} />
                    <span>Follow</span>
                  </>
                ) : (
                  <>
                    <CheckIcon size={80} color="white" draw={check} />
                    <span>Following</span>
                  </>
                )}
              </div>
            </div>
            <div
              style={{
                width: 760,
                height: 190,
                borderRadius: 40,
                background: GREY_BTN,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 26,
                fontFamily: LATIN,
                fontWeight: 700,
                fontSize: 82,
                color: "white",
              }}
            >
              <ChatIcon size={86} />
              <span>Message</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tapping finger */}
      <div
        style={{
          position: "absolute",
          left: interpolate(handIn, [0, 1], [1700, 470]) + handOut * 900,
          top: interpolate(handIn, [0, 1], [3900, 2870]) + handOut * 700,
          opacity: Math.min(handIn * 2, 1) * (1 - handOut),
          transform: `scale(${1 - 0.12 * press}) rotate(-12deg)`,
          filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))",
        }}
      >
        <HandIcon size={300} />
      </div>

      <AbsoluteFill style={{ backgroundColor: "black", opacity: bgOut }} />

      {sfx.map((s, k) => (
        <Sequence key={k} from={at(s.s)} durationInFrames={Math.round(1.5 * fps)} layout="none">
          <Audio src={staticFile(s.src)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

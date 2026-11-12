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
const CARD = "#242526";
const GREY_BTN = "#3A3B3C";
const MUTED = "#B0B3B8";

export const FOLLOW_OUTRO_SECONDS = 3.6;

// Page details from the creator's profile.
const PAGE_NAME = "English Mastery with Sara";
const FOLLOWERS = 302;
const FOLLOWING = 24;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const PlusIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M12 4v16M4 12h16" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
  </svg>
);
const CheckIcon: React.FC<{ size: number; color: string; draw: number }> = ({ size, color, draw }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path
      d="M4 12.5l5 5L20 6.5"
      stroke={color}
      strokeWidth={3.2}
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
    <path d="M7.5 13.5l3-3 2.2 2 3.8-3.5-3 3.6-2.2-2z" fill={BLUE} stroke={BLUE} strokeWidth={1.2} strokeLinejoin="round" />
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

export const FollowOutro: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - start; // local time
  if (t < -0.05) return null;

  const at = (s: number) => Math.round((start + s) * fps);
  const sp = (s: number, stiffness = 200, damping = 18) =>
    spring({ frame: frame - at(s), fps, config: { stiffness, damping } });

  const bg = interpolate(t, [0, 0.3], [0, 1], clamp);
  const title = sp(0.15);
  const sub = sp(0.3);
  const card = sp(0.3, 170, 19);
  const avatar = sp(0.4, 220, 14);
  const name = sp(0.6);
  const buttons = sp(0.8);

  // Finger: slides in, taps Follow at 1.75 s.
  const TAP = 1.75;
  const handIn = interpolate(t, [1.0, 1.6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const press = interpolate(t, [TAP - 0.08, TAP, TAP + 0.12], [0, 1, 0], clamp);
  const handOut = interpolate(t, [2.4, 2.8], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const ripple = interpolate(t, [TAP, TAP + 0.5], [0, 1], clamp);

  // Follow → Following
  const flip = sp(TAP + 0.05, 260, 20);
  const check = interpolate(t, [TAP + 0.1, TAP + 0.4], [0, 1], clamp);
  const count = sp(TAP + 0.12, 220, 18);
  const bell = t > TAP + 0.1 ? Math.sin((t - TAP) * 30) * Math.exp(-(t - TAP) * 3) * 22 : 0;

  const end = interpolate(t, [FOLLOW_OUTRO_SECONDS - 0.35, FOLLOW_OUTRO_SECONDS], [0, 1], clamp);

  const btnColor = interpolateColors(flip, [0, 1], [BLUE, GREY_BTN]);
  const followW = interpolate(flip, [0, 1], [760, 820]);

  const sfx: { s: number; src: string; vol: number }[] = [
    { s: 0.15, src: "sfx/pop.ogg", vol: 0.5 },
    { s: 0.4, src: "sfx/pop2.ogg", vol: 0.45 },
    { s: 0.8, src: "sfx/pop2.ogg", vol: 0.35 },
    { s: TAP, src: "sfx/click.ogg", vol: 0.8 },
    { s: TAP + 0.08, src: "sfx/ding.ogg", vol: 0.55 },
  ];

  return (
    <AbsoluteFill style={{ opacity: bg }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 48%, #1A2A4F 0%, #0E1424 60%, #07090F 100%)",
        }}
      />

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
          opacity: title,
          transform: `translateY(${(1 - title) * -80}px) scale(${0.8 + 0.2 * title})`,
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
          opacity: sub,
          transform: `translateY(${(1 - sub) * 50}px)`,
        }}
      >
        تابعني باش متفوتكش الدروس الجاية
      </div>

      {/* Profile card */}
      <div
        style={{
          position: "absolute",
          top: 1900,
          left: "50%",
          width: 1800,
          marginLeft: -900,
          padding: "0 90px 110px",
          borderRadius: 90,
          background: CARD,
          boxShadow: "0 50px 140px rgba(0,0,0,0.55)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: card,
          transform: `translateY(${(1 - card) * 260}px) scale(${0.9 + 0.1 * card})`,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            position: "relative",
            width: 640,
            height: 640,
            marginTop: -320,
            transform: `scale(${avatar})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: BLUE,
              padding: 22,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: CARD,
                padding: 14,
              }}
            >
              <Img
                src={staticFile("pfp.jpg")}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              right: 40,
              bottom: 40,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "#31A24C",
              border: `16px solid ${CARD}`,
              transform: `scale(${sp(0.75, 260, 12)})`,
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
            opacity: name,
            transform: `translateY(${(1 - name) * 40}px)`,
          }}
        >
          {PAGE_NAME}
        </div>

        {/* Followers, with the count rolling 302 → 303 */}
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
            opacity: name,
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
                transform: `translateY(${(1 - count) * 100}px)`,
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
            opacity: name,
          }}
        >
          Digital creator
        </div>

        {/* Buttons */}
        <div
          style={{
            marginTop: 80,
            display: "flex",
            gap: 40,
            opacity: buttons,
            transform: `translateY(${(1 - buttons) * 60}px)`,
          }}
        >
          <div
            style={{
              position: "relative",
              width: followW,
              height: 190,
              borderRadius: 40,
              background: btnColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 30,
              fontFamily: LATIN,
              fontWeight: 700,
              fontSize: 82,
              color: "white",
              transform: `scale(${1 - 0.06 * press})`,
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
                <PlusIcon size={80} color="white" />
                <span>Follow</span>
              </>
            ) : (
              <>
                <CheckIcon size={80} color="white" draw={check} />
                <span>Following</span>
              </>
            )}
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

      <AbsoluteFill style={{ backgroundColor: "black", opacity: end }} />

      {sfx.map((s, k) => (
        <Sequence key={k} from={at(s.s)} durationInFrames={Math.round(1.2 * fps)} layout="none">
          <Audio src={staticFile(s.src)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

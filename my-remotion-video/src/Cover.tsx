import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFonts, LATIN, ARABIC } from "./fonts";

loadFonts();

const YELLOW = "#FFD23F";
const RED = "#FF2D2D";
const INK = "#0B0B0B";

const AngryFace: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="-50 -50 100 100" width={size} height={size}>
    <circle r={46} fill={RED} />
    <g stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none">
      <line x1={-30} y1={-18} x2={-8} y2={-4} />
      <line x1={30} y1={-18} x2={8} y2={-4} />
      <path d="M -18 30 Q 0 8 18 30" />
    </g>
    <circle cx={-16} cy={6} r={5} fill={INK} />
    <circle cx={16} cy={6} r={5} fill={INK} />
  </svg>
);

export const Cover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    <Img
      src={staticFile("cover-bg.jpg")}
      style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.04)" }}
    />
    {/* Vignette + shade so the text reads */}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 75% 60% at 50% 35%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.4) 100%)",
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0) 48%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.82) 100%)",
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 70% 58% at 50% 40%, rgba(255,30,30,0) 55%, rgba(255,30,30,0.35) 100%)",
        mixBlendMode: "screen",
      }}
    />

    {/* Top tag */}
    <div
      style={{
        position: "absolute",
        top: 230,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "26px 64px",
        borderRadius: 999,
        background: YELLOW,
        color: INK,
        fontFamily: LATIN,
        fontWeight: 900,
        fontSize: 84,
        letterSpacing: 14,
        whiteSpace: "nowrap",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      ENGLISH LESSON
    </div>

    {/* Main title */}
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 560 }}
    >
      <div
        dir="rtl"
        style={{
          fontFamily: ARABIC,
          fontWeight: 900,
          fontSize: 182,
          lineHeight: 1.25,
          color: "white",
          textAlign: "center",
          whiteSpace: "nowrap",
          textShadow: "0 14px 50px rgba(0,0,0,0.7), 0 3px 8px rgba(0,0,0,0.5)",
        }}
      >
        طريقة خرى باش تقول
      </div>
      <div
        style={{
          marginTop: 40,
          display: "flex",
          alignItems: "center",
          gap: 50,
          padding: "10px 90px 40px",
          borderRadius: 90,
          background: `linear-gradient(135deg, #FF5A4A, ${RED} 50%, #C80000)`,
          boxShadow: "0 30px 90px rgba(200,0,0,0.5)",
          transform: "rotate(-2deg)",
        }}
      >
        <div
          dir="rtl"
          style={{
            fontFamily: ARABIC,
            fontWeight: 900,
            fontSize: 300,
            lineHeight: 1.25,
            color: "white",
            whiteSpace: "nowrap",
          }}
        >
          أنا معصب
        </div>
        <div style={{ marginTop: 40, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.35))" }}>
          <AngryFace size={230} />
        </div>
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);

"""Build a HyperFrames project: footage + iMessage-style English captions,
an end replay of the English phrases, music at 20%, pop SFX and the follow card.
Usage: python3 make_bubble_edit.py spec.json
"""
import json, os, shutil, sys

spec = json.load(open(sys.argv[1]))
P = spec["project"]
os.makedirs(f"{P}/compositions", exist_ok=True)
os.makedirs(f"{P}/assets/sfx", exist_ok=True)
os.makedirs(f"{P}/assets/fonts", exist_ok=True)
CAFE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "hf-cafe-video")
for f in os.listdir(f"{CAFE}/assets/sfx"):
    shutil.copy(f"{CAFE}/assets/sfx/{f}", f"{P}/assets/sfx/{f}")
for f in os.listdir(f"{CAFE}/assets/fonts"):
    shutil.copy(f"{CAFE}/assets/fonts/{f}", f"{P}/assets/fonts/{f}")
shutil.copy(f"{CAFE}/assets/pfp.jpg", f"{P}/assets/pfp.jpg")
shutil.copy(f"{CAFE}/compositions/follow.html", f"{P}/compositions/follow.html")
shutil.copy(f"{CAFE}/.gitignore", f"{P}/.gitignore")

FOOT = spec["footage_duration"]
groups = spec["groups"]          # [{id, kind: sent|recv|fast, words: [[w,t],...], end, key, strike}]
replay = spec["replay"]          # [[srcStart, srcEnd], ...] in source time, each one English phrase
GAP = 0.05

# Replay timeline: clips placed back to back after the footage.
R0 = round(FOOT, 3)                        # replay starts as the footage ends
t = R0
rclips = []
for (a, b) in replay:
    rclips.append((t, a, b))
    t += (b - a) + GAP
REND = t + 0.3
FOLLOW = REND
TOTAL = round(FOLLOW + 3.8, 2)

# Replay caption groups: copy every group whose words fall inside a replay clip.
rgroups = []
for k, (ts, a, b) in enumerate(rclips):
    for g in groups:
        if g["kind"] == "fast":
            continue
        g0 = g["words"][0][1]
        if a - 0.01 <= g0 <= b:
            off = ts - a
            rgroups.append(dict(g, id=f"r{k}{g['id']}", kind="sent",
                                words=[[w, round(x + off, 3)] for w, x in g["words"]],
                                end=round(min(g["end"], b) + off, 3), start=round(ts, 3)))
            break

def clean(w):
    return w.strip(",.?!")

def is_key(g, w):
    return clean(w) in g.get("key", [])

def style_a(g):
    """Word-by-word pop captions; the spoken word sits on a yellow pill (key word: gold gradient)."""
    gid, fast = g["id"], g["kind"] == "fast"
    s = g.get("start", g["words"][0][1] - 0.15)
    end = g["end"] + 0.25
    spans = []
    for i, (w, _) in enumerate(g["words"]):
        pill = "" if fast else f'<span id="{gid}-p{i}" class="pill{" key" if is_key(g, w) else ""}"></span>'
        spans.append(f'<span id="{gid}-w{i}" class="cw">{pill}<span id="{gid}-t{i}" class="ct">{w}</span></span>')
    lab = f'<div id="{gid}-lab" class="clab">{g["label"]}</div>' if g.get("label") else ""
    strike = f'<div id="{gid}-x" class="cstrike" data-layout-allow-occlusion></div>' if g.get("strike") else ""
    track = 1 if fast else 0
    html = (f'    <div id="{gid}" class="clip cap" data-start="{round(s,3)}" data-duration="{round(end - s,3)}" data-track-index="{track}">\n'
            f'      {lab}\n'
            f'      <div id="{gid}-in" class="cap-in{" fast" if fast else ""}" data-layout-allow-overlap><span id="{gid}-line" class="cline">{" ".join(spans)}{strike}</span></div>\n'
            f'    </div>')
    js = []
    if g.get("label"):
        js.append(f'    tl.fromTo("#{gid}-lab", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }}, {round(s,3)});')
    W = g["words"]
    for i, (w, t) in enumerate(W):
        tn = W[i + 1][1] if i + 1 < len(W) else None
        js.append(f'    tl.fromTo("#{gid}-w{i}", {{ opacity: 0, y: 70, scale: 0.7 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "back.out(2)" }}, {round(t-0.03,3)});')
        if fast:
            js.append(f'    tl.fromTo("#{gid}-t{i}", {{ color: "#ffd23f" }}, {{ color: "#ffffff", duration: 0.25, ease: "none" }}, {round(t+0.12,3)});')
            continue
        js.append(f'    tl.fromTo("#{gid}-p{i}", {{ scale: 0 }}, {{ scale: 1, duration: 0.14, ease: "back.out(2)" }}, {round(t,3)});')
        js.append(f'    tl.fromTo("#{gid}-t{i}", {{ color: "#ffffff" }}, {{ color: "#0b0b0b", duration: 0.06, ease: "none" }}, {round(t,3)});')
        if tn is not None:
            off = max(tn, t + 0.15)
            col = "#ffd23f" if is_key(g, w) else "#ffffff"
            js.append(f'    tl.to("#{gid}-p{i}", {{ scale: 0, duration: 0.1, ease: "power2.in" }}, {round(off,3)});')
            js.append(f'    tl.to("#{gid}-t{i}", {{ color: "{col}", duration: 0.06, ease: "none" }}, {round(off,3)});')
    if g.get("strike"):
        js.append(f'    tl.fromTo("#{gid}-x", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.25, ease: "power3.out" }}, {round(g["end"]-0.15,3)});')
    js.append(f'    tl.to("#{gid}-in", {{ opacity: 0, y: -60, scale: 0.94, duration: 0.18, ease: "power2.in" }}, {round(end-0.19,3)});')
    if g.get("label"):
        js.append(f'    tl.to("#{gid}-lab", {{ opacity: 0, duration: 0.15, ease: "power2.in" }}, {round(end-0.19,3)});')
    return s, html, js

def style_b(g):
    """Repeat: one huge word at a time (key word in gold gradient) plus a karaoke pill of the full line."""
    gid = g["id"]
    s = g["words"][0][1] - 0.12
    end = g["end"] + 0.25
    W = g["words"]
    bigs, kara = [], []
    for i, (w, _) in enumerate(W):
        word = clean(w).upper()
        size = min(330, int(1800 / (0.7 * max(1, len(word)))))
        bigs.append(f'<div id="{gid}-b{i}" class="bigw{" key" if is_key(g, w) else ""}" style="font-size: {size}px"><span>{word}</span></div>')
        kara.append(f'<span id="{gid}-k{i}" class="kw">{w}</span>')
    html = (f'    <div id="{gid}" class="clip cap" data-start="{round(s,3)}" data-duration="{round(end - s,3)}" data-track-index="2">\n'
            f'      <div id="{gid}-in" class="big-in" data-layout-allow-overlap>\n'
            f'        {"".join(bigs)}\n'
            f'        <div class="kara-row"><div id="{gid}-kara" class="kara">{" ".join(kara)}</div></div>\n'
            f'      </div>\n'
            f'    </div>')
    js = [f'    tl.fromTo("#{gid}-kara", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }}, {round(s,3)});']
    for i, (w, t) in enumerate(W):
        tn = W[i + 1][1] if i + 1 < len(W) else None
        ent = 0.18 if tn is None else max(0.06, min(0.18, tn - t - 0.06))
        js.append(f'    tl.fromTo("#{gid}-b{i}", {{ opacity: 0, scale: 0.55, y: 110 }}, {{ opacity: 1, scale: 1, y: 0, duration: {round(ent,3)}, ease: "back.out(1.8)" }}, {round(t-0.03,3)});')
        if tn is not None:
            js.append(f'    tl.to("#{gid}-b{i}", {{ opacity: 0, scale: 1.12, y: -90, duration: 0.06, ease: "power2.in" }}, {round(max(tn - 0.03, t - 0.03 + ent + 0.001),3)});')
        col = "#ffd23f" if is_key(g, w) else "#ffffff"
        js.append(f'    tl.fromTo("#{gid}-k{i}", {{ color: "rgba(255,255,255,0.45)" }}, {{ color: "{col}", duration: 0.08, ease: "none" }}, {round(t,3)});')
    js.append(f'    tl.to("#{gid}-in", {{ opacity: 0, y: -60, duration: 0.18, ease: "power2.in" }}, {round(end-0.19,3)});')
    return s, html, js

def style_g(g, rep):
    """Glam caption: bold white words flip in; the key word lands in gold-pink italic.
    Repeats also draw an underline swoosh with sparkles."""
    gid = g["id"]
    s = g.get("start", g["words"][0][1] - 0.15)
    end = g["end"] + 0.25
    parts = []
    for i, (w, _) in enumerate(g["words"]):
        cls = "gk" if is_key(g, w) else "gl"
        parts.append(f'<span id="{gid}-w{i}" class="{cls}">{w}</span>')
    extra = ""
    if rep:
        extra = (f'<svg id="{gid}-sw" class="gsw" viewBox="0 0 1000 120" width="1000" height="120" data-layout-ignore>'
                 f'<path id="{gid}-path" d="M20 80 C 260 20, 600 20, 980 70" stroke="url(#gGrad)" stroke-width="22" stroke-linecap="round" fill="none" stroke-dasharray="1100" stroke-dashoffset="1100"/></svg>'
                 + "".join(f'<div id="{gid}-st{k}" class="gstar" data-layout-ignore></div>' for k in range(4)))
    html = (f'    <div id="{gid}" class="clip cap" data-start="{round(s,3)}" data-duration="{round(end - s,3)}" data-track-index="{2 if rep else 0}">\n'
            f'      <div id="{gid}-in" class="g-in" data-layout-allow-overlap><div class="gline">{" ".join(parts)}</div>{extra}</div>\n'
            f'    </div>')
    js = []
    kt = None
    for i, (w, t) in enumerate(g["words"]):
        if is_key(g, w):
            kt = kt or t
            js.append(f'    tl.fromTo("#{gid}-w{i}", {{ opacity: 0, scale: 0.5, scaleX: 1.35, y: 40 }}, {{ opacity: 1, scale: 1, scaleX: 1, y: 0, duration: 0.32, ease: "back.out(2.2)" }}, {round(t-0.03,3)});')
            js.append(f'    tl.fromTo("#{gid}-w{i}", {{ backgroundPosition: "0% 50%" }}, {{ backgroundPosition: "100% 50%", duration: {round(max(0.3, end - t),3)}, ease: "none" }}, {round(t-0.03,3)});')
        else:
            js.append(f'    tl.fromTo("#{gid}-w{i}", {{ opacity: 0, y: 70, rotationX: -70, transformPerspective: 900 }}, {{ opacity: 1, y: 0, rotationX: 0, duration: 0.26, ease: "back.out(1.8)" }}, {round(t-0.03,3)});')
    if rep and kt is not None:
        js.append(f'    tl.to("#{gid}-path", {{ attr: {{ "stroke-dashoffset": 0 }}, duration: 0.35, ease: "power3.out" }}, {round(kt+0.12,3)});')
        for k, (dx, dy) in enumerate([(-560, -170), (560, -190), (-470, 150), (500, 130)]):
            js.append(f'    tl.fromTo("#{gid}-st{k}", {{ opacity: 0, scale: 0, rotation: 0, x: {dx}, y: {dy} }}, {{ opacity: 1, scale: 1, rotation: 90, duration: 0.25, ease: "back.out(3)" }}, {round(kt+0.15+k*0.05,3)});')
            js.append(f'    tl.to("#{gid}-st{k}", {{ opacity: 0, scale: 0.3, rotation: 180, duration: 0.25, ease: "power2.in" }}, {round(kt+0.45+k*0.05,3)});')
    js.append(f'    tl.to("#{gid}-in", {{ opacity: 0, y: -60, scale: 0.94, duration: 0.18, ease: "power2.in" }}, {round(end-0.19,3)});')
    return s, html, js

html, js, sfx = [], [], []
for g in groups + rgroups:
    if g["kind"] == "fast" or g.get("strike"):
        s, h, j = style_a(g)
    else:
        s, h, j = style_g(g, g["kind"] == "recv")
    html.append(h)
    js += j
    sfx.append((g["id"], "pop" if g["kind"] != "recv" else "pop2", round(s - 0.02, 3), 0.5))
    for w, t in g["words"]:
        if is_key(g, w) and g["kind"] != "fast":
            sfx.append((g["id"] + "-key", "pop2" if g["kind"] == "recv" else "pop", round(t - 0.02, 3), 0.45))
            break

# Section badges (01/02/03) with meaning cards, plus light-streak cuts.
sections = spec.get("sections", [])
if sections:
    sh, sj = [], []
    for i, sec in enumerate(sections):
        sid = f"sc{i}"; a, b = sec["start"], sec["end"]
        sh.append(f'''    <div id="{sid}" class="clip sc" data-start="{a}" data-duration="{round(b-a,3)}" data-track-index="{i%3}">
      <div id="{sid}-num" class="sc-num" data-layout-allow-overlap><span class="sc-num-o">{sec["num"]}</span><span class="sc-num-f" data-layout-allow-occlusion>{sec["num"]}</span></div>
      <div id="{sid}-card" class="sc-card" style="--accent: {sec.get("color", "#ffd23f")}">
        <div class="sc-lab">{sec["label"]}</div>
        <div class="sc-mean">{sec["meaning"]}</div>
      </div>
    </div>''')
        sj.append(f'    tl.fromTo("#{sid}-num", {{ opacity: 0, x: -520, skewX: -18, scaleX: 1.5 }}, {{ opacity: 1, x: 0, skewX: 0, scaleX: 1, duration: 0.42, ease: "expo.out" }}, {a});')
        sj.append(f'    tl.fromTo("#{sid}-card", {{ opacity: 0, x: 900, rotationY: -35, transformPerspective: 1600 }}, {{ opacity: 1, x: 0, rotationY: 0, duration: 0.5, ease: "back.out(1.4)" }}, {round(a+0.12,3)});')
        sj.append(f'    tl.to(["#{sid}-num", "#{sid}-card"], {{ opacity: 0, x: -200, duration: 0.18, ease: "power2.in" }}, {round(b-0.2,3)});')
        sfx.append((f"{sid}-whoosh", "whoosh", round(a - 0.08, 3), 0.35))
        sfx.append((f"{sid}-pop", "pop", round(a + 0.05, 3), 0.45))
    sec_doc = f'''<template>
  <style>
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    .sc {{ position: absolute; inset: 0; }}
    .sc-num {{ position: absolute; left: 180px; top: 400px; width: 520px; height: 360px; font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 360px; line-height: 1; letter-spacing: -14px; }}
    .sc-num span {{ position: absolute; left: 0; top: 0; }}
    .sc-num-o {{ color: transparent; -webkit-text-stroke: 6px rgba(255, 255, 255, 0.85); transform: translate(22px, 22px); }}
    .sc-num-f {{ background: linear-gradient(160deg, #fff1c9 0%, #ffd23f 30%, #ff9f43 60%, #ff3d7f 100%); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.5)); }}
    .sc-card {{ position: absolute; left: 720px; top: 440px; width: 1160px; height: 300px; padding: 58px 0 0 70px; border-radius: 60px; background: rgba(15, 16, 22, 0.72); border: 3px solid rgba(255, 255, 255, 0.14); box-shadow: 0 40px 100px rgba(0, 0, 0, 0.45), inset 12px 0 0 var(--accent); white-space: nowrap; }}
    .sc-lab {{ font-family: "Montserrat", sans-serif; font-weight: 800; font-size: 58px; line-height: 1.2; letter-spacing: 6px; color: #ffd23f; }}
    .sc-mean {{ margin-top: 14px; font-family: "Montserrat", sans-serif; font-weight: 800; font-size: 76px; line-height: 1.2; color: #ffffff; }}
  </style>
  <div id="root" data-composition-id="sections" data-width="2160" data-height="3840">
{chr(10).join(sh)}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{chr(10).join(sj)}
    window.__timelines["sections"] = tl;
  </script>
</template>
'''
    open(f"{P}/compositions/sections.html", "w").write(sec_doc)

# Replay title
html.append(f'''    <div id="replay-tag" class="clip" data-start="{R0}" data-duration="{round(REND - R0,3)}" data-track-index="3">
      <div id="replay-in"><span id="replay-ic">↻</span> REPLAY · say it with me</div>
    </div>''')
js.append(f'    tl.fromTo("#replay-in", {{ opacity: 0, scale: 0.5, y: -60 }}, {{ opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(2)" }}, {R0});')
js.append(f'    tl.fromTo("#replay-ic", {{ rotation: 0 }}, {{ rotation: 360, duration: 0.8, ease: "power2.inOut" }}, {R0});')
sfx.append(("replay", "whoosh", round(R0, 3), 0.35))

cap = f'''<template>
  <style>
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    .cap {{ position: absolute; left: 0; right: 0; top: 0; height: 3840px; overflow: visible; }}
    .cap-in {{ position: absolute; left: 160px; right: 160px; top: 2080px; text-align: center; }}
    .cline {{ position: relative; display: inline; font-family: "Poppins", sans-serif; font-weight: 900; font-size: 150px; line-height: 1.34; }}
    .cap-in.fast {{ top: 1900px; }}
    .cap-in.fast .cline {{ font-size: 104px; font-weight: 800; line-height: 1.3; }}
    .cw {{ position: relative; display: inline-block; margin: 0 6px; }}
    .pill {{ position: absolute; left: -24px; right: -24px; top: 14px; bottom: 6px; border-radius: 34px; background: #ffd23f; }}
    .pill.key {{ background: linear-gradient(135deg, #ffe066, #ff9f1c); }}
    .ct {{ position: relative; color: #ffffff; text-shadow: 0 8px 34px rgba(0, 0, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.5); }}
    .cstrike {{ position: absolute; left: -30px; right: -30px; top: 50%; height: 30px; margin-top: -15px; border-radius: 15px; background: #ff3b30; transform-origin: 0 50%; }}
    .clab {{ position: absolute; left: 0; right: 0; top: 1540px; width: fit-content; margin: 0 auto; padding: 18px 50px; border-radius: 999px; background: #e0241b; text-align: center; font-family: "Poppins", sans-serif; font-weight: 800; font-size: 76px; letter-spacing: 6px; line-height: 1.2; color: #ffffff; }}
    .big-in {{ position: absolute; left: 0; right: 0; top: 0; height: 3840px; }}
    .bigw {{ position: absolute; left: 0; right: 0; top: 2000px; text-align: center; font-family: "Poppins", sans-serif; font-weight: 900; line-height: 1; letter-spacing: -4px; opacity: 0; }}
    .bigw span {{ color: #ffffff; text-shadow: 0 14px 50px rgba(0, 0, 0, 0.6), 0 3px 6px rgba(0, 0, 0, 0.45); }}
    .bigw.key span {{ background: linear-gradient(180deg, #fff1a8 0%, #ffd23f 45%, #ff8a00 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; filter: drop-shadow(0 14px 40px rgba(0, 0, 0, 0.55)); }}
    .kara-row {{ position: absolute; left: 0; right: 0; top: 2440px; text-align: center; }}
    .kara {{ display: inline-block; max-width: 1840px; padding: 26px 56px; border-radius: 60px; background: rgba(11, 11, 11, 0.6); font-family: "Poppins", sans-serif; font-weight: 800; font-size: 84px; line-height: 1.3; }}
    .kw {{ display: inline-block; color: rgba(255, 255, 255, 0.45); }}
    #replay-tag {{ position: absolute; left: 0; right: 0; top: 0; height: 3840px; }}
    #replay-in {{
      position: absolute; left: 0; right: 0; top: 520px; margin: 0 auto; width: 1500px; padding: 34px 0; border-radius: 999px; text-align: center;
      background: linear-gradient(100deg, #d81b60, #e8590c); font-family: "Poppins", sans-serif; font-weight: 900; font-size: 92px; line-height: 1; color: #fff;
      box-shadow: 0 30px 80px rgba(255, 61, 127, 0.45);
    }}
    #replay-ic {{ display: inline-block; }}
    .g-in {{ position: absolute; left: 140px; right: 140px; top: 1720px; text-align: center; }}
    .gline {{ font-family: "Montserrat", sans-serif; font-weight: 900; font-size: 150px; line-height: 1.25; color: #ffffff; }}
    .gl {{ display: inline-block; text-shadow: 0 12px 40px rgba(0, 0, 0, 0.6); }}
    .gk {{
      display: inline-block; padding: 0 24px 20px; font-family: "Playfair Display", serif; font-style: italic; font-weight: 900; font-size: 250px; line-height: 1.05;
      background: linear-gradient(100deg, #fff1c9 0%, #ffd23f 25%, #ff9f43 50%, #ff3d7f 75%, #ffd23f 100%); background-size: 200% 100%;
      -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 16px 36px rgba(0, 0, 0, 0.55));
    }}
    .gsw {{ position: absolute; left: 50%; margin-left: -500px; bottom: -70px; }}
    .gstar {{ position: absolute; left: 50%; top: 50%; margin-left: -36px; margin-top: -36px; width: 72px; height: 72px; background: #ffd23f; clip-path: polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%); opacity: 0; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="2160" data-height="3840">
    <svg width="0" height="0" style="position: absolute"><defs><linearGradient id="gGrad" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#ffd23f" /><stop offset="55%" stop-color="#ff9f43" /><stop offset="100%" stop-color="#ff3d7f" /></linearGradient></defs></svg>
{chr(10).join(html)}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{chr(10).join(js)}
    window.__timelines["captions"] = tl;
  </script>
</template>
'''
open(f"{P}/compositions/captions.html", "w").write(cap)

F = FOLLOW
for (i, f, s, v) in [("fo-whoosh", "whoosh", F + 0.02, 0.35), ("fo-pop", "pop", F + 0.12, 0.5), ("fo-avatar", "pop2", F + 0.48, 0.45),
                     ("fo-click", "click", F + 1.85, 0.8), ("fo-ding", "ding", F + 1.91, 0.5), ("fo-toast", "pop", F + 2.05, 0.45), ("fo-exit", "whoosh", F + 3.25, 0.35)]:
    sfx.append((i, f, round(s, 3), v))
lens = {"whoosh": 0.28, "pop": 0.12, "pop2": 0.08, "ding": 0.69, "click": 0.1}
tracks = [[] for _ in range(5)]
aud = []
for (i, f, s, v) in sfx:
    for ti, tr in enumerate(tracks):
        if all(s >= e + 0.01 or s + lens[f] <= st - 0.01 for st, e in tr):
            tr.append((s, s + lens[f])); break
    aud.append(f'      <audio id="sfx-{i}" class="clip" src="assets/sfx/{f}.ogg" data-start="{s}" data-duration="{lens[f]}" data-track-index="{10+ti}" data-volume="{v}"></audio>')

rvid = "\n".join(
    f'''      <video id="rp{k}" class="clip rp" src="assets/footage.mp4" data-start="{round(ts,3)}" data-duration="{round(b-a,3)}" data-media-start="{a}" data-track-index="{2 + k%2}" data-has-audio="true" data-volume="1" playsinline></video>'''
    for k, (ts, a, b) in enumerate(rclips))
punches = ",\n        ".join(f"[{g['words'][0][1]}, 1.045]" for g in groups if g["kind"] == "sent")
sec_host = ""
streak_js = ""
if sections:
    last = max(s["end"] for s in sections)
    sec_host = (f'      <div id="sections" data-composition-id="sections" data-composition-src="compositions/sections.html" data-start="0" data-duration="{round(last + 0.1,3)}" data-track-index="7" data-track-kind="graphics" data-width="2160" data-height="3840" style="z-index: 6"></div>\n'
                + "\n".join(f'      <div id="streak{i}" class="clip streak" data-start="{round(s["start"]-0.15,3)}" data-duration="0.6" data-track-index="8" data-layout-ignore></div>' for i, s in enumerate(sections)))
    streak_js = "\n".join(f'      tl.fromTo("#streak{i}", {{ x: 0, rotation: 18, opacity: 0 }}, {{ x: 4200, rotation: 18, opacity: 1, duration: 0.55, ease: "power2.inOut" }}, {round(s["start"]-0.15,3)});' for i, s in enumerate(sections))
idx = f'''<!doctype html>
<html lang="en" data-resolution="portrait-4k">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=2160, height=3840" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 2160px; height: 3840px; overflow: hidden; background: #07090f; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; }}
      #cam, #punch {{ position: absolute; inset: 0; transform-origin: 50% 30%; }}
      #cam {{ z-index: 1; }}
      #footage, .rp {{ position: absolute; left: 0; top: 0; width: 2160px; height: 3840px; object-fit: cover; }}
      .streak {{
        position: absolute; left: -1600px; top: -600px; width: 1100px; height: 5040px; z-index: 9; opacity: 0; mix-blend-mode: screen;
        background: linear-gradient(90deg, rgba(255,210,63,0) 0%, rgba(255,159,67,0.55) 35%, rgba(255,255,255,0.85) 50%, rgba(255,61,127,0.55) 65%, rgba(255,61,127,0) 100%);
      }}
      #replay-shade {{ position: absolute; inset: 0; z-index: 2; box-shadow: inset 0 0 0 26px #ff3d7f; }}
      #shade {{
        position: absolute; inset: 0; z-index: 2;
        background: linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.6) 100%),
          radial-gradient(ellipse 75% 60% at 50% 38%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%);
      }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="2160" data-height="3840">
      <div id="cam">
        <div id="punch">
          <video id="footage" class="clip" src="assets/footage.mp4" data-start="0" data-duration="{FOOT}" data-track-index="0" data-has-audio="true" data-volume="1" playsinline></video>
{rvid}
        </div>
      </div>
      <div id="shade" class="clip" data-start="0" data-duration="{round(REND,3)}" data-track-index="1"></div>
      <div id="replay-shade" class="clip" data-start="{R0}" data-duration="{round(REND-R0,3)}" data-track-index="4"></div>
{sec_host}
      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="{round(REND,3)}" data-track-index="5" data-track-kind="captions" data-width="2160" data-height="3840" style="z-index: 7"></div>
      <div id="follow" data-composition-id="follow" data-composition-src="compositions/follow.html" data-start="{round(FOLLOW,3)}" data-duration="3.8" data-track-index="6" data-track-kind="graphics" data-width="2160" data-height="3840" style="z-index: 11"></div>
      <!-- Music bed at 20% (Mixkit #1168 "Coffee or Tea", Mixkit Stock Music Free License) -->
      <audio id="music" class="clip" src="assets/music.mp3" data-start="0" data-duration="{TOTAL}" data-track-index="9" data-volume="0.2"></audio>
      <!-- Sound effects (CC0) -->
{chr(10).join(aud)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
      tl.fromTo("#cam", {{ scale: 1.02 }}, {{ scale: 1.08, duration: {FOOT}, ease: "none" }}, 0);
      tl.to("#cam", {{ scale: 1.04, duration: 0.3, ease: "power2.out" }}, {FOOT});
      tl.set("#punch", {{ scale: 1 }}, 0);
      [
        {punches}
      ].forEach(([t, s]) => {{
        tl.to("#punch", {{ scale: s, duration: 0.2, ease: "back.out(2)" }}, t);
        tl.to("#punch", {{ scale: 1, duration: 0.7, ease: "power2.inOut" }}, t + 1.2);
      }});
{streak_js}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
'''
open(f"{P}/index.html", "w").write(idx)
print(json.dumps({"total": TOTAL, "replay_start": R0, "follow": round(FOLLOW, 3), "groups": len(groups), "replay_groups": len(rgroups)}))

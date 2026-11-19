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

def bubble_html(g):
    gid, kind = g["id"], g["kind"]
    cls = "recv" if kind in ("recv", "fast") else "sent"
    words = " ".join(
        f'<span id="{gid}-w{i}" class="bw{" bk" if w.strip(",.?!") in g.get("key", []) else ""}{" bx" if g.get("strike") else ""}">{w}</span>'
        for i, (w, _) in enumerate(g["words"]))
    tag = ""
    if g.get("label"):
        tag = f'<div id="{gid}-lab" class="blab {cls}">{g["label"]}</div>'
    dl = f'<div id="{gid}-dl" class="bd">Delivered</div>' if kind == "sent" else ""
    s = g.get("start", g["words"][0][1] - 0.15)
    return s, f'''    <div id="{gid}" class="clip bwrap" data-start="{round(s,3)}" data-duration="{round(g['end'] + 0.25 - s,3)}" data-track-index="{0 if cls=='sent' else 1}">
      {tag}
      <div id="{gid}-b" class="bub {cls}{' fast' if kind=='fast' else ''}">{words}</div>
      {dl}
    </div>'''

def bubble_js(g, s):
    gid, kind = g["id"], g["kind"]
    cls = "recv" if kind in ("recv", "fast") else "sent"
    origin = "100% 100%" if cls == "sent" else "0% 100%"
    end = g["end"] + 0.25
    out = [f'    tl.fromTo("#{gid}-b", {{ opacity: 0, scale: 0.25, y: 80, transformOrigin: "{origin}" }}, {{ opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.9)" }}, {round(s,3)});']
    if g.get("label"):
        out.append(f'    tl.fromTo("#{gid}-lab", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }}, {round(s,3)});')
    for i, (w, wt) in enumerate(g["words"]):
        key = w.strip(",.?!") in g.get("key", [])
        col = ', color: "#ffd23f"' if key else ""
        out.append(f'    tl.fromTo("#{gid}-w{i}", {{ opacity: 0.5, scale: 1 }}, {{ opacity: 1, scale: 1.1{col}, duration: 0.1, ease: "power2.out" }}, {round(wt,3)});')
        out.append(f'    tl.to("#{gid}-w{i}", {{ scale: 1, duration: 0.18, ease: "power2.inOut" }}, {round(wt+0.1,3)});')
    if g.get("strike"):
        out.append(f'    tl.fromTo("#{gid}-x", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.25, ease: "power3.out" }}, {round(g["end"]-0.2,3)});')
    if kind == "sent":
        out.append(f'    tl.fromTo("#{gid}-dl", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.1, ease: "power2.out" }}, {round(g["end"]-0.12,3)});')
    out.append(f'    tl.to("#{gid}-b", {{ opacity: 0, y: -140, scale: 0.92, duration: 0.18, ease: "power2.in" }}, {round(end-0.19,3)});')
    for sel in ([f"#{gid}-dl"] if kind == "sent" else []) + ([f"#{gid}-lab"] if g.get("label") else []):
        out.append(f'    tl.to("{sel}", {{ opacity: 0, duration: 0.15, ease: "power2.in" }}, {round(end-0.19,3)});')
    return out

html, js, sfx = [], [], []
for g in groups + rgroups:
    s, h = bubble_html(g)
    if g.get("strike"):
        h = h.replace(f'<div id="{g["id"]}-b" class="bub', f'<div id="{g["id"]}-b" data-layout-allow-overlap class="bub').replace(
            "</span></div>", f'</span><div id="{g["id"]}-x" class="bstrike" data-layout-allow-occlusion></div></div>', 1)
    html.append(h)
    js += bubble_js(g, s)
    sfx.append((g["id"], "pop" if g["kind"] != "recv" else "pop2", round(s - 0.02, 3), 0.55))

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
    .bwrap {{ position: absolute; left: 0; right: 0; top: 0; height: 3840px; overflow: visible; }}
    .bub {{
      position: absolute; top: 2150px; max-width: 1760px; padding: 46px 76px 54px;
      border-radius: 90px; font-family: "Inter", sans-serif; font-weight: 900; font-size: 136px;
      line-height: 1.18; letter-spacing: -2px; color: #ffffff; box-shadow: 0 40px 100px rgba(0, 0, 0, 0.45);
    }}
    .bub.sent {{ right: 200px; background: linear-gradient(180deg, #3a9bff 0%, #0a7aff 55%, #0062e0 100%); border-bottom-right-radius: 26px; }}
    .bub.recv {{ left: 200px; background: linear-gradient(180deg, #4a4a4f 0%, #3a3a3c 100%); border-bottom-left-radius: 26px; }}
    .bub.fast {{ top: 1900px; font-size: 96px; font-weight: 700; line-height: 1.22; letter-spacing: -1px; }}
    .bw {{ display: inline-block; }}
    .bk {{ color: #ffffff; }}
    .bstrike {{ position: absolute; left: 50px; right: 50px; top: 50%; height: 26px; margin-top: -13px; border-radius: 13px; background: #ff3b30; transform-origin: 0 50%; }}
    .blab {{ position: absolute; top: 1990px; font-family: "Inter", sans-serif; font-weight: 700; font-size: 60px; line-height: 1.2; color: rgba(255,255,255,0.9); text-shadow: 0 4px 18px rgba(0,0,0,0.6); }}
    .blab.sent {{ right: 230px; }}
    .blab.recv {{ left: 230px; }}
    .bub.fast + .bd, .blab.recv {{ }}
    .bd {{ position: absolute; right: 230px; top: 2640px; font-family: "Inter", sans-serif; font-weight: 700; font-size: 60px; line-height: 1.2; color: rgba(255,255,255,0.85); text-shadow: 0 4px 18px rgba(0,0,0,0.6); opacity: 0; }}
    #replay-tag {{ position: absolute; left: 0; right: 0; top: 0; height: 3840px; }}
    #replay-in {{
      position: absolute; left: 0; right: 0; top: 520px; margin: 0 auto; width: 1500px; padding: 34px 0; border-radius: 999px; text-align: center;
      background: linear-gradient(100deg, #ff3d7f, #ff9f43); font-family: "Inter", sans-serif; font-weight: 900; font-size: 92px; line-height: 1; color: #fff;
      box-shadow: 0 30px 80px rgba(255, 61, 127, 0.45);
    }}
    #replay-ic {{ display: inline-block; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="2160" data-height="3840">
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
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
'''
open(f"{P}/index.html", "w").write(idx)
print(json.dumps({"total": TOTAL, "replay_start": R0, "follow": round(FOLLOW, 3), "groups": len(groups), "replay_groups": len(rgroups)}))

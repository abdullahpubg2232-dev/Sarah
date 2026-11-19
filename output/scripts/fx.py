import numpy as np, cv2, subprocess, sys
src, audio, dst = sys.argv[1:4]
W,H=848,384; FPS=60000/1001
B=0.6425; drop=9.62; END=12.2
def grid(a,b,step):
    return [drop+k*step for k in range(int(np.floor((a-drop)/step))-1,int((b-drop)/step)+2) if a-1e-6<=drop+k*step<b-1e-6]
# (time, zoom amount, decay, shake px, flash, rgb split px, centre)
C0=(424,192)
events=[]
for t in grid(0.6,6.6,B): events.append((t,0.05,0.14,0,0,2,C0))                 # intro: light pulse
events.append((6.70,0.38,0.35,10,0.45,7,(425,70)))                                # FIRST KILL
for t in grid(7.05,9.62,B): events.append((t,0.09,0.14,3,0.08,4,(430,120)))        # build-up punches
for t in grid(8.98,9.62,B/4): events.append((t,0.035,0.06,2,0,2,(450,125)))        # clap-roll jitter
events.append((drop,0.55,0.5,16,0.6,9,(450,125)))                                # RAAL KILL DROP
for i,t in enumerate(grid(drop+B,END,B)):
    events.append((t,0.12 if i%2==0 else 0.08,0.15,5 if i%2==0 else 2,0.12 if i%2==0 else 0,5,(450,140)))
rng=np.random.default_rng(3)
def params(t):
    if t>=END: return 1,C0,(0,0),0,0,0
    z=1.0; sh=0; fl=0; rgb=0; cx,cy=C0; wsum=1e-6; ax=ay=0
    # slow tension zoom-in from 8.34 to the drop, then released by the drop punch
    if 8.34<=t<drop: r=(t-8.34)/(drop-8.34); z+=0.18*r*r; ax+=450*r*r; ay+=125*r*r; wsum+=r*r
    for (te,za,dec,shk,fla,rg,c) in events:
        dt=t-te
        if dt<0 or dt>2.0: continue
        a=min(1,dt/0.025)*np.exp(-dt/dec)            # instant punch in, ease out
        z+=za*a; sh+=shk*np.exp(-dt/(dec*0.8)); fl+=fla*np.exp(-dt/0.045); rgb+=rg*np.exp(-dt/0.08)
        ax+=c[0]*a; ay+=c[1]*a; wsum+=a
    w0=max(0,1-wsum); cx=(ax+C0[0]*w0)/(wsum+w0); cy=(ay+C0[1]*w0)/(wsum+w0)
    off=(rng.uniform(-1,1)*sh, rng.uniform(-1,1)*sh)
    return z,(cx,cy),off,min(fl,0.9),rgb,sh
dec=subprocess.Popen(['ffmpeg','-v','error','-i',src,'-f','rawvideo','-pix_fmt','bgr24','-'],stdout=subprocess.PIPE)
enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r','60000/1001','-i','-',
    '-i',audio,'-map','0:v','-map','1:a','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','copy','-shortest',dst],stdin=subprocess.PIPE)
i=0
while True:
    buf=dec.stdout.read(W*H*3)
    if len(buf)<W*H*3: break
    f=np.frombuffer(buf,np.uint8).reshape(H,W,3); t=i/FPS; i+=1
    z,(cx,cy),(ox,oy),fl,rgb,sh=params(t)
    if z>1.0005 or sh>0.3:
        z2=z+sh/200        # small extra zoom so shake never shows edges
        M=np.array([[z2,0,cx-z2*cx+ox],[0,z2,cy-z2*cy+oy]],np.float32)
        f=cv2.warpAffine(f,M,(W,H),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
    if rgb>0.7:
        d=int(round(rgb)); b,g,r=cv2.split(f)
        f=cv2.merge([np.roll(b,-d,1),g,np.roll(r,d,1)])
    if fl>0.01:
        f=cv2.addWeighted(f,1-fl,np.full_like(f,255),fl,0)
    enc.stdin.write(np.ascontiguousarray(f).tobytes())
enc.stdin.close(); enc.wait(); print('frames',i)

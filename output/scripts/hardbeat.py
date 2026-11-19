import numpy as np, sys, wave
sr=44100; dur=13.1; N=int(sr*dur)
L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def add(t0,s,g=1.0,pan=0.0):
    i=int(t0*sr); n=min(len(s),N-i)
    if n<=0: return
    L[i:i+n]+=g*s[:n]*(1-max(pan,0)); R[i:i+n]+=g*s[:n]*(1+min(pan,0))
def tt(l): return np.arange(int(sr*l))/sr
def lp(x,k): return np.convolve(x,np.ones(k)/k,'same')
def kick(hard=1.0):
    t=tt(0.35); f=45+150*np.exp(-t/0.025)
    s=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-t/0.12)
    s+=rng.standard_normal(len(t))*np.exp(-t/0.002)*0.4
    return np.tanh(s*3*hard)/np.tanh(3*hard)
def e808(length=0.9,f=41,slide=0.0):
    t=tt(length); fr=f*(1+1.5*np.exp(-t/0.02))*(1-slide*t/length)
    s=np.sin(2*np.pi*np.cumsum(fr)/sr)*np.exp(-t/(length*0.45))*(1-np.exp(-t/0.002))
    return np.tanh(s*2.5)/np.tanh(2.5)
def clap():
    t=tt(0.25); nz=rng.standard_normal(len(t)); nz=nz-lp(nz,6)
    env=sum(np.exp(-np.clip(t-d,0,None)/0.008)*(t>=d) for d in (0,0.011,0.022))*0.5+np.exp(-t/0.07)*(t>=0.022)
    s=nz*env+0.4*np.sin(2*np.pi*190*t)*np.exp(-t/0.05)
    return s/np.abs(s).max()
def hat(open_=False):
    t=tt(0.2 if open_ else 0.05); nz=rng.standard_normal(len(t)); nz=nz-lp(nz,3)
    return nz*np.exp(-t/(0.06 if open_ else 0.012))*0.6
def riser(length):
    t=tt(length); nz=rng.standard_normal(len(t)); out=np.zeros_like(nz)
    for a in range(0,len(t),2048):
        w=max(2,int(40*(1-a/len(t))**2)+2); seg=nz[a:a+2048]; out[a:a+2048]=seg-lp(seg,w)
    return out*(t/length)**2*0.9
def impact():
    t=tt(2.0); nz=rng.standard_normal(len(t))
    return (nz-lp(nz,4))*np.exp(-t/0.45)*0.5+lp(nz,60)*np.exp(-t/0.12)*3
B=0.6425; drop=9.62
def grid(a,b,step):
    return [drop+k*step for k in range(int(np.floor((a-drop)/step))-1,int((b-drop)/step)+2) if a-1e-6<=drop+k*step<b-1e-6]
# INTRO 0.6-6.6: light groove
for i,t in enumerate(grid(0.6,6.6,B)):
    add(t,kick(1.0),0.8)
    if i%2==1: add(t,clap(),0.5,pan=0.1)
for t in grid(0.6,6.6,B/2): add(t,hat(),0.35,pan=-0.3)
# FIRST KILL 6.70
add(6.70,kick(1.3),1.0); add(6.70,e808(1.0,41,0.3),0.9); add(6.70,impact(),0.55)
# BUILD 7.05-9.62
for i,t in enumerate(grid(7.05,drop,B)):
    add(t,kick(1.2),0.9); add(t,e808(0.55,44),0.6)
    if i%2==1: add(t,clap(),0.55,pan=0.1)
for t in grid(7.05,8.98,B/2): add(t,hat(),0.32,pan=-0.3)
roll=grid(8.98,drop,B/4)
for j,t in enumerate(roll): add(t,clap(),0.25+0.35*j/len(roll),pan=0.15)
add(8.34,riser(drop-8.34),0.55)
# DROP 9.62: RAAL eats everyone
add(drop,kick(1.6),1.0); add(drop,e808(1.6,38,0.35),1.0); add(drop,impact(),0.85)
# POST-DROP
for i,t in enumerate(grid(drop+B,12.2,B)):
    add(t,kick(1.3),0.9); add(t,e808(0.6,41 if i%2==0 else 49),0.7)
    if i%2==0: add(t,clap(),0.6,pan=0.1)
for i,t in enumerate(grid(drop,12.2,B/2)): add(t,hat(i%4==2),0.3,pan=-0.3)
for t in grid(drop,12.2,B/4)[-4:]: add(t,hat(),0.3,pan=0.3)
end=int(12.2*sr); fade=int(0.03*sr)
for ch in (L,R): ch[end-fade:end]*=np.linspace(1,0,fade); ch[end:]=0
st=np.stack([L,R],1); st=st/np.abs(st).max()*0.95
print('grid build:',[round(x,2) for x in grid(7.05,drop,B)])
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((st*32767).astype('<i2').tobytes()); w.close()

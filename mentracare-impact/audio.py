# Builds impact-audio.wav from sfx.json: slam -> thuds + tension drone -> silence/heartbeat -> riser -> boom -> uplifting music.
import json, wave, numpy as np
sr=44100; D=33; N=int(sr*D); t=np.arange(N)/sr
dry=np.zeros(N); wet=np.zeros(N)   # wet goes through reverb
rng=np.random.default_rng(3)
f=lambda n:440*2**((n-69)/12)
def put(buf,st,s,v=1):
    a=int(st*sr); L=min(len(s),N-a)
    if L>0 and a>=0: buf[a:a+L]+=v*s[:L]
def env_t(d): return np.arange(int(d*sr))/sr
def boom(d=1.6,f0=70,f1=32):
    tt=env_t(d); ph=2*np.pi*np.cumsum(f1+(f0-f1)*np.exp(-tt*6))/sr
    return np.sin(ph)*np.exp(-tt*2.2)
def noise(d,dec,smooth=1):
    n=rng.standard_normal(int(d*sr))
    if smooth>1: n=np.convolve(n,np.ones(smooth)/smooth,'same')
    return n*np.exp(-env_t(d)*dec)
def lp(x,k): return np.convolve(x,np.ones(k)/k,'same')
def pnote(st,n,d=2.5,v=.2,buf=None):
    tt=env_t(d); s=sum(np.sin(2*np.pi*f(n)*h*tt)*(.5**(h-1)) for h in (1,2,3))*np.exp(-tt*3/d)*np.minimum(1,tt/.005)
    put(wet if buf is None else buf,st,s,v)
ev=json.load(open('sfx.json')); BOOM=[e for e in ev if e[0]=='slam'][1][1]
# tension drone 0.3 -> 10.6 (cut hard)
m=(t>.3)&(t<10.6); tt=t[m]; g=np.clip((tt-.3)/10,0,1)**1.5
dr=(np.sin(2*np.pi*55*tt)+.7*np.sin(2*np.pi*58.3*tt)+.4*np.sin(2*np.pi*110.5*tt))*(.06+.22*g)
nz=lp(rng.standard_normal(m.sum()),40)*(.05+.5*g)*.6
dry[m]+=dr+nz
# hard cut fade 10ms
for e in ev:
    k,st=e[0],e[1]
    if k=='slam':
        sc=e[2] if len(e)>2 else 1
        put(dry,st,boom(2.2,80,30),.9*sc); put(dry,st,noise(.5,9,3),.35*sc); put(wet,st,noise(1.2,4,8),.25*sc)
    elif k=='thud':
        i=e[2]; v=.45+.04*i
        put(dry,st,boom(.7,90-i*2,38),v); put(dry,st,noise(.12,40,2),.25); put(wet,st,noise(.4,10,6),.12)
    elif k=='heart':
        if st<1: continue
        for o,v in ((0,.22),(.2,.15)): put(dry,st+o,boom(.35,60,40),v)
    elif k=='hit':
        loud=len(e)>2
        put(dry,st,boom(.5,110,50),.35+.15*loud); put(wet,st,noise(.25,25,2),.12)
# faint tinnitus tone in the silence
m=(t>10.7)&(t<15.8); tt=t[m]-10.7; dry[m]+=.012*np.sin(2*np.pi*1760*tt)*np.minimum(1,tt/1)
# riser 15.8 -> BOOM
m=(t>15.8)&(t<BOOM); tt=(t[m]-15.8)/(BOOM-15.8)
dry[m]+=(lp(rng.standard_normal(m.sum()),int(30-25*0)) *.0+ rng.standard_normal(m.sum())*.08*tt**2)
dry[m]+=np.sin(2*np.pi*np.cumsum(150+650*tt**2)/sr)*.18*tt**2
# bloom chord + uplifting progression
for n in (48,55,60,64,67,72,76): pnote(BOOM,n,5,.12)
prog=[[48,55,64,67],[43,55,62,67],[45,57,64,69],[41,53,60,65]]
beat=.6; st=BOOM+1.2; i=0
while st<D-2.5:
    ch=prog[i%4]
    for n in ch: pnote(st,n,2.6,.07)
    pnote(st,ch[0]-12,2.6,.16)
    for j,n in enumerate([ch[2]+12,ch[3]+12,ch[1]+12,ch[3]+12]): pnote(st+beat*j,n,1.2,.07)
    for j in range(4): put(dry,st+beat*j,boom(.25,90,45),.22)   # soft kick
    st+=4*beat; i+=1
for n in (48,55,60,64,72): pnote(st,n,4,.12)   # resolve
# reverb on wet bus
ir=rng.standard_normal(int(1.6*sr))*np.exp(-env_t(1.6)*3.5); ir=lp(ir,6); ir/=np.abs(ir).sum()**.5*6
L=1<<int(np.ceil(np.log2(N+len(ir))))
rev=np.fft.irfft(np.fft.rfft(wet,L)*np.fft.rfft(ir,L),L)[:N]
out=dry+wet+rev*.8
out*=np.minimum(1,(D-t)/1.5)
out=np.tanh(out*1.3)/1.3; out=out/np.abs(out).max()*.9
w=wave.open('impact-audio.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((out*32767).astype('<i2').tobytes()); w.close()

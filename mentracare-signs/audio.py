# Builds signs-audio.wav: light lo-fi beat (96 bpm) + pops and whooshes from sfx.json.
import json, wave, numpy as np
cfg=json.load(open('sfx.json')); sr=44100; D=cfg['dur']; N=int(sr*D); t=np.arange(N)/sr
out=np.zeros(N); rng=np.random.default_rng(5)
f=lambda n:440*2**((n-69)/12)
def put(st,s,v):
    a=int(st*sr); L=min(len(s),N-a)
    if L>0: out[a:a+L]+=v*s[:L]
T=lambda d:np.arange(int(d*sr))/sr
def ep(n,d,v):   # electric-piano-ish note
    tt=T(d); s=(np.sin(2*np.pi*f(n)*tt+.8*np.sin(2*np.pi*f(n)*tt))*np.exp(-tt*2.5)); return s*v
kick=lambda:np.sin(2*np.pi*np.cumsum(45+90*np.exp(-T(.3)*30))/sr)*np.exp(-T(.3)*12)
def hat(): n=rng.standard_normal(int(.05*sr)); n=n-np.convolve(n,np.ones(8)/8,'same'); return n*np.exp(-T(.05)*90)
def snare(): n=rng.standard_normal(int(.2*sr)); n=np.convolve(n,np.ones(3)/3,'same'); return n*np.exp(-T(.2)*22)+.4*np.sin(2*np.pi*190*T(.2))*np.exp(-T(.2)*25)
# intro pad under the hook
for n in (60,64,67,71): put(0,ep(n,4.5,.06),1)
b=cfg['beats']; bt=60/b['bpm']; prog=[[57,60,64,67],[53,57,60,64],[48,52,55,59],[55,59,62,65]]
k=0; st=b['start']
while st<b['end']:
    bar=k//4; ch=prog[bar%4]; j=k%4
    if j==0:
        for n in ch: put(st,ep(n,4*bt,.05),1)
        put(st,ep(ch[0]-12,4*bt,.12),1)
    put(st,kick(),.42 if j in (0,2) else 0); put(st,snare(),.14 if j in (1,3) else 0)
    put(st,hat(),.06); put(st+bt/2,hat(),.045)
    if j in (1,3): put(st+bt/2,ep(ch[(k//2)%4]+12,.6,.05),1)
    st+=bt; k+=1
put(st,ep(60,3,.08),1); put(st,ep(64,3,.06),1); put(st,ep(67,3,.06),1); put(st,ep(48,3,.12),1)
for kind,s0 in cfg['sfx']:
    if kind=='pop': put(s0,np.sin(2*np.pi*np.cumsum(500+700*np.exp(-T(.12)*40))/sr)*np.exp(-T(.12)*30),.16)
    else:
        L=int(.45*sr); n=rng.standard_normal(L); e=np.sin(np.linspace(0,np.pi,L))**2
        n=np.convolve(n,np.ones(6)/6,'same'); put(s0-.3,n*e,.07)
out*=np.minimum(1,t/.05)*np.minimum(1,(D-t)/1.5)
out=np.tanh(out*1.2)/1.2; out=out/np.abs(out).max()*.9
w=wave.open('signs-audio.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((out*32767).astype('<i2').tobytes()); w.close()

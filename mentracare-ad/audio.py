# Builds ad-audio.wav: sparse minor piano (night) -> warm major pad (from the 18.8s turn), plus SFX from sfx.json.
import json, wave, numpy as np
sr=44100; D=42; N=int(sr*D); t=np.arange(N)/sr; out=np.zeros(N)
f=lambda n:440*2**((n-69)/12)
rng=np.random.default_rng(7)
def note(st,n,dur=3.0,vol=.3,bright=1.0):
    a=int(st*sr); L=min(int(dur*sr),N-a); 
    if L<=0: return
    tt=np.arange(L)/sr; env=np.exp(-tt*2.6/dur*2)*np.minimum(1,tt/.008)
    s=sum(np.sin(2*np.pi*f(n)*h*tt)*(bright**(h-1))/h**1.6 for h in (1,2,3,4))
    out[a:a+L]+=vol*env*s
def pad(a,b,ch,vol=.08):
    m=(t>=a-1.5)&(t<b+1.5); tt=t[m]; env=np.clip(np.minimum(tt-(a-1.5),(b+1.5)-tt)/1.5,0,1)
    out[m]+=vol*env*sum(np.sin(2*np.pi*f(n)*tt+i)*(1+.25*np.sin(2*np.pi*.2*tt+i)) for i,n in enumerate(ch))
# night: Am - F - C - E (sparse arpeggios, 0..18.8)
prog1=[[57,60,64],[53,57,60],[48,52,55],[52,56,59]]
for i in range(8):
    ch=prog1[i%4]; st=.2+i*2.3
    note(st,ch[0]-12,4,.32,.5)
    for j,n in enumerate([ch[0],ch[1],ch[2],ch[1]]): note(st+.55*j+.3,n+12,2.4,.13,.45)
pad(0,18.6,[45,52],.05)
# turn & hope: C - G - Am - F at faster rhythm, brighter
prog2=[[48,55,60,64],[43,55,59,62],[45,57,60,64],[41,53,57,60]]
for i in range(10):
    ch=prog2[i%4]; st=18.9+i*2.3
    pad(st,st+2.3,ch,.045)
    note(st,ch[0]-12+12,3,.28,.6)
    for j,n in enumerate([ch[1],ch[2],ch[3],ch[2],ch[3]+5 if j==4 else ch[3]]): pass
    for j,n in enumerate([ch[1]+12,ch[2]+12,ch[3]+12,ch[2]+12]): note(st+.46*j+.23,n,2,.11,.55)
note(18.85,84,4,.18,.4); note(18.85,79,4,.12,.4)   # shimmer at the turn
# master envelope + gentle limiter
out*=np.minimum(1,t/.4)*np.minimum(1,(D-t)/2.5)
out=np.tanh(out*1.4)/1.4
# SFX
def add(st,s,vol):
    a=int(st*sr); L=min(len(s),N-a); out[a:a+L]+=vol*s[:L]
def key():
    L=int(.03*sr); n=rng.standard_normal(L); n=np.convolve(n,np.ones(4)/4,'same')-np.convolve(n,np.ones(30)/30,'same')
    return n*np.exp(-np.arange(L)/sr*180)
def tone(fr,dur,dec,sweep=0):
    tt=np.arange(int(dur*sr))/sr; return np.sin(2*np.pi*(fr*tt+sweep*tt*tt/2))*np.exp(-tt*dec)
for kind,st in json.load(open('sfx.json')):
    if kind=='key': add(st,key(),.10*rng.uniform(.7,1.1))
    elif kind=='send': add(st,tone(600,.18,25,2500),.18)
    elif kind=='ping': add(st,tone(1318,.5,9),.10); add(st+.09,tone(1760,.6,8),.09)
    elif kind=='tap': add(st,tone(900,.08,60),.12)
out=out/np.abs(out).max()*.89
w=wave.open('ad-audio.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((out*32767).astype('<i2').tobytes()); w.close()

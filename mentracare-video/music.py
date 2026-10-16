# Generates music.wav: a soft 38s ambient pad (Fmaj7-C-Am-Dm-F) with gentle bell notes.
import numpy as np, wave
sr=44100; D=38; t=np.arange(int(sr*D))/sr
f=lambda n:440*2**((n-69)/12)
chords=[[53,57,60,64],[48,55,60,64],[45,52,57,60],[50,57,60,65],[53,57,60,64]]
seg=D/len(chords); out=np.zeros_like(t)
for i,ch in enumerate(chords):
    c=i*seg; env=np.clip(1-np.abs(t-(c+seg/2))/(seg/2+1.5),0,1)**1.2
    for j,n in enumerate(ch):
        out+=env*np.sin(2*np.pi*f(n)*t+j)*(1+.3*np.sin(2*np.pi*.15*t+j))/(1+j*.4)
        out+=env*.25*np.sin(2*np.pi*f(n)*2.003*t)/(1+j)
for k,b in enumerate(np.arange(1,D-2,2.4)):
    n=[72,76,79,77,74][k%5]; m=t>=b; tt=t[m]-b
    out[m]+=.5*np.sin(2*np.pi*f(n)*tt)*np.exp(-tt*2.2)
out*=np.minimum(1,t/2)*np.minimum(1,(D-t)/3)
out=out/np.abs(out).max()*.32
w=wave.open('music.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((out*32767).astype('<i2').tobytes()); w.close()

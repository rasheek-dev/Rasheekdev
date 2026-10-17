// Protagonist: seated woman in profile (facing right), backlit with a lavender rim light.
// All parts are SVG paths in a local space where (0,0) is the base of the neck.
// pose = {headTilt, breathe, phoneUp, blink, relax, lookUp, phoneGlow}
const CHAR_DEFS = `
<linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B98470"/><stop offset="1" stop-color="#7E5248"/></linearGradient>
<linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2B2440"/><stop offset=".6" stop-color="#17131F"/><stop offset="1" stop-color="#241D36"/></linearGradient>
<linearGradient id="knit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A4270"/><stop offset=".55" stop-color="#2F2A48"/><stop offset="1" stop-color="#211D33"/></linearGradient>
<linearGradient id="pants" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2A2638"/><stop offset="1" stop-color="#3A3550"/></linearGradient>
<radialGradient id="phoneLight" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#CFC8FF" stop-opacity=".75"/><stop offset="1" stop-color="#CFC8FF" stop-opacity="0"/></radialGradient>
<clipPath id="headclip"><path d="M-40,-20 C-80,-60 -104,-100 -102,-150 C-100,-210 -50,-252 20,-254 C70,-256 106,-228 116,-180 C120,-160 122,-140 124,-128 C125,-120 120,-114 122,-106 C128,-92 142,-78 150,-66 C153,-60 148,-56 138,-56 C136,-52 136,-50 136,-47 C142,-44 142,-38 136,-35 C141,-31 140,-26 132,-22 C134,-14 134,-4 124,4 C108,14 80,16 56,8 C30,0 0,-4 -40,-20 Z"/></clipPath>
<clipPath id="backclip"><rect x="-220" y="-300" width="250" height="420"/></clipPath>
<radialGradient id="warmLight" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE3C8" stop-opacity=".8"/><stop offset="1" stop-color="#FFE3C8" stop-opacity="0"/></radialGradient>
<filter id="rim" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
`;

// head (face profile + skull) relative to neck pivot (0,0); face looks right
const HEAD = "M-40,-20 C-80,-60 -104,-100 -102,-150 C-100,-210 -50,-252 20,-254 C70,-256 106,-228 116,-180 C120,-160 122,-140 124,-128 C125,-120 120,-114 122,-106 C128,-92 142,-78 150,-66 C153,-60 148,-56 138,-56 C136,-52 136,-50 136,-47 C142,-44 142,-38 136,-35 C141,-31 140,-26 132,-22 C134,-14 134,-4 124,4 C108,14 80,16 56,8 C30,0 0,-4 -40,-20 Z";
const HAIR = "M-106,-150 C-108,-214 -54,-262 22,-262 C82,-262 118,-230 120,-190 C104,-206 80,-212 60,-196 C44,-182 30,-160 14,-140 C4,-124 -2,-96 -20,-70 C-38,-48 -56,-36 -66,-44 C-92,-70 -106,-104 -106,-150 Z";
const BUN = "M-112,-196 C-150,-204 -168,-160 -150,-132 C-134,-110 -102,-118 -96,-146 C-92,-170 -96,-192 -112,-196 Z";
const EAR = "M-4,-126 C-22,-128 -28,-100 -14,-88 C-4,-80 8,-92 8,-108 C8,-120 4,-126 -4,-126 Z";
const NECK = "M-40,-40 C-36,0 -42,40 -54,70 L60,70 C48,44 44,18 52,-8 Z";
// torso, seated, slight slouch controlled by relax
const TORSO = (s)=>`M-70,40 C-130,70 -150,${170+s} -146,${300+s} C-142,${400+s} -120,${470} -90,520 L170,520 C180,460 172,${380+s*.5} 150,${300+s*.5} C134,${220+s*.4} 108,${120} 70,52 C30,30 -30,30 -70,40 Z`;
const THIGH = "M-110,470 C-60,440 120,430 330,452 C372,458 386,500 374,532 C360,566 320,574 280,572 L-80,580 C-130,580 -150,500 -110,470 Z";
const SHIN = "M290,470 C330,470 368,490 372,540 L392,840 C394,870 360,880 340,872 L300,560 Z";
const FOOT = "M330,846 C350,836 400,840 452,858 C470,866 466,884 446,886 L336,886 C318,886 316,856 330,846 Z";

function charSVG(){
  return `
  <g id="ch">
    <ellipse cx="120" cy="900" rx="330" ry="34" fill="#000" opacity=".22" filter="url(#soft)"/>
    <path d="${SHIN}" fill="url(#pants)"/><path d="${FOOT}" fill="#E9E4F6" opacity=".9"/>
    <path id="ch-torso" fill="url(#knit)"/>
    <path id="ch-torso-rim" fill="none" stroke="#CFC6FF" stroke-width="5" opacity=".55" filter="url(#rim)"/>
    <path d="${THIGH}" fill="url(#pants)"/>
    <g id="ch-headg">
      <path d="${NECK}" fill="url(#skin)"/>
      <path d="${HEAD}" fill="url(#skin)"/>
      <path d="${HEAD}" fill="none" stroke="#E7DEFF" stroke-width="6" opacity=".55" filter="url(#rim)" clip-path="url(#backclip)"/>
      <path d="${EAR}" fill="#8A5A4E"/>
      <path d="${BUN}" fill="url(#hair)"/>
      <path d="${HAIR}" fill="url(#hair)"/>
      <path d="M-96,-150 C-90,-210 -40,-252 20,-254" fill="none" stroke="#9C8CFF" stroke-width="4" opacity=".5" filter="url(#rim)"/>
      <g id="ch-eye"><path d="M90,-120 C96,-125 106,-125 112,-120 C106,-115 96,-115 90,-120 Z" fill="#1A1424"/>
        <path id="ch-lid" d="M88,-123 C96,-130 108,-130 114,-122" fill="none" stroke="#3A2630" stroke-width="3" stroke-linecap="round"/><path d="M112,-122 L118,-127" stroke="#3A2630" stroke-width="2.5" stroke-linecap="round"/></g>
      <path d="M86,-140 C98,-147 110,-146 120,-138" fill="none" stroke="#2A1F2C" stroke-width="4" stroke-linecap="round" opacity=".8"/>
      <path id="ch-mouth" d="M126,-34 C130,-33 133,-34 136,-35" fill="none" stroke="#5A3438" stroke-width="3" stroke-linecap="round"/>
      <ellipse id="ch-facelight" cx="150" cy="-40" rx="110" ry="120" fill="url(#phoneLight)" opacity="0" clip-path="url(#headclip)"/>
      <ellipse id="ch-warm" cx="170" cy="-110" rx="120" ry="170" fill="url(#warmLight)" opacity="0" clip-path="url(#headclip)"/>
    </g>
    <g id="ch-arm">
      <path id="ch-upper" fill="url(#knit)"/>
      <path id="ch-fore" fill="url(#knit)"/>
      <path id="ch-hand" fill="url(#skin)"/>
      <g id="ch-phone"><rect x="-16" y="-44" width="32" height="64" rx="7" fill="#1A1726"/><rect id="ch-screen" x="-12" y="-40" width="24" height="56" rx="5" fill="#BDB4FF"/></g>
    </g>
  </g>`;
}

const lerp=(a,b,u)=>a+(b-a)*u;
// arm kinematics: shoulder -> elbow -> hand; phoneUp 1 = phone near face, 0 = resting on lap
function poseChar(root,p){
  const q=s=>root.querySelector(s);
  const s=-p.relax*14+p.breathe*6;
  q('#ch-torso').setAttribute('d',TORSO(s));
  q('#ch-torso-rim').setAttribute('d',`M-70,40 C-130,70 -150,${170+s} -146,${300+s}`);
  const hy=-p.breathe*6+p.relax*6;
  const tilt=p.headTilt*20-p.lookUp*9;
  q('#ch-headg').setAttribute('transform',`translate(${p.relax*-4},${hy}) rotate(${tilt} 0 -10)`);
  q('#ch-eye').setAttribute('transform',`translate(97 -118) scale(1 ${Math.max(.08,1-p.blink)}) translate(-97 118)`);
  q('#ch-lid').setAttribute('opacity',p.blink>.5?1:.8);
  q('#ch-facelight').setAttribute('opacity',p.phoneGlow*.9); q('#ch-warm').setAttribute('opacity',p.warm||0);
  // shoulder at (40,90); elbow & hand positions
  const S=[40,90+hy*.5]; let E=[lerp(90,70,p.phoneUp),lerp(330,300,p.phoneUp)], H=[lerp(250,190,p.phoneUp),lerp(420,170,p.phoneUp)];
  const rc=p.reach||0; if(rc>0){E=[lerp(E[0],150,rc),lerp(E[1],210,rc)];H=[lerp(H[0],250,rc),lerp(H[1],-10,rc)]}
  const limb=(a,b,w1,w2)=>{const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L;
    return `M${a[0]+nx*w1},${a[1]+ny*w1} L${b[0]+nx*w2},${b[1]+ny*w2} A${w2},${w2} 0 0 1 ${b[0]-nx*w2},${b[1]-ny*w2} L${a[0]-nx*w1},${a[1]-ny*w1} A${w1},${w1} 0 0 1 ${a[0]+nx*w1},${a[1]+ny*w1} Z`};
  q('#ch-upper').setAttribute('d',limb(S,E,46,36));
  q('#ch-fore').setAttribute('d',limb(E,H,36,26));
  q('#ch-hand').setAttribute('d',`M${H[0]-24},${H[1]-14} C${H[0]-10},${H[1]-34} ${H[0]+30},${H[1]-30} ${H[0]+34},${H[1]-8} C${H[0]+36},${H[1]+14} ${H[0]+8},${H[1]+26} ${H[0]-16},${H[1]+16} Z`);
  const ang=lerp(70,-20,p.phoneUp)+(p.reach||0)*-40;
  q('#ch-phone').setAttribute('transform',`translate(${H[0]+18},${H[1]-6}) rotate(${ang})`);
  q('#ch-phone').setAttribute('opacity',p.phone??1);
  q('#ch-screen').setAttribute('opacity',.3+p.phoneGlow*.7);
}

window.Char={CHAR_DEFS,charSVG,poseChar};

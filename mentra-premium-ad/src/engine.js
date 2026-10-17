// Mentra premium ad — deterministic scene engine.
// render(t) draws the exact frame for time t (seconds) of the active cut ('main' | 'short').
(function(){
const C=window.MENTRA, CH=window.Char;
const $=id=>document.getElementById(id);
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,u)=>a+(b-a)*u;
const sm=x=>{x=cl(x);return x*x*(3-2*x)};                 // smoothstep
const eio=x=>{x=cl(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const eo=x=>1-Math.pow(1-cl(x),3);
const ramp=(t,a,b)=>sm((t-a)/(b-a));                        // 0 before a, 1 after b
const win=(t,a,b,fi=.5,fo=.5)=>Math.min(ramp(t,a,a+fi),1-ramp(t,b-fo,b));
const bump=(t,c,w)=>Math.max(0,1-Math.abs(t-c)/w);           // triangle bump
const seg=(t,keys)=>{ // piecewise eased keyframes [[time,value],...]
  if(t<=keys[0][0])return keys[0][1];
  for(let i=1;i<keys.length;i++){const [t1,v1]=keys[i],[t0,v0]=keys[i-1]; if(t<=t1)return lerp(v0,v1,eio((t-t0)/(t1-t0)))}
  return keys[keys.length-1][1];
};
const NS='http://www.w3.org/2000/svg';
const N_TH=9;

// ---------------------------------------------------------------- art
const DEFS=`
${CH.CHAR_DEFS}
<linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26223A"/><stop offset=".55" stop-color="#363052"/><stop offset="1" stop-color="#211D33"/></linearGradient>
<radialGradient id="litG" cx=".78" cy=".3" r=".75"><stop offset="0" stop-color="#C9BEFF" stop-opacity=".55"/><stop offset=".5" stop-color="#8F84E6" stop-opacity=".22"/><stop offset="1" stop-color="#5749E2" stop-opacity="0"/></radialGradient>
<linearGradient id="winG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B52A0"/><stop offset="1" stop-color="#9C90D8"/></linearGradient>
<linearGradient id="winWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4EA"/><stop offset=".6" stop-color="#FFE2CC"/><stop offset="1" stop-color="#E9DFFF"/></linearGradient>
<linearGradient id="beamG" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFEBD9" stop-opacity=".55"/><stop offset=".7" stop-color="#E4DCFF" stop-opacity=".12"/><stop offset="1" stop-color="#E4DCFF" stop-opacity="0"/></linearGradient>
<linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2540"/><stop offset="1" stop-color="#15121F"/></linearGradient>
<linearGradient id="sofaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A5480"/><stop offset="1" stop-color="#3B3658"/></linearGradient>
<radialGradient id="lampG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD9B3" stop-opacity=".75"/><stop offset="1" stop-color="#FFD9B3" stop-opacity="0"/></radialGradient>
<radialGradient id="vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05040A" stop-opacity=".55"/></radialGradient>
<linearGradient id="sessWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEEAFF"/><stop offset="1" stop-color="#D7D0FA"/></linearGradient>
<linearGradient id="deskG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CBC3F0"/><stop offset="1" stop-color="#A99FDC"/></linearGradient>
<radialGradient id="tealG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#2CE8B6" stop-opacity=".55"/><stop offset="1" stop-color="#2CE8B6" stop-opacity="0"/></radialGradient>
<radialGradient id="whiteG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<linearGradient id="callBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6EBE2"/><stop offset="1" stop-color="#E5DDF6"/></linearGradient>
<linearGradient id="pskin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D2A188"/><stop offset="1" stop-color="#B07F69"/></linearGradient>
<linearGradient id="cardi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3E4F63"/><stop offset="1" stop-color="#2B3646"/></linearGradient>
<radialGradient id="otsHair" cx=".7" cy=".3" r=".8"><stop offset="0" stop-color="#3A3152"/><stop offset=".6" stop-color="#1D1829"/><stop offset="1" stop-color="#14111D"/></radialGradient>
<linearGradient id="lidShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0A12" stop-opacity="0"/><stop offset="1" stop-color="#0B0A12" stop-opacity=".9"/></linearGradient>
<filter id="b2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="b5" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="b12" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<filter id="b60" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="60"/></filter>
<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<clipPath id="screenClip"><rect x="268" y="658" width="664" height="424" rx="10"/></clipPath>
`;

const ROOM=`
<g id="L-far" filter="url(#b5)">
  <rect x="-700" y="-500" width="2600" height="3200" fill="url(#wallG)"/>
  <rect x="-700" y="1620" width="2600" height="1200" fill="url(#floorG)"/>
  <rect id="r-wallLit" x="-700" y="-500" width="2600" height="3200" fill="url(#litG)" opacity="0"/>
  <g id="r-window">
    <rect x="820" y="250" width="480" height="1040" rx="26" fill="url(#winG)"/>
    <rect id="r-winWarm" x="820" y="250" width="480" height="1040" rx="26" fill="url(#winWarm)" opacity="0"/>
    <path d="M1060,250 V1290 M820,760 H1300" stroke="#2A2540" stroke-width="16" opacity=".55"/>
    <rect x="790" y="210" width="110" height="1120" fill="#EDE8FF" opacity=".10"/>
    <rect x="800" y="210" width="34" height="1120" fill="#EDE8FF" opacity=".08"/>
  </g>
  <g opacity=".85">
    <rect x="-40" y="560" width="300" height="14" rx="7" fill="#433D63"/>
    <rect x="20" y="470" width="34" height="90" rx="6" fill="#5A5288"/><rect x="60" y="490" width="26" height="70" rx="6" fill="#6E64A8"/><rect x="92" y="480" width="30" height="80" rx="6" fill="#4C4578"/>
    <path d="M190,560 C180,520 188,480 214,470 C240,480 246,520 236,560 Z" fill="#5E7F86" opacity=".8"/>
  </g>
  <g id="r-lamp"><ellipse cx="80" cy="980" rx="260" ry="260" fill="url(#lampG)" opacity=".55"/>
    <path d="M30,900 L130,900 L112,980 L48,980 Z" fill="#E8D6C6" opacity=".9"/><rect x="77" y="980" width="6" height="660" fill="#3A3452"/><ellipse cx="80" cy="1640" rx="60" ry="10" fill="#2A2540"/></g>
</g>
<polygon id="r-beam" points="830,280 1120,300 560,1640 40,1600" fill="url(#beamG)" filter="url(#b30)" opacity=".3"/>
<g id="L-mid">
  <rect x="150" y="1040" width="700" height="400" rx="70" fill="url(#sofaG)"/>
  <rect x="150" y="1040" width="700" height="400" rx="70" fill="none" stroke="#9D92E6" stroke-opacity=".25" stroke-width="3"/>
  <rect x="120" y="1330" width="760" height="180" rx="46" fill="#4F4A70"/>
  <rect x="96" y="1170" width="130" height="350" rx="56" fill="#56507A"/>
  <rect x="120" y="1500" width="30" height="80" rx="10" fill="#1E1A2C"/><rect x="840" y="1500" width="30" height="80" rx="10" fill="#1E1A2C"/>
</g>
<g id="L-char"><g id="charHost" transform="translate(430 900)"></g>
  <g id="r-table"><rect x="930" y="1580" width="380" height="26" rx="10" fill="#3D3758"/><rect x="960" y="1606" width="20" height="230" fill="#2A2540"/><rect x="1260" y="1606" width="20" height="230" fill="#2A2540"/>
    <rect x="980" y="1560" width="230" height="20" rx="6" fill="#B9B3D3"/><rect x="980" y="1560" width="230" height="5" rx="2" fill="#E6E2F5"/></g>
</g>
<g id="L-threads" filter="url(#glow)"></g>
<g id="L-meta"></g>
<g id="L-fg" filter="url(#b12)">
  <path d="M-80,1960 C-40,1700 40,1560 160,1480 C120,1640 90,1800 60,1990 Z" fill="#14111D"/>
  <path d="M-60,1990 C20,1760 160,1640 300,1610 C220,1720 140,1840 100,2010 Z" fill="#1A1626"/>
  <path d="M20,2000 C60,1840 120,1740 200,1700 C170,1820 150,1900 140,2010 Z" fill="#100E18"/>
</g>`;

const META=`
<g id="m-list" opacity="0"><rect x="-110" y="-80" width="220" height="160" rx="22" fill="#F3F1FF" fill-opacity=".06" stroke="#D6CFFF" stroke-width="3"/>
  <rect x="-80" y="-50" width="24" height="24" rx="6" fill="none" stroke="#D6CFFF" stroke-width="3"/><path d="M-75,-38 l7,7 l13,-15" fill="none" stroke="#2CE8B6" stroke-width="3.5" stroke-linecap="round"/><path d="M-40,-38 H70" stroke="#D6CFFF" stroke-width="3" stroke-linecap="round" opacity=".7"/>
  <rect x="-80" y="-12" width="24" height="24" rx="6" fill="none" stroke="#D6CFFF" stroke-width="3"/><path d="M-40,0 H50" stroke="#D6CFFF" stroke-width="3" stroke-linecap="round" opacity=".5"/>
  <rect x="-80" y="26" width="24" height="24" rx="6" fill="none" stroke="#D6CFFF" stroke-width="3"/><path id="m-line3" d="M-40,38 H60" stroke="#D6CFFF" stroke-width="3" stroke-linecap="round" opacity=".5" stroke-dasharray="100" stroke-dashoffset="60"/></g>
<g id="m-clock" opacity="0"><circle r="74" fill="#F3F1FF" fill-opacity=".05" stroke="#D6CFFF" stroke-width="3"/><circle r="60" fill="none" stroke="#D6CFFF" stroke-width="1.5" stroke-dasharray="2 13.7" opacity=".7"/>
  <path id="m-hourH" d="M0,0 V-34" stroke="#E9E4FF" stroke-width="5" stroke-linecap="round"/><path id="m-minH" d="M0,0 V-52" stroke="#E9E4FF" stroke-width="3" stroke-linecap="round"/><circle r="5" fill="#E9E4FF"/></g>
<g id="m-pair" opacity="0" fill="#F3F1FF" fill-opacity=".05" stroke="#D6CFFF" stroke-width="3">
  <g transform="translate(-48 0)"><circle cx="0" cy="-40" r="26"/><path d="M-46,40 C-44,4 -24,-10 0,-10 C24,-10 40,4 44,40"/><path d="M-26,-44 l-6,4" stroke-width="2"/></g>
  <g transform="translate(48 0)"><circle cx="0" cy="-40" r="26"/><path d="M-44,40 C-40,4 -24,-10 0,-10 C24,-10 44,4 46,40"/></g>
  <path d="M0,-70 V50" stroke-dasharray="4 8" opacity=".5"/></g>`;

const SESSION=`
<rect x="-100" y="-100" width="1280" height="2120" fill="url(#sessWall)"/>
<ellipse cx="900" cy="300" rx="420" ry="380" fill="url(#whiteG)" opacity=".85" filter="url(#b30)"/>
<ellipse cx="120" cy="760" rx="300" ry="300" fill="url(#lampG)" opacity=".45"/>
<g filter="url(#b12)" opacity=".7"><path d="M980,1000 C930,860 960,720 1040,640 C1060,760 1050,900 1020,1000 Z" fill="#7FB8A8"/><path d="M1000,1010 C1060,880 1130,800 1200,780 C1150,880 1100,960 1060,1020 Z" fill="#6AA594"/><rect x="960" y="1000" width="120" height="160" rx="20" fill="#B8AEE6"/></g>
<ellipse id="s-teal" cx="1040" cy="760" rx="520" ry="620" fill="url(#tealG)" opacity="0" filter="url(#b30)"/>
<rect x="-100" y="1360" width="1280" height="700" fill="url(#deskG)"/>
<rect x="-100" y="1360" width="1280" height="6" fill="#FFFFFF" opacity=".5"/>
<g id="s-laptop" transform="translate(560 900) scale(1.16) translate(-600 -900)">
  <ellipse cx="600" cy="1168" rx="470" ry="30" fill="#5749E2" opacity=".18" filter="url(#b12)"/>
  <path d="M190,1110 L1010,1110 L1080,1160 C1084,1166 1080,1172 1072,1172 L128,1172 C120,1172 116,1166 120,1160 Z" fill="#CFCAE3"/>
  <path d="M190,1110 L1010,1110 L1016,1116 L184,1116 Z" fill="#F2F0FA"/>
  <rect x="520" y="1158" width="160" height="8" rx="4" fill="#B6B0CF"/>
  <g id="s-lid">
    <rect x="250" y="640" width="700" height="460" rx="24" fill="#1E1B2B"/>
    <g clip-path="url(#screenClip)"><g id="s-call">
      <rect x="268" y="658" width="664" height="424" fill="url(#callBg)"/>
      <g filter="url(#b5)" opacity=".75"><rect x="300" y="700" width="140" height="300" rx="10" fill="#E4D5C9"/><rect x="310" y="740" width="120" height="8" fill="#C8B6A8"/><rect x="310" y="820" width="120" height="8" fill="#C8B6A8"/><rect x="316" y="760" width="20" height="58" fill="#A9B6D9"/><rect x="340" y="770" width="16" height="48" fill="#D9A9A0"/><rect x="360" y="764" width="22" height="54" fill="#9FC9BA"/>
        <ellipse cx="840" cy="760" rx="90" ry="90" fill="#FFFFFF" opacity=".8"/><path d="M820,1000 C800,920 820,860 860,830 C870,900 862,960 850,1000 Z" fill="#8FBFAF"/></g>
      <g id="s-psy" transform="translate(600 900)">
        <path d="M-160,230 C-150,150 -86,120 -34,114 L34,114 C86,120 150,150 160,230 L160,300 L-160,300 Z" fill="url(#cardi)"/>
        <path d="M-34,114 L0,170 L34,114 Z" fill="#F1EEF8"/>
        <rect x="-24" y="50" width="48" height="76" rx="18" fill="url(#pskin)"/>
        <g id="s-psyHead">
          <path d="M-84,-40 C-94,-124 -42,-156 0,-156 C42,-156 96,-124 88,-40 C86,10 96,62 84,100 L-84,100 C-96,62 -86,10 -84,-40 Z" fill="#2B2233"/>
          <ellipse cx="-59" cy="-8" rx="9" ry="15" fill="#B88570"/><ellipse cx="59" cy="-8" rx="9" ry="15" fill="#B88570"/>
          <path d="M-58,-26 C-60,-90 60,-90 58,-26 C56,32 30,76 0,78 C-30,76 -56,32 -58,-26 Z" fill="url(#pskin)"/>
          <path d="M-64,-28 C-66,-104 44,-118 68,-50 C44,-86 4,-90 -28,-66 C-44,-56 -56,-42 -64,-28 Z" fill="#2B2233"/>
          <path d="M-36,-34 C-28,-39 -18,-39 -10,-35 M10,-35 C18,-39 28,-39 36,-34" fill="none" stroke="#3A2A2E" stroke-width="3.5" stroke-linecap="round"/>
          <g id="s-eyes"><ellipse cx="-23" cy="-16" rx="8.5" ry="5" fill="#1F1820"/><ellipse cx="23" cy="-16" rx="8.5" ry="5" fill="#1F1820"/></g>
          <path d="M3,-8 C7,6 9,14 3,20 C0,22 -4,21 -6,18" fill="none" stroke="#9A6A58" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M-14,40 C-6,45 6,45 14,40" fill="none" stroke="#8A4E4E" stroke-width="3" stroke-linecap="round"/>
          <ellipse cx="-34" cy="16" rx="12" ry="7" fill="#E28F8F" opacity=".18"/><ellipse cx="34" cy="16" rx="12" ry="7" fill="#E28F8F" opacity=".18"/>
        </g>
      </g>
    </g></g>
    <rect id="s-lidShade" x="250" y="640" width="700" height="460" rx="24" fill="url(#lidShade)" opacity="0"/>
    <rect x="254" y="644" width="692" height="452" rx="22" fill="none" stroke="#FFFFFF" stroke-opacity=".08" stroke-width="2"/>
  </g>
</g>
<g id="s-ots" filter="url(#b5)">
  <path d="M-220,1990 C-230,1760 -120,1640 40,1610 C170,1586 320,1630 410,1760 C460,1830 480,1920 480,2000 Z" fill="url(#knit)"/>
  <path d="M40,1610 C170,1586 320,1630 410,1760" fill="none" stroke="#C3B8FF" stroke-width="7" opacity=".55"/>
  <ellipse cx="150" cy="1440" rx="168" ry="200" fill="url(#otsHair)"/>
  <ellipse cx="108" cy="1225" rx="64" ry="58" fill="url(#otsHair)"/>
  <path d="M292,1320 C322,1400 320,1490 280,1580" fill="none" stroke="#D3CAFF" stroke-width="9" opacity=".55"/>
  <path d="M140,1232 C190,1240 236,1272 262,1316 M60,1250 C120,1236 180,1250 230,1290" fill="none" stroke="#6F64A8" stroke-width="4" opacity=".35"/>
  <path d="M300,1440 C306,1470 300,1500 288,1520" fill="none" stroke="#B88570" stroke-width="14" stroke-linecap="round" opacity=".9"/>
</g>`;

const BRAND=`
<rect x="-100" y="-100" width="1280" height="2120" fill="#F3F1FF"/>
<ellipse cx="160" cy="320" rx="520" ry="480" fill="#C9C1FF" opacity=".55" filter="url(#b60)"/>
<ellipse cx="960" cy="1560" rx="520" ry="520" fill="#BFF7E6" opacity=".7" filter="url(#b60)"/>
<g id="b-threads" filter="url(#glow)"></g>
<g id="b-bubbles" transform="translate(0 0)">
  <path id="b-link" d="M470,1035 C560,1035 520,1105 610,1105" fill="none" stroke="#5749E2" stroke-width="5" stroke-linecap="round" stroke-dasharray="200" stroke-dashoffset="200"/>
  <g id="b-bA" opacity="0"><path d="M270,960 h190 a26 26 0 0 1 26 26 v76 a26 26 0 0 1 -26 26 h-140 l-34 30 v-30 h-16 a26 26 0 0 1 -26 -26 v-76 a26 26 0 0 1 26 -26 z" fill="#FFFFFF" stroke="#5749E2" stroke-width="5"/>
    <circle cx="330" cy="1024" r="8" fill="#5749E2"/><circle cx="365" cy="1024" r="8" fill="#5749E2" opacity=".6"/><circle cx="400" cy="1024" r="8" fill="#5749E2" opacity=".35"/></g>
  <g id="b-bB" opacity="0"><path d="M620,1030 h190 a26 26 0 0 1 26 26 v76 a26 26 0 0 1 -26 26 h-16 v30 l-34 -30 h-140 a26 26 0 0 1 -26 -26 v-76 a26 26 0 0 1 26 -26 z" fill="#FFFFFF" stroke="#2CE8B6" stroke-width="5"/>
    <path d="M688,1090 C688,1074 708,1068 716,1082 C724,1068 744,1074 744,1090 C744,1108 716,1124 716,1124 C716,1124 688,1108 688,1090 Z" fill="#2CE8B6"/></g>
</g>`;

// ---------------------------------------------------------------- build DOM
function build(){
  $('defs').innerHTML=DEFS;
  $('room').innerHTML=ROOM; $('L-meta').innerHTML=META;
  $('charHost').innerHTML=CH.charSVG();
  $('sess').innerHTML=SESSION; $('brand').innerHTML=BRAND;
  for(const host of ['L-threads','b-threads']) for(let i=0;i<N_TH;i++){const p=document.createElementNS(NS,'path');p.setAttribute('fill','none');p.setAttribute('stroke-linecap','round');$(host).appendChild(p)}
  // grain texture (deterministic)
  const g=$('grain'),x=g.getContext('2d'),im=x.createImageData(540,960);let s=7;
  for(let i=0;i<im.data.length;i+=4){s=(s*16807)%2147483647;const v=s%255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}
  x.putImageData(im,0,0);
}

// ---------------------------------------------------------------- threads
const TH=[...Array(N_TH)].map((_,i)=>({R:250+((i*53)%150),r:24+((i*29)%30),k:3+(i%4),turns:1.25+((i*0.37)%0.7),off:i*0.83,
  w:1.6+((i*7)%3)*.8,base:.55+((i*0.19)%0.5),Y:-300+i*75,amp:40+(i%3)*22,col:['#B7ACFF','#9A8CFF','#8273F2','#CFC7FF','#7465EE'][i%5]}));
const tealCol='#2CE8B6';
function threadD(i,ph,reveal,order,cx,cy,spread=1,flowW=1300,flowX=-110){
  const T=TH[i],n=150,pts=[];
  for(let j=0;j<=n;j++){const s=j/n*reveal;
    const th=2*Math.PI*(s*T.turns)+ph+T.off;
    const R=T.R*spread*(1+.07*Math.sin(3*th+ph*1.7));
    const lx=cx+R*Math.cos(th)+T.r*Math.cos(T.k*th+ph*.6), ly=cy+R*.78*Math.sin(th)+T.r*Math.sin(T.k*th+ph*.6);
    const u=s/Math.max(reveal,.001);
    const fx=flowX+u*flowW, fy=cy+T.Y+T.amp*Math.sin(2*Math.PI*(u*1.1+i*.17)+ph*.35);
    const o=sm(order*1.15-u*.15);
    pts.push([lerp(lx,fx,o),lerp(ly,fy,o)]);}
  let d=`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let j=1;j<pts.length;j++)d+=`L${pts[j][0].toFixed(1)},${pts[j][1].toFixed(1)}`;
  return d;
}
function mixHex(a,b,u){const p=h=>[1,3,5].map(k=>parseInt(h.slice(k,k+2),16));const A=p(a),B=p(b);return '#'+A.map((v,k)=>Math.round(lerp(v,B[k],u)).toString(16).padStart(2,'0')).join('')}

// ---------------------------------------------------------------- timelines
function base(){return{cam:{fx:470,fy:790,s:2},roomA:0,sessA:0,brandA:0,endA:0,wash:0,light:.1,warm:0,
  pose:{headTilt:1,breathe:0,phoneUp:1,blink:0,relax:0,lookUp:0,phoneGlow:1,reach:0,phone:1,warm:0},
  th:{appear:Array(N_TH).fill(0),agit:.7,freeze:Array(N_TH).fill(0),order:0,teal:0,alpha:1,spread:1},
  meta:[0,0,0],clock:0,sess:{s:1,relax:0,teal:0,lid:1,t:0},brand:{logo:0,bubA:0,bubB:0,link:0,line:0,svc:0,thA:0},
  end:{logo:0,line:0,btn:0,url:0,t:0},caps:[]};}
const blinkAt=(t,list)=>Math.max(0,...list.map(b=>bump(t,b,.09)));
function breathing(t){return .5+.5*Math.sin(2*Math.PI*t/4.4)}

function mainState(t){
  const S=base(),P=S.pose,K=C.main;
  S.roomA=Math.min(1-ramp(t,14.9,15.4),1)+ (t>24.5?ramp(t,24.5,25.0)-ramp(t,29.8,30.3):0);
  if(t>15.4&&t<24.5)S.roomA=0;
  S.sessA=ramp(t,15.0,15.5)-ramp(t,24.4,24.9);
  S.brandA=ramp(t,29.9,30.4)-ramp(t,35.7,36.2);
  S.endA=ramp(t,35.9,36.4);
  S.wash=Math.max(bump(t,15.2,.45),bump(t,24.65,.4),bump(t,30.1,.4),bump(t,36.1,.4))*.85;
  // camera (room)
  if(t<4){S.cam={fx:472,fy:792,s:lerp(1.96,2.08,eo(t/4))}}
  else if(t<10){const u=eio((t-4)/6);S.cam={fx:lerp(472,548,u),fy:lerp(792,846,u),s:lerp(2.08,1.56,u)}}
  else if(t<16){const u=eio((t-10)/5);S.cam={fx:lerp(548,486,u),fy:lerp(846,776,u),s:lerp(1.56,2.22,u)}}
  else {const u=eo((t-24.6)/5.6);S.cam={fx:lerp(610,590,u),fy:lerp(950,930,u),s:lerp(1.08,1.13,u)}}
  S.light=seg(t,[[0,.08],[10.6,.1],[13.6,.75],[24,.75],[25,.85]]);
  // pose
  P.phoneUp=1-ramp(t,1.5,2.5); P.phoneGlow=1-ramp(t,1.7,2.6)*.8-ramp(t,3.2,3.8)*.2;
  P.headTilt=seg(t,[[0,1],[1.5,1],[2.6,.42],[4,.38],[10,.4],[12.6,.25],[24,.25],[25,.3]]);
  P.lookUp=0; P.reach=0;
  if(t>=4&&t<10){const k=(t-4)/6;P.lookUp=(.12+.22*k)*Math.sin(t*1.9)+.05*Math.sin(t*4.3)*k;P.reach=ramp(t,6.4,6.9)*(1-ramp(t,7.7,8.3))*.85;P.headTilt+=.12*Math.sin(t*2.4)*k}
  if(t>=10&&t<16)P.lookUp=seg(t,[[10,0],[12.4,.1],[13.6,.85]]);
  P.breathe=breathing(t)*.35+ (t>10.8&&t<13? Math.sin(Math.PI*cl((t-10.9)/1.9))*1.1:0);
  P.blink=Math.max(blinkAt(t,[1.1,3.3,5.4,8.9,26.2,28.6]), t>11.2&&t<12.3?sm((t-11.2)/.25)*(1-sm((t-12.05)/.25)):0);
  P.warm=seg(t,[[10.8,0],[13.6,.9],[24,.9],[25,.55]]);
  P.relax=t>24?1:0; P.phone=t>24?0:1;
  if(t>24){P.headTilt=.28;P.lookUp=.18+.04*Math.sin(t*.8);P.phoneGlow=0}
  // threads
  for(let i=0;i<N_TH;i++){S.th.appear[i]=i<4?ramp(t,.05+i*.18,1.6+i*.35):ramp(t,4.2+(i-4)*.35,5.4+(i-4)*.4);
    S.th.freeze[i]=ramp(t,10.7+i*.42,11.6+i*.42)}
  S.th.agit=seg(t,[[0,.75],[4,.95],[9.5,1.35]]);
  S.th.order=t>24?seg(t,[[24.6,.0],[28.4,1]]):0; S.th.teal=t>24?seg(t,[[25.5,0],[29,.6]]):0;
  S.th.spread=t<4?lerp(.92,1,t/4):1;
  // metaphors
  S.meta=[win(t,4.9,14.6,.7,1.6),win(t,6.1,14.6,.7,1.6),win(t,7.3,14.6,.7,1.6)].map((v,i)=>v*(1-.7*ramp(t,11+i*.4,12.6+i*.4)));
  S.clock=t;
  // session
  S.sess.t=t-15; S.sess.s=lerp(1.0,1.075,eio((t-15)/9)); S.sess.relax=ramp(t,15.5,22.5); S.sess.teal=ramp(t,18,22.8);
  S.sess.lid=1-ramp(t,23.2,24.3);
  // brand
  S.brand={logo:ramp(t,30.4,31.3),bubA:ramp(t,31.4,31.9),bubB:ramp(t,32.3,32.8),link:ramp(t,31.8,32.6),line:ramp(t,32.6,33.2),svc:ramp(t,33.4,34),thA:ramp(t,30.2,31.2)*(1-ramp(t,34.8,35.8)),t};
  S.end={logo:ramp(t,36.2,36.8),line:ramp(t,36.6,37.2),btn:ramp(t,37.1,37.7),url:ramp(t,37.6,38.1),t,line2:null};
  S.caps=K.captions.map(([txt,a,b,st])=>({txt,st,a:win(t,a,b,.5,.45),u:ramp(t,a,a+.7)}));
  return S;
}

function shortState(t){
  const S=base(),P=S.pose,K=C.short;
  S.roomA=1-ramp(t,5.8,6.25); S.sessA=ramp(t,5.85,6.3)-ramp(t,9.8,10.25); S.endA=ramp(t,9.9,10.35);
  S.wash=Math.max(bump(t,6.05,.4),bump(t,10.1,.4))*.85;
  S.cam={fx:lerp(472,486,eio(t/6)),fy:lerp(792,778,eio(t/6)),s:lerp(1.98,2.24,eio(t/6))};
  S.light=seg(t,[[0,.08],[3.4,.1],[5.4,.7]]);
  P.phoneUp=1-ramp(t,.7,1.5); P.phoneGlow=1-ramp(t,.9,1.6)*.9;
  P.headTilt=seg(t,[[0,1],[.7,1],[1.6,.42],[3.4,.4],[5,.25]]);
  P.lookUp=t<3?.12*Math.sin(t*2.2):seg(t,[[3,0],[4.6,.15],[5.6,.8]]);
  P.breathe=breathing(t)*.35+(t>3.3&&t<5.1?Math.sin(Math.PI*cl((t-3.3)/1.7))*1.1:0);
  P.blink=Math.max(blinkAt(t,[2.2]),t>3.6&&t<4.6?sm((t-3.6)/.25)*(1-sm((t-4.35)/.25)):0);
  P.warm=seg(t,[[3.4,0],[5.6,.9]]);
  for(let i=0;i<N_TH;i++){S.th.appear[i]=ramp(t,-.6+i*.1,.5+i*.12);S.th.freeze[i]=ramp(t,3.1+i*.2,3.9+i*.2)}
  S.th.agit=1.1;
  S.meta=[win(t,.2,5.6,.5,1),win(t,.5,5.6,.5,1),win(t,.8,5.6,.5,1)].map((v,i)=>v*(1-.7*ramp(t,3.4+i*.2,4.6+i*.2)));
  S.clock=t+6;
  S.sess.t=t-6+3; S.sess.s=lerp(1.0,1.06,eio((t-6)/4)); S.sess.relax=ramp(t,6,9.5); S.sess.teal=ramp(t,6.5,9.5); S.sess.lid=1;
  S.end={logo:ramp(t,10.2,10.8),line:ramp(t,10.6,11.2),btn:ramp(t,11.1,11.7),url:ramp(t,11.6,12.1),t:t+26};
  S.caps=K.captions.map(([txt,a,b,st])=>({txt,st,a:win(t,a,b,.4,.35),u:ramp(t,a,a+.6)}));
  return S;
}

// ---------------------------------------------------------------- thread phase integration (deterministic)
let CUT='main', STATE=mainState, PH=null, DT=1/120;
function integrate(){
  const D=C[CUT].duration,n=Math.ceil(D/DT)+2; PH=[...Array(N_TH)].map(()=>new Float32Array(n));
  const ph=Array(N_TH).fill(0);
  for(let k=0;k<n;k++){const st=STATE(k*DT);
    for(let i=0;i<N_TH;i++){const v=TH[i].base*(st.th.agit*(1-st.th.freeze[i]*.93))+st.th.order*.3; ph[i]+=v*DT*1.6; PH[i][k]=ph[i]}}
}
const phaseAt=(i,t)=>{const k=cl(t/DT,0,PH[i].length-1),k0=Math.floor(k);return lerp(PH[i][k0],PH[i][Math.min(k0+1,PH[i].length-1)],k-k0)};

// ---------------------------------------------------------------- apply
function layer(id,d,cam){ // parallax: depth d (1 = subject plane)
  const s=1+(cam.s-1)*d, fx=lerp(540,cam.fx,d), fy=lerp(960,cam.fy,d);
  $(id).setAttribute('transform',`translate(540 960) scale(${s}) translate(${-fx} ${-fy})`);
}
function setOp(id,v){const e=$(id);e.style.opacity=v;e.style.display=v<=0.001?'none':''}

function render(t){
  const S=STATE(t);
  setOp('room',S.roomA); setOp('sess',S.sessA); setOp('brand',S.brandA); setOp('endCard',S.endA); setOp('brandText',S.brandA);
  $('wash').setAttribute('opacity',S.wash);
  // ---- room
  if(S.roomA>0){
    const c=S.cam; layer('L-far',.45,c); layer('r-beam',.6,c); layer('L-mid',.85,c); layer('L-char',1,c); layer('L-threads',1,c); layer('L-meta',1.05,c); layer('L-fg',1.45,c);
    $('r-wallLit').setAttribute('opacity',S.light); $('r-winWarm').setAttribute('opacity',S.light*.9);
    $('r-beam').setAttribute('opacity',.18+S.light*.75);
    CH.poseChar($('charHost'),S.pose);
    const hx=440+S.pose.lookUp*4,hy=770-S.pose.breathe*5;
    [...$('L-threads').children].forEach((p,i)=>{const a=S.th.appear[i]; if(a<=0){p.setAttribute('d','');return}
      p.setAttribute('d',threadD(i,phaseAt(i,t),.2+.8*a,S.th.order,hx-40,hy-30,S.th.spread));
      p.setAttribute('stroke',mixHex(TH[i].col,i%2?tealCol:'#7C6CFF',S.th.teal*(i%2?1:.5)));
      p.setAttribute('stroke-width',TH[i].w); p.setAttribute('opacity',(.2+.34*a)*S.th.alpha);});
    const fl=(k,f)=>Math.sin(t*f+k)*10;
    const m=[['m-list',665+fl(1,.7),705+fl(2,.6),-8+Math.sin(t*.5)*3],['m-clock',285+fl(3,.6),700+fl(4,.8),0],['m-pair',690+fl(5,.5),1010+fl(6,.7),4]];
    m.forEach(([id,x,y,r],i)=>{$(id).setAttribute('transform',`translate(${x} ${y}) rotate(${r}) scale(${.9+.1*S.meta[i]})`);$(id).setAttribute('opacity',S.meta[i]*.9)});
    const spd=t<10?14:lerp(14,1,cl((t-10)/3)); $('m-minH').setAttribute('transform',`rotate(${S.clock*spd*30})`); $('m-hourH').setAttribute('transform',`rotate(${S.clock*spd*2.5})`);
    $('m-line3').setAttribute('stroke-dashoffset',60-30*Math.sin(t*1.3)**2);
  }
  // ---- session
  if(S.sessA>0){
    const ss=S.sess, s=ss.s; $('sess').setAttribute('transform',`translate(540 1000) scale(${s}) translate(-560 -1000)`);
    $('s-teal').setAttribute('opacity',ss.teal*.75);
    $('s-ots').setAttribute('transform',`translate(${-ss.relax*10} ${ss.relax*18+Math.sin(ss.t*1.4)*3})`);
    const nod=Math.sin(ss.t*1.1)*2.2+ (Math.sin(ss.t*.55)>.6?Math.sin(ss.t*5)*1.5:0);
    $('s-psyHead').setAttribute('transform',`translate(0 ${nod}) rotate(${3+Math.sin(ss.t*.4)*2} 0 60)`);
    const bl=Math.max(...[1.4,4.6,7.3].map(b=>bump(ss.t,b,.09)));
    $('s-eyes').setAttribute('transform',`translate(0 -16) scale(1 ${Math.max(.1,1-bl)}) translate(0 16)`);
    const lid=ss.lid, lz=sm((.85-lid)/.85)*.85+(lid<.15?0:0); $('s-lid').setAttribute('transform',`translate(0 1100) scale(1 ${Math.max(.03,1-lz-(lid<.15?.12*(1-lid/.15):0))}) translate(0 -1100)`);
    $('s-lidShade').setAttribute('opacity',(1-lid)*.9); $('s-call').setAttribute('opacity',sm((lid-.8)/.2));
  }
  // ---- brand
  if(S.brandA>0){
    const B=S.brand;
    [...$('b-threads').children].forEach((p,i)=>{p.setAttribute('d',threadD(i,B.t*.5+i,1,1,540,1040,1,1300,-110));
      p.setAttribute('stroke',i%3==1?tealCol:mixHex(TH[i].col,'#5749E2',.6)); p.setAttribute('stroke-width',TH[i].w*.9); p.setAttribute('opacity',B.thA*.35)});
    $('b-logo').style.opacity=B.logo; $('b-logo').style.transform=`translateY(${(1-eo(B.logo))*24}px) scale(${.96+.04*eo(B.logo)})`;
    $('b-bA').setAttribute('opacity',B.bubA); $('b-bA').setAttribute('transform',`translate(0 ${(1-eo(B.bubA))*20})`);
    $('b-bB').setAttribute('opacity',B.bubB); $('b-bB').setAttribute('transform',`translate(0 ${(1-eo(B.bubB))*20})`);
    $('b-link').setAttribute('stroke-dashoffset',200*(1-B.link));
    rise('b-line',B.line,20); rise('b-svc',B.svc,16);
  }
  // ---- end card
  if(S.endA>0){const E=S.end;
    rise('e-logo',E.logo,20); rise('e-line',E.line,24);
    const b=E.btn, sc=b<1?.86+.17*eo(b)-.03*Math.sin(Math.PI*cl((b-.6)/.4))*(b>.6):1; $('e-btn').style.opacity=b; $('e-btn').style.transform=`scale(${sc})`;
    $('e-ring').style.opacity=b*(.55+.25*Math.sin(E.t*2.2)*(E.t<38.6?1:0)); rise('e-url',E.url,14);}
  // ---- captions
  const light=S.sessA>.5||S.brandA>.5||S.endA>.5;
  S.caps.forEach((c,i)=>{const el=$('cap'+i); el.style.opacity=c.a; el.style.transform=`translateY(${(1-eo(c.u))*26}px)`; el.classList.toggle('ink',light)});
  // ---- grain
  const f=Math.floor(t*30); $('grain').style.transform=`translate(${-(f*37%60)}px,${-(f*53%60)}px) scale(2)`;
}
function rise(id,p,d){const e=$(id);e.style.opacity=p;e.style.transform=`translateY(${(1-eo(p))*d}px)`}

// ---------------------------------------------------------------- cut setup
function setCut(name){
  CUT=name; STATE=name==='main'?mainState:shortState; integrate();
  const K=C[name];
  $('caps').innerHTML=K.captions.map(([txt,,,st],i)=>`<div class="cap ${st}" id="cap${i}">${txt}</div>`).join('');
  $('e-line').textContent=K.endLine; $('e-btn').firstChild.textContent=K.button+' ';
  $('b-line').textContent=C.main.brandLine; $('b-svc').textContent=C.main.services;
  $('e-url').textContent=C.brand.url;
  window.DURATION=K.duration;
}
// cues for the sound designer script
function cues(name){
  const m=name==='main';
  const list=m?[
    ['threads',0.1],['threads',4.3],['threads',5.0],['meta',4.9],['meta',6.1],['meta',7.3],['calm',10.8],['breath',10.9],['whoosh',15.1],['teal',18.5],['lid',23.3],['whoosh',24.6],['bloom',25.6],['whoosh',30.1],['link',31.8],['whoosh',36.05],['button',37.15]]
   :[['threads',0.0],['meta',.3],['calm',3.1],['breath',3.3],['whoosh',6.0],['teal',7],['whoosh',10.05],['button',11.15]];
  const scenes=C[name].scenes;
  return {duration:C[name].duration,scenes,cues:list,vo:C[name].vo.map(v=>[v[0],v[1]])};
}
window.MentraAd={build,setCut,render,cues,get cut(){return CUT}};
})();

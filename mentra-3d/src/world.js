// Mentra abstract 3D world: glass "mind" orbs, glowing threads, light portal, gradient void, particles.
import * as THREE from 'three';

export const COL = { purple: 0x5749E2, teal: 0x2CE8B6, ink: 0x29273A, lav: 0xF3F1FF, mint: 0xEBFDF8 };

// ------------------------------------------------------------------ backdrop: gradient sphere with a soft light "opening"
export function makeBackdrop() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(0x130F22) }, bottom: { value: new THREE.Color(0x2B2446) }, glowCol: { value: new THREE.Color(0xFFE6D2) },
      glowDir: { value: new THREE.Vector3(.35, .15, -1).normalize() }, glow: { value: 0 }, glowSize: { value: .035 }, haze: { value: new THREE.Color(0x5749E2) }, hazeAmt: { value: .25 } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform vec3 top, bottom, glowCol, haze; uniform vec3 glowDir; uniform float glow, glowSize, hazeAmt; varying vec3 vDir;
      void main(){ float h = vDir.y*.5+.5; vec3 c = mix(bottom, top, smoothstep(.15,.85,h));
        float d = 1. - dot(normalize(vDir), glowDir);
        c += haze * hazeAmt * exp(-d*3.0);
        c += glowCol * glow * (exp(-d/glowSize)*1.1 + exp(-d/(glowSize*6.))*.28);
        gl_FragColor = vec4(c,1.); }` });
  const m = new THREE.Mesh(new THREE.SphereGeometry(40, 64, 32), mat); m.renderOrder = -10; return m;
}

// ------------------------------------------------------------------ glass orb (fresnel shader) + inner core
export function makeOrb(rimCol, coreCol, tint) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(.34, 96, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { rim: { value: new THREE.Color(rimCol) }, tint: { value: new THREE.Color(tint) }, alpha: { value: 1 }, t: { value: 0 }, irid: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 rim, tint; uniform float alpha, t, irid; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.-max(dot(vN,vV),0.), 2.2);
        vec3 ir = .5+.5*cos(6.2831*(f*.8+vec3(0.,.33,.67)+t*.02));
        vec3 c = mix(tint*.35, rim, f) + ir*f*.18*irid;
        float spec = pow(max(dot(reflect(-normalize(vec3(-.4,.7,.6)), vN), vV),0.), 60.);
        c += vec3(1.)*spec*.9;
        float a = (.08 + .92*f) * alpha + spec*.6*alpha;
        gl_FragColor = vec4(c, a); }` }));
  shell.renderOrder = 5; g.add(shell);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex([[0, 'rgba(255,255,255,1)'], [.35, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]), color: coreCol, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  core.scale.setScalar(.5); core.renderOrder = 4; g.add(core);
  return { g, shell, core };
}

export function radialTex(stops, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const gr = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => gr.addColorStop(o, col));
  x.fillStyle = gr; x.fillRect(0, 0, size, size); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}

// ------------------------------------------------------------------ floor glow + contact shadows (ground the floating orbs)
export function makeFloor() {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(160,148,255,.55)'], [.5, 'rgba(120,108,230,.18)'], [1, 'rgba(120,108,230,0)']]), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; g.add(floor);
  const mk = () => { const s = new THREE.Mesh(new THREE.CircleGeometry(.6, 48), new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(10,8,25,.6)'], [1, 'rgba(10,8,25,0)']]), transparent: true, depthWrite: false })); s.rotation.x = -Math.PI / 2; s.position.y = .002; g.add(s); return s; };
  return { g, floor, shadow: mk(), shadow2: mk() };
}

// ------------------------------------------------------------------ dust motes
export function makeDust(n = 420) {
  const geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3); let s = 3;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < n; i++) { p[i * 3] = (r() - .5) * 7; p[i * 3 + 1] = r() * 3.4 - .2; p[i * 3 + 2] = (r() - .5) * 7; }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ size: .018, map: radialTex([[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']], 64), transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xCFC6FF, toneMapped: false }));
}

// ------------------------------------------------------------------ threads: tangle around orb A  ->  calm ribbons looping A and B
export const N_TH = 11;
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const TH = [...Array(N_TH)].map((_, i) => ({
  R: .44 + rnd(i) * .2, r: .03 + rnd(i + 9) * .05, k: 3 + (i % 4), turns: 1.25 + rnd(i + 3) * .7, off: i * .83,
  tiltX: (rnd(i + 5) - .5) * 2.2, tiltZ: (rnd(i + 7) - .5) * 2.0, w: .0035 + rnd(i + 11) * .0035, base: .55 + rnd(i + 19) * .5,
  fr: .55 + rnd(i + 23) * .5, fp: rnd(i + 29) * 6.28, fh: (rnd(i + 31) - .5) * .5,
}));
export const TH_COLS = [0xC2B8FF, 0x9E91FF, 0x8273F2, 0xDCD5FF, 0x7465EE];
export function makeThreads(parent) {
  return [...Array(N_TH)].map((_, i) => { const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: TH_COLS[i % 5], transparent: true, opacity: .75, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.frustumCulled = false; m.renderOrder = 3; parent.add(m); return m; });
}
const _v = new THREE.Vector3(), _e = new THREE.Euler(), _q = new THREE.Quaternion();
export function threadCurve(i, ph, reveal, order, A, B, spread = 1) {
  const T = TH[i], n = 120, pts = [];
  _q.setFromEuler(_e.set(T.tiltX + ph * .03, ph * .05, T.tiltZ));
  const mid = new THREE.Vector3().addVectors(A, B).multiplyScalar(.5);
  for (let j = 0; j <= n; j++) {
    const s = j / n * reveal, th = Math.PI * 2 * s * T.turns + ph + T.off;
    const R = T.R * spread * (1 + .07 * Math.sin(3 * th + ph * 1.7));
    _v.set(R * Math.cos(th) + T.r * Math.cos(T.k * th + ph * .6), T.r * Math.sin(T.k * th + ph * .6) * .8, R * .85 * Math.sin(th)).applyQuaternion(_q).add(A);
    const u = s / Math.max(reveal, .001), a = u * Math.PI * 4 + T.fp + ph * .25;
    const side = Math.cos(u * Math.PI);                       // 1 at A, -1 at B
    const cx = mid.x + (A.x - mid.x) * side * 1.05, cy = mid.y + T.fh * Math.sin(u * Math.PI * 2 + T.fp) + (A.y - mid.y) * side;
    const rr = (.5 + .14 * T.fr) * (.75 + .25 * Math.abs(side));
    const fx = cx + Math.cos(a) * rr * .55, fy = cy + Math.sin(a * .5 + T.fp) * .22, fz = mid.z + Math.sin(a) * rr * (.6 + .2 * T.fr);
    const o = Math.min(1, Math.max(0, order * 1.15 - u * .15)), e = o * o * (3 - 2 * o);
    pts.push(new THREE.Vector3(_v.x + (fx - _v.x) * e, _v.y + (fy - _v.y) * e, _v.z + (fz - _v.z) * e));
  }
  return new THREE.CatmullRomCurve3(pts);
}

// ------------------------------------------------------------------ metaphors (glowing line objects)
export function makeMetaphors(parent) {
  const lineMat = () => new THREE.MeshBasicMaterial({ color: 0xE6E0FF, transparent: true, opacity: .7, toneMapped: false, depthWrite: false });
  const tube = (pts, r, mat, closed = false) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), closed, 'catmullrom', 0), pts.length * 8, r, 6, closed), mat);
  const rrect = (w, h, rad) => { const p = []; const c = [[w / 2 - rad, h / 2 - rad, 0], [-w / 2 + rad, h / 2 - rad, Math.PI / 2], [-w / 2 + rad, -h / 2 + rad, Math.PI], [w / 2 - rad, -h / 2 + rad, Math.PI * 1.5]];
    for (const [cx, cy, a0] of c) for (let k = 0; k <= 6; k++) { const a = a0 + k / 6 * Math.PI / 2; p.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 0]); } return p; };
  const list = new THREE.Group(); const lm = lineMat(); list.userData.mats = [lm];
  list.add(tube(rrect(.32, .24, .04), .004, lm, true));
  for (let r = 0; r < 3; r++) { const y = .06 - r * .06; list.add(tube(rrect(.035, .035, .008).map(p => [p[0] - .1, p[1] + y, 0]), .003, lm, true));
    list.add(tube([[-.06, y, 0], [r === 0 ? .1 : r === 1 ? .06 : .02, y, 0]], .0028, lm)); }
  const tm = new THREE.MeshBasicMaterial({ color: COL.teal, transparent: true, toneMapped: false, depthWrite: false }); list.userData.mats.push(tm);
  list.add(tube([[-.112, .062, .002], [-.1, .05, .002], [-.084, .074, .002]], .0042, tm));
  const clock = new THREE.Group(); const cm = lineMat(); clock.userData.mats = [cm];
  clock.add(new THREE.Mesh(new THREE.TorusGeometry(.12, .0045, 12, 96), cm));
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const d = new THREE.Mesh(new THREE.SphereGeometry(.004, 8, 8), cm); d.position.set(Math.cos(a) * .098, Math.sin(a) * .098, 0); clock.add(d); }
  const hm = new THREE.Mesh(new THREE.BoxGeometry(.006, .085, .006), cm); hm.geometry.translate(0, .042, 0); clock.add(hm);
  const hh = new THREE.Mesh(new THREE.BoxGeometry(.008, .055, .008), cm); hh.geometry.translate(0, .027, 0); clock.add(hh);
  clock.userData.hands = [hm, hh];
  const pair = new THREE.Group(); const pm = lineMat(); pair.userData.mats = [pm];
  for (const s of [-1, 1]) { const f = new THREE.Group();
    const hd = new THREE.Mesh(new THREE.TorusGeometry(.035, .004, 10, 48), pm); hd.position.y = .085; f.add(hd);
    f.add(tube([...Array(13)].map((_, k) => { const a = Math.PI * (k / 12); return [Math.cos(a) * .06, Math.sin(a) * .06 - .02, 0]; }), .004, pm));
    f.position.x = s * .075; f.rotation.y = s * 1.15; pair.add(f); }
  [list, clock, pair].forEach(o => { o.traverse(m => m.renderOrder = 6); parent.add(o); });
  return { list, clock, pair };
}

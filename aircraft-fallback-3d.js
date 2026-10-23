/* A dependency-free solid aircraft: all angles project the same lit 3D mesh. */
(() => {
  'use strict';
  const aircraft = document.querySelector('.airplane');
  const stage = document.querySelector('.journey-stage');
  if (!aircraft || !stage) return;
  const primary = aircraft.querySelector('.aircraft-canvas');
  if (primary && primary.getContext('webgl')) return;
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 288;
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return; // Keep the original illustration if canvas is unavailable.
  aircraft.replaceChildren(canvas);
  const faces = [];
  const white = [227, 237, 243], metal = [163, 185, 201];
  const dark = [28, 39, 51], glass = [40, 83, 107], red = [210, 37, 50];
  const add = (points, color, detail = false) => faces.push({ points, color, detail });
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const sub = (a, b) => a.map((n, i) => n-b[i]);
  // Ring-based solids retain rounded volume throughout the half-turn.
  function tube(profile, cy, cz, color, segments = 32) {
    const rings = profile.map(([x, r]) => Array.from({ length: segments }, (_, j) => {
      const a = j / segments * Math.PI * 2;
      return [x, cy + Math.cos(a)*r, cz + Math.sin(a)*r];
    }));
    for (let i = 0; i < rings.length-1; i++) for (let j = 0; j < segments; j++) {
      const k = (j+1)%segments;
      add([rings[i][j], rings[i][k], rings[i+1][k], rings[i+1][j]], color);
    }
    return rings;
  }
  function slab(outline, thickness, color) {
    const upper = outline.map(([x,y,z]) => [x,y+thickness/2,z]);
    const lower = outline.map(([x,y,z]) => [x,y-thickness/2,z]);
    add(upper, color); add([...lower].reverse(), metal);
    upper.forEach((p,i) => { const j = (i+1)%upper.length; add([p,lower[i],lower[j],upper[j]], metal); });
  }
  tube([[-2.65,.015],[-2.4,.12],[-2,.22],[-1.5,.265],[.9,.265],[1.5,.25],[1.9,.21],[2.15,.15],[2.36,.075],[2.42,0]],0,0,white);
  // Dark belly, cockpit windows and passenger windows wrap around the hull.
  for (let side of [-1,1]) {
    add([[-1.9,-.1,side*.205],[1.85,-.1,side*.18],[2.1,-.12,side*.09],[1.45,-.22,side*.115],[-1.6,-.22,side*.115]],dark,true);
    for (let i = 0; i < 17; i++) {
      const x = -1.65+i*.18;
      add([[x,.14,side*.228],[x+.065,.14,side*.228],[x+.065,.205,side*.17],[x,.205,side*.17]], glass,true);
    }
    add([[1.58,.20,side*.15],[1.94,.18,side*.105],[2.12,.12,side*.095],[1.66,.12,side*.21]],glass,true);
    // Swept wings and stabilizers have actual thickness, including winglets.
    slab([[.45,-.06,side*.16],[-.6,-.08,side*2.35],[-1.03,-.08,side*2.35],[-.55,-.06,side*.18]],.055,white);
    slab([[-1.76,.06,side*.1],[-2.3,.1,side*1.02],[-2.6,.1,side*1.02],[-2.32,.06,side*.1]],.045,white);
    slab([[-.6,-.08,side*2.35],[-.83,.24,side*2.43],[-1.03,.25,side*2.43],[-1.03,-.08,side*2.35]],.025,dark);
    // Small nacelles sit out on the wings; nothing hangs beneath the fuselage.
    slab([[-.36,-.08,side*1.15],[-.13,-.08,side*1.15],[-.13,-.2,side*1.15],[-.36,-.2,side*1.15]],.025,metal);
    tube([[-.6,.065],[-.5,.10],[-.08,.12],[.12,.11]],-.22,side*1.15,dark,24);
    tube([[.125,.11],[.13,.085],[-.015,.075]],-.22,side*1.15,metal,24);
    const inlet = Array.from({length:24},(_,j) => [-.02,-.22+Math.cos(j*Math.PI/12)*.075,side*1.15+Math.sin(j*Math.PI/12)*.075]);
    add(inlet,[12,24,34]);
    // Landing gear supports the airport turnaround.
    tube([[1.45,.035],[1.49,.035]],-.41,side*.09,metal,8);
    add([[1.45,-.19,side*.09],[1.49,-.19,side*.09],[1.49,-.43,side*.09],[1.45,-.43,side*.09]],metal);
    tube([[-.55,.06],[-.47,.06]],-.43,side*.28,dark,12);
    tube([[1.43,.055],[1.51,.055]],-.43,side*.09,dark,12);
  }
  // Vertical tail: two faces and a beveled edge, rather than a flat sprite.
  const tail = [[-2.4,.14,0],[-2.58,1.03,0],[-2.28,1.03,0],[-1.56,.15,0]];
  add(tail.map(([x,y])=>[x,y,-.035]),dark);
  add(tail.map(([x,y])=>[x,y,.035]).reverse(),dark);
  add([[-2.58,1.03,-.035],[-2.58,1.03,.035],[-2.28,1.03,.035],[-2.28,1.03,-.035]],metal);
  for (const s of [-1,1]) add([[-2.35,.35,s*.037],[-2.44,.81,s*.037],[-2.32,.74,s*.037],[-2.17,.35,s*.037]],red,true);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const smooth = t => t*t*(3-2*t);
  function heading(phase) {
    if (phase < .46) return 0;
    if (phase < .49) return -Math.PI*smooth((phase-.46)/.03);
    if (phase < .96) return -Math.PI;
    if (phase < .99) return -Math.PI-Math.PI*smooth((phase-.96)/.03);
    return -Math.PI*2;
  }
  function draw(yaw) {
    ctx.clearRect(0,0,720,288);
    const c=Math.cos(yaw), s=Math.sin(yaw), tilt=.24;
    const rotate = ([x,y,z]) => {
      const xx=x*c+z*s, zz=-x*s+z*c;
      return [xx,y*Math.cos(tilt)-zz*Math.sin(tilt),y*Math.sin(tilt)+zz*Math.cos(tilt)];
    };
    const project = ([x,y,z]) => { const k=125*12/(12-z); return [360+x*k,187-y*k]; };
    const sorted = faces.map(face => {
      const points=face.points.map(rotate);
      return {...face,points,depth:points.reduce((v,p)=>v+p[2],0)/points.length};
    }).sort((a,b)=>a.depth-b.depth);
    for (const f of sorted) {
      let normal=cross(sub(f.points[1],f.points[0]),sub(f.points[2],f.points[0]));
      const length=Math.hypot(...normal)||1;
      normal=normal.map(v=>v/length);
      // Two-sided lighting also covers the hand-built thin wing surfaces.
      if(normal[2]<0) normal=normal.map(v=>-v);
      const light=f.detail ? .92 : .46+.54*Math.max(0,normal[0]*-.3+normal[1]*.75+normal[2]*.59);
      const rgb=f.color.map(v=>Math.min(255,Math.round(v*light)));
      ctx.fillStyle=`rgb(${rgb.join(',')})`;
      ctx.beginPath();
      f.points.forEach((p,i) => { const q=project(p); if(i)ctx.lineTo(...q);else ctx.moveTo(...q); });
      ctx.closePath(); ctx.fill();
      // Matching fine strokes close subpixel seams between adjacent facets.
      ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=.45; ctx.stroke();
    }
  }
  let last=0, lastYaw=null;
  function frame(now) {
    if (now-last>32 && !document.hidden) {
      const flight=aircraft.getAnimations().find(a=>a.animationName==='flight-position');
      const phase=flight ? Number(flight.effect.getComputedTiming().progress||0) : 0;
      const yaw=motion.matches ? -.5 : heading(phase);
      // Cruise and pause keep the same angle; avoid repainting an unchanged mesh.
      if (lastYaw===null || Math.abs(yaw-lastYaw)>.0001) {
        draw(yaw); lastYaw=yaw;
      }
      last=now;
    }
    requestAnimationFrame(frame);
  }
  draw(0); requestAnimationFrame(frame);
})();

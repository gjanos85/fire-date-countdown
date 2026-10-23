/* Original, dependency-free WebGL airliner. Every view is the same solid model. */
(() => {
  'use strict';
  const canvas = document.querySelector('.aircraft-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) { canvas.hidden = true; return; }
  const vertexSource = `
    attribute vec3 position, normal, colour;
    attribute vec2 uv;
    attribute float material;
    uniform mat4 model, view, projection;
    varying vec3 vNormal, vColour, vPosition;
    varying vec2 vUV;
    varying float vMaterial;
    void main() {
      vec4 p = model * vec4(position, 1.0);
      vPosition = p.xyz; vNormal = mat3(model) * normal;
      vColour = colour; vUV = uv; vMaterial = material;
      gl_Position = projection * view * p;
    }`;
  const fragmentSource = `
    precision mediump float;
    uniform sampler2D livery;
    varying vec3 vNormal, vColour, vPosition;
    varying vec2 vUV;
    varying float vMaterial;
    void main() {
      vec3 base = vMaterial > .5 ? texture2D(livery, vUV).rgb : vColour;
      vec3 n = normalize(vNormal);
      vec3 light = normalize(vec3(-.35, .85, 1.2));
      vec3 eye = normalize(vec3(0., 3.5, 14.) - vPosition);
      float diffuse = max(dot(n, light), 0.);
      float shine = pow(max(dot(reflect(-light, n), eye), 0.), 42.);
      float sky = max(n.y, 0.);
      vec3 lit = base * (.48 + .48 * diffuse + .12 * sky);
      lit += vec3(.62, .77, .88) * shine * .28;
      gl_FragColor = vec4(lit, 1.);
    }`;
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const vertices = [];
  const white = [.9, .95, .98], metal = [.5, .64, .74], dark = [.065, .085, .11], red = [.9, .07, .12];
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const unit = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };
  function vertex(p, n, c, uv = [0, 0], mat = 0) { vertices.push(...p, ...n, ...c, ...uv, mat); }
  function triangle(a, b, c, colour, normals, uvs, mat = 0) {
    const n = unit(cross(sub(b, a), sub(c, a)));
    [a,b,c].forEach((p,i) => vertex(p, normals ? normals[i] : n, colour, uvs ? uvs[i] : [0,0], mat));
  }
  function quad(a,b,c,d,colour) { triangle(a,b,c,colour); triangle(a,c,d,colour); }
  // Closed, solid aerofoils: separate upper/lower surfaces and visible thickness.
  function solid(points, thickness, colour) {
    const top = points.map(p => [p[0], p[1] + thickness / 2, p[2]]);
    const bottom = points.map(p => [p[0], p[1] - thickness / 2, p[2]]);
    for (let i = 1; i < points.length - 1; i++) {
      let n=unit(cross(sub(top[i],top[0]),sub(top[i+1],top[0])));
      if(n[1]<0)n=n.map(v=>-v);
      triangle(top[0], top[i+1], top[i], colour,[n,n,n]);
      const down=n.map(v=>-v);
      triangle(bottom[0], bottom[i], bottom[i+1], colour.map(v => v * .72),[down,down,down]);
    }
    points.forEach((_, i) => { const j=(i+1)%points.length; quad(top[i],top[j],bottom[j],bottom[i],metal); });
  }
  // Rounded fuselage surface along the aircraft's longitudinal axis.
  function tube(sections, cy, cz, colour, textured = false, segments = 40) {
    for (let s=0;s<sections.length-1;s++) {
      const [x0,r0] = sections[s], [x1,r1] = sections[s+1];
      const slope = (r1-r0)/(x1-x0 || .001);
      for(let j=0;j<segments;j++) {
        const a=j/segments*Math.PI*2, b=(j+1)/segments*Math.PI*2;
        const p=(x,r,t)=>[x,cy+r*Math.cos(t),cz+r*Math.sin(t)];
        const n=t=>unit([-slope,Math.cos(t),Math.sin(t)]);
        const uv=(x,t)=>[(x+4.8)/9.6,t/(Math.PI*2)];
        const p0=p(x0,r0,a),p1=p(x1,r1,a),p2=p(x1,r1,b),p3=p(x0,r0,b);
        triangle(p0,p1,p2,colour,[n(a),n(a),n(b)],[uv(x0,a),uv(x1,a),uv(x1,b)],textured?1:0);
        triangle(p0,p2,p3,colour,[n(a),n(b),n(b)],[uv(x0,a),uv(x1,b),uv(x0,b)],textured?1:0);
      }
    }
  }
  function box(x,y,z,sx,sy,sz,colour) {
    const p=[]; for(let i=0;i<8;i++) p.push([x+(i&1?sx:-sx)/2,y+(i&2?sy:-sy)/2,z+(i&4?sz:-sz)/2]);
    [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]].forEach(f=>quad(...f.map(i=>p[i]),colour));
  }
  function wingEngine(side) {
    const cy=-.40,cz=side*1.9;
    box(-.25,-.27,cz,.34,.27,.10,metal);
    tube([[-.78,.10],[-.65,.17],[.1,.23],[.46,.225],[.58,.205]],cy,cz,dark);
    tube([[.59,.205],[.60,.176],[.56,.158],[.38,.145]],cy,cz,[.66,.74,.8]);
    for(let i=0;i<24;i++) {
      const a=i/24*2*Math.PI,b=(i+1)/24*2*Math.PI;
      triangle([.37,cy,cz],[.37,cy+.145*Math.cos(a),cz+.145*Math.sin(a)],
        [.37,cy+.145*Math.cos(b),cz+.145*Math.sin(b)],[.08,.13,.18]);
    }
    tube([[.37,.036],[.47,.005]],cy,cz,metal,false,16);
  }
  const leaf = [[0,1],[.18,.55],[.36,.68],[.29,.25],[.64,.47],[.65,.19],[.92,.15],[.52,-.26],[.6,-.43],[.12,-.35],[.15,-.78],[-.15,-.78],[-.12,-.35],[-.6,-.43],[-.52,-.26],[-.92,.15],[-.65,.19],[-.64,.47],[-.29,.25],[-.36,.68],[-.18,.55]];
  function finLogo(z) {
    const cx=-3.93,cy=1.4,r=.29;
    for(let i=0;i<48;i++) {
      const a=i/48*2*Math.PI,b=(i+1)/48*2*Math.PI;
      quad([cx+r*Math.cos(a),cy+r*Math.sin(a),z],[cx+r*Math.cos(b),cy+r*Math.sin(b),z],
        [cx+(r-.025)*Math.cos(b),cy+(r-.025)*Math.sin(b),z],[cx+(r-.025)*Math.cos(a),cy+(r-.025)*Math.sin(a),z],red);
    }
    leaf.forEach((p,i)=>{const q=leaf[(i+1)%leaf.length]; triangle([cx,cy,z],[cx+p[0]*.22,cy+p[1]*.22,z],[cx+q[0]*.22,cy+q[1]*.22,z],red);});
  }
  // Continuous fuselage: 16 longitudinal stations, 48 points around each ring.
  tube([[-4.75,.015],[-4.5,.13],[-4.05,.29],[-3.4,.46],[-2.6,.57],[-1.7,.61],[0,.62],[1.8,.62],[2.75,.6],[3.3,.53],[3.7,.42],[4,.31],[4.3,.19],[4.49,.08],[4.57,.015]],0,0,white,true,48);
  for(const side of [-1,1]) {
    solid([[.9,-.12,side*.4],[-1.1,-.18,side*.45],[-2.55,.18,side*4.25],[-1.85,.24,side*4.3]],.10,white);
    // Upright raked winglets and narrow flap divisions.
    solid([[-2.55,.18,side*4.25],[-1.85,.24,side*4.3],[-2.05,.72,side*4.46],[-2.4,.65,side*4.43]],.035,dark);
    for(let i=0;i<3;i++) {
      const z=side*(1.4+i*.7),x=-.9-i*.3;
      solid([[x,-.11,z],[x-.06,-.11,z],[x-.55,.1,z+side*.62],[x-.49,.1,z+side*.62]],.013,metal);
    }
    solid([[-2.95,.26,side*.25],[-4.18,.25,side*.3],[-4.55,.5,side*1.8],[-3.96,.55,side*1.83]],.065,white);
    wingEngine(side);
    box(-2.35,.23,side*4.32,.08,.07,.08,side>0?[.12,.9,.5]:[1,.07,.1]);
  }
  // Extruded vertical fin, with an actual maple leaf on both faces.
  const fin=[[-3.35,.35,0],[-4.52,.32,0],[-4.43,2.16,0],[-3.95,2.18,0],[-2.77,.43,0]];
  const f0=fin.map(p=>[p[0],p[1],-.055]), f1=fin.map(p=>[p[0],p[1],.055]);
  for(let i=1;i<fin.length-1;i++){triangle(f0[0],f0[i],f0[i+1],dark);triangle(f1[0],f1[i+1],f1[i],dark);}
  fin.forEach((_,i)=>{const j=(i+1)%fin.length;quad(f0[i],f0[j],f1[j],f1[i],[.2,.26,.3]);});
  finLogo(.058);finLogo(-.058);
  const bodyCount=vertices.length/12;
  // Gear is a separate draw range so it retracts during cruise.
  [[2.95,-.88,0],[-.65,-.94,-.48],[-.65,-.94,.48]].forEach(([x,y,z])=>{
    box(x,y+.2,z,.07,.45,.07,metal);
    box(x,y-.02,z,.28,.27,.18,dark);
    box(x,y-.02,z+.095,.10,.10,.015,metal);
  });
  const totalCount=vertices.length/12;
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  let offset=0;
  [['position',3],['normal',3],['colour',3],['uv',2],['material',1]].forEach(([name,size])=>{
    const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,48,offset*4);offset+=size;
  });
  // The livery is painted locally onto the round fuselage, not overlaid in screen space.
  const paint=document.createElement('canvas');paint.width=1024;paint.height=256;
  const ctx=paint.getContext('2d');ctx.fillStyle='#f4f7fa';ctx.fillRect(0,0,1024,256);
  ctx.fillStyle='#101820';ctx.fillRect(0,103,1024,50);
  function roundel(x,y,r) {
    ctx.strokeStyle='#e32332';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#e32332';ctx.beginPath();leaf.forEach((p,i)=>i?ctx.lineTo(x+p[0]*r*.75,y-p[1]*r*.75):ctx.moveTo(x+p[0]*r*.75,y-p[1]*r*.75));ctx.closePath();ctx.fill();
  }
  function sidePaint(far) {
    ctx.save();if(far){ctx.translate(0,256);ctx.scale(1,-1);}
    ctx.fillStyle='#162c40';
    for(let x=195;x<825;x+=26){ctx.beginPath();ctx.roundRect(x,39,10,8,3);ctx.fill();}
    // Wraparound black cockpit mask follows the nose curvature on both sides.
    ctx.fillStyle='#0c141c';ctx.beginPath();ctx.moveTo(854,28);ctx.lineTo(920,30);ctx.lineTo(973,45);ctx.lineTo(863,51);ctx.closePath();ctx.fill();
    ctx.fillStyle='#83a5bb';ctx.beginPath();ctx.moveTo(864,32);ctx.lineTo(894,34);ctx.lineTo(910,45);ctx.lineTo(869,47);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(902,34);ctx.lineTo(919,36);ctx.lineTo(952,45);ctx.lineTo(920,45);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#8094a3';ctx.lineWidth=1.6;[166,830].forEach(x=>{ctx.strokeRect(x,45,15,35);});
    ctx.save();if(far){ctx.translate(1020,0);ctx.scale(-1,1);}
    ctx.font='bold 21px Arial';ctx.fillStyle='#121920';ctx.fillText('AIR CANADA',330,31);ctx.restore();
    roundel(730,24,9);ctx.restore();
  }
  sidePaint(false);sidePaint(true);
  const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,paint);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
  gl.uniform1i(gl.getUniformLocation(program,'livery'),0);
  function multiply(a,b) {
    const out=new Float32Array(16);
    for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];
    return out;
  }
  function lookAt(eye,target) {
    const z=unit(sub(eye,target)),x=unit(cross([0,1,0],z)),y=cross(z,x),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
    return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
  }
  const view=lookAt([0,3.5,14],[0,.35,0]);
  const projection=new Float32Array([1/5.25,0,0,0,0,1/2.1,0,0,0,0,-2/49.9,0,0,0,-50.1/49.9,1]);
  gl.uniformMatrix4fv(gl.getUniformLocation(program,'view'),false,view);
  gl.uniformMatrix4fv(gl.getUniformLocation(program,'projection'),false,projection);
  const modelUniform=gl.getUniformLocation(program,'model');
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
  const stage=document.querySelector('.journey-stage'),plane=document.querySelector('.airplane');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let lastPose='',lastFrame=0,dirty=true;
  new ResizeObserver(()=>{dirty=true;}).observe(canvas);
  motion.addEventListener('change',()=>{dirty=true;});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();});
  function interpolate(p,keys) {
    for(let i=1;i<keys.length;i++)if(p<=keys[i][0]){const [a,av]=keys[i-1],[b,bv]=keys[i];return av+(bv-av)*(p-a)/(b-a);}
    return keys[keys.length-1][1];
  }
  function draw(now) {
    requestAnimationFrame(draw);
    if(document.hidden || now-lastFrame<1000/45 || gl.isContextLost())return;
    lastFrame=now;
    const master=plane.getAnimations().find(a=>a.animationName==='flight-position');
    const p=motion.matches?23:(master?.effect.getComputedTiming().progress??0)*100;
    const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
    let yaw=p<46?0:p<49?-Math.PI*ease((p-46)/3):p<96?-Math.PI:p<99?-Math.PI*(1+ease((p-96)/3)):-Math.PI*2;
    const pitch=interpolate(p,[[0,0],[.5,0],[5,.14],[9,.14],[18,0],[31,0],[39,-.06],[44,0],[50,0],[55,.14],[59,.14],[68,0],[81,0],[89,-.06],[94,0],[100,0]]);
    const gear=motion.matches?0:interpolate(p,[[0,1],[5,1],[11,0],[34,0],[40,1],[55,1],[61,0],[84,0],[90,1],[100,1]]);
    const pose=`${yaw.toFixed(5)}:${pitch.toFixed(5)}:${gear.toFixed(4)}`;
    if(pose===lastPose&&!dirty)return;
    lastPose=pose;dirty=false;
    const dpr=Math.min(devicePixelRatio||1,2.5),w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);
    const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const ry=new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);
    const rz=new Float32Array([cp,sp,0,0,-sp,cp,0,0,0,0,1,0,0,0,0,1]);
    const modelMatrix=multiply(ry,rz);
    gl.uniformMatrix4fv(modelUniform,false,modelMatrix);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES,0,bodyCount);
    if(gear>.01){
      const gearMatrix=new Float32Array([1,0,0,0,0,gear,0,0,0,0,1,0,0,-.5*(1-gear),0,1]);
      gl.uniformMatrix4fv(modelUniform,false,multiply(modelMatrix,gearMatrix));
      gl.drawArrays(gl.TRIANGLES,bodyCount,totalCount-bodyCount);
    }
    stage.dataset.aircraft='3d';
  }
  requestAnimationFrame(draw);
})();

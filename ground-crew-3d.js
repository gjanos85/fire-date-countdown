/* Shaded articulated ground crew, projected from solid 3D geometry. */
(() => {
  'use strict';
  const plane=document.querySelector('.airplane');
  const canvases=[...document.querySelectorAll('.crew-canvas')];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  if(!plane||!canvases.length)return;
  const people=canvases.map(canvas=>({canvas,ctx:canvas.getContext('2d'),canada:canvas.closest('.ground-crew').classList.contains('crew-canada'),pose:''}));
  const navy=[37,66,91],skin=[224,165,120],vest=[239,190,53],reflective=[231,247,234],helmet=[217,51,51],boots=[22,34,46];
  const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const normalize=a=>{const length=Math.hypot(...a)||1;return a.map(v=>v/length);};
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function model(phase,time){
    const faces=[];
    const add=(points,color)=>faces.push({points,color});
    const pushing=smooth((phase-45.5)/.8)*(1-smooth((phase-49)/.8));
    const turning=smooth((phase-49)/1.2);
    const stride=Math.sin(time*Math.PI*2/480)*(1-pushing)*(1-Math.sin(turning*Math.PI));
    const lean=.17*pushing;
    function ellipsoid(center,radii,color,rings=6,segments=10){
      const point=(i,j)=>{
        const latitude=-Math.PI/2+i/rings*Math.PI,longitude=j/segments*Math.PI*2;
        return [center[0]+radii[0]*Math.cos(latitude)*Math.cos(longitude),center[1]+radii[1]*Math.sin(latitude),center[2]+radii[2]*Math.cos(latitude)*Math.sin(longitude)];
      };
      for(let i=0;i<rings;i++)for(let j=0;j<segments;j++)add([point(i,j),point(i,j+1),point(i+1,j+1),point(i+1,j)],color);
    }
    function block(center,size,color){
      const p=Array.from({length:8},(_,i)=>center.map((v,axis)=>v+((i>>axis)&1?1:-1)*size[axis]/2));
      [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]].forEach(f=>add(f.map(i=>p[i]),color));
    }
    function limb(a,b,r,color){
      const axis=normalize(subtract(b,a)),u=normalize(cross(axis,Math.abs(axis[0])<.8?[1,0,0]:[0,1,0])),v=cross(axis,u);
      const rings=[[0,.35],[.08,.85],[.25,1],[.75,1],[.92,.85],[1,.35]];
      const ring=([t,scale],j)=>{const angle=j/8*Math.PI*2;return a.map((n,i)=>n+(b[i]-n)*t+r*scale*(Math.cos(angle)*u[i]+Math.sin(angle)*v[i]));};
      for(let i=0;i<rings.length-1;i++)for(let j=0;j<8;j++)add([ring(rings[i],j),ring(rings[i],j+1),ring(rings[i+1],j+1),ring(rings[i+1],j)],color);
    }
    // Hips, bent knees, independently swinging legs, and rounded work boots.
    block([0,1.06,0],[.46,.25,.33],navy);
    for(const side of [-1,1]){
      const step=stride*side,hip=[side*.16,1.06,0];
      const knee=[side*.18,.57+Math.max(0,-step)*.07,step*.22+(side*.07*pushing)];
      const ankle=[side*.2,.16+Math.max(0,step)*.08,step*.36+(side*.1*pushing)];
      limb(hip,knee,.13,navy);limb(knee,ankle,.105,[29,48,67]);
      ellipsoid([ankle[0],.11+Math.max(0,step)*.08,ankle[2]+.09],[.14,.105,.24],boots,4,8);
      block([ankle[0],.035+Math.max(0,step)*.08,ankle[2]+.08],[.27,.035,.41],[12,23,33]);
    }
    // Navy jacket and a dimensional safety vest, with reflective strips on both sides.
    block([0,1.48,0],[.56,.68,.34],navy);
    block([0,1.49,.012],[.59,.64,.37],vest);
    for(const side of [-1,1]){
      block([side*.18,1.51,.202],[.055,.58,.018],reflective);
      block([side*.18,1.51,-.184],[.055,.58,.018],reflective);
    }
    block([0,1.3,.21],[.57,.065,.018],reflective);
    block([0,1.3,-.19],[.57,.065,.018],reflective);
    block([0,1.63,.215],[.06,.11,.035],[41,58,67]);
    limb([0,1.83,0],[0,1.98,0],.085,skin);
    // A rounded face, nose, eyes, helmet brim, and hearing protection.
    ellipsoid([0,2.18,.02],[.22,.27,.215],skin);
    ellipsoid([0,2.17,.24],[.065,.07,.085],skin,4,8);
    for(const side of [-1,1]){
      ellipsoid([side*.083,2.23,.217],[.026,.029,.013],[21,37,48],3,6);
      ellipsoid([side*.235,2.19,-.005],[.067,.13,.105],[35,48,57],4,8);
      block([side*.235,2.2,-.005],[.14,.09,.095],[77,99,112]);
    }
    block([0,2.065,.217],[.075,.018,.013],[117,66,50]);
    ellipsoid([0,2.39,.015],[.27,.15,.25],helmet,5,12);
    block([0,2.33,.1],[.57,.042,.5],helmet);
    block([0,2.39,.247],[.1,.08,.015],reflective);
    // Shoulders, elbows and gloved hands articulate independently while pushing.
    for(const side of [-1,1]){
      const swing=-stride*side;
      const shoulder=[side*.34,1.76,0];
      const elbow=[side*.36,1.43+(1.40-1.43)*pushing,swing*.12+(.38-swing*.12)*pushing];
      const hand=[side*.33,1.15+(1.0-1.15)*pushing,swing*.25+(.75-swing*.25)*pushing];
      ellipsoid(shoulder,[.13,.14,.13],navy,4,8);
      limb(shoulder,elbow,.1,navy);limb(elbow,hand,.085,navy);
      ellipsoid(hand,[.09,.105,.115],[218,230,228],4,8);
      block([hand[0],hand[1],hand[2]+.09],[.11,.14,.04],[238,245,239]);
    }
    const yaw=-Math.PI/2+Math.PI*turning,c=Math.cos(yaw),s=Math.sin(yaw),tilt=.10;
    const rotate=point=>{
      let [x,y,z]=point;
      if(y>1.05){const dy=y-1.05;[y,z]=[1.05+dy*Math.cos(lean)-z*Math.sin(lean),dy*Math.sin(lean)+z*Math.cos(lean)];}
      const xx=x*c+z*s,zz=-x*s+z*c;
      return [xx,y*Math.cos(tilt)-zz*Math.sin(tilt),y*Math.sin(tilt)+zz*Math.cos(tilt)];
    };
    return faces.map(f=>{const points=f.points.map(rotate);return {...f,points,depth:points.reduce((sum,p)=>sum+p[2],0)/points.length};}).sort((a,b)=>a.depth-b.depth);
  }
  function paint(person,phase,time){
    const {canvas,ctx}=person;if(!ctx)return;
    const ratio=Math.min(devicePixelRatio||1,2.5),w=Math.round(canvas.clientWidth*ratio),h=Math.round(canvas.clientHeight*ratio);
    if(!w||!h)return;
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#04132955';ctx.beginPath();ctx.ellipse(w*.5,h*.97,w*.26,h*.025,0,0,Math.PI*2);ctx.fill();
    const scale=h/2.7;
    for(const face of model(phase,time)){
      let n=normalize(cross(subtract(face.points[1],face.points[0]),subtract(face.points[2],face.points[0])));
      if(n[2]<0)n=n.map(v=>-v);
      const light=.48+.52*Math.max(0,n[0]*-.35+n[1]*.7+n[2]*.62);
      ctx.fillStyle=`rgb(${face.color.map(v=>Math.round(Math.min(255,v*light))).join(',')})`;
      ctx.beginPath();face.points.forEach((p,i)=>{const x=w*.5+p[0]*scale,y=h*.97-p[1]*scale;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      ctx.closePath();ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.35;ctx.stroke();
    }
  }
  let last=0;
  function frame(now){
    requestAnimationFrame(frame);
    if(document.hidden||motion.matches||now-last<1000/30)return;
    last=now;
    const flight=plane.getAnimations().find(a=>a.animationName==='flight-position');
    const phase=(flight?.effect.getComputedTiming().progress??0)*100,time=Number(flight?.currentTime||0);
    for(const person of people){
      const p=(phase+(person.canada?50:0))%100;
      if(p<41||p>55.5)continue;
      const key=`${p.toFixed(4)}:${person.canvas.clientWidth}`;
      if(key===person.pose)continue;
      person.pose=key;paint(person,p,time);
    }
  }
  requestAnimationFrame(frame);
})();

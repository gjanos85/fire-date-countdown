/* Shaded articulated ground crew, projected from solid 3D geometry. */
(() => {
  'use strict';
  const plane=document.querySelector('.airplane');
  const canvases=[...document.querySelectorAll('.crew-canvas')];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  if(!plane||!canvases.length)return;
  const people=canvases.map(canvas=>({canvas,ctx:canvas.getContext('2d'),canada:canvas.closest('.ground-crew').classList.contains('crew-canada'),pose:''}));
  const navy=[47,79,105],skin=[232,178,133],vest=[255,153,40],reflective=[238,252,226],helmet=[237,68,53],boots=[36,45,54];
  const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const normalize=a=>{const length=Math.hypot(...a)||1;return a.map(v=>v/length);};
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function model(phase,time){
    const faces=[];
    const add=(points,color)=>faces.push({points,color});
    const pushing=smooth((phase-45.5)/.8)*(1-smooth((phase-49)/.8));
    const turning=smooth((phase-49)/1.2);
    // No walking during the planted half-turn. The same forward gait is
    // rotated with the body before the outside-bound exit (Canada mirrors it).
    const walk=(1-smooth((phase-45.2)/.4))+smooth((phase-50.2)/.5);
    const cycle=time*Math.PI*2/620;
    const stride=Math.sin(cycle)*walk;
    const lean=.19*pushing;
    const bob=Math.abs(Math.sin(cycle))*.025*walk;
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
    function tailored(profile,color){
      const ring=([y,rx,rz],j)=>{const a=j/12*Math.PI*2;return [Math.cos(a)*rx,y,Math.sin(a)*rz];};
      for(let i=0;i<profile.length-1;i++)for(let j=0;j<12;j++)add([ring(profile[i],j),ring(profile[i],j+1),ring(profile[i+1],j+1),ring(profile[i+1],j)],color);
    }
    function limb(a,b,r,color){
      const axis=normalize(subtract(b,a)),u=normalize(cross(axis,Math.abs(axis[0])<.8?[1,0,0]:[0,1,0])),v=cross(axis,u);
      const rings=[[0,.35],[.08,.85],[.25,1],[.75,1],[.92,.85],[1,.35]];
      const ring=([t,scale],j)=>{const angle=j/8*Math.PI*2;return a.map((n,i)=>n+(b[i]-n)*t+r*scale*(Math.cos(angle)*u[i]+Math.sin(angle)*v[i]));};
      for(let i=0;i<rings.length-1;i++)for(let j=0;j<8;j++)add([ring(rings[i],j),ring(rings[i],j+1),ring(rings[i+1],j+1),ring(rings[i+1],j)],color);
    }
    // Long trouser legs, bent knees and a lifted swing foot. The support foot
    // stays grounded; boot soles point in the direction the worker is facing.
    ellipsoid([0,1.03,0],[.235,.19,.17],navy,4,10);
    for(const side of [-1,1]){
      const step=stride*side,lift=Math.max(0,Math.cos(cycle+(side<0?Math.PI:0)))*.12*walk;
      const hip=[side*.145,1.06,0];
      const knee=[side*.16,.59+lift*.35,step*.12+.11+(side*.045*pushing)];
      const ankle=[side*.18,.17+lift,step*.31+(side*.16*pushing)];
      limb(hip,knee,.115,navy);limb(knee,ankle,.092,[36,61,84]);
      ellipsoid([knee[0],knee[1],knee[2]+.07],[.085,.115,.035],[31,51,68],4,8);
      limb([ankle[0],ankle[1]+.11,ankle[2]],[ankle[0],ankle[1]+.155,ankle[2]],.099,reflective);
      ellipsoid([ankle[0],.105+lift,ankle[2]+.085],[.115,.10,.21],boots,4,10);
      block([ankle[0],.027+lift,ankle[2]+.075],[.22,.035,.37],[16,25,33]);
      block([ankle[0],.15+lift,ankle[2]+.18],[.12,.022,.055],[121,137,145]);
    }
    // Tapered jacket/vest rather than a cuboid torso: shoulders, waist, collar,
    // orange edging, reflective harness, pockets, radio and a utility belt.
    tailored([[1.13,.22,.155],[1.3,.235,.18],[1.64,.28,.19],[1.79,.245,.15],[1.85,.12,.095]],navy);
    tailored([[1.15,.235,.17],[1.28,.25,.19],[1.63,.29,.205],[1.77,.26,.165],[1.80,.20,.13]],vest);
    for(const side of [-1,1]){
      block([side*.16,1.49,.192],[.055,.55,.022],reflective);
      block([side*.16,1.49,-.192],[.055,.55,.022],reflective);
      block([side*.16,1.255,.196],[.12,.105,.025],[210,111,31]);
      block([side*.16,1.30,.214],[.12,.018,.015],[255,189,77]);
    }
    block([0,1.39,.207],[.52,.055,.018],reflective);
    block([0,1.39,-.207],[.52,.055,.018],reflective);
    block([0,1.49,.215],[.022,.58,.016],[92,72,49]);
    block([0,1.13,0],[.47,.055,.345],[29,40,49]);
    block([0,1.13,.18],[.075,.045,.015],[167,183,187]);
    block([-.19,1.67,.213],[.075,.13,.045],[27,43,54]);
    limb([-.20,1.73,.22],[-.22,1.84,.22],.009,[43,54,63]);
    block([-.19,1.68,.24],[.039,.025,.009],[120,211,204]);
    limb([0,1.82,0],[0,1.99,0],.08,skin);
    // A smaller human-proportioned head, amber safety glasses, sculpted hard
    // hat with a rounded brim/ridge, and padded industrial ear defenders.
    ellipsoid([0,2.155,.02],[.19,.235,.19],skin,7,12);
    ellipsoid([0,2.12,.207],[.049,.06,.061],skin,4,8);
    ellipsoid([0,2.02,.06],[.135,.064,.13],[219,158,119],4,8);
    for(const side of [-1,1]){
      ellipsoid([side*.078,2.19,.186],[.068,.045,.025],[86,65,40],4,8);
      ellipsoid([side*.078,2.198,.207],[.046,.025,.009],[229,181,95],3,8);
      ellipsoid([side*.208,2.16,-.015],[.065,.12,.09],[29,43,54],5,10);
      ellipsoid([side*.23,2.16,-.015],[.043,.085,.065],[233,171,54],4,8);
      limb([side*.21,2.18,-.02],[side*.20,2.35,-.04],.025,[41,57,68]);
    }
    block([0,2.19,.21],[.036,.016,.018],[52,62,64]);
    block([0,2.045,.197],[.065,.014,.01],[124,75,57]);
    ellipsoid([0,2.34,.005],[.235,.16,.225],helmet,6,14);
    ellipsoid([0,2.285,.05],[.27,.028,.285],[249,90,65],3,14);
    ellipsoid([0,2.435,.005],[.034,.075,.19],[255,111,82],4,10);
    block([0,2.35,.221],[.085,.054,.013],reflective);
    // Shoulders, elbows and gloved hands articulate independently while pushing.
    for(const side of [-1,1]){
      const swing=-stride*side;
      const shoulder=[side*.34,1.76,0];
      const elbow=[side*.35,1.43+(1.39-1.43)*pushing,swing*.16+(.36-swing*.16)*pushing];
      const hand=[side*.30,1.14+(.86-1.14)*pushing,swing*.27+(.68-swing*.27)*pushing];
      ellipsoid(shoulder,[.115,.13,.12],navy,4,8);
      limb(shoulder,elbow,.09,navy);limb(elbow,hand,.075,[38,65,90]);
      const cuff=hand.map((n,i)=>n+(elbow[i]-n)*.18);
      limb(cuff,cuff.map((n,i)=>n+(elbow[i]-hand[i])*.09),.081,reflective);
      ellipsoid(hand,[.073,.096,.09],[221,230,218],4,10);
      ellipsoid([hand[0]+side*.055,hand[1]+.025,hand[2]+.04],[.035,.048,.04],[246,244,221],3,8);
      block([hand[0],hand[1]-.015,hand[2]+.077],[.105,.115,.024],[60,82,88]);
    }
    const yaw=-Math.PI/2+Math.PI*turning,c=Math.cos(yaw),s=Math.sin(yaw),tilt=.10;
    const rotate=point=>{
      let [x,y,z]=point;
      if(y>1.05)y+=bob;
      const crouch=.17*pushing,pivot=1.05-crouch;
      y-=crouch*smooth((y-.15)/.5);
      if(y>pivot){const dy=y-pivot;[y,z]=[pivot+dy*Math.cos(lean)-z*Math.sin(lean),dy*Math.sin(lean)+z*Math.cos(lean)];}
      const xx=x*c+z*s,zz=-x*s+z*c;
      return [xx,y*Math.cos(tilt)-zz*Math.sin(tilt),y*Math.sin(tilt)+zz*Math.cos(tilt)];
    };
    return faces.map(f=>{const points=f.points.map(rotate);return {...f,points,depth:points.reduce((sum,p)=>sum+p[2],0)/points.length};}).sort((a,b)=>a.depth-b.depth);
  }
  function paint(person,phase,time){
    const {canvas,ctx}=person;if(!ctx)return;
    const ratio=Math.min(Math.max(devicePixelRatio||1,2),3),w=Math.round(canvas.clientWidth*ratio),h=Math.round(canvas.clientHeight*ratio);
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

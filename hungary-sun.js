/* All sunshine and expressions follow the aircraft's existing flight clock. */
(() => {
  'use strict';
  const sun=document.querySelector('.hungary-sun'),plane=document.querySelector('.airplane');
  if(!sun||!plane)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let previous='',lastFrame=0;
  const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function frame(now){
    requestAnimationFrame(frame);
    if(document.hidden||now-lastFrame<1000/30)return;
    lastFrame=now;
    const flight=plane.getAnimations().find(a=>a.animationName==='flight-position');
    const progress=Number(flight?.effect.getComputedTiming().progress||0);
    const key=motion.matches?'still':progress.toFixed(6);
    if(key===previous)return;
    previous=key;
    const phase=progress*100;
    // Touchdown is 44%; Hungary departure begins at 55.5% of this same loop.
    const smile=motion.matches?0:ease((phase-44)/.9)*(1-ease((phase-55.5)/1.2));
    const pulse=motion.matches?0:Math.sin(progress*Math.PI*2*4);
    const shimmer=motion.matches ? .5 : .5+.15*Math.sin(progress*Math.PI*2*7);
    sun.style.setProperty('--sun-turn',`${motion.matches?12:progress*360}deg`);
    sun.style.setProperty('--sun-scale',String(1+pulse*.012+smile*.018));
    sun.style.setProperty('--sun-bob',`${motion.matches?0:Math.sin(progress*Math.PI*2*2)*.4}px`);
    sun.style.setProperty('--sun-halo',String(1+pulse*.045));
    sun.style.setProperty('--sun-glow',`${21+pulse*2+smile*4}px`);
    sun.style.setProperty('--sun-shimmer',String(shimmer));
    sun.style.setProperty('--sun-smile',String(smile));
    // The entire face is hidden (not merely transparent) before touchdown.
    sun.dataset.welcoming=String(!motion.matches&&phase>=44&&phase<56.7);
  }
  motion.addEventListener('change',()=>{previous='';});
  requestAnimationFrame(frame);
})();

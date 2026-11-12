'use strict';
// KeplerLab: prototipo VISUAL. No calcula órbitas ni magnitudes físicas.
const $ = (id) => document.getElementById(id);
const screens = ['welcome','credits','lab'];
function showScreen(name){
  screens.forEach(id=>{const el=$(id);el.hidden=id!==name;el.classList.toggle('screen-active',id===name);});
  window.scrollTo({top:0,behavior:'instant'});
  if(name!=='lab') pause();
  if(name==='lab') requestAnimationFrame(renderAll);
}
$('startWelcome').addEventListener('click',()=>showScreen('credits'));
$('backWelcome').addEventListener('click',()=>showScreen('welcome'));
$('enterLab').addEventListener('click',()=>showScreen('lab'));
$('backHome').addEventListener('click',()=>showScreen('welcome'));
const defaults={mass:50,distance:65,speed:50};
const state={...defaults,grid:true,path:true,trail:true,running:false,phase:0,elapsed:0,lastFrame:null,history:[]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function setStatus(text,cls=''){$('statusText').textContent=text;$('statusDot').className='status-dot '+cls;}
function updateControls(){
  ['mass','distance','speed'].forEach(id=>{$(id).value=state[id];$(id+'Value').textContent=state[id]+' %';});
  $('showGrid').checked=state.grid;$('showPath').checked=state.path;$('showTrail').checked=state.trail;
  $('amplitudeValue').textContent=state.distance+' %';$('animationValue').textContent=state.speed+' %';
  $('amplitudeBar').style.width=state.distance+'%';$('animationBar').style.width=state.speed+'%';
  $('progressValue').textContent=Math.round((state.phase%(Math.PI*2))/(Math.PI*2)*100)+' %';
  $('progressBar').style.width=((state.phase%(Math.PI*2))/(Math.PI*2)*100)+'%';
  $('explanationText').textContent=`La escala visual del cuerpo central es ${state.mass} %, la amplitud del dibujo es ${state.distance} % y la velocidad de la animación es ${state.speed} %. Estos controles alteran una escena ficticia, no una órbita calculada. La futura versión científica relacionará masa, distancia y velocidad mediante ecuaciones verificadas.`;
  if(!state.running)$('resultMessage').textContent='Parámetros visuales actualizados. Pulsa Iniciar para reproducir la demostración.';
  renderAll();
}
['mass','distance','speed'].forEach(id=>$(id).addEventListener('input',e=>{state[id]=Number(e.target.value);updateControls();}));
[['showGrid','grid'],['showPath','path'],['showTrail','trail']].forEach(([id,key])=>$(id).addEventListener('change',e=>{state[key]=e.target.checked;renderAll();}));
function start(){if(state.running)return;state.running=true;state.lastFrame=null;setStatus('En ejecución','running');$('resultMessage').textContent='Demostración visual en ejecución. No se están calculando magnitudes físicas.';requestAnimationFrame(tick);}
function pause(){state.running=false;state.lastFrame=null;setStatus('En pausa','paused');}
function reset(){pause();state.phase=0;state.elapsed=0;state.history=[];setStatus('Reiniciado');updateControls();$('resultMessage').textContent='Animación reiniciada al estado inicial.';}
$('playBtn').addEventListener('click',start);
$('pauseBtn').addEventListener('click',()=>{pause();$('resultMessage').textContent='Animación pausada. Puedes continuar con Iniciar.';});
$('resetBtn').addEventListener('click',reset);
$('defaultsBtn').addEventListener('click',()=>{Object.assign(state,defaults);reset();$('resultMessage').textContent='Parámetros predeterminados restaurados.';});
function tick(now){if(!state.running)return;const dt=state.lastFrame===null?0:Math.min((now-state.lastFrame)/1000,.05);state.lastFrame=now;
  state.elapsed+=dt;state.phase=(state.phase+dt*(.1+state.speed/100)*1.3)%(Math.PI*2);
  if(state.history.length===0||state.elapsed-state.history[state.history.length-1].t>.06){state.history.push({t:state.elapsed,v:Math.sin(state.phase*2)*.35+Math.sin(state.phase*.7)*.2});if(state.history.length>220)state.history.shift();}
  $('progressValue').textContent=Math.round(state.phase/(Math.PI*2)*100)+' %';$('progressBar').style.width=(state.phase/(Math.PI*2)*100)+'%';
  renderAll();requestAnimationFrame(tick);
}
function prepareCanvas(id){const c=$(id);if(c.closest('[hidden]'))return null;const rect=c.getBoundingClientRect();if(rect.width===0||rect.height===0)return null;const dpr=Math.min(devicePixelRatio||1,2);const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);return {ctx,w:rect.width,h:rect.height};}
function grid(ctx,w,h,step=35){if(!state.grid)return;ctx.strokeStyle='rgba(113,161,232,.10)';ctx.lineWidth=1;ctx.beginPath();for(let x=0;x<w;x+=step){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=0;y<h;y+=step){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();}
function dot(ctx,x,y,r,color,glow=0){ctx.save();ctx.shadowBlur=glow;ctx.shadowColor=color;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
function orbit(){const p=prepareCanvas('orbitCanvas');if(!p)return;const {ctx,w,h}=p;grid(ctx,w,h);const cx=w*.5,cy=h*.5;const rx=Math.min(w*.36,h*.43)*(state.distance/100+.3),ry=rx*.65;
  if(state.path){ctx.strokeStyle='#56e4f6b8';ctx.lineWidth=1.8;ctx.setLineDash([5,7]);ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,-.3,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  ctx.strokeStyle='#607ea544';ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();
  const point=t=>({x:cx+rx*Math.cos(t)*Math.cos(-.3)-ry*Math.sin(t)*Math.sin(-.3),y:cy+rx*Math.cos(t)*Math.sin(-.3)+ry*Math.sin(t)*Math.cos(-.3)});
  if(state.trail){for(let i=0;i<35;i++){const q=point(state.phase-i*.045);ctx.globalAlpha=(1-i/35)*.65;dot(ctx,q.x,q.y,Math.max(1,3-i*.05),'#aa9bff',3);}ctx.globalAlpha=1;}
  const glow=ctx.createRadialGradient(cx,cy,3,cx,cy,48);glow.addColorStop(0,'#ffdd98a0');glow.addColorStop(1,'#ffdd9800');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,48,0,Math.PI*2);ctx.fill();dot(ctx,cx,cy,8+state.mass*.12,'#ffce82',19);
  const q=point(state.phase);dot(ctx,q.x,q.y,8,'#ad9aff',20);dot(ctx,q.x-2,q.y-2,2,'#e4dfff',0);
  ctx.font='11px DM Sans, sans-serif';ctx.fillStyle='#9fb5d6';ctx.fillText('ESCENA ILUSTRATIVA · SIN ESCALA REAL',12,20);ctx.fillStyle='#f9d49c';ctx.fillText('CENTRO',cx+15,cy-13);ctx.fillStyle='#c8bcff';ctx.fillText('OBJETO',q.x+13,q.y-10);
}
function chartBase(ctx,w,h,ylabel){grid(ctx,w,h,35);const L=42,R=w-17,T=18,B=h-31;ctx.strokeStyle='#6683aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L,T);ctx.lineTo(L,B);ctx.lineTo(R,B);ctx.stroke();ctx.fillStyle='#8da3c7';ctx.font='11px DM Sans, sans-serif';ctx.fillText(ylabel,9,15);ctx.fillText('TIEMPO (EJEMPLO)',Math.max(L,R-130),h-10);return {L,R,T,B};}
function wave(){const p=prepareCanvas('waveCanvas');if(!p)return;const {ctx,w,h}=p;const a=chartBase(ctx,w,h,'INDICADOR');ctx.beginPath();for(let i=0;i<=240;i++){const x=a.L+(a.R-a.L)*i/240;const t=i/240*Math.PI*4;const amp=.18+state.distance/100*.23;const y=(a.T+a.B)/2-Math.sin(t+state.phase)*amp*(a.B-a.T)-Math.cos(t*1.7)*.06*(a.B-a.T);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle='#61e7f5';ctx.lineWidth=2.5;ctx.shadowColor='#56ddec';ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0;}
function history(){const p=prepareCanvas('historyCanvas');if(!p)return;const {ctx,w,h}=p;const a=chartBase(ctx,w,h,'HISTORIAL');ctx.beginPath();const vals=state.history.length?state.history:[{v:0}];vals.forEach((item,i)=>{const x=a.L+(a.R-a.L)*(i/Math.max(vals.length-1,1));const y=(a.T+a.B)/2-item.v*(a.B-a.T)*.75;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle='#b5a0ff';ctx.lineWidth=2.4;ctx.shadowColor='#a78bff';ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;if(vals.length<2){ctx.fillStyle='#91a6c9';ctx.font='12px DM Sans';ctx.fillText('Inicia la animación para generar datos ficticios.',a.L+12,(a.T+a.B)/2-15);}}
function renderAll(){if($('lab').hidden)return;orbit();wave();history();}
window.addEventListener('resize',()=>{renderAll();resizeStars();});
// Fondo espacial procedimental, sin imágenes externas ni datos científicos.
const starsCanvas=$('starfield'),starsCtx=starsCanvas.getContext('2d');let stars=[];let sw=0,sh=0;
function resizeStars(){const dpr=Math.min(devicePixelRatio||1,2);sw=innerWidth;sh=innerHeight;starsCanvas.width=Math.round(sw*dpr);starsCanvas.height=Math.round(sh*dpr);starsCtx.setTransform(dpr,0,0,dpr,0,0);stars=Array.from({length:Math.min(240,Math.floor(sw*sh/4500))},()=>({x:Math.random()*sw,y:Math.random()*sh,r:Math.random()*1.5+.25,a:Math.random()*.6+.2,p:Math.random()*6.28}));}
function animateStars(time){starsCtx.clearRect(0,0,sw,sh);for(const s of stars){const alpha=s.a*(.7+.3*Math.sin(time*.0006+s.p));starsCtx.fillStyle=`rgba(170,218,255,${alpha})`;starsCtx.beginPath();starsCtx.arc(s.x,s.y,s.r,0,Math.PI*2);starsCtx.fill();}requestAnimationFrame(animateStars);}
resizeStars();requestAnimationFrame(animateStars);updateControls();

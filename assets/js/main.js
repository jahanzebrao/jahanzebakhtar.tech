/* projects */
const P=[
 {c:"sys",tag:"Fitness",tint:"#fff1e8",col:"#e2581b",t:"Gym Website + Owner Panel",d:"Members see plans and rush hours and join online. The owner panel tracks fees, expired members and check-ins, with one-click WhatsApp fee reminders.",ti:"Members",k:[["Active","312"],["Fees due","18"],["Today","96"]],r:[["Ali R. · Monthly","Paid"],["Sara K. · Quarterly","Due 28 Oct"]],a:"Live demo",href:"https://resplendent-unicorn-79fa4c.netlify.app"},
 {c:"sys",tag:"Fitness",tint:"#fff4e5",col:"#d9480f",t:"Gym Management Software",d:"Online joining, digital membership cards and rush-hour slot booking, plus full software for members, attendance, fees, expenses and trainers.",ti:"Check-ins",k:[["Members","540"],["Slots","6–9 pm"],["Expenses","Rs 92k"]],r:[["Card #0418 · Gold","Active"],["Evening slot · 7 pm","Booked"]],a:"Live demo",href:"https://transcendent-dolphin-2970ab.netlify.app"},
 {c:"sys",tag:"Education",tint:"#eaf0ff",col:"#2563eb",t:"School Management",d:"Admissions, fee vouchers, attendance, exams and result cards. Works fully offline.",ti:"Class 8-B",k:[["Students","642"],["Present","94%"],["Fees","Rs 1.2M"]],r:[["Term 1 results","Published"],["Nov vouchers","Printed"]],a:"Live demo"},
 {c:"sys",tag:"Events",tint:"#fdeef6",col:"#c0287a",t:"Banquet Hall Booking",d:"Customers check available dates, calculate their package price and send a booking request. The owner panel shows every booking and advance in one place.",ti:"December",k:[["Booked","21"],["Open","10"],["Advance","Rs 840k"]],r:[["Walima · Hall A","14 Dec"],["Mehndi · Lawn","16 Dec"]],a:"Live demo",href:"https://rad-cajeta-36bce7.netlify.app/"},
 {c:"sys",tag:"Sports",tint:"#ebf8ee",col:"#16a34a",t:"Padel Court Booking",d:"Hourly court slots, booking requests, member rates and a front-desk schedule.",ti:"Today",k:[["Slots","48"],["Booked","39"],["Courts","4"]],r:[["Court 2 · 9 pm","Confirmed"],["Court 4 · 10 pm","Request"]],a:"Live demo"},
 {c:"sys",tag:"Legal",tint:"#f1eefc",col:"#6d4fd8",t:"Law Office Manager",d:"Hearing diary, cause list matching, client reminders, fees and SECP deadlines.",ti:"Hearings",k:[["Tomorrow","6"],["This week","19"],["Clients","84"]],r:[["SHC · CP 2214/26","Tomorrow"],["Form A · Client Ltd","5 days"]],a:"Coming soon"},
 {c:"sys",tag:"Tax",tint:"#fff1ea",col:"#ff5a1f",t:"FBR Digital Invoicing",d:"Invoices sent to FBR's PRAL API, returning an official number and QR stamp.",ti:"FBR log",k:[["Verified","128"],["Sandbox","8/8"],["Failed","0"]],r:[["INV-1042","Verified"],["INV-1041","Verified"]],a:"Add to my software"},
 {c:"web",tag:"Manufacturer",tint:"#f7efe2",col:"#a3620a",t:"Corrugated Box Maker Site",d:"Immersive site with exploded-view cartons, the plant and box types for every industry.",ti:"Home",k:[["Box types","24"],["Pages","8"],["3D","Yes"]],r:[["Pharma cartons","View"],["Apparel boxes","View"]],a:"Live demo"},
 {c:"web",tag:"Premium packaging",tint:"#fbf3e6",col:"#b4690e",t:"Printed Box Brand Site",d:"Product-first 3D showcase for mango, oil and powder boxes.",ti:"Catalog",k:[["Products","36"],["Finishes","9"],["Quote","1-click"]],r:[["Mango box 5 kg","Quote"],["Oil box 1 L","Quote"]],a:"Live demo"},
 {c:"tool",tag:"Security",tint:"#e8f6ef",col:"#0f9d58",t:"CamWatch",d:"Finds every IP camera on a network and shows which are online, for any brand.",ti:"Network",k:[["Cameras","16"],["Online","15"],["Offline","1"]],r:[["Gate cam · 192.168.1.21","Online"],["Store cam · .34","Offline"]],a:"Ask about it"},
 {c:"tool",tag:"Sales",tint:"#e9f4f8",col:"#0e7490",t:"LeadHunt",d:"Finds businesses that need software, sends paced emails and flags hot leads to call.",ti:"Pipeline",k:[["Leads","420"],["Replied","31"],["Calls","9"]],r:[["Dubai · Distributor","Replied"],["London · Clinic","Emailed"]],a:"Ask about it"}
];
const g=document.getElementById('grid');
g.innerHTML=P.map(p=>`<article class="card" data-c="${p.c}" style="--tint:${p.tint};--c:${p.col}">
 <div class="shot"><div class="mini"><div class="mt">${p.ti}<i>${p.tag}</i></div>
 <div class="mk">${p.k.map(k=>`<div><small>${k[0]}</small><b>${k[1]}</b></div>`).join('')}</div>
 ${p.r.map(r=>`<div class="mr"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}</div></div>
 <div class="cb"><div class="tg">${p.tag}<b>${p.href?'● Live demo':(p.a==='Coming soon'?'Coming soon':(p.c==='tool'?'Internal':'Demo'))}</b></div><h3>${p.t}</h3><p>${p.d}</p>
 ${p.href?`<a href="${p.href}" target="_blank" rel="noopener">${p.a} <span class="arr">↗</span></a>`:`<a href="#contact">${p.a==="Live demo"?"Request a demo":p.a} <span class="arr">→</span></a>`}</div></article>`).join('');

document.querySelectorAll('.filter button').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.filter button').forEach(x=>x.setAttribute('aria-pressed','false'));
 b.setAttribute('aria-pressed','true');
 g.querySelectorAll('.card').forEach(c=>c.hidden=!(b.dataset.f==='all'||c.dataset.c===b.dataset.f));
}));

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* rotating word */
const rot=document.getElementById('rot');let ri=0;
if(!reduce)setInterval(()=>{ri++;rot.style.transition='transform .7s cubic-bezier(.7,0,.2,1)';rot.style.transform=`translateY(-${ri*1.08}em)`;
 if(ri===4)setTimeout(()=>{rot.style.transition='none';rot.style.transform='translateY(0)';ri=0},750)},2400);

/* header + window tilt */
const hd=document.getElementById('hd'),win=document.getElementById('win');
let lastP=-1;
function onScroll(){const y=scrollY;hd.classList.toggle('scrolled',y>10);
 if(!reduce){const p=Math.min(1,y/420);if(p===lastP)return;lastP=p;win.style.transform=`rotateX(${14*(1-p)}deg) scale(${.9+.1*p})`}}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* count up */
function fmt(v,f){return f==='m'?(v/1e6).toFixed(2)+'M':Math.round(v).toLocaleString('en-US')}
function count(el){const n=+el.dataset.n,f=el.dataset.f,t0=performance.now(),dur=1600;
 (function s(t){const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=fmt(n*e,f);if(p<1)requestAnimationFrame(s)})(t0)}
/* dashboard mockup: count-up, chart line and bars wait until the window is on screen, keeping page load light on phones */
if(!reduce&&'IntersectionObserver' in window){win.classList.add('wait');
 const iw=new IntersectionObserver(([e])=>{if(!e.isIntersecting)return;win.classList.remove('wait');win.querySelectorAll('.k [data-n]').forEach(count);iw.disconnect()},{threshold:.2});
 iw.observe(win)}

/* reveal (transform only, content always visible) */
if(!reduce&&'IntersectionObserver' in window){
 /* the observer's first report decides: off screen → arm the slide-in; no getBoundingClientRect, so no forced layout of the whole page */
 const io=new IntersectionObserver(es=>es.forEach(e=>{const el=e.target;
   if(!el.dataset.rv){el.dataset.rv=1;if(!e.isIntersecting){el.classList.add('pre');return}}
   if(e.intersectionRatio>=.12||(e.isIntersecting&&!el.classList.contains('pre'))){el.classList.remove('pre');
    if(el.matches('.nums'))el.querySelectorAll('[data-n]').forEach(count);io.unobserve(el)}}),{threshold:[0,.12]});
 document.querySelectorAll('.rv').forEach(el=>io.observe(el));
 const st=document.getElementById('steps');
 const io2=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){[...st.children].forEach((s,i)=>setTimeout(()=>s.classList.add('on'),i*350));io2.disconnect()}}),{threshold:.4});
 io2.observe(st);
}else document.querySelectorAll('.step').forEach(s=>s.classList.add('on'));

/* 3D orbit chips around portrait: front half passes in front of the photo, back half behind it */
const chips=[...document.querySelectorAll('#chips3 span')],vis=document.getElementById('vis'),v3=document.getElementById('v3');
let vw=vis.clientWidth,vh=vis.clientHeight;
addEventListener('resize',()=>{vw=vis.clientWidth;vh=vis.clientHeight},{passive:true});
const front=[];
function placeChips(t){const w=vw,R=Math.min(w*.5-58,330),cy=vh*.5;
 chips.forEach((c,i)=>{const a=t*0.00025+i/chips.length*Math.PI*2,x=Math.cos(a)*R,z=Math.sin(a)*(w<600?.5:1),y=Math.sin(a)*R*0.22+cy*0.12;
  const s=.78+.28*(z+1)/2;c.style.transform=`translate(-50%,-50%) translate3d(${x}px,${y}px,${z*140}px) scale(${s})`;
  if(front[i]!==z>0){front[i]=z>0;c.style.zIndex=z>0?3:1}c.style.opacity=(.45+.55*(z+1)/2).toFixed(2)});}
placeChips(0);
/* orbit starts once the page has loaded and only runs while the hero is on screen, so phones stay light */
if(!reduce){let on=true,raf=0,t0=0;const loop=t=>{if(!t0)t0=t;placeChips(t-t0);raf=on?requestAnimationFrame(loop):0};
 const start=()=>{raf=requestAnimationFrame(loop);
  if('IntersectionObserver' in window)new IntersectionObserver(([e])=>{on=e.isIntersecting;if(on&&!raf)raf=requestAnimationFrame(loop)}).observe(vis)};
 const idle=()=>('requestIdleCallback' in window?requestIdleCallback(start,{timeout:2500}):setTimeout(start,1200));
 document.readyState==='complete'?idle():addEventListener('load',idle,{once:true})}

/* pointer depth on hero */
const fine=matchMedia('(pointer:fine)').matches;
if(fine&&!reduce){
 vis.addEventListener('pointermove',e=>{const r=vis.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
  v3.style.transform=`rotateY(${px*16}deg) rotateX(${-py*12}deg)`});
 vis.addEventListener('pointerleave',()=>v3.style.transform='');
 /* project cards + about photo tilt */
 const tilt=(el,max,glare)=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
   el.style.transform=`perspective(900px) rotateY(${(px-.5)*max}deg) rotateX(${(.5-py)*max}deg) translateY(-6px)`;
   if(glare){el.style.setProperty('--gx',px*100+'%');el.style.setProperty('--gy',py*100+'%')}});
  el.addEventListener('pointerleave',()=>el.style.transform='')};
 g.querySelectorAll('.card').forEach(c=>tilt(c,8));
 tilt(document.getElementById('pin'),14,true);
 /* magnetic primary buttons */
 document.querySelectorAll('.btn.dark').forEach(b=>{b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();
   b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.18}px,${(e.clientY-r.top-r.height/2)*.25}px)`});
  b.addEventListener('pointerleave',()=>b.style.transform='')});
}

/* copy */
document.querySelectorAll('.copy').forEach(b=>b.addEventListener('click',()=>{
 try{navigator.clipboard.writeText(b.dataset.copy).then(()=>{b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1500)},()=>b.textContent='Select text')}catch(e){b.textContent='Select text'}
}));

/* form: posts to Netlify Forms (a signed webhook then runs netlify/functions/contact-reply.js, which emails the
   client a confirmation); if the post fails, hands the enquiry to WhatsApp so it is never lost */
const f=document.getElementById('f');
f.addEventListener('submit',e=>{e.preventDefault();
 const v=id=>document.getElementById(id).value.trim(),o=document.getElementById('out'),btn=f.querySelector('[type=submit]');o.hidden=false;
 if(!v('nm')||!v('em')||!v('ms')){o.className='msg err';o.textContent='Please add your name, email and a short description of the project.';return}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('em'))){o.className='msg err';o.textContent='Please check your email address, my reply goes there.';return}
 const wa='https://wa.me/923158105115?text='+encodeURIComponent(`Hi Jahanzeb, I'm ${v('nm')}${v('co')?' from '+v('co'):''} (${v('em')}).\nProject: ${v('ty')}\n${v('ms')}`);
 const fallback=()=>{o.className='msg';o.innerHTML='';o.append('Thanks '+v('nm')+'. Tap below to send this on WhatsApp, or email jahanzeb@jahanzebakhtar.tech. I reply within 24 hours. ');
  const a=document.createElement('a');a.href=wa;a.target='_blank';a.rel='noopener';a.textContent='Send on WhatsApp ↗';a.style.cssText='font-weight:700;text-decoration:underline';o.append(a)};
 btn.disabled=true;
 fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(f)).toString()})
  .then(r=>{if(!r.ok)throw 0;o.className='msg';o.textContent=`Thanks ${v('nm')}, your enquiry is in. A confirmation email is on its way to ${v('em')}, and I'll reply within 24 hours.`;f.reset()})
  .catch(fallback).finally(()=>btn.disabled=false);
});

(function () {
 'use strict';
 var clock=document.getElementById('clock');
 function tick(){if(clock)clock.textContent=new Intl.DateTimeFormat('pt-MZ',{timeZone:'Africa/Maputo',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());}
 tick();setInterval(tick,60000);
 var year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
 var nav=document.querySelector('.nav'),progress=document.querySelector('.reading-progress'),scheduled=false;
 function scroll(){scheduled=false;var height=document.documentElement.scrollHeight-innerHeight;if(nav)nav.classList.toggle('is-stuck',scrollY>30);if(progress)progress.style.width=(height>0?Math.min(100,scrollY/height*100):0)+'%';}
 window.addEventListener('scroll',function(){if(!scheduled){scheduled=true;requestAnimationFrame(scroll);}},{passive:true});window.addEventListener('resize',scroll);scroll();
 document.querySelectorAll('.proj__head').forEach(function(btn,index){
  var panel=btn.nextElementSibling;btn.id='project-toggle-'+index;panel.id='project-panel-'+index;
  btn.setAttribute('aria-controls',panel.id);panel.setAttribute('aria-labelledby',btn.id);panel.setAttribute('role','region');panel.inert=true;
  btn.addEventListener('click',function(){var open=btn.getAttribute('aria-expanded')==='true';document.querySelectorAll('.proj__head[aria-expanded="true"]').forEach(function(other){other.setAttribute('aria-expanded','false');other.nextElementSibling.inert=true;});btn.setAttribute('aria-expanded',String(!open));panel.inert=open;});
 });
 if('IntersectionObserver' in window){var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){document.querySelectorAll('.nav__links>a').forEach(function(a){if(a.getAttribute('href')==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}});},{rootMargin:'-20% 0px -60% 0px'});document.querySelectorAll('main>section[id]').forEach(function(s){observer.observe(s);});}
 var viewer=document.getElementById('map-viewer'),viewerContent=document.getElementById('viewer-content');
 document.addEventListener('click',function(event){
  if(event.target.closest('#open-map')){var report=document.querySelector('.gframe.is-active .dash');if(report&&viewer){viewerContent.replaceChildren(report.cloneNode(true));document.getElementById('viewer-title').textContent=report.querySelector('.dash__title').textContent;viewer.showModal();}}
 });
 document.getElementById('close-viewer').addEventListener('click',function(){viewer.close();});
 viewer.addEventListener('close',function(){viewerContent.replaceChildren();});
 viewer.addEventListener('click',function(event){if(event.target===viewer){var r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close();}});
 document.getElementById('copy-email').addEventListener('click',async function(){
  var email='zelio.a.chirindza@gmail.com',status=document.getElementById('copy-status'),copied=false;
  try{await navigator.clipboard.writeText(email);copied=true;}catch(error){var input=document.createElement('textarea');input.value=email;input.style.position='fixed';input.style.opacity='0';input.setAttribute('aria-label','Email para copiar');document.body.appendChild(input);input.select();try{copied=document.execCommand('copy');}catch(ignore){}input.remove();this.focus();}
  status.textContent=copied?'Email copiado.':'Email: '+email;
 });
})();

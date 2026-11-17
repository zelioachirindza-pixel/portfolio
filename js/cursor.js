/* ============================================================
   CURSOR — ponto laranja + rasto fino (nuvem/risco), estilo Tom.
   Só em ponteiros finos (desktop). Respeita reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  if (!window.matchMedia || !matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('has-cursor');

  var dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.appendChild(dot);

  var canvas = document.createElement('canvas');
  canvas.className = 'cursor-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  var pts = [];
  var hidden = true;

  window.addEventListener('mousemove', function (e) {
    var x = e.clientX, y = e.clientY;
    dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    if (hidden) { hidden = false; dot.style.opacity = '1'; }
    pts.push({ x: x, y: y, life: 1 });
    if (pts.length > 70) pts.shift();
  }, { passive: true });

  window.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget) { dot.style.opacity = '0'; hidden = true; }
  });

  /* crescer sobre elementos interactivos */
  var SEL = 'a, button, .w3d-item, .shot, .gtab, .proj__head, input, select, [role="button"]';
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest && e.target.closest(SEL)) dot.classList.add('is-big');
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest && e.target.closest(SEL)) dot.classList.remove('is-big');
  });

  function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (!reduce) {
      ctx.lineCap = 'round';
      for (var i = 1; i < pts.length; i++) {
        var p = pts[i], q = pts[i - 1];
        p.life *= 0.9;
        if (p.life < 0.04) continue;
        ctx.strokeStyle = 'rgba(232,67,31,' + (p.life * 0.55) + ')';
        ctx.lineWidth = p.life * 2.4;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      pts = pts.filter(function (p) { return p.life > 0.04; });
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

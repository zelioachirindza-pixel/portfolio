/* Continuous cylindrical gallery: pointer movement, direct selection and touch drag. */
(function () {
  'use strict';
  var stage = document.getElementById('w3dStage'), track = document.getElementById('w3dTrack');
  if (!stage || !track) return;
  var items = Array.from(track.querySelectorAll('.w3d-item')), n = items.length;
  if (!n) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var title = document.getElementById('w3d-title'), label = document.getElementById('w3d-label');
  var counter = document.getElementById('w3dIndex');
  document.getElementById('w3dTotal').textContent = String(n).padStart(2, '0');
  var position = 0, target = 0, active = -1, velocity = 0;
  var frame = 0, last = 0, visible = false, suspended = 0;
  var drag = null, moved = false, width = 1;
  var viewer = document.getElementById('shots-viewer'), lbIndex = 0;
  function wrap(value) { return (value % n + n) % n; }
  function distance(value) { return wrap(value + n / 2) - n / 2; }
  function translate(text) { return window.PortfolioI18n ? window.PortfolioI18n.t(text) : text; }
  function paint() {
    items.forEach(function (item, i) {
      var off = distance(i - position), abs = Math.abs(off);
      var theta = off * Math.PI / 3, radius = width * .95;
      item.style.transform = 'translate(-50%,-50%) translateX(' + (Math.sin(theta) * radius).toFixed(2) + 'px) translateZ(' + (radius * (1 - Math.cos(theta))).toFixed(2) + 'px) rotateY(' + (-off * 60).toFixed(2) + 'deg)';
      item.style.opacity = abs > 1.7 ? '0' : String(Math.max(0, 1 - Math.max(0, abs - .3) * .25));
      item.style.pointerEvents = abs > 1.5 ? 'none' : 'auto';
      item.style.zIndex = String(50 - Math.round(abs * 10));
      var current = i === wrap(Math.round(position));
      item.classList.toggle('is-active', current);
      item.tabIndex = current ? 0 : -1;
      item.setAttribute('aria-hidden', String(abs > 1.5));
    });
    var current = wrap(Math.round(position));
    if (active !== current) {
      active = current;
      title.textContent = translate(items[active].dataset.name);
      label.textContent = translate(items[active].dataset.label);
      counter.textContent = String(active + 1).padStart(2, '0');
    }
    stage.dataset.position = position.toFixed(3);
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden) { last = 0; return; }
    var dt = last ? Math.min((now - last) / 1000, .05) : .016;
    last = now;
    var moving = velocity && !reduced.matches && !drag && !viewer.open && now > suspended;
    if (moving) target += velocity * dt;
    position = reduced.matches ? target : position + (target - position) * (1 - Math.exp(-dt * 10));
    if (Math.abs(target - position) < .0005) position = target;
    paint();
    if (moving || Math.abs(target - position) > .0005) frame = requestAnimationFrame(tick);
    else last = 0;
  }
  function schedule() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick); }
  function select(index) {
    velocity = 0; suspended = performance.now() + 1200;
    target = position + distance(index - position); schedule();
  }
  items.forEach(function (item, i) {
    item.querySelector('img').draggable = false;
    item.addEventListener('click', function () {
      if (i !== active || Math.abs(target - position) > .05) select(i);
      else openLightbox(i);
    });
  });
  stage.addEventListener('dragstart', function (event) { event.preventDefault(); });
  stage.addEventListener('click', function (event) {
    if (moved) { event.preventDefault(); event.stopImmediatePropagation(); moved = false; }
  }, true);
  stage.addEventListener('pointerdown', function (event) {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { x: event.clientX, target: target }; moved = false; velocity = 0;
  });
  stage.addEventListener('pointermove', function (event) {
    if (drag) {
      var dx = event.clientX - drag.x;
      if (Math.abs(dx) > 6) { moved = true; stage.setPointerCapture(event.pointerId); }
      if (moved) { target = drag.target - dx / (width * .8); schedule(); }
      return;
    }
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    var rect = stage.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width * 2 - 1;
    // A calm centre for inspection; the outer areas move the gallery continuously.
    velocity = Math.abs(x) < .36 ? 0 : Math.sign(x) * Math.pow((Math.abs(x) - .36) / .64, 1.3) * .9;
    if (!velocity) target = Math.round(target);
    schedule();
  });
  function finishDrag() {
    if (!drag) return;
    drag = null; target = Math.round(target); suspended = performance.now() + 600; schedule();
  }
  stage.addEventListener('pointerup', finishDrag);
  stage.addEventListener('pointercancel', function () { finishDrag(); moved = false; });
  stage.addEventListener('lostpointercapture', finishDrag);
  stage.addEventListener('pointerleave', function () { velocity = 0; if (!drag) target = Math.round(target); schedule(); });
  stage.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); select(Math.round(target) + (event.key === 'ArrowRight' ? 1 : -1));
    } else if (event.target === stage && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); openLightbox(active);
    }
  });
  stage.addEventListener('wheel', function (event) {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault(); velocity = 0; target += event.deltaX / 600;
    suspended = performance.now() + 600; schedule();
  }, { passive: false });
  function paintLightbox() {
    var item = items[lbIndex], image = viewer.querySelector('.shots-viewer__img');
    image.src = item.dataset.full; image.alt = translate(item.dataset.name);
    viewer.querySelector('[data-v-name]').textContent = translate(item.dataset.name);
    viewer.querySelector('[data-v-tag]').textContent = translate(item.dataset.label);
    viewer.querySelector('[data-v-count]').textContent = (lbIndex + 1) + ' / ' + n;
  }
  function openLightbox(index) {
    if (!viewer || viewer.open) return;
    velocity = 0; target = Math.round(target); lbIndex = index;
    paintLightbox(); viewer.showModal();
  }
  if (viewer) {
    viewer.querySelector('.shots-viewer__close').addEventListener('click', function () { viewer.close(); });
    viewer.addEventListener('click', function (event) { if (event.target === viewer) viewer.close(); });
    viewer.querySelector('.shots-viewer__img').addEventListener('click', function () { lbIndex = wrap(lbIndex + 1); paintLightbox(); });
    viewer.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); event.stopPropagation(); lbIndex = wrap(lbIndex + (event.key === 'ArrowRight' ? 1 : -1)); paintLightbox();
      }
    });
    var swipeX;
    viewer.addEventListener('pointerdown', function (event) { swipeX = event.clientX; });
    viewer.addEventListener('pointerup', function (event) {
      if (event.pointerType !== 'mouse' && Math.abs(event.clientX - swipeX) > 50) { lbIndex = wrap(lbIndex + (event.clientX < swipeX ? 1 : -1)); paintLightbox(); }
    });
    viewer.addEventListener('close', function () { velocity = 0; schedule(); });
  }
  new ResizeObserver(function () { width = items[0].offsetWidth; paint(); schedule(); }).observe(stage);
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (!visible) { velocity = 0; target = Math.round(target); }
    schedule();
  }, { threshold: .05 }).observe(stage);
  document.addEventListener('visibilitychange', function () { if (document.hidden) velocity = 0; schedule(); });
  document.addEventListener('portfolio:language', function () { active = -1; paint(); if (viewer.open) paintLightbox(); });
  reduced.addEventListener('change', function () { velocity = 0; target = Math.round(target); schedule(); });
  width = items[0].offsetWidth; paint();
})();

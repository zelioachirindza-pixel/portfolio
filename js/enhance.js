/* ============================================================
   ENHANCE — lightbox das capturas reais + reveal ao scroll
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Itálico-swash: inclina letras redondas (assinatura Tom) ---------- */
  (function swashHeadings() {
    var SET = 'oOaAgGyYrReE';
    function swash(root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var nodes = [], n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function (node) {
        var p = node.parentNode;
        if (!p || (p.closest && p.closest('.sw, .name-stop, .accent'))) return;
        var txt = node.nodeValue;
        if (!/[oOaAgGyYrReE]/.test(txt)) return;
        var frag = document.createDocumentFragment(), buf = '';
        for (var i = 0; i < txt.length; i++) {
          var ch = txt[i];
          if (SET.indexOf(ch) >= 0) {
            if (buf) { frag.appendChild(document.createTextNode(buf)); buf = ''; }
            var em = document.createElement('i');
            em.className = 'sw'; em.textContent = ch;
            frag.appendChild(em);
          } else { buf += ch; }
        }
        if (buf) frag.appendChild(document.createTextNode(buf));
        p.replaceChild(frag, node);
      });
    }
    function applySwashes() {
    ['.hero2__statement', '.hero__name', '.section-intro h2', '.sig3d__text h2', '#contact-title', '.about__statement h2']
      .forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
          if (!el.dataset.sw) { swash(el); el.dataset.sw = '1'; }
        });
      });
    }
    applySwashes();
    document.addEventListener('portfolio:language', applySwashes);
  })();

  /* ---------- Lightbox das capturas ---------- */
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  var viewer = document.getElementById('shots-viewer');

  if (shots.length && viewer) {
    var vImg = viewer.querySelector('.shots-viewer__img');
    var vName = viewer.querySelector('[data-v-name]');
    var vTag = viewer.querySelector('[data-v-tag]');
    var vCount = viewer.querySelector('[data-v-count]');
    var current = 0;

    var items = shots.map(function (el) {
      return {
        full: el.getAttribute('data-full'),
        name: el.getAttribute('data-name') || '',
        tag: el.getAttribute('data-tag') || ''
      };
    });

    function show(i) {
      current = (i + items.length) % items.length;
      var it = items[current];
      vImg.src = it.full;
      vImg.alt = it.name;
      if (vName) vName.textContent = it.name;
      if (vTag) vTag.textContent = it.tag;
      if (vCount) vCount.textContent = (current + 1) + ' / ' + items.length;
    }

    shots.forEach(function (el, i) {
      el.addEventListener('click', function () {
        show(i);
        if (typeof viewer.showModal === 'function') viewer.showModal();
      });
    });

    viewer.querySelector('.shots-viewer__close').addEventListener('click', function () { viewer.close(); });
    viewer.querySelector('.shots-viewer__nav--prev').addEventListener('click', function () { show(current - 1); });
    viewer.querySelector('.shots-viewer__nav--next').addEventListener('click', function () { show(current + 1); });

    viewer.addEventListener('click', function (e) {
      // fechar ao clicar fora da imagem/controlos
      if (e.target === viewer) viewer.close();
    });

    document.addEventListener('keydown', function (e) {
      if (!viewer.open) return;
      if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  /* ---------- Acento 3D na faixa de assinatura (Calabi-Yau) ---------- */
  if (window.Model3D) {
    var sig = document.getElementById('sig-canvas');
    if (sig) window.Model3D.create(sig, { model: 'mesh', speed: 0.33, interactive: true, dist: -3.4 });
    var heroC = document.getElementById('hero-canvas');
    if (heroC) window.Model3D.create(heroC, { model: 'mesh', speed: 0.18, interactive: true, dist: -4.5 });
  }

  /* ---------- Reveal ao scroll ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var selectors = [
    '.section-head',
    '.realwork .shot',
    '.featured-work .proj',
    '.archive-work .proj',
    '.skills-depth article',
    '.practice article',
    '.expertise > div',
    '.scope-row > *',
    '.contact__grid > *'
  ];

  var targets = [];
  selectors.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { targets.push(el); });
  });

  if (reduce || !('IntersectionObserver' in window)) {
    // sem animação: garantir visibilidade total
    return;
  }

  targets.forEach(function (el) { el.classList.add('reveal-up'); });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      // escalonar entre irmãos do mesmo pai
      var siblings = Array.prototype.slice.call(el.parentNode.children).filter(function (c) {
        return c.classList.contains('reveal-up');
      });
      var idx = siblings.indexOf(el);
      el.style.transitionDelay = (Math.min(idx, 5) * 90) + 'ms';
      el.classList.add('is-visible');
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(function (el) { io.observe(el); });

})();

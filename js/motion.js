/* Scroll colour, native modal navigation, and contact signature. Vanilla JS. */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');
  var headings = [];
  function buildHeadings() {
  headings = [];
  document.querySelectorAll('.hero2__statement, .section-intro h2, .about__statement h2, .sig3d__text h2, #contact-title').forEach(function (heading) {
    // Before enhance.js adds its italic letters: keep each whole word together.
    var walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    var nodes = [], node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function (text) {
      if (text.parentElement.closest('.accent')) return;
      var fragment = document.createDocumentFragment();
      text.textContent.split(/(\s+)/).forEach(function (word) {
        if (!word) return;
        if (/^\s+$/.test(word)) fragment.appendChild(document.createTextNode(word));
        else {
          var span = document.createElement('span');
          span.className = 'scroll-word'; span.textContent = word;
          fragment.appendChild(span);
        }
      });
      text.replaceWith(fragment);
    });
    headings.push({ el: heading, words: Array.from(heading.querySelectorAll('.scroll-word')) });
  });
  }
  buildHeadings();
  document.addEventListener("portfolio:language", function () { buildHeadings(); requestPaint(); });
  var scheduled = false;
  function paint() {
    scheduled = false;
    headings.forEach(function (item) {
      var box = item.el.getBoundingClientRect();
      // Starts near the bottom of the viewport and finishes before the heading leaves it.
      var progress = reduced.matches ? 1 : Math.max(0, Math.min(1, (innerHeight * .94 - box.top) / (innerHeight * .43 + box.height * .45)));
      item.words.forEach(function (word, i) {
        var light = Math.max(0, Math.min(1, progress * (item.words.length + 1) - i));
        word.style.setProperty('--word-light', light.toFixed(3));
      });
    });
  }
  function requestPaint() { if (!scheduled) { scheduled = true; requestAnimationFrame(paint); } }
  addEventListener('scroll', requestPaint, { passive: true });
  addEventListener('resize', requestPaint);
  reduced.addEventListener('change', requestPaint);
  if (document.fonts) document.fonts.ready.then(requestPaint);
  paint();

  var menu = document.getElementById('site-menu');
  var toggle = document.querySelector('.menu-toggle');
  var closeTimer;
  if (menu && toggle && typeof menu.showModal === 'function') {
    document.documentElement.classList.add('has-full-menu');
    function closeMenu() {
      if (!menu.open || menu.classList.contains('is-closing')) return;
      menu.classList.add('is-closing');
      closeTimer = setTimeout(function () { menu.close(); }, reduced.matches ? 0 : 220);
    }
    toggle.addEventListener('click', function () {
      menu.classList.remove('is-closing'); menu.showModal();
      toggle.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('menu-is-open');
    });
    menu.querySelector('.menu-close').addEventListener('click', closeMenu);
    menu.addEventListener('cancel', function (event) { event.preventDefault(); closeMenu(); });
    menu.addEventListener('close', function () {
      clearTimeout(closeTimer); toggle.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('menu-is-open');
      toggle.focus({ preventScroll: true });
    });
    menu.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        var target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        clearTimeout(closeTimer); menu.close();
        history.replaceState(null, '', link.getAttribute('href'));
        target.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
        target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
      });
    });
  }
  if (window.Model3D) {
    var canvas = document.getElementById('contact-canvas');
    if (canvas) window.Model3D.create(canvas, { model: 'mesh', speed: .22, interactive: true, dist: -3.4 });
  }
})();

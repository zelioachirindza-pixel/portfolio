/* Local, reversible PT/EN copy, including newly rendered demo content. */
(function () {
  'use strict';
  var dictionary = window.PORTFOLIO_EN || {}, language = 'pt';
  try { if (localStorage.getItem('portfolio-language') === 'en') language = 'en'; } catch (ignore) {}
  var originals = new WeakMap(), attributes = new WeakMap();
  var headings = Array.from(document.querySelectorAll('.hero2__statement,.section-intro h2,.about__statement h2,.sig3d__text h2,#contact-title'));
  var headingCopy = {
  ".hero2__statement": "Clear data.<br>Confident decisions<span class=\"accent\">.</span>",
  "#skills-title": "A dashboard starts<br>before the chart<span class=\"accent\">.</span>",
  "#work-title": "Business questions.<br>Practical answers<span class=\"accent\">.</span>",
  "#maps-title": "Open a dashboard.<br>Follow a question<span class=\"accent\">.</span>",
  "#about-title": "Built on the details.<br>Focused on the business<span class=\"accent\">.</span>",
  ".sig3d__text h2": "Good decisions<br>start with<br>structure<span class=\"accent\">.</span>",
  "#contact-title": "Let’s turn your data<br>into decisions<span>↗</span>"
};
  var headingEnglish = headings.map(function (heading) { var key = Object.keys(headingCopy).find(function (selector) { return heading.matches(selector); }); return headingCopy[key] || heading.innerHTML; });
  var headingPortuguese = headings.map(function (el) { el.dataset.headingCopy = 'true'; return el.innerHTML; });
  var terms = Object.keys(dictionary).filter(function (key) { return key.length > 1; }).sort(function (a,b) { return b.length - a.length; });
  var escapedTerms = terms.map(function (key) { return key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
  var pattern = new RegExp('(?<![\\p{L}\\p{N}_])(?:' + escapedTerms.join('|') + ')(?![\\p{L}\\p{N}_])', 'gu');
  function english(text) {
    var key = text.trim().replace(/\s+/g, ' ');
    if (Object.prototype.hasOwnProperty.call(dictionary,key)) return text.replace(text.trim(),dictionary[key]);
    return text.replace(pattern, function (match) { return dictionary[match]; });
  }
  function translate(text) { return language === 'en' ? english(text) : text; }
  function translateNode(node) {
    var parent = node.parentElement;
    if (!parent || parent.closest('script,style,code,pre,noscript,[data-heading-copy],[data-lang],[data-locale-only="en"]')) return;
    var current = node.nodeValue;
    if (!current.trim()) return;
    var saved = originals.get(node);
    if (!saved || (current !== saved.pt && current !== saved.en)) saved = { pt: current, en: english(current) };
    originals.set(node,saved);
    var value = language === 'en' ? saved.en : saved.pt;
    if (current !== value) node.nodeValue = value;
  }
  function translateAttributes(el) {
    if (el.matches('option') && !el.hasAttribute('value')) el.setAttribute('value',el.value);
    var saved = attributes.get(el) || {};
    ['aria-label','title','alt'].forEach(function (key) {
      if (!el.hasAttribute(key)) return;
      var current = el.getAttribute(key), value = saved[key];
      if (!value || (current !== value.pt && current !== value.en)) value = { pt: current, en: english(current) };
      saved[key] = value;
      var next = language === 'en' ? value.en : value.pt;
      if (current !== next) el.setAttribute(key,next);
    });
    attributes.set(el,saved);
  }
  function visit(root) {
    if (root.nodeType === 3) { translateNode(root); return; }
    if (root.nodeType !== 1 || root.matches('script,style,code,pre,noscript')) return;
    translateAttributes(root);
    root.querySelectorAll('option,[aria-label],[title],[alt]').forEach(translateAttributes);
    var walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT), node;
    while ((node=walker.nextNode())) translateNode(node);
  }
  var queued = new Set(), frame = 0;
  var observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === 'childList') record.addedNodes.forEach(function (node) { queued.add(node); });
      else queued.add(record.target);
    });
    if (!frame) frame = requestAnimationFrame(function () {
      frame = 0; observer.disconnect();
      queued.forEach(function (root) { if (root.isConnected) visit(root); }); queued.clear(); observe();
    });
  });
  function observe() { observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','alt']}); }
  function setLanguage(value,initial) {
    observer.disconnect(); language = value === 'en' ? 'en' : 'pt';
    document.documentElement.lang = language === 'en' ? 'en' : 'pt-MZ';
    document.title = language === 'en' ? 'Zélio Chirindza — BI Analyst & Data Modeller' : 'Zélio Chirindza — Trabalho em dados';
    headings.forEach(function (el,i) { el.innerHTML = language === 'en' ? headingEnglish[i] : headingPortuguese[i]; delete el.dataset.sw; });
    document.querySelectorAll('[data-lang]').forEach(function (button) { button.setAttribute('aria-pressed',String(button.dataset.lang===language)); });
    document.querySelectorAll('[data-locale-only]').forEach(function (element) { element.hidden = element.dataset.localeOnly !== language; });
    visit(document.body);
    document.querySelectorAll('[data-case-preview]').forEach(function (image) { image.src = 'assets/case-' + image.dataset.casePreview + (language === 'en' ? '-en' : '') + '.png'; });
    var description = document.querySelector('meta[name="description"]');
    if (description) description.content = language === 'en' ? 'Business Intelligence Analyst and Data Modeller in Maputo, Mozambique. Power BI dashboards, SQL, Power Query, DAX and report design. Available for remote projects worldwide.' : 'Zélio Chirindza. Analista de Business Intelligence em Maputo. SQL, Power Query, modelação semântica, DAX e design de dashboards.';
    if (!initial) { try { localStorage.setItem('portfolio-language',language); } catch (ignore) {} }
    document.dispatchEvent(new CustomEvent('portfolio:language',{detail:{language:language}})); observe();
  }
  window.PortfolioI18n = { t:translate, setLanguage:setLanguage, getLanguage:function () { return language; } };
  document.querySelectorAll('[data-lang]').forEach(function (button) { button.addEventListener('click',function () { setLanguage(button.dataset.lang,false); }); });
  setLanguage(language,true);
})();

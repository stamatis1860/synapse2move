/* synapse²move: mobile menu + Cal.com booking pop-ups */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Campaign tags (utm_*): keep them in the address while the visitor moves through the site,
     so Cal.com can store them with a booking. Nothing is saved on the visitor's device. */
  var params = new URLSearchParams(window.location.search);
  var tags = [];
  params.forEach(function (v, k) { if (k.indexOf('utm_') === 0) tags.push([k, v]); });
  if (tags.length) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:)/.test(href)) return;
      var url;
      try { url = new URL(href, window.location.href); } catch (e) { return; }
      var internal = url.origin === window.location.origin && /(\.html$|\/$)/.test(url.pathname);
      var booking = url.hostname === 'cal.com';
      if (!internal && !booking) return;
      tags.forEach(function (t) { if (!url.searchParams.has(t[0])) url.searchParams.set(t[0], t[1]); });
      a.setAttribute('href', internal && url.origin === window.location.origin && window.location.protocol !== 'file:'
        ? url.pathname + url.search + url.hash : url.href);
    });
  }

  /* Cal.com embed: loaded once, one namespace per event used on the page */
  var buttons = document.querySelectorAll('[data-cal-link]');
  if (!buttons.length) return;
  (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
  var seen = {};
  buttons.forEach(function (b) {
    var ns = b.getAttribute('data-cal-namespace');
    if (!ns || seen[ns]) return;
    seen[ns] = true;
    Cal("init", ns, { origin: "https://app.cal.com" });
    Cal.ns[ns]("ui", { hideEventTypeDetails: false, layout: "month_view" });
  });
  Cal.config = Cal.config || {};
  Cal.config.forwardQueryParams = true;
})();

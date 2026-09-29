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

  /* ---------------------------------------------------------------------------
     Booking tags (utm_*). Nothing is saved on the visitor's device.

     1. Source: if the address has utm_ tags (e.g. from Instagram), we keep them.
        If not, we take only the name of the site the visitor came from
        (google, instagram, ...) or "direkt" when there is none.
     2. The tags stay in the address of every internal link, so they survive
        clicks from page to page.
     3. Every booking button adds utm_content = "<page>-<position>",
        e.g. "start-oben" or "einzeltraining-angebot".
     Cal.com stores the tags with the booking (booking details, host only).
     ------------------------------------------------------------------------- */
  var PAGES = {
    'index': 'start', '': 'start',
    'services': 'einzeltraining',
    'taenzer-sportler': 'sportler',
    'neuro': 'so-arbeiten-wir',
    'openworkshps': 'workshops',
    'workshops': 'teams',
    'brain-health': 'brain-health',
    'en': 'english',
    'thanks': 'danke',
    'impressum': 'impressum',
    'datenschutz': 'datenschutz'
  };
  var file = window.location.pathname.split('/').pop().replace(/\.html$/i, '').toLowerCase();
  var page = PAGES.hasOwnProperty(file) ? PAGES[file] : file;

  var params = new URLSearchParams(window.location.search);
  var tags = {};
  params.forEach(function (v, k) { if (k.indexOf('utm_') === 0 && v) tags[k] = v; });

  if (!tags.utm_source) {
    var host = '';
    try { host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch (e) { host = ''; }
    host = host.replace(/^(www\.|m\.|l\.|lm\.)/, '');
    if (host && host === window.location.hostname.replace(/^www\./, '')) {
      tags.utm_source = 'website'; tags.utm_medium = 'intern';
    } else if (!host) {
      tags.utm_source = 'direkt'; tags.utm_medium = 'none';
    } else if (/(^|\.)google\./.test(host)) {
      tags.utm_source = 'google'; tags.utm_medium = 'organic';
    } else if (/(^|\.)(bing\.com|duckduckgo\.com|ecosia\.org|yahoo\.com|startpage\.com)$/.test(host)) {
      tags.utm_source = host.split('.')[0]; tags.utm_medium = 'organic';
    } else if (/(^|\.)instagram\.com$/.test(host)) {
      tags.utm_source = 'instagram'; tags.utm_medium = 'referral';
    } else if (/(^|\.)facebook\.com$/.test(host)) {
      tags.utm_source = 'facebook'; tags.utm_medium = 'referral';
    } else if (/(^|\.)(linkedin\.com|lnkd\.in)$/.test(host)) {
      tags.utm_source = 'linkedin'; tags.utm_medium = 'referral';
    } else {
      tags.utm_source = host; tags.utm_medium = 'referral';
    }
  }

  function position(el) {
    if (el.closest('nav')) return 'menue';
    if (el.closest('.sticky')) return 'handyleiste';
    if (el.closest('header')) return 'oben';
    if (el.closest('.offer')) return 'angebot';
    if (el.closest('.cta-light, .cta-dark')) return 'unten';
    return 'mitte';
  }

  function bookingTags(el) {
    var t = {};
    Object.keys(tags).forEach(function (k) { t[k] = tags[k]; });
    var here = page + '-' + position(el);
    t.utm_content = tags.utm_content ? tags.utm_content + '.' + here : here;
    return t;
  }

  /* Internal links keep the source tags; plain cal.com links get the booking tags */
  document.querySelectorAll('a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:)/.test(href)) return;
    var url;
    try { url = new URL(href, window.location.href); } catch (e) { return; }
    var internal = url.origin === window.location.origin && /(\.html$|\/$)/.test(url.pathname);
    var booking = url.hostname === 'cal.com' && /^\/synapse2move\//.test(url.pathname);
    if (!internal && !booking) return;
    var t = booking ? bookingTags(a) : tags;
    Object.keys(t).forEach(function (k) {
      if (booking || !url.searchParams.has(k)) url.searchParams.set(k, t[k]);
    });
    a.setAttribute('href', internal && window.location.protocol !== 'file:'
      ? url.pathname + url.search + url.hash : url.href);
  });

  /* Cal.com pop-up: the tags go into each button's config */
  var buttons = document.querySelectorAll('[data-cal-link]');
  if (!buttons.length) return;
  buttons.forEach(function (b) {
    var cfg = {};
    try { cfg = JSON.parse(b.getAttribute('data-cal-config') || '{}'); } catch (e) { cfg = {}; }
    var t = bookingTags(b);
    Object.keys(t).forEach(function (k) { cfg[k] = t[k]; });
    b.setAttribute('data-cal-config', JSON.stringify(cfg));
  });

  (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
  var seen = {};
  buttons.forEach(function (b) {
    var ns = b.getAttribute('data-cal-namespace');
    if (!ns || seen[ns]) return;
    seen[ns] = true;
    Cal("init", ns, { origin: "https://app.cal.com" });
    Cal.ns[ns]("ui", { hideEventTypeDetails: false, layout: "month_view" });
  });
})();

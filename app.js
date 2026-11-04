/* ZOVE – klikací prototyp. Bez serveru: data jsou v data.js a v localStorage. */
(function () {
  'use strict';

  var D = window.ZOVE_DATA;
  var app = document.getElementById('app');
  var KEY = 'zove-proto-v1';

  /* ------------------------------------------------------------------ */
  /* Store                                                              */
  /* ------------------------------------------------------------------ */
  function freshStore() {
    return {
      userRecords: [],
      watches: [],
      messages: D.messages.map(function (m) { return Object.assign({ thread: [] }, m); }),
      checks: [],
      complaints: {},
      draft: null,
      user: null,
      reg: {},
      bazarLog: [
        { time: '9:02', what: 'iPhone · IMEI 35•••921', res: 'čisté' },
        { time: '8:47', what: 'Zlatý řetízek (foto)', res: 'čisté' },
        { time: '8:31', what: 'Akušroubovák · SN 7781•••', res: 'shoda' },
        { time: '8:15', what: 'Notebook · 5CD2•••41', res: 'čisté' }
      ]
    };
  }
  var store;
  try { store = JSON.parse(localStorage.getItem(KEY)) || freshStore(); } catch (e) { store = freshStore(); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); }
    catch (e) { toast('Prohlížeč nemá místo na uložení – fotky zkuste menší.'); }
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function normSerial(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function maskSerial(s) {
    s = String(s || '');
    return s.length > 7 ? s.slice(0, 3) + '•••' + s.slice(-4) : s;
  }
  function isMobile() { return window.matchMedia('(max-width: 760px)').matches; }
  function nowTime() { var d = new Date(); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function fmtAdded(iso) {
    var d = new Date(iso + 'T12:00:00');
    var diff = Math.round((new Date(today() + 'T12:00:00') - d) / 86400000);
    if (diff <= 0) return 'dnes';
    if (diff === 1) return 'včera';
    if (diff < 5) return 'před ' + diff + ' dny';
    return d.getDate() + '. ' + (d.getMonth() + 1) + '.';
  }
  function fmtDateTime(ts) {
    var d = new Date(ts);
    return d.getDate() + '. ' + (d.getMonth() + 1) + '. ' + d.getFullYear() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function uid(prefix) { return prefix + Math.random().toString(36).slice(2, 7).toUpperCase(); }

  var STATUS = {
    stolen: { label: 'Odcizeno', cls: 'stolen' },
    lost: { label: 'Ztraceno', cls: 'lost' },
    found: { label: 'Nalezeno', cls: 'found' },
    returned: { label: 'Vráceno majiteli', cls: 'found' }
  };
  function statusHtml(r, extra) {
    var s = STATUS[r.status] || STATUS.lost;
    return '<span class="status"><span class="dot ' + s.cls + '"></span>' + s.label + (extra ? ' · ' + esc(extra) : '') + '</span>';
  }

  var ICON = {
    art: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M7 15l3-3 3 3 2-2 3 3"/><circle cx="9" cy="9" r="1"/>',
    bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9l3 7H6M14 6h2"/>',
    ring: '<circle cx="12" cy="14" r="6"/><path d="M9 4h6l-1.5 3h-3z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    paw: '<circle cx="7" cy="10" r="1.6"/><circle cx="17" cy="10" r="1.6"/><circle cx="10" cy="6.5" r="1.6"/><circle cx="14" cy="6.5" r="1.6"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5-2 3-4 3-4 0-4-3z"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
    watch: '<circle cx="12" cy="12" r="5"/><path d="M9 3h6l1 4M9 21h6l1-4M12 10v2l1.5 1"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    alert: '<path d="M12 7v6M12 17v.5"/>',
    share: '<path d="M12 15V3M8 7l4-4 4 4M5 12v8h14v-8"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
    scan: '<path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3M8 9v6M12 9v6M16 9v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    pin: '<path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    wifi: '<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01"/>',
    flash: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    shield: '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/>'
  };
  function ic(name, size, sw, attrs) {
    return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (attrs || '') + '>' + (ICON[name] || '') + '</svg>';
  }
  var CAT_ICON = { umeni: 'art', kola: 'bike', elektronika: 'laptop', sperky: 'ring', zvirata: 'paw', ostatni: 'box' };
  function catLabel(id) { var c = D.categories.find(function (c) { return c.id === id; }); return c ? c.label : 'Ostatní'; }

  function thumb(r, extraStyle) {
    var inner = (r.photos && r.photos[0])
      ? '<img src="' + r.photos[0] + '" alt="">'
      : ic(r.icon || CAT_ICON[r.cat] || 'box', 48, 1.4);
    return '<div class="thumb"' + (extraStyle ? ' style="' + extraStyle + '"' : '') + '>' + inner + '</div>';
  }

  function allRecords() {
    return store.userRecords.concat(D.records).slice().sort(function (a, b) { return a.added < b.added ? 1 : a.added > b.added ? -1 : 0; });
  }
  function getRecord(id) { return allRecords().find(function (r) { return r.id === id; }); }
  function isMine(r) { return !!(r && r.mine); }
  function userReady() { var u = store.user; return !!(u && u.verified && u.profile && u.profile.phone && u.terms); }
  var METHOD = { bankid: 'Bankovní identita', nia: 'Identita občana', doklad: 'Doklad a selfie' };

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }

  function sheet(html, onMount) {
    var scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><span class="grab" aria-hidden="true"></span>' + html + '</div>';
    function close() { scrim.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    scrim.addEventListener('click', function (e) { if (e.target === scrim || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(scrim);
    var first = scrim.querySelector('input, button:not([data-close])');
    if (first) first.focus();
    if (onMount) onMount(scrim.querySelector('.sheet'), close);
    return close;
  }

  function onApp(type, fn) {
    app.addEventListener(type, fn);
    cleanup.push(function () { app.removeEventListener(type, fn); });
  }

  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  /* ------------------------------------------------------------------ */
  /* Photos: file picker, downscale, camera                             */
  /* ------------------------------------------------------------------ */
  function downscale(dataUrl, max, cb) {
    var img = new Image();
    img.onload = function () {
      var s = Math.min(1, max / Math.max(img.width, img.height));
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = function () { toast('Fotku se nepodařilo načíst.'); };
    img.src = dataUrl;
  }
  function pickFile(cb) {
    var input = document.getElementById('file-pick');
    input.value = '';
    input.onchange = function () {
      var f = input.files && input.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { downscale(fr.result, 900, cb); };
      fr.readAsDataURL(f);
    };
    input.click();
  }

  /* Fotoaparát na celou obrazovku (mobil). mode: 'photo' | 'scan' */
  function openCamera(opts) {
    var mode = opts.mode || 'photo';
    var el = document.createElement('div');
    el.className = 'camera';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', mode === 'scan' ? 'Skener kódu' : 'Fotoaparát');
    el.innerHTML =
      '<div class="top"><button type="button" class="icon-btn" data-cam="close" aria-label="Zavřít">' + ic('close', 18, 2) + '</button>' +
      '<b style="font-size:16px;font-weight:600">' + (mode === 'scan' ? 'Naskenovat kód' : (opts.title || 'Vyfotit věc')) + '</b>' +
      '<button type="button" class="icon-btn" aria-label="Blesk">' + ic('flash', 18) + '</button></div>' +
      (opts.kinds ? '<div class="seg dark" style="margin-bottom:12px" data-cam="kinds">' + opts.kinds.map(function (k) {
        return '<button type="button" aria-pressed="' + (k.on ? 'true' : 'false') + '" data-kind="' + k.id + '">' + k.label + '</button>';
      }).join('') + '</div>' : '') +
      '<div class="finder" style="' + (mode === 'scan' ? 'aspect-ratio: 16 / 10' : '') + '"><video playsinline muted autoplay></video>' +
      '<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>' +
      (mode === 'scan' ? '<span class="scan-line"></span>' : '') + '</div>' +
      '<p class="hint">' + (mode === 'scan' ? 'Namiřte na sériové číslo nebo čárový kód. V prototypu se po chvíli „naskenuje“ ukázkový kód.' : 'Vyfoťte věc – nebo starou fotku z rodinného alba.') + '</p>' +
      '<div class="controls">' +
      '<button type="button" class="gallery-btn" data-cam="gallery" aria-label="Vybrat z galerie">' + ic('image', 20) + '</button>' +
      (mode === 'scan' ? '<span style="width:76px"></span>' : '<button type="button" class="shutter" data-cam="shot" aria-label="Vyfotit"><span></span></button>') +
      '<button type="button" data-cam="skip" style="width:56px;background:none;border:0;color:#BDBDBD;font-size:12px;line-height:1.2">' + (mode === 'scan' ? 'Zadat ručně' : 'Bez fotky') + '</button>' +
      '</div>';
    document.body.appendChild(el);
    var video = el.querySelector('video');
    var stream = null, scanTimer = null;

    function stop() {
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      clearTimeout(scanTimer);
      el.remove();
    }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        .then(function (s) { stream = s; video.srcObject = s; })
        .catch(function () { /* bez kamery: zůstane prázdný hledáček, funguje galerie */ });
    }
    if (mode === 'scan') {
      scanTimer = setTimeout(function () { if (navigator.vibrate) navigator.vibrate(30); stop(); opts.onCode && opts.onCode('WTU0458812'); }, 2600);
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cam], [data-kind]');
      if (!b) return;
      if (b.dataset.kind) {
        el.querySelectorAll('[data-kind]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        opts.onKind && opts.onKind(b.dataset.kind);
        return;
      }
      var a = b.dataset.cam;
      if (a === 'close') { stop(); opts.onCancel && opts.onCancel(); }
      if (a === 'skip') { stop(); opts.onSkip && opts.onSkip(); }
      if (a === 'gallery') { pickFile(function (url) { stop(); opts.onPhoto && opts.onPhoto(url); }); }
      if (a === 'shot') {
        if (stream && video.videoWidth) {
          var c = document.createElement('canvas');
          c.width = video.videoWidth; c.height = video.videoHeight;
          c.getContext('2d').drawImage(video, 0, 0);
          downscale(c.toDataURL('image/jpeg', 0.85), 900, function (url) { stop(); opts.onPhoto && opts.onPhoto(url); });
        } else {
          pickFile(function (url) { stop(); opts.onPhoto && opts.onPhoto(url); });
        }
      }
    });
  }

  function addPhoto(cb, title) {
    if (isMobile()) openCamera({ mode: 'photo', title: title, onPhoto: cb });
    else pickFile(cb);
  }

  /* ------------------------------------------------------------------ */
  /* Router                                                             */
  /* ------------------------------------------------------------------ */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var qi = h.indexOf('?');
    var path = qi >= 0 ? h.slice(0, qi) : h;
    var query = {};
    if (qi >= 0) h.slice(qi + 1).split('&').forEach(function (kv) {
      var p = kv.split('=');
      if (p[0]) query[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' '));
    });
    return { parts: path.split('/').filter(Boolean), query: query };
  }

  var cleanup = [];
  var lastPath = null;
  function render() {
    cleanup.forEach(function (fn) { fn(); });
    cleanup = [];
    var r = parseHash();
    var p = r.parts;
    var key = p[0] || '';
    var view = VIEWS[key] || VIEWS.__404;
    var out = view(p.slice(1), r.query) || {};
    if (typeof out === 'string') out = { html: out };
    app.innerHTML = out.html || '';
    document.title = (out.title ? out.title + ' · ' : '') + 'ZOVE';
    document.body.classList.toggle('no-tabbar', !!out.noTabbar);

    var pathKey = p.join('/');
    if (pathKey !== lastPath && !out.keepScroll) { window.scrollTo(0, 0); }
    lastPath = pathKey;

    // aktivní položky navigace
    var navKey = out.nav || key;
    document.querySelectorAll('[data-nav]').forEach(function (a) { a.classList.toggle('active', a.dataset.nav === navKey); });
    var tabKey = out.tab || ({ '': 'home', hledat: 'home', zaznam: 'home', overit: 'overit', vypis: 'overit', nahlasit: 'nahlasit', zpravy: 'zpravy', ucet: 'ucet', oznameni: 'ucet', registrace: 'ucet' }[key] || '');
    document.querySelectorAll('[data-tab]').forEach(function (a) { a.classList.toggle('active', a.dataset.tab === tabKey); });
    var na = document.getElementById('nav-account');
    if (na) na.textContent = store.user && store.user.verified ? 'Účet' : 'Přihlásit';
    var unread = store.messages.some(function (m) { return m.unread; });
    document.getElementById('msg-dot').hidden = !unread;

    if (out.after) out.after(app);
  }
  window.addEventListener('hashchange', render);
  window.addEventListener('scroll', function () {
    document.getElementById('site-header').classList.toggle('scrolled', window.scrollY > 4);
  }, { passive: true });

  /* ------------------------------------------------------------------ */
  /* Views                                                              */
  /* ------------------------------------------------------------------ */
  var VIEWS = {};

  /* ---------- Domů ---------- */
  VIEWS[''] = function () {
    var latest = allRecords().filter(function (r) { return r.status === 'stolen' || r.status === 'lost'; }).slice(0, 10);
    var slides = latest.concat(latest.slice(0, 6));
    var html =
      '<section class="wrap hero">' +
      '<h1 class="h-xl">Přišli jste o něco?</h1>' +
      '<p class="lead">Veřejná databáze ztracených a odcizených věcí. Hledejte, nahlaste, ověřte před koupí.</p>' +
      '<form class="pill-search" data-form="search" role="search">' +
      '<label for="q" class="sr">Co hledáte</label>' +
      '<input id="q" name="q" type="search" placeholder="Popište věc – „obraz kytice“, „kolo modré“…" autocomplete="off">' +
      '<a href="#/overit?mode=foto" class="icon-btn" aria-label="Hledat podle fotky">' + ic('camera', 20) + '</a>' +
      '<button type="submit" class="icon-btn dark desktop-only" aria-label="Hledat">' + ic('arrow', 20, 2) + '</button>' +
      '</form>' +
      '<div class="hero-links">' +
      '<a href="#/nahlasit">Nahlásit ztrátu nebo krádež →</a>' +
      '<a href="#/overit">Ověřit věc před koupí →</a>' +
      '<a href="#/hledat?najit=1">Viděl/a jsem něco →</a>' +
      '</div></section>' +

      '<section class="wrap">' +
      '<div class="row between wrap-row gap-12" style="align-items:baseline"><h2 style="font-size:15px;letter-spacing:0">Naposledy nahlášené ztracené a odcizené věci</h2><a href="#/hledat" class="small muted" style="text-decoration:none;padding:8px 0">Zobrazit vše →</a></div>' +
      '<div class="carousel" id="carousel"><div class="carousel-track" id="track">' +
      slides.map(function (r, i) {
        return '<a class="carousel-item" href="#/zaznam/' + esc(r.id) + '"' + (i >= latest.length ? ' aria-hidden="true" tabindex="-1"' : '') + '>' +
          thumb(r, 'border-radius:14px') +
          statusHtml(r, fmtAdded(r.added)) +
          '<span class="t">' + esc(r.title) + '</span></a>';
      }).join('') +
      '</div></div></section>' +

      '<section class="wrap mt-64"><div class="grid-2">' +
      '<a href="#/overit" class="card"><span class="xs muted">Než zaplatíte</span><span class="h-s" style="font-weight:600">Ověřte věc podle fotky nebo čísla</span><span class="small" style="color:var(--ink-2)">Výsledek s časovým razítkem dokládá, že jste kupovali v dobré víře.</span><span style="font-weight:500;margin-top:6px">Ověřit →</span></a>' +
      '<a href="#/hledat?najit=1" class="card"><span class="xs muted">Něco jste zahlédli</span><span class="h-s" style="font-weight:600">Dejte vědět majiteli</span><span class="small" style="color:var(--ink-2)">V inzerátu, bazaru nebo na aukci. Zpráva jde anonymně, váš kontakt zůstane skrytý.</span><span style="font-weight:500;margin-top:6px">Napsat majiteli →</span></a>' +
      '</div></section>' +

      '<section class="wrap" style="padding-top:16px;padding-bottom:96px">' +
      '<a href="#/oznameni" class="card dark" style="flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;padding:40px">' +
      '<span class="stack gap-8" style="flex:1 1 360px"><span class="h-m">Okradli vás? Trestní oznámení připravíme s vámi.</span><span class="muted" style="font-size:16px">Z vašeho záznamu sestavíme oznámení na neznámého pachatele a poradíme, kam ho podat.</span></span>' +
      '<span class="btn" style="background:#fff;color:var(--ink)">Začít s oznámením</span></a>' +
      '</section>';

    return {
      html: html,
      after: function () {
        bindSearchForm();
        // automatický posun zprava doleva
        var track = document.getElementById('track');
        var car = document.getElementById('carousel');
        if (!track || !latest.length) return;
        var i = 0, paused = false;
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        function per() { return parseInt(getComputedStyle(car).getPropertyValue('--per'), 10) || 6; }
        function gap() { return parseFloat(getComputedStyle(car).getPropertyValue('--gap')) || 16; }
        function apply() {
          track.style.transform = 'translateX(calc(-' + i + ' * (100% + ' + gap() + 'px) / ' + per() + '))';
        }
        car.addEventListener('mouseenter', function () { paused = true; });
        car.addEventListener('mouseleave', function () { paused = false; });
        car.addEventListener('focusin', function () { paused = true; });
        car.addEventListener('focusout', function () { paused = false; });
        if (reduce) return;
        var timer = setInterval(function () {
          if (paused || document.hidden) return;
          i += 1;
          track.classList.remove('no-anim');
          apply();
          if (i >= latest.length) {
            setTimeout(function () { track.classList.add('no-anim'); i = 0; apply(); }, 650);
          }
        }, 3000);
        cleanup.push(function () { clearInterval(timer); });
      }
    };
  };

  function bindSearchForm() {
    var f = app.querySelector('[data-form="search"]');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = f.querySelector('input').value.trim();
      go('#/hledat' + (q ? '?q=' + encodeURIComponent(q) : ''));
    });
  }

  /* ---------- Hledat ---------- */
  VIEWS.hledat = function (p, q) {
    var query = q.q || '';
    var cat = q.kat || '';
    var st = q.stav || '';
    var words = norm(query).split(/\s+/).filter(Boolean);
    var results = allRecords().filter(function (r) {
      if (cat && r.cat !== cat) return false;
      if (st && r.status !== st) return false;
      if (!words.length) return true;
      var hay = norm([r.title, r.desc, r.place, catLabel(r.cat)].join(' ')) + ' ' + normSerial(r.serial).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) >= 0 || (normSerial(w).length > 4 && hay.indexOf(normSerial(w).toLowerCase()) >= 0); });
    });
    function link(over) {
      var o = Object.assign({ q: query, kat: cat, stav: st, najit: q.najit || '' }, over);
      var parts = Object.keys(o).filter(function (k) { return o[k]; }).map(function (k) { return k + '=' + encodeURIComponent(o[k]); });
      return '#/hledat' + (parts.length ? '?' + parts.join('&') : '');
    }
    var html =
      '<div class="wrap page">' +
      '<h1 class="h-l">' + (q.najit ? 'Co jste viděli?' : 'Hledat') + '</h1>' +
      (q.najit ? '<p class="lead" style="max-width:560px">Najděte věc v seznamu a v detailu klepněte na „Viděl/a jsem to“. Majitel dostane zprávu, váš kontakt zůstane skrytý.</p>' : '') +
      '<form class="pill-search mt-24" data-form="search2" role="search" style="max-width:720px;box-shadow:none">' +
      '<label for="q2" class="sr">Co hledáte</label>' +
      '<input id="q2" name="q" type="search" value="' + esc(query) + '" placeholder="Popis, místo nebo sériové číslo" autocomplete="off">' +
      '<a href="#/overit?mode=foto" class="icon-btn" aria-label="Hledat podle fotky">' + ic('camera', 20) + '</a>' +
      '<button type="submit" class="icon-btn dark" aria-label="Hledat">' + ic('arrow', 20, 2) + '</button></form>' +
      '<div class="chips scroll mt-24">' +
      '<a class="chip" style="text-decoration:none" aria-pressed="' + (!cat) + '" href="' + link({ kat: '' }) + '">Vše</a>' +
      D.categories.map(function (c) { return '<a class="chip" style="text-decoration:none" aria-pressed="' + (cat === c.id) + '" href="' + link({ kat: c.id }) + '">' + c.label + '</a>'; }).join('') +
      '</div>' +
      '<div class="row between wrap-row gap-12 mt-16"><div class="seg" role="group" aria-label="Stav">' +
      [['', 'Vše'], ['stolen', 'Odcizené'], ['lost', 'Ztracené'], ['found', 'Nálezy']].map(function (s) {
        return '<button type="button" aria-pressed="' + (st === s[0]) + '" data-href="' + link({ stav: s[0] }) + '">' + s[1] + '</button>';
      }).join('') +
      '</div><span class="small muted">' + results.length + ' ' + (results.length === 1 ? 'záznam' : results.length >= 2 && results.length <= 4 ? 'záznamy' : 'záznamů') + '</span></div>' +
      (results.length
        ? '<div class="grid-items mt-32">' + results.map(itemCard).join('') + '</div>'
        : '<div class="note mt-32" style="max-width:560px">Nic jsme nenašli. Zkuste obecnější popis, jiné místo, nebo hledejte <a href="#/overit?mode=foto">podle fotky</a>.</div>') +
      '</div>';
    return {
      html: html, title: 'Hledat', keepScroll: true,
      after: function () {
        var f = app.querySelector('[data-form="search2"]');
        f.addEventListener('submit', function (e) { e.preventDefault(); go(link({ q: f.querySelector('input').value.trim() })); });
        app.querySelectorAll('[data-href]').forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.href); }); });
      }
    };
  };

  function itemCard(r) {
    return '<a class="item" href="#/zaznam/' + esc(r.id) + '">' + thumb(r) +
      '<span class="stack gap-4">' + statusHtml(r, fmtAdded(r.added)) +
      '<span class="t">' + esc(r.title) + '</span><span class="p">' + esc(r.place) + '</span></span></a>';
  }

  /* ---------- Detail ---------- */
  VIEWS.zaznam = function (p) {
    var r = getRecord(p[0]);
    if (!r) return VIEWS.__404();
    var mine = isMine(r);
    var watching = store.watches.indexOf(r.id) >= 0;
    var similar = allRecords().filter(function (x) { return x.id !== r.id && x.cat === r.cat; }).slice(0, 4);
    var photos = r.photos && r.photos.length ? r.photos : [null];
    var facts = [['Kdy', r.when], ['Kde', r.place], ['Kategorie', catLabel(r.cat)]];
    if (r.size) facts.push(['Rozměr', r.size]);
    if (r.serial) facts.push(['Sériové číslo', maskSerial(r.serial)]);
    if (r.caseNo) facts.push(['Číslo jednací', r.caseNo]);

    var actions = mine
      ? (r.status === 'stolen' ? '<a class="btn lg block" href="#/oznameni/' + esc(r.id) + '">' + ic('doc', 18) + 'Připravit trestní oznámení</a>' : '') +
        '<div class="row gap-8"><button type="button" class="btn ghost" style="flex:1" data-act="returned">Věc se vrátila</button><button type="button" class="btn ghost" style="flex:1" data-act="share">' + ic('share', 18) + 'Sdílet</button></div>' +
        '<span class="xs muted">Toto je váš záznam. Zprávy od nálezců uvidíte ve <a href="#/zpravy">Zprávách</a>.</span>'
      : (r.status === 'found'
        ? '<a class="btn lg block" href="#/videl/' + esc(r.id) + '?vlastnik=1">To je moje – ozvat se nálezci</a>'
        : '<a class="btn lg block" href="#/videl/' + esc(r.id) + '">' + ic('eye', 18) + 'Viděl/a jsem to</a>') +
        '<div class="row gap-8"><button type="button" class="btn ghost" style="flex:1" data-act="watch" aria-pressed="' + watching + '">' + ic('bell', 18, 1.8, watching ? ' style="fill:currentColor"' : '') + (watching ? 'Hlídám' : 'Hlídat podobné') + '</button><button type="button" class="btn ghost" style="flex:1" data-act="share">' + ic('share', 18) + 'Sdílet</button></div>' +
        '<span class="xs muted">Zpráva jde přes ZOVE, kontakty zůstávají skryté.</span>';

    var html =
      '<div class="wrap page">' +
      '<a href="javascript:history.back()" class="small muted desktop-only" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px;padding:6px 0 18px">' + ic('back', 16, 2) + 'Zpět</a>' +
      '<div class="split">' +
      '<div class="main-col stack gap-12">' +
      '<div class="thumb" id="main-photo" style="border-radius:24px">' + (photos[0] ? '<img src="' + photos[0] + '" alt="' + esc(r.title) + '">' : ic(r.icon || CAT_ICON[r.cat] || 'box', 64, 1.2)) + '</div>' +
      (photos.length > 1 ? '<div class="row gap-8">' + photos.map(function (ph, i) { return '<button type="button" data-photo="' + i + '" style="width:72px;height:72px;padding:0;border:0;border-radius:12px;overflow:hidden;background:var(--soft)"><img src="' + ph + '" alt="Fotka ' + (i + 1) + '" style="width:100%;height:100%;object-fit:cover"></button>'; }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="side-col stack gap-24">' +
      '<div class="stack gap-12">' + statusHtml(r, r.police ? 'nahlášeno Policii ČR' : '') +
      '<h1 class="h-m">' + esc(r.title) + '</h1>' +
      (r.desc ? '<p style="margin:0;color:var(--ink-2)">' + esc(r.desc) + '</p>' : '') +
      '<span class="row gap-8 xs" style="color:var(--found)">' + ic('shield', 16, 1.8) + (r.status === 'found' ? 'Nález vložil ověřený uživatel' : 'Nahlásil ověřený uživatel') + '</span></div>' +
      '<dl class="dl">' + facts.map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="stack gap-12">' + actions + '</div>' +
      (!mine && r.status !== 'found' ? '<div class="note">Nabízí vám tuto věc někdo ke koupi? Nekupujte ji a ozvěte se majiteli nebo policii.</div>' : '') +
      '<span class="xs muted">Záznam č. ' + esc(r.id) + ' · přidán ' + fmtAdded(r.added) + (mine ? '' : ' · <button type="button" class="link-btn xs" style="padding:0" data-act="flag">Nahlásit chybný záznam</button>') + '</span>' +
      '</div></div>' +
      (similar.length ? '<section class="mt-64"><h2 style="font-size:15px;letter-spacing:0">Podobné záznamy</h2><div class="grid-items mt-24">' + similar.map(itemCard).join('') + '</div></section>' : '') +
      '</div>';

    return {
      html: html, title: r.title,
      after: function () {
        app.querySelectorAll('[data-photo]').forEach(function (b) {
          b.addEventListener('click', function () { document.getElementById('main-photo').innerHTML = '<img src="' + photos[+b.dataset.photo] + '" alt="">'; });
        });
        onApp('click', function (e) {
          var b = e.target.closest('[data-act]');
          if (!b) return;
          var a = b.dataset.act;
          if (a === 'watch') {
            var i = store.watches.indexOf(r.id);
            if (i >= 0) { store.watches.splice(i, 1); toast('Hlídání vypnuto.'); }
            else {
              store.watches.push(r.id);
              toast('Hlídáme podobné záznamy. Upozorníme vás.');
              if (isMobile() && !isStandalone()) setTimeout(installNudge, 900);
            }
            save(); render();
          }
          if (a === 'share') shareLink(r.title, location.href);
          if (a === 'flag') sheet('<h2 class="h-s">Co je na záznamu špatně?</h2><div class="stack gap-8">' +
            ['Je to moje věc a není kradená', 'Nevhodné nebo cizí fotky', 'Spam nebo podvod', 'Něco jiného'].map(function (t) { return '<button type="button" class="radio-row" data-flag><b>' + t + '</b><span class="r"></span></button>'; }).join('') +
            '</div>', function (s, close) { s.querySelectorAll('[data-flag]').forEach(function (x) { x.addEventListener('click', function () { close(); toast('Díky. Záznam prověří moderátor.'); }); }); });
          if (a === 'returned') {
            var rec = store.userRecords.find(function (x) { return x.id === r.id; });
            if (rec) { rec.status = 'returned'; save(); toast('Skvělé! Záznam jsme označili jako vrácený.'); render(); }
          }
        });
      }
    };
  };

  function shareLink(title, url) {
    if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Odkaz zkopírován.'); }, function () { toast(url); });
    else toast(url);
  }

  /* ---------- Nahlášení ---------- */
  var KEYWORDS = [
    ['umeni', ['obraz', 'olej', 'malba', 'socha', 'grafika', 'kresba', 'akvarel', 'zatisi', 'krajina', 'portret', 'ram']],
    ['kola', ['kolo', 'bicykl', 'kolobezka', 'kocar']],
    ['elektronika', ['telefon', 'mobil', 'iphone', 'notebook', 'laptop', 'tablet', 'fotoapar', 'hodinky chytre', 'sluchatk', 'konzole', 'kamera']],
    ['sperky', ['prsten', 'retiz', 'nausnic', 'hodinky', 'naramek', 'zlat', 'stribr', 'sperk']],
    ['zvirata', ['pes', 'kocka', 'bigl', 'papousek', 'kun', 'stene', 'kote']]
  ];
  function guessCat(text) {
    var t = norm(text);
    for (var i = 0; i < KEYWORDS.length; i++) {
      if (KEYWORDS[i][1].some(function (k) { return t.indexOf(k) >= 0; })) return KEYWORDS[i][0];
    }
    return t.length > 2 ? 'ostatni' : '';
  }
  var ICON_BY_CAT = { umeni: 'art', kola: 'bike', elektronika: 'laptop', sperky: 'ring', zvirata: 'paw', ostatni: 'box' };

  function draft() {
    if (!store.draft) store.draft = { status: 'stolen', photos: [], title: '', marks: '', serial: '', cat: '', catManual: false, place: '', whenChip: 'Dnes', whenDate: '', email: '' };
    return store.draft;
  }

  VIEWS.nahlasit = function (p) {
    if (p[0] === 'hotovo') return nahlasitHotovo(p[1]);
    if (!userReady()) { setTimeout(function () { go('#/registrace?dalsi=nahlasit'); }); return ''; }
    var step = p[0] === '3' ? 3 : p[0] === '2' ? 2 : 1;
    var d = draft();
    if (step > 1 && !d.title.trim()) { setTimeout(function () { go('#/nahlasit'); }); return ''; }

    var head =
      '<div class="row between gap-12"><div class="progress" style="flex:1"><span>' + step + ' / 3</span><span class="bar"><i style="width:' + (step * 33.4) + '%"></i></span></div>' +
      '<a href="#/" class="icon-btn" aria-label="Zavřít" style="margin-left:12px">' + ic('close', 18, 2) + '</a></div>';

    var body = '';
    if (step === 1) {
      var showSerial = d.cat === 'kola' || d.cat === 'elektronika';
      body =
        '<h1 class="h-l mt-32">Co se stalo?</h1>' +
        '<div class="stack gap-32 mt-32">' +
        '<div class="option-tiles" role="group" aria-label="Typ události">' +
        '<button type="button" class="tile" data-status="stolen" aria-pressed="' + (d.status === 'stolen') + '"><b>Odcizeno</b><span>Někdo mi to vzal</span></button>' +
        '<button type="button" class="tile" data-status="lost" aria-pressed="' + (d.status === 'lost') + '"><b>Ztraceno</b><span>Někde jsem to nechal/a</span></button>' +
        '</div>' +
        (d.status === 'stolen' ? '<div class="row gap-8 small" style="align-items:flex-start;color:var(--ink-2)">' + ic('doc', 18, 1.8, ' style="flex:none;margin-top:2px"') + '<span>Na konci vám z těchto údajů připravíme i trestní oznámení.</span></div>' : '') +
        '<div class="stack gap-8"><span class="small muted">Fotky</span><div class="photos" id="photos">' +
        d.photos.map(function (ph, i) { return '<div class="photo"><img src="' + ph + '" alt="Fotka ' + (i + 1) + '"><button type="button" data-del="' + i + '" aria-label="Odebrat fotku">×</button></div>'; }).join('') +
        (d.photos.length < 4 ? '<button type="button" class="add-photo" data-act="photo">' + ic('plus', 20) + 'Fotka</button>' : '') +
        '</div><span class="xs muted">Stačí i starší fotka z mobilu nebo z rodinného alba.</span></div>' +
        '<div class="field"><label for="f-title">Co to je?</label><input id="f-title" class="u-input" type="text" value="' + esc(d.title) + '" placeholder="např. obraz – kytice květin, olej" autocomplete="off">' +
        '<span class="xs muted" id="cat-line"' + (d.cat ? '' : ' hidden') + '>' + ic('sparkle', 13, 2, ' style="vertical-align:-2px"') + ' Kategorie: <b style="font-weight:500;color:var(--ink)" id="cat-name">' + esc(catLabel(d.cat)) + '</b> · <button type="button" class="link-btn xs" style="padding:0" data-act="cat">změnit</button></span></div>' +
        '<div class="field"><label for="f-marks">Čím je to poznat? (nepovinné)</label><input id="f-marks" class="u-input" type="text" value="' + esc(d.marks) + '" placeholder="Signatura, poškození, rytina…" autocomplete="off"></div>' +
        '<div class="field" id="serial-field"' + (showSerial ? '' : ' hidden') + '><label for="f-serial">Sériové číslo nebo číslo rámu (nepovinné)</label><input id="f-serial" class="u-input mono" type="text" value="' + esc(d.serial) + '" placeholder="pomáhá bazarům věc poznat" autocomplete="off" style="font-size:18px"></div>' +
        '<div class="row between gap-16 wrap-row"><span class="xs muted">Další: kde a kdy · kontrola</span><button type="button" class="btn lg" data-act="next" ' + (d.title.trim() ? '' : 'disabled') + '>Pokračovat</button></div>' +
        '</div>';
    }
    if (step === 2) {
      var chips = ['Dnes', 'Včera', 'Tento týden', 'Jindy…'];
      body =
        '<h1 class="h-l mt-32">Kde a kdy?</h1>' +
        '<div class="stack gap-32 mt-32">' +
        '<div class="field"><label for="f-place">Kde ' + (d.status === 'stolen' ? 'se to stalo' : 'jste to naposledy měli') + '</label>' +
        '<input id="f-place" class="u-input" type="text" value="' + esc(d.place) + '" placeholder="Obec nebo městská část" autocomplete="off">' +
        '<button type="button" class="btn ghost sm" data-act="geo" style="align-self:flex-start;margin-top:4px">' + ic('pin', 16) + 'Použít moji polohu</button>' +
        '<span class="xs muted">Veřejně ukážeme jen obec nebo městskou část, nikdy adresu.</span></div>' +
        '<div class="field"><span class="label">Kdy</span><div class="chips">' +
        chips.map(function (c) { return '<button type="button" class="chip" data-when="' + c + '" aria-pressed="' + (d.whenChip === c) + '">' + c + '</button>'; }).join('') + '</div>' +
        (d.whenChip === 'Jindy…' ? '<input id="f-date" type="date" class="box-input mt-8" value="' + esc(d.whenDate) + '" style="max-width:260px">' : '') +
        '</div>' +
        '<div class="row between gap-16"><a href="#/nahlasit" class="btn ghost lg">Zpět</a><button type="button" class="btn lg" data-act="next" ' + (d.place.trim() ? '' : 'disabled') + '>Pokračovat</button></div>' +
        '</div>';
    }
    if (step === 3) {
      var preview = { status: d.status, title: d.title, place: d.place, added: today(), cat: d.cat, icon: ICON_BY_CAT[d.cat], photos: d.photos };
      body =
        '<h1 class="h-l mt-32">Zkontrolujte a zveřejněte</h1>' +
        '<div class="stack gap-32 mt-32">' +
        '<div class="row gap-12" style="align-items:flex-start;padding:16px 18px;border-radius:16px;border:1px solid var(--line)">' + ic('shield', 20, 1.8, ' style="flex:none;color:var(--found)"') +
        '<span class="stack gap-4"><b style="font-weight:600">Zveřejníte jako ověřený uživatel</b><span class="small muted">Vaše jméno ani kontakt se nezobrazí. Ostatní uvidí jen štítek „Ověřený uživatel“. Zprávy od nálezců vám přijdou do Zpráv.</span></span></div>' +
        '<div class="stack gap-12"><span class="xs muted" style="text-transform:uppercase;letter-spacing:.06em">Takhle to uvidí ostatní</span>' +
        '<div class="row gap-16" style="padding:12px;border-radius:18px;background:var(--soft-2)"><div style="width:88px;flex:none">' + thumb(preview, 'border-radius:12px') + '</div>' +
        '<div class="stack gap-4">' + statusHtml(preview, 'dnes') + '<b style="font-weight:500">' + esc(d.title) + '</b><span class="small muted">' + esc(d.place) + '</span></div></div></div>' +
        '<div class="row between gap-16"><a href="#/nahlasit/2" class="btn ghost lg">Zpět</a><button type="button" class="btn lg" data-act="publish">Zveřejnit</button></div>' +
        '</div>';
    }

    return {
      html: '<div class="wrap page"><div class="narrow">' + head + body + '</div></div>',
      title: 'Nahlásit', noTabbar: true, keepScroll: false,
      after: function () {
        var t = app.querySelector('#f-title');
        if (t) t.addEventListener('input', function () {
          d.title = t.value;
          if (!d.catManual) d.cat = guessCat(t.value);
          var line = document.getElementById('cat-line');
          line.hidden = !d.cat;
          document.getElementById('cat-name').textContent = catLabel(d.cat);
          app.querySelector('[data-act="next"]').disabled = !d.title.trim();
          document.getElementById('serial-field').hidden = !(d.cat === 'kola' || d.cat === 'elektronika');
          save();
        });
        bindInput('#f-marks', 'marks'); bindInput('#f-serial', 'serial'); bindInput('#f-email', 'email'); bindInput('#f-date', 'whenDate');
        var pl = app.querySelector('#f-place');
        if (pl) pl.addEventListener('input', function () { d.place = pl.value; app.querySelector('[data-act="next"]').disabled = !d.place.trim(); save(); });

        app.querySelectorAll('[data-status]').forEach(function (b) { b.addEventListener('click', function () { d.status = b.dataset.status; save(); render(); }); });
        app.querySelectorAll('[data-when]').forEach(function (b) { b.addEventListener('click', function () { d.whenChip = b.dataset.when; save(); render(); }); });
        app.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { d.photos.splice(+b.dataset.del, 1); save(); render(); }); });

        onApp('click', function (e) {
          var b = e.target.closest('[data-act]');
          if (!b) return;
          var a = b.dataset.act;
          if (a === 'photo') addPhoto(function (url) { d.photos.push(url); save(); render(); }, 'Nahlásit');
          if (a === 'next') go('#/nahlasit/' + (step + 1));
          if (a === 'cat') {
            sheet('<h2 class="h-s">Kategorie</h2><div class="chips">' + D.categories.map(function (c) { return '<button type="button" class="chip" data-c="' + c.id + '" aria-pressed="' + (d.cat === c.id) + '">' + c.label + '</button>'; }).join('') + '</div>',
              function (s, close) { s.querySelectorAll('[data-c]').forEach(function (x) { x.addEventListener('click', function () { d.cat = x.dataset.c; d.catManual = true; save(); close(); render(); }); }); });
          }
          if (a === 'geo') {
            if (!navigator.geolocation) { toast('Poloha není v tomto prohlížeči dostupná.'); return; }
            b.textContent = 'Zjišťuji polohu…';
            navigator.geolocation.getCurrentPosition(function () {
              d.place = 'Vaše okolí (přibližně)'; save(); render(); toast('Poloha zjištěna. V ostré verzi doplníme obec.');
            }, function () { toast('Polohu se nepodařilo zjistit. Napište obec ručně.'); render(); }, { timeout: 8000, maximumAge: 600000 });
          }
          if (a === 'publish') {
            var whenTxt = d.whenChip === 'Jindy…' && d.whenDate ? new Date(d.whenDate).toLocaleDateString('cs-CZ') : d.whenChip.toLowerCase().replace('…', '');
            var rec = {
              id: 'P-' + uid(''), status: d.status, cat: d.cat || 'ostatni', icon: ICON_BY_CAT[d.cat] || 'box',
              title: d.title.trim(), desc: d.marks.trim(), place: d.place.trim(), when: whenTxt, added: today(),
              serial: d.serial.trim() || undefined, photos: d.photos.slice(), mine: true, verified: true
            };
            store.userRecords.unshift(rec);
            if (store.watches.indexOf(rec.id) < 0) store.watches.push(rec.id);
            store.draft = null; save();
            go('#/nahlasit/hotovo/' + rec.id);
          }
        });
      }
    };
    function bindInput(sel, field) {
      var el = app.querySelector(sel);
      if (el) el.addEventListener('input', function () { d[field] = el.value; save(); });
    }
  };

  function nahlasitHotovo(id) {
    var r = getRecord(id);
    if (!r) return VIEWS.__404();
    var html =
      '<div class="wrap page"><div class="narrow stack gap-24" style="padding-top:24px">' +
      '<span class="icon-btn dark" style="width:56px;height:56px">' + ic('check', 24, 2.5) + '</span>' +
      '<h1 class="h-l">Zveřejněno</h1>' +
      '<p class="lead" style="margin:0">Hlídáme nové záznamy, nálezy i kontroly z bazarů. Když se objeví něco podobného, dáme vám vědět.</p>' +
      '<a href="#/zaznam/' + esc(r.id) + '" class="row gap-16" style="padding:12px;border-radius:18px;background:var(--soft-2);text-decoration:none"><div style="width:72px;flex:none">' + thumb(r, 'border-radius:12px') + '</div><div class="stack gap-4">' + statusHtml(r, 'dnes') + '<b style="font-weight:500">' + esc(r.title) + '</b><span class="small muted">Zobrazit záznam →</span></div></a>' +
      (r.status === 'stolen' ? '<a href="#/oznameni/' + esc(r.id) + '" class="card dark" style="padding:24px"><span class="h-s">Připravte trestní oznámení</span><span class="muted small">Většinu máme vyplněnou. Zbývají tři otázky a výběr, jak ho podáte.</span><span style="font-weight:500;margin-top:6px">Pokračovat →</span></a>' : '') +
      (isMobile() && !isStandalone() ? '<a href="#/instalace" class="card" style="padding:20px"><span style="font-weight:600">Chcete upozornění do telefonu?</span><span class="small muted">Přidejte si ZOVE na plochu.</span></a>' : '') +
      '<a href="#/" class="btn ghost lg">Hotovo</a>' +
      '</div></div>';
    return { html: html, title: 'Zveřejněno' };
  }

  /* ---------- Viděl/a jsem to (zpráva majiteli) ---------- */
  VIEWS.videl = function (p, q) {
    var r = getRecord(p[0]);
    if (!r) return VIEWS.__404();
    var owner = !!q.vlastnik;
    var st = VIEWS.videl.state || (VIEWS.videl.state = {});
    if (st.id !== r.id) { st.id = r.id; st.where = 'Inzerát'; st.reply = 'zove'; st.sent = false; st.photo = null; }
    var places = {
      'Inzerát': ['Odkaz na inzerát', 'https://…'],
      'Bazar nebo zastavárna': ['Název a adresa', 'např. zastavárna na Vinohradské'],
      'Aukce': ['Aukční síň a číslo položky', 'např. podzimní aukce, položka 128'],
      'Jinde': ['Kde přesně', 'Ulice, místo, situace…']
    };
    var html;
    if (st.sent) {
      html = '<div class="stack gap-16 mt-48"><span class="icon-btn dark" style="width:52px;height:52px">' + ic('check', 22, 2.5) + '</span>' +
        '<h1 class="h-m">Děkujeme. ' + (owner ? 'Nálezce dostal zprávu.' : 'Majitel dostal zprávu.') + '</h1>' +
        '<p class="muted" style="margin:0">Odpověď vám přijde do <a href="#/zpravy">Zpráv</a> a e-mailem. ' + (r.police ? 'Věc má podané oznámení, informaci proto předáme i policii.' : '') + '</p>' +
        '<div class="row gap-8 mt-8"><a href="#/zaznam/' + esc(r.id) + '" class="btn ghost">Zpět na záznam</a><a href="#/" class="btn">Domů</a></div></div>';
    } else if (owner) {
      html = '<h1 class="h-m mt-32">Jak poznáte, že je to vaše?</h1>' +
        '<form class="stack gap-24 mt-24" data-form="tip">' +
        '<div class="field"><label for="v-msg">Popište něco, co není na fotce</label><input id="v-msg" class="u-input" type="text" placeholder="Rytina, poškození, obsah…" required></div>' +
        '<div class="row between gap-16"><span class="xs muted">Nálezce neuvidí váš e-mail.</span><button type="submit" class="btn lg">Odeslat</button></div></form>';
    } else {
      html = '<h1 class="h-m mt-32">Kde jste to viděl/a?</h1>' +
        '<form class="stack gap-24 mt-24" data-form="tip">' +
        '<div class="chips">' + Object.keys(places).map(function (k) { return '<button type="button" class="chip" data-where="' + k + '" aria-pressed="' + (st.where === k) + '">' + k + '</button>'; }).join('') + '</div>' +
        '<div class="field"><label for="v-where">' + places[st.where][0] + '</label><input id="v-where" class="u-input" type="text" placeholder="' + esc(places[st.where][1]) + '" required></div>' +
        '<div class="field"><label for="v-msg">Zpráva pro majitele (nepovinné)</label><input id="v-msg" class="u-input" type="text" placeholder="Kdy, za kolik, cokoli dalšího…"></div>' +
        '<div class="row gap-12">' + (st.photo ? '<div class="photo" style="width:64px;height:64px"><img src="' + st.photo + '" alt="Přiložená fotka"></div>' : '') +
        '<button type="button" class="btn ghost sm" data-act="photo">' + ic('camera', 16) + (st.photo ? 'Vyměnit fotku' : 'Přiložit fotku nebo snímek inzerátu') + '</button></div>' +
        '<fieldset style="border:0;margin:0;padding:0" class="stack gap-8"><legend class="small muted" style="padding:0;margin-bottom:8px">Jak se vám majitel může ozvat</legend>' +
        '<button type="button" class="radio-row" data-reply="zove" aria-pressed="' + (st.reply === 'zove') + '"><span><b>Přes ZOVE</b><span class="s">Anonymní konverzace, e-mail zůstane skrytý</span></span><span class="r"></span></button>' +
        '<button type="button" class="radio-row" data-reply="once" aria-pressed="' + (st.reply === 'once') + '"><span><b>Jen jednorázově</b><span class="s">Pošlu informaci a nechci odpověď</span></span><span class="r"></span></button>' +
        '</fieldset>' +
        '<div class="row between gap-16"><span class="xs muted">Váš e-mail majitel neuvidí.</span><button type="submit" class="btn lg">Odeslat</button></div></form>';
    }
    return {
      html: '<div class="wrap page"><div class="narrow">' +
        '<a href="#/zaznam/' + esc(r.id) + '" class="row gap-16" style="padding:10px;border-radius:16px;background:var(--soft-2);text-decoration:none"><div style="width:56px;flex:none">' + thumb(r, 'border-radius:10px') + '</div><div class="stack">' + statusHtml(r, r.place) + '<b style="font-weight:500;font-size:15px">' + esc(r.title) + '</b></div></a>' +
        html + '</div></div>',
      title: 'Dát vědět', noTabbar: !st.sent,
      after: function () {
        app.querySelectorAll('[data-where]').forEach(function (b) { b.addEventListener('click', function () { st.where = b.dataset.where; render(); }); });
        app.querySelectorAll('[data-reply]').forEach(function (b) { b.addEventListener('click', function () { st.reply = b.dataset.reply; render(); }); });
        var ph = app.querySelector('[data-act="photo"]');
        if (ph) ph.addEventListener('click', function () { addPhoto(function (url) { st.photo = url; render(); }, 'Přiložit fotku'); });
        var f = app.querySelector('[data-form="tip"]');
        if (f) f.addEventListener('submit', function (e) {
          e.preventDefault();
          var where = (app.querySelector('#v-where') || {}).value || '';
          var msg = (app.querySelector('#v-msg') || {}).value || '';
          // když je to vlastní záznam, zpráva rovnou přijde do Zpráv – ať je vidět, jak to funguje
          if (isMine(r)) {
            store.messages.unshift({ id: uid('m'), recordId: r.id, from: 'Nálezce', text: (st.where + ': ' + where + (msg ? ' – ' + msg : '')).trim(), when: 'teď', unread: true, thread: [] });
            save();
          }
          st.sent = true; render();
        });
      }
    };
  };

  /* ---------- Ověřit před koupí ---------- */
  VIEWS.overit = function (p, q) {
    var mode = q.mode || 'kod';
    var st = VIEWS.overit.state || (VIEWS.overit.state = { photo: null, value: '' });
    var last = q.vysledek ? store.checks.find(function (c) { return c.id === q.vysledek; }) : null;
    var tabs = [['kod', 'Číslo'], ['foto', 'Fotka'], ['odkaz', 'Odkaz']];
    var input = '';
    if (mode === 'kod') {
      input = '<form class="pill-search mt-24" data-form="check" style="box-shadow:none"><label for="c-val" class="sr">Sériové číslo</label>' +
        '<input id="c-val" class="mono" type="text" value="' + esc(st.value) + '" placeholder="Sériové číslo, IMEI, číslo rámu…" autocomplete="off" autocapitalize="characters" style="font-size:16px">' +
        '<button type="button" class="icon-btn" data-act="scan" aria-label="Naskenovat kód">' + ic('scan', 20) + '</button>' +
        '<button type="submit" class="btn">Ověřit</button></form>' +
        '<p class="xs muted" style="margin:10px 0 0 22px">Tip pro prototyp: zkuste <button type="button" class="link-btn xs mono" style="padding:0" data-fill="WTU0458812">WTU0458812</button> (shoda) nebo jakékoli jiné číslo.</p>';
    } else if (mode === 'foto') {
      input = '<div class="row wrap-row gap-16 mt-24" style="padding:20px;border:1px dashed #C7C7C7;border-radius:20px">' +
        '<div style="width:112px;flex:none">' + (st.photo ? '<div class="thumb" style="border-radius:14px"><img src="' + st.photo + '" alt="Fotka k ověření"></div>' : '<div class="thumb" style="border-radius:14px">' + ic('image', 40, 1.4) + '</div>') + '</div>' +
        '<div class="stack gap-8" style="flex:1 1 200px"><b style="font-weight:500">' + (st.photo ? 'Fotka připravená' : 'Vyfoťte věc nebo nahrajte fotku z inzerátu') + '</b>' +
        '<div class="row gap-8 wrap-row"><button type="button" class="btn ghost sm" data-act="photo">' + ic('camera', 16) + (st.photo ? 'Jiná fotka' : 'Přidat fotku') + '</button>' +
        '<button type="button" class="btn sm" data-act="check-photo" ' + (st.photo ? '' : 'disabled') + '>Ověřit</button></div>' +
        '<span class="xs muted">V prototypu se fotka porovná naoko. <button type="button" class="link-btn xs" style="padding:0" data-act="demo-match">Ukázat shodu</button></span></div></div>';
    } else {
      input = '<form class="pill-search mt-24" data-form="check" style="box-shadow:none"><label for="c-val" class="sr">Odkaz na inzerát</label>' +
        '<input id="c-val" type="url" value="' + esc(st.value) + '" placeholder="https://… odkaz na inzerát" autocomplete="off">' +
        '<button type="submit" class="btn">Ověřit</button></form>' +
        '<p class="xs muted" style="margin:10px 0 0 22px">V ostré verzi si fotky z inzerátu stáhneme sami.</p>';
    }

    var result = '';
    if (last) {
      var rec = last.recordId ? getRecord(last.recordId) : null;
      if (last.result === 'match' && rec) {
        result = '<div class="result bad"><div class="row gap-12"><span class="badge">' + ic('alert', 20, 2.5) + '</span><h2 class="h-s">Možná shoda s ' + (rec.status === 'stolen' ? 'odcizenou' : 'ztracenou') + ' věcí</h2></div>' +
          '<a href="#/zaznam/' + esc(rec.id) + '" class="row gap-16" style="padding:12px;border-radius:16px;background:#fff;text-decoration:none"><div style="width:80px;flex:none">' + thumb(rec, 'border-radius:12px') + '</div><div class="stack gap-4">' + statusHtml(rec, rec.place + (rec.police ? ' · nahlášeno policii' : '')) + '<b style="font-weight:500">' + esc(rec.title) + '</b><span class="small" style="color:var(--ink-2)">Zobrazit záznam →</span></div></a>' +
          '<div class="stack gap-8" style="font-size:15px;color:var(--ink-2)"><b style="color:var(--ink);font-weight:600">Co teď</b><span>1. Věc nekupujte a neplaťte zálohu.</span><span>2. Neupozorňujte prodávajícího.</span><span>3. Dejte vědět majiteli – anonymně, přes nás.</span></div>' +
          '<div class="row gap-8 wrap-row"><a href="#/videl/' + esc(rec.id) + '" class="btn">Dát vědět majiteli</a><a href="tel:158" class="btn ghost">Zavolat policii 158</a></div></div>';
      } else {
        result = '<div class="result ok"><div class="row gap-12"><span class="badge">' + ic('check', 20, 2.5) + '</span><div class="stack"><h2 class="h-s">Žádná shoda</h2>' + (last.query ? '<span class="xs mono muted">' + esc(last.query) + '</span>' : '') + '</div></div>' +
          '<ul class="dl" style="list-style:none;padding:0;margin:0">' + ['Záznamy uživatelů', 'Policejní evidence PSEUD (cílový stav)', 'Interpol – odcizená umělecká díla (cílový stav)'].map(function (s) { return '<li style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #DCEBE0"><span>' + s + '</span><span style="color:var(--found)">bez shody</span></li>'; }).join('') + '</ul>' +
          '<div class="cert"><span class="stack"><span style="font-weight:500">Ověřovací výpis</span><span class="xs mono muted">č. ' + esc(last.id) + ' · ' + fmtDateTime(last.at) + '</span></span><a href="#/vypis/' + esc(last.id) + '" class="btn sm">Zobrazit výpis</a></div>' +
          '<span class="xs muted">Čistý výsledek neznamená záruku – žádná databáze není úplná. Ptejte se i na původ věci a doklad o koupi.</span></div>';
      }
    }

    var html =
      '<div class="wrap page"><div class="mid">' +
      '<h1 class="h-l">Ověřte věc dřív, než zaplatíte</h1>' +
      '<p class="lead">Obraz z inzerátu, kolo z bazaru, telefon z druhé ruky. Výsledek dostanete s časovým razítkem.</p>' +
      '<div class="seg mt-32" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" aria-pressed="' + (mode === t[0]) + '" data-mode="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      input +
      (result ? '<section class="mt-48" id="result" tabindex="-1"><span class="xs muted">Výsledek</span><div class="mt-8">' + result + '</div></section>' : '') +
      '</div></div>';

    function runCheck(value, kind, forceMatch) {
      var n = normSerial(value);
      var rec = null;
      if (kind === 'kod' && n) rec = allRecords().find(function (r) { return r.serial && normSerial(r.serial) === n && (r.status === 'stolen' || r.status === 'lost'); });
      if (forceMatch) rec = getRecord('24-0118');
      var c = { id: 'OV-' + new Date().toISOString().slice(2, 10).replace(/-/g, '').slice(2) + '-' + Math.floor(1000 + Math.random() * 9000), at: Date.now(), mode: kind, query: kind === 'foto' ? 'fotka' : value, result: rec ? 'match' : 'clean', recordId: rec ? rec.id : null };
      store.checks.unshift(c); save();
      go('#/overit?mode=' + kind + '&vysledek=' + c.id);
      setTimeout(function () { var el = document.getElementById('result'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.focus({ preventScroll: true }); } }, 60);
    }

    return {
      html: html, title: 'Ověřit před koupí', keepScroll: !!last,
      after: function () {
        app.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { go('#/overit?mode=' + b.dataset.mode); }); });
        var f = app.querySelector('[data-form="check"]');
        if (f) {
          var inp = f.querySelector('input');
          inp.addEventListener('input', function () { st.value = inp.value; });
          f.addEventListener('submit', function (e) { e.preventDefault(); if (!inp.value.trim()) { inp.focus(); return; } runCheck(inp.value.trim(), mode); });
        }
        app.querySelectorAll('[data-fill]').forEach(function (b) { b.addEventListener('click', function () { st.value = b.dataset.fill; runCheck(b.dataset.fill, 'kod'); }); });
        onApp('click', function (e) {
          var b = e.target.closest('[data-act]');
          if (!b) return;
          if (b.dataset.act === 'scan') openCamera({ mode: 'scan', onCode: function (code) { st.value = code; toast('Naskenováno: ' + code); runCheck(code, 'kod'); }, onSkip: function () { var i = app.querySelector('#c-val'); if (i) i.focus(); } });
          if (b.dataset.act === 'photo') addPhoto(function (url) { st.photo = url; render(); }, 'Vyfotit věc k ověření');
          if (b.dataset.act === 'check-photo') runCheck('', 'foto');
          if (b.dataset.act === 'demo-match') runCheck('', 'foto', true);
        });
      }
    };
  };

  /* ---------- Ověřovací výpis (tisk) ---------- */
  VIEWS.vypis = function (p) {
    var c = store.checks.find(function (x) { return x.id === p[0]; });
    if (!c) return VIEWS.__404();
    var rec = c.recordId ? getRecord(c.recordId) : null;
    var html =
      '<div class="wrap page"><div class="mid">' +
      '<div class="row between wrap-row gap-12 no-print"><a href="javascript:history.back()" class="small muted" style="text-decoration:none">← Zpět</a>' +
      '<div class="row gap-8"><button type="button" class="btn ghost sm" data-act="share">' + ic('share', 16) + 'Sdílet</button><button type="button" class="btn sm" data-act="print">Tisk / PDF</button></div></div>' +
      '<article class="doc mt-24" style="font-family:Geist,system-ui,sans-serif">' +
      '<div class="row between" style="align-items:flex-start"><span class="logo" style="font-size:18px"><span class="logo-dot"></span>zove</span><span class="mono xs muted" style="text-align:right">č. ' + esc(c.id) + '<br>' + fmtDateTime(c.at) + '</span></div>' +
      '<h1 class="h-m" style="margin-top:32px;font-family:Geist,system-ui,sans-serif">Ověřovací výpis</h1>' +
      '<p class="muted">Výpis dokládá, že předmět byl v uvedený čas prověřen proti databázi ztracených a odcizených věcí.</p>' +
      '<dl class="dl" style="margin-top:24px"><div><dt>Způsob ověření</dt><dd>' + ({ kod: 'sériové číslo', foto: 'fotografie', odkaz: 'odkaz na inzerát' }[c.mode] || '') + '</dd></div>' +
      '<div><dt>Dotaz</dt><dd class="mono">' + esc(c.query || '—') + '</dd></div>' +
      '<div><dt>Výsledek</dt><dd style="font-weight:600;color:' + (c.result === 'match' ? 'var(--stolen)' : 'var(--found)') + '">' + (c.result === 'match' ? 'možná shoda – záznam ' + esc(rec ? rec.id : '') : 'bez shody') + '</dd></div></dl>' +
      '<p class="xs muted" style="margin-top:24px">Žádná databáze není úplná a čistý výsledek není zárukou původu věci. Pravost výpisu ověříte na adrese zove.cz/v/' + esc(c.id) + '. Prototyp – výpis nemá právní váhu.</p>' +
      '</article></div></div>';
    return {
      html: html, title: 'Výpis ' + c.id,
      after: function () {
        app.querySelector('[data-act="print"]').addEventListener('click', function () { window.print(); });
        app.querySelector('[data-act="share"]').addEventListener('click', function () { shareLink('Ověřovací výpis ' + c.id, location.href); });
      }
    };
  };

  /* ---------- Trestní oznámení ---------- */
  var HOW = {
    'Vloupání': 'Pachatel se do prostor dostal násilím.',
    'Bez stop násilí': 'Na místě nebyly zjištěny stopy násilného vniknutí.',
    'Měl přístup někdo další': 'K prostorám měly přístup i další osoby.',
    'Nevím': ''
  };
  var WAYS = [
    { id: 'osobne', label: 'Osobně', sub: 'Na kterékoli služebně Policie ČR, nemusí být místní', to: 'Policie České republiky\nkterékoli obvodní oddělení' },
    { id: 'ds', label: 'Datovou schránkou', sub: 'Odešlete PDF ze své datové schránky', to: 'Policie České republiky\nkrajské ředitelství podle místa činu' },
    { id: 'posta', label: 'Poštou', sub: 'Doporučeně na policii nebo státní zastupitelství', to: 'Policie České republiky\nkrajské ředitelství podle místa činu' }
  ];

  VIEWS.oznameni = function (p) {
    if (!p[0]) {
      var mine = store.userRecords.filter(function (r) { return r.status === 'stolen'; });
      if (mine.length === 1) { setTimeout(function () { go('#/oznameni/' + mine[0].id); }); return ''; }
      var html =
        '<div class="wrap page"><div class="mid">' +
        '<h1 class="h-l">Trestní oznámení na neznámého pachatele</h1>' +
        '<p class="lead">Připravíme ho z vašeho záznamu o krádeži. Zbývají tři otázky a výběr, jak ho podáte.</p>' +
        (mine.length
          ? '<div class="stack gap-12 mt-32">' + mine.map(function (r) { return '<a href="#/oznameni/' + esc(r.id) + '" class="row gap-16" style="padding:12px;border-radius:18px;border:1px solid var(--line);text-decoration:none"><div style="width:64px;flex:none">' + thumb(r, 'border-radius:12px') + '</div><b style="font-weight:500;flex:1">' + esc(r.title) + '</b>' + ic('chevron', 18) + '</a>'; }).join('') + '</div>'
          : '<div class="stack gap-16 mt-32"><div class="note">Nejdřív nahlaste krádež – oznámení pak vyplníme z vašeho záznamu.</div>' +
            '<div class="row gap-8 wrap-row"><a href="#/nahlasit" class="btn lg">Nahlásit krádež</a><a href="#/oznameni/24-0118" class="btn ghost lg">Ukázka s hotovým záznamem</a></div></div>') +
        '</div></div>';
      return { html: html, title: 'Trestní oznámení', nav: 'oznameni' };
    }
    var r = getRecord(p[0]);
    if (!r) return VIEWS.__404();
    var c = store.complaints[r.id] || (store.complaints[r.id] = { how: 'Vloupání', found: r.when || '', value: '', way: 'osobne', edited: null });
    var way = WAYS.find(function (w) { return w.id === c.way; });

    function docHtml() {
      var how = HOW[c.how];
      return '<p style="text-align:right;white-space:pre-line">' + esc(way.to) + '</p>' +
        '<p style="margin-top:28px"><span class="muted">Oznamovatel:</span> ' + (store.user && store.user.verified && store.user.profile.name
          ? esc(store.user.profile.name) + ', nar. ' + esc(store.user.profile.birth) + ', bytem ' + esc(store.user.profile.address) + (store.user.profile.phone ? ', tel. ' + esc(store.user.profile.phone) : '')
          : '<span class="hl">[jméno a příjmení]</span>, nar. <span class="hl">[datum]</span>, bytem <span class="hl">[adresa]</span>') + '</p>' +
        '<p class="title">Trestní oznámení na neznámého pachatele</p>' +
        '<p>Oznamuji, že ' + (c.found ? (/^\d/.test(c.found.trim()) ? 'dne ' : '') + esc(c.found) + ' ' : '') + 'jsem zjistil/a, že mi byl odcizen předmět: ' + esc(r.title.toLowerCase()) + (r.size ? ', rozměr ' + esc(r.size) : '') + (r.serial ? ', výrobní/sériové číslo ' + esc(r.serial) : '') + '. ' + (r.desc ? esc(r.desc) + ' ' : '') + 'Místo: ' + esc(r.place) + '. ' + esc(how) + '</p>' +
        '<p>Mám za to, že jednáním neznámého pachatele mohlo dojít ke spáchání trestného činu krádeže podle § 205 trestního zákoníku. Výši škody odhaduji na ' + (c.value ? esc(c.value) : '<span class="hl">[doplňte]</span>') + '.</p>' +
        '<p>Přikládám fotografie předmětu' + (r.id ? ' a odkaz na veřejný záznam č. ' + esc(r.id) : '') + '. Podle § 158 odst. 2 trestního řádu žádám o vyrozumění o učiněných opatřeních.</p>' +
        '<p style="margin-top:28px">V <span class="hl">[místo]</span> dne <span class="hl">[datum]</span><br><br>…………………………<br>podpis</p>';
    }

    var html =
      '<div class="wrap page">' +
      '<div class="no-print"><span class="small muted">' + esc(r.title) + (isMine(r) ? '' : ' · ukázkový záznam') + '</span>' +
      '<h1 class="h-l mt-8" style="max-width:720px">Trestní oznámení na neznámého pachatele</h1>' +
      '<p class="lead" style="max-width:600px">Většinu jsme vyplnili ze záznamu. Odpovězte na tři otázky a vyberte, jak oznámení podáte.</p></div>' +
      '<div class="split mt-48">' +
      '<form class="main-col stack gap-32 no-print" style="flex:1 1 400px" data-form="complaint" onsubmit="return false">' +
      '<div class="row gap-12" style="align-items:flex-start"><span class="icon-btn dark" style="width:28px;height:28px">' + ic('check', 14, 3) + '</span><div class="stack"><b style="font-weight:600">Převzato ze záznamu</b><span class="small muted">Popis, fotky, místo a doba.</span></div></div>' +
      '<div class="stack gap-24"><b style="font-weight:600">Tři otázky</b>' +
      '<div class="field"><span class="label">Jak se k věci pachatel dostal?</span><div class="chips">' + Object.keys(HOW).map(function (h) { return '<button type="button" class="chip" data-how="' + h + '" aria-pressed="' + (c.how === h) + '">' + h + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label for="o-found">Kdy jste zjistil/a, že věc chybí?</label><input id="o-found" class="u-input" style="font-size:18px" type="text" value="' + esc(c.found) + '" placeholder="např. 12. 11. 2011, ráno"></div>' +
      '<div class="field"><label for="o-value">Odhad hodnoty (může být hrubý)</label><input id="o-value" class="u-input" style="font-size:18px" type="text" inputmode="numeric" value="' + esc(c.value) + '" placeholder="např. 100 000 Kč"></div>' +
      '</div>' +
      '<div class="stack gap-12"><b style="font-weight:600">Jak ho podáte?</b>' + WAYS.map(function (w) { return '<button type="button" class="radio-row" data-way="' + w.id + '" aria-pressed="' + (c.way === w.id) + '"><span><b>' + w.label + '</b><span class="s">' + w.sub + '</span></span><span class="r"></span></button>'; }).join('') + '</div>' +
      '<div class="note"><b style="font-weight:600;color:var(--ink)">S sebou si vezměte</b><br>Občanský průkaz · tento dokument vytištěný · fotky věci · doklad o pořízení nebo dědictví, pokud ho máte</div>' +
      '</form>' +
      '<aside class="side-col stack gap-16" style="flex:1 1 460px">' +
      '<div class="row between wrap-row gap-8 no-print"><span class="xs muted">Náhled dokumentu · průběžně se doplňuje</span><div class="row gap-8"><button type="button" class="btn ghost sm" data-act="edit">' + (c.edited !== null ? 'Hotovo' : 'Upravit text') + '</button><button type="button" class="btn sm" data-act="print">Stáhnout PDF</button></div></div>' +
      '<article class="doc" id="doc"' + (c.editing ? ' contenteditable="true"' : '') + '>' + (c.edited !== null ? c.edited : docHtml()) + '</article>' +
      '<p class="xs muted no-print" style="margin:0">ZOVE není právní služba. Text je návrh, před podáním si ho přečtěte. Žlutá místa doplníte vy.</p>' +
      (isMine(r) ? '<div class="row gap-12 no-print" style="padding:16px 18px;border:1px solid var(--line);border-radius:16px"><span class="small" style="flex:1;color:var(--ink-2)">' + (r.caseNo ? 'Číslo jednací: <b class="mono">' + esc(r.caseNo) + '</b>' : 'Po podání doplňte číslo jednací a záznam dostane štítek „Nahlášeno policii“.') + '</span><button type="button" class="btn ghost sm" data-act="caseno">' + (r.caseNo ? 'Změnit' : 'Doplnit') + '</button></div>' : '') +
      '</aside></div></div>';

    return {
      html: html, title: 'Trestní oznámení', nav: 'oznameni', keepScroll: true,
      after: function () {
        function refreshDoc() { if (c.edited === null) document.getElementById('doc').innerHTML = docHtml(); save(); }
        app.querySelectorAll('[data-how]').forEach(function (b) { b.addEventListener('click', function () { c.how = b.dataset.how; c.edited = null; save(); render(); }); });
        app.querySelectorAll('[data-way]').forEach(function (b) { b.addEventListener('click', function () { c.way = b.dataset.way; way = WAYS.find(function (w) { return w.id === c.way; }); c.edited = null; save(); render(); }); });
        var fi = app.querySelector('#o-found'), vi = app.querySelector('#o-value');
        fi.addEventListener('input', function () { c.found = fi.value; refreshDoc(); });
        vi.addEventListener('input', function () { c.value = vi.value; refreshDoc(); });
        app.querySelector('[data-act="print"]').addEventListener('click', function () { window.print(); });
        app.querySelector('[data-act="edit"]').addEventListener('click', function () {
          var docEl = document.getElementById('doc');
          if (c.editing) { c.edited = docEl.innerHTML; c.editing = false; toast('Úpravy uloženy. Změna odpovědí je přepíše.'); }
          else { c.editing = true; if (c.edited === null) c.edited = docEl.innerHTML; }
          save(); render();
          if (c.editing) document.getElementById('doc').focus();
        });
        var cn = app.querySelector('[data-act="caseno"]');
        if (cn) cn.addEventListener('click', function () {
          sheet('<h2 class="h-s">Číslo jednací</h2><p class="small muted" style="margin:0">Najdete ho na potvrzení, které jste dostali na policii.</p><input class="box-input mono" id="caseno" placeholder="např. KRPA-123456/TČ-2026-001111" value="' + esc(r.caseNo || '') + '"><button type="button" class="btn lg" data-ok>Uložit</button>',
            function (s, close) {
              s.querySelector('[data-ok]').addEventListener('click', function () {
                var v = s.querySelector('#caseno').value.trim();
                var rec = store.userRecords.find(function (x) { return x.id === r.id; });
                if (rec) { rec.caseNo = v || undefined; rec.police = !!v; save(); }
                close(); toast(v ? 'Záznam má štítek „Nahlášeno policii“.' : 'Číslo jednací odebráno.'); render();
              });
            });
        });
      }
    };
  };

  /* ---------- Zprávy ---------- */
  VIEWS.zpravy = function (p) {
    if (p[0]) {
      var m = store.messages.find(function (x) { return x.id === p[0]; });
      if (!m) return VIEWS.__404();
      if (m.unread) { m.unread = false; save(); }
      var r = getRecord(m.recordId);
      var html =
        '<div class="wrap page"><div class="narrow">' +
        '<a href="#/zpravy" class="small muted" style="text-decoration:none">← Zprávy</a>' +
        (r ? '<a href="#/zaznam/' + esc(r.id) + '" class="row gap-12 mt-16" style="padding:10px;border-radius:16px;background:var(--soft-2);text-decoration:none"><div style="width:48px;flex:none">' + thumb(r, 'border-radius:10px') + '</div><b style="font-weight:500;font-size:15px">' + esc(r.title) + '</b></a>' : '') +
        '<div class="stack gap-12 mt-24">' +
        '<div style="align-self:flex-start;max-width:85%;padding:12px 16px;border-radius:18px 18px 18px 6px;background:var(--soft)"><span class="xs muted">' + esc(m.from) + ' · ' + esc(m.when) + '</span><br>' + esc(m.text) + '</div>' +
        (m.thread || []).map(function (t) { return '<div style="align-self:flex-end;max-width:85%;padding:12px 16px;border-radius:18px 18px 6px 18px;background:var(--ink);color:#fff">' + esc(t) + '</div>'; }).join('') +
        '</div>' +
        '<form class="pill-search mt-32" data-form="reply" style="box-shadow:none"><label for="reply" class="sr">Odpověď</label><input id="reply" placeholder="Napsat odpověď…" autocomplete="off"><button type="submit" class="icon-btn dark" aria-label="Odeslat">' + ic('arrow', 18, 2) + '</button></form>' +
        '<p class="xs muted" style="margin:10px 0 0 22px">' + ic('lock', 12, 2, ' style="vertical-align:-1px"') + ' Odpovídáte přes ZOVE. Váš e-mail zůstane skrytý.</p>' +
        '</div></div>';
      return {
        html: html, title: 'Zpráva',
        after: function () {
          var f = app.querySelector('[data-form="reply"]');
          f.addEventListener('submit', function (e) {
            e.preventDefault();
            var v = f.querySelector('input').value.trim();
            if (!v) return;
            (m.thread = m.thread || []).push(v); save(); render();
            toast('Odesláno přes ZOVE.');
          });
        }
      };
    }
    var list = store.messages;
    var html2 =
      '<div class="wrap page"><div class="narrow">' +
      '<h1 class="h-l">Zprávy</h1>' +
      '<p class="lead" style="margin-top:8px">Od nálezců a majitelů. Kontakty zůstávají skryté.</p>' +
      (list.length ? '<ul style="list-style:none;margin:24px 0 0;padding:0">' + list.map(function (m) {
        var r = getRecord(m.recordId) || {};
        return '<li style="border-top:1px solid var(--line)"><a href="#/zpravy/' + esc(m.id) + '" class="row gap-16" style="padding:14px 0;text-decoration:none"><div style="width:56px;flex:none">' + thumb(r, 'border-radius:12px') + '</div>' +
          '<div class="stack" style="flex:1;min-width:0"><span class="row between gap-8"><b style="font-weight:' + (m.unread ? 600 : 500) + '">' + esc(m.from) + '</b><span class="xs muted">' + esc(m.when) + '</span></span>' +
          '<span class="small muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.title || '') + ' – ' + esc(m.text) + '</span></div>' +
          (m.unread ? '<span class="dot stolen" aria-label="Nepřečteno"></span>' : '') + '</a></li>';
      }).join('') + '</ul>' : '<div class="note mt-24">Zatím žádné zprávy.</div>') +
      '</div></div>';
    return { html: html2, title: 'Zprávy' };
  };


  /* ---------- Registrace a ověření ---------- */
  VIEWS.registrace = function (p, q) {
    var dalsi = q.dalsi || '';
    var qs = dalsi ? '?dalsi=' + encodeURIComponent(dalsi) : '';
    var step = p[0] || 'email';
    var reg = store.reg || (store.reg = {});
    var u = store.user;
    if (userReady()) { setTimeout(function () { go(dalsi ? '#/' + dalsi : '#/ucet'); }); return ''; }
    if (step === 'overeni' && !u) step = 'email';
    if (step === 'profil' && !(u && u.verified)) step = u ? 'overeni' : 'email';
    var n = { email: 1, kod: 2, overeni: 3, profil: 4 }[step] || 1;

    var head =
      '<div class="row between gap-12"><div class="progress" style="flex:1"><span>Krok ' + n + ' ze 4</span><span class="bar"><i style="width:' + (n * 25) + '%"></i></span></div>' +
      '<a href="#/" class="icon-btn" aria-label="Zavřít" style="margin-left:12px">' + ic('close', 18, 2) + '</a></div>';
    var body = '';

    if (step === 'email') {
      body =
        (dalsi === 'nahlasit'
          ? '<div class="row gap-12 mt-32" style="align-items:flex-start;padding:16px 18px;border-radius:16px;background:var(--soft-2)">' + ic('shield', 22, 1.8, ' style="flex:none;color:var(--found)"') +
            '<span class="stack gap-4"><b style="font-weight:600">Vkládat předměty mohou jen ověření uživatelé</b><span class="small" style="color:var(--ink-2)">Chrání to před falešnými hlášeními a díky tomu vám věří bazary i policie. Ověření zabere asi 2 minuty a děláte ho jen jednou.</span></span></div>'
          : '') +
        '<h1 class="h-l mt-32">Přihlášení a registrace</h1>' +
        '<form class="stack gap-32 mt-32" data-form="email">' +
        '<div class="field"><label for="r-email">E-mail</label><input id="r-email" class="u-input" type="email" inputmode="email" autocomplete="email" required value="' + esc(reg.email || '') + '" placeholder="vas@email.cz"></div>' +
        '<div class="row between gap-16 wrap-row"><span class="xs muted">Pošleme vám jednorázový kód. Žádné heslo.</span><button type="submit" class="btn lg">Poslat kód</button></div></form>';
    }
    if (step === 'kod') {
      body =
        '<h1 class="h-l mt-32">Zadejte kód</h1>' +
        '<p class="lead" style="margin-top:12px">Poslali jsme ho na <b style="color:var(--ink);font-weight:500">' + esc(reg.email || '') + '</b>.</p>' +
        '<form class="stack gap-32 mt-32" data-form="code">' +
        '<div class="field"><label for="r-code">Kód z e-mailu</label><input id="r-code" class="u-input mono" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required placeholder="000000" style="letter-spacing:.3em;font-size:28px">' +
        '<span class="xs muted">V prototypu stačí jakýchkoli 6 číslic.</span></div>' +
        '<div class="row between gap-16"><a href="#/registrace' + qs + '" class="btn ghost lg">Jiný e-mail</a><button type="submit" class="btn lg">Potvrdit</button></div></form>';
    }
    if (step === 'overeni') {
      var m = reg.method || 'bankid';
      var opts = [
        ['bankid', 'Bankovní identita', 'Přihlásíte se do svého internetového bankovnictví · asi 1 minuta', true],
        ['nia', 'Identita občana', 'eObčanka, NIA ID nebo Mobilní klíč eGovernmentu'],
        ['doklad', 'Doklad a selfie', 'Vyfotíte občanku a obličej · kontrola do 24 hodin']
      ];
      body =
        '<h1 class="h-l mt-32">Ověřte svou totožnost</h1>' +
        '<p class="lead" style="margin-top:12px">Jednou a natrvalo. Ověřené údaje nám zároveň vyplní profil, takže je nemusíte psát.</p>' +
        '<div class="stack gap-8 mt-32">' + opts.map(function (o) {
          return '<button type="button" class="radio-row" data-method="' + o[0] + '" aria-pressed="' + (m === o[0]) + '"><span><b>' + o[1] + (o[3] ? ' <span class="xs" style="font-weight:500;color:var(--found);margin-left:6px">doporučeno</span>' : '') + '</b><span class="s">' + o[2] + '</span></span><span class="r"></span></button>';
        }).join('') + '</div>' +
        '<p class="xs muted mt-16">' + ic('lock', 12, 2, ' style="vertical-align:-1px"') + ' Jméno, datum narození ani adresu nikdy nezveřejňujeme. Použijeme je jen do vašeho trestního oznámení a na žádost policie.</p>' +
        '<div class="row between gap-16 mt-32"><span></span><button type="button" class="btn lg" data-act="verify">Ověřit</button></div>';
    }
    if (step === 'profil') {
      var pr = u.profile || {};
      body =
        '<h1 class="h-l mt-32">Dokončete profil</h1>' +
        '<p class="lead" style="margin-top:12px">Údaje z ověření už máme. Zbývá telefon a souhlas.</p>' +
        '<dl class="dl mt-32">' +
        '<div><dt>Jméno</dt><dd>' + esc(pr.name) + '</dd></div><div><dt>Datum narození</dt><dd>' + esc(pr.birth) + '</dd></div><div><dt>Adresa</dt><dd>' + esc(pr.address) + '</dd></div></dl>' +
        '<span class="row gap-8 xs mt-8" style="color:var(--found)">' + ic('shield', 14, 2) + 'Ověřeno přes ' + esc(METHOD[u.method] || '') + ' · nelze měnit</span>' +
        '<form class="stack gap-32 mt-32" data-form="profile">' +
        '<div class="field"><label for="r-phone">Telefon</label><input id="r-phone" class="u-input" type="tel" inputmode="tel" autocomplete="tel" required value="' + esc(pr.phone || '') + '" placeholder="+420 …"><span class="xs muted">Jen pro případ, že vás potřebuje kontaktovat policie. Nezveřejňuje se.</span></div>' +
        '<label class="row gap-12 small" style="align-items:flex-start;cursor:pointer"><input type="checkbox" id="r-terms" required style="width:20px;height:20px;margin:0;flex:none;accent-color:#0A0A0A"' + (u.terms ? ' checked' : '') + '><span>Souhlasím s <a href="#/o-prototypu">podmínkami</a> a beru na vědomí, že vědomě nepravdivé hlášení může být trestné.</span></label>' +
        '<div class="row between gap-16"><span></span><button type="submit" class="btn lg">Dokončit</button></div></form>';
    }

    return {
      html: '<div class="wrap page"><div class="narrow">' + head + body + '</div></div>',
      title: 'Registrace', noTabbar: true, nav: 'ucet',
      after: function () {
        var fe = app.querySelector('[data-form="email"]');
        if (fe) fe.addEventListener('submit', function (e) {
          e.preventDefault();
          reg.email = app.querySelector('#r-email').value.trim(); save();
          toast('Kód odeslán (v prototypu naoko).');
          go('#/registrace/kod' + qs);
        });
        var fc = app.querySelector('[data-form="code"]');
        if (fc) fc.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!store.user || store.user.email !== reg.email) store.user = { email: reg.email, verified: false, profile: {} };
          save();
          go(store.user.verified ? '#/registrace/profil' + qs : '#/registrace/overeni' + qs);
        });
        app.querySelectorAll('[data-method]').forEach(function (b) { b.addEventListener('click', function () { reg.method = b.dataset.method; save(); render(); }); });
        var vb = app.querySelector('[data-act="verify"]');
        if (vb) vb.addEventListener('click', function () {
          var m = reg.method || 'bankid';
          function done() {
            store.user.verified = true; store.user.method = m;
            store.user.profile = Object.assign({}, store.user.profile, { name: 'Jan Novák', birth: '1. 1. 1980', address: 'Ukázková 12, 120 00 Praha 2' });
            save(); toast('Totožnost ověřena.'); go('#/registrace/profil' + qs);
          }
          if (m === 'doklad') {
            addPhoto(function () {
              toast('Teď selfie.');
              setTimeout(function () { addPhoto(function () { done(); }, 'Selfie'); }, 600);
            }, 'Přední strana občanky');
            return;
          }
          var close = sheet('<div class="stack gap-16" style="align-items:center;text-align:center;padding:12px 0"><span class="icon-btn" style="width:56px;height:56px">' + ic('shield', 26, 1.8) + '</span>' +
            '<b style="font-size:18px;font-weight:600">' + (m === 'bankid' ? 'Přesměrováváme do vaší banky…' : 'Přesměrováváme na Identitu občana…') + '</b>' +
            '<span class="small muted">V prototypu se ověření jen naoko simuluje.</span></div>');
          setTimeout(function () { close(); done(); }, 1600);
        });
        var fp = app.querySelector('[data-form="profile"]');
        if (fp) fp.addEventListener('submit', function (e) {
          e.preventDefault();
          store.user.profile.phone = app.querySelector('#r-phone').value.trim();
          store.user.terms = app.querySelector('#r-terms').checked;
          save(); toast('Hotovo – máte ověřený účet.');
          go(dalsi ? '#/' + dalsi : '#/ucet');
        });
      }
    };
  };

  /* ---------- Účet ---------- */
  VIEWS.ucet = function () {
    var mine = store.userRecords;
    var watched = store.watches.map(getRecord).filter(Boolean).filter(function (r) { return !r.mine; });
    var html =
      '<div class="wrap page"><div class="narrow stack gap-32">' +
      '<h1 class="h-l">Účet</h1>' +
      (store.user && store.user.verified
        ? '<section class="card soft" style="padding:20px;gap:12px"><div class="row gap-12"><span class="icon-btn dark" style="width:48px;height:48px;font-weight:600">' + esc(initials(store.user.profile.name)) + '</span><div class="stack"><b style="font-weight:600">' + esc(store.user.profile.name || '') + '</b><span class="small muted">' + esc(store.user.email) + '</span></div></div>' +
          '<span class="row gap-8 small" style="color:var(--found)">' + ic('shield', 16) + 'Ověřeno · ' + esc(METHOD[store.user.method] || '') + '</span>' +
          (userReady() ? '' : '<a href="#/registrace/profil" class="btn sm" style="align-self:flex-start">Dokončit profil</a>') +
          '<button type="button" class="link-btn" style="align-self:flex-start;padding:0" data-act="logout">Odhlásit</button></section>'
        : '<section class="card" style="padding:20px;gap:12px"><b style="font-weight:600">Nejste přihlášeni</b><span class="small muted">Hledat a ověřovat můžete bez účtu. Pro vložení předmětu je potřeba ověřený účet.</span><a href="#/registrace" class="btn" style="align-self:flex-start">Přihlásit / registrovat</a></section>') +
      '<section class="stack gap-12"><h2 style="font-size:15px;letter-spacing:0">Moje hlášení</h2>' +
      (mine.length ? mine.map(miniRow).join('') : '<div class="note">Zatím jste nic nenahlásili. <a href="#/nahlasit">Nahlásit ztrátu nebo krádež</a></div>') + '</section>' +
      '<section class="stack gap-12"><h2 style="font-size:15px;letter-spacing:0">Hlídám</h2>' +
      (watched.length ? watched.map(miniRow).join('') : '<p class="small muted" style="margin:0">U záznamu klepněte na „Hlídat podobné“ a dáme vám vědět, když se objeví něco podobného.</p>') + '</section>' +
      '<section class="stack gap-8"><h2 style="font-size:15px;letter-spacing:0">Aplikace</h2>' +
      '<a href="#/instalace" class="row between" style="padding:14px 0;border-top:1px solid var(--line);text-decoration:none"><span>Přidat na plochu a upozornění</span>' + ic('chevron', 18) + '</a>' +
      '<a href="#/firmy" class="row between" style="padding:14px 0;border-top:1px solid var(--line);text-decoration:none"><span>Pro bazary, aukce a policii</span>' + ic('chevron', 18) + '</a>' +
      '<a href="#/o-prototypu" class="row between" style="padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);text-decoration:none"><span>O prototypu</span>' + ic('chevron', 18) + '</a>' +
      '</section></div></div>';
    return {
      html: html, title: 'Účet',
      after: function () {
        var lo = app.querySelector('[data-act="logout"]');
        if (lo) lo.addEventListener('click', function () { store.user = null; save(); toast('Odhlášeno.'); render(); });
      }
    };
  };
  function initials(name) { return String(name || '?').split(/\s+/).map(function (x) { return x.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
  function miniRow(r) {
    return '<a href="#/zaznam/' + esc(r.id) + '" class="row gap-16" style="padding:8px 0;text-decoration:none"><div style="width:56px;flex:none">' + thumb(r, 'border-radius:12px') + '</div>' +
      '<div class="stack" style="flex:1;min-width:0"><b style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.title) + '</b>' + statusHtml(r, r.police ? 'nahlášeno policii' : (store.watches.indexOf(r.id) >= 0 ? 'hlídáme' : '')) + '</div>' + ic('chevron', 18) + '</a>';
  }

  /* ---------- Instalace (PWA) ---------- */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; });
  window.addEventListener('appinstalled', function () { deferredPrompt = null; toast('ZOVE je na ploše.'); });
  function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }

  function installNudge() {
    sheet('<div class="row gap-16"><span style="flex:none;width:56px;height:56px;border-radius:14px;background:var(--ink);display:flex;align-items:center;justify-content:center"><span class="logo-dot" style="background:#fff"></span></span>' +
      '<div class="stack gap-4"><b style="font-size:18px;font-weight:600">Upozornění do telefonu?</b><span class="small muted">Přidejte si ZOVE na plochu a dáme vám vědět hned.</span></div></div>' +
      '<a href="#/instalace" class="btn lg" data-close>Jak na to</a><button type="button" class="link-btn" data-close style="align-self:center">Teď ne</button>');
  }

  VIEWS.instalace = function () {
    var st = VIEWS.instalace.state || (VIEWS.instalace.state = { os: isIOS() ? 'ios' : 'android' });
    var perm = ('Notification' in window) ? Notification.permission : 'unsupported';
    var html =
      '<div class="wrap page"><div class="narrow stack gap-24">' +
      '<div class="row gap-16"><span style="flex:none;width:72px;height:72px;border-radius:18px;background:var(--ink);display:flex;align-items:center;justify-content:center;gap:4px;color:#fff;font-weight:700;font-size:15px"><span class="logo-dot" style="background:#fff;width:7px;height:7px"></span>zove</span>' +
      '<div class="stack gap-4"><h1 class="h-m">' + (isStandalone() ? 'ZOVE máte na ploše' : 'Přidejte si ZOVE na plochu') + '</h1><span class="small muted">Zdarma, bez obchodu s aplikacemi</span></div></div>' +
      '<ul style="margin:0;padding:0;list-style:none" class="stack gap-16">' +
      [['bell', 'Upozorníme vás, když se objeví podobná věc'], ['camera', 'Fotoaparát a skener na jedno klepnutí'], ['wifi', 'Část aplikace funguje i bez signálu']].map(function (x) { return '<li class="row gap-12" style="align-items:flex-start">' + ic(x[0], 20, 1.8, ' style="flex:none;margin-top:2px"') + '<span>' + x[1] + '</span></li>'; }).join('') + '</ul>' +
      (isStandalone() ? '' :
        '<div class="seg" style="align-self:flex-start"><button type="button" data-os="android" aria-pressed="' + (st.os === 'android') + '">Android</button><button type="button" data-os="ios" aria-pressed="' + (st.os === 'ios') + '">iPhone</button></div>' +
        (st.os === 'android'
          ? '<button type="button" class="btn lg" data-act="install">Nainstalovat</button><span class="xs muted">Funguje v Chrome. Když tlačítko nic neudělá, otevřete menu ⋮ a zvolte „Přidat na plochu“.</span>'
          : '<div class="stack gap-12"><span class="row gap-12"><span class="icon-btn dark" style="width:28px;height:28px;font-size:13px">1</span>V Safari klepněte na ' + ic('share', 18, 2, ' role="img" aria-label="Sdílet"') + ' Sdílet</span><span class="row gap-12"><span class="icon-btn dark" style="width:28px;height:28px;font-size:13px">2</span>Zvolte „Přidat na plochu“</span></div><span class="xs muted">Na iPhonu fungují upozornění jen po přidání na plochu.</span>')) +
      '<hr class="hr">' +
      '<div class="row between gap-16"><div class="stack"><b style="font-weight:600">Upozornění</b><span class="small muted">' + ({ granted: 'Zapnutá', denied: 'Zakázaná v nastavení prohlížeče', 'default': 'Vypnutá', unsupported: 'Tento prohlížeč je teď nepodporuje' }[perm]) + '</span></div>' +
      (perm === 'default' ? '<button type="button" class="btn ghost sm" data-act="notify">Zapnout</button>' : perm === 'granted' ? '<button type="button" class="btn ghost sm" data-act="test">Vyzkoušet</button>' : '') + '</div>' +
      '</div></div>';
    return {
      html: html, title: 'Aplikace',
      after: function () {
        app.querySelectorAll('[data-os]').forEach(function (b) { b.addEventListener('click', function () { st.os = b.dataset.os; render(); }); });
        onApp('click', function (e) {
          var b = e.target.closest('[data-act]');
          if (!b) return;
          if (b.dataset.act === 'install') {
            if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(function () { deferredPrompt = null; render(); }); }
            else toast('Otevřete menu prohlížeče a zvolte „Přidat na plochu“.');
          }
          if (b.dataset.act === 'notify') Notification.requestPermission().then(function () { render(); });
          if (b.dataset.act === 'test') showTestNotification();
        });
      }
    };
  };
  function showTestNotification() {
    var title = 'Podobná věc v bazaru';
    var body = 'Kytice ve váze, zlacený rám – Praha 5. Klepněte pro detail.';
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (reg) { reg.showNotification(title, { body: body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: '#/zaznam/24-0109' } }); })
        .catch(function () { new Notification(title, { body: body }); });
    } else { new Notification(title, { body: body }); }
  }

  /* ---------- Pro firmy ---------- */
  function bizHeader(active, police) {
    return '<div class="' + (police ? 'police-head' : 'biz-head') + '"><div class="wrap row between wrap-row gap-12" style="min-height:56px">' +
      '<nav class="nav" aria-label="Pro firmy" style="flex-wrap:wrap">' +
      (police
        ? '<span class="logo" style="font-size:16px;margin-right:12px"><span class="logo-dot"></span>pro policii</span><a href="#/policie" class="active">Zajištěné věci</a><a href="#/firmy">Zpět na Pro firmy</a>'
        : '<a href="#/firmy"' + (active === 'firmy' ? ' class="active"' : '') + '>Přehled a ceník</a><a href="#/firmy/bazar"' + (active === 'bazar' ? ' class="active"' : '') + '>Bazar</a><a href="#/firmy/aukce"' + (active === 'aukce' ? ' class="active"' : '') + '>Aukční síň</a><a href="#/policie">Policie</a>') +
      '</nav>' +
      (police ? '<span class="row gap-8 xs" style="color:#A3A3A3"><span class="dot found" style="background:#4ADE80"></span>Synchronizace s PSEUD Policie ČR (cílový stav)</span>' : '<span class="xs muted">' + (active === 'bazar' ? '[Název provozovny]' : active === 'aukce' ? '[Aukční síň]' : '') + '</span>') +
      '</div></div>';
  }

  VIEWS.firmy = function (p) {
    if (p[0] === 'bazar') return bazar();
    if (p[0] === 'aukce') return aukce();
    var segs = [
      ['Bazary a zastavárny', 'Kontrola při výkupu', 'Naskenujete sériové číslo nebo vyfotíte věc přímo u pultu. Výsledek do pár sekund.', 'od 9 Kč za kontrolu', '#/firmy/bazar'],
      ['Aukční síně a galerie', 'Prověření celého katalogu', 'Nahrajete katalog, my zkontrolujeme každou položku a hlídáme ji až do dražby.', '39 Kč za položku', '#/firmy/aukce'],
      ['Inzertní portály', 'Hlídání inzerátů', 'Nové inzeráty porovnáváme s odcizenými věcmi a podezřelé vám označíme.', 'od 0,50 Kč za inzerát', '#api']
    ];
    var html = bizHeader('firmy') +
      '<section class="wrap" style="padding:88px 24px 56px"><h1 class="h-xl" style="max-width:760px">Nekupujte kradené. Ani omylem.</h1>' +
      '<p class="lead" style="max-width:560px">Automatická kontrola výkupů, aukčních položek a inzerátů proti databázi ztracených a odcizených věcí.</p>' +
      '<div class="row gap-8 wrap-row mt-32"><a href="#/firmy/bazar" class="btn lg">Vyzkoušet zdarma</a><a href="#cenik" class="btn ghost lg" data-scroll="cenik">Ceník</a></div></section>' +
      '<section class="wrap"><div class="grid-2" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">' + segs.map(function (s) {
        return '<div class="card soft"><span class="xs muted">' + s[0] + '</span><span class="h-s" style="font-weight:600">' + s[1] + '</span><span class="small" style="color:var(--ink-2)">' + s[2] + '</span>' +
          '<span class="row between gap-12" style="margin-top:auto;padding-top:16px;border-top:1px solid var(--line-2)"><b style="font-weight:500">' + s[3] + '</b>' + (s[4].indexOf('#/') === 0 ? '<a href="' + s[4] + '" class="small muted" style="text-decoration:none">Ukázka →</a>' : '') + '</span></div>';
      }).join('') + '</div></section>' +
      '<section class="wrap" id="cenik" style="padding-top:96px"><h2 class="h-m">Ceník</h2><p class="small muted">Ceny bez DPH. Bez závazku, měsíční tarify jdou kdykoli zrušit.</p>' +
      '<div class="plans mt-24">' + D.plans.map(function (pl) {
        return '<div class="plan' + (pl.dark ? ' dark' : '') + '"><span class="small m">' + pl.who + '</span><span style="font-size:20px;font-weight:600">' + pl.name + '</span><span class="row gap-8" style="align-items:baseline"><span class="price">' + pl.price + '</span><span class="small m">' + pl.unit + '</span></span><ul>' + pl.lines.map(function (l) { return '<li>· ' + l + '</li>'; }).join('') + '</ul></div>';
      }).join('') + '</div>' +
      '<div class="note mt-16"><b style="color:var(--ink)">Jednotlivci:</b> hledání, nahlášení, ověření i trestní oznámení zdarma · <b style="color:var(--ink)">Policie, celní správa, muzea:</b> zdarma</div></section>' +
      '<section class="wrap" id="api" style="padding-top:96px"><div class="split" style="align-items:center">' +
      '<div class="stack gap-16" style="flex:1 1 340px"><h2 class="h-m">Jedno volání při každém výkupu</h2><p class="muted" style="margin:0">Pošlete fotku nebo sériové číslo, dostanete výsledek a číslo výpisu. Při shodě vás vedeme: věc převzít do úschovy a dát vědět majiteli i policii.</p></div>' +
      '<pre class="code" style="flex:1 1 460px;min-width:0">POST /v1/check\n{ "serial": "WTU0458812", "photo": "…" }\n\n200 OK\n{\n  "result": "possible_match",\n  "record": "24-0121",\n  "reported_to_police": true,\n  "certificate": "OV-2611-0412",\n  "checked_at": "2026-11-04T09:12:00+01:00"\n}</pre></div></section>' +
      '<section class="wrap" style="padding:96px 24px"><div class="card" style="flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;padding:40px">' +
      '<div class="stack gap-8" style="flex:1 1 420px"><span class="xs muted">Pro Policii ČR a celní správu</span><h2 class="h-m">Zajištěné věci vrátíte majitelům rychleji</h2><p class="small muted" style="margin:0">Hromadné hledání podle fotek a sériových čísel a kontakt na majitele i u ztracených věcí, ke kterým nikdo nepodal oznámení. Zdarma.</p></div>' +
      '<a href="#/policie" class="btn lg">Ukázka konzole</a></div></section>';
    return {
      html: html, title: 'Pro firmy', tab: 'ucet',
      after: function () {
        app.querySelectorAll('[data-scroll]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); document.getElementById(a.dataset.scroll).scrollIntoView({ behavior: 'smooth' }); }); });
      }
    };
  };

  function bazar() {
    var st = bazar.state || (bazar.state = { value: 'WTU0458812', result: null });
    var res = '';
    if (st.result === 'clean') {
      res = '<div class="result ok"><div class="row gap-12"><span class="badge">' + ic('check', 20, 2.5) + '</span><h2 class="h-s">Bez shody – můžete pokračovat</h2></div><span class="mono xs" style="color:var(--ink-2)">Výpis ' + esc(st.cert) + ' · ' + esc(st.time) + ' · uloženo k výkupu</span>' +
        '<div class="row gap-8 wrap-row"><button type="button" class="btn ghost sm" data-act="print">Tisk k výkupnímu lístku</button></div></div>';
    } else if (st.result === 'match') {
      res = '<div class="result bad"><div class="row gap-12"><span class="badge">' + ic('alert', 20, 2.5) + '</span><h2 class="h-s">Shoda: věc hlášená jako odcizená</h2></div>' +
        '<div class="stack gap-4" style="font-size:15px;color:var(--ink-2)"><span>1. Věc nevykupujte. Prodávajícího nekonfrontujte.</span><span>2. Pokud ji nechá u vás, uložte ji stranou.</span><span>3. Policie dostala upozornění s časem a místem kontroly.</span></div>' +
        '<div class="row gap-8 wrap-row"><a href="tel:158" class="btn sm">Zavolat 158</a><button type="button" class="btn ghost sm" data-act="seller">Doplnit popis prodávajícího</button></div></div>';
    }
    var html = bizHeader('bazar') +
      '<div class="wrap page"><div class="split">' +
      '<section class="main-col stack gap-24">' +
      '<h1 class="h-m">Nová kontrola</h1>' +
      '<div class="option-tiles"><button type="button" class="tile" data-act="scan">' + ic('scan', 26) + '<b>Naskenovat kód</b><span>Sériové číslo, IMEI, čárový kód</span></button>' +
      '<button type="button" class="tile" data-act="photo">' + ic('camera', 26) + '<b>Vyfotit věc</b><span>Obrazy, šperky, věci bez čísla</span></button></div>' +
      '<form class="pill-search" data-form="bz" style="box-shadow:none"><label for="bz" class="sr">Sériové číslo</label><input id="bz" class="mono" value="' + esc(st.value) + '" autocomplete="off"><button type="submit" class="btn">Zkontrolovat</button></form>' +
      '<span class="xs muted" style="margin-top:-12px;padding-left:22px">WTU0458812 = shoda, jiné číslo = bez shody</span>' +
      res + '</section>' +
      '<aside class="side-col stack gap-12"><div class="row between" style="align-items:baseline"><b style="font-weight:600">Dnešní kontroly</b><button type="button" class="link-btn xs" data-act="export">Export pro kontrolu</button></div>' +
      '<ul style="list-style:none;margin:0;padding:0">' + store.bazarLog.map(function (l) {
        return '<li class="row gap-12 small" style="padding:12px 0;border-top:1px solid var(--line)"><span class="mono xs muted" style="width:44px">' + esc(l.time) + '</span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(l.what) + '</span><span class="status"><span class="dot ' + (l.res === 'shoda' ? 'stolen' : 'found') + '"></span>' + l.res + '</span></li>';
      }).join('') + '</ul></aside></div></div>';
    function check(v) {
      var n = normSerial(v);
      var hit = allRecords().find(function (r) { return r.serial && normSerial(r.serial) === n && r.status === 'stolen'; });
      st.value = v; st.result = hit ? 'match' : 'clean'; st.time = nowTime(); st.cert = 'OV-' + Math.floor(100000 + Math.random() * 899999);
      store.bazarLog.unshift({ time: st.time, what: (hit ? hit.title.split(',')[0] : 'Věc') + ' · ' + maskSerial(v), res: hit ? 'shoda' : 'čisté' });
      store.bazarLog = store.bazarLog.slice(0, 8); save(); render();
    }
    return {
      html: html, title: 'Bazar – kontrola', tab: 'ucet', keepScroll: true,
      after: function () {
        var f = app.querySelector('[data-form="bz"]');
        f.addEventListener('submit', function (e) { e.preventDefault(); var v = f.querySelector('input').value.trim(); if (v) check(v); });
        onApp('click', function (e) {
          var b = e.target.closest('[data-act]'); if (!b) return;
          var a = b.dataset.act;
          if (a === 'scan') openCamera({ mode: 'scan', onCode: check });
          if (a === 'photo') addPhoto(function () { st.result = 'clean'; st.time = nowTime(); st.cert = 'OV-' + Math.floor(100000 + Math.random() * 899999); store.bazarLog.unshift({ time: st.time, what: 'Věc (foto)', res: 'čisté' }); save(); render(); }, 'Vyfotit věc');
          if (a === 'print') window.print();
          if (a === 'export') toast('V ostré verzi stáhnete CSV a PDF přehled kontrol.');
          if (a === 'seller') toast('V ostré verzi formulář pro popis prodávajícího.');
        });
      }
    };
  }

  function aukce() {
    var st = aukce.state || (aukce.state = { f: 'Vše' });
    var R = { 'Bez shody': 'found', 'K prověření': 'warn', 'Shoda': 'stolen' };
    var rows = D.auction.filter(function (a) { return st.f === 'Vše' || a[3] === st.f; });
    function count(k) { return D.auction.filter(function (a) { return k === 'Vše' || a[3] === k; }).length; }
    var html = bizHeader('aukce') +
      '<div class="wrap page">' +
      '<div class="row between wrap-row gap-16" style="align-items:flex-end"><div><span class="small muted">Katalog · nahráno 3. 11. 2026</span><h1 class="h-m mt-8">Podzimní aukce</h1></div>' +
      '<div class="row gap-8 wrap-row"><button type="button" class="btn ghost sm" data-act="upload">Nahrát další katalog</button><button type="button" class="btn sm" data-act="print">Stáhnout protokol</button></div></div>' +
      '<div class="row wrap-row gap-8 mt-24">' + ['Vše', 'Shoda', 'K prověření', 'Bez shody'].map(function (k) {
        return '<button type="button" class="chip" data-f="' + k + '" aria-pressed="' + (st.f === k) + '">' + (R[k] ? '<span class="dot ' + R[k] + '"></span>' : '') + k + ' <span style="opacity:.6">' + count(k) + '</span></button>';
      }).join('') + '<span class="row gap-8 small muted" style="margin-left:auto">' + ic('bell', 16) + 'Hlídáme každou položku až do dražby</span></div>' +
      '<div class="table-wrap mt-16"><table><thead><tr><th style="width:56px">Pol.</th><th style="width:64px"><span class="sr">Foto</span></th><th>Název</th><th>Autor</th><th>Výsledek</th><th style="text-align:right"><span class="sr">Akce</span></th></tr></thead><tbody>' +
      rows.map(function (a) {
        var link = a[3] === 'Bez shody' ? '<button type="button" class="link-btn xs" data-act="vypis">výpis</button>' : '<a class="xs muted" href="#/zaznam/24-0118">' + (a[3] === 'Shoda' ? 'otevřít záznam' : 'porovnat') + '</a>';
        return '<tr><td class="mono muted">' + a[0] + '</td><td><div style="width:44px;height:44px;border-radius:8px;background:var(--soft);display:flex;align-items:center;justify-content:center;color:#B4B4B0">' + ic('art', 20, 1.4) + '</div></td><td style="font-weight:500">' + a[1] + '</td><td class="muted">' + a[2] + '</td><td><span class="status" style="font-size:14px;color:var(--ink)"><span class="dot ' + R[a[3]] + '"></span>' + a[3] + '</span></td><td style="text-align:right">' + link + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="xs muted mt-16">„K prověření“ znamená podobnost, ne shodu. Položku zatím nestahujte – ozve se vám náš specialista, obvykle do jednoho pracovního dne.</p></div>';
    return {
      html: html, title: 'Aukce – katalog', tab: 'ucet', keepScroll: true,
      after: function () {
        app.querySelectorAll('[data-f]').forEach(function (b) { b.addEventListener('click', function () { st.f = b.dataset.f; render(); }); });
        onApp('click', function (e) {
          var b = e.target.closest('[data-act]'); if (!b) return;
          if (b.dataset.act === 'print') window.print();
          if (b.dataset.act === 'upload') toast('V ostré verzi nahrajete CSV nebo PDF katalogu.');
          if (b.dataset.act === 'vypis') toast('Výpis k položce: bez shody, uloženo do protokolu.');
        });
      }
    };
  }

  /* ---------- Policie ---------- */
  VIEWS.policie = function () {
    var st = VIEWS.policie.state || (VIEWS.policie.state = { sel: 0 });
    var list = [
      { id: '24-0118', title: 'Olejomalba – kytice v džbánu', res: 'Shoda', dot: 'stolen', source: 'Odcizená věc · záznam 24-0118', report: 'podáno', owner: 'kontaktovatelný', can: true, icon: 'art' },
      { id: '24-0121', title: 'Horské kolo, modrý rám', res: 'Shoda', dot: 'stolen', source: 'Odcizená věc · rám WTU…8812', report: 'podáno', owner: 'kontaktovatelný', can: true, icon: 'bike' },
      { id: '24-0105', title: 'Telefon v zeleném obalu', res: 'Shoda – ztraceno', dot: 'lost', source: 'Ztracená věc · IMEI 351…0123', report: 'nepodáno', owner: 'kontaktovatelný', can: true, icon: 'phone' },
      { title: 'Zlatý prsten', res: 'K prověření', dot: 'warn', source: 'Podobnost fotky', report: '—', owner: 'čeká na porovnání', can: false, icon: 'ring' },
      { title: 'Fotoaparát', res: 'Bez shody', dot: '', source: '—', report: '—', owner: 'neznámý', can: false, icon: 'camera' },
      { title: 'Housle', res: 'Bez shody', dot: '', source: '—', report: '—', owner: 'neznámý', can: false, icon: 'music' }
    ];
    var s = list[st.sel];
    var html = bizHeader('policie', true) +
      '<div class="wrap page">' +
      '<div class="row between wrap-row gap-16" style="align-items:flex-end"><div><span class="small muted">Zajištěné věci · spis [Č. J.]</span><h1 class="h-m mt-8">Komu to patří?</h1></div>' +
      '<button type="button" class="btn ghost sm" data-act="upload">' + ic('plus', 16) + 'Nahrát fotky nebo seznam čísel</button></div>' +
      '<div class="split mt-32">' +
      '<div class="main-col" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px">' +
      list.map(function (it, i) {
        return '<button type="button" data-sel="' + i + '" style="display:flex;flex-direction:column;gap:8px;padding:8px;border-radius:16px;background:#fff;text-align:left;border:' + (i === st.sel ? '1.5px solid var(--ink)' : '1px solid transparent') + '">' +
          '<div class="thumb" style="border-radius:12px">' + ic(it.icon, 40, 1.4) + '</div><span class="status" style="font-size:12px"><span class="dot ' + it.dot + '"></span>' + it.res + '</span><span style="font-size:14px;font-weight:500">' + it.title + '</span></button>';
      }).join('') + '</div>' +
      '<aside class="side-col stack gap-16" style="padding:28px;border-radius:24px;background:var(--soft-2)">' +
      '<span class="status"><span class="dot ' + s.dot + '"></span>' + s.res + '</span><h2 class="h-s">' + s.title + '</h2>' +
      '<dl class="dl" style="font-size:14px"><div><dt>Zdroj shody</dt><dd>' + s.source + '</dd></div><div><dt>Oznámení</dt><dd>' + s.report + '</dd></div><div><dt>Majitel</dt><dd>' + s.owner + '</dd></div></dl>' +
      (s.can ? '<button type="button" class="btn" data-act="owner">Vyzvat majitele k prokázání vlastnictví</button><span class="xs muted">Majitel dostane výzvu s kontaktem na vás. Osobní údaje uvidíte až po jeho souhlasu nebo na základě dožádání.</span>' : '') +
      (s.id ? '<a href="#/zaznam/' + s.id + '" class="btn ghost sm">Veřejný záznam</a>' : '') +
      '<button type="button" class="btn ghost sm" data-act="export">Export do úředního záznamu</button></aside></div></div>';
    return {
      html: html, title: 'Policie', tab: 'ucet', keepScroll: true,
      after: function () {
        app.querySelectorAll('[data-sel]').forEach(function (b) { b.addEventListener('click', function () { st.sel = +b.dataset.sel; render(); }); });
        onApp('click', function (e) {
          var b = e.target.closest('[data-act]'); if (!b) return;
          var a = b.dataset.act;
          if (a === 'owner') toast('Výzva odeslána majiteli. Odpověď uvidíte ve spisu.');
          if (a === 'export') toast('V ostré verzi PDF pro úřední záznam.');
          if (a === 'upload') toast('V ostré verzi nahrajete fotky nebo CSV se sériovými čísly.');
        });
      }
    };
  };

  /* ---------- O prototypu ---------- */
  VIEWS['o-prototypu'] = function () {
    var html =
      '<div class="wrap page"><div class="mid stack gap-24">' +
      '<h1 class="h-l">O prototypu</h1>' +
      '<p class="lead" style="margin:0">Klikací ukázka veřejné databáze ztracených a odcizených věcí. Běží celá v prohlížeči, nic se neodesílá na server.</p>' +
      '<div class="stack gap-8"><b style="font-weight:600">Co je naoko</b>' +
      '<ul style="margin:0;padding-left:20px;color:var(--ink-2)" class="stack gap-4">' +
      '<li>Záznamy, zprávy a kontroly jsou smyšlené. Co přidáte, uloží se jen do tohoto prohlížeče.</li>' +
      '<li>Hledání podle fotky výsledek jen simuluje. Sériová čísla se porovnávají opravdu (zkuste WTU0458812).</li>' +
      '<li>Skener kódu po chvíli „načte“ ukázkový kód. Fotoaparát je skutečný, pokud ho povolíte.</li>' +
      '<li>Registrace a ověření totožnosti (bankovní identita, Identita občana, doklad) jsou simulované – kód z e-mailu je libovolných 6 číslic.</li>' +
      '<li>Zprávy nikomu neodcházejí, výpisy ani oznámení nemají právní váhu.</li>' +
      '<li>Napojení na policejní evidenci a Interpol je v návrhu jako cílový stav.</li></ul></div>' +
      '<div class="stack gap-8"><b style="font-weight:600">Vyzkoušejte</b>' +
      '<ul style="margin:0;padding-left:20px;color:var(--ink-2)" class="stack gap-4">' +
      '<li><a href="#/nahlasit">Nahlásit krádež</a> s fotkou a pak připravit trestní oznámení.</li>' +
      '<li><a href="#/overit">Ověřit kolo</a> číslem WTU0458812.</li>' +
      '<li>V detailu cizí věci klepnout na „Viděl/a jsem to“.</li>' +
      '<li>Na telefonu si aplikaci <a href="#/instalace">přidat na plochu</a>.</li></ul></div>' +
      '<button type="button" class="btn ghost" style="align-self:flex-start" data-act="reset">Smazat moje data z prototypu</button>' +
      '</div></div>';
    return {
      html: html, title: 'O prototypu',
      after: function () { app.querySelector('[data-act="reset"]').addEventListener('click', resetDemo); }
    };
  };

  VIEWS.__404 = function () {
    return {
      html: '<div class="wrap page"><div class="narrow stack gap-16" style="padding-top:48px"><h1 class="h-l">Tady nic není</h1><p class="muted" style="margin:0">Záznam neexistuje nebo byl smazán.</p><a href="#/" class="btn" style="align-self:flex-start">Domů</a></div></div>',
      title: 'Nenalezeno'
    };
  };

  function resetDemo() {
    sheet('<h2 class="h-s">Obnovit ukázku?</h2><p class="small muted" style="margin:0">Smažou se vaše hlášení, zprávy a kontroly uložené v tomto prohlížeči.</p><div class="row gap-8"><button type="button" class="btn ghost" data-close style="flex:1">Zrušit</button><button type="button" class="btn" data-ok style="flex:1">Obnovit</button></div>',
      function (s, close) {
        s.querySelector('[data-ok]').addEventListener('click', function () {
          store = freshStore(); save();
          VIEWS.videl.state = VIEWS.overit.state = bazar.state = aukce.state = VIEWS.policie.state = null;
          close(); toast('Ukázka obnovena.'); go('#/');
        });
      });
  }
  document.getElementById('reset-demo').addEventListener('click', resetDemo);

  /* ------------------------------------------------------------------ */
  /* Service worker                                                     */
  /* ------------------------------------------------------------------ */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
    navigator.serviceWorker.addEventListener && navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.url) location.hash = e.data.url;
    });
  }

  render();
})();

(function () {

  // ── THEME TOGGLE ──────────────────────────────────────────────────────────
  var html = document.documentElement;
  var savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('flight400-theme') || 'dark';
  } catch (e) {}
  html.setAttribute('data-theme', savedTheme);

  var themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var current = html.getAttribute('data-theme') || 'dark';
      var next = current === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
      try {
        localStorage.setItem('flight400-theme', next);
      } catch (e) {}
    });
  }

  // ── STARFIELD ──────────────────────────────────────────────────────────────
  var c = document.getElementById('stars-canvas');
  var ctx = c.getContext('2d');
  var W, H, stars = [];

  function resizeStars() {
    W = c.width  = window.innerWidth;
    H = c.height = Math.max(document.body.scrollHeight, window.innerHeight);
  }
  function initStars() {
    resizeStars();
    stars = [];
    for (var i = 0; i < 180; i++) {
      stars.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        r:  Math.random() * 1.4 + 0.3,
        a:  Math.random(),
        da: (Math.random() - 0.5) * 0.005
      });
    }
  }
  function drawStars() {
    ctx.clearRect(0, 0, W, H);
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    var starColor = isLight ? '60,80,160,' : '180,200,255,';
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.a = Math.max(0.08, Math.min(1, s.a + s.da));
      if (s.a <= 0.08 || s.a >= 1) s.da *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + starColor + s.a + ')';
      ctx.fill();
    }
    requestAnimationFrame(drawStars);
  }
  window.addEventListener('resize', initStars);
  initStars();
  drawStars();

  // ── HERO SCROLL CTA ────────────────────────────────────────────────────────
  var heroCtaBtn = document.getElementById('hero-cta-btn');
  if (heroCtaBtn) {
    heroCtaBtn.addEventListener('click', function () {
      var section = document.getElementById('tracks-section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ── NEW-TO-BOB MODAL ───────────────────────────────────────────────────────
  var ntbOverlay = document.getElementById('ntb-overlay');

  function openNtb(startTab) {
    if (!ntbOverlay) return;
    ntbOverlay.classList.add('active');
    if (startTab) ntbSwitchTab(startTab);
    var closeBtn = document.getElementById('ntb-close');
    if (closeBtn) closeBtn.focus();
  }
  function closeNtb() {
    if (ntbOverlay) ntbOverlay.classList.remove('active');
  }
  function ntbSwitchTab(num) {
    var panels = ntbOverlay.querySelectorAll('.ntb-panel');
    var tabs   = ntbOverlay.querySelectorAll('.ntb-tab');
    panels.forEach(function (p) { p.classList.remove('ntb-panel-active'); });
    tabs.forEach(function (t) {
      t.classList.remove('ntb-tab-active');
      t.setAttribute('aria-selected', 'false');
    });
    var activePanel = document.getElementById('ntb-panel-' + num);
    var activeTab   = document.getElementById('ntb-tab-' + num);
    if (activePanel) activePanel.classList.add('ntb-panel-active');
    if (activeTab)   { activeTab.classList.add('ntb-tab-active'); activeTab.setAttribute('aria-selected', 'true'); }
    tabs.forEach(function (t) {
      var n = parseInt(t.getAttribute('data-ntb-tab'), 10);
      if (n < num) t.classList.add('ntb-tab-done');
      else t.classList.remove('ntb-tab-done');
    });
  }

  var ntbBtn = document.getElementById('new-to-bob-btn');
  if (ntbBtn) ntbBtn.addEventListener('click', function () { openNtb(1); });
  if (ntbOverlay) {
    ntbOverlay.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-ntb-tab]');
      if (tab) { ntbSwitchTab(parseInt(tab.getAttribute('data-ntb-tab'), 10)); return; }
      if (e.target.closest('#ntb-next-btn')) { ntbSwitchTab(2); return; }
      if (e.target === ntbOverlay) closeNtb();
    });
    var ntbCloseBtn = document.getElementById('ntb-close');
    if (ntbCloseBtn) ntbCloseBtn.addEventListener('click', closeNtb);
  }

  // ── TRACK PARTIALS LOADER ─────────────────────────────────────────────────
  // Loads track partial HTML files into #tracks-stream.
  //
  // Resolution order for each track slug:
  //   1. Local override: <event-folder>/tracks/<slug>.html
  //      (absolute path derived from window.location so it is not affected
  //       by the <base href="../"> in index.html)
  //   2. Shared fallback: tracks/<slug>.html
  //      (relative — resolves to docs/tracks/ via <base href="../">)
  //   3. Skip with a console warning if both fail.
  //
  // Track list: use config.tracks if provided (exact replacement of the
  // default list — no merging). Otherwise load all 8 default tracks.
  //
  // window.FLIGHT400_TRACK_PREFIX is retained for backwards compatibility
  // but is superseded by the local-override mechanism above.

  var DEFAULT_TRACK_SLUGS = ['setup', 'track-1', 'track-2', 'track-7', 'track-4', 'track-6', 'track-5', 'track-3'];
  // Tracks shown inside the collapsed "Additional Exercises" group.
  var ADDITIONAL_SLUGS = ['track-5', 'track-3'];
  // Tracks shown inside the collapsed "Environment Setup" group.
  var SETUP_SLUGS = ['setup'];
  var cfgTracks = (window.FLIGHT400_CONFIG || {}).tracks;
  var TRACK_SLUGS = (cfgTracks && cfgTracks.length) ? cfgTracks : DEFAULT_TRACK_SLUGS;

  // Build the absolute base URL for the current event folder so local overrides
  // are not affected by <base href="../">.
  // e.g. https://org.github.io/repo/contoso/ → localBase = '/repo/contoso/'
  var localBase = window.location.pathname.replace(/\/?$/, '/');

  var stream = document.getElementById('tracks-stream');
  var setupGroup = null;   // created when setup track loads
  var setupInner = null;
  var extraGroup = null;   // created when the first additional track loads
  var extraInner = null;

  // Builds the collapsed "Environment Setup" group and returns its inner container.
  function createSetupGroup() {
    setupGroup = document.createElement('div');
    setupGroup.className = 'extra-group';
    setupGroup.innerHTML =
      '<button class="extra-toggle" type="button" aria-expanded="false" aria-controls="setup-body">' +
        '<span class="extra-toggle-label">Environment Setup</span>' +
        '<span class="card-chevron" aria-hidden="true">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5l5 5 5-5"/></svg>' +
        '</span>' +
      '</button>' +
      '<div class="extra-body" id="setup-body"><div class="extra-body-inner"></div></div>';
    stream.appendChild(setupGroup);
    setupInner = setupGroup.querySelector('.extra-body-inner');

    setupGroup.querySelector('.extra-toggle').addEventListener('click', function () {
      var isOpen = setupGroup.classList.toggle('extra-open');
      this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        setupInner.querySelectorAll('.bubble-card').forEach(function (c) { c.classList.add('bubble-in'); });
      }
    });
  }

  // Builds the collapsed "Additional Exercises" group and returns its inner container.
  function createExtraGroup() {
    extraGroup = document.createElement('div');
    extraGroup.className = 'extra-group';
    extraGroup.innerHTML =
      '<button class="extra-toggle" type="button" aria-expanded="false" aria-controls="extra-body">' +
        '<span class="extra-toggle-label">Additional Exercises</span>' +
        '<span class="card-chevron" aria-hidden="true">' +
          '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5l5 5 5-5"/></svg>' +
        '</span>' +
      '</button>' +
      '<div class="extra-body" id="extra-body"><div class="extra-body-inner"></div></div>';
    stream.appendChild(extraGroup);
    extraInner = extraGroup.querySelector('.extra-body-inner');

    extraGroup.querySelector('.extra-toggle').addEventListener('click', function () {
      var isOpen = extraGroup.classList.toggle('extra-open');
      this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        // Cards inside the collapsed group never intersect the viewport, so reveal them directly.
        extraInner.querySelectorAll('.bubble-card').forEach(function (c) { c.classList.add('bubble-in'); });
      }
    });
  }

  function loadTrackSlug(index) {
    if (index >= TRACK_SLUGS.length) {
      initCards();
      return;
    }
    var slug      = TRACK_SLUGS[index];
    var file      = slug + '.html';
    var cb        = '?v=' + Date.now();
    var localUrl  = localBase + 'tracks/' + file + cb;
    var sharedUrl = 'tracks/' + file + cb;   // resolves via <base href="../"> to docs/tracks/

    // Offline build: track HTML is embedded in the page (fetch() is blocked on file://).
    var inline = window.FLIGHT400_INLINE_TRACKS;
    var htmlPromise = (inline && typeof inline[slug] === 'string')
      ? Promise.resolve(inline[slug])
      : fetch(localUrl)
          .then(function (r) {
            if (!r.ok) throw new Error('no local override');
            return r.text();
          })
          .catch(function () {
            // No local override — fall back to shared docs/tracks/
            return fetch(sharedUrl).then(function (r) {
              if (!r.ok) throw new Error('HTTP ' + r.status + ' loading shared ' + sharedUrl);
              return r.text();
            });
          });

    htmlPromise
      .then(function (html) {
        var wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        var collapseSetup = (window.FLIGHT400_CONFIG || {}).collapseSetup !== false;
        if (SETUP_SLUGS.indexOf(slug) !== -1 && collapseSetup) {
          if (!setupGroup) createSetupGroup();
          while (wrapper.firstChild) setupInner.appendChild(wrapper.firstChild);
        } else if (ADDITIONAL_SLUGS.indexOf(slug) !== -1) {
          if (!extraGroup) createExtraGroup();
          while (wrapper.firstChild) extraInner.appendChild(wrapper.firstChild);
        } else {
          // Keep main tracks above the Additional Exercises group, whatever the configured order.
          while (wrapper.firstChild) stream.insertBefore(wrapper.firstChild, extraGroup);
        }
        loadTrackSlug(index + 1);
      })
      .catch(function (err) {
        console.warn('[FLIGHT400] Could not load track:', slug, err);
        loadTrackSlug(index + 1);
      });
  }

  if (stream) {
    loadTrackSlug(0);
  }

  // ── CARD INIT (called after all partials are loaded) ──────────────────────
  function initCards() {

    var cards = document.querySelectorAll('.bubble-card');

    // Bubble pop-in via IntersectionObserver
    if ('IntersectionObserver' in window) {
      var cardObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var idx = Array.prototype.indexOf.call(cards, entry.target);
            var delay = Math.min(idx * 60, 420);
            setTimeout(function (t) { t.classList.add('bubble-in'); }, delay, entry.target);
            cardObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.10 });
      cards.forEach(function (card) { cardObserver.observe(card); });
    } else {
      cards.forEach(function (card) { card.classList.add('bubble-in'); });
    }

    // Card toggle: click summary to open/close
    cards.forEach(function (card) {
      var summary = card.querySelector('.card-summary');
      if (!summary) return;
      summary.addEventListener('click', function () {
        var isOpen = card.classList.contains('open');
        cards.forEach(function (c) { c.classList.remove('open'); });
        if (!isOpen) {
          card.classList.add('open');
          setTimeout(function () {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
      });
    });

    // Use-case accordion inside cards
    document.addEventListener('click', function (e) {
      var header = e.target.closest('.use-case-header');
      if (!header) return;
      var uc = header.closest('.use-case');
      var isOpen = uc.classList.contains('uc-open');
      uc.closest('.use-cases').querySelectorAll('.use-case').forEach(function (s) {
        s.classList.remove('uc-open');
      });
      if (!isOpen) uc.classList.add('uc-open');
    });

    // Copy buttons
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.copy-btn');
      if (!btn) return;
      var box = btn.closest('.step-prompt, .prompt-box, .code-block');
      var pre = box ? box.querySelector('pre') : null;
      var text = pre ? pre.textContent : '';
      if (!text) return;
      fallbackCopy(text, btn);
    });

    // Attendee table row selection
    var attendeeTable = document.getElementById('attendee-table');
    if (attendeeTable) {
      attendeeTable.addEventListener('click', function (e) {
        var row = e.target.closest('tbody tr');
        if (!row) return;
        var num = parseInt(row.cells[0].textContent.trim(), 10);
        // Check if config provides explicit library/port for this student
        var cfg = window.FLIGHT400_CONFIG || {};
        var cfgRow = cfg.attendeeTable && cfg.attendeeTable.find(function (r) { return r.student === num; });
        if (cfgRow) {
          // Parse nn from library name e.g. FLGHT407 → 407
          var libNum = parseInt(cfgRow.library.replace(/[^0-9]/g, ''), 10);
          var port   = cfgRow.devPort;
          var name   = cfgRow.attendeeName || null;
          selectStudentExplicit(num, libNum, port, name);
        } else {
          selectStudent(num);
        }
      });
    }

    // IP address box (step 0.3): validate on every keystroke, show a message on blur
    document.addEventListener('input',  function (e) { if (e.target && e.target.id === 'server-ip') setIpFromInput(e.target.value, false); });
    document.addEventListener('change', function (e) { if (e.target && e.target.id === 'server-ip') setIpFromInput(e.target.value, true); });

    // Restore previously entered IP address and selected student on load
    restoreServerSelection();
    restoreStudentSelection();
    refreshBadge();   // shows the "choose" flag if nothing is selected yet

    if (gfBadgeNameEl) {
      gfBadgeNameEl.addEventListener('click', jumpToSelection);
      gfBadgeNameEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jumpToSelection(); }
      });
    }
  }

  // ── STUDENT SELECTION ────────────────────────────────────────────────────
  var STUDENT_KEY    = 'flight400-student-v1';
  var gfBadgeEl      = document.getElementById('gf-student-badge');
  var gfBadgeNameEl  = document.getElementById('student-badge-name');
  var gfBadgeClearEl = document.getElementById('student-badge-clear');

  // ── SERVER IP ADDRESS ────────────────────────────────────────────────────
  // Fills <myIPaddress> (from the IP address the attendee pastes once in step 0.3)
  // across the guide. No IP address is stored in this code.
  var IP_KEY     = 'flight400-ip-v1';
  var IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  var studentSel   = null;   // { num, nn, libNum, port } once a row is chosen
  var ipVal        = null;   // validated IPv4 string once pasted in step 0.3
  var badgeStudent = null;   // { num, libNum, port, name } for the badge

  function restoreServerSelection() {
    var ip = null;
    try { ip = localStorage.getItem(IP_KEY); } catch (e) {}
    if (ip && IPV4_RE.test(ip)) {
      ipVal = ip;
      document.querySelectorAll('#server-ip').forEach(function (el) { el.value = ip; });
    }
    if (!ipVal) return;
    applyAllReplacements();
    refreshBadge();
  }

  // Called when the attendee types or pastes in the IP box (step 0.3).
  // Only a valid IPv4 address is accepted; anything else clears the value.
  function setIpFromInput(raw, showMsg) {
    var v = (raw || '').trim();
    var msg = document.getElementById('server-ip-msg');
    var ok = IPV4_RE.test(v);
    if (ok) {
      ipVal = v;
      try { localStorage.setItem(IP_KEY, v); } catch (e) {}
    } else if (ipVal !== null) {
      ipVal = null;
      try { localStorage.removeItem(IP_KEY); } catch (e) {}
    }
    if (msg) {
      msg.textContent = (!ok && v && showMsg) ? 'Enter a valid IP address: four numbers from 0 to 255 separated by dots.' : '';
    }
    applyAllReplacements();
    refreshBadge();
  }

  function padNum(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function selectStudent(num) {
    var nn     = padNum(num);
    var libNum = 400 + num;
    var port   = 3000 + num;
    try { localStorage.setItem(STUDENT_KEY, JSON.stringify({ num: num, libNum: libNum, port: port })); } catch (e) {}
    applyStudentReplacements(num, nn, libNum, port);
    highlightSelectedRow(num);
    updateStudentBadge(num, libNum, port, null);
  }

  function selectStudentExplicit(num, libNum, port, name) {
    var nn = padNum(num);
    try { localStorage.setItem(STUDENT_KEY, JSON.stringify({ num: num, libNum: libNum, port: port, name: name })); } catch (e) {}
    applyStudentReplacements(num, nn, libNum, port);
    highlightSelectedRow(num);
    updateStudentBadge(num, libNum, port, name);
  }

  function restoreStudentSelection() {
    var saved;
    try { saved = JSON.parse(localStorage.getItem(STUDENT_KEY) || 'null'); } catch (e) {}
    if (!saved || !saved.num) return;
    var num    = saved.num;
    var libNum = saved.libNum || (400 + num);
    var port   = saved.port   || (3000 + num);
    var name   = saved.name   || null;
    var nn     = padNum(num);
    applyStudentReplacements(num, nn, libNum, port);
    highlightSelectedRow(num);
    updateStudentBadge(num, libNum, port, name);
  }

  function clearStudent() {
    try { localStorage.removeItem(STUDENT_KEY); localStorage.removeItem(IP_KEY); } catch (e) {}
    // Reload to restore original placeholder text
    window.location.reload();
  }

  // ── ORIGINAL-TEXT CACHE ───────────────────────────────────────────────────
  // We snapshot original text on first replacement so re-selection always
  // starts from the placeholder text, not the already-substituted value.
  var ORIG_ATTR = 'data-orig-text';

  function getOriginal(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node[ORIG_ATTR]) node[ORIG_ATTR] = node.textContent;
      return node[ORIG_ATTR];
    }
    // Element (pre, code)
    if (!node.dataset.origText) node.dataset.origText = node.textContent;
    return node.dataset.origText;
  }

  function applyStudentReplacements(num, nn, libNum, port) {
    studentSel = { num: num, nn: nn, libNum: libNum, port: port };
    applyAllReplacements();
  }

  function applyAllReplacements() {
    var root = document.getElementById('tracks-stream') || document.body;

    // Replace text in <pre> elements — always from original
    root.querySelectorAll('pre').forEach(function (pre) {
      pre.textContent = replaceTokens(getOriginal(pre));
    });

    // Replace in step descriptions and info boxes (text nodes only — skip code/pre)
    root.querySelectorAll('.step-title, .step-desc, .uc-desc, .info-box, .warn-box, .detail-intro, .data-table td, .step-screenshot-caption').forEach(function (el) {
      replaceTextNodes(el);
    });
  }

  function replaceTokens(text) {
    if (studentSel) {
      var nn = studentSel.nn, libNum = studentSel.libNum, port = studentSel.port;
      // Order matters: most-specific patterns first
      text = text
        .replace(/FLGHTSZ4nn/gi, 'FLGHTSZ' + libNum)
        .replace(/FLIGHT4nn/gi,  'FLIGHT' + libNum)
        .replace(/FLGHT4nn/gi,   'FLGHT' + libNum)
        .replace(/flght4nn/gi,   'flght' + libNum)
        .replace(/flight4nn/gi,  'flight' + libNum)
        .replace(/\b4nn\b/g,     String(libNum))
        .replace(/\b30nn\b/g,    String(port))
        .replace(/(?<![0-9])nn\b/g, nn);
    }
    if (ipVal) text = text.replace(/<myIPaddress>/g, ipVal);
    return text;
  }

  function replaceTextNodes(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var tag = node.parentElement && node.parentElement.tagName;
        if (tag === 'PRE' || tag === 'CODE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }, false);
    var node;
    while ((node = walker.nextNode())) {
      var orig = getOriginal(node);
      var replaced = replaceTokens(orig);
      if (replaced !== node.textContent) node.textContent = replaced;
    }
    // Also replace inside <code> elements (inline code, not pre>code)
    el.querySelectorAll('code').forEach(function (c) {
      if (c.closest('pre')) return;
      c.textContent = replaceTokens(getOriginal(c));
    });
  }

  function highlightSelectedRow(num) {
    var table = document.getElementById('attendee-table');
    if (!table) return;
    table.querySelectorAll('tbody tr').forEach(function (row) {
      row.classList.remove('attendee-selected');
    });
    var rows = table.querySelectorAll('tbody tr');
    var target = rows[num - 1];
    if (target) {
      target.classList.add('attendee-selected');
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function updateStudentBadge(num, libNum, port, name) {
    badgeStudent = { num: num, libNum: libNum, port: port, name: name };
    refreshBadge();
  }

  function refreshBadge() {
    if (!gfBadgeEl) return;
    var dot = '<span style="opacity:0.4;margin:0 5px">·</span>';
    var parts = [];
    if (badgeStudent) {
      var st = badgeStudent;
      parts.push(st.name
        ? '<strong>' + st.name + '</strong>' + dot + 'FLGHT' + st.libNum
        : '<span style="opacity:0.6;font-weight:500;font-size:0.68rem">Student&nbsp;</span><strong>' + st.num + '</strong>' + dot + 'FLGHT' + st.libNum);
      parts.push('<span style="font-family:var(--font-mono)">:' + st.port + '</span>');
    }
    var missing = [];
    if (!ipVal)        missing.push('IP address');
    if (!badgeStudent) missing.push('library');
    if (missing.length) {
      var list = missing.length > 1
        ? missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1]
        : missing[0];
      parts.push('<span class="badge-flag">⚠ Set your ' + list + ' (step 0.3)</span>');
    }
    gfBadgeEl.classList.toggle('needs-choice', missing.length > 0);
    if (gfBadgeClearEl) gfBadgeClearEl.style.display = (ipVal || badgeStudent) ? '' : 'none';
    if (gfBadgeNameEl) {
      gfBadgeNameEl.innerHTML = parts.join(dot);
      gfBadgeNameEl.setAttribute('role', 'button');
      gfBadgeNameEl.setAttribute('tabindex', '0');
      gfBadgeNameEl.setAttribute('title', 'Go to step 0.3');
    }
    gfBadgeEl.classList.remove('hidden');
    syncBadgeOffset();
  }

  // Opens Setup (if collapsed), the Setup card and step 0.3, then scrolls to it.
  function jumpToSelection() {
    var table = document.getElementById('attendee-table');
    if (!table) return;
    var uc   = table.closest('.use-case');
    var card = table.closest('.bubble-card');
    if (setupGroup && !setupGroup.classList.contains('extra-open')) {
      var toggle = setupGroup.querySelector('.extra-toggle');
      if (toggle) toggle.click();
    }
    if (card && !card.classList.contains('open')) {
      document.querySelectorAll('.bubble-card.open').forEach(function (c) { c.classList.remove('open'); });
      card.classList.add('open');
    }
    if (uc) {
      uc.closest('.use-cases').querySelectorAll('.use-case').forEach(function (u) { u.classList.remove('uc-open'); });
      uc.classList.add('uc-open');
    }
    setTimeout(function () {
      (uc || table).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  }

  if (gfBadgeClearEl) {
    gfBadgeClearEl.addEventListener('click', clearStudent);
  }

  function syncBadgeOffset() {
    if (!gfBadgeEl) return;
    gfBadgeEl.style.bottom = '24px';
  }

  // ── COPY HELPER ───────────────────────────────────────────────────────────
  function fallbackCopy(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { markCopied(btn); }).catch(function () { legacyCopy(text, btn); });
    } else {
      legacyCopy(text, btn);
    }
  }
  function legacyCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); markCopied(btn); } catch (e) {}
    document.body.removeChild(ta);
  }
  function markCopied(btn) {
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(function () {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 2000);
  }

  // ── SCREENSHOT LIGHTBOX ───────────────────────────────────────────────────
  // Click any .step-screenshot image to view it full size; close with the
  // Close button, a click on the dark background, or the Escape key.
  var lightbox = document.createElement('div');
  lightbox.className = 'img-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Expanded screenshot');
  lightbox.innerHTML =
    '<button type="button" class="img-lightbox-close" aria-label="Close expanded image">&times; Close</button>' +
    '<img class="img-lightbox-img" alt="" />';
  document.body.appendChild(lightbox);
  var lightboxImg = lightbox.querySelector('.img-lightbox-img');
  var lightboxClose = lightbox.querySelector('.img-lightbox-close');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('active');
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.classList.remove('active');
    lightboxImg.removeAttribute('src');
  }

  document.addEventListener('click', function (e) {
    var img = e.target.closest('.step-screenshot img');
    if (img) { openLightbox(img.currentSrc || img.src, img.alt); return; }
    if (e.target === lightbox || e.target.closest('.img-lightbox-close')) closeLightbox();
  });

  // ── ESCAPE KEY ────────────────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeNtb(); closeLightbox(); }
  });

})();

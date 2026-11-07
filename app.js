/* Corporate Case Comps calendar v4.
   Data: comps.js (window.COMPS), live.js (window.LIVE, open on Unstop), updates.js (window.UPDATES).
   One row component, one sticky bar (months + filters), every row has a visible link and a Remind me button. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const TRACKS = { marketing: 'Marketing', strategy: 'Strategy', finance: 'Finance', 'product-tech': 'Product and tech', 'ops-supply': 'Ops and supply chain', analytics: 'Analytics', 'general-mgmt': 'General management', hr: 'HR', sustainability: 'Sustainability', entrepreneurship: 'Entrepreneurship', pharma: 'Pharma' };
  const PEAK = new Set([8, 9, 10, 11]);
  const DAY = 864e5;
  const now = new Date(), curMo = now.getMonth() + 1;
  const ORDER = Array.from({ length: 12 }, (_, i) => ((curMo - 1 + i) % 12) + 1); // this month first

  const COMPS = window.COMPS || [];
  const LIVE = ((window.LIVE && window.LIVE.items) || []).filter((x) => !x.ends || new Date(x.ends) > now)
    .sort((a, b) => String(a.ends).localeCompare(String(b.ends)));
  const UPDATES = window.UPDATES || { runs: [] };

  const fmtDay = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d) - Date.now()) / DAY));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’.&]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const isDormant = (c) => /dormant/i.test(c.edition || '') || /dormant/i.test(c.window || '');
  const yearOf = (c) => {
    const s = (c.schools || '') + ' ' + (c.team || '');
    if (/1st.yr|first.year/i.test(s) && !/2nd|final/i.test(s)) return '1';
    if (/(2nd|final.yr|final-yr)/i.test(s) && !/1st.yr|first.year/i.test(s)) return '2';
    return 'both';
  };
  const liveFor = (c) => LIVE.find((x) => x.match === c.id || (c.unstop && x.url === c.unstop));
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 1900); };

  /* ---------- links: every item gets one ---------- */
  const unstopSearch = (name) => 'https://unstop.com/competitions?searchTerm=' + encodeURIComponent(name);
  function primaryLink(c) {
    const lv = liveFor(c);
    if (lv) return { url: lv.url, label: `Apply · closes ${fmtDay(lv.ends)}` };
    if (c.unstop) return { url: c.unstop, label: 'Unstop page' };
    if (c.site) return { url: c.site, label: 'Official page' };
    return { url: unstopSearch(c.n), label: 'Find on Unstop' };
  }
  // Google Calendar event: a deadline (open now) or the 1st of the month it usually opens
  const gdate = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
  function remindUrl(title, when, link, note) {
    const end = new Date(when.getTime() + DAY);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(title)
      + '&dates=' + gdate(when) + '/' + gdate(end)
      + '&details=' + encodeURIComponent(note + '\n' + link + '\n\nFrom Shivam Meet\'s case comp calendar: https://shivam-bschool-casecomps.vercel.app');
  }
  function remindFor(c) {
    const lv = liveFor(c), link = primaryLink(c).url;
    if (lv) return remindUrl(`Deadline: ${c.n}`, new Date(new Date(lv.ends).setHours(9, 0, 0, 0)), link, 'Registrations close today.');
    const y = now.getFullYear() + (c.mo < curMo ? 1 : 0);
    let when = new Date(Date.UTC(y, c.mo - 1, 1));
    if (c.mo === curMo) when = new Date(Date.now() + DAY);
    return remindUrl(`Check registrations: ${c.n}`, when, link, `${c.n} by ${c.org} usually opens around now (${c.window}). Check the link.`);
  }

  /* ---------- status ---------- */
  const shortWin = (w) => String(w || '').split(/[·(;]/)[0].replace(/~/g, '').replace(/\s+/g, ' ').trim();
  const whenTxt = (w) => { const s = shortWin(w); return /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|late|early|mid|\d)/i.test(s) ? 'Usually ' + s : s.charAt(0).toUpperCase() + s.slice(1); };
  function status(c) {
    const lv = liveFor(c);
    if (lv) { const n = daysLeft(lv.ends); return ['s-open', n <= 1 ? 'Open now · closes today' : `Open now · ${n} days left`]; }
    if (isDormant(c)) return ['s-dorm', c.edition || 'Not run recently'];
    return [c.mo === curMo ? 's-soon' : 's-usual', whenTxt(c.window)];
  }

  const icon = {
    cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>',
  };

  /* ---------- the row ---------- */
  function rowHTML(c, i) {
    const [cls, txt] = status(c), link = primaryLink(c), dorm = isDormant(c);
    const logo = c.logo ? `<img src="${esc(c.logo)}" alt="" loading="lazy">` : `<span class="mono">${esc((c.org || c.n)[0])}</span>`;
    const tracks = (c.tracks || []).map((t) => TRACKS[t] || t).join(', ');
    return `<li class="row${dorm ? ' dorm' : ''}" data-id="${esc(c.id)}" style="--i:${Math.min(i, 8)}">
      <div class="r-top"><span class="logo">${logo}</span>
        <span class="r-name"><b>${esc(c.n)}${c.isNew ? '<span class="tag-new">NEW</span>' : ''}</b><small>${esc(c.org)}${c.prize ? ' · ' + esc(c.prize.split(/[;+]/)[0].trim()) : ''}</small></span></div>
      <span class="status ${cls}"><i></i>${esc(txt)}</span>
      <div class="r-acts">
        <a class="btn go" href="${esc(link.url)}" target="_blank" rel="noopener">${esc(link.label)} ${icon.out}</a>
        <a class="btn ghost" href="${esc(remindFor(c))}" target="_blank" rel="noopener" aria-label="Remind me about ${esc(c.n)} in Google Calendar">${icon.cal}<span class="lbl">Remind</span></a>
        <button class="btn ghost det-btn" type="button" aria-expanded="false" aria-label="Details for ${esc(c.n)}">${icon.down}</button>
      </div>
      <div class="det"><div><div class="det-in">
        ${c.blurb ? `<p>${esc(c.blurb)}</p>` : ''}
        <dl>
          <dt>Who</dt><dd>${esc(c.schools || 'MBA students')}</dd>
          <dt>Team</dt><dd>${esc(c.team || '')}</dd>
          <dt>Prize</dt><dd>${esc(c.prize || '')}</dd>
          <dt>Timing</dt><dd>${esc(c.window || '')}${c.edition ? ' · ' + esc(c.edition) : ''}</dd>
          ${tracks ? `<dt>Tracks</dt><dd>${esc(tracks)}</dd>` : ''}
        </dl>
      </div></div></div>
    </li>`;
  }

  /* ---------- state + filters ---------- */
  const st = { q: '', track: 'all', year: 'all', allSchools: false, dorm: false };
  const trackCounts = {}; COMPS.forEach((c) => (c.tracks || []).forEach((t) => (trackCounts[t] = (trackCounts[t] || 0) + 1)));
  const trackKeys = Object.keys(TRACKS).filter((k) => trackCounts[k]).sort((a, b) => trackCounts[b] - trackCounts[a]);

  function pass(c, { ignoreDorm = false } = {}) {
    if (!ignoreDorm && !st.dorm && isDormant(c)) return false;
    if (st.track !== 'all' && !(c.tracks || []).includes(st.track)) return false;
    if (st.year !== 'all') { const y = yearOf(c); if (y !== 'both' && y !== st.year) return false; }
    if (st.allSchools && c.tier === 'premier') return false;
    if (st.q) {
      const hay = norm([c.n, c.full, c.org, c.blurb, (c.tracks || []).map((t) => TRACKS[t]).join(' ')].join(' '));
      if (!norm(st.q).split(' ').every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  function renderFilters() {
    const chip = (key, val, label, on) => `<button class="chip" type="button" data-k="${key}" data-v="${val}" aria-pressed="${on}">${label}</button>`;
    $('#filters').innerHTML = chip('track', 'all', 'All tracks', st.track === 'all')
      + trackKeys.map((k) => chip('track', k, TRACKS[k], st.track === k)).join('')
      + `<span class="chip sep" aria-hidden="true" style="border:0;background:none;padding:0 2px;width:1px"></span>`
      + chip('year', '1', '1st years', st.year === '1') + chip('year', '2', '2nd years', st.year === '2')
      + chip('allSchools', '1', 'Open to every B-school', st.allSchools);
  }
  $('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('.chip[data-k]'); if (!b) return;
    const { k, v } = b.dataset;
    if (k === 'track') st.track = v;
    if (k === 'year') st.year = st.year === v ? 'all' : v;
    if (k === 'allSchools') st.allSchools = !st.allSchools;
    renderFilters(); render();
  });

  /* ---------- list ---------- */
  function render() {
    const groups = ORDER.map((m) => {
      const list = COMPS.filter((c) => c.mo === m && pass(c))
        .sort((a, b) => (!!liveFor(b) - !!liveFor(a)) || (isDormant(a) - isDormant(b)) || (!!b.marquee - !!a.marquee) || a.n.localeCompare(b.n));
      return { m, list };
    });
    const total = groups.reduce((n, g) => n + g.list.length, 0);
    let i = 0;
    $('#list').innerHTML = total ? groups.filter((g) => g.list.length).map((g) => {
      const n = g.list.filter((c) => !isDormant(c)).length;
      return `<section class="mgroup" id="m-${g.m}" data-m="${g.m}">
        <div class="mg-h"><h3>${MONTH_FULL[g.m - 1]}</h3><span class="${g.m === curMo ? 'now' : ''}">${g.m === curMo ? 'This month · ' : ''}${n} ${n === 1 ? 'comp' : 'comps'}</span></div>
        <ol class="rows">${g.list.map((c) => rowHTML(c, i++)).join('')}</ol></section>`;
    }).join('') : `<div class="empty-state"><b>Nothing matches${st.q ? ` "${esc(st.q)}"` : ''}</b><p>Try a company name like HUL, Tata or Deloitte, or clear the filters.</p><button class="btn go" type="button" id="reset">Show everything</button></div>`;
    // month chips with counts
    $('#months').innerHTML = ORDER.map((m) => {
      const n = COMPS.filter((c) => c.mo === m && pass(c) && !isDormant(c)).length;
      return `<button class="mchip${PEAK.has(m) ? ' peak' : ''}${n ? '' : ' empty'}" type="button" data-m="${m}" ${n ? '' : 'disabled'} aria-label="${MONTH_FULL[m - 1]}, ${n} comps"><b>${m === curMo ? 'Now' : MONTHS[m - 1]}</b><small>${n}</small></button>`;
    }).join('');
    const dormN = COMPS.filter((c) => isDormant(c) && pass(c, { ignoreDorm: true })).length;
    const db = $('#dormBtn'); db.hidden = !dormN; db.textContent = st.dorm ? 'Hide comps that have not run recently' : `Show ${dormN} comps that have not run recently`;
    lastOn = null; spy();
  }
  $('#list').addEventListener('click', (e) => {
    if (e.target.closest('#reset')) { Object.assign(st, { q: '', track: 'all', year: 'all', allSchools: false }); $('#q').value = ''; renderFilters(); render(); return; }
    const b = e.target.closest('.det-btn'); if (!b) return;
    const row = b.closest('.row'), open = !row.classList.contains('open');
    row.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
  });
  $('#dormBtn').addEventListener('click', () => { st.dorm = !st.dorm; render(); });
  let qt; $('#q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value.trim(); render(); }, 120); });

  // month chips jump; the chip for the month on screen lights up
  $('#months').addEventListener('click', (e) => {
    const b = e.target.closest('.mchip'); if (!b || b.disabled) return;
    const g = document.getElementById('m-' + b.dataset.m);
    if (g) { lastOn = b.dataset.m; setOn(b.dataset.m); g.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
  });
  // which month is under the sticky bar: plain scroll check (works everywhere, no observers)
  function setOn(m) {
    document.querySelectorAll('.mchip').forEach((c) => c.classList.toggle('on', c.dataset.m === String(m)));
    const on = document.querySelector('.mchip.on');
    if (on) { const box = $('#months'); box.scrollTo({ left: on.offsetLeft - box.clientWidth / 2 + on.offsetWidth / 2, behavior: 'auto' }); }
  }
  let ticking = false, lastOn = null;
  function spy() {
    const line = $('#bar').getBoundingClientRect().bottom + 40;
    let cur = null;
    document.querySelectorAll('.mgroup').forEach((g) => { if (g.getBoundingClientRect().top <= line) cur = g.dataset.m; });
    cur = cur || (document.querySelector('.mgroup') || {}).dataset?.m;
    if (cur && cur !== lastOn) { lastOn = cur; setOn(cur); }
  }
  addEventListener('scroll', () => { if (ticking) return; ticking = true; setTimeout(() => { ticking = false; spy(); }, 60); }, { passive: true });

  /* ---------- open now board ---------- */
  function flaps(n) { return String(Math.min(n, 99)).padStart(2, '0').split('').map((d) => `<i class="flap" data-v="${d}">${d}</i>`).join(''); }
  let boardAll = false;
  function renderBoard() {
    if (!LIVE.length) return;
    $('#board').hidden = false;
    $('#boardMeta').textContent = `${LIVE.length} open`;
    const list = boardAll ? LIVE : LIVE.slice(0, 3);
    $('#brows').innerHTML = list.map((x, i) => {
      const n = daysLeft(x.ends);
      const rem = remindUrl(`Deadline: ${x.title}`, new Date(new Date(x.ends).setHours(9, 0, 0, 0)), x.url, 'Registrations close today.');
      return `<li class="brow${n <= 3 ? ' hot' : ''}" style="--i:${i}">
        <span class="flaps">${flaps(n)}<small>${n === 1 ? 'day' : 'days'}</small></span>
        <span class="bt"><b>${esc(x.title)}</b><small>${esc(x.org)} · closes ${fmtDay(x.ends)}</small></span>
        <span class="bacts"><a class="btn go" href="${esc(x.url)}" target="_blank" rel="noopener">Apply ${icon.out}</a><a class="btn ghost" href="${esc(rem)}" target="_blank" rel="noopener" aria-label="Remind me about the deadline">${icon.cal}</a></span></li>`;
    }).join('');
    const more = $('#boardMore'); more.hidden = LIVE.length <= 3; more.textContent = boardAll ? 'Show fewer' : `Show all ${LIVE.length} open now`;
    if (!reduce) [...document.querySelectorAll('#brows .flap')].forEach((f, i) => {
      const v = f.dataset.v; let k = 0; const steps = 5 + (i % 5);
      setTimeout(function t() { if (k++ < steps) { f.textContent = String((Math.random() * 10) | 0); f.classList.remove('tick'); void f.offsetWidth; f.classList.add('tick'); setTimeout(t, 70); } else f.textContent = v; }, i * 45);
    });
  }
  $('#boardMore').addEventListener('click', () => { boardAll = !boardAll; renderBoard(); });

  /* ---------- hero numbers, freshness, changelog ---------- */
  $('#nAll').textContent = COMPS.filter((c) => !isDormant(c)).length;
  $('#nOpenTxt').textContent = LIVE.length;
  const last = UPDATES.runs && UPDATES.runs[0];
  if (last) {
    $('#fresh').textContent = `Checked ${fmtDay(last.date)}.`;
    const lb = $('#logBtn'); lb.hidden = false;
    const lbl = { '(new entry)': 'Added', mo: 'Month', window: 'Timing', prize: 'Prize', edition: 'Latest edition', blurb: 'Description', schools: 'Who can enter', team: 'Team', unstop: 'Unstop link', site: 'Official page' };
    lb.addEventListener('click', () => {
      $('#logB').innerHTML = UPDATES.runs.slice(0, 6).map((r) => `<h4>${fmtDay(r.date)} · ${r.changes.length} changes</h4>${r.changes.length ? '<ul>' + r.changes.map((c) => `<li><b>${esc(c.name)}</b> · ${esc(lbl[c.field] || c.field)}: ${c.field === '(new entry)' ? '' : esc(c.from ?? 'none') + ' → '}${esc(c.to)} <a href="${esc(c.source)}" target="_blank" rel="noopener">source</a></li>`).join('') + '</ul>' : '<p>Nothing changed.</p>'}`).join('');
      $('#logDlg').showModal();
    });
  }
  document.addEventListener('click', (e) => { const d = $('#logDlg'); if (e.target.id === 'logX' || e.target === d) d.close(); });

  renderBoard(); renderFilters(); render();
})();

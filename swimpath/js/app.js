/*
 * SwimPath — UI controller. Renders five tabs and wires up interactions.
 * State lives in localStorage via SP.store; analytics via SP.engine.
 */
(function (global) {
  'use strict';

  var store = global.SP.store, engine = global.SP.engine,
      charts = global.SP.charts, seed = global.SP.seed;
  var L = store.STROKE_LABELS, C = store.STROKE_COLORS;
  var fmt = engine.fmtTime;

  var state = store.load();
  if (!state) { state = store.emptyState(); store.save(state); } // start blank; demo is opt-in from Profile

  var ui = { tab: 'home', stroke: state.profile.favouriteStroke || 'freestyle', event: null };

  // Bridge for the optional cloud-sync layer (js/cloud.js).
  global.SP.app = {
    getState: function () { return state; },
    applyRemote: function (s) {
      state = s;
      store.save(state);
      var ae = document.activeElement;
      // don't yank the view out from under someone who's mid-edit
      if (ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)) return;
      render();
    }
  };

  // ---- utilities ----------------------------------------------------------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function persist() {
    store.save(state);
    if (global.SP.cloud && global.SP.cloud.onPersist) global.SP.cloud.onPersist(state);
  }
  function copyText(t) {
    try { navigator.clipboard.writeText(t); }
    catch (e) {
      var i = document.createElement('textarea');
      i.value = t; document.body.appendChild(i); i.select();
      try { document.execCommand('copy'); } catch (_) {}
      i.remove();
    }
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function awardXp(amount, reason) {
    state.game.xp = (state.game.xp || 0) + amount;
    var newBadges = engine.refreshGame(state);
    persist();
    var msg = '+' + amount + ' XP' + (reason ? ' · ' + reason : '');
    if (newBadges.length) msg += '  🏅 ' + newBadges.map(function (b) { return b.name; }).join(', ');
    toast(msg);
  }

  // ---- HOME ---------------------------------------------------------------
  function renderHome() {
    var ov = engine.overallScore(state);
    var exp = engine.expectationLabel(state);
    var lvl = engine.levelFromXp(state.game.xp || 0);
    var ins = engine.insights(state);
    var bests = engine.bestTimes(state.swims);
    var att = engine.attendanceStats(state.sessions);
    var p = state.profile;

    var pbCount = Object.keys(bests).length;
    var view = el('<div></div>');

    view.appendChild(el(
      '<section class="card hero">' +
        '<div class="scoregauge" style="--pct:' + ov.score + '%">' +
          '<div class="scoreinner"><div class="scorenum">' + ov.score + '</div><div class="scoreunit">/ 100</div></div>' +
        '</div>' +
        '<div class="muted tiny" style="letter-spacing:1.5px">SWIM SHARK SCORE</div>' +
        '<div class="pill ' + exp.tone + '" style="margin-top:8px">' + esc(exp.label) + '</div>' +
        '<div class="tiny muted mt">Confidence ' + ov.confidence + '% · based on recorded data</div>' +
        '<div class="tiny muted" style="margin-top:3px">' + esc(p.avatar + ' ' + (p.name || 'Your swimmer')) + ' · age ' + p.age + '</div>' +
        '<div class="wave"></div>' +
      '</section>'));

    view.appendChild(el(
      '<section class="card">' +
        '<div class="row" style="align-items:center">' +
          '<div><div class="muted tiny">LEVEL</div><div class="big">' + lvl.level + '</div></div>' +
          '<div style="flex:2">' +
            '<div class="tiny muted">' + lvl.into + ' / ' + lvl.span + ' XP to level ' + (lvl.level + 1) + '</div>' +
            '<div class="xpbar"><div style="width:' + lvl.pct + '%"></div></div>' +
            '<div class="tiny muted mt">🔥 ' + (state.game.streak || 0) + ' streak · 🪙 ' + (state.game.coins || 0) + ' coins · 🏅 ' + (state.game.badges.length) + ' badges</div>' +
          '</div>' +
        '</div>' +
      '</section>'));

    view.appendChild(el(
      '<section class="grid3">' +
        '<div class="stat"><div class="v">' + pbCount + '</div><div class="l">Events tracked</div></div>' +
        '<div class="stat"><div class="v">' + state.swims.length + '</div><div class="l">Swims logged</div></div>' +
        '<div class="stat"><div class="v">' + att.pct + '%</div><div class="l">Attendance</div></div>' +
      '</section>'));

    var insHtml = ins.map(function (i) {
      return '<div class="insight ' + i.tone + '"><span class="ic">' + i.icon + '</span><span class="tx">' + esc(i.text) + '</span></div>';
    }).join('');
    view.appendChild(el(
      '<section class="card"><h3>AI Insights</h3>' +
        '<p class="sub">Plain-language observations from this swimmer\'s own data.</p>' + insHtml +
      '</section>'));

    // recommended goals
    var goalsHtml = (state.goals || []).map(function (g) {
      return '<label class="insight" style="cursor:pointer"><input type="checkbox" style="width:auto;flex:0 0 auto" data-goal="' + g.id + '"' +
        (g.done ? ' checked' : '') + '><span class="tx" style="' + (g.done ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(g.text) + '</span></label>';
    }).join('') || '<p class="muted tiny">No goals yet — add some on the Progress tab.</p>';
    view.appendChild(el('<section class="card"><h3>Recommended goals</h3><p class="sub">Tap to mark complete.</p>' + goalsHtml + '</section>'));

    mount(view);

    view.querySelectorAll('[data-goal]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var g = state.goals.find(function (x) { return x.id === cb.getAttribute('data-goal'); });
        if (g) { g.done = cb.checked; persist(); if (cb.checked) awardXp(20, 'goal complete'); renderHome(); }
      });
    });
  }

  // ---- STROKES ------------------------------------------------------------
  function renderStrokes() {
    var view = el('<div></div>');
    var chips = store.STROKES.map(function (st) {
      return '<button class="chip ' + (st === ui.stroke ? 'active' : '') + '" data-stroke="' + st + '"' +
        (st === ui.stroke ? ' style="background:' + C[st] + '"' : '') + '>' + L[st] + '</button>';
    }).join('');
    view.appendChild(el('<div class="chips">' + chips + '</div>'));

    var avg = engine.strokeAverage(state.strokeRatings, ui.stroke);
    view.appendChild(el(
      '<section class="card">' +
        '<div class="row" style="align-items:center"><div><h3 style="margin:0">' + L[ui.stroke] + '</h3>' +
        '<p class="sub" style="margin:0">Technique profile · 8 elements</p></div>' +
        '<div class="center" style="flex:0 0 auto"><div class="big" style="color:' + C[ui.stroke] + '">' +
        (avg != null ? Math.round(avg) : '–') + '</div><div class="tiny muted">avg /100</div></div></div>' +
        '<canvas id="radar" class="chart-md"></canvas>' +
      '</section>'));

    var r = state.strokeRatings[ui.stroke] || {};
    var sliders = store.SKILLS.map(function (sk) {
      var v = typeof r[sk] === 'number' ? r[sk] : 50;
      return '<div class="slider"><label>' + store.SKILL_LABELS[sk] + '</label>' +
        '<input type="range" min="0" max="100" value="' + v + '" data-skill="' + sk + '">' +
        '<span class="val" data-val="' + sk + '">' + v + '</span></div>';
    }).join('');
    view.appendChild(el('<section class="card"><h3>Coach ratings</h3><p class="sub">Adjust as technique develops — radar updates live.</p>' + sliders + '</section>'));

    mount(view);
    drawRadar();

    view.querySelectorAll('[data-stroke]').forEach(function (b) {
      b.addEventListener('click', function () { ui.stroke = b.getAttribute('data-stroke'); renderStrokes(); });
    });
    view.querySelectorAll('input[data-skill]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var sk = inp.getAttribute('data-skill'), val = parseInt(inp.value, 10);
        if (!state.strokeRatings[ui.stroke]) state.strokeRatings[ui.stroke] = {};
        state.strokeRatings[ui.stroke][sk] = val;
        $('[data-val="' + sk + '"]').textContent = val;
        var a = engine.strokeAverage(state.strokeRatings, ui.stroke);
        view.querySelector('.big').textContent = a != null ? Math.round(a) : '–';
        drawRadar();
      });
      inp.addEventListener('change', function () { persist(); engine.refreshGame(state); persist(); });
    });
  }

  function drawRadar() {
    var r = state.strokeRatings[ui.stroke] || {};
    var labels = store.SKILLS.map(function (sk) { return store.SKILL_LABELS[sk].split(' ')[0]; });
    var vals = store.SKILLS.map(function (sk) { return typeof r[sk] === 'number' ? r[sk] : 0; });
    charts.radar($('#radar'), labels, vals, C[ui.stroke]);
  }

  // ---- TIMES --------------------------------------------------------------
  function renderTimes() {
    var view = el('<div></div>');
    var bests = engine.bestTimes(state.swims);
    var keys = Object.keys(bests).sort();
    if (!ui.event || !bests[ui.event]) ui.event = keys[0] || null;

    // add swim form
    view.appendChild(el(
      '<section class="card"><h3>Log a swim</h3><p class="sub">Personal & seasonal bests update automatically.</p>' +
        '<div class="row">' +
          '<div><label class="f">Stroke</label><select id="sw_stroke">' +
            store.STROKES.map(function (s) { return '<option value="' + s + '"' + (s === ui.stroke ? ' selected' : '') + '>' + L[s] + '</option>'; }).join('') +
          '</select></div>' +
          '<div><label class="f">Distance (m)</label><select id="sw_dist">' +
            [25, 50, 100, 200, 400].map(function (d) { return '<option' + (d === 50 ? ' selected' : '') + '>' + d + '</option>'; }).join('') +
          '</select></div>' +
        '</div>' +
        '<div class="row">' +
          '<div><label class="f">Time (mm:ss.dd)</label><input id="sw_time" inputmode="decimal" placeholder="e.g. 51.60 or 1:08.40"></div>' +
          '<div><label class="f">Date</label><input id="sw_date" type="date" value="' + store.todayISO() + '"></div>' +
        '</div>' +
        '<label class="insight" style="cursor:pointer;border:none;padding-top:10px"><input id="sw_comp" type="checkbox" style="width:auto;flex:0 0 auto"><span class="tx">Competition swim</span></label>' +
        '<button class="btn mt" id="sw_add">Add swim</button>' +
      '</section>'));

    if (!keys.length) {
      view.appendChild(el('<section class="card center"><p class="muted">No swims yet. Log one above to see progress.</p></section>'));
      mount(view); wireAddSwim(); return;
    }

    // event selector chips
    var chips = keys.map(function (k) {
      var b = bests[k];
      return '<button class="chip ' + (k === ui.event ? 'active' : '') + '" data-event="' + k + '"' +
        (k === ui.event ? ' style="background:' + C[b.stroke] + '"' : '') + '>' + L[b.stroke] + ' ' + b.distance + 'm</button>';
    }).join('');
    view.appendChild(el('<div class="chips">' + chips + '</div>'));

    var b = bests[ui.event];
    var impClass = b.improvementPct > 0.1 ? 'up' : 'flat';
    var impTxt = b.improvementPct > 0.1 ? '▼ ' + b.improvementPct.toFixed(1) + '% faster' : 'No change yet';
    view.appendChild(el(
      '<section class="card">' +
        '<div class="row" style="align-items:baseline"><div><h3 style="margin:0">' + L[b.stroke] + ' ' + b.distance + 'm</h3>' +
        '<p class="sub" style="margin:2px 0 0">' + b.count + ' swims · pace ' + fmt(Math.round(b.lifetime / (b.distance / 25))) + '/25m</p></div>' +
        '<div class="center" style="flex:0 0 auto"><span class="imp ' + impClass + '">' + impTxt + '</span></div></div>' +
        '<canvas id="timeLine" class="chart-sm mt"></canvas>' +
        '<div class="grid3 mt">' +
          tile('Lifetime PB', fmt(b.lifetime)) +
          tile('Season best', fmt(b.season)) +
          tile('vs Age guide', benchLabel(b)) +
        '</div>' +
      '</section>'));

    // recent swims list
    var recent = state.swims.slice().sort(function (a, c) { return a.date < c.date ? 1 : -1; }).slice(0, 8);
    var rows = recent.map(function (s) {
      var b2 = bests[engine.eventKey(s)];
      var isPb = b2 && s.timeMs === b2.lifetime;
      return '<div class="evt">' +
        '<div class="badgecol" style="background:' + C[s.stroke] + '">' + (s.isCompetition ? '🏁' : '🏊') + '</div>' +
        '<div class="grow"><div>' + L[s.stroke] + ' ' + s.distance + 'm ' + (isPb ? '<span class="tiny" style="color:var(--good)">PB</span>' : '') + '</div>' +
        '<div class="tiny muted">' + s.date + (s.meet ? ' · ' + esc(s.meet) : '') + '</div></div>' +
        '<div class="pb">' + fmt(s.timeMs) + '</div>' +
        '<button class="iconbtn" data-del="' + s.id + '" title="Delete" style="width:30px;height:30px;font-size:13px">✕</button>' +
      '</div>';
    }).join('');
    view.appendChild(el('<section class="card"><h3>Recent swims</h3>' + rows + '</section>'));

    mount(view);
    drawTimeLine(b);
    wireAddSwim();

    view.querySelectorAll('[data-event]').forEach(function (c) {
      c.addEventListener('click', function () { ui.event = c.getAttribute('data-event'); renderTimes(); });
    });
    view.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-del');
        state.swims = state.swims.filter(function (s) { return s.id !== id; });
        persist(); renderTimes(); toast('Swim removed');
      });
    });
  }

  function benchLabel(b) {
    var bm = engine.benchmarkMs(state.profile.age, b.stroke, b.distance);
    var diff = ((bm - b.lifetime) / bm) * 100;
    var sign = diff >= 0 ? '+' : '';
    return sign + diff.toFixed(0) + '%';
  }
  function tile(l, v) { return '<div class="stat"><div class="v" style="font-size:16px">' + v + '</div><div class="l">' + l + '</div></div>'; }

  function drawTimeLine(b) {
    var pts = b.history.map(function (s) { return { y: s.timeMs }; });
    charts.line($('#timeLine'), pts, { color: C[b.stroke], invert: true });
  }

  function wireAddSwim() {
    var btn = $('#sw_add'); if (!btn) return;
    btn.addEventListener('click', function () {
      var ms = engine.parseTime($('#sw_time').value);
      if (!ms) { toast('Enter a valid time, e.g. 51.60'); return; }
      var stroke = $('#sw_stroke').value;
      var swim = {
        id: store.uid(), date: $('#sw_date').value || store.todayISO(),
        stroke: stroke, distance: parseInt($('#sw_dist').value, 10),
        timeMs: ms, course: 'SCM', isCompetition: $('#sw_comp').checked, meet: ''
      };
      var before = engine.bestTimes(state.swims)[engine.eventKey(swim)];
      state.swims.push(swim);
      ui.event = engine.eventKey(swim); ui.stroke = stroke;
      persist();
      var isPb = !before || ms < before.lifetime;
      awardXp(isPb ? 35 : 15, isPb ? 'new personal best! 🚀' : 'swim logged');
      renderTimes();
    });
  }

  // ---- PROGRESS / ANALYTICS ----------------------------------------------
  function renderProgress() {
    var view = el('<div></div>');
    var sw = engine.strengthsAndWeaknesses(state);
    var att = engine.attendanceStats(state.sessions);

    // stroke comparison bars
    view.appendChild(el(
      '<section class="card"><h3>Stroke comparison</h3><p class="sub">Average technique rating per stroke.</p>' +
        '<canvas id="strokeBars" class="chart-bars"></canvas>' +
        (sw.best ? '<div class="tiny muted mt">Strongest: <b style="color:' + C[sw.best.stroke] + '">' + L[sw.best.stroke] + '</b>' +
          (sw.weakest && sw.ranked.length > 1 ? ' · Focus: <b style="color:' + C[sw.weakest.stroke] + '">' + L[sw.weakest.stroke] + '</b>' : '') + '</div>' : '') +
      '</section>'));

    // prediction
    var bests = engine.bestTimes(state.swims);
    var predEvent = ui.event && bests[ui.event] ? ui.event : Object.keys(bests)[0];
    if (predEvent) {
      var pb = bests[predEvent];
      var horizons = [{ d: 180, l: '6 months' }, { d: 365, l: '1 year' }, { d: 1095, l: '3 years' }];
      var pblocks = horizons.map(function (h) {
        var pr = engine.predictEvent(state, pb.stroke, pb.distance, h.d);
        if (!pr) return tile(h.l, '–');
        if (pr.flat) return tile(h.l, fmt(pr.time));
        return '<div class="stat"><div class="v" style="font-size:15px">' + fmt(pr.time) + '</div>' +
          '<div class="l">' + h.l + '<br><span style="opacity:.7">' + fmt(pr.low) + '–' + fmt(pr.high) + '</span></div></div>';
      }).join('');
      view.appendChild(el(
        '<section class="card"><h3>Time projection · ' + L[pb.stroke] + ' ' + pb.distance + 'm</h3>' +
          '<p class="sub">Estimates extrapolated from recorded trend, damped for age. Shown with a range — not a guarantee.</p>' +
          '<div class="grid3">' + pblocks + '</div>' +
        '</section>'));
    }

    // attendance vs improvement
    view.appendChild(el(
      '<section class="card"><h3>Consistency</h3>' +
        '<div class="grid3">' +
          '<div class="stat"><div class="v">' + att.attended + '</div><div class="l">Attended</div></div>' +
          '<div class="stat"><div class="v">' + att.missed + '</div><div class="l">Missed</div></div>' +
          '<div class="stat"><div class="v">' + att.pct + '%</div><div class="l">Rate</div></div>' +
        '</div>' +
        '<p class="tiny muted mt">Attendance is the strongest improvement driver in the recorded data. Keep the streak going on the Home tab.</p>' +
      '</section>'));

    // badges
    var bset = {}; (state.game.badges || []).forEach(function (b) { bset[b] = 1; });
    var badgeHtml = engine.BADGE_DEFS.map(function (d) {
      return '<div class="bdg ' + (bset[d.id] ? 'on' : '') + '" title="' + esc(d.desc) + '">' +
        '<div class="ic">' + d.icon + '</div><div class="nm">' + esc(d.name) + '</div></div>';
    }).join('');
    view.appendChild(el('<section class="card"><h3>Trophy cabinet</h3><p class="sub">' +
      (state.game.badges.length) + ' / ' + engine.BADGE_DEFS.length + ' earned</p><div class="badges">' + badgeHtml + '</div></section>'));

    // goals editor
    var goalsHtml = (state.goals || []).map(function (g) {
      return '<div class="evt"><div class="grow"><span style="' + (g.done ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(g.text) + '</span></div>' +
        '<button class="iconbtn" data-goaldel="' + g.id + '" style="width:30px;height:30px;font-size:13px">✕</button></div>';
    }).join('');
    view.appendChild(el('<section class="card"><h3>Goals</h3>' + goalsHtml +
      '<div class="btnrow"><input id="goalInput" placeholder="Add a goal…"><button class="btn" id="goalAdd" style="width:auto;padding:13px 18px">Add</button></div></section>'));

    mount(view);

    // draw bars
    var barItems = store.STROKES.map(function (st) {
      var a = engine.strokeAverage(state.strokeRatings, st);
      return { label: L[st], value: a == null ? 0 : a, color: C[st] };
    });
    charts.bars($('#strokeBars'), barItems);

    $('#goalAdd').addEventListener('click', function () {
      var v = $('#goalInput').value.trim(); if (!v) return;
      state.goals.push({ id: store.uid(), text: v, done: false }); persist(); renderProgress();
    });
    view.querySelectorAll('[data-goaldel]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.goals = state.goals.filter(function (g) { return g.id !== b.getAttribute('data-goaldel'); });
        persist(); renderProgress();
      });
    });
  }

  // ---- cloud sync card ----------------------------------------------------
  function statusLabel(st) {
    var map = { connecting: 'Connecting…', synced: 'Synced ✓', saving: 'Saving…',
      ready: 'Ready', 'not-configured': 'Not set up' };
    if (map[st]) return map[st];
    if (st && String(st).indexOf('error') === 0) return 'Offline — will retry';
    return '…';
  }

  function cloudCardHtml() {
    var c = global.SP.cloud;
    if (!c || !c.configured()) {
      return '<section class="card"><h3>Cloud sync &amp; sharing</h3>' +
        '<p class="sub">Your data is saved on this device only.</p>' +
        '<p class="tiny muted">To sync and share this swimmer with another person, a one-time Firebase setup is needed (free). Once it’s configured, a "Create shared team" button appears here.</p></section>';
    }
    var team = c.getTeam();
    var st = statusLabel(c.getStatus());
    if (!team) {
      return '<section class="card"><h3>Cloud sync &amp; sharing</h3>' +
        '<p class="sub">Create a shared team to sync this swimmer between both of you, live.</p>' +
        '<button class="btn" id="cloudCreate">Create shared team</button>' +
        '<div class="btnrow"><input id="cloudJoin" placeholder="Or enter a team code…" autocapitalize="off" autocorrect="off">' +
        '<button class="btn secondary" id="cloudJoinBtn" style="width:auto;padding:13px 18px">Join</button></div>' +
        '<p class="tiny muted mt">Status: ' + st + '</p></section>';
    }
    return '<section class="card"><h3>Cloud sync &amp; sharing</h3>' +
      '<p class="sub">This swimmer is shared and syncing automatically. Anyone with the link below can view &amp; edit — keep it private.</p>' +
      '<div class="stat" style="text-align:left"><div class="l">Team code</div>' +
      '<div class="v" style="font-size:12px;word-break:break-all">' + esc(team) + '</div></div>' +
      '<div class="btnrow"><button class="btn" id="cloudShare">Copy invite link</button>' +
      '<button class="btn secondary" id="cloudCopyCode" style="width:auto;padding:13px 18px">Copy code</button></div>' +
      '<div class="btnrow"><button class="btn ghost" id="cloudLeave">Leave team</button></div>' +
      '<p class="tiny muted mt">Status: ' + st + '</p></section>';
  }

  function wireCloudCard() {
    var cc = $('#cloudCreate');
    if (cc) cc.addEventListener('click', function () {
      cc.disabled = true; cc.textContent = 'Creating…';
      global.SP.cloud.createTeam()
        .then(function () { toast('Shared team created'); renderProfile(); })
        .catch(function () { toast('Could not create team'); cc.disabled = false; cc.textContent = 'Create shared team'; });
    });
    var cj = $('#cloudJoinBtn');
    if (cj) cj.addEventListener('click', function () {
      var code = ($('#cloudJoin').value || '').trim();
      if (!code) { toast('Enter a team code'); return; }
      cj.disabled = true;
      global.SP.cloud.join(code)
        .then(function () { toast('Joined — syncing'); renderProfile(); })
        .catch(function (e) { toast(e && e.message === 'not-found' ? 'Team code not found' : 'Could not join'); cj.disabled = false; });
    });
    var cs = $('#cloudShare');
    if (cs) cs.addEventListener('click', function () { copyText(global.SP.cloud.shareLink()); toast('Invite link copied'); });
    var ccode = $('#cloudCopyCode');
    if (ccode) ccode.addEventListener('click', function () { copyText(global.SP.cloud.getTeam()); toast('Code copied'); });
    var cl = $('#cloudLeave');
    if (cl) cl.addEventListener('click', function () {
      if (global.confirm('Leave this shared team? This device keeps its current data but stops syncing.')) {
        global.SP.cloud.leave(); toast('Left team'); renderProfile();
      }
    });
  }

  // ---- PROFILE ------------------------------------------------------------
  function renderProfile() {
    var p = state.profile;
    var view = el('<div></div>');
    var avatars = ['🐬', '🦈', '🐙', '🐠', '🐳', '🦭', '🐢', '🦑'];
    view.appendChild(el(
      '<section class="card center">' +
        '<div style="font-size:54px">' + p.avatar + '</div>' +
        '<div class="chips" style="justify-content:center;margin-top:8px">' +
          avatars.map(function (a) { return '<button class="chip ' + (a === p.avatar ? 'active' : '') + '" data-av="' + a + '"' +
            (a === p.avatar ? ' style="background:var(--accent)"' : '') + '>' + a + '</button>'; }).join('') +
        '</div>' +
      '</section>'));

    function field(id, label, val, type, opts) {
      if (type === 'select') {
        return '<label class="f">' + label + '</label><select data-field="' + id + '">' +
          opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(val) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
      }
      return '<label class="f">' + label + '</label><input data-field="' + id + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '">';
    }

    view.appendChild(el(
      '<section class="card"><h3>Swimmer details</h3><p class="sub">Growth metrics let the engine frame expectations by age.</p>' +
        field('name', 'Name', p.name) +
        '<div class="row"><div>' + field('age', 'Age', p.age, 'number') + '</div>' +
        '<div>' + field('birthday', 'Birthday', p.birthday, 'date') + '</div></div>' +
        '<div class="row"><div>' + field('heightCm', 'Height (cm)', p.heightCm, 'number') + '</div>' +
        '<div>' + field('weightKg', 'Weight (kg)', p.weightKg, 'number') + '</div></div>' +
        '<div class="row"><div>' + field('armSpanCm', 'Arm span (cm)', p.armSpanCm, 'number') + '</div>' +
        '<div>' + field('experienceYears', 'Experience (yrs)', p.experienceYears, 'number') + '</div></div>' +
        field('club', 'Swim club', p.club) +
        field('coach', 'Coach', p.coach) +
        field('level', 'Competition level', p.level, 'select', [['Learn to Swim', 'Learn to Swim'], ['Junior Squad', 'Junior Squad'], ['Development', 'Development'], ['Competitive', 'Competitive'], ['National', 'National']]) +
        field('favouriteStroke', 'Favourite stroke', p.favouriteStroke, 'select', store.STROKES.map(function (s) { return [s, L[s]]; })) +
        '<button class="btn mt" id="saveProfile">Save profile</button>' +
      '</section>'));

    view.appendChild(el(cloudCardHtml()));

    view.appendChild(el(
      '<section class="card"><h3>Data</h3><p class="sub">Stored on this device, and synced to your team when sharing is on.</p>' +
        '<div class="btnrow"><button class="btn secondary" id="exportBtn">Export JSON</button>' +
        '<button class="btn secondary" id="demoBtn">Load demo</button></div>' +
        '<div class="btnrow"><button class="btn ghost" id="resetBtn">Reset all data</button></div>' +
      '</section>'));

    view.appendChild(el('<section class="card center tiny muted"><p>Swim Shark prototype · v0.1<br>Predictions are data-driven estimates, not guarantees.</p></section>'));

    mount(view);
    wireCloudCard();

    view.querySelectorAll('[data-av]').forEach(function (b) {
      b.addEventListener('click', function () { state.profile.avatar = b.getAttribute('data-av'); persist(); renderProfile(); });
    });
    $('#saveProfile').addEventListener('click', function () {
      view.querySelectorAll('[data-field]').forEach(function (f) {
        var key = f.getAttribute('data-field'), val = f.value;
        if (['age', 'heightCm', 'weightKg', 'armSpanCm', 'experienceYears'].indexOf(key) >= 0) val = val === '' ? null : parseFloat(val);
        state.profile[key] = val;
      });
      persist(); toast('Profile saved'); render();
    });
    $('#exportBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'swimpath-' + (state.profile.name || 'swimmer').replace(/\s+/g, '-').toLowerCase() + '.json';
      a.click(); toast('Exported');
    });
    $('#demoBtn').addEventListener('click', function () {
      if (confirm('Replace current data with the demo swimmer?')) { state = seed.buildDemo(); persist(); toast('Demo loaded'); render(); }
    });
    $('#resetBtn').addEventListener('click', function () {
      if (confirm('Erase all data and start fresh?')) { state = store.emptyState(); state.profile.name = ''; persist(); toast('Reset'); ui.tab = 'profile'; render(); }
    });
  }

  // ---- shell --------------------------------------------------------------
  function mount(node) {
    var v = $('#view'); v.innerHTML = ''; v.classList.remove('fadein');
    void v.offsetWidth; v.classList.add('fadein'); v.appendChild(node);
  }

  function render() {
    document.querySelectorAll('.navbtn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === ui.tab);
    });
    ({ home: renderHome, strokes: renderStrokes, times: renderTimes, progress: renderProgress, profile: renderProfile }[ui.tab] || renderHome)();
  }

  // nav
  document.querySelectorAll('.navbtn').forEach(function (b) {
    b.addEventListener('click', function () { ui.tab = b.getAttribute('data-tab'); window.scrollTo(0, 0); render(); });
  });

  // theme
  var savedTheme = global.localStorage.getItem('swimpath:theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  $('#themeBtn').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
  $('#themeBtn').addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    global.localStorage.setItem('swimpath:theme', cur);
    $('#themeBtn').textContent = cur === 'dark' ? '🌙' : '☀️';
    render();
  });

  // cloud sync status chip in the header
  var cloudBtn = $('#cloudBtn');
  function updateCloudBtn(stat) {
    if (!cloudBtn) return;
    var map = {
      'not-configured': ['🌐', 'Saved on this device only'],
      connecting: ['🔄', 'Connecting…'],
      ready: ['🌐', 'Tap to create or join a shared team'],
      synced: ['☁️', 'Synced — tap for sharing options'],
      saving: ['⏫', 'Saving…']
    };
    var m = map[stat] || (stat && String(stat).indexOf('error') === 0 ? ['⚠️', 'Offline — will retry'] : ['☁️', 'Sync']);
    cloudBtn.textContent = m[0];
    cloudBtn.title = m[1];
  }
  if (cloudBtn) cloudBtn.addEventListener('click', function () { ui.tab = 'profile'; global.scrollTo(0, 0); render(); });
  document.addEventListener('sp-cloud', function (e) {
    updateCloudBtn(e.detail && e.detail.status);
    if (ui.tab === 'profile') render();
  });
  updateCloudBtn(global.SP.cloud ? global.SP.cloud.getStatus() : 'not-configured');

  // redraw charts on resize/orientation
  var rt;
  global.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(render, 150); });

  render();
})(window);

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
  if (!state) { state = seed.buildDemo(); store.save(state); }

  var ui = { tab: 'home', stroke: state.profile.favouriteStroke || 'freestyle', event: null };

  // ---- utilities ----------------------------------------------------------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function persist() { store.save(state); }
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
        '<div class="hero-top">' +
          '<div class="ringwrap"><canvas id="scoreRing"></canvas></div>' +
          '<div class="hero-meta">' +
            '<div class="muted tiny">SWIMPATH SCORE</div>' +
            '<div class="pill ' + exp.tone + '">' + esc(exp.label) + '</div>' +
            '<div class="tiny muted mt">Confidence ' + ov.confidence + '% · based on recorded data</div>' +
            '<div class="tiny muted">' + esc(p.avatar + ' ' + (p.name || 'Your swimmer')) + ' · age ' + p.age + '</div>' +
          '</div>' +
        '</div>' +
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
    charts.ring($('#scoreRing'), ov.score, C[engine.strengthsAndWeaknesses(state).best ? engine.strengthsAndWeaknesses(state).best.stroke : 'freestyle'], '/100');

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

    view.appendChild(el(
      '<section class="card"><h3>Data</h3><p class="sub">Everything is stored locally on this device.</p>' +
        '<div class="btnrow"><button class="btn secondary" id="exportBtn">Export JSON</button>' +
        '<button class="btn secondary" id="demoBtn">Load demo</button></div>' +
        '<div class="btnrow"><button class="btn ghost" id="resetBtn">Reset all data</button></div>' +
      '</section>'));

    view.appendChild(el('<section class="card center tiny muted"><p>SwimPath prototype · v0.1<br>Predictions are data-driven estimates, not guarantees.</p></section>'));

    mount(view);

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

  // redraw charts on resize/orientation
  var rt;
  global.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(render, 150); });

  render();
})(window);

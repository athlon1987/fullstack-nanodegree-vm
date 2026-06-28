/*
 * SwimPath — progress engine
 * Transparent, data-driven heuristics (NOT a black box). Every number here can
 * be traced to recorded data. All projections are presented as estimates.
 */
(function (global) {
  'use strict';

  var store = global.SP.store;
  var STROKES = store.STROKES;
  var SKILLS = store.SKILLS;

  // ---- time helpers -------------------------------------------------------

  function parseTime(str) {
    // Accepts "mm:ss.dd", "ss.dd" or plain seconds. Returns milliseconds or null.
    if (str == null) return null;
    str = String(str).trim();
    if (!str) return null;
    var min = 0, sec = 0;
    if (str.indexOf(':') >= 0) {
      var parts = str.split(':');
      min = parseFloat(parts[0]) || 0;
      sec = parseFloat(parts[1]) || 0;
    } else {
      sec = parseFloat(str) || 0;
    }
    var ms = Math.round((min * 60 + sec) * 1000);
    return ms > 0 ? ms : null;
  }

  function fmtTime(ms) {
    if (ms == null) return '—';
    var total = ms / 1000;
    var min = Math.floor(total / 60);
    var sec = total - min * 60;
    var secStr = (sec < 10 ? '0' : '') + sec.toFixed(2);
    return min > 0 ? min + ':' + secStr : sec.toFixed(2);
  }

  // ---- age-group benchmarks ----------------------------------------------
  // Motivational reference times for 50m freestyle (short course), in seconds,
  // by age. Deliberately approximate and clearly labelled as a guide, not an
  // official standard. Used only to frame "ahead / on track / building".
  var BENCH_50_FREE = {
    4: 95, 5: 80, 6: 70, 7: 62, 8: 55, 9: 50, 10: 46,
    11: 42, 12: 39, 13: 36, 14: 34
  };
  // Per-stroke difficulty multiplier vs freestyle (rough, for framing only).
  var STROKE_FACTOR = {
    freestyle: 1.0, backstroke: 1.12, breaststroke: 1.25, butterfly: 1.15, medley: 1.18
  };

  function benchmarkMs(age, stroke, distance) {
    var a = Math.max(4, Math.min(14, Math.round(age || 8)));
    var base = BENCH_50_FREE[a];               // seconds for 50m free
    var perMetre = base / 50;
    var f = STROKE_FACTOR[stroke] || 1.0;
    return Math.round(perMetre * distance * f * 1000);
  }

  // ---- swim aggregation ---------------------------------------------------

  function eventKey(s) { return s.stroke + '|' + s.distance; }

  function bestTimes(swims) {
    // returns { eventKey: { lifetime, season, recentImprovementPct } }
    var byEvent = {};
    var seasonStart = new Date();
    seasonStart.setMonth(seasonStart.getMonth() - 6);
    swims.forEach(function (s) {
      var k = eventKey(s);
      if (!byEvent[k]) byEvent[k] = { swims: [] };
      byEvent[k].swims.push(s);
    });
    Object.keys(byEvent).forEach(function (k) {
      var arr = byEvent[k].swims.slice().sort(function (a, b) {
        return a.date < b.date ? -1 : 1;
      });
      var lifetime = null, season = null;
      arr.forEach(function (s) {
        if (lifetime == null || s.timeMs < lifetime) lifetime = s.timeMs;
        if (new Date(s.date) >= seasonStart && (season == null || s.timeMs < season)) season = s.timeMs;
      });
      // improvement: first vs latest best-so-far
      var firstMs = arr[0].timeMs;
      var improvementPct = firstMs > 0 ? ((firstMs - lifetime) / firstMs) * 100 : 0;
      byEvent[k] = {
        lifetime: lifetime,
        season: season,
        first: firstMs,
        latest: arr[arr.length - 1].timeMs,
        count: arr.length,
        improvementPct: improvementPct,
        stroke: arr[0].stroke,
        distance: arr[0].distance,
        history: arr
      };
    });
    return byEvent;
  }

  // ---- stroke ratings -----------------------------------------------------

  function strokeAverage(ratings, stroke) {
    var r = ratings[stroke];
    if (!r) return null;
    var sum = 0, n = 0;
    SKILLS.forEach(function (sk) {
      if (typeof r[sk] === 'number') { sum += r[sk]; n++; }
    });
    return n ? sum / n : null;
  }

  // ---- attendance ---------------------------------------------------------

  function attendanceStats(sessions) {
    var total = sessions.length;
    var attended = sessions.filter(function (s) { return s.attended; }).length;
    var pct = total ? Math.round((attended / total) * 100) : 0;
    return { total: total, attended: attended, missed: total - attended, pct: pct };
  }

  // ---- overall progress score (0..100) -----------------------------------
  // Weighted blend, each component clearly defined:
  //   45% technique (avg of all rated strokes)
  //   30% performance vs age benchmark (best events)
  //   15% consistency (attendance)
  //   10% engagement (number of recent swims logged)
  function overallScore(state) {
    var ratings = state.strokeRatings || {};
    var swims = state.swims || [];
    var age = state.profile.age;

    // technique component
    var techVals = [];
    STROKES.forEach(function (st) {
      var a = strokeAverage(ratings, st);
      if (a != null) techVals.push(a);
    });
    var techScore = techVals.length
      ? techVals.reduce(function (x, y) { return x + y; }, 0) / techVals.length
      : null;

    // performance component — compare best of each event to its benchmark
    var bests = bestTimes(swims);
    var perfVals = [];
    Object.keys(bests).forEach(function (k) {
      var b = bests[k];
      var bm = benchmarkMs(age, b.stroke, b.distance);
      if (bm > 0 && b.lifetime > 0) {
        // ratio>1 means faster than benchmark. Map to 0..100, 50 = at benchmark.
        var ratio = bm / b.lifetime;
        perfVals.push(Math.max(0, Math.min(100, 50 * ratio)));
      }
    });
    var perfScore = perfVals.length
      ? perfVals.reduce(function (x, y) { return x + y; }, 0) / perfVals.length
      : null;

    // consistency component
    var att = attendanceStats(state.sessions || []);
    var consistency = att.total ? att.pct : null;

    // engagement — swims logged in last 30 days, capped
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    var recent = swims.filter(function (s) { return new Date(s.date) >= cutoff; }).length;
    var engagement = Math.min(100, recent * 12);

    // combine the components that have data, renormalising weights
    var parts = [
      { v: techScore, w: 0.45 },
      { v: perfScore, w: 0.30 },
      { v: consistency, w: 0.15 },
      { v: engagement, w: 0.10 }
    ];
    var num = 0, den = 0;
    parts.forEach(function (p) { if (p.v != null) { num += p.v * p.w; den += p.w; } });
    var score = den ? Math.round(num / den) : 0;

    // confidence grows with how much data we have
    var dataPoints = swims.length + techVals.length * 3 + att.total;
    var confidence = Math.max(20, Math.min(95, Math.round(20 + dataPoints * 2.5)));

    return {
      score: score,
      confidence: confidence,
      components: {
        technique: techScore != null ? Math.round(techScore) : null,
        performance: perfScore != null ? Math.round(perfScore) : null,
        consistency: consistency != null ? Math.round(consistency) : null,
        engagement: Math.round(engagement)
      }
    };
  }

  // ---- strengths & weaknesses --------------------------------------------

  function strengthsAndWeaknesses(state) {
    var ratings = state.strokeRatings || {};
    var rows = [];
    STROKES.forEach(function (st) {
      var avg = strokeAverage(ratings, st);
      if (avg != null) rows.push({ stroke: st, avg: avg });
    });
    rows.sort(function (a, b) { return b.avg - a.avg; });
    return {
      best: rows.length ? rows[0] : null,
      weakest: rows.length ? rows[rows.length - 1] : null,
      ranked: rows
    };
  }

  // ---- prediction ---------------------------------------------------------
  // Project a future best for an event by extrapolating the observed
  // improvement-per-day trend, damped over time (improvement slows with age).
  function predictEvent(state, stroke, distance, horizonDays) {
    var bests = bestTimes(state.swims || []);
    var b = bests[stroke + '|' + distance];
    if (!b || b.history.length < 2) return null;
    var first = b.history[0];
    var last = b.history[b.history.length - 1];
    var days = Math.max(1, (new Date(last.date) - new Date(first.date)) / 86400000);
    var msPerDay = (b.first - b.lifetime) / days; // positive = getting faster
    if (msPerDay <= 0) return { time: b.lifetime, low: b.lifetime, high: b.lifetime, flat: true };
    // damping: each subsequent block of 180 days yields ~70% of prior gains
    var remaining = horizonDays, gain = 0, rate = msPerDay;
    while (remaining > 0) {
      var block = Math.min(180, remaining);
      gain += rate * block;
      rate *= 0.7;
      remaining -= block;
    }
    var projected = Math.max(b.lifetime * 0.6, b.lifetime - gain);
    var spread = gain * 0.35; // confidence interval widens with projected gain
    return {
      time: Math.round(projected),
      low: Math.round(projected - spread),
      high: Math.round(projected + spread),
      flat: false
    };
  }

  // ---- insights -----------------------------------------------------------
  // Plain-language observations derived strictly from recorded data.
  function insights(state) {
    var out = [];
    var swims = state.swims || [];
    var bests = bestTimes(swims);
    var sw = strengthsAndWeaknesses(state);
    var att = attendanceStats(state.sessions || []);

    // biggest improvement event
    var bestImp = null;
    Object.keys(bests).forEach(function (k) {
      var b = bests[k];
      if (b.count >= 2 && (!bestImp || b.improvementPct > bestImp.improvementPct)) bestImp = b;
    });
    if (bestImp && bestImp.improvementPct > 0.5) {
      out.push({
        icon: '⚡',
        tone: 'good',
        text: store.STROKE_LABELS[bestImp.stroke] + ' ' + bestImp.distance + 'm has improved ' +
          bestImp.improvementPct.toFixed(1) + '% since the first recorded swim (' +
          fmtTime(bestImp.first) + ' → ' + fmtTime(bestImp.lifetime) + ').'
      });
    }

    if (sw.best) {
      out.push({
        icon: '🏅', tone: 'good',
        text: 'Strongest stroke right now is ' + store.STROKE_LABELS[sw.best.stroke] +
          ' (technique avg ' + Math.round(sw.best.avg) + '/100).'
      });
    }
    if (sw.weakest && sw.ranked.length > 1) {
      out.push({
        icon: '🎯', tone: 'focus',
        text: 'Best area to focus next is ' + store.STROKE_LABELS[sw.weakest.stroke] +
          ' (technique avg ' + Math.round(sw.weakest.avg) + '/100). Small gains here lift the overall score most.'
      });
    }

    // weakest sub-skill across the focus stroke
    if (sw.weakest) {
      var r = state.strokeRatings[sw.weakest.stroke] || {};
      var worst = null;
      SKILLS.forEach(function (sk) {
        if (typeof r[sk] === 'number' && (!worst || r[sk] < worst.v)) worst = { sk: sk, v: r[sk] };
      });
      if (worst) {
        out.push({
          icon: '🔧', tone: 'focus',
          text: 'Within ' + store.STROKE_LABELS[sw.weakest.stroke] + ', "' +
            store.SKILL_LABELS[worst.sk] + '" is the lowest-rated element (' + worst.v +
            '/100) — a good target for the next drill block.'
        });
      }
    }

    if (att.total >= 3) {
      out.push({
        icon: '📅', tone: att.pct >= 80 ? 'good' : 'focus',
        text: 'Attendance is ' + att.pct + '% (' + att.attended + '/' + att.total +
          ' sessions). Consistent attendance is the strongest driver of improvement in the recorded data.'
      });
    }

    if (!out.length) {
      out.push({
        icon: '👋', tone: 'neutral',
        text: 'Log a few swims and rate the strokes to unlock personalised insights. Estimates are based only on the data you record.'
      });
    }
    return out;
  }

  // ---- expectation label --------------------------------------------------

  function expectationLabel(state) {
    var ov = overallScore(state);
    var perf = ov.components.performance;
    if (perf == null) return { label: 'Building a baseline', tone: 'neutral' };
    if (perf >= 58) return { label: 'Ahead of typical for age', tone: 'good' };
    if (perf >= 45) return { label: 'On track for age', tone: 'good' };
    return { label: 'Building toward age range', tone: 'focus' };
  }

  // ---- gamification -------------------------------------------------------

  function levelFromXp(xp) {
    // smooth curve: level n needs 100 * n*(n+1)/2 cumulative-ish
    var lvl = Math.floor(Math.sqrt(xp / 75)) + 1;
    var thisLevelXp = 75 * Math.pow(lvl - 1, 2);
    var nextLevelXp = 75 * Math.pow(lvl, 2);
    return {
      level: lvl,
      into: xp - thisLevelXp,
      span: nextLevelXp - thisLevelXp,
      pct: Math.round(((xp - thisLevelXp) / (nextLevelXp - thisLevelXp)) * 100)
    };
  }

  var BADGE_DEFS = [
    { id: 'first_splash', icon: '💦', name: 'First Splash', desc: 'Log your first swim',
      test: function (s) { return s.swims.length >= 1; } },
    { id: 'all_four', icon: '🌊', name: 'All Four Strokes', desc: 'Log every competitive stroke',
      test: function (s) {
        var set = {}; s.swims.forEach(function (x) { set[x.stroke] = 1; });
        return ['freestyle', 'backstroke', 'breaststroke', 'butterfly'].every(function (k) { return set[k]; });
      } },
    { id: 'pb_breaker', icon: '🚀', name: 'PB Breaker', desc: 'Improve a personal best',
      test: function (s) {
        var b = bestTimes(s.swims);
        return Object.keys(b).some(function (k) { return b[k].count >= 2 && b[k].improvementPct > 0; });
      } },
    { id: 'streak_3', icon: '🔥', name: 'On a Roll', desc: 'Reach a 3-session streak',
      test: function (s) { return (s.game.streak || 0) >= 3; } },
    { id: 'technician', icon: '🧠', name: 'Technician', desc: 'Rate any stroke 80+ average',
      test: function (s) {
        return STROKES.some(function (st) { var a = strokeAverage(s.strokeRatings, st); return a != null && a >= 80; });
      } },
    { id: 'committed', icon: '📈', name: 'Committed', desc: '90%+ attendance over 5+ sessions',
      test: function (s) { var a = attendanceStats(s.sessions); return a.total >= 5 && a.pct >= 90; } },
    { id: 'half_century', icon: '🏆', name: 'Half Century', desc: 'Log 50 swims',
      test: function (s) { return s.swims.length >= 50; } }
  ];

  function refreshGame(state) {
    var g = state.game;
    var earned = {};
    (g.badges || []).forEach(function (b) { earned[b] = 1; });
    var newly = [];
    BADGE_DEFS.forEach(function (def) {
      if (!earned[def.id] && def.test(state)) { newly.push(def); earned[def.id] = 1; }
    });
    g.badges = Object.keys(earned);
    g.coins = (g.coins || 0) + newly.length * 50;
    g.xp = (g.xp || 0) + newly.length * 40;
    return newly;
  }

  global.SP = global.SP || {};
  global.SP.engine = {
    parseTime: parseTime,
    fmtTime: fmtTime,
    benchmarkMs: benchmarkMs,
    bestTimes: bestTimes,
    strokeAverage: strokeAverage,
    attendanceStats: attendanceStats,
    overallScore: overallScore,
    strengthsAndWeaknesses: strengthsAndWeaknesses,
    predictEvent: predictEvent,
    insights: insights,
    expectationLabel: expectationLabel,
    levelFromXp: levelFromXp,
    refreshGame: refreshGame,
    BADGE_DEFS: BADGE_DEFS,
    eventKey: eventKey
  };
})(window);

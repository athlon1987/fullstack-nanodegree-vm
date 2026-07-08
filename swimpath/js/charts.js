/*
 * SwimPath — tiny canvas chart toolkit (radar, line, bars, ring).
 * Dependency-free, retina-aware, theme-aware via CSS custom properties.
 */
(function (global) {
  'use strict';

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function setup(canvas) {
    var dpr = global.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var w = rect.width || canvas.clientWidth || 300;
    var h = rect.height || canvas.clientHeight || 200;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  function hexToRgba(hex, a) {
    var m = hex.replace('#', '');
    if (m.length === 3) m = m[0] + m[0] + m[1] + m[1] + m[2] + m[2];
    var n = parseInt(m, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // ---- radar --------------------------------------------------------------
  function radar(canvas, labels, values, color) {
    var s = setup(canvas), ctx = s.ctx;
    var cx = s.w / 2, cy = s.h / 2 + 4;
    var radius = Math.min(s.w, s.h) / 2 - 26;
    var n = labels.length;
    var grid = cssVar('--grid', 'rgba(255,255,255,0.12)');
    var text = cssVar('--muted', '#9aa7b4');
    color = color || cssVar('--accent', '#22b8cf');

    // rings
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (var r = 1; r <= 4; r++) {
      ctx.beginPath();
      for (var i = 0; i <= n; i++) {
        var a = (Math.PI * 2 * i) / n - Math.PI / 2;
        var rr = (radius * r) / 4;
        var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // spokes + labels
    ctx.fillStyle = text;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var k = 0; k < n; k++) {
      var ang = (Math.PI * 2 * k) / n - Math.PI / 2;
      ctx.strokeStyle = grid;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
      ctx.stroke();
      var lx = cx + Math.cos(ang) * (radius + 14);
      var ly = cy + Math.sin(ang) * (radius + 14);
      ctx.fillText(labels[k], lx, ly);
    }
    // value polygon
    ctx.beginPath();
    for (var j = 0; j <= n; j++) {
      var idx = j % n;
      var ang2 = (Math.PI * 2 * idx) / n - Math.PI / 2;
      var val = Math.max(0, Math.min(100, values[idx])) / 100;
      var x2 = cx + Math.cos(ang2) * radius * val;
      var y2 = cy + Math.sin(ang2) * radius * val;
      if (j === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, 0.28);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    // points
    for (var p = 0; p < n; p++) {
      var pa = (Math.PI * 2 * p) / n - Math.PI / 2;
      var pv = Math.max(0, Math.min(100, values[p])) / 100;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(pa) * radius * pv, cy + Math.sin(pa) * radius * pv, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  // ---- line (time progression; lower is better so we invert visually) -----
  function line(canvas, points, opts) {
    opts = opts || {};
    var s = setup(canvas), ctx = s.ctx;
    var padL = 8, padR = 8, padT = 12, padB = 18;
    var w = s.w - padL - padR, h = s.h - padT - padB;
    var grid = cssVar('--grid', 'rgba(255,255,255,0.12)');
    var color = opts.color || cssVar('--accent', '#22b8cf');
    if (!points.length) return;
    var ys = points.map(function (p) { return p.y; });
    var min = Math.min.apply(null, ys), max = Math.max.apply(null, ys);
    if (min === max) { min -= 1; max += 1; }
    var pad = (max - min) * 0.15; min -= pad; max += pad;

    function X(i) { return padL + (points.length === 1 ? w / 2 : (w * i) / (points.length - 1)); }
    // invert: faster (smaller) time should sit higher on the chart
    function Y(v) { return padT + h - ((v - min) / (max - min)) * h * (opts.invert ? -1 : 1) - (opts.invert ? h : 0); }
    function Yi(v) { return padT + h * ((v - min) / (max - min)); } // small value -> top

    var yfn = opts.invert ? Yi : function (v) { return padT + h - ((v - min) / (max - min)) * h; };

    // gridlines
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    for (var g = 0; g <= 3; g++) {
      var gy = padT + (h * g) / 3;
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + w, gy); ctx.stroke();
    }
    // area + line
    ctx.beginPath();
    points.forEach(function (p, i) { var x = X(i), y = yfn(p.y); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.lineTo(X(points.length - 1), padT + h);
    ctx.lineTo(X(0), padT + h);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, 0.16);
    ctx.fill();

    ctx.beginPath();
    points.forEach(function (p, i) { var x = X(i), y = yfn(p.y); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.stroke();

    points.forEach(function (p, i) {
      ctx.beginPath();
      ctx.arc(X(i), yfn(p.y), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = cssVar('--card', '#10202b'); ctx.lineWidth = 2; ctx.stroke();
    });
  }

  // ---- horizontal bars ----------------------------------------------------
  function bars(canvas, items) {
    // items: [{label, value(0..100), color}]
    var s = setup(canvas), ctx = s.ctx;
    var text = cssVar('--muted', '#9aa7b4');
    var track = cssVar('--grid', 'rgba(255,255,255,0.10)');
    var rowH = s.h / items.length;
    var barH = Math.min(14, rowH * 0.45);
    var labelW = 86;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    items.forEach(function (it, i) {
      var y = rowH * i + rowH / 2;
      ctx.fillStyle = text; ctx.textAlign = 'left';
      ctx.fillText(it.label, 0, y);
      var x0 = labelW, fullW = s.w - labelW - 34;
      ctx.fillStyle = track;
      roundRect(ctx, x0, y - barH / 2, fullW, barH, barH / 2); ctx.fill();
      ctx.fillStyle = it.color || cssVar('--accent', '#22b8cf');
      roundRect(ctx, x0, y - barH / 2, Math.max(barH, fullW * (it.value / 100)), barH, barH / 2); ctx.fill();
      ctx.fillStyle = text; ctx.textAlign = 'right';
      ctx.fillText(Math.round(it.value), s.w, y);
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- progress ring ------------------------------------------------------
  function ring(canvas, value, color, label) {
    var s = setup(canvas), ctx = s.ctx;
    var cx = s.w / 2, cy = s.h / 2, r = Math.min(s.w, s.h) / 2 - 10;
    var track = cssVar('--grid', 'rgba(255,255,255,0.12)');
    color = color || cssVar('--accent', '#22b8cf');
    ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.strokeStyle = track;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * value) / 100);
    ctx.stroke();
    ctx.fillStyle = cssVar('--text', '#fff');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 ' + Math.round(r * 0.6) + 'px system-ui, sans-serif';
    ctx.fillText(Math.round(value), cx, cy - 2);
    if (label) {
      ctx.fillStyle = cssVar('--muted', '#9aa7b4');
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(label, cx, cy + r * 0.45);
    }
  }

  global.SP = global.SP || {};
  global.SP.charts = { radar: radar, line: line, bars: bars, ring: ring };
})(window);

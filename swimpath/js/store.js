/*
 * SwimPath — local data store
 * Persists everything to localStorage. No backend, fully offline.
 * The shape here mirrors what would become Firestore collections later:
 *   profile, swims, strokeRatings, sessions, game, goals
 */
(function (global) {
  'use strict';

  var KEY = 'swimpath:v1';

  var STROKES = ['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'medley'];
  var STROKE_LABELS = {
    freestyle: 'Freestyle',
    backstroke: 'Backstroke',
    breaststroke: 'Breaststroke',
    butterfly: 'Butterfly',
    medley: 'Ind. Medley'
  };
  var STROKE_COLORS = {
    freestyle: '#22b8cf',
    backstroke: '#5c7cfa',
    breaststroke: '#22c55e',
    butterfly: '#f59f00',
    medley: '#e64980'
  };
  // The 8 technique sub-skills tracked per stroke (0..100)
  var SKILLS = ['technique', 'efficiency', 'breathing', 'kick', 'pull', 'bodyPosition', 'turn', 'finish'];
  var SKILL_LABELS = {
    technique: 'Technique',
    efficiency: 'Efficiency',
    breathing: 'Breathing',
    kick: 'Kick',
    pull: 'Pull',
    bodyPosition: 'Body position',
    turn: 'Turns',
    finish: 'Finish'
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function emptyState() {
    return {
      version: 1,
      profile: {
        name: '',
        age: 8,
        heightCm: null,
        weightKg: null,
        armSpanCm: null,
        birthday: '',
        club: '',
        coach: '',
        experienceYears: 0,
        level: 'Learn to Swim',
        favouriteStroke: 'freestyle',
        avatar: '🐬'
      },
      swims: [],            // { id, date, stroke, distance, timeMs, course, isCompetition, meet }
      strokeRatings: {},    // stroke -> { skill: 0..100 }
      sessions: [],         // { id, date, attended, durationMin, notes }
      game: { xp: 0, coins: 0, streak: 0, badges: [], lastLogDate: null },
      goals: []
    };
  }

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      // shallow-merge over a fresh empty state so new fields never break old saves
      var base = emptyState();
      for (var k in data) { if (data.hasOwnProperty(k)) base[k] = data[k]; }
      return base;
    } catch (e) {
      console.warn('SwimPath: could not load state', e);
      return null;
    }
  }

  function save(state) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('SwimPath: could not save state', e);
      return false;
    }
  }

  function clear() {
    global.localStorage.removeItem(KEY);
  }

  global.SP = global.SP || {};
  global.SP.store = {
    KEY: KEY,
    STROKES: STROKES,
    STROKE_LABELS: STROKE_LABELS,
    STROKE_COLORS: STROKE_COLORS,
    SKILLS: SKILLS,
    SKILL_LABELS: SKILL_LABELS,
    uid: uid,
    todayISO: todayISO,
    emptyState: emptyState,
    load: load,
    save: save,
    clear: clear
  };
})(window);

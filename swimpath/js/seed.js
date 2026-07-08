/*
 * SwimPath — demo data generator for an 8-year-old swimmer ("Maya").
 * Produces a believable few months of progress so every screen has something
 * to show on first launch. Replaceable from the Profile screen.
 */
(function (global) {
  'use strict';

  var store = global.SP.store;
  var engine = global.SP.engine;

  function daysAgo(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function buildDemo() {
    var s = store.emptyState();
    s.profile = {
      name: 'Maya Rivera', age: 8, heightCm: 130, weightKg: 27, armSpanCm: 132,
      birthday: '2017-09-14', club: 'Bluewave Juniors', coach: 'Coach Tom',
      experienceYears: 2, level: 'Junior Squad', favouriteStroke: 'freestyle', avatar: '🐬'
    };

    // Stroke technique ratings (0..100) — freestyle strongest, fly developing.
    s.strokeRatings = {
      freestyle:    { technique: 78, efficiency: 74, breathing: 80, kick: 72, pull: 76, bodyPosition: 79, turn: 65, finish: 70 },
      backstroke:   { technique: 70, efficiency: 66, breathing: 75, kick: 68, pull: 64, bodyPosition: 72, turn: 58, finish: 62 },
      breaststroke: { technique: 60, efficiency: 55, breathing: 64, kick: 52, pull: 62, bodyPosition: 58, turn: 48, finish: 55 },
      butterfly:    { technique: 52, efficiency: 46, breathing: 50, kick: 58, pull: 48, bodyPosition: 50, turn: 42, finish: 45 },
      medley:       { technique: 62, efficiency: 58, breathing: 64, kick: 60, pull: 60, bodyPosition: 62, turn: 50, finish: 56 }
    };

    // Swims showing steady improvement. timeMs decreasing over time.
    function swim(date, stroke, distance, time, isComp, meet) {
      return { id: store.uid(), date: date, stroke: stroke, distance: distance,
        timeMs: engine.parseTime(time), course: 'SCM', isCompetition: !!isComp, meet: meet || '' };
    }
    s.swims = [
      swim(daysAgo(150), 'freestyle', 50, '58.40'),
      swim(daysAgo(120), 'freestyle', 50, '56.90'),
      swim(daysAgo(90),  'freestyle', 50, '55.10', true, 'Spring Mini Meet'),
      swim(daysAgo(60),  'freestyle', 50, '53.80'),
      swim(daysAgo(30),  'freestyle', 50, '52.40', true, 'Club Champs'),
      swim(daysAgo(7),   'freestyle', 50, '51.60'),

      swim(daysAgo(140), 'freestyle', 25, '27.10'),
      swim(daysAgo(70),  'freestyle', 25, '25.40'),
      swim(daysAgo(14),  'freestyle', 25, '24.30'),

      swim(daysAgo(120), 'backstroke', 50, '1:05.20'),
      swim(daysAgo(60),  'backstroke', 50, '1:02.80'),
      swim(daysAgo(20),  'backstroke', 50, '1:01.10', true, 'Club Champs'),

      swim(daysAgo(110), 'breaststroke', 50, '1:12.50'),
      swim(daysAgo(45),  'breaststroke', 50, '1:09.90'),
      swim(daysAgo(10),  'breaststroke', 50, '1:08.40'),

      swim(daysAgo(80),  'butterfly', 25, '32.60'),
      swim(daysAgo(25),  'butterfly', 25, '30.90'),

      swim(daysAgo(30),  'medley', 100, '2:18.00', true, 'Club Champs')
    ];

    // Training sessions / attendance over ~8 weeks.
    var sessions = [];
    for (var i = 0; i < 16; i++) {
      var attended = !(i === 4 || i === 11); // missed two
      sessions.push({ id: store.uid(), date: daysAgo(i * 4 + 2), attended: attended,
        durationMin: 60, notes: attended ? '' : 'Missed — unwell' });
    }
    s.sessions = sessions;

    s.goals = [
      { id: store.uid(), text: 'Break 50s in 50m Freestyle', done: false },
      { id: store.uid(), text: 'Improve butterfly body position to 60+', done: false },
      { id: store.uid(), text: 'Legal breaststroke turn in next meet', done: true }
    ];

    s.game = { xp: 0, coins: 0, streak: 5, badges: [], lastLogDate: store.todayISO() };
    // award XP retroactively for the demo history, then compute badges
    s.game.xp = 640;
    engine.refreshGame(s);
    return s;
  }

  global.SP = global.SP || {};
  global.SP.seed = { buildDemo: buildDemo, daysAgo: daysAgo };
})(window);

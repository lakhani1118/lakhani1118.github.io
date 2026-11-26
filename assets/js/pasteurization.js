/* Pasteurization tables + hold-time timer (pasteurization-tables.html).
   Data: Appendix C of Douglas Baldwin, "A Practical Guide to Sous Vide Cooking". */
(function () {
  'use strict';

  // ---------- Data ----------

  // Table C.1: [°F, seconds]
  var meat = [
    [130, 112*60], [131, 89*60], [132, 71*60], [133, 56*60], [134, 45*60], [135, 36*60],
    [136, 28*60], [137, 23*60], [138, 18*60], [139, 15*60], [140, 12*60], [141, 9*60],
    [142, 8*60], [143, 6*60], [144, 5*60], [145, 4*60], [146, 169], [147, 134],
    [148, 107], [149, 85], [150, 67], [151, 54], [152, 43], [153, 34], [154, 27],
    [155, 22], [156, 17], [157, 14], [158, 0]
  ];

  // Table C.2: [°F, 1%, 3%, 5%, 7%, 9%, 12% fat], m = minutes, s = seconds
  var m = function (x) { return x * 60; }, s = function (x) { return x; };
  var poultry = [
    [136, m(64),   m(65.7), m(68.4), m(71.4), m(74.8), m(81.4)],
    [137, m(51.9), m(52.4), m(54.3), m(56.8), m(59.7), m(65.5)],
    [138, m(42.2), m(42.7), m(43.4), m(45.3), m(47.7), m(52.9)],
    [139, m(34.4), m(34.9), m(35.4), m(36.2), m(38.3), m(43)],
    [140, m(28.1), m(28.5), m(29),   m(29.7), m(30.8), m(35)],
    [141, m(23),   m(23.3), m(23.8), m(24.4), m(25.5), m(28.7)],
    [142, m(18.9), m(19.1), m(19.5), m(20.1), m(21.1), m(23.7)],
    [143, m(15.5), m(15.7), m(16.1), m(16.6), m(17.4), m(19.8)],
    [144, m(12.8), m(12.9), m(13.2), m(13.7), m(14.4), m(16.6)],
    [145, m(10.5), m(10.6), m(10.8), m(11.3), m(11.9), m(13.8)],
    [146, m(8.7),  m(8.7),  m(8.9),  m(9.2),  m(9.8),  m(11.5)],
    [148, m(5.8),  m(5.8),  m(5.9),  m(6.1),  m(6.5),  m(7.7)],
    [150, m(3.8),  m(3.7),  m(3.7),  m(3.9),  m(4.1),  m(4.9)],
    [152, m(2.3),  m(2.3),  m(2.3),  m(2.3),  m(2.4),  m(2.8)],
    [154, m(1.5),  m(1.5),  m(1.5),  m(1.5),  m(1.5),  m(1.6)],
    [156, s(59),   s(59.5), m(1),    m(1),    m(1),    m(1)],
    [158, s(38.8), s(39.2), s(39.6), s(40),   s(40.3), s(40.9)],
    [160, s(25.6), s(25.8), s(26.1), s(26.3), s(26.6), s(26.9)],
    [162, s(16.9), s(17),   s(17.2), s(17.3), s(17.5), s(17.7)],
    [164, s(11.1), s(11.2), s(11.3), s(11.4), s(11.5), s(11.7)],
    [166, 0, 0, 0, 0, 0, 0]
  ];

  // ---------- Storage (private browsing can throw) ----------

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // ---------- Formatting ----------

  var unit = store.get('pasteurUnit') === 'C' ? 'C' : 'F';

  function toC(f) { return ((f - 32) * 5 / 9).toFixed(1); }
  function tempText(f) { return unit === 'F' ? f + '°F' : toC(f) + '°C'; }
  function tempCell(f) {
    return unit === 'F'
      ? f + '°F<span class="alt">' + toC(f) + '°C</span>'
      : toC(f) + '°C<span class="alt">' + f + '°F</span>';
  }

  function parts(sec) {
    sec = Math.round(sec);
    return { h: Math.floor(sec / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60 };
  }

  // Each unit gets its own fixed-width slot, so values align by unit down a column
  function durHTML(sec) {
    var p = parts(sec);
    var slot = function (cls, v, u) { return '<span class="' + cls + '">' + (v ? v + '<i>' + u + '</i>' : '') + '</span>'; };
    return '<span class="dur">' + slot('h', p.h, 'h') + slot('m', p.m, 'm') + slot('s', p.s, 's') + '</span>';
  }

  // Plain words, for labels and screen readers: "1 h 52 min", "23 min 42 s"
  function durWords(sec) {
    var p = parts(sec), out = [];
    if (p.h) out.push(p.h + ' h');
    if (p.m) out.push(p.m + ' min');
    if (p.s) out.push(p.s + ' s');
    return out.join(' ') || '0 s';
  }


  function clock(sec) {
    var p = parts(Math.max(0, Math.ceil(sec)));
    var mm = p.h ? String(p.m).padStart(2, '0') : String(p.m);
    return (p.h ? p.h + ':' : '') + mm + ':' + String(p.s).padStart(2, '0');
  }

  function timeOfDay(ms) {
    return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  // ---------- Tables ----------

  // Poultry is shown as two columns: low fat = average of the 1, 3 and 5%
  // columns, high fat = average of the 7, 9 and 12% columns.
  function avg(a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; }
  var poultryLH = poultry.map(function (r) {
    return [r[0], avg(r.slice(1, 4)), avg(r.slice(4, 7))];
  });
  var fatGroups = [{ key: 'low', label: 'low fat' }, { key: 'high', label: 'high fat' }];

  var meatBody = document.getElementById('meat-body');
  var poultryBody = document.getElementById('poultry-body');

  function pickCell(id, f, sec, food) {
    if (sec === 0) return '<td><span class="instant">Instant</span></td>';
    return '<td class="t"><button type="button" class="pick" id="' + id + '" data-id="' + id + '" data-f="' + f +
      '" data-sec="' + sec + '" data-food="' + food + '" aria-pressed="false" aria-label="' +
      food + ' at ' + tempText(f) + ': ' + durWords(sec) + '">' + durHTML(sec) + '</button></td>';
  }

  function render() {
    meatBody.innerHTML = meat.map(function (r) {
      return '<tr><th scope="row" class="temp">' + tempCell(r[0]) + '</th>' +
        pickCell('meat-' + r[0], r[0], r[1], 'Beef, lamb or pork') + '</tr>';
    }).join('');
    poultryBody.innerHTML = poultryLH.map(function (r) {
      return '<tr><th scope="row" class="temp">' + tempCell(r[0]) + '</th>' +
        fatGroups.map(function (g, i) {
          return pickCell('poultry-' + r[0] + '-' + g.key, r[0], r[i + 1], 'Chicken or turkey, ' + g.label);
        }).join('') + '</tr>';
    }).join('');
    document.querySelectorAll('.unit-toggle button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.unit === unit));
    });
    markPicked();
  }

  document.querySelectorAll('.unit-toggle button').forEach(function (b) {
    b.addEventListener('click', function () {
      unit = b.dataset.unit;
      store.set('pasteurUnit', unit);
      render();
      paint();
    });
  });

  // ---------- Tabs ----------
  // The hash picks the table (#meat, #poultry) or a single cell (#poultry-142-low),
  // so a link can point a friend at the exact time you use.

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs button'));
  var hash = location.hash.slice(1);
  var linkedCell = /^(meat|poultry)-\d+/.test(hash) ? hash : null;
  var table = linkedCell ? linkedCell.split('-')[0] : hash;
  if (table !== 'meat' && table !== 'poultry') {
    table = store.get('pasteurTable') === 'poultry' ? 'poultry' : 'meat';
  }

  function showTable(name, keepHash) {
    table = name;
    tabs.forEach(function (b) {
      var on = b.dataset.table === name;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.panels .panel').forEach(function (sec) {
      var on = sec.id === 'panel-' + name;
      sec.setAttribute('aria-hidden', String(!on));
      sec.inert = !on;
    });
    store.set('pasteurTable', name);
    if (!keepHash) { try { history.replaceState(null, '', '#' + name); } catch (e) {} }
  }

  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { showTable(b.dataset.table); });
    b.addEventListener('keydown', function (e) {
      var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      next = tabs[(next + tabs.length) % tabs.length];
      showTable(next.dataset.table);
      next.focus();
    });
  });

  // ---------- Timer ----------
  // t = { id, f, food, sec, state: idle|running|paused|done, endAt, left, startedAt }
  // Time left is worked out from endAt (a wall-clock timestamp), so the count
  // stays right when the tab is in the background or the page is reloaded.

  var el = {
    bar: document.getElementById('timer'),
    food: document.getElementById('timer-food'),
    note: document.getElementById('timer-note'),
    clock: document.getElementById('timer-clock'),
    go: document.getElementById('timer-go'),
    reset: document.getElementById('timer-reset'),
    close: document.getElementById('timer-close'),
    msg: document.getElementById('timer-msg'),
    msgText: document.getElementById('timer-msg-text'),
    undo: document.getElementById('timer-undo'),
    status: document.getElementById('timer-status'),
    main: document.getElementById('main')
  };
  var baseTitle = document.title;
  var t = null, tick = null, wakeLock = null, audio = null;
  var msgTimer = null, undoState = null, alarm = null;

  function readStored() {
    var v = null;
    try { v = JSON.parse(store.get('pasteurTimer')); } catch (e) { v = null; }
    return v && typeof v.sec === 'number' && v.state ? v : null;
  }
  t = readStored();

  function save() { if (t) store.set('pasteurTimer', JSON.stringify(t)); else store.del('pasteurTimer'); }
  function copy(o) { return o ? JSON.parse(JSON.stringify(o)) : null; }

  function left() {
    if (!t) return 0;
    if (t.state === 'running') return Math.max(0, (t.endAt - Date.now()) / 1000);
    if (t.state === 'done') return 0;
    return t.left;
  }

  function announce(text) { el.status.textContent = text; }

  function markPicked() {
    document.querySelectorAll('.pick').forEach(function (b) {
      b.setAttribute('aria-pressed', String(!!t && b.dataset.id === t.id));
    });
  }

  // A short line across the bottom of the bar, optionally with Undo
  function showMsg(text, undoable, ms) {
    clearTimeout(msgTimer);
    undoState = undoable || null;
    el.msgText.textContent = text;
    el.undo.hidden = !undoable;
    el.msg.hidden = false;
    paint();
    announce(text);
    msgTimer = setTimeout(hideMsg, ms || 8000);
  }
  function hideMsg() {
    clearTimeout(msgTimer);
    undoState = null;
    el.msg.hidden = true;
    paint();
  }

  function load(p) {
    t = { id: p.id, f: p.f, food: p.food, sec: p.sec, state: 'idle', endAt: null, left: p.sec };
    markPicked();
  }

  function paint() {
    if (!t) {
      el.bar.hidden = true;
      el.main.style.setProperty('--dock-h', '0px');
      document.title = baseTitle;
      return;
    }
    var rem = left();
    el.bar.hidden = false;
    el.bar.dataset.state = t.state;
    el.food.textContent = t.food + ' · ' + tempText(t.f);
    el.clock.textContent = t.state === 'done' ? 'Done' : clock(rem);
    el.bar.style.setProperty('--done', String(t.sec ? 1 - rem / t.sec : 1));

    if (t.state === 'idle') el.note.textContent = 'Hold ' + durWords(t.sec);
    else if (t.state === 'running') el.note.textContent = 'Done at ' + timeOfDay(t.endAt);
    else if (t.state === 'paused') el.note.textContent = 'Paused';
    else el.note.textContent = 'Held ' + durWords(t.sec) + '. Pasteurized.';

    // Destructive buttons stay away from the main one: no Clear while counting
    el.go.textContent = { idle: 'Start', running: 'Pause', paused: 'Resume', done: 'Got it' }[t.state];
    el.reset.textContent = t.state === 'done' ? 'Restart' : 'Reset';
    el.reset.hidden = t.state === 'idle';
    el.close.hidden = t.state === 'running' || t.state === 'done';

    document.title = t.state === 'running' ? clock(rem) + ' · ' + t.food
      : t.state === 'done' ? 'Done · ' + baseTitle : baseTitle;
    el.main.style.setProperty('--dock-h', el.bar.offsetHeight + 'px');
  }

  function run() {
    clearInterval(tick);
    tick = null;
    if (t && t.state === 'running') {
      tick = setInterval(function () {
        if (left() <= 0) finish(true);
        else paint();
      }, 250);
      keepAwake(true);
    } else {
      keepAwake(false);
    }
  }

  function start() {
    unlockAudio();
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch (e) {}
    }
    var from = t.state === 'paused' ? t.left : t.sec;
    if (t.state !== 'paused') t.startedAt = Date.now();
    t.state = 'running';
    t.endAt = Date.now() + from * 1000;
    save();
    run();
    paint();
    announce('Timer started. Done at ' + timeOfDay(t.endAt) + '.');
  }

  function pause() {
    t.left = left();
    t.state = 'paused';
    t.endAt = null;
    save();
    run();
    paint();
    announce('Paused with ' + durWords(Math.ceil(t.left)) + ' left.');
  }

  function reset() {
    t.state = 'idle';
    t.endAt = null;
    t.left = t.sec;
    save();
    run();
    paint();
  }

  function finish(live) {
    t.state = 'done';
    t.endAt = null;
    t.left = 0;
    save();
    run();
    hideMsg();
    paint();
    announce('Done. ' + t.food + ' held at ' + tempText(t.f) + ' for ' + durWords(t.sec) + '.');
    if (!live) return; // finished while the page was closed: no alarm on load
    startAlarm();
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      try { new Notification('Pasteurization timer done', { body: t.food + ' · ' + tempText(t.f) + ' · ' + durWords(t.sec), icon: 'images/favicon_io/android-chrome-192x192.png' }); } catch (e) {}
    }
  }

  function clear() {
    stopAlarm();
    t = null;
    save();
    run();
    hideMsg();
    markPicked();
    paint();
    announce('Timer cleared.');
  }

  function restore(prev) {
    t = prev;
    save();
    run();
    markPicked();
    hideMsg();
    announce('Undone. ' + t.food + ' at ' + tempText(t.f) + ', ' + durWords(Math.ceil(left())) + ' left.');
  }

  el.go.addEventListener('click', function () {
    if (!t) return;
    if (t.state === 'running') pause();
    else if (t.state === 'done') clear();
    else start();
  });
  el.reset.addEventListener('click', function () {
    if (!t) return;
    if (t.state === 'done') { stopAlarm(); reset(); start(); return; }
    var prev = copy(t);
    reset();
    showMsg('Timer reset.', prev);
  });
  el.close.addEventListener('click', clear);
  el.undo.addEventListener('click', function () {
    if (undoState) restore(undoState);
    el.go.focus();
  });
  // Any touch on the bar silences a ringing alarm
  el.bar.addEventListener('pointerdown', stopAlarm);

  // A finger that moved was scrolling the table, not tapping a time
  var downAt = null, moved = false;
  var panels = document.querySelector('.panels');
  panels.addEventListener('pointerdown', function (e) { downAt = [e.clientX, e.clientY]; moved = false; });
  panels.addEventListener('pointerup', function (e) {
    if (downAt) moved = Math.abs(e.clientX - downAt[0]) > 10 || Math.abs(e.clientY - downAt[1]) > 10;
    downAt = null;
  });

  // One click on a hold time starts its timer. Clicking another while one is
  // counting keeps whichever finishes sooner: a shorter hold takes over from now
  // (36 min at 135°F, then 140°F two minutes in: 34 min left becomes 12 min),
  // with Undo for a few seconds; a longer one leaves the current count alone.
  panels.addEventListener('click', function (e) {
    var b = e.target.closest('.pick');
    if (!b) return;
    if (moved) { moved = false; return; }
    var p = { id: b.dataset.id, f: +b.dataset.f, sec: +b.dataset.sec, food: b.dataset.food };
    if (t && (t.state === 'running' || t.state === 'paused')) {
      if (t.id === p.id) return;
      var rem = left();
      if (p.sec < rem) {
        var prev = copy(t);
        t.id = p.id; t.f = p.f; t.food = p.food; t.sec = p.sec;
        if (t.state === 'running') t.endAt = Date.now() + p.sec * 1000;
        else t.left = p.sec;
        save();
        markPicked();
        showMsg('Switched from ' + tempText(prev.f) + ' (' + clock(rem) + ' left).', prev);
      } else {
        showMsg('Kept current timer: ' + clock(rem) + ' left is shorter than ' + durWords(p.sec) + '.', null, 4000);
      }
      return;
    }
    stopAlarm();
    hideMsg();
    load(p);
    start();
  });

  // ---------- Alarm, wake lock ----------

  function unlockAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audio) { try { audio = new AC(); } catch (e) { return; } }
    if (audio.state === 'suspended') audio.resume();
  }

  // Three two-note chimes
  function chime() {
    if (!audio) return;
    var now = audio.currentTime;
    for (var i = 0; i < 3; i++) {
      [880, 1320].forEach(function (freq, j) {
        var at = now + i * 0.9 + j * 0.18;
        var osc = audio.createOscillator(), g = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
        osc.connect(g).connect(audio.destination);
        osc.start(at);
        osc.stop(at + 0.65);
      });
    }
  }

  // Like a kitchen timer: rings every 10 s until the bar is touched, for up to 2 minutes
  function startAlarm() {
    stopAlarm();
    var rings = 0;
    var ring = function () {
      chime();
      if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
      if (++rings >= 12) stopAlarm();
    };
    ring();
    alarm = setInterval(ring, 10000);
    el.bar.classList.add('is-ringing');
  }
  function stopAlarm() {
    clearInterval(alarm);
    alarm = null;
    el.bar.classList.remove('is-ringing');
  }

  // Keep a phone's screen on while a timer counts, where the browser allows it
  function keepAwake(on) {
    if (!('wakeLock' in navigator)) return;
    if (on && !wakeLock && document.visibilityState === 'visible') {
      try {
        navigator.wakeLock.request('screen').then(function (lock) {
          wakeLock = lock;
          lock.addEventListener('release', function () { wakeLock = null; });
        }).catch(function () {});
      } catch (e) {} // some browsers throw outright (e.g. inside an iframe)
    } else if (!on && wakeLock) {
      wakeLock.release().catch(function () {});
      wakeLock = null;
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !t) return;
    if (t.state === 'running' && left() <= 0) finish(true);
    else { if (t.state === 'running') keepAwake(true); paint(); }
  });
  window.addEventListener('resize', function () { if (t) paint(); });

  // Another tab changed the timer: follow it, so two open tabs never disagree
  window.addEventListener('storage', function (e) {
    if (e.key !== 'pasteurTimer') return;
    t = readStored();
    if (!t || t.state !== 'done') stopAlarm();
    run();
    markPicked();
    paint();
  });

  // ---------- Go ----------

  render();
  showTable(table, !!linkedCell);
  if (t && t.state === 'running' && left() <= 0) finish(false);
  run();
  paint();
  if (linkedCell) {
    var cell = document.getElementById(linkedCell);
    if (cell) {
      cell.scrollIntoView({ block: 'center' });
      cell.focus({ preventScroll: true });
    }
  }
})();

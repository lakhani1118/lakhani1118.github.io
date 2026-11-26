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
    // With hours shown, an empty minute slot reads "0m", so "1h 0m 40s" can't be mistaken for 1:40
    var mins = p.m || (p.h && p.s ? '0' : 0);
    return '<span class="dur">' + slot('h', p.h, 'h') + slot('m', mins, 'm') + slot('s', p.s, 's') + '</span>';
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

  // "just now", "4 min ago", "1 h 12 min ago"
  function ago(ms) {
    var min = Math.floor((Date.now() - ms) / 60000);
    if (min < 1) return 'just now';
    return durWords(min * 60) + ' ago';
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

  // ---------- Timer state ----------
  // t = { id, f, food, sec, state: running|done, endAt, startedAt, doneAt }
  // Time left is worked out from endAt (a wall-clock timestamp), so the count
  // stays right when the tab is in the background or the page is reloaded.

  var t = null;

  function readStored() {
    var v = null;
    try { v = JSON.parse(store.get('pasteurTimer')); } catch (e) { v = null; }
    if (!v || typeof v.sec !== 'number' || !v.state) return null;
    // Timers saved by the older version of this page (with Pause and Reset)
    if (v.state === 'paused') { v.state = 'running'; v.endAt = Date.now() + (v.left || 0) * 1000; }
    if (v.state === 'idle') return null;
    return v;
  }
  t = readStored();

  function tableOf(id) { return id ? id.split('-')[0] : null; }

  // ---------- Tabs ----------
  // The hash picks the table (#meat, #poultry) or a single cell (#poultry-142-low),
  // so a link can point a friend at the exact time you use. With no hash, the
  // page opens on the running timer's table, so its cell is in view.

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs button'));
  var hash = location.hash.slice(1);
  var linkedCell = /^(meat|poultry)-\d+/.test(hash) ? hash : null;
  var table = linkedCell ? tableOf(linkedCell) : hash;
  if (table !== 'meat' && table !== 'poultry') {
    table = (t && tableOf(t.id)) || (store.get('pasteurTable') === 'poultry' ? 'poultry' : 'meat');
  }

  function setHash(h) { try { history.replaceState(null, '', '#' + h); } catch (e) {} }

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
    if (!keepHash) setHash(name);
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

  var el = {
    bar: document.getElementById('timer'),
    food: document.getElementById('timer-food'),
    note: document.getElementById('timer-note'),
    clock: document.getElementById('timer-clock'),
    go: document.getElementById('timer-go'),
    close: document.getElementById('timer-close'),
    msg: document.getElementById('timer-msg'),
    msgText: document.getElementById('timer-msg-text'),
    act: document.getElementById('timer-act'),
    status: document.getElementById('timer-status'),
    main: document.getElementById('main')
  };
  var baseTitle = document.title;
  var tick = null, wakeLock = null, audio = null, alarm = null;
  var msgTimer = null, msgAction = null, askNotify = false;

  function save() { if (t) store.set('pasteurTimer', JSON.stringify(t)); else store.del('pasteurTimer'); }

  function left() {
    if (!t || t.state !== 'running') return 0;
    return Math.max(0, (t.endAt - Date.now()) / 1000);
  }

  function announce(text) { el.status.textContent = text; }

  function markPicked() {
    document.querySelectorAll('.pick').forEach(function (b) {
      b.setAttribute('aria-pressed', String(!!t && b.dataset.id === t.id));
    });
  }

  // A line along the bottom of the bar, optionally with one button (Notify me)
  function showMsg(text, action, ms) {
    clearTimeout(msgTimer);
    msgAction = action || null;
    el.msgText.textContent = text;
    el.act.hidden = !action;
    if (action) el.act.textContent = action.label;
    el.msg.hidden = false;
    paint();
    announce(text);
    msgTimer = setTimeout(hideMsg, ms || 8000);
  }
  function hideMsg() {
    clearTimeout(msgTimer);
    msgAction = null;
    el.msg.hidden = true;
    paint();
  }

  function paint() {
    if (!t) {
      el.bar.hidden = true;
      el.main.style.setProperty('--dock-h', '0px');
      document.title = baseTitle;
      return;
    }
    el.bar.hidden = false;
    el.food.textContent = t.food + ' · ' + tempText(t.f);

    if (t.state === 'running') {
      var rem = left();
      el.bar.dataset.state = 'running';
      el.clock.textContent = clock(rem);
      el.bar.style.setProperty('--done', String(t.sec ? 1 - rem / t.sec : 1));
      el.note.textContent = 'Done at ' + timeOfDay(t.endAt);
      el.go.hidden = true;
      el.close.hidden = false;
      document.title = clock(rem) + ' · ' + t.food;
    } else {
      el.bar.dataset.state = 'done';
      el.clock.textContent = 'Done';
      el.note.textContent = 'Hold complete · finished ' + timeOfDay(t.doneAt) +
        (Date.now() - t.doneAt >= 60000 ? ' (' + ago(t.doneAt) + ')' : '');
      el.go.hidden = false;
      el.close.hidden = true;
      document.title = 'Done · ' + baseTitle;
    }
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
      // Done: keep "(12 min ago)" current
      if (t && t.state === 'done') tick = setInterval(paint, 30000);
    }
  }

  function start(p) {
    unlockAudio();
    stopAlarm();
    hideMsg();
    t = { id: p.id, f: p.f, food: p.food, sec: p.sec, state: 'running', startedAt: Date.now(), endAt: Date.now() + p.sec * 1000 };
    setHash(p.id); // the address bar now links to this exact time, ready to share
    save();
    run();
    markPicked();
    paint();
    announce('Timer started for ' + p.food + ' at ' + tempText(p.f) + '. Done at ' + timeOfDay(t.endAt) + '.');
  }

  function finish(live) {
    t.doneAt = t.endAt || Date.now();
    t.state = 'done';
    t.endAt = null;
    save();
    run();
    hideMsg();
    paint();
    announce('Done. ' + t.food + ' held at ' + tempText(t.f) + ' for ' + durWords(t.sec) + '.');
    if (!live) return; // finished while the page was closed: no alarm on load
    startAlarm();
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      try { new Notification('Hold complete', { body: t.food + ' · ' + tempText(t.f) + ' · ' + durWords(t.sec), icon: 'images/favicon_io/android-chrome-192x192.png' }); } catch (e) {}
    }
  }

  // × or Got it: the timer is gone and the bar closes
  function clear() {
    if (!t) return;
    var id = t.id;
    stopAlarm();
    t = null;
    save();
    run();
    markPicked();
    hideMsg();
    announce('Timer cleared.');
    // Keyboard focus lands back on the time that was running, not on the page
    var cell = document.getElementById(id);
    if (cell && !cell.closest('[inert]')) cell.focus({ preventScroll: true });
  }

  el.go.addEventListener('click', clear);
  el.close.addEventListener('click', clear);
  el.act.addEventListener('click', function () {
    var a = msgAction;
    if (a) a.fn();
    if (t) el.close.focus();
  });
  // Any touch on the bar silences a ringing alarm
  el.bar.addEventListener('pointerdown', stopAlarm);

  // The food line takes you back to the timer's cell in the table
  function goToCell(id) {
    var cell = document.getElementById(id);
    if (!cell) return;
    showTable(tableOf(id), true);
    setHash(id);
    cell.scrollIntoView({ block: 'center' });
    cell.focus({ preventScroll: true });
  }
  el.food.addEventListener('click', function () {
    if (t) goToCell(t.id);
  });

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
  // a longer one leaves the current count alone.
  panels.addEventListener('click', function (e) {
    var wasMoved = moved && e.detail !== 0; // keyboard clicks never count as scrolls
    moved = false;
    var b = e.target.closest('.pick');
    if (!b || wasMoved) return;
    clearLinked();
    var p = { id: b.dataset.id, f: +b.dataset.f, sec: +b.dataset.sec, food: b.dataset.food };
    if (t && t.state === 'running') {
      if (t.id === p.id) return;
      var rem = left();
      if (p.sec < rem) {
        var fromF = t.f;
        t.id = p.id; t.f = p.f; t.food = p.food; t.sec = p.sec;
        t.endAt = Date.now() + p.sec * 1000;
        setHash(p.id);
        save();
        markPicked();
        paint();
        announce('Switched from ' + tempText(fromF) + ' to ' + tempText(p.f) + ': ' + clock(p.sec) + ' left.'); // screen readers only
      } else {
        announce('Kept current timer: ' + clock(rem) + ' left is shorter than ' + clock(p.sec) + '.'); // screen readers only
        nudge(el.clock);
        nudge(document.getElementById(t.id));
      }
      return;
    }
    start(p);
  });

  // Kept: a quick gold pulse on the clock and the running cell, so the tap
  // visibly lands on the timer that is still counting
  function nudge(node) {
    if (!node) return;
    node.classList.remove('is-kept');
    void node.offsetWidth; // restart the animation on repeat taps
    node.classList.add('is-kept');
    clearTimeout(node.keptTimer);
    node.keptTimer = setTimeout(function () { node.classList.remove('is-kept'); }, 700);
  }

  // A cell opened from a shared link stays marked until the first tap anywhere
  function clearLinked() {
    document.querySelectorAll('.pick.is-linked').forEach(function (c) { c.classList.remove('is-linked'); });
  }

  // ---------- Alarm, notifications, wake lock ----------

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

  // Notifications are offered the first time you come back to the page with a
  // timer running: that's when you've learned you might be elsewhere when it ends.
  // (Browsers only show the permission prompt after a tap, so it's a button.)
  function maybeOfferNotify() {
    if (!askNotify || !t || t.state !== 'running') return;
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    askNotify = false;
    showMsg('Get a notification when the hold ends?', {
      label: 'Notify me',
      fn: function () {
        try { Notification.requestPermission(); } catch (e) {}
        hideMsg();
      }
    }, 15000);
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
    if (!t) return;
    if (document.visibilityState === 'hidden') {
      if (t.state === 'running') askNotify = true;
      return;
    }
    if (t.state === 'running' && left() <= 0) { finish(true); return; }
    if (t.state === 'running') keepAwake(true);
    paint();
    maybeOfferNotify();
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

  document.addEventListener('pointerdown', clearLinked);

  // ---------- Go ----------

  render();
  showTable(table, !!linkedCell);
  if (t && t.state === 'running' && left() <= 0) finish(false);
  run();
  paint();
  if (linkedCell) {
    var cell = document.getElementById(linkedCell);
    if (cell) {
      cell.classList.add('is-linked');
      cell.scrollIntoView({ block: 'center' });
      cell.focus({ preventScroll: true });
    }
  }
})();

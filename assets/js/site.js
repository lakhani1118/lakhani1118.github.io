(function () {
  'use strict';

  var nav = document.querySelector('.site-nav');
  var toggle = document.querySelector('.nav-toggle');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    var closeMenu = function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    document.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Tapping anywhere outside the nav closes the open menu.
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) {
        closeMenu();
      }
    });

    // Escape closes the open menu and returns focus to the button.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  // Scrollspy: mark the nav link for the section you're reading (aria-current),
  // which the CSS shows as a gold underline. Nothing is marked over the hero.
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var spySections = spyLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if (spyLinks.length && spySections.every(Boolean)) {
    var current = null;
    var updateSpy = function () {
      var line = 72 + window.innerHeight * 0.25; // just below the sticky nav
      var active = -1;
      spySections.forEach(function (sec, i) {
        if (sec.getBoundingClientRect().top <= line) { active = i; }
      });
      // At the very bottom, the last (short) section wins even if it can't reach the line
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        active = spySections.length - 1;
      }
      if (active === current) { return; }
      current = active;
      spyLinks.forEach(function (a, i) {
        if (i === active) { a.setAttribute('aria-current', 'location'); }
        else { a.removeAttribute('aria-current'); }
      });
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () { ticking = false; updateSpy(); });
      }
    }, { passive: true });
    window.addEventListener('resize', updateSpy);
    updateSpy();
  }

  var revealEls = document.querySelectorAll('.reveal, .timeline');
  if ('IntersectionObserver' in window && revealEls.length) {
    // Anything already in (or above) the first screen shows instantly, so
    // there's no blank gap or load-time animation. Only content further
    // down fades in as you scroll.
    var pending = [];
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('reveal-instant', 'is-visible');
      } else {
        pending.push(el);
      }
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    pending.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  var yearEl = document.querySelector('[data-year]');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  // Tells the inline failsafe in <head> that the script ran to the end.
  window.siteReady = true;
})();

// Counts the navbar brand down from the current year to Arnob's birth year (2002).
// The trailing year resolves into the handle "ArnobG2002" — a small, self-explaining
// micro-moment on page load. Respects prefers-reduced-motion.
(function () {
  var BIRTH_YEAR = 2002;
  var target = document.getElementById('demo');
  if (!target) {
    // The brand span hasn't been parsed yet because this script runs in <head>.
    // Defer until DOM is ready.
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  function run() {
    var el = document.getElementById('demo');
    if (!el) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      el.textContent = String(BIRTH_YEAR);
      return;
    }
    var current = new Date().getFullYear();
    el.textContent = String(current);
    var tick = setInterval(function () {
      current--;
      el.textContent = String(current);
      if (current <= BIRTH_YEAR) clearInterval(tick);
    }, 50);
  }
})();
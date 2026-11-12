(function () {
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
  var dotsEl = document.getElementById('dots');
  var prev = document.getElementById('prev'), next = document.getElementById('next');
  var cur = 0;

  function fit() {
    var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.setProperty('--s', s);
  }
  function go(n, push) {
    cur = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (el, i) {
      el.classList.toggle('active', i === cur);
      el.setAttribute('aria-hidden', i === cur ? 'false' : 'true');
    });
    Array.prototype.forEach.call(dotsEl.children, function (d, i) { d.classList.toggle('on', i === cur); });
    prev.disabled = cur === 0; next.disabled = cur === slides.length - 1;
    if (push !== false) history.replaceState(null, '', '#' + (cur + 1));
  }
  slides.forEach(function (_, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = i + 1; b.setAttribute('aria-label', '第 ' + (i + 1) + ' 頁');
    b.onclick = function () { go(i); };
    dotsEl.appendChild(b);
  });
  prev.onclick = function () { go(cur - 1); };
  next.onclick = function () { go(cur + 1); };
  document.addEventListener('keydown', function (e) {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].indexOf(e.key) > -1 && e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].indexOf(e.key) > -1) { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
    else if (e.key === 'f') { var d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen(); else if (document.exitFullscreen) document.exitFullscreen(); }
  });
  var x0 = null;
  document.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
  });
  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', function () { var n = parseInt(location.hash.slice(1), 10); if (n) go(n - 1, false); });
  fit();
  var n0 = parseInt(location.hash.slice(1), 10);
  go(n0 ? n0 - 1 : 0, false);
})();

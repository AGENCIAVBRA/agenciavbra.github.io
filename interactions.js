(function () {
  // Habilita o estado :active em toques no iOS Safari — sem isso, o feedback
  // de pointer-down definido no CSS não dispara em telas de toque.
  document.addEventListener('touchstart', function () {}, { passive: true });

  // ---------- menu mobile ----------
  var toggle = document.getElementById('menuToggle');
  var links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.setAttribute('aria-expanded', 'false');

    var setOpen = function (open) {
      links.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    toggle.addEventListener('click', function () {
      setOpen(!links.classList.contains('open'));
    });

    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  }

  // ---------- reveal no scroll ----------
  // A primeira <section> de cada página (o hero) já está visível no load,
  // então fica de fora do reveal — só o que está abaixo da dobra anima.
  var revealEls = document.querySelectorAll('main section:not(:first-of-type)');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  revealEls.forEach(function (el) { el.classList.add('reveal'); });

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
       }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  }
})();

// ---------- vídeos de case: pausa e som ----------
(function () {
  document.querySelectorAll('.cs-video').forEach(function (box) {
    var v = box.querySelector('video');
    var play = box.querySelector('.vc-play');
    var sound = box.querySelector('.vc-sound');
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.removeAttribute('autoplay'); v.pause(); }
    var sync = function () {
      if (play) { var p = v.paused; play.textContent = p ? 'Assistir' : 'Pausar'; play.setAttribute('aria-label', p ? 'Reproduzir vídeo' : 'Pausar vídeo'); }
      if (sound) { var m = v.muted; sound.textContent = m ? 'Ativar som' : 'Desativar som'; sound.setAttribute('aria-label', m ? 'Ativar som' : 'Desativar som'); }
    };
    if (play) play.addEventListener('click', function () { if (v.paused) { v.play(); } else { v.pause(); } });
    if (sound) sound.addEventListener('click', function () { v.muted = !v.muted; if (!v.muted && v.paused) v.play(); sync(); });
    v.addEventListener('play', sync); v.addEventListener('pause', sync); v.addEventListener('volumechange', sync);
    sync();
  });
})();

// ---------- vídeos secundários: só carregam e tocam quando entram na tela ----------
(function () {
  var vids = document.querySelectorAll('video[data-autoplay]');
  if (!vids.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { if (!v.dataset.userPaused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } }
      else if (!v.paused) { v.pause(); v.dataset.autoPaused = '1'; }
    });
  }, { threshold: 0.35 });
  vids.forEach(function (v) {
    v.addEventListener('pause', function () { if (!v.dataset.autoPaused && document.visibilityState === 'visible') v.dataset.userPaused = '1'; delete v.dataset.autoPaused; });
    v.addEventListener('play', function () { delete v.dataset.userPaused; });
    io.observe(v);
  });
})();

// ---------- cabeçalho: sombra só depois de rolar ----------
(function () {
  var hd = document.querySelector('header');
  if (!hd) return;
  var on = false;
  var check = function () {
    var s = window.scrollY > 8;
    if (s !== on) { on = s; hd.classList.toggle('is-scrolled', s); }
  };
  window.addEventListener('scroll', check, { passive: true });
  check();
})();

// ---------- clicar no próprio vídeo também pausa e retoma ----------
(function () {
  document.querySelectorAll('.cs-video video').forEach(function (v) {
    v.addEventListener('click', function () { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); } });
  });
})();

// ---------- abertura: botões trocam de cor nos trechos escuros do vídeo ----------
(function () {
  var box = document.querySelector('.hb-video[data-dark]');
  if (!box) return;
  var v = box.querySelector('video');
  var ranges = box.getAttribute('data-dark').split(',').map(function (r) { var p = r.split('-'); return [parseFloat(p[0]), parseFloat(p[1])]; });
  var update = function () {
    var t = v.currentTime, dark = false;
    for (var i = 0; i < ranges.length; i++) { if (t >= ranges[i][0] && t < ranges[i][1]) { dark = true; break; } }
    box.classList.toggle('is-on-dark', dark);
  };
  if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    var loop = function () { update(); v.requestVideoFrameCallback(loop); };
    v.requestVideoFrameCallback(loop);
  }
  v.addEventListener('timeupdate', update); v.addEventListener('seeked', update);
  update();
})();

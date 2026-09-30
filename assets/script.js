(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Métricas de uso (alimenta o painel em tempo real) ---------- */
  var METRICS_URL = 'https://uiqgrzdyhwiyhonbdowb.supabase.co/rest/v1/manual_eventos';
  var METRICS_KEY = 'sb_publishable_2kByb7whDkzUVfzj_QNYpQ_B--i3Bx9';
  function track(tipo, alvo) {
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    try {
      fetch(METRICS_URL, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: METRICS_KEY, Authorization: 'Bearer ' + METRICS_KEY, Prefer: 'return=minimal' },
        body: JSON.stringify({ tipo: tipo, alvo: String(alvo || '').slice(0, 200) })
      }).catch(function () {});
    } catch (e) {}
  }
  (function () {
    var seen = false;
    try { seen = sessionStorage.getItem('manual-acesso') === '1'; sessionStorage.setItem('manual-acesso', '1'); } catch (e) {}
    if (!seen) track('acesso', location.hostname);
  })();
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || !/^https?:/i.test(a.href) || a.hostname === location.hostname) return;
    track('link_clique', a.href.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''));
  });

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- Scroll progress + navbar compact state ---------- */
  var progressBar = document.getElementById('scrollProgress');
  var navbar = document.getElementById('navbar');
  var backToTop = document.getElementById('backToTop');
  var hudRoot = document.getElementById('hud');

  function onScroll() {
    var doc = document.documentElement;
    var scrollTop = window.scrollY || doc.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    progressBar.style.width = pct + '%';

    navbar.classList.toggle('is-scrolled', scrollTop > 12);
    backToTop.classList.toggle('is-visible', scrollTop > 700);
    hudRoot.classList.toggle('is-visible', scrollTop > 400);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Mobile drawer ---------- */
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var drawerCloseBtn = document.getElementById('drawerCloseBtn');
  var drawer = document.getElementById('mobileDrawer');

  function openDrawer() {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  hamburgerBtn.addEventListener('click', openDrawer);
  drawerCloseBtn.addEventListener('click', closeDrawer);
  drawer.querySelectorAll('a[data-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.querySelector(a.getAttribute('href'));
      closeDrawer();
      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        history.pushState(null, '', a.getAttribute('href'));
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  /* ---------- Active section indicator ---------- */
  var navLinks = document.querySelectorAll('a[data-nav]');
  var sections = Array.prototype.map.call(navLinks, function (a) {
    return document.querySelector(a.getAttribute('href'));
  }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = '#' + entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Scroll reveal ---------- */
  var revealTargets = document.querySelectorAll(
    '.card, .fronts-hub, .front, .bj-year, .value-card, .tip-card, .office-card, .step-panel, .section-head, .drive-game, .quiz'
  );
  revealTargets.forEach(function (el, i) {
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = prefersReducedMotion ? '0ms' : Math.min((i % 6) * 60, 300) + 'ms';
  });

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ================= PAINEL DO PILOTO (conquistas) =================
     Guardado só no navegador de quem visita (localStorage), apenas
     como conveniência: se o storage falhar, tudo continua funcionando. */
  var ACHIEVEMENTS = [
    { id: 'drive', title: 'Aqueceu os motores', desc: 'Completou o test drive Motorista ou Passageiro', href: '#test-drive', icon: 'i-flag' },
    { id: 'values', title: 'Conheceu os 5 valores', desc: 'Passou por todos os mantras', href: '#valores', icon: 'i-star' },
    { id: 'mantra', title: 'Descobriu seu mantra', desc: 'Fez o quiz "Qual mantra acelera você?"', href: '#seu-mantra', icon: 'i-spark' },
    { id: 'journey', title: 'Reconheceu a pista', desc: 'Conheceu as 5 etapas da jornada', href: '#jornada', icon: 'i-check' }
  ];
  var STORAGE_KEY = 'gogroup-painel-piloto-v1';
  var unlocked = {};
  try {
    var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved && typeof saved === 'object') unlocked = saved;
  } catch (e) { unlocked = {}; }

  var hudToggle = document.getElementById('hudToggle');
  var hudPanel = document.getElementById('hudPanel');
  var hudCount = document.querySelector('[data-hud-count]');
  var hudList = document.querySelector('[data-hud-list]');
  var hudMeter = document.querySelector('[data-hud-meter]');
  var hudSub = document.querySelector('[data-hud-sub]');
  var hudFinal = document.querySelector('[data-hud-final]');
  var toast = document.getElementById('toast');
  var toastTimer = null;

  function unlockedCount() {
    return ACHIEVEMENTS.filter(function (a) { return unlocked[a.id]; }).length;
  }

  function renderHud() {
    var n = unlockedCount();
    hudCount.textContent = n + '/' + ACHIEVEMENTS.length;
    hudToggle.setAttribute('aria-label', 'Painel do piloto: ' + n + ' de ' + ACHIEVEMENTS.length + ' conquistas');
    hudMeter.style.width = (n / ACHIEVEMENTS.length) * 100 + '%';
    hudList.innerHTML = '';
    ACHIEVEMENTS.forEach(function (a) {
      var done = !!unlocked[a.id];
      var li = document.createElement('li');
      li.className = 'hud-item' + (done ? ' is-done' : '');
      li.innerHTML =
        '<a href="' + a.href + '">' +
          '<span class="hud-item-icon"><svg class="icon" width="16" height="16"><use href="#' + (done ? a.icon : 'i-lock') + '"/></svg></span>' +
          '<span class="hud-item-text"><span class="hud-item-title">' + a.title + '</span>' +
          '<span class="hud-item-desc">' + (done ? 'Conquista desbloqueada' : a.desc) + '</span></span>' +
        '</a>';
      li.querySelector('a').addEventListener('click', function () { closeHud(); });
      hudList.appendChild(li);
    });
    var all = n === ACHIEVEMENTS.length;
    hudSub.textContent = all
      ? 'Bandeirada! Você conhece nossa cultura de ponta a ponta e está pronto(a) para a largada.'
      : 'Explore a página e desbloqueie as 4 conquistas.';
    hudFinal.hidden = !all;
  }

  function showToast(text) {
    toast.innerHTML = '<span class="toast-badge"><svg class="icon" width="16" height="16"><use href="#i-trophy"/></svg></span><span></span>';
    toast.lastChild.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3200);
  }

  function confetti() {
    if (prefersReducedMotion) return;
    var colors = ['#2659A5', '#E5381A', '#E61782', '#E5273C', '#D7D900', '#F8AE13', '#3DBFEF', '#FFFFFF', '#0A3D7A'];
    var wrap = document.createElement('div');
    wrap.className = 'confetti';
    wrap.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 90; i++) {
      var p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
      p.style.animationDuration = (1.8 + Math.random() * 1.6) + 's';
      p.style.animationDelay = Math.random() * 0.5 + 's';
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(function () { wrap.remove(); }, 4200);
  }

  function unlock(id) {
    if (unlocked[id]) return;
    unlocked[id] = true;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked)); } catch (e) { /* segue sem persistir */ }
    renderHud();
    var a = ACHIEVEMENTS.filter(function (x) { return x.id === id; })[0];
    if (unlockedCount() === ACHIEVEMENTS.length) {
      showToast('Bandeirada! Você completou o Painel do piloto.');
      confetti();
    } else {
      showToast('Conquista desbloqueada: ' + a.title);
    }
    hudToggle.classList.remove('is-pulse');
    void hudToggle.offsetWidth;
    hudToggle.classList.add('is-pulse');
  }

  function openHud() {
    hudPanel.hidden = false;
    hudRoot.classList.add('is-open');
    hudToggle.setAttribute('aria-expanded', 'true');
  }
  function closeHud() {
    hudPanel.hidden = true;
    hudRoot.classList.remove('is-open');
    hudToggle.setAttribute('aria-expanded', 'false');
  }
  hudToggle.addEventListener('click', function () { hudPanel.hidden ? openHud() : closeHud(); });
  document.querySelector('[data-hud-close]').addEventListener('click', function () { closeHud(); hudToggle.focus(); });
  document.querySelectorAll('[data-open-hud]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); openHud(); });
  });
  document.addEventListener('click', function (e) {
    if (!hudPanel.hidden && !document.getElementById('hud').contains(e.target)) closeHud();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !hudPanel.hidden) { closeHud(); hudToggle.focus(); }
  });
  renderHud();

  /* ---------- Journey stepper (tabs) + pista ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#stepperTabs [role="tab"]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var raceFill = document.querySelector('[data-race-fill]');
  var raceToken = document.querySelector('[data-race-token]');
  var raceCps = Array.prototype.slice.call(document.querySelectorAll('[data-race-cp]'));
  var stepNext = document.querySelector('[data-step-next]');
  var stepsSeen = {};

  function selectTab(index, focus) {
    tabs.forEach(function (t, i) {
      var active = i === index;
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
    if (focus) tabs[index].focus();

    // Checkpoints ficam em 10%, 30%, 50%, 70% e 90% da pista.
    var pos = 10 + index * 20;
    raceToken.style.left = pos + '%';
    raceFill.style.width = pos + '%';
    raceCps.forEach(function (cp, i) { cp.classList.toggle('is-passed', i <= index); });
    stepNext.hidden = index === tabs.length - 1;

    stepsSeen[index] = true;
    if (Object.keys(stepsSeen).length === tabs.length) unlock('journey');
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { selectTab(index, false); });
    tab.addEventListener('keydown', function (e) {
      var newIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') newIndex = (index + 1) % tabs.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') newIndex = (index - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') newIndex = 0;
      if (e.key === 'End') newIndex = tabs.length - 1;
      if (newIndex !== null) { e.preventDefault(); selectTab(newIndex, true); }
    });
  });
  stepNext.addEventListener('click', function () {
    var current = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    if (current < tabs.length - 1) selectTab(current + 1, true);
  });
  selectTab(0, false);

  /* ---------- Reusable carousel (testimonials + values) ---------- */
  function initCarousel(root) {
    var track = root.querySelector('[data-track]');
    var slides = Array.prototype.slice.call(track.children);
    var prevBtn = root.querySelector('[data-prev]');
    var nextBtn = root.querySelector('[data-next]');
    var dotsWrap = root.querySelector('[data-dots]');
    var indexLabel = root.querySelector('[data-index]');
    var dotLabel = root.getAttribute('data-dot-label') || 'Ir para item';
    var current = 0;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', dotLabel + ' ' + (i + 1));
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function goTo(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, si) { s.classList.toggle('is-active', si === current); });
      dots.forEach(function (d, di) { d.setAttribute('aria-selected', di === current ? 'true' : 'false'); });
      indexLabel.textContent = pad(current + 1) + ' / ' + pad(slides.length);
      root.dispatchEvent(new CustomEvent('carousel:change', { detail: { index: current, total: slides.length } }));
    }

    prevBtn.addEventListener('click', function () { goTo(current - 1); });
    nextBtn.addEventListener('click', function () { goTo(current + 1); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { goTo(current - 1); }
      if (e.key === 'ArrowRight') { goTo(current + 1); }
    });

    var touchStartX = null;
    track.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (touchStartX === null) return;
      var delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 40) { delta < 0 ? goTo(current + 1) : goTo(current - 1); }
      touchStartX = null;
    }, { passive: true });

    root.goToSlide = goTo;
    goTo(0);
  }

  var valuesCarousel = document.getElementById('valuesCarousel');
  var valuesSeen = { 0: true };
  valuesCarousel.addEventListener('carousel:change', function (e) {
    valuesSeen[e.detail.index] = true;
    if (Object.keys(valuesSeen).length === e.detail.total) unlock('values');
  });
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);

  /* ================= MANIFESTO: palavras acendem com o scroll ================= */
  var manifesto = document.getElementById('manifesto');
  if (manifesto && !prefersReducedMotion) {
    var words = [];
    manifesto.querySelectorAll('[data-manifesto] p').forEach(function (p) {
      var parts = p.textContent.trim().split(/\s+/);
      p.textContent = '';
      parts.forEach(function (w, i) {
        var span = document.createElement('span');
        span.className = 'w';
        span.textContent = w;
        p.appendChild(span);
        if (i < parts.length - 1) p.appendChild(document.createTextNode(' '));
        words.push(span);
      });
    });
    manifesto.classList.add('is-scrubbing');

    var ticking = false;
    function scrubManifesto() {
      ticking = false;
      var rect = manifesto.getBoundingClientRect();
      var vh = window.innerHeight;
      // Começa a acender quando o bloco entra bem na tela e termina um
      // pouco antes do fim do trecho "grudado" (sticky).
      var start = vh * 0.4;
      var span = start + Math.max(rect.height - vh, 0) * 0.85;
      var progress = (start - rect.top) / span;
      progress = Math.max(0, Math.min(1, progress));
      manifesto.style.setProperty('--p', progress.toFixed(3));
      var lit = Math.round(progress * words.length);
      words.forEach(function (w, i) { w.classList.toggle('is-lit', i < lit); });
    }
    document.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(scrubManifesto); }
    }, { passive: true });
    window.addEventListener('resize', scrubManifesto);
    scrubManifesto();
  }

  /* ================= TEST DRIVE: Motorista ou Passageiro? =================
     Todas as frases vêm literalmente do quadro "Motorista x Passageiro"
     do Deck de Cultura / Brandbook. */
  var MOTORISTA = [
    'Faz acontecer.',
    'Vê um problema e já pensa na solução.',
    'Puxa a barra pra cima, contagia o time.',
    'Quer crescer, quer fazer a empresa crescer.',
    'Gosta de desafios.',
    'Se pergunta toda semana: "O que eu movi?".',
    'Não espera ordem: age.',
    'Empurra o time pra frente.',
    'Erra, aprende e tenta de novo.',
    'Vibra com o impacto que gera.',
    'Não precisa de platéia para fazer o certo.'
  ];
  var PASSAGEIRO = [
    'Espera alguém dizer o que fazer.',
    'Reclama mais do que resolve.',
    'Foca no problema, não na solução.',
    'Usa frases como "isso não é comigo".',
    'Está no grupo, mas não no jogo.',
    'Acompanha a meta, mas não corre atrás dela.',
    'Dá opinião, mas não se compromete.',
    'Só reage, nunca inicia.',
    'Espera a empresa mudar, mas não muda nada em si.',
    'É ótimo em comentar, ruim em executar.'
  ];
  var ROUND = 10;

  var game = document.getElementById('driveGame');
  var screens = {};
  game.querySelectorAll('[data-drive-screen]').forEach(function (s) { screens[s.getAttribute('data-drive-screen')] = s; });
  var card = game.querySelector('[data-drive-card]');
  var statementEl = game.querySelector('[data-drive-statement]');
  var countEl = game.querySelector('[data-drive-count]');
  var feedbackEl = game.querySelector('[data-drive-feedback]');
  var fillEl = game.querySelector('[data-drive-fill]');
  var tokenEl = game.querySelector('[data-drive-token]');
  var stampPass = card.querySelector('.drive-stamp-pass');
  var stampDrive = card.querySelector('.drive-stamp-drive');
  var deck = [], idx = 0, score = 0, locked = false;

  statementEl.setAttribute('aria-live', 'polite');
  countEl.tabIndex = -1;
  var scoreTitle = screens.result.querySelector('.drive-result-score');
  scoreTitle.tabIndex = -1;

  function showScreen(name) {
    Object.keys(screens).forEach(function (k) { screens[k].hidden = k !== name; });
  }

  function setTrack(n) {
    // O capacete anda de 4% a 96% da pista para não cobrir os rótulos das pontas.
    var pct = 4 + (n / ROUND) * 92;
    fillEl.style.width = (n / ROUND) * 100 + '%';
    tokenEl.style.left = pct + '%';
  }

  function resetCard() {
    card.classList.remove('is-animating', 'is-dragging');
    card.style.transform = '';
    card.style.opacity = '';
    stampPass.style.opacity = 0;
    stampDrive.style.opacity = 0;
  }

  function renderCard() {
    resetCard();
    statementEl.textContent = deck[idx].text;
    countEl.textContent = 'Atitude ' + (idx + 1) + ' de ' + ROUND;
    card.classList.remove('is-enter');
    void card.offsetWidth;
    card.classList.add('is-enter');
  }

  function startGame() {
    track('jogo_iniciado', 'test_drive');
    var m = shuffle(MOTORISTA).slice(0, ROUND / 2).map(function (t) { return { text: t, type: 'motorista' }; });
    var p = shuffle(PASSAGEIRO).slice(0, ROUND / 2).map(function (t) { return { text: t, type: 'passageiro' }; });
    deck = shuffle(m.concat(p));
    idx = 0; score = 0; locked = false;
    feedbackEl.textContent = '';
    feedbackEl.className = 'drive-feedback';
    setTrack(0);
    showScreen('play');
    renderCard();
    countEl.focus({ preventScroll: true });
  }

  function answer(type) {
    if (locked || screens.play.hidden) return;
    locked = true;
    var item = deck[idx];
    var correct = type === item.type;
    if (correct) score++;

    feedbackEl.className = 'drive-feedback ' + (correct ? 'is-good' : 'is-bad');
    if (correct) {
      feedbackEl.textContent = item.type === 'motorista' ? 'Isso! Atitude de motorista.' : 'Exato, isso é coisa de passageiro.';
    } else {
      feedbackEl.textContent = item.type === 'motorista' ? 'Quase! Essa é atitude de motorista.' : 'Opa! Essa é coisa de passageiro.';
    }

    setTrack(score);
    if (!correct) {
      tokenEl.classList.remove('is-bump');
      void tokenEl.offsetWidth;
      tokenEl.classList.add('is-bump');
    }

    var dir = type === 'motorista' ? 1 : -1;
    (dir > 0 ? stampDrive : stampPass).style.opacity = 1;
    card.classList.add('is-animating');
    card.style.transform = 'translateX(' + dir * 115 + '%) rotate(' + dir * 14 + 'deg)';
    card.style.opacity = '0';

    setTimeout(function () {
      idx++;
      if (idx >= ROUND) { finishGame(); return; }
      renderCard();
      locked = false;
    }, prefersReducedMotion ? 350 : 650);
  }

  function finishGame() {
    resetCard();
    screens.result.querySelector('[data-drive-score]').textContent = score;
    var title;
    if (score === ROUND) title = 'Piloto campeão! Você reconhece um motorista de longe.';
    else if (score >= ROUND - 2) title = 'Pódio garantido! Você já pensa como motorista.';
    else title = 'Boa volta! Que tal reler as atitudes e tentar de novo?';
    screens.result.querySelector('[data-drive-result-title]').textContent = title;
    showScreen('result');
    scoreTitle.focus({ preventScroll: true });
    track('jogo_concluido', 'test_drive');
    unlock('drive');
  }

  game.querySelectorAll('[data-drive-start]').forEach(function (b) { b.addEventListener('click', startGame); });
  game.querySelectorAll('[data-drive-answer]').forEach(function (b) {
    b.addEventListener('click', function () { answer(b.getAttribute('data-drive-answer')); });
  });

  // Setas do teclado quando o jogo está na tela
  document.addEventListener('keydown', function (e) {
    if (screens.play.hidden || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    if (e.target.closest && e.target.closest('[data-carousel], [role="tablist"]')) return;
    var r = game.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    e.preventDefault();
    answer(e.key === 'ArrowRight' ? 'motorista' : 'passageiro');
  });

  // Arrastar o card (mouse ou toque), estilo "swipe"
  var dragStartX = null, dragDX = 0;
  card.addEventListener('pointerdown', function (e) {
    if (locked) return;
    dragStartX = e.clientX; dragDX = 0;
    card.classList.add('is-dragging');
    card.setPointerCapture(e.pointerId);
  });
  card.addEventListener('pointermove', function (e) {
    if (dragStartX === null) return;
    dragDX = e.clientX - dragStartX;
    card.style.transform = 'translateX(' + dragDX + 'px) rotate(' + dragDX / 18 + 'deg)';
    var k = Math.min(Math.abs(dragDX) / 90, 1);
    stampDrive.style.opacity = dragDX > 0 ? k : 0;
    stampPass.style.opacity = dragDX < 0 ? k : 0;
  });
  function endDrag() {
    if (dragStartX === null) return;
    dragStartX = null;
    card.classList.remove('is-dragging');
    if (Math.abs(dragDX) > 90) {
      answer(dragDX > 0 ? 'motorista' : 'passageiro');
    } else {
      card.classList.add('is-animating');
      card.style.transform = '';
      stampPass.style.opacity = 0;
      stampDrive.style.opacity = 0;
      setTimeout(function () { card.classList.remove('is-animating'); }, 320);
    }
  }
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', endDrag);

  /* ================= QUIZ: Qual mantra acelera você? =================
     As opções são frases do "Alto padrão" de cada mantra no Deck de
     Cultura. Índices seguem a ordem do carousel de valores:
     0 Ponta Firme, 1 Mente Aberta, 2 Time Campeão,
     3 Transparência Máxima, 4 Amor pelo Cliente. */
  var MANTRA_STATEMENTS = [
    [
      'Você cumpre prazos e compromissos, mesmo diante de obstáculos.',
      'Você entrega com qualidade e não deixa "pontas soltas".',
      'Você antecipa riscos, comunica atrasos com antecedência e propõe soluções.',
      'Você é confiável: se disse que vai fazer, o time pode contar.',
      'Você busca eficiência e disciplina no dia a dia.'
    ],
    [
      'Você ouve opiniões diferentes das suas sem interromper.',
      'Você valoriza diversidade de experiências e pontos de vista.',
      'Você muda de ideia quando novos dados ou fatos mostram um caminho melhor.',
      'Você incentiva o time a trazer sugestões e experimenta novas formas de fazer.',
      'Você busca aprendizado contínuo, mesmo fora da sua área de conforto.'
    ],
    [
      'Você se importa com o que é nosso.',
      'Você busca ajudar os setores a trabalharem em conjunto.',
      'Você sonha com a gente e empurra para que os sonhos se concretizem.',
      'Você pensa em trabalhar com os outros setores e não para os outros setores.',
      'Você entende que estamos todos no mesmo barco e rema para o barco ir para a frente.'
    ],
    [
      'Você diz para os seus pares e líderes o que pensa, com contexto.',
      'Você procura ser construtivo com os outros.',
      'Você procura ter empatia e escutar os outros.',
      'Você sempre busca agir rápido para comunicar o que pensa.',
      'Você não procura arrodeios para falar algo.'
    ],
    [
      'Você entende que o cliente é nosso chefe e que é nosso papel encantá-lo diariamente.',
      'Você acredita que os clientes mais exigentes são os melhores: eles sobem a nossa barra.',
      'Você procura, no seu dia a dia, impactar positivamente o cliente.',
      'Em suas decisões, você sempre leva em consideração a posição do cliente.',
      'Você ajuda a empresa a evoluir todo dia rumo à obsessão pelo cliente.'
    ]
  ];
  var PROMPTS = [
    'Num dia de trabalho, qual destas frases mais tem a sua cara?',
    'E destas aqui, qual descreve melhor o seu jeito?',
    'Qual destas atitudes você mais reconhece em você?',
    'Se o seu time te descrevesse, qual frase ele escolheria?',
    'Última volta: qual destas combina mais com você?'
  ];
  var LETTERS = ['A', 'B', 'C', 'D', 'E'];

  // Metadados de cada mantra lidos do próprio carousel de valores (mesma
  // fonte de verdade — e mantém as imagens embutidas no build de deploy).
  var mantras = Array.prototype.map.call(valuesCarousel.querySelectorAll('.value-card'), function (c) {
    var img = c.querySelector('.value-art');
    return {
      name: c.querySelector('h3').textContent,
      tag: c.querySelector('.value-tag').textContent,
      def: c.querySelector('.value-def').textContent,
      color: c.style.getPropertyValue('--mantra-color').trim(),
      art: img.getAttribute('src'),
      alt: img.getAttribute('alt')
    };
  });

  var quiz = document.getElementById('mantraQuiz');
  var quizPlay = quiz.querySelector('[data-quiz-screen="play"]');
  var quizResult = quiz.querySelector('[data-quiz-screen="result"]');
  var lapEl = quiz.querySelector('[data-quiz-lap]');
  var progressItems = Array.prototype.slice.call(quiz.querySelectorAll('[data-quiz-progress] li'));
  var promptEl = quiz.querySelector('[data-quiz-prompt]');
  var optionsEl = quiz.querySelector('[data-quiz-options]');
  var backBtn = quiz.querySelector('[data-quiz-back]');
  var resultName = quiz.querySelector('[data-quiz-result-name]');
  resultName.tabIndex = -1;
  var rounds = [], answers = [], round = 0, quizLocked = false, topMantra = 0;

  var quizTracked = false;
  function startQuiz() {
    quizTracked = false;
    rounds = PROMPTS.map(function (_, r) { return shuffle([0, 1, 2, 3, 4]).map(function (m) { return { m: m, text: MANTRA_STATEMENTS[m][r] }; }); });
    answers = []; round = 0; quizLocked = false;
    quizResult.hidden = true;
    quizPlay.hidden = false;
    renderRound(false);
  }

  function renderRound(focusFirst) {
    lapEl.textContent = 'Volta ' + (round + 1) + ' de ' + PROMPTS.length;
    progressItems.forEach(function (li, i) {
      li.className = i < round ? 'is-done' : (i === round ? 'is-current' : '');
    });
    promptEl.textContent = PROMPTS[round];
    optionsEl.innerHTML = '';
    rounds[round].forEach(function (opt, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-option';
      b.innerHTML = '<span class="quiz-option-key" aria-hidden="true">' + LETTERS[i] + '</span><span></span>';
      b.lastChild.textContent = opt.text;
      b.addEventListener('click', function () { pick(b, opt.m); });
      optionsEl.appendChild(b);
    });
    optionsEl.classList.remove('is-enter');
    void optionsEl.offsetWidth;
    optionsEl.classList.add('is-enter');
    backBtn.hidden = round === 0;
    if (focusFirst) optionsEl.firstChild.focus({ preventScroll: true });
  }

  function pick(btn, m) {
    if (quizLocked) return;
    quizLocked = true;
    if (round === 0 && !quizTracked) { quizTracked = true; track('jogo_iniciado', 'quiz_mantras'); }
    btn.classList.add('is-picked');
    answers[round] = m;
    setTimeout(function () {
      quizLocked = false;
      if (round < PROMPTS.length - 1) { round++; renderRound(true); }
      else showQuizResult();
    }, prefersReducedMotion ? 120 : 320);
  }

  backBtn.addEventListener('click', function () {
    if (round === 0) return;
    round--;
    answers.length = round;
    renderRound(true);
  });

  function showQuizResult() {
    var counts = [0, 0, 0, 0, 0];
    answers.forEach(function (m) { counts[m]++; });
    var max = Math.max.apply(null, counts);
    var leaders = [];
    counts.forEach(function (c, i) { if (c === max) leaders.push(i); });
    topMantra = leaders[0];
    var top = mantras[topMantra];

    quiz.querySelector('.quiz-result-kicker').textContent = leaders.length > 1 ? 'Você está dividido(a) entre' : 'Seu mantra-motor é';
    resultName.textContent = leaders.map(function (i) { return mantras[i].name; }).join(' + ');
    quiz.querySelector('[data-quiz-result-tag]').textContent = top.tag;
    quiz.querySelector('[data-quiz-result-def]').textContent = top.def;
    var artWrap = quiz.querySelector('[data-quiz-result-art-wrap]');
    artWrap.style.setProperty('--mantra-color', top.color);
    var art = quiz.querySelector('[data-quiz-result-art]');
    art.src = top.art;
    art.alt = top.alt;

    var bars = quiz.querySelector('[data-quiz-bars]');
    bars.innerHTML = '';
    counts.map(function (c, i) { return { c: c, i: i }; })
      .sort(function (a, b) { return b.c - a.c || a.i - b.i; })
      .forEach(function (row) {
        var li = document.createElement('li');
        li.className = 'quiz-bar';
        li.innerHTML = '<span></span><span class="quiz-bar-track"><span class="quiz-bar-fill"></span></span><span class="quiz-bar-n"></span>';
        li.firstChild.textContent = mantras[row.i].name;
        li.lastChild.textContent = row.c;
        li.setAttribute('aria-label', mantras[row.i].name + ': ' + row.c + ' de ' + PROMPTS.length + ' escolhas');
        var fill = li.querySelector('.quiz-bar-fill');
        fill.style.setProperty('--bar-color', mantras[row.i].color);
        bars.appendChild(li);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { fill.style.width = (row.c / PROMPTS.length) * 100 + '%'; });
        });
      });

    quizPlay.hidden = true;
    quizResult.hidden = false;
    resultName.focus({ preventScroll: true });
    track('jogo_concluido', 'quiz_mantras');
    unlock('mantra');
  }

  quiz.querySelector('[data-quiz-restart]').addEventListener('click', function () {
    startQuiz();
    optionsEl.firstChild.focus({ preventScroll: true });
  });
  quiz.querySelector('[data-quiz-see]').addEventListener('click', function () {
    valuesCarousel.goToSlide(topMantra);
    document.getElementById('valores').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
  startQuiz();

  /* ================= HERO: parallax suave com o mouse ================= */
  var heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    var layers = Array.prototype.slice.call(heroVisual.children).map(function (el, i) {
      return { el: el, depth: el.classList.contains('orbit') ? 6 : 10 + (i % 4) * 8 };
    });
    document.getElementById('hero').addEventListener('mousemove', function (e) {
      var r = heroVisual.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) / r.width;
      var y = (e.clientY - (r.top + r.height / 2)) / r.height;
      layers.forEach(function (l) { l.el.style.translate = (-x * l.depth).toFixed(1) + 'px ' + (-y * l.depth).toFixed(1) + 'px'; });
    });
  }
})();

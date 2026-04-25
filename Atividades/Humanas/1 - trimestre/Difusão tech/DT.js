'use strict';

/* ═══════════════════════════════════════════════════════════════
   UTILITIES — espelho do portfólio principal
═══════════════════════════════════════════════════════════════ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const debounce = (fn, ms = 100) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
const lerp = (a, b, n) => (1 - n) * a + n * b;
const isTouch = () => window.matchMedia('(hover: none)').matches;

/* ═══════════════════════════════════════════════════════════════
   SCROLL PROGRESS
═══════════════════════════════════════════════════════════════ */
const ScrollProgress = (() => {
  const bar = $('#scrollProgress');

  function update() {
    if (!bar) return;
    const doc    = document.documentElement;
    const scroll = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    bar.style.width = height > 0 ? `${(scroll / height) * 100}%` : '0%';
  }

  function init() {
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR
═══════════════════════════════════════════════════════════════ */
const Cursor = (() => {
  const cursor = $('#cursor');
  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  function tick() {
    rx = lerp(rx, mx, 0.12);
    ry = lerp(ry, my, 0.12);
    if (cursor) cursor.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(tick);
  }

  function init() {
    if (!cursor || isTouch()) return;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    document.addEventListener('mousedown', () => cursor.classList.add('is-clicking'));
    document.addEventListener('mouseup',   () => cursor.classList.remove('is-clicking'));

    $$('a, button, [role="button"], .act-card, .act-hab-card, .act-comp-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });

    tick();
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   NAVBAR — scroll state
═══════════════════════════════════════════════════════════════ */
const Navbar = (() => {
  const navbar = $('#navbar');

  function onScroll() {
    if (!navbar) return;
    navbar.classList.toggle('is-scrolled', window.scrollY > 50);
  }

  function init() {
    onScroll();
    window.addEventListener('scroll', debounce(onScroll, 40), { passive: true });
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL — IntersectionObserver
═══════════════════════════════════════════════════════════════ */
const Reveal = (() => {
  function init() {
    const els = $$('.reveal');
    if (!els.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => io.observe(el));
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   CARD HOVER — spotlight que segue o cursor
═══════════════════════════════════════════════════════════════ */
const CardSpotlight = (() => {
  function init() {
    if (isTouch()) return;

    $$('.act-card, .act-hab-card, .act-comp-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        card.style.setProperty('--spotlight-x', `${x}%`);
        card.style.setProperty('--spotlight-y', `${y}%`);
      });
    });
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   CARD TILT — leve inclinação 3D nos cards de habilidade
═══════════════════════════════════════════════════════════════ */
const CardTilt = (() => {
  const MAX_ROT = 6;
  const EASE_IN  = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EASE_OUT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

  function apply(card, e) {
    const rect = card.getBoundingClientRect();
    const nx = (e.clientX - rect.left)  / rect.width  * 2 - 1;
    const ny = (e.clientY - rect.top)   / rect.height * 2 - 1;
    card.style.transform =
      `perspective(800px) rotateX(${-ny * MAX_ROT}deg) rotateY(${nx * MAX_ROT}deg) scale(1.02)`;
  }

  function enter(card) {
    card.style.transition = `transform 80ms ${EASE_IN}, border-color var(--t-base), box-shadow var(--t-base)`;
  }

  function leave(card) {
    card.style.transition = `transform 600ms ${EASE_OUT}, border-color var(--t-base), box-shadow var(--t-base)`;
    card.style.transform = '';
  }

  function init() {
    if (isTouch()) return;
    $$('.act-hab-card').forEach(card => {
      card.addEventListener('mouseenter', ()  => enter(card));
      card.addEventListener('mousemove',  e   => apply(card, e));
      card.addEventListener('mouseleave', ()  => leave(card));
    });
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   MAGNETIC BUTTONS — leve pull magnético
═══════════════════════════════════════════════════════════════ */
const MagneticBtn = (() => {
  const STRENGTH = 0.3;

  function init() {
    if (isTouch()) return;

    $$('.js-magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width  / 2);
        const dy = e.clientY - (rect.top  + rect.height / 2);
        btn.style.transform = `translate(${dx * STRENGTH}px, ${dy * STRENGTH}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform  = '';
        btn.style.transition = 'transform 500ms cubic-bezier(0.34,1.56,0.64,1)';
        setTimeout(() => { btn.style.transition = ''; }, 500);
      });
    });
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   PARTÍCULAS — interação com mouse
═══════════════════════════════════════════════════════════════ */
const ParticleInteraction = (() => {
  function init() {
    if (isTouch()) return;

    const hero = $('.act-hero');
    const particles = $$('.charge-particle');
    if (!hero || !particles.length) return;

    hero.addEventListener('mousemove', debounce(e => {
      const rect = hero.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      particles.forEach(p => {
        const px = parseFloat(p.style.getPropertyValue('--x')) / 100 * rect.width;
        const py = parseFloat(p.style.getPropertyValue('--y')) / 100 * rect.height;
        const dx = mx - px;
        const dy = my - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          const force = (120 - dist) / 120;
          const ox = -(dx / dist) * force * 20;
          const oy = -(dy / dist) * force * 20;
          p.style.transform = `translate(${ox}px, ${oy}px)`;
        } else {
          p.style.transform = '';
        }
      });
    }, 20));

    hero.addEventListener('mouseleave', () => {
      particles.forEach(p => { p.style.transform = ''; });
    });
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   SMOOTH ANCHOR SCROLL
═══════════════════════════════════════════════════════════════ */
const SmoothScroll = (() => {
  function init() {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const navH = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--navbar-h'), 10
        ) || 62;
        const top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   STAGGER REVEAL — cards da grade de habilidades entram em cascata
═══════════════════════════════════════════════════════════════ */
const StaggerReveal = (() => {
  function init() {
    const grids = $$('.act-hab-grid, .act-bento, .act-tags-wrap');
    if (!grids.length) return;

    grids.forEach(grid => {
      const children = $$('.reveal', grid);
      // Os delays já estão no HTML via classes, mas garantimos visibilidade
      // se o IntersectionObserver do Reveal não capturou o pai primeiro
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            children.forEach((child, i) => {
              setTimeout(() => {
                child.classList.add('is-visible');
              }, i * 60);
            });
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.05 });

      io.observe(grid);
    });
  }
  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════════════ */
function init() {
  ScrollProgress.init();
  Cursor.init();
  Navbar.init();
  Reveal.init();
  CardSpotlight.init();
  CardTilt.init();
  MagneticBtn.init();
  ParticleInteraction.init();
  SmoothScroll.init();
  StaggerReveal.init();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();

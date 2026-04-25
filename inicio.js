'use strict';

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
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
    const scroll = doc.scrollTop  || document.body.scrollTop;
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
  let raf;

  function onMove(e) {
    mx = e.clientX;
    my = e.clientY;
  }

  function tick() {
    rx = lerp(rx, mx, 0.12);
    ry = lerp(ry, my, 0.12);
    if (cursor) cursor.style.transform = `translate(${rx}px,${ry}px)`;
    raf = requestAnimationFrame(tick);
  }

  function setHover(on) {
    cursor?.classList.toggle('is-hovering', on);
  }

  function setClick(on) {
    cursor?.classList.toggle('is-clicking', on);
  }

  function init() {
    if (!cursor || isTouch()) return;

    document.addEventListener('mousemove', onMove, { passive: true });

    document.addEventListener('mousedown', () => setClick(true));
    document.addEventListener('mouseup',   () => setClick(false));

    $$('a,button,[role="button"],.bento__card').forEach(el => {
      el.addEventListener('mouseenter', () => setHover(true));
      el.addEventListener('mouseleave', () => setHover(false));
    });

    tick();
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   NAVBAR — Scroll state + active link
═══════════════════════════════════════════════════════════════ */
const Navbar = (() => {
  const navbar = $('#navbar');
  const links  = $$('[data-nav]');

  function onScroll() {
    if (!navbar) return;
    navbar.classList.toggle('is-scrolled', window.scrollY > 50);

    const offset   = 140;
    const scrollY  = window.scrollY + offset;
    let   current  = null;

    for (const link of links) {
      const el = document.getElementById(link.dataset.nav);
      if (el && el.offsetTop <= scrollY) current = link;
    }

    links.forEach(l => l.classList.remove('is-active'));
    current?.classList.add('is-active');
  }

  function init() {
    onScroll();
    window.addEventListener('scroll', debounce(onScroll, 40), { passive: true });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   DROPDOWN
═══════════════════════════════════════════════════════════════ */
const Dropdown = (() => {
  const item = $('#techDropdownItem');
  const btn  = $('#techDropdownBtn');
  let closeTimer;

  const open  = () => { clearTimeout(closeTimer); item?.classList.add('is-open');    btn?.setAttribute('aria-expanded','true'); };
  const close = () => { closeTimer = setTimeout(() => { item?.classList.remove('is-open'); btn?.setAttribute('aria-expanded','false'); }, 140); };

  function init() {
    if (!item || !btn) return;

    btn.addEventListener('click',       e => { e.stopPropagation(); item.classList.contains('is-open') ? close() : open(); });
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', close);

    $$('.navbar__dropdown-item').forEach(a => a.addEventListener('click', close));
    document.addEventListener('click',   e => { if (!item.contains(e.target)) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('scroll', debounce(close, 60), { passive: true });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   MOBILE MENU
═══════════════════════════════════════════════════════════════ */
const MobileMenu = (() => {
  const btn  = $('#mobileMenuBtn');
  const menu = $('#mobileMenu');
  let open   = false;

  const show = () => {
    open = true;
    menu?.classList.add('is-open');
    btn?.classList.add('is-open');
    btn?.setAttribute('aria-expanded', 'true');
    menu?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const hide = () => {
    open = false;
    menu?.classList.remove('is-open');
    btn?.classList.remove('is-open');
    btn?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  function init() {
    if (!btn || !menu) return;
    btn.addEventListener('click', () => open ? hide() : show());
    $$('.navbar__mobile-link', menu).forEach(l => l.addEventListener('click', hide));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) hide(); });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   ACCORDION — smooth height animation
═══════════════════════════════════════════════════════════════ */
const Accordion = (() => {
  const DURATION = 340;
  const EASING   = 'cubic-bezier(0.16, 1, 0.3, 1)';

  function expand(accordion, panel, trigger) {
    panel.removeAttribute('hidden');
    panel.setAttribute('data-animating', '');
    panel.style.overflow = 'hidden';
    panel.style.height   = '0px';

    const target = panel.scrollHeight;

    const anim = panel.animate(
      [{ height: '0px' }, { height: `${target}px` }],
      { duration: DURATION, easing: EASING, fill: 'forwards' }
    );

    anim.onfinish = () => {
      panel.style.height   = '';
      panel.style.overflow = '';
      panel.removeAttribute('data-animating');
      anim.cancel();
    };

    accordion.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function collapse(accordion, panel, trigger) {
    panel.setAttribute('data-animating', '');
    panel.style.overflow = 'hidden';
    const current = panel.scrollHeight;

    const anim = panel.animate(
      [{ height: `${current}px` }, { height: '0px' }],
      { duration: DURATION - 40, easing: EASING, fill: 'forwards' }
    );

    anim.onfinish = () => {
      panel.setAttribute('hidden', '');
      panel.style.height   = '';
      panel.style.overflow = '';
      panel.removeAttribute('data-animating');
      anim.cancel();
    };

    accordion.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  function closeGroupSiblings(accordion) {
    const group = accordion.closest('[id$="-accordions"]') || accordion.parentElement;
    $$('[data-accordion]', group).forEach(sibling => {
      if (sibling === accordion) return;
      const t = $('[aria-expanded]', sibling);
      if (t?.getAttribute('aria-expanded') !== 'true') return;
      const p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) collapse(sibling, p, t);
    });
  }

  function init() {
    $$('[data-accordion]').forEach(accordion => {
      const trigger = $('[aria-expanded]', accordion);
      if (!trigger) return;
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;

      // Ensure all start closed
      panel.setAttribute('hidden', '');
      trigger.setAttribute('aria-expanded', 'false');

      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          collapse(accordion, panel, trigger);
        } else {
          closeGroupSiblings(accordion);
          expand(accordion, panel, trigger);
        }
      });

      trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); }
      });
    });
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
   SKILL BARS — trigger when visible
═══════════════════════════════════════════════════════════════ */
const SkillBars = (() => {
  function init() {
    const fills = $$('.skill-item__fill');
    if (!fills.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.animationPlayState = 'running';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });

    fills.forEach(f => { f.style.animationPlayState = 'paused'; io.observe(f); });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   STAT COUNTER — animate numbers on first view
═══════════════════════════════════════════════════════════════ */
const StatCounter = (() => {
  function countUp(el, target, duration = 800) {
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(ease * target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
  }

  function init() {
    const els = $$('[data-count]');
    if (!els.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          countUp(e.target, parseInt(e.target.dataset.count, 10));
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });

    els.forEach(el => io.observe(el));
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   BENTO SPOTLIGHT — mouse-tracked radial gradient
═══════════════════════════════════════════════════════════════ */
const BentoSpotlight = (() => {
  function init() {
    if (isTouch()) return;

    $$('.bento__card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mouse-x', '-9999px');
        card.style.setProperty('--mouse-y', '-9999px');
      });
    });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   MAGNETIC BUTTONS — subtle pull effect
═══════════════════════════════════════════════════════════════ */
const MagneticBtn = (() => {
  const STRENGTH = 0.3;

  function init() {
    if (isTouch()) return;

    $$('.js-magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const dx   = e.clientX - (rect.left + rect.width  / 2);
        const dy   = e.clientY - (rect.top  + rect.height / 2);
        btn.style.transform = `translate(${dx * STRENGTH}px, ${dy * STRENGTH}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform   = '';
        btn.style.transition  = `transform 500ms cubic-bezier(0.34,1.56,0.64,1)`;
        setTimeout(() => { btn.style.transition = ''; }, 500);
      });
    });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   CARD TILT — 3D tilt effect on bento cards
═══════════════════════════════════════════════════════════════ */
const CardTilt = (() => {
  const MAX_ROT  = 9;   // max degrees of rotation
  const SCALE    = 1.025; // subtle scale on hover
  const EASE_IN  = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EASE_OUT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

  function apply(card, e) {
    const rect = card.getBoundingClientRect();

    // Normalized position: -1 (left/top) to +1 (right/bottom)
    const nx = (e.clientX - rect.left)  / rect.width  * 2 - 1;
    const ny = (e.clientY - rect.top)   / rect.height * 2 - 1;

    // rotateX tilts on vertical axis (positive = top comes toward viewer)
    // rotateY tilts on horizontal axis (positive = right comes toward viewer)
    const rotX = -ny * MAX_ROT;
    const rotY =  nx * MAX_ROT;

    card.style.transform =
      `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${SCALE})`;

    // Update sheen position (percentage within card)
    const pctX = ((e.clientX - rect.left) / rect.width)  * 100;
    const pctY = ((e.clientY - rect.top)  / rect.height) * 100;
    card.style.setProperty('--tilt-x', `${pctX}%`);
    card.style.setProperty('--tilt-y', `${pctY}%`);
  }

  function enter(card) {
    card.classList.add('is-tilting');
    // Snap transition to fast for responsive feel on entry
    card.style.transition = `transform 80ms ${EASE_IN}, border-color var(--t-base), box-shadow var(--t-base)`;
  }

  function leave(card) {
    card.classList.remove('is-tilting');
    // Spring-back animation on exit
    card.style.transition = `transform 600ms ${EASE_OUT}, border-color var(--t-base), box-shadow var(--t-base)`;
    card.style.transform  = '';
    card.style.setProperty('--tilt-x', '50%');
    card.style.setProperty('--tilt-y', '50%');
  }

  function init() {
    if (isTouch()) return;

    $$('.bento__card').forEach(card => {
      card.addEventListener('mouseenter', ()  => enter(card));
      card.addEventListener('mousemove',  e   => apply(card, e));
      card.addEventListener('mouseleave', ()  => leave(card));
    });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════════
   SMOOTH ANCHOR SCROLL
═══════════════════════════════════════════════════════════════ */
const SmoothScroll = (() => {
  function init() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
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
   WIP MODAL — Portfolio Profissional em desenvolvimento
═══════════════════════════════════════════════════════════════ */
const WipModal = (() => {
  const modal    = $('#wipModal');
  const backdrop = $('#wipModalBackdrop');
  const closeBtn = $('#wipModalClose');
  const trigger  = $('#bento-portfolio');

  function open() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }

  function close() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    trigger?.focus();
  }

  function init() {
    if (!modal || !trigger) return;

    trigger.addEventListener('click', e => {
      e.preventDefault();
      open();
    });

    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
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
  Dropdown.init();
  MobileMenu.init();
  Accordion.init();
  Reveal.init();
  SkillBars.init();
  StatCounter.init();
  BentoSpotlight.init();
  CardTilt.init();
  MagneticBtn.init();
  SmoothScroll.init();
  WipModal.init();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();

/* ═══════════════════════════════════════════════════════════════
   HERO PARTICLES — canvas interativo com repulsão de cursor
═══════════════════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('heroParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    const wrap = canvas.parentElement;
    canvas.width  = wrap.offsetWidth;
    canvas.height = wrap.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Mouse tracking ---
  const mouse = { x: -9999, y: -9999 };
  const REPEL_RADIUS = 100;
  const REPEL_FORCE  = 5;

  canvas.parentElement.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.parentElement.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // --- Particles ---
  const VIOLET  = [139, 92, 246];
  const TEAL    = [34, 211, 238];
  const COUNT   = 90;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function makeParticle() {
    const color = Math.random() > 0.5 ? VIOLET : TEAL;
    return {
      x:    rand(0, canvas.width),
      y:    rand(0, canvas.height),
      ox:   0,
      oy:   0,
      vx:   rand(-0.3, 0.3),
      vy:   rand(-0.4, 0.1),
      r:    rand(1, 3.2),
      alpha: rand(0.3, 0.9),
      da:   rand(-0.006, 0.006),
      color,
    };
  }

  let particles = Array.from({ length: COUNT }, makeParticle);

  // --- Connection lines ---
  const CONNECT_DIST = 90;

  function drawLine(a, b, dist) {
    const t = 1 - dist / CONNECT_DIST;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(139,92,246,${t * 0.18})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // --- Floating orbs ---
  const ORBS = Array.from({ length: 4 }, (_, i) => ({
    cx: rand(0.2, 0.8),
    cy: rand(0.2, 0.8),
    r:  rand(40, 80),
    speed: rand(0.0008, 0.0016),
    phase: rand(0, Math.PI * 2),
    color: i % 2 === 0 ? VIOLET : TEAL,
  }));

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 1;

    // Draw orbs
    ORBS.forEach(o => {
      const cx = (o.cx + 0.12 * Math.sin(t * o.speed + o.phase)) * canvas.width;
      const cy = (o.cy + 0.12 * Math.cos(t * o.speed * 0.7 + o.phase)) * canvas.height;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r);
      grad.addColorStop(0, `rgba(${o.color.join(',')},0.13)`);
      grad.addColorStop(1, `rgba(${o.color.join(',')},0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, o.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // Update + draw particles
    particles.forEach((p, i) => {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0) {
        const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
        p.ox += (dx / dist) * force * REPEL_FORCE;
        p.oy += (dy / dist) * force * REPEL_FORCE;
      }

      p.ox *= 0.88;
      p.oy *= 0.88;

      p.x += p.vx + p.ox;
      p.y += p.vy + p.oy;

      p.alpha += p.da;
      if (p.alpha <= 0.1 || p.alpha >= 1) p.da *= -1;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      for (let j = i + 1; j < particles.length; j++) {
        const ddx = particles[j].x - p.x;
        const ddy = particles[j].y - p.y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < CONNECT_DIST) drawLine(p, particles[j], d);
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color.join(',')},${p.alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
})();

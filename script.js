/* ============================================
   BLOM SERVICE B.V. — Main Script (merged)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sections        = document.querySelectorAll('.page-section');
  const navLinks        = document.querySelectorAll('.main-nav a[data-link]');
  const allInternalLinks= document.querySelectorAll('a[data-link]');
  const mainNav         = document.querySelector('.main-nav');
  const navToggle       = document.querySelector('.nav-toggle');
  const navIndicator    = document.getElementById('nav-indicator');
  const routeLoader     = document.getElementById('route-loader');
  const heroBg          = document.getElementById('hero-bg');

  /* ── Counter animation ─────────────────────────────────────────────── */
  function animateCount(el, delay = 0) {
    if (el.dataset.counted === 'true') return;
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const suffix = el.dataset.suffix || '';
    el.dataset.counted = 'true';
    if (prefersReducedMotion) { el.textContent = target + suffix; return; }
    const duration = 1400;
    function begin() {
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(tick);
    }
    delay > 0 ? setTimeout(begin, delay) : begin();
  }

  const countEls = document.querySelectorAll('[data-count]');
  let countIO;
  function observeCounters(scopeEl) {
    const els = scopeEl ? scopeEl.querySelectorAll('[data-count]') : countEls;
    if (!els.length) return;
    if ('IntersectionObserver' in window) {
      if (!countIO) {
        countIO = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              animateCount(entry.target, entry.target.closest('.hero-stats') ? 650 : 0);
              countIO.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 });
      }
      els.forEach(el => countIO.observe(el));
    } else {
      els.forEach(el => animateCount(el));
    }
  }

  /* ── Nav indicator — works with 3-col centered header ─────────────── */
  function moveNavIndicator(immediate) {
    if (!navIndicator || !mainNav) return;
    const activeLink = mainNav.querySelector('a.active');
    if (!activeLink || window.innerWidth <= 760) {
      navIndicator.classList.remove('ready');
      return;
    }
    const navRect  = mainNav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const left  = linkRect.left - navRect.left;
    const width = linkRect.width;

    if (immediate) {
      navIndicator.style.transition = 'none';
      navIndicator.style.left  = left  + 'px';
      navIndicator.style.width = width + 'px';
      void navIndicator.offsetWidth;
      navIndicator.style.transition = '';
    } else {
      navIndicator.style.left  = left  + 'px';
      navIndicator.style.width = width + 'px';
    }
    requestAnimationFrame(() => navIndicator.classList.add('ready'));
  }

  /* ── Route loader bar ──────────────────────────────────────────────── */
  let loaderTimeout;
  function playRouteLoader() {
    if (!routeLoader || prefersReducedMotion) return;
    clearTimeout(loaderTimeout);
    routeLoader.classList.remove('done');
    routeLoader.classList.add('active');
    loaderTimeout = setTimeout(() => {
      routeLoader.classList.remove('active');
      routeLoader.classList.add('done');
    }, 360);
  }

  /* ── Show section ──────────────────────────────────────────────────── */
  function showSection(id, { scroll = true, isInitial = false } = {}) {
    if (!document.getElementById(id)) id = 'home';

    if (!isInitial) playRouteLoader();

    sections.forEach(sec => {
      const isActive = sec.id === id;
      sec.classList.toggle('active', isActive);
      // page transition
      if (isActive && !isInitial) {
        sec.classList.remove('is-entering');
        void sec.offsetHeight;
        sec.classList.add('is-entering');
      }
    });

    navLinks.forEach(link => {
      const target = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', target === id);
    });

    if (scroll && !isInitial) window.scrollTo({ top: 0, behavior: 'auto' });

    moveNavIndicator(isInitial);

    const activeSection = document.getElementById(id);
    if (activeSection) {
      const reveals = activeSection.querySelectorAll('.reveal');
      reveals.forEach(el => el.classList.remove('in'));
      requestAnimationFrame(() => setTimeout(() => initReveal(reveals), 30));
      observeCounters(activeSection);
    }

    // mobile CTA bar: hide on contact page
    const mobileCta = document.getElementById('mobile-cta-bar');
    if (mobileCta) mobileCta.style.display = id === 'contact' ? 'none' : '';
  }

  /* ── Routing ────────────────────────────────────────────────────────── */
  function routeFromHash(isInitial) {
    const id = (location.hash || '#home').replace('#', '');
    showSection(id, { isInitial: !!isInitial });
  }

  allInternalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      const id = href.replace('#', '') || 'home';
      if (location.hash !== `#${id}`) {
        try { history.pushState(null, '', `#${id}`); }
        catch (_) { location.hash = id; }
      }
      showSection(id);
      mainNav?.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  window.addEventListener('popstate', () => routeFromHash(false));
  window.addEventListener('resize',   () => moveNavIndicator(true));

  /* ── Mobile nav toggle ──────────────────────────────────────────────── */
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* ── FAQ accordion ──────────────────────────────────────────────────── */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      item.closest('.faq-list').querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ── Scroll reveal ──────────────────────────────────────────────────── */
  let io;
  function initReveal(targetEls) {
    const els = targetEls || document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      if (!io) {
        io = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      }
      els.forEach(el => io.observe(el));
    } else {
      els.forEach(el => el.classList.add('in'));
    }
  }

  /* ── Hero parallax ──────────────────────────────────────────────────── */
  if (!prefersReducedMotion && heroBg) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        heroBg.style.transform = `translateY(${window.scrollY * 0.18}px)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── Service filter ─────────────────────────────────────────────────── */
  const filterPills    = document.querySelectorAll('.filter-pill');
  const filterSections = document.querySelectorAll('.filter-section');
  const hazardDivider  = document.querySelector('.hazard-divider');

  if (filterPills.length) {
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const filter = pill.dataset.filter;
        filterPills.forEach(p => p.classList.toggle('active', p === pill));
        filterSections.forEach(sec => {
          const match = filter === 'all' || sec.dataset.category === filter;
          sec.toggleAttribute('data-hidden', !match);
          if (match) sec.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
        });
        if (hazardDivider) hazardDivider.toggleAttribute('data-hidden', filter !== 'all');
      });
    });
  }

  /* ── Contact form ───────────────────────────────────────────────────── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.getElementById('form-status');
      const required = contactForm.querySelectorAll('[required]');
      let valid = true;
      required.forEach(f => {
        if (!f.value.trim()) {
          valid = false;
          f.style.borderColor = 'var(--navy-accent)';
          f.addEventListener('input', () => f.style.borderColor = '', { once: true });
        }
      });
      if (!valid) {
        if (status) { status.textContent = 'Please fill in all required fields.'; status.className = 'form-status show'; }
        return;
      }

      const btn = contactForm.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      // EmailJS if configured, else simulate
      const ejsReady = typeof emailjs !== 'undefined' && typeof emailjs.sendForm === 'function';
      const svcId    = (contactForm.dataset.emailjsService  || '').replace('YOUR', '');
      const tplId    = (contactForm.dataset.emailjsTemplate || '').replace('YOUR', '');

      function done(ok) {
        const name = (contactForm.querySelector('#name') || {}).value || '';
        if (status) {
          status.textContent = ok
            ? `Thanks${name ? ', ' + name.split(' ')[0] : ''}. Request received — we'll confirm within one business day.`
            : 'Something went wrong. Please call +31 20 123 4567 directly.';
          status.className = 'form-status show';
        }
        if (ok) contactForm.reset();
        if (btn) { btn.disabled = false; btn.innerHTML = 'Send Request <span class="btn-arrow">→</span>'; }
      }

      if (ejsReady && svcId && tplId) {
        emailjs.sendForm(svcId, tplId, contactForm).then(() => done(true)).catch(() => done(false));
      } else {
        setTimeout(() => done(true), 700);
      }
    });
  }

  /* ── Sticky header shadow ────────────────────────────────────────────── */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.style.boxShadow = window.scrollY > 8 ? '0 4px 24px rgba(0,0,0,0.10)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Back to top ─────────────────────────────────────────────────────── */
  const backBtn = document.getElementById('back-to-top');
  if (backBtn) {
    window.addEventListener('scroll', () => {
      backBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── GDPR banner ─────────────────────────────────────────────────────── */
  const banner     = document.getElementById('gdpr-banner');
  const btnAccept  = document.getElementById('gdpr-accept');
  const btnDecline = document.getElementById('gdpr-decline');
  function dismissGdpr() {
    if (!banner) return;
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 400);
  }
  if (banner) {
    let consent = null;
    try { consent = localStorage.getItem('blom_cookie_consent'); } catch(_) {}
    if (!consent) setTimeout(() => banner.classList.add('visible'), 1400);
    else banner.remove();
    btnAccept?.addEventListener('click',  () => { try { localStorage.setItem('blom_cookie_consent', 'accepted'); } catch(_){} dismissGdpr(); });
    btnDecline?.addEventListener('click', () => { try { localStorage.setItem('blom_cookie_consent', 'declined'); } catch(_){} dismissGdpr(); });
  }

  /* ── Footer year ─────────────────────────────────────────────────────── */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── EmailJS: load after window load ─────────────────────────────────── */
  window.addEventListener('load', () => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = () => {
      if (typeof emailjs !== 'undefined') emailjs.init('YOUR_PUBLIC_KEY');
    };
    document.head.appendChild(s);
  });

  /* ── Initial boot ────────────────────────────────────────────────────── */
  routeFromHash(true);
  initReveal();
  observeCounters();

  // Safety fallback: if no section is visible after init, force home
  requestAnimationFrame(() => {
    const anyActive = document.querySelector('.page-section.active');
    if (!anyActive) {
      const home = document.getElementById('home');
      if (home) home.classList.add('active');
    }
  });

});

(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero video: pause when off-screen or when the user prefers reduced motion
  const video = document.querySelector('.hero__video');
  if (video) {
    if (reduceMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    } else {
      new IntersectionObserver(([entry]) => {
        entry.isIntersecting ? video.play().catch(() => {}) : video.pause();
      }).observe(video);
    }
  }

  // Tours: hovering / focusing a row swaps the section background to that row's photo
  const tours = [...document.querySelectorAll('.tour')];
  const bgs = [...document.querySelectorAll('.tours__bg img')];

  const activate = (index) => {
    tours.forEach((row, i) => {
      const on = i === index;
      row.classList.toggle('is-active', on);
      row.querySelector('.tour__btn').tabIndex = on ? 0 : -1;
    });
    bgs.forEach((img, i) => img.classList.toggle('is-active', i === index));
  };

  tours.forEach((row, i) => {
    row.addEventListener('mouseenter', () => activate(i));
    row.addEventListener('focusin', () => activate(i));
    row.addEventListener('click', () => activate(i)); // touch devices
  });

  if (matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    const rowIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) activate(tours.indexOf(entry.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    tours.forEach((row) => rowIO.observe(row));
  }

  // Season switch (visual state; summer content comes later)
  const seasonBtns = document.querySelectorAll('.season__btn');
  seasonBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      seasonBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    });
  });

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  // Final section: skier follows the cursor (and drifts with scroll), background moves against it
  const final = document.querySelector('.final');
  const skier = document.querySelector('.final__skier');
  const finalBg = document.querySelector('.final__bg img');
  if (final && skier && !reduceMotion) {
    const target = { x: 0, y: 0 };   // cursor offset, −1..1
    const cur = { x: 0, y: 0, s: 0 };
    let scrollShift = 0, running = false, visible = false;

    final.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = final.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
      start();
    });
    final.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; start(); });

    const readScroll = () => {
      const r = final.getBoundingClientRect();
      const p = (innerHeight - r.top) / (innerHeight + r.height); // 0..1 while visible
      scrollShift = (0.5 - Math.min(Math.max(p, 0), 1)) * 90;
    };
    addEventListener('scroll', () => { if (visible) { readScroll(); start(); } }, { passive: true });

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { readScroll(); start(); }
    }).observe(final);

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      cur.s += (scrollShift - cur.s) * 0.12;
      const k = innerWidth < 900 ? 0.5 : 1;
      skier.style.setProperty('--sx', `${(cur.x * 46 * k).toFixed(2)}px`);
      skier.style.setProperty('--sy', `${(cur.y * 30 * k + cur.s).toFixed(2)}px`);
      skier.style.setProperty('--sr', `${(cur.x * 3).toFixed(3)}deg`);
      if (finalBg) {
        finalBg.style.setProperty('--bx', `${(-cur.x * 14 * k).toFixed(2)}px`);
        finalBg.style.setProperty('--by', `${(-cur.y * 8 * k).toFixed(2)}px`);
      }
      const settled = Math.abs(target.x - cur.x) < 0.001 && Math.abs(target.y - cur.y) < 0.001 && Math.abs(scrollShift - cur.s) < 0.05;
      if (settled || !visible) { running = false; return; }
      requestAnimationFrame(tick);
    };
    function start() { if (!running) { running = true; requestAnimationFrame(tick); } }
  }

  // Mobile menu
  const burger = document.querySelector('.burger');
  const mnav = document.getElementById('mnav');
  if (burger && mnav) {
    const setMenu = (open) => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    };
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    mnav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }
})();

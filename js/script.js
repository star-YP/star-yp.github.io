/**
 * iOS Frosted Glass Personal Blog — Interactive Behaviors
 * Uses IIFE pattern, all code runs after DOMContentLoaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ==========================================================
     [0] CLICK PARTICLE EFFECT — must not be blocked by any other code
     ========================================================== */
  const clickParticles = document.getElementById('clickParticles');
  const phrase = ['天', '天', '开', '心'];
  let clickCount = 0;

  // Bind click particles directly to main + footer, bypassing APlayer
  function spawnParticle(e) {
    const tag = e.target.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA') return;
    clickCount++;
    const char = phrase[(clickCount - 1) % phrase.length];

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const span = document.createElement('span');
    span.style.position = 'fixed';
    span.style.left = e.clientX + 'px';
    span.style.top = e.clientY + 'px';
    span.style.fontSize = '2rem';
    span.style.fontWeight = '800';
    if (isDark) {
      span.style.color = '#c8e0ff';
      span.style.textShadow = '0 0 5px rgba(150,180,255,0.9), 0 0 15px rgba(150,180,255,0.6), 0 0 30px rgba(120,150,255,0.3), 0 0 60px rgba(100,120,255,0.15)';
    } else {
      span.style.color = '#a855f7';
      span.style.textShadow = '0 0 6px rgba(168,85,247,0.5), 0 0 16px rgba(168,85,247,0.25), 0 0 32px rgba(168,85,247,0.12)';
    }
    span.style.pointerEvents = 'none';
    span.style.userSelect = 'none';
    span.style.zIndex = '999999';
    span.style.opacity = '1';
    span.style.transform = 'translate(0, 0) scale(0.15) rotate(0deg)';
    span.style.transition = 'transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.45s ease-out';
    span.textContent = char;
    clickParticles.appendChild(span);

    // ── 3-stage random burst path ──
    // Stage 1: burst outward
    const a1 = Math.random() * Math.PI * 2;
    const d1 = 25 + Math.random() * 50;
    const x1 = Math.cos(a1) * d1;
    const y1 = Math.sin(a1) * d1;
    const r1 = (Math.random() - 0.5) * 50;

    // Stage 2: ricochet (72°–216° direction change)
    const a2 = a1 + Math.PI * (0.4 + Math.random() * 0.8);
    const d2 = d1 + 20 + Math.random() * 50;
    const x2 = Math.cos(a2) * d2;
    const y2 = Math.sin(a2) * d2;
    const r2 = (Math.random() - 0.5) * 100;

    // Stage 3: float away
    const a3 = a2 + Math.PI * (0.3 + Math.random() * 0.7);
    const d3 = d2 + 25 + Math.random() * 55;
    const x3 = Math.cos(a3) * d3;
    const y3 = Math.sin(a3) * d3;
    const r3 = (Math.random() - 0.5) * 180;

    // Trigger stage 1
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        span.style.transform = `translate(${x1}px, ${y1}px) scale(1.3) rotate(${r1}deg)`;
      });
    });

    // Trigger stage 2: ricochet
    setTimeout(() => {
      span.style.transform = `translate(${x2}px, ${y2}px) scale(0.95) rotate(${r2}deg)`;
      span.style.opacity = '0.6';
    }, 320);

    // Trigger stage 3: float away + vanish
    setTimeout(() => {
      span.style.transform = `translate(${x3}px, ${y3}px) scale(0.06) rotate(${r3}deg)`;
      span.style.opacity = '0';
    }, 680);

    setTimeout(() => { span.remove(); }, 1400);
  }

  document.addEventListener('click', spawnParticle);

  /* ==========================================================
     [1] DOM REFERENCES
     ========================================================== */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const scrollTopBtn = document.getElementById('scrollTop');
  const allNavLinks = document.querySelectorAll('.nav__link');
  const allRevealEls = document.querySelectorAll('.reveal');
  const allSections = document.querySelectorAll('section[id]');

  /* ==========================================================
     [2] SCROLL REVEAL ANIMATIONS (Intersection Observer)
     ========================================================== */
  // Exit early if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion && allRevealEls.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    allRevealEls.forEach((el) => revealObserver.observe(el));
  } else if (prefersReducedMotion) {
    // Show everything immediately
    allRevealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ==========================================================
     [3] NAV SLIDING GLASS INDICATOR
     ========================================================== */
  const navIndicator = document.getElementById('navIndicator');

  function updateIndicator() {
    const activeLink = document.querySelector('.nav__link--active');
    if (!activeLink || !navIndicator) return;

    const linkRect = activeLink.getBoundingClientRect();
    const navRect = navLinks.getBoundingClientRect();

    navIndicator.style.left = (linkRect.left - navRect.left) + 'px';
    navIndicator.style.width = linkRect.width + 'px';
  }

  // Position indicator on load
  updateIndicator();

  // Reposition on resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateIndicator, 100);
  });

  /* ==========================================================
     [4] ACTIVE NAV LINK HIGHLIGHTING (Intersection Observer)
     ========================================================== */
  let navClickLock = false;
  let navClickTimer = null;

  if (allSections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        if (navClickLock) return; // skip during programmatic scroll
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            allNavLinks.forEach((link) => {
              link.classList.toggle(
                'nav__link--active',
                link.getAttribute('href') === `#${id}`
              );
            });
            updateIndicator();
          }
        });
      },
      {
        threshold: 0.35,
        rootMargin: '-56px 0px -40% 0px',
      }
    );

    allSections.forEach((section) => sectionObserver.observe(section));
  }

  /* ==========================================================
     [5] NAV SCROLL EFFECT (Passive scroll listener)
     ========================================================== */
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;

        // Nav scrolled state
        nav.classList.toggle('nav--scrolled', scrollY > 50);

        // Scroll-to-top button visibility
        scrollTopBtn.classList.toggle('scroll-top--visible', scrollY > 600);

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ==========================================================
     [6] SMOOTH SCROLL FOR NAV LINKS
     ========================================================== */
  allNavLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        // Lock observer during programmatic scroll to avoid bouncing
        navClickLock = true;
        clearTimeout(navClickTimer);
        navClickTimer = setTimeout(() => { navClickLock = false; }, 1000);

        // Immediately activate the clicked link + move indicator
        allNavLinks.forEach((l) => l.classList.remove('nav__link--active'));
        link.classList.add('nav__link--active');
        updateIndicator();

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeMobileMenu();
      }
    });
  });

  /* ==========================================================
     [7] MOBILE NAV DRAWER
     ========================================================== */
  const navOverlay = document.getElementById('navOverlay');
  const drawerClose = document.getElementById('drawerClose');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      nav.classList.toggle('nav--open');
    });
  }

  // Close drawer on overlay or X button
  if (navOverlay) {
    navOverlay.addEventListener('click', closeMobileMenu);
  }
  if (drawerClose) {
    drawerClose.addEventListener('click', closeMobileMenu);
  }

  function closeMobileMenu() {
    nav.classList.remove('nav--open');
  }

  /* ==========================================================
     [8] SCROLL-TO-TOP BUTTON
     ========================================================== */
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ==========================================================
     [9] SMOOTH SCROLL FOR HERO CTA BUTTONS
     ========================================================== */
  document.querySelectorAll('.hero__cta[href^="#"]').forEach((cta) => {
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(cta.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ==========================================================
     [10] PHOTO DISPLAY (fixed image + drag to reposition)
     ========================================================== */
  const photoDisplay = document.getElementById('photoDisplay');
  const PHOTO_POS_KEY = 'blog_photo_position';

  if (photoDisplay) {
    const savedPos = localStorage.getItem(PHOTO_POS_KEY);
    if (savedPos) {
      photoDisplay.style.objectPosition = savedPos;
    }

    let dragging = false, startX, startY, startPosX, startPosY;

    function getPosPercent() {
      const pos = photoDisplay.style.objectPosition || '50% 50%';
      const parts = pos.split(' ');
      return { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
    }

    photoDisplay.addEventListener('pointerdown', (e) => {
      dragging = true;
      photoDisplay.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      const pos = getPosPercent();
      startPosX = pos.x;
      startPosY = pos.y;
      e.preventDefault();
      e.stopPropagation();
    });

    photoDisplay.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = (e.clientX - startX) / photoDisplay.offsetWidth * 100;
      const dy = (e.clientY - startY) / photoDisplay.offsetHeight * 100;
      const newX = Math.max(0, Math.min(100, startPosX + dx));
      const newY = Math.max(0, Math.min(100, startPosY + dy));
      photoDisplay.style.objectPosition = `${newX}% ${newY}%`;
    });

    photoDisplay.addEventListener('pointerup', () => {
      if (dragging) {
        dragging = false;
        localStorage.setItem(PHOTO_POS_KEY, photoDisplay.style.objectPosition);
      }
    });

    photoDisplay.addEventListener('pointercancel', () => {
      dragging = false;
    });
  }

  /* ==========================================================
     [11] MUSIC PLAYER
     ========================================================== */
  const playlist = typeof BLOG_PLAYLIST !== 'undefined' ? BLOG_PLAYLIST : [
    { title: '起风了', artist: '买辣椒也用券', id: '1330348068' },
    { title: '病变', artist: '鞠文娴', id: '543607345' },
  ];
  let currentTrack = playlist.length - 1; // start with last song

  const bgmAudio = document.getElementById('bgmAudio');
  const musicPlayer = document.getElementById('musicPlayer');
  const musicTitle = document.getElementById('musicTitle');
  const musicArtist = document.getElementById('musicArtist');
  const musicPlayBtn = document.getElementById('musicPlay');
  const musicPrevBtn = document.getElementById('musicPrev');
  const musicNextBtn = document.getElementById('musicNext');
  const musicLyricsBtn = document.getElementById('musicLyrics');
  const musicLyricsPanel = document.getElementById('musicLyricsPanel');
  const musicLyricsInner = document.getElementById('musicLyricsInner');
  const musicSeek = document.getElementById('musicSeek');
  const musicCurTime = document.getElementById('musicCurTime');
  const musicDurTime = document.getElementById('musicDurTime');

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  let lyricsData = [];
  let lyricsEls = [];

  function loadLyrics(title) {
    lyricsData = (typeof BLOG_LYRICS !== 'undefined' && BLOG_LYRICS[title])
      ? BLOG_LYRICS[title] : [];
    if (musicLyricsInner) {
      musicLyricsInner.innerHTML = lyricsData.map((_, i) =>
        `<span class="music-player__lyrics-line" data-idx="${i}">${_.l}</span>`
      ).join('');
      lyricsEls = Array.from(musicLyricsInner.querySelectorAll('.music-player__lyrics-line'));
    }
  }

  // Per-song lyric offset, persisted in localStorage
  function getOffsets() {
    try { return JSON.parse(localStorage.getItem('lyricsOffsets')) || {}; } catch { return {}; }
  }
  function saveOffset(song, val) {
    const o = getOffsets();
    o[song] = val;
    localStorage.setItem('lyricsOffsets', JSON.stringify(o));
  }
  function getOffset(song) {
    const defaults = { '起风了': 0, '病变': -0.3 };
    return getOffsets()[song] ?? defaults[song] ?? 0;
  }

  function syncLyrics() {
    if (!lyricsData.length || !lyricsEls.length) return;
    const offset = getOffset(musicTitle.textContent);
    const t = bgmAudio.currentTime + offset;
    let activeIdx = -1;
    for (let i = 0; i < lyricsData.length; i++) {
      if (lyricsData[i].t <= t) activeIdx = i;
      else break;
    }
    lyricsEls.forEach((el, i) => {
      el.classList.toggle('music-player__lyrics-line--active', i === activeIdx);
    });
  }

  function loadTrack(index) {
    const track = playlist[index];
    bgmAudio.src = `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`;
    bgmAudio.load();
    musicTitle.textContent = track.title;
    musicArtist.textContent = track.artist;
    loadLyrics(track.title);
    if (typeof updateOffsetDisplay === 'function') updateOffsetDisplay();
  }

  function togglePlay() {
    if (bgmAudio.paused) {
      bgmAudio.play().then(() => {
        musicPlayer.classList.add('music-player--playing');
      }).catch(() => {});
    } else {
      bgmAudio.pause();
      musicPlayer.classList.remove('music-player--playing');
    }
  }

  if (bgmAudio && musicPlayer) {
    // Restore saved music state from previous page
    const MUSIC_STATE_KEY = 'blog_music_state';
    let savedState = null;
    try { savedState = JSON.parse(localStorage.getItem(MUSIC_STATE_KEY)); } catch {}
    if (savedState && savedState.trackIdx !== undefined) {
      currentTrack = savedState.trackIdx;
      loadTrack(currentTrack);
      if (savedState.currentTime > 0) {
        bgmAudio.addEventListener('loadedmetadata', function seekOnce() {
          bgmAudio.currentTime = savedState.currentTime;
          bgmAudio.removeEventListener('loadedmetadata', seekOnce);
        });
      }
      if (savedState.playing) {
        bgmAudio.play().then(() => {
          musicPlayer.classList.add('music-player--playing');
        }).catch(() => {});
      }
      localStorage.removeItem(MUSIC_STATE_KEY);
    } else {
      loadTrack(currentTrack);
    }

    // Save state on page leave + periodically
    let lastSaveTime = 0;
    function saveMusicState() {
      try {
        localStorage.setItem(MUSIC_STATE_KEY, JSON.stringify({
          trackIdx: currentTrack,
          currentTime: bgmAudio.currentTime || 0,
          playing: !bgmAudio.paused
        }));
      } catch {}
    }
    window.addEventListener('beforeunload', saveMusicState);
    // Throttled save on timeupdate (every 3s)
    bgmAudio.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - lastSaveTime > 3000) { lastSaveTime = now; saveMusicState(); }
    });
    // Save on track change
    const origLoadTrack = loadTrack;
    loadTrack = function(idx) {
      origLoadTrack(idx);
      saveMusicState();
    };

    musicPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });

    musicPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
      loadTrack(currentTrack);
      bgmAudio.play().then(() => {
        musicPlayer.classList.add('music-player--playing');
      }).catch(() => {});
    });

    musicNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentTrack = (currentTrack + 1) % playlist.length;
      loadTrack(currentTrack);
      bgmAudio.play().then(() => {
        musicPlayer.classList.add('music-player--playing');
      }).catch(() => {});
    });

    // Lyrics toggle
    if (musicLyricsBtn && musicLyricsPanel) {
      musicLyricsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        musicLyricsPanel.classList.toggle('music-player__lyrics--open');
      });
    }

    // Lyrics offset tune buttons
    const lyricsSlower = document.getElementById('lyricsSlower');
    const lyricsFaster = document.getElementById('lyricsFaster');
    const lyricsOffsetVal = document.getElementById('lyricsOffsetVal');
    function updateOffsetDisplay() {
      if (lyricsOffsetVal) {
        const v = getOffset(musicTitle.textContent);
        lyricsOffsetVal.textContent = (v >= 0 ? '+' : '') + v.toFixed(1) + 's';
      }
    }
    updateOffsetDisplay();
    if (lyricsSlower) {
      lyricsSlower.addEventListener('click', (e) => {
        e.stopPropagation();
        const song = musicTitle.textContent;
        saveOffset(song, getOffset(song) + 0.1);
        updateOffsetDisplay();
      });
    }
    if (lyricsFaster) {
      lyricsFaster.addEventListener('click', (e) => {
        e.stopPropagation();
        const song = musicTitle.textContent;
        saveOffset(song, getOffset(song) - 0.1);
        updateOffsetDisplay();
      });
    }

    // Progress bar + time + lyrics sync
    bgmAudio.addEventListener('timeupdate', () => {
      syncLyrics();
      if (musicSeek && !musicSeek.matches(':active')) {
        musicSeek.value = bgmAudio.currentTime;
      }
      if (musicCurTime) musicCurTime.textContent = fmtTime(bgmAudio.currentTime);
    });
    bgmAudio.addEventListener('loadedmetadata', () => {
      if (musicSeek) musicSeek.max = bgmAudio.duration;
      if (musicDurTime) musicDurTime.textContent = fmtTime(bgmAudio.duration);
    });
    bgmAudio.addEventListener('durationchange', () => {
      if (musicSeek && bgmAudio.duration) musicSeek.max = bgmAudio.duration;
      if (musicDurTime) musicDurTime.textContent = fmtTime(bgmAudio.duration || 0);
    });
    if (musicSeek) {
      musicSeek.addEventListener('input', () => {
        bgmAudio.currentTime = musicSeek.value;
        if (musicCurTime) musicCurTime.textContent = fmtTime(bgmAudio.currentTime);
      });
    }
    bgmAudio.addEventListener('play', () => {
      musicPlayer.classList.add('music-player--playing');
    });
    bgmAudio.addEventListener('pause', () => {
      musicPlayer.classList.remove('music-player--playing');
    });
    bgmAudio.addEventListener('ended', () => {
      currentTrack = (currentTrack + 1) % playlist.length;
      loadTrack(currentTrack);
      bgmAudio.play().then(() => {
        musicPlayer.classList.add('music-player--playing');
      }).catch(() => {});
    });
  }

  /* ==========================================================
     [13] THEME TOGGLE (with sun↔moon animation)
     ========================================================== */
  const themeToggle = document.getElementById('themeToggle');
  const themeOverlay = document.getElementById('themeOverlay');
  const THEME_KEY = 'blog_theme';

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  // Restore theme on load
  setTheme(getTheme());

  if (themeToggle && themeOverlay) {
    themeToggle.addEventListener('click', () => {
      const current = getTheme();
      const target = current === 'dark' ? 'light' : 'dark';
      const isDark = target === 'dark';

      // Get button position
      const rect = themeToggle.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Calculate required radius to cover viewport (from center to farthest corner)
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const radius = Math.max(
        Math.hypot(cx, cy),
        Math.hypot(vw - cx, cy),
        Math.hypot(cx, vh - cy),
        Math.hypot(vw - cx, vh - cy)
      );

      // Setup overlay
      themeOverlay.className = 'theme-overlay';
      themeOverlay.classList.add('theme-overlay--active');
      themeOverlay.classList.add(isDark ? 'theme-overlay--to-dark' : 'theme-overlay--to-light');
      themeOverlay.style.width = radius * 2 + 'px';
      themeOverlay.style.height = radius * 2 + 'px';
      themeOverlay.style.left = (cx - radius) + 'px';
      themeOverlay.style.top = (cy - radius) + 'px';
      themeOverlay.style.transform = 'scale(1)';

      // At peak expansion, switch theme
      themeOverlay.addEventListener('transitionend', function handler(e) {
        if (e.propertyName === 'transform') {
          setTheme(target);
          // Start fade-out
          themeOverlay.classList.remove('theme-overlay--active');
          themeOverlay.classList.add('theme-overlay--done');

          themeOverlay.removeEventListener('transitionend', handler);

          // Clean up after fade-out
          setTimeout(() => {
            themeOverlay.className = 'theme-overlay';
            themeOverlay.style.transform = 'scale(0)';
          }, 600);
        }
      });
    });
  }

  /* ==========================================================
     [14] 3D TILT EFFECT (Medium glass cards only)
     ========================================================== */
  function isDarkMode() {
    return getTheme() === 'dark';
  }

  // All glass cards get 3D tilt — except nav/footer full-width bars
  const tiltCards = document.querySelectorAll('.glass--medium, .tilt-card');

  tiltCards.forEach((card) => {
    // Wrap card in perspective container
    const wrapper = document.createElement('div');
    wrapper.className = 'tilt-wrapper';

    // Preserve fixed positioning for elements like the music player
    const cardStyle = getComputedStyle(card);
    if (cardStyle.position === 'fixed') {
      wrapper.style.position = 'fixed';
      wrapper.style.bottom = cardStyle.bottom;
      wrapper.style.left = cardStyle.left;
      wrapper.style.zIndex = cardStyle.zIndex;
      card.style.position = 'relative';
      card.style.bottom = 'auto';
      card.style.left = 'auto';
    }

    card.parentNode.insertBefore(wrapper, card);
    wrapper.appendChild(card);

    // Inject glare overlay
    const glare = document.createElement('div');
    glare.className = 'tilt-glare';
    card.appendChild(glare);

    // Determine tilt intensity + glare intensity
    let maxTilt, lift, glareIntensity;
    if (card.matches('.hero__content')) {
      maxTilt = 10;
      lift = 10;
      glareIntensity = 'rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 40%, transparent 70%';
    } else {
      maxTilt = 6;
      lift = 5;
      glareIntensity = 'rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 40%, transparent 70%';
    }

    // Apply card-specific glare intensity
    glare.style.background = `radial-gradient(circle at var(--glare-x) var(--glare-y), ${glareIntensity})`;
    const darkGlare = 'rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 40%, transparent 70%';

    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xNorm = x / rect.width - 0.5;
      const yNorm = y / rect.height - 0.5;

      card.style.transition = 'none';
      card.style.transform =
        `rotateX(${-yNorm * maxTilt * 2}deg) rotateY(${xNorm * maxTilt * 2}deg) translateZ(${lift}px)`;

      const sx = -xNorm * 16;
      const sy = yNorm * 16;
      const dark = isDarkMode();
      if (dark) {
        card.style.boxShadow =
          `${sx}px ${sy}px 30px rgba(0,0,0,0.5),
           ${sx * 0.4}px ${sy * 0.4}px 8px rgba(0,0,0,0.3),
           inset 0 1px 0 rgba(255,255,255,0.05)`;
      } else {
        card.style.boxShadow =
          `${sx}px ${sy}px 30px rgba(0,0,0,0.12),
           ${sx * 0.4}px ${sy * 0.4}px 8px rgba(0,0,0,0.05),
           inset 0 1px 0 rgba(255,255,255,0.35)`;
      }

      // Apply theme-appropriate glare
      if (isDarkMode()) {
        glare.style.background = `radial-gradient(circle at var(--glare-x) var(--glare-y), ${darkGlare})`;
      } else {
        glare.style.background = `radial-gradient(circle at var(--glare-x) var(--glare-y), ${glareIntensity})`;
      }

      glare.classList.add('tilt-glare--active');
      glare.style.setProperty('--glare-x', (xNorm * 100 + 50) + '%');
      glare.style.setProperty('--glare-y', (yNorm * 100 + 50) + '%');
    });

    wrapper.addEventListener('mouseleave', () => {
      card.style.transition =
        'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.5s ease';
      card.style.transform = '';
      card.style.boxShadow = '';
      glare.classList.remove('tilt-glare--active');
    });
  });

  /* ==========================================================
     [15] PARTICLE STARFIELD (with mouse repulsion)
     ========================================================== */
  const particleCanvas = document.getElementById('particleBg');
  if (particleCanvas) {
    const ctx = particleCanvas.getContext('2d');
    const particles = [];
    const PARTICLE_COUNT = 100;
    const CONNECT_DIST = 130;
    const MAX_LINE_OPACITY = 0.38;
    const REPEL_RADIUS = 140;      // max distance for mouse repulsion
    const REPEL_STRENGTH = 0.8;    // how hard particles are pushed away
    const RETURN_SPEED = 0.02;     // how fast particles drift back to original velocity

    const mouse = { x: -9999, y: -9999, active: false };

    function resize() {
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Track mouse on document (canvas has pointer-events:none)
    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    });
    document.addEventListener('mouseleave', () => {
      mouse.active = false;
    });

    // Create particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const vx = (Math.random() - 0.5) * 0.3;
      const vy = (Math.random() - 0.5) * 0.3;
      particles.push({
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        r: 1.2 + Math.random() * 2.2,
        vx: vx,                         // current velocity
        vy: vy,
        homeVx: vx,                     // original velocity (to return to)
        homeVy: vy,
        opacity: 0.2 + Math.random() * 0.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.015,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

      // Lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * MAX_LINE_OPACITY;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(140, 160, 220, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pulse += p.pulseSpeed;
        const flicker = 0.7 + 0.3 * Math.sin(p.pulse);
        const alpha = p.opacity * flicker;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 200, 240, ${alpha})`;
        ctx.fill();

        if (p.opacity > 0.3) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160, 180, 230, ${alpha * 0.22})`;
          ctx.fill();
        }
      }

    }

    function update() {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repulsion — inverse square law (like magnets)
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < REPEL_RADIUS && dist > 0.1) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            const nx = dx / dist;  // normalized direction away from mouse
            const ny = dy / dist;
            p.vx += nx * force;
            p.vy += ny * force;

            // Speed cap
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const maxSpeed = 2.5;
            if (speed > maxSpeed) {
              p.vx = (p.vx / speed) * maxSpeed;
              p.vy = (p.vy / speed) * maxSpeed;
            }
          }
        }

        // Gradually return to original drift velocity
        p.vx += (p.homeVx - p.vx) * RETURN_SPEED;
        p.vy += (p.homeVy - p.vy) * RETURN_SPEED;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -10) p.x = particleCanvas.width + 10;
        if (p.x > particleCanvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = particleCanvas.height + 10;
        if (p.y > particleCanvas.height + 10) p.y = -10;
      }
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }

    loop();
  }

  /* ==========================================================
     [16] INITIAL STATE — Trigger scroll handler on load
     ========================================================== */
  // Dispatch initial scroll state in case page loads scrolled
  window.dispatchEvent(new Event('scroll'));

  /* ==========================================================
     [17] CUSTOM CURSOR — replaced with CSS-only approach
     ========================================================== */

  /* ==========================================================
     [18] SCROLL-TO-TOP PROGRESS RING
     ========================================================== */
  const ringFill = document.querySelector('.scroll-top__ring-fill');
  const RING_LEN = 131.95;
  function updateRing() {
    if (!ringFill) return;
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    ringFill.style.strokeDashoffset = RING_LEN * (1 - pct);
  }
  window.addEventListener('scroll', updateRing, { passive: true });
  updateRing();

  /* ==========================================================
     [19] FOOTER LIVE CLOCK
     ========================================================== */
  const footerClock = document.getElementById('footerClock');
  if (footerClock) {
    function tick() {
      const now = new Date();
      footerClock.textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ==========================================================
     [20] HERO TYPEWRITER TITLE
     ========================================================== */
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    const titleText = 'STAR-YP';
    let i = 0;
    function typeTitle() {
      if (i < titleText.length) {
        heroTitle.textContent += titleText[i];
        i++;
        setTimeout(typeTitle, 80);
      }
    }
    typeTitle();
  }

  /* ==========================================================
     [21] ROTATING QUOTES
     ========================================================== */
  const heroQuote = document.getElementById('heroQuote');
  if (heroQuote) {
    const quotes = [
      '万物皆有裂痕，那是光照进来的地方。',
      '你生而不可限量，你生而诚信善良。',
      '且视他人之疑目如盏盏鬼火，大胆去走你的夜路。',
      '每一个不曾起舞的日子，都是对生命的辜负。',
    ];
    let qi = 0, ci = 0, typing = true;
    const typeSpeed = 100, delSpeed = 50, pauseBetween = 3500;

    function quoteLoop() {
      if (typing) {
        if (ci < quotes[qi].length) {
          heroQuote.innerHTML = quotes[qi].substring(0, ci + 1) + '<span class="cursor-blink">|</span>';
          ci++;
          setTimeout(quoteLoop, typeSpeed);
        } else {
          typing = false;
          setTimeout(quoteLoop, pauseBetween);
        }
      } else {
        if (ci > 0) {
          ci--;
          heroQuote.innerHTML = quotes[qi].substring(0, ci) + '<span class="cursor-blink">|</span>';
          setTimeout(quoteLoop, delSpeed);
        } else {
          typing = true;
          qi = (qi + 1) % quotes.length;
          setTimeout(quoteLoop, 400);
        }
      }
    }
    quoteLoop();
  }

  /* ==========================================================
     [22] WEATHER WIDGET (Open-Meteo, free, no API key)
     ========================================================== */
  const weatherText = document.getElementById('weatherText');
  const navWeather = document.getElementById('navWeather');

  if (weatherText && navWeather) {
    function buildMarquee(code, temp) {
      const feel = temp >= 30 ? '穿凉快点～记得防晒  ·  '
        : temp >= 22 ? '短袖或薄衬衫就行  ·  '
        : temp >= 15 ? '披件薄外套刚好  ·  '
        : temp >= 8 ? '毛衣卫衣穿起来  ·  '
        : temp >= 0 ? '厚外套+围巾别忘了  ·  '
        : '羽绒服帽子手套走起  ·  ';
      const w = code === 0 ? '大晴天'
        : (code <= 3) ? '多云'
        : (code <= 48) ? '有雾，开车慢点'
        : (code <= 55) ? '飘小雨，带把伞'
        : (code <= 65) ? '下雨啦，别忘了伞'
        : (code <= 77) ? '下雪了，注意保暖'
        : (code <= 86) ? '阵雨，伞是必备'
        : '雷雨天别乱跑啦';
      let extra = '';
      if (code <= 3 && temp >= 22) extra = '  ·  涂好防晒再出门～';
      if (code >= 51 && code <= 65) extra += '  ·  雨天地滑慢点走～';
      return temp + '°  ' + w + '  ·  ' + feel + extra + '  ·  ';
    }

    function fetchWeather(lat, lon) {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`)
        .then(r => r.json())
        .then(data => {
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;
          const emoji = code === 0 ? '☀️' : (code <= 3 ? '⛅' : code <= 48 ? '🌫️' : code <= 65 ? '🌧️' : code <= 77 ? '❄️' : code <= 86 ? '🌦️' : '⛈️');
          weatherText.textContent = (emoji + '  ' + buildMarquee(code, temp)).repeat(2);
          navWeather.style.cursor = 'default';
          navWeather.classList.add('nav__weather--ready');
        })
        .catch(() => { weatherText.textContent = '再点我试试～'; });
    }

    navWeather.addEventListener('click', function getWeatherOnce() {
      function onPos(pos) { fetchWeather(pos.coords.latitude, pos.coords.longitude); }
      function onErr() { fetchWeather(22.54, 114.06); }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onPos, onErr);
      } else {
        onErr();
      }
    }, { once: true });
  }

  /* ==========================================================
     [23] POST OVERLAY (article panel, no page reload)
     ========================================================== */
  const postOverlay = document.getElementById('postOverlay');
  const postOverlayContent = document.getElementById('postOverlayContent');
  const postOverlayClose = document.getElementById('postOverlayClose');
  const postOverlayBackdrop = document.getElementById('postOverlayBackdrop');

  function openPost(post) {
    if (!postOverlay || !postOverlayContent) return;
    document.title = post.title + ' - star-yp\'s Blog';
    postOverlayContent.innerHTML = `
      ${post.cover ? `<img class="post-page__cover" src="${post.cover}" alt="">` : ''}
      <header class="post-page__header">
        <h1 class="post-page__title">${post.title}</h1>
        ${post.tags ? `<div class="post-page__tags">${post.tags.map(t => `<span class="post-page__tag">#${t}</span>`).join('')}</div>` : ''}
        <time class="post-page__date" datetime="${post.date}">${post.date}</time>
      </header>
      <div class="post-page__body">
        ${post.content.map(p => `<p>${p}</p>`).join('')}
      </div>
    `;
    postOverlay.classList.add('post-overlay--open');
    postOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('post-overlay-active');
    document.body.style.overflow = 'hidden';
    history.pushState({ postId: post.id }, '', '?post=' + post.id);
    // Scroll panel to top
    const panel = document.getElementById('postOverlayPanel');
    if (panel) panel.scrollTop = 0;
  }

  function closePost() {
    if (!postOverlay) return;
    postOverlay.classList.remove('post-overlay--open');
    postOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('post-overlay-active');
    document.body.style.overflow = '';
    document.title = 'star-yp\'s Blog';
    if (history.state && history.state.postId) {
      history.back();
    } else {
      history.replaceState(null, '', window.location.pathname);
    }
  }

  // Intercept clicks on post card links (mobile only: open overlay; desktop navigates to post.html)
  document.querySelectorAll('.post-card__body[href]').forEach(link => {
    link.addEventListener('click', function(e) {
      if (window.innerWidth > 640) return; // desktop: let the browser navigate to post.html
      const href = this.getAttribute('href');
      if (!href || !href.startsWith('post.html')) return;
      e.preventDefault();
      const params = new URLSearchParams(href.split('?')[1] || '');
      const id = params.get('id');
      const post = (typeof BLOG_POSTS !== 'undefined' ? BLOG_POSTS : []).find(p => p.id === id);
      if (post) openPost(post);
    });
  });

  // Close button + backdrop
  if (postOverlayClose) postOverlayClose.addEventListener('click', closePost);
  if (postOverlayBackdrop) postOverlayBackdrop.addEventListener('click', closePost);

  // ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && postOverlay && postOverlay.classList.contains('post-overlay--open')) {
      closePost();
    }
  });

  // Browser back button
  window.addEventListener('popstate', function(e) {
    if (postOverlay && postOverlay.classList.contains('post-overlay--open')) {
      if (e.state && e.state.postId) {
        // Navigate to different post or stay
        const post = (typeof BLOG_POSTS !== 'undefined' ? BLOG_POSTS : []).find(p => p.id === e.state.postId);
        if (post) openPost(post);
        else closePost();
      } else {
        closePost();
      }
    }
  });

  // On load: check for ?post=xxx in URL
  (function checkInitPost() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('post');
    if (id) {
      // Desktop: redirect to standalone post page
      if (window.innerWidth > 640) {
        window.location.replace('post.html?id=' + id);
        return;
      }
      // Mobile: open the overlay
      const post = (typeof BLOG_POSTS !== 'undefined' ? BLOG_POSTS : []).find(p => p.id === id);
      if (post) {
        // Replace state to avoid double back
        history.replaceState({ postId: post.id }, '', '?post=' + post.id);
        // Small delay for DOM ready
        if (document.readyState === 'loading') {
          window.addEventListener('DOMContentLoaded', () => openPost(post));
        } else {
          openPost(post);
        }
      }
    }
  })();

  /* ==========================================================
     [24] INITIAL STATE
     ========================================================== */
  window.dispatchEvent(new Event('scroll'));

});

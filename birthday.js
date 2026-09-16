/* ============================================================
   "A Little Something for You" — Main Application Logic
   ============================================================ */
import gsap from 'gsap';

// ─── Reduced Motion Check ───────────────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── DOM References ─────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const opening        = $('#opening');
const openingCanvas  = $('#opening-canvas');
const line1          = $('#line1');
const line2          = $('#line2');
const openingHeart   = $('#opening-heart');
const enterBtn       = $('#enter-btn');
const mainContent    = $('#main-content');
const heroHeart      = $('#hero-heart');
const heroHeartWrap  = $('#hero-heart-wrap');
const cursorParticles = $('#cursor-particles');
const complimentText = $('#compliment-text');
const complimentBtn  = $('#compliment-btn');
const bigHeart       = $('#big-heart');
const bigHeartWrap   = $('#big-heart-wrap');
const heartCountEl   = $('#heart-count');
const heartEasterEgg = $('#heart-easter-egg');
const secretBtn      = $('#secret-btn');
const secretReveal   = $('#secret-reveal');
const finaleCanvas   = $('#finale-canvas');
const replayBtn      = $('#replay-btn');
const musicToggle    = $('#music-toggle');

// ============================================================
// 1. STARFIELD RENDERER
// ============================================================
class Starfield {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.count = opts.count || 200;
    this.speed = opts.speed || 0;
    this.running = false;
    this.resize();
    this.init();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.w = this.canvas.width = rect.width * devicePixelRatio;
    this.h = this.canvas.height = rect.height * devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.screenW = rect.width;
    this.screenH = rect.height;
  }

  init() {
    this.stars = Array.from({ length: this.count }, () => ({
      x: Math.random() * this.screenW,
      y: Math.random() * this.screenH,
      r: Math.random() * 1.8 + 0.3,
      alpha: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.tick();
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  tick() {
    if (!this.running) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.screenW, this.screenH);

    const now = performance.now() * 0.001;

    for (const s of this.stars) {
      const twinkle = (Math.sin(now * s.twinkleSpeed * 10 + s.twinkleOffset) + 1) / 2;
      const a = 0.2 + twinkle * 0.8;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 210, 255, ${a * s.alpha})`;
      ctx.fill();

      // Subtle glow for larger stars
      if (s.r > 1.2) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 181, 253, ${a * 0.08})`;
        ctx.fill();
      }

      // Move if speed
      if (this.speed) {
        s.y += this.speed;
        if (s.y > this.screenH + 5) {
          s.y = -5;
          s.x = Math.random() * this.screenW;
        }
      }
    }

    this.raf = requestAnimationFrame(() => this.tick());
  }
}

// ============================================================
// 2. OPENING CINEMATIC
// ============================================================
function playOpening() {
  const stars = new Starfield(openingCanvas, { count: prefersReducedMotion ? 60 : 180 });
  stars.start();

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to(line1, {
    opacity: 1,
    duration: 1.5,
    delay: 0.8,
  })
  .to(openingHeart, {
    opacity: 1,
    scale: 1,
    duration: 1,
    delay: 0.3,
    onComplete: () => {
      if (!prefersReducedMotion) {
        gsap.to(openingHeart, {
          keyframes: [
            { scale: 1.18, duration: 0.3 },
            { scale: 1, duration: 0.3 },
            { scale: 1.1, duration: 0.25 },
            { scale: 1, duration: 0.25 },
          ],
          repeat: -1,
          repeatDelay: 1.2,
        });
      }
    },
  })
  .fromTo(openingHeart, { scale: 0.5 }, { scale: 1, duration: 0.8, ease: 'back.out(2)' }, '<')
  .to(line2, {
    opacity: 1,
    duration: 1.2,
    delay: 0.3,
  })
  .to(enterBtn, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    delay: 0.4,
  })
  .fromTo(enterBtn, { y: 20 }, { y: 0, duration: 0.8, ease: 'back.out(1.5)' }, '<');

  // Enter button click
  enterBtn.addEventListener('click', () => {
    const enterTl = gsap.timeline({
      onComplete: () => {
        stars.stop();
        opening.classList.add('hidden');
        mainContent.style.opacity = '1';
        gsap.from(mainContent, { opacity: 0, duration: 1, ease: 'power2.out' });
        setTimeout(() => {
          opening.style.display = 'none';
          initScrollReveal();
          showMusicToggle();
        }, 800);
      },
    });

    // Flash + zoom transition
    enterTl
      .to([line1, line2, openingHeart, enterBtn], {
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
      })
      .to(openingCanvas, {
        opacity: 0,
        duration: 0.8,
      }, '-=0.2')
      .to(opening, {
        backgroundColor: '#0a0a1a',
        duration: 0.3,
      }, '<');
  });
}

// ============================================================
// 3. MOUSE-REACTIVE HERO HEART
// ============================================================
function initHeroHeart() {
  if (prefersReducedMotion) return;

  document.addEventListener('mousemove', (e) => {
    const rect = heroHeartWrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = (e.clientX - cx) / (window.innerWidth / 2);
    const dy = (e.clientY - cy) / (window.innerHeight / 2);

    gsap.to(heroHeart, {
      rotateY: dx * 20,
      rotateX: -dy * 15,
      duration: 0.6,
      ease: 'power2.out',
    });
  });
}

// ============================================================
// 4. CURSOR PARTICLES
// ============================================================
function initCursorParticles() {
  if (prefersReducedMotion) return;
  // Only on non-touch devices
  if ('ontouchstart' in window) return;

  const colors = ['#ff6b9d', '#c4b5fd', '#ffb3d0', '#8b5cf6', '#fbbf24'];
  let throttle = 0;

  document.addEventListener('mousemove', (e) => {
    if (Date.now() - throttle < 50) return;
    throttle = Date.now();

    const particle = document.createElement('div');
    particle.className = 'cursor-particle';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 5 + 3;
    particle.style.cssText = `
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      box-shadow: 0 0 ${size * 2}px ${color};
    `;
    cursorParticles.appendChild(particle);

    gsap.to(particle, {
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 80 - 30,
      opacity: 0,
      scale: 0,
      duration: 0.8 + Math.random() * 0.4,
      ease: 'power2.out',
      onComplete: () => particle.remove(),
    });
  });
}

// ============================================================
// 5. TIMELINE FLIP CARDS
// ============================================================
function initFlipCards() {
  $$('.flip-card').forEach((card) => {
    const toggle = () => {
      card.classList.toggle('flipped');
      // Haptic feedback on mobile
      if (navigator.vibrate) navigator.vibrate(15);
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}

// ============================================================
// 6. COMPLIMENT GENERATOR
// ============================================================
const compliments = [
  "Your smile could probably fix a bad day.",
  "You make ordinary moments feel special.",
  "You have the kind of energy people remember.",
  "Honestly… you're pretty amazing.",
  "The world gets a little brighter when you walk in.",
  "You're the kind of person people write songs about.",
  "Your laugh is the best sound I've ever heard.",
  "You could make a rainy day feel cozy.",
  "You're proof that good things exist.",
  "Everything feels a little better when you're around.",
  "You have this way of making people feel like they matter.",
  "If kindness had a face, it would look a lot like yours.",
  "You're the kind of unforgettable that doesn't even try.",
  "Some people light up a room. You light up the whole building.",
  "You deserve every good thing that's coming your way.",
];

let complimentIndex = 0;
let shuffledCompliments = [...compliments].sort(() => Math.random() - 0.5);

function initComplimentGenerator() {
  complimentBtn.addEventListener('click', () => {
    if (complimentIndex >= shuffledCompliments.length) {
      shuffledCompliments = [...compliments].sort(() => Math.random() - 0.5);
      complimentIndex = 0;
    }

    const text = shuffledCompliments[complimentIndex++];

    // Animate out, change, animate in
    gsap.to(complimentText, {
      opacity: 0,
      y: -15,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        complimentText.textContent = text;
        complimentText.classList.add('visible');
        gsap.fromTo(complimentText,
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: 'back.out(1.5)',
          }
        );
      },
    });

    // Button micro-animation
    gsap.fromTo(complimentBtn, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });

    // Sparkle burst
    spawnSparkles(complimentBtn);
  });
}

function spawnSparkles(origin) {
  if (prefersReducedMotion) return;
  const rect = origin.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const emojis = ['✨', '💖', '🌸', '💫', '⭐'];

  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.cssText = `
      position: fixed;
      left: ${cx}px;
      top: ${cy}px;
      font-size: ${14 + Math.random() * 10}px;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(el);

    const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.5;
    const dist = 60 + Math.random() * 80;

    gsap.to(el, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 40,
      opacity: 0,
      scale: 0.3,
      rotation: Math.random() * 360,
      duration: 0.7 + Math.random() * 0.3,
      ease: 'power2.out',
      onComplete: () => el.remove(),
    });
  }
}

// ============================================================
// 7. INTERACTIVE HEART (TAP TO GROW)
// ============================================================
let heartCount = 0;
let heartScale = 1;
let heartParticlesCanvas;
let heartParticlesCtx;
let heartParticles = [];
let heartAnimRunning = false;

const easterEggMessages = [
  { count: 10, msg: "Aww, you're really going for it! 😊" },
  { count: 25, msg: "That's a LOT of love! 💕" },
  { count: 50, msg: "Okay okay… I think you've officially broken the heart counter 😂❤️" },
  { count: 75, msg: "You really don't give up, do you? 😂💗" },
  { count: 100, msg: "100 taps! You absolute legend! 👑❤️" },
];

function initInteractiveHeart() {
  const canvas = $('#heart-particles-canvas');
  heartParticlesCanvas = canvas;
  heartParticlesCtx = canvas.getContext('2d');
  resizeHeartCanvas();
  window.addEventListener('resize', resizeHeartCanvas);

  const tapHandler = (e) => {
    e.preventDefault();
    heartCount++;
    heartCountEl.textContent = heartCount;

    // Scale up (max 2x)
    heartScale = Math.min(2, 1 + heartCount * 0.012);
    gsap.to(bigHeart, {
      scale: heartScale,
      duration: 0.3,
      ease: 'back.out(3)',
    });

    // Quick pulse
    gsap.fromTo(bigHeart, { scale: heartScale * 0.85 }, {
      scale: heartScale,
      duration: 0.35,
      ease: 'back.out(4)',
    });

    // Spawn particles
    spawnHeartParticles(e);

    // Check easter eggs
    for (const egg of easterEggMessages) {
      if (heartCount === egg.count) {
        gsap.to(heartEasterEgg, {
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            heartEasterEgg.textContent = egg.msg;
            gsap.to(heartEasterEgg, { opacity: 1, duration: 0.6, ease: 'power2.out' });
          },
        });
        break;
      }
    }

    // Haptic
    if (navigator.vibrate) navigator.vibrate(10);
  };

  bigHeartWrap.addEventListener('click', tapHandler);
  bigHeartWrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      tapHandler(e);
    }
  });
}

function resizeHeartCanvas() {
  if (!heartParticlesCanvas) return;
  const section = $('#interactive-heart');
  const rect = section.getBoundingClientRect();
  heartParticlesCanvas.width = rect.width * devicePixelRatio;
  heartParticlesCanvas.height = rect.height * devicePixelRatio;
  heartParticlesCanvas.style.width = rect.width + 'px';
  heartParticlesCanvas.style.height = rect.height + 'px';
  heartParticlesCtx.scale(devicePixelRatio, devicePixelRatio);
}

function spawnHeartParticles(e) {
  if (prefersReducedMotion) return;

  const section = $('#interactive-heart');
  const sRect = section.getBoundingClientRect();
  const hRect = bigHeart.getBoundingClientRect();
  const cx = hRect.left + hRect.width / 2 - sRect.left;
  const cy = hRect.top + hRect.height / 2 - sRect.top;

  const hearts = ['❤️', '💕', '💖', '💗', '💓', '🩷', '🌸'];

  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    const emoji = hearts[Math.floor(Math.random() * hearts.length)];

    heartParticles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1,
      decay: 0.015 + Math.random() * 0.01,
      size: 14 + Math.random() * 14,
      emoji,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
    });
  }

  if (!heartAnimRunning) {
    heartAnimRunning = true;
    tickHeartParticles();
  }
}

function tickHeartParticles() {
  const ctx = heartParticlesCtx;
  const section = $('#interactive-heart');
  const rect = section.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  for (let i = heartParticles.length - 1; i >= 0; i--) {
    const p = heartParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08; // gravity
    p.vx *= 0.99;
    p.life -= p.decay;
    p.rotation += p.rotSpeed;

    if (p.life <= 0) {
      heartParticles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.font = `${p.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, 0, 0);
    ctx.restore();
  }

  if (heartParticles.length > 0) {
    requestAnimationFrame(tickHeartParticles);
  } else {
    heartAnimRunning = false;
  }
}

// ============================================================
// 8. SECRET MESSAGE REVEAL
// ============================================================
function initSecretMessage() {
  secretBtn.addEventListener('click', () => {
    // Button disappear
    gsap.to(secretBtn, {
      scale: 0.9,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        secretBtn.style.display = 'none';
        secretReveal.classList.add('active');

        // Stagger reveal text
        gsap.fromTo(
          secretReveal.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.4,
            ease: 'power3.out',
            delay: 0.3,
          }
        );

        // Sparkle around the reveal
        const rect = secretReveal.getBoundingClientRect();
        spawnRevealSparkles(rect);
      },
    });
  });
}

function spawnRevealSparkles(rect) {
  if (prefersReducedMotion) return;
  const sparkles = ['✨', '💫', '⭐', '🌟'];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('div');
    el.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
    const x = rect.left + Math.random() * rect.width;
    const y = rect.top + Math.random() * rect.height;
    el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      font-size: ${12 + Math.random() * 12}px;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
    `;
    document.body.appendChild(el);

    gsap.to(el, {
      opacity: 1,
      scale: 1.3,
      y: -30 - Math.random() * 40,
      duration: 0.6,
      delay: Math.random() * 0.8,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(el, {
          opacity: 0,
          y: '-=20',
          duration: 0.4,
          onComplete: () => el.remove(),
        });
      },
    });
  }
}

// ============================================================
// 9. FINALE SCENE
// ============================================================
let finaleStarfield;

function initFinale() {
  finaleStarfield = new Starfield(finaleCanvas, {
    count: prefersReducedMotion ? 60 : 150,
    speed: 0.15,
  });

  // Create floating petals
  if (!prefersReducedMotion) {
    const petals = ['🌸', '🏵️', '💮', '🪷', '🌺'];
    const finale = $('#finale');
    for (let i = 0; i < 10; i++) {
      const petal = document.createElement('div');
      petal.className = 'petal';
      petal.textContent = petals[Math.floor(Math.random() * petals.length)];
      petal.style.left = Math.random() * 100 + '%';
      petal.style.animationDuration = 8 + Math.random() * 12 + 's';
      petal.style.animationDelay = Math.random() * 10 + 's';
      petal.style.animation = `floatPetal ${8 + Math.random() * 12}s linear ${Math.random() * 10}s infinite`;
      finale.appendChild(petal);
    }
  }

  // Scroll-triggered finale text
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          finaleStarfield.start();
          animateFinaleText();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe($('#finale'));
}

function animateFinaleText() {
  const lines = $$('.finale-line');
  gsap.to(lines, {
    opacity: 1,
    y: 0,
    duration: 1.2,
    stagger: 0.6,
    ease: 'power3.out',
    onComplete: () => {
      gsap.to(replayBtn, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.5,
        ease: 'back.out(1.5)',
      });
    },
  });

  gsap.fromTo(lines, { y: 30 }, { y: 0, duration: 1.2, stagger: 0.6, ease: 'power3.out' });
  gsap.fromTo(replayBtn, { y: 20 }, { y: 0, duration: 0.8, delay: lines.length * 0.6 + 1.5, ease: 'back.out(1.5)' });
}

// ============================================================
// 10. REPLAY
// ============================================================
function initReplay() {
  replayBtn.addEventListener('click', () => {
    // Reset all state
    heartCount = 0;
    heartScale = 1;
    complimentIndex = 0;
    shuffledCompliments = [...compliments].sort(() => Math.random() - 0.5);

    // Reset DOM
    heartCountEl.textContent = '0';
    heartEasterEgg.textContent = '';
    heartEasterEgg.style.opacity = '0';
    complimentText.textContent = '';
    complimentText.classList.remove('visible');
    gsap.set(bigHeart, { scale: 1 });

    // Reset flip cards
    $$('.flip-card').forEach((c) => c.classList.remove('flipped'));

    // Reset secret
    secretBtn.style.display = '';
    gsap.set(secretBtn, { opacity: 1, scale: 1 });
    secretReveal.classList.remove('active');

    // Reset finale
    $$('.finale-line').forEach((l) => { l.style.opacity = '0'; });
    replayBtn.style.opacity = '0';

    // Reset reveal states
    $$('.reveal.visible').forEach((el) => el.classList.remove('visible'));

    // Scroll to top and replay opening
    if (finaleStarfield) finaleStarfield.stop();

    // Show opening again
    opening.style.display = '';
    opening.classList.remove('hidden');
    gsap.set(opening, { opacity: 1 });
    mainContent.style.opacity = '0';

    // Reset opening elements
    gsap.set([line1, line2, openingHeart, enterBtn], { opacity: 0 });
    gsap.set(openingCanvas, { opacity: 1 });

    window.scrollTo({ top: 0, behavior: 'instant' });

    setTimeout(() => playOpening(), 300);
  });
}

// ============================================================
// 11. SCROLL REVEAL
// ============================================================
function initScrollReveal() {
  const reveals = $$('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  reveals.forEach((el) => observer.observe(el));
}

// ============================================================
// 12. AMBIENT MUSIC (Web Audio API — never autoplays)
// ============================================================
let audioCtx;
let musicPlaying = false;
let musicNodes = [];

function showMusicToggle() {
  gsap.to(musicToggle, { opacity: 1, duration: 0.6, delay: 1 });
}

function initMusic() {
  musicToggle.addEventListener('click', () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (musicPlaying) {
      stopMusic();
    } else {
      playMusic();
    }
  });
}

function playMusic() {
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Create a soft ambient pad
  const now = audioCtx.currentTime;

  // Main pad — two detuned oscillators for warmth
  const notes = [220, 277.18, 329.63, 440]; // A3, C#4, E4, A4
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.06, now + 2);
  masterGain.connect(audioCtx.destination);

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle vibrato
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.3 + i * 0.1, now);
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(1.5, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(now);

    const noteGain = audioCtx.createGain();
    noteGain.gain.setValueAtTime(0.25, now);

    osc.connect(noteGain);
    noteGain.connect(masterGain);
    osc.start(now);

    musicNodes.push(osc, lfo);
  });

  musicNodes.push(masterGain);
  musicPlaying = true;
  musicToggle.classList.add('playing');
  musicToggle.textContent = '🎶';
}

function stopMusic() {
  const now = audioCtx.currentTime;

  // Find the gain node (last one pushed)
  const masterGain = musicNodes[musicNodes.length - 1];
  if (masterGain && masterGain.gain) {
    masterGain.gain.linearRampToValueAtTime(0, now + 1);
  }

  setTimeout(() => {
    musicNodes.forEach((node) => {
      try { node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    });
    musicNodes = [];
  }, 1200);

  musicPlaying = false;
  musicToggle.classList.remove('playing');
  musicToggle.textContent = '🎵';
}

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
  playOpening();
  initHeroHeart();
  initCursorParticles();
  initFlipCards();
  initComplimentGenerator();
  initInteractiveHeart();
  initSecretMessage();
  initFinale();
  initReplay();
  initMusic();
}

// Wait for fonts + DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

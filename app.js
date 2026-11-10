/**
 * KREYNTIX MOTION STUDIO — 20-VIDEO SEQUENTIAL CANVAS SCRUBBING ENGINE
 * 
 * Animates 20 distinct Gemini Veo video extractions (240 WebP frames)
 * sequentially from top to bottom as the user scrolls down the webpage.
 * Zero raw video players: 100% Canvas2D frame scrubbing.
 */

(function () {
  'use strict';

  /* ==========================================================================
     CONFIGURATION
     ========================================================================== */
  const CONFIG = {
    totalFrames: 240,
    framesPerChapter: 12,
    totalChapters: 20,
    framesDir: 'frames/',
    prefix: 'frame_',
    ext: '.webp'
  };

  /* ==========================================================================
     APPLICATION STATE
     ========================================================================== */
  const state = {
    currentFrame: 1,
    targetFrame: 1,
    images: new Map(),
    loadedCount: 0,
    scrollProgress: 0,
    activeChapterIndex: 0,
    chapters: window.KREYNTIX_CHAPTERS || [],
    audioActive: false,
    audioCtx: null,
    audioNodes: null
  };

  /* ==========================================================================
     DOM CACHE
     ========================================================================== */
  const dom = {
    canvas: document.getElementById('motion-canvas'),
    heroSection: document.getElementById('kinetic-hero'),
    hudActiveFile: document.getElementById('hud-active-file'),
    hudFrameCount: document.getElementById('hud-frame-count'),
    hudFps: document.getElementById('hud-fps'),
    hudCoherence: document.getElementById('hud-coherence'),
    hudLatentVector: document.getElementById('hud-latent-vector'),
    cardBadge: document.getElementById('card-badge'),
    cardTitle: document.getElementById('card-title'),
    cardDesc: document.getElementById('card-desc'),
    narrativeTabs: document.getElementById('narrative-tabs'),
    chapterButtonsRow: document.getElementById('chapter-buttons-row'),
    btnPrev: document.getElementById('btn-prev-chapter'),
    btnNext: document.getElementById('btn-next-chapter'),
    navChapterIndicator: document.getElementById('nav-chapter-indicator'),
    manualSlider: document.getElementById('manual-frame-slider'),
    scrubTrackFill: document.getElementById('scrub-track-progress'),
    audioToggleBtn: document.getElementById('audio-toggle-btn'),
    audioBtnLabel: document.getElementById('audio-btn-label'),
    exploreReelBtn: document.getElementById('explore-reel-btn')
  };

  const ctx = dom.canvas.getContext('2d', { alpha: false });

  /* ==========================================================================
     FRAME SEQUENCE PRELOADER & CANVAS ENGINE
     ========================================================================== */
  function getFrameUrl(index) {
    const padded = String(index).padStart(4, '0');
    return `${CONFIG.framesDir}${CONFIG.prefix}${padded}${CONFIG.ext}`;
  }

  function preloadFrames() {
    const total = CONFIG.totalFrames;
    const initialImg = new Image();
    initialImg.src = getFrameUrl(1);
    initialImg.onload = () => {
      state.images.set(1, initialImg);
      renderFrame(1);

      // Preload remaining 2..240 frames in background
      for (let i = 2; i <= total; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          state.images.set(i, img);
          state.loadedCount++;
        };
      }
    };
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = dom.canvas.getBoundingClientRect();
    dom.canvas.width = rect.width * dpr;
    dom.canvas.height = rect.height * dpr;
    renderFrame(Math.round(state.currentFrame));
  }

  function renderFrame(frameIndex) {
    const clampedIndex = Math.min(Math.max(Math.round(frameIndex), 1), CONFIG.totalFrames);
    const img = state.images.get(clampedIndex);
    if (!img || !img.complete) return;

    const cw = dom.canvas.width;
    const ch = dom.canvas.height;
    const iw = img.naturalWidth || 800;
    const ih = img.naturalHeight || 450;

    // Cover scale calculation
    const hRatio = cw / iw;
    const vRatio = ch / ih;
    const ratio = Math.max(hRatio, vRatio);

    const centerShiftX = (cw - iw * ratio) / 2;
    const centerShiftY = (ch - ih * ratio) / 2;

    ctx.fillStyle = '#07080c';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, iw, ih, centerShiftX, centerShiftY, iw * ratio, ih * ratio);
  }

  /* ==========================================================================
     SCROLL ENGINE & CHAPTER SYNCHRONIZATION
     ========================================================================== */
  function onScroll() {
    if (!dom.heroSection) return;
    const rect = dom.heroSection.getBoundingClientRect();
    const scrollDistance = dom.heroSection.offsetHeight - window.innerHeight;
    if (scrollDistance <= 0) return;

    const scrolled = -rect.top;
    const rawProgress = Math.min(Math.max(scrolled / scrollDistance, 0), 1);
    state.scrollProgress = rawProgress;
    state.targetFrame = 1 + rawProgress * (CONFIG.totalFrames - 1);
  }

  function updateTelemetry(frameNum) {
    const total = CONFIG.totalFrames;
    const clamped = Math.min(Math.max(Math.round(frameNum), 1), total);
    const normalized = (clamped - 1) / (total - 1);

    // Calculate current chapter index (0..19)
    const chapterIdx = Math.min(Math.floor((clamped - 1) / CONFIG.framesPerChapter), CONFIG.totalChapters - 1);
    const chapter = state.chapters[chapterIdx] || {
      chapter: chapterIdx + 1,
      filename: `gemini_generated_video_${chapterIdx + 1}.mp4`,
      startFrame: chapterIdx * 12 + 1,
      endFrame: (chapterIdx + 1) * 12,
      badge: `SEQUENCE ${String(chapterIdx + 1).padStart(2, '0')} // HIGH-FIDELITY RENDER`,
      title: `LOSSLESS WEBP STREAMING`,
      description: `Native 24 FPS raster frames extracted via FFmpeg into optimized WebP sequence buffers.`
    };

    state.activeChapterIndex = chapterIdx;

    // Update HUD telemetry
    if (dom.hudActiveFile) {
      dom.hudActiveFile.textContent = chapter.filename;
    }
    if (dom.hudFrameCount) {
      const cur = String(clamped).padStart(4, '0');
      dom.hudFrameCount.textContent = `${cur} / 0240`;
    }
    if (dom.hudFps) {
      dom.hudFps.textContent = '24.000 FPS';
    }
    if (dom.hudCoherence) {
      const pct = (98.2 + ((clamped % 12) / 12) * 1.6).toFixed(1);
      dom.hudCoherence.textContent = `${pct}%`;
    }
    if (dom.hudLatentVector) {
      const step = String(Math.min(Math.floor((clamped - 1) / 10) + 1, 24)).padStart(2, '0');
      dom.hudLatentVector.textContent = `STEP ${step}`;
    }

    // Update Chapter Indicator
    if (dom.navChapterIndicator) {
      const cur = String(chapter.chapter).padStart(2, '0');
      dom.navChapterIndicator.textContent = `${cur} / 20`;
    }

    // Update floating narrative card
    if (dom.cardBadge) {
      dom.cardBadge.textContent = chapter.badge;
    }
    if (dom.cardTitle) {
      dom.cardTitle.textContent = chapter.title;
    }
    if (dom.cardDesc) {
      dom.cardDesc.textContent = chapter.description;
    }

    // Update tabs inside narrative card (01 LATENT INIT, 02 TEMPORAL FLOW, 03 CINEMA RENDER)
    if (dom.narrativeTabs) {
      const intraFrame = (clamped - 1) % 12;
      const tabIdx = Math.min(Math.floor(intraFrame / 4), 2);
      dom.narrativeTabs.querySelectorAll('.n-tab').forEach((tab, tIdx) => {
        if (tIdx === tabIdx) tab.classList.add('active');
        else tab.classList.remove('active');
      });
    }

    // Update chapter button highlight
    if (dom.chapterButtonsRow) {
      dom.chapterButtonsRow.querySelectorAll('.ch-btn').forEach((btn, idx) => {
        if (idx === chapterIdx) {
          btn.classList.add('active');
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Update manual scrubber slider
    if (dom.manualSlider) {
      dom.manualSlider.value = clamped;
    }
    if (dom.scrubTrackFill) {
      const pct = (normalized * 100).toFixed(2);
      dom.scrubTrackFill.style.width = `${pct}%`;
    }

    // Audio modulation
    if (state.audioActive && state.audioNodes) {
      updateAudioModulation(normalized);
    }
  }

  // 60 FPS Sub-pixel Linear Interpolation Render Loop
  function animationLoop() {
    const diff = state.targetFrame - state.currentFrame;
    if (Math.abs(diff) > 0.05) {
      state.currentFrame += diff * 0.12;
      renderFrame(state.currentFrame);
      updateTelemetry(state.currentFrame);
    }
    requestAnimationFrame(animationLoop);
  }

  /* ==========================================================================
     INTERACTIVE CONTROLS & CHAPTER NAVIGATION
     ========================================================================== */
  function initControls() {
    // Populate 20 chapter buttons with thumbnail, SEQ and code
    if (dom.chapterButtonsRow) {
      dom.chapterButtonsRow.innerHTML = state.chapters.map((ch, idx) => `
        <button class="ch-btn ${idx === 0 ? 'active' : ''}" data-chapter="${ch.chapter}" data-frame="${ch.startFrame}" type="button" aria-label="Sequence ${ch.chapter}: ${ch.filename}">
          <img class="ch-thumb" src="frames/frame_${String(ch.startFrame).padStart(4, '0')}.webp" alt="Thumb ${ch.chapter}" loading="lazy">
          <div class="ch-meta">
            <span class="ch-seq">SEQ ${String(ch.chapter).padStart(2, '0')}</span>
            <span class="ch-code">${ch.code}</span>
          </div>
        </button>
      `).join('');

      dom.chapterButtonsRow.querySelectorAll('.ch-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetFrame = parseInt(btn.dataset.frame, 10) || 1;
          jumpToFrame(targetFrame);
        });
      });
    }

    // Prev / Next Chapter Buttons
    if (dom.btnPrev) {
      dom.btnPrev.addEventListener('click', () => {
        const prevIdx = Math.max(state.activeChapterIndex - 1, 0);
        jumpToChapter(prevIdx);
      });
    }
    if (dom.btnNext) {
      dom.btnNext.addEventListener('click', () => {
        const nextIdx = Math.min(state.activeChapterIndex + 1, state.chapters.length - 1);
        jumpToChapter(nextIdx);
      });
    }

    // Explore Reel CTA Button
    if (dom.exploreReelBtn) {
      dom.exploreReelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        jumpToFrame(25);
      });
    }

    // Manual slider
    if (dom.manualSlider) {
      dom.manualSlider.max = CONFIG.totalFrames;
      dom.manualSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        jumpToFrame(val);
      });
    }
  }

  function jumpToChapter(chapterIndex) {
    const ch = state.chapters[chapterIndex];
    if (ch) {
      jumpToFrame(ch.startFrame);
    }
  }

  function jumpToFrame(frameIndex) {
    state.targetFrame = frameIndex;
    if (!dom.heroSection) return;
    const scrollDistance = dom.heroSection.offsetHeight - window.innerHeight;
    const targetScrollY = dom.heroSection.offsetTop + ((frameIndex - 1) / (CONFIG.totalFrames - 1)) * scrollDistance;
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  }

  /* ==========================================================================
     WEB AUDIO SYNTHESIS ENGINE (AMBIENT DRONE)
     ========================================================================== */
  function initAudioEngine() {
    if (dom.audioToggleBtn) {
      dom.audioToggleBtn.addEventListener('click', toggleAudio);
    }
  }

  function toggleAudio() {
    if (!state.audioActive) {
      startAudioSynthesis();
    } else {
      stopAudioSynthesis();
    }
  }

  function startAudioSynthesis() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      state.audioCtx = new AudioContext();

      const masterGain = state.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.12, state.audioCtx.currentTime);
      masterGain.connect(state.audioCtx.destination);

      const oscLow = state.audioCtx.createOscillator();
      oscLow.type = 'sine';
      oscLow.frequency.setValueAtTime(65.41, state.audioCtx.currentTime);

      const oscHigh = state.audioCtx.createOscillator();
      oscHigh.type = 'triangle';
      oscHigh.frequency.setValueAtTime(130.81, state.audioCtx.currentTime);

      const filter = state.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, state.audioCtx.currentTime);
      filter.Q.setValueAtTime(2.0, state.audioCtx.currentTime);

      oscLow.connect(filter);
      oscHigh.connect(filter);
      filter.connect(masterGain);

      oscLow.start();
      oscHigh.start();

      state.audioNodes = { oscLow, oscHigh, filter, masterGain };
      state.audioActive = true;

      dom.audioToggleBtn.classList.add('active');
      dom.audioToggleBtn.setAttribute('aria-pressed', 'true');
      dom.audioBtnLabel.textContent = 'AMBIENT SYNTH: ACTIVE';
    } catch (err) {
      console.warn('Web Audio synthesis deferred:', err);
    }
  }

  function stopAudioSynthesis() {
    if (state.audioNodes && state.audioCtx) {
      state.audioNodes.masterGain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 0.3);
      setTimeout(() => {
        if (state.audioCtx) {
          state.audioCtx.close();
          state.audioCtx = null;
          state.audioNodes = null;
        }
      }, 350);
    }
    state.audioActive = false;
    dom.audioToggleBtn.classList.remove('active');
    dom.audioToggleBtn.setAttribute('aria-pressed', 'false');
    dom.audioBtnLabel.textContent = 'AMBIENT SYNTH: OFF';
  }

  function updateAudioModulation(progress) {
    if (!state.audioNodes || !state.audioCtx) return;
    const baseFreq = 65.41 + progress * 32.7;
    const filterCutoff = 280 + progress * 600;
    state.audioNodes.oscLow.frequency.setTargetAtTime(baseFreq, state.audioCtx.currentTime, 0.08);
    state.audioNodes.oscHigh.frequency.setTargetAtTime(baseFreq * 2, state.audioCtx.currentTime, 0.08);
    state.audioNodes.filter.frequency.setTargetAtTime(filterCutoff, state.audioCtx.currentTime, 0.08);
  }

  /* ==========================================================================
     INITIALIZATION LIFECYCLE
     ========================================================================== */
  function init() {
    preloadFrames();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', onScroll, { passive: true });

    initControls();
    initAudioEngine();

    updateTelemetry(1);
    requestAnimationFrame(animationLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

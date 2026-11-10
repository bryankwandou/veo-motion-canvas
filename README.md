# KREYNTIX MOTION — 20-Video Sequential Kinetic Canvas

High-performance scroll-driven kinetic motion landing page animating 20 sequential Gemini Veo videos (240 WebP frames) via hardware-accelerated HTML5 Canvas2D scrubbing.

## Architecture

```
veo-motion-canvas/
├── frames/                  # 240 sequential WebP frames extracted from 20 course videos (12 frames each)
│   ├── frame_0001.webp ... frame_0240.webp
├── index.html               # Semantic HTML5 layout, sticky viewport, telemetry HUD, 20-sequence strip
├── styles.css               # Obsidian cybernetic design system tokens & responsive CSS
├── app.js                   # 60 FPS sub-pixel lerp engine, scroll synchronization, Web Audio API synth
├── chapters.js              # Catalog mapping 20 Gemini Veo MP4 video sources to frame boundaries
├── chapters.json            # JSON structured export of chapter boundaries
└── README.md                # Technical overview and deployment documentation
```

## Core Implementation Features

1. **20 Video Sequential Ingestion**:
   - 20 distinct video assets from the course directory (`gemini_generated_video_*.mp4`) extracted into 12 sequential WebP frames each (240 frames total).
2. **Top-to-Bottom Scroll Progress**:
   - Scrolling from 0% to 100% animates seamlessly through all 20 videos in sequential order.
3. **Zero Raw Video Players**:
   - 100% raster frame streaming rendered on HTML5 Canvas2D using 60 FPS sub-pixel linear interpolation (`requestAnimationFrame`).
4. **Real-Time Telemetry HUD**:
   - Live telemetry indicators displaying active source filename (`gemini_generated_video_*.mp4`), frame index (`0001 / 0240`), diffusion FPS (`24.000 FPS`), temporal coherence (`99.4%`), and latent step.
5. **Interactive 20-Sequence Strip**:
   - Horizontal scrub strip with video thumbnails, chapter jump buttons, Prev/Next controls, and manual range slider.
6. **Generative Web Audio Synthesis**:
   - Procedural dual-oscillator ambient soundscape dynamically modulated by scroll velocity and progress.

## Live Deployment

- Production URL: https://bryankwandou.github.io/veo-motion-canvas/
- GitHub Repository: https://github.com/bryankwandou/veo-motion-canvas

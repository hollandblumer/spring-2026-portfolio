"use client";
import React, { useRef, useMemo } from "react";
import ClientSketch from "./ClientSketch";

export default function Preloader({ onComplete, canExit = false }) {
  const buffersRef = useRef({ pgFront: null, pgBack: null });
  const stateRef = useRef({
    t: 0,
    mode: 0,
    completedBreaths: 0,
    finished: false,
    hasCompleted: false,
  });

  // Optimization: Move constants outside or memoize to prevent re-calc
  const WORD = "LOADING";
  const BG_COLOR = [227, 48, 3];
  const OLIVE = [112, 82, 8];
  const GREY = [207, 207, 207];
  const TWIST_VALS = [2.9, 0.5, 1.1];

  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  const easeInOutCubic = (x) => {
    const v = clamp01(x);
    return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
  };

  const symmetricGrowth = (p) => {
    const tri = 1 - Math.abs(2 * (p % 1) - 1);
    return easeInOutCubic(tri);
  };

  const configureGraphics = (p5) => {
    // Optimization: Cap pixel density at 2 for performance on Retina displays
    const density = Math.min(p5.displayDensity(), 2);
    p5.pixelDensity(density);

    const pgFront = p5.createGraphics(p5.width, p5.height);
    const pgBack = p5.createGraphics(p5.width, p5.height);

    [pgFront, pgBack].forEach((g) => g.pixelDensity(density));

    buffersRef.current.pgFront = pgFront;
    buffersRef.current.pgBack = pgBack;

    // Pre-render the text once during setup or resize
    // This is a HUGE performance win
    renderTextBuffer(p5, pgFront, GREY);
    renderTextBuffer(p5, pgBack, OLIVE);
  };

  const renderTextBuffer = (p5, g, col) => {
    g.clear();
    g.noStroke();
    g.fill(col);
    g.textAlign(p5.CENTER, p5.CENTER);
    g.textFont("Impact");
    const size = Math.min(g.width, g.height) * 0.22;
    g.textSize(size);

    const tracking = size * 0.06;
    let total = 0;
    for (let c of WORD) total += g.textWidth(c) + tracking;
    total -= tracking;

    let x = g.width / 2 - total / 2;
    const y = g.height / 2;
    for (let c of WORD) {
      const w = g.textWidth(c);
      g.text(c, x + w / 2, y);
      x += w + tracking;
    }
  };

  const draw = (p5) => {
    const { pgFront, pgBack } = buffersRef.current;
    const s = stateRef.current;
    if (!pgFront || !pgBack) return;

    // 1. Update Animation State
    if (!s.finished) {
      s.t += (0.25 * p5.deltaTime) / 1000;
      if (s.t >= 1) {
        s.t = 0;
        s.mode = (s.mode + 1) % 3;
        s.completedBreaths++;
        if (s.completedBreaths >= 2) {
          s.finished = true;
          s.t = 1;
        }
      }
    }

    // 2. Logic Calculations
    const inSecondBreath = s.completedBreaths === 1 || s.finished;
    const eraseStart = 0.5;
    const growth =
      inSecondBreath && s.t >= eraseStart ? 1 : symmetricGrowth(s.t);
    const eraseProgress =
      inSecondBreath && s.t >= eraseStart
        ? easeInOutCubic(p5.map(s.t, eraseStart, 1, 0, 1, true))
        : 0;

    const twist =
      p5.lerp(
        TWIST_VALS[s.mode],
        TWIST_VALS[(s.mode + 1) % 3],
        inSecondBreath && s.t >= eraseStart ? 0.5 : s.t,
      ) * growth;
    const wobble = s.t * p5.TWO_PI * 2;
    const mid = p5.height / 2;
    const spread = growth * p5.height * 0.4;

    // 3. Render Loop
    p5.background(...BG_COLOR);

    // Optimization: Draw directly to main canvas to avoid pgWarp overhead
    // Increase step size slightly if still lagging (e.g., y += 2)
    const step = 2;
    for (let y = 0; y < p5.height; y += step) {
      const angle = p5.map(y, 0, p5.height, -p5.PI, p5.PI) * twist;
      const img = Math.cos(angle) >= 0 ? pgFront : pgBack;

      const perspective = p5.lerp(1, Math.abs(Math.cos(angle)), growth);
      const bulge = p5.lerp(
        1,
        p5.map(Math.sin((y / p5.height) * p5.PI), 0, 1, 1, 1.12),
        growth,
      );
      const xShift = Math.sin(angle) * p5.width * 0.1 * growth;
      const wave = Math.sin(y * 0.008 + wobble) * 92 * growth;

      const dw = p5.width * perspective * bulge;
      const dx = (p5.width - dw) / 2 + xShift + wave;
      const sy =
        y < mid - spread ? y + spread : y > mid + spread ? y - spread : mid;

      p5.image(img, dx, y, dw, step, 0, sy, p5.width, step);
    }

    if (eraseProgress > 0) {
      const ctx = p5.drawingContext;
      const eraseSpread = eraseProgress * (p5.height * 0.7);
      const top = mid - eraseSpread;
      const bot = mid + eraseSpread;

      ctx.fillStyle = `rgb(${BG_COLOR.join(",")})`;
      ctx.fillRect(0, top, p5.width, bot - top);
      // Gradients are expensive; only use if visual impact is critical
    }

    if (s.finished && canExit && !s.hasCompleted) {
      s.hasCompleted = true;
      onComplete?.();
    }
  };

  return (
    <ClientSketch
      setup={(p5, ref) => {
        p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(ref);
        configureGraphics(p5);
      }}
      draw={draw}
      windowResized={(p5) => {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        configureGraphics(p5);
      }}
    />
  );
}

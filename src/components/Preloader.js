"use client";
import React, { useRef } from "react";
import ClientSketch from "./ClientSketch";

export default function Preloader({ onComplete, canExit = false }) {
  const buffersRef = useRef({
    pgFront: null,
    pgBack: null,
    pgWarp: null,
  });
  const stateRef = useRef({
    t: 0,
    mode: 0,
    completedBreaths: 0,
    finished: false,
    hasCompleted: false,
  });

  const WORD = "LOADING";
  const BG_COLOR = [227, 48, 3];
  const OLIVE = [112, 82, 8];
  const GREY = [207, 207, 207];
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  const easeInOutCubic = (x) => {
    const value = clamp01(x);
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  };

  const symmetricGrowth = (p) => {
    const progress = p % 1;
    const tri = 1 - Math.abs(2 * progress - 1);
    return easeInOutCubic(tri);
  };

  const getCanvasDensity = (p5) => {
    const deviceDensity =
      typeof p5.displayDensity === "function" ? p5.displayDensity() : 1;
    return Math.min(deviceDensity, p5.windowWidth < 980 ? 1 : 2);
  };

  const configureGraphics = (p5) => {
    const density = getCanvasDensity(p5);
    p5.pixelDensity(density);
    p5.drawingContext.imageSmoothingEnabled = true;

    const pgFront = p5.createGraphics(p5.width, p5.height);
    const pgBack = p5.createGraphics(p5.width, p5.height);
    const pgWarp = p5.createGraphics(p5.width, p5.height);

    [pgFront, pgBack, pgWarp].forEach((g) => {
      g.pixelDensity(density);
      g.drawingContext.imageSmoothingEnabled = true;
    });

    buffersRef.current.pgFront = pgFront;
    buffersRef.current.pgBack = pgBack;
    buffersRef.current.pgWarp = pgWarp;
  };

  const drawTopBottomErase = (p5, progress) => {
    const ctx = p5.drawingContext;
    const mid = p5.height / 2;
    const eraseSpread = progress * (p5.height * 0.7);
    const feather = 2;
    const topEdge = mid - eraseSpread;
    const bottomEdge = mid + eraseSpread;

    ctx.save();
    ctx.fillStyle = `rgb(${BG_COLOR[0]}, ${BG_COLOR[1]}, ${BG_COLOR[2]})`;
    ctx.fillRect(0, topEdge, p5.width, bottomEdge - topEdge);

    const topGrad = ctx.createLinearGradient(0, topEdge - feather, 0, topEdge);
    topGrad.addColorStop(
      0,
      `rgba(${BG_COLOR[0]}, ${BG_COLOR[1]}, ${BG_COLOR[2]}, 0)`,
    );
    topGrad.addColorStop(
      1,
      `rgba(${BG_COLOR[0]}, ${BG_COLOR[1]}, ${BG_COLOR[2]}, 1)`,
    );
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, topEdge - feather, p5.width, feather);

    const bottomGrad = ctx.createLinearGradient(
      0,
      bottomEdge,
      0,
      bottomEdge + feather,
    );
    bottomGrad.addColorStop(
      0,
      `rgba(${BG_COLOR[0]}, ${BG_COLOR[1]}, ${BG_COLOR[2]}, 1)`,
    );
    bottomGrad.addColorStop(
      1,
      `rgba(${BG_COLOR[0]}, ${BG_COLOR[1]}, ${BG_COLOR[2]}, 0)`,
    );
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, bottomEdge, p5.width, feather);
    ctx.restore();
  };

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    configureGraphics(p5);
  };

  const prepBuffer = (p5, g, col) => {
    g.clear();
    g.noStroke();
    g.fill(col);
    g.textAlign(p5.CENTER, p5.CENTER);
    g.textFont("Impact");
    const size = p5.min(g.width, g.height) * 0.22;
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
    const { pgFront, pgBack, pgWarp } = buffersRef.current;
    const animation = stateRef.current;

    if (!pgFront || !pgBack || !pgWarp) return;

    const speed = 0.25;

    if (!animation.finished) {
      animation.t += (speed * p5.deltaTime) / 1000;
      if (animation.t >= 1) {
        animation.t = 0;
        animation.mode = (animation.mode + 1) % 3;
        animation.completedBreaths++;
        if (animation.completedBreaths >= 2) {
          animation.finished = true;
          animation.t = 1;
        }
      }
    }

    const inSecondBreath = animation.completedBreaths === 1 || animation.finished;
    const eraseStart = 0.5;
    let growth;
    let eraseProgress = 0;

    if (inSecondBreath && animation.t >= eraseStart) {
      growth = 1;
      eraseProgress = easeInOutCubic(
        p5.map(animation.t, eraseStart, 1, 0, 1, true),
      );
    } else {
      growth = symmetricGrowth(animation.t);
    }

    const bulgeVal = 1.12;
    const noiseAmt = 92;
    const twistVals = [2.9, 0.5, 1.1];
    const sliceStep = 1;
    const sliceHeight = 1.5;
    const twistStart = twistVals[animation.mode];
    const twistEnd = twistVals[(animation.mode + 1) % 3];
    const currentTwistBase =
      inSecondBreath && animation.t >= eraseStart
        ? p5.lerp(twistStart, twistEnd, 0.5)
        : p5.lerp(twistStart, twistEnd, animation.t);
    const twist = currentTwistBase * growth;
    const wobble = animation.t * p5.TWO_PI * 2;

    prepBuffer(p5, pgFront, p5.color(...GREY));
    prepBuffer(p5, pgBack, p5.color(...OLIVE));

    pgWarp.clear();
    const mid = p5.height / 2;
    const spread = growth * p5.height * 0.4;

    for (let y = 0; y < p5.height; y += sliceStep) {
      const angle = p5.map(y, 0, p5.height, -p5.PI, p5.PI) * twist;
      const front = Math.cos(angle) >= 0;
      const perspective = p5.lerp(1, Math.abs(p5.cos(angle)), growth);
      const xShift = p5.sin(angle) * p5.width * 0.1 * growth;
      const bulge = p5.lerp(
        1,
        p5.map(p5.sin((y / p5.height) * p5.PI), 0, 1, 1, bulgeVal),
        growth,
      );
      const wave = p5.sin(y * 0.008 + wobble) * noiseAmt * growth;

      const dw = p5.width * perspective * bulge;
      const dx = p5.width / 2 + xShift + wave - dw / 2;
      const sy =
        y < mid - spread ? y + spread : y > mid + spread ? y - spread : mid;

      pgWarp.image(
        front ? pgFront : pgBack,
        dx,
        y,
        dw,
        sliceHeight,
        0,
        sy,
        p5.width,
        sliceStep,
      );
    }

    p5.background(...BG_COLOR);
    p5.image(pgWarp, 0, 0);

    if (eraseProgress > 0) {
      drawTopBottomErase(p5, eraseProgress);
    }

    if (animation.finished && canExit && !animation.hasCompleted) {
      animation.hasCompleted = true;
      onComplete?.();
    }
  };

  return (
    <ClientSketch
      setup={setup}
      draw={draw}
      windowResized={(p5) => {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        configureGraphics(p5);
      }}
    />
  );
}

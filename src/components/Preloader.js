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
    isFinished: false,
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

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.pixelDensity(2);
    buffersRef.current.pgFront = p5.createGraphics(p5.width, p5.height);
    buffersRef.current.pgBack = p5.createGraphics(p5.width, p5.height);
    buffersRef.current.pgWarp = p5.createGraphics(p5.width, p5.height);
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

    if (!animation.isFinished) {
      animation.t += (0.25 * p5.deltaTime) / 1000;
      if (animation.t >= 1) {
        animation.t = 0;
        animation.mode = (animation.mode + 1) % 3;
        animation.completedBreaths++;
        if (animation.completedBreaths >= 1) {
          animation.isFinished = true;
          animation.t = 0;
        }
      }
    }

    const growth = animation.isFinished ? 0 : symmetricGrowth(animation.t);
    const bulgeVal = 1.12;
    const noiseAmt = 92;
    const twistVals = [2.9, 0.5, 1.1];
    const twistStart = twistVals[animation.mode];
    const twistEnd = twistVals[(animation.mode + 1) % 3];
    const currentTwistBase = animation.isFinished
      ? twistStart
      : p5.lerp(twistStart, twistEnd, animation.t);
    const twist = currentTwistBase * growth;
    const wobble = animation.t * p5.TWO_PI * 2;

    prepBuffer(p5, pgFront, p5.color(...GREY));
    prepBuffer(p5, pgBack, p5.color(...OLIVE));

    pgWarp.clear();
    const mid = p5.height / 2;
    const spread = growth * p5.height * 0.4;

    for (let y = 0; y < p5.height; y++) {
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

      pgWarp.image(front ? pgFront : pgBack, dx, y, dw, 1, 0, sy, p5.width, 1);
    }

    p5.background(...BG_COLOR);
    p5.image(pgWarp, 0, 0);

    if (animation.isFinished && canExit && !animation.hasCompleted) {
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
        buffersRef.current.pgFront = p5.createGraphics(p5.width, p5.height);
        buffersRef.current.pgBack = p5.createGraphics(p5.width, p5.height);
        buffersRef.current.pgWarp = p5.createGraphics(p5.width, p5.height);
      }}
    />
  );
}

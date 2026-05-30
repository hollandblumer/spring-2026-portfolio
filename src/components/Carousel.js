"use client";
import React, { useEffect, useRef } from "react";
import ClientSketch from "./ClientSketch";

export default function Carousel({
  mediaItems = [],
  onIndexChange,
  canPlayActiveMedia = true,
  currentIndex,
}) {
  const buffersRef = useRef({
    pgText: null,
    pgWarp: null,
    pgSpeckles: null,
  });
  const mediaRef = useRef([]);
  const stateRef = useRef({
    currentIdx: 1,
    sideX: [0, 0],
    targetSideX: [0, 0],
    isTransitioning: false,
    transitionDir: 0,
    transitionStart: 0,
    revealPhase: "waiting",
    revealStart: 0,
  });
  const transitionDur = 700;
  const transitionRef = useRef({
    outgoingIdx: 1,
    incomingIdx: 1,
  });

  const BG_COLOR = [227, 48, 3];
  const TEXT_COL = [207, 207, 207];
  const WORD = "WORK";

  useEffect(() => {
    onIndexChange?.(stateRef.current.currentIdx + 1);
  }, [onIndexChange]);

  useEffect(() => {
    if (
      typeof currentIndex !== "number" ||
      Number.isNaN(currentIndex) ||
      currentIndex < 0 ||
      currentIndex >= mediaItems.length
    ) {
      return;
    }

    stateRef.current.currentIdx = currentIndex;
    stateRef.current.isTransitioning = false;
    stateRef.current.transitionDir = 0;
    onIndexChange?.(currentIndex + 1);
  }, [currentIndex, mediaItems.length, onIndexChange]);

  useEffect(() => {
    const state = stateRef.current;
    if (canPlayActiveMedia && state.revealPhase === "waiting") {
      state.revealPhase = "revealing";
      state.revealStart = 0;
    }
  }, [canPlayActiveMedia]);

  useEffect(() => {
    return () => {
      for (const item of mediaRef.current) {
        if (item?.type === "video" && item.asset) {
          item.asset.stop();
          item.asset.remove();
        }
      }
    };
  }, []);

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.pixelDensity(2);

    buffersRef.current.pgText = p5.createGraphics(p5.width, p5.height);
    buffersRef.current.pgWarp = p5.createGraphics(p5.width, p5.height);
    buffersRef.current.pgSpeckles = makeSpeckleLayer(p5);

    mediaRef.current = mediaItems.map((item) => {
      if (item.type === "video") {
        const video = p5.createVideo(item.src, () => {
          video.volume(0);
          video.pause();
          video.time(0);
        });
        video.attribute("playsinline", "true");
        video.elt.muted = true;
        video.hide();
        return {
          ...item,
          asset: video,
          posterAsset: item.poster ? p5.loadImage(item.poster) : null,
        };
      }

      return { ...item, asset: p5.loadImage(item.src) };
    });

    updateSideTargets(p5);
    stateRef.current.sideX = [...stateRef.current.targetSideX];
  };

  const updateSideTargets = (p5) => {
    const gap = p5.width * 0.27;
    stateRef.current.targetSideX = [p5.width / 2 - gap, p5.width / 2 + gap];
  };

  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const makeSpeckleLayer = (p5) => {
    const pg = p5.createGraphics(p5.width, p5.height);
    const speckCount = Math.floor(p5.width * p5.height * 0.011);
    const maxSize = Math.max(1.6, p5.width * 0.002);

    pg.pixelDensity(1);
    pg.noStroke();

    for (let i = 0; i < speckCount; i++) {
      const x = p5.random(p5.width);
      const y = p5.random(p5.height);
      const n = p5.noise(x * 0.01, y * 0.01) * maxSize;
      pg.fill(255, 226, 136, 44);
      pg.ellipse(x, y, n, n);
    }

    return pg;
  };

  const drawTopBottomRevealMask = (p5, progress) => {
    const eased = easeInOutCubic(progress);
    const ctx = p5.drawingContext;
    const mid = p5.height / 2;
    const revealSpread = eased * mid;
    const feather = 2;
    const topEdge = revealSpread;
    const bottomEdge = p5.height - revealSpread;

    ctx.save();
    ctx.fillStyle = `rgb(${BG_COLOR[0]}, ${BG_COLOR[1]}, ${BG_COLOR[2]})`;

    if (topEdge < bottomEdge) {
      ctx.fillRect(0, topEdge, p5.width, bottomEdge - topEdge);
      const topGrad = ctx.createLinearGradient(
        0,
        topEdge + feather,
        0,
        topEdge,
      );
      topGrad.addColorStop(
        0,
        `rgba(${BG_COLOR[0]}, ${BG_COLOR[1]}, ${BG_COLOR[2]}, 0)`,
      );
      topGrad.addColorStop(
        1,
        `rgba(${BG_COLOR[0]}, ${BG_COLOR[1]}, ${BG_COLOR[2]}, 1)`,
      );
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, topEdge, p5.width, feather);

      const bottomGrad = ctx.createLinearGradient(
        0,
        bottomEdge,
        0,
        bottomEdge - feather,
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
      ctx.fillRect(0, bottomEdge - feather, p5.width, feather);
    }

    ctx.restore();
  };

  const drawTextLayer = (p5) => {
    const { pgText } = buffersRef.current;
    pgText.clear();
    pgText.fill(...TEXT_COL);
    pgText.noStroke();
    pgText.textAlign(p5.CENTER, p5.CENTER);
    pgText.textFont("Impact");
    pgText.textSize(p5.min(p5.width, p5.height) * 0.25);
    pgText.text(WORD, p5.width / 2, p5.height / 2);
  };

  const draw = (p5) => {
    const { pgText, pgWarp, pgSpeckles } = buffersRef.current;
    const media = mediaRef.current;
    const state = stateRef.current;
    const transition = transitionRef.current;

    if (
      !pgText ||
      !pgWarp ||
      media.length !== mediaItems.length ||
      media.length === 0
    ) {
      p5.background(...BG_COLOR);
      if (pgSpeckles) {
        p5.image(pgSpeckles, 0, 0);
      }
      return;
    }

    syncVideoPlayback(
      media,
      state.currentIdx,
      state.isTransitioning,
      canPlayActiveMedia,
    );

    p5.background(...BG_COLOR);
    p5.image(pgSpeckles, 0, 0);

    const time = p5.millis() * 0.0015;
    drawTextLayer(p5);
    pgWarp.clear();

    const imgW =
      p5.min(p5.width, p5.height) * (p5.width < 720 ? 0.58 : 0.45);
    const imgH = imgW * 1.3;
    const topBound = p5.height / 2 - imgH / 2;
    const bottomBound = p5.height / 2 + imgH / 2;
    const getDisplayWidth = (item, scale = 1, isFocused = false) => {
      const multiplier = item?.displayWidthMultiplier || 1;
      if (multiplier > 1 && !isFocused) {
        return imgW * scale;
      }

      const sideMultiplier = multiplier > 1 ? 1 + (multiplier - 1) * 0.45 : 1;
      return imgW * (isFocused ? multiplier : sideMultiplier) * scale;
    };
    const getDisplayHeight = (item, scale = 1) => imgH * scale;
    const getHorizontalCrop = (item, asset, displayWidth, scale = 1) => {
      const sourceWidth = getRenderableAssetWidth(item, asset) || imgW;
      const multiplier = item?.displayWidthMultiplier || 1;

      if (multiplier <= 1) {
        return { sx: 0, sw: sourceWidth };
      }

      const fullDisplayWidth = imgW * multiplier * scale;
      const cropRatio = p5.constrain(displayWidth / fullDisplayWidth, 0, 1);
      const sw = sourceWidth * cropRatio;

      return {
        sx: (sourceWidth - sw) / 2,
        sw,
      };
    };
    const drawPerspectiveSideImage = (
      item,
      asset,
      centerX,
      centerY,
      displayWidth,
      displayHeight,
      side,
      scale = 1,
    ) => {
      const projectedWidth = displayWidth * 0.68;
      const minScale = 0.86;
      const sourceHeight = getRenderableAssetHeight(item, asset) || imgH;
      const top = centerY - displayHeight / 2;
      const crop = getHorizontalCrop(item, asset, displayWidth, scale);

      for (let x = 0; x < projectedWidth; x++) {
        const progress = x / projectedWidth;
        const depth =
          side === "left" ? progress : 1 - progress;
        const sliceScale = p5.lerp(minScale, 1, depth);
        const sliceH = displayHeight * sliceScale;
        const sliceTop = top + (displayHeight - sliceH) / 2;
        const destX = centerX - projectedWidth / 2 + x;
        const sourceProgress =
          side === "left"
            ? Math.pow(progress, 0.72)
            : 1 - Math.pow(1 - progress, 0.72);
        const sx = crop.sx + sourceProgress * crop.sw;

        pgWarp.image(
          asset,
          destX,
          sliceTop,
          1.35,
          sliceH,
          sx,
          0,
          crop.sw / projectedWidth,
          sourceHeight,
        );
      }
    };

    let leftIdx = (state.currentIdx - 1 + media.length) % media.length;
    let rightIdx = (state.currentIdx + 1) % media.length;

    let t = 0;
    let e = 0;

    if (state.isTransitioning) {
      t = p5.constrain(
        (p5.millis() - state.transitionStart) / transitionDur,
        0,
        1,
      );
      e = easeInOutCubic(t);

      if (t >= 1) {
        state.currentIdx = transition.incomingIdx;
        state.isTransitioning = false;
        state.transitionDir = 0;
        onIndexChange?.(state.currentIdx + 1);
      }
    }

    let globalSlide = state.isTransitioning
      ? 0
      : p5.sin(time * 0.8) * (p5.width * 0.02);

    if (!state.isTransitioning) {
      let displayIndices = [leftIdx, rightIdx];
      for (let i = 0; i < 2; i++) {
        state.sideX[i] = p5.lerp(
          state.sideX[i],
          state.targetSideX[i],
          0.1,
        );
        const isMobile = p5.width < 980;
        const sideBoost =
          p5.width > 1000
            ? p5.map(p5.width, 1000, 1800, 0.96, 1.08, true)
            : 1;
        const baseSideScale = isMobile ? 0.72 : 0.82;
        const sideImg = media[displayIndices[i]];
        const finalW =
          getDisplayWidth(sideImg, baseSideScale * sideBoost) * 0.9;
        const finalH = getDisplayHeight(sideImg, baseSideScale * sideBoost);
        const sideAsset = getRenderableAsset(sideImg, false);

        drawPerspectiveSideImage(
          sideImg,
          sideAsset,
          state.sideX[i],
          p5.height / 2,
          finalW,
          finalH,
          i === 0 ? "left" : "right",
          finalH / imgH,
        );
      }
    } else {
      const isMobile = p5.width < 980;
      const transitionSideBoost =
        p5.width > 1000
          ? p5.map(p5.width, 1000, 1800, 0.96, 1.08, true)
          : 1;
      const sideScale = (isMobile ? 0.72 : 0.82) * transitionSideBoost;
      const sideH = getDisplayHeight(media[transition.outgoingIdx], sideScale);
      const farIdx =
        state.transitionDir === 1
          ? (transition.outgoingIdx - 1 + media.length) % media.length
          : (transition.outgoingIdx + 1) % media.length;
      const farImg = media[farIdx];
      const farAsset = getRenderableAsset(farImg, false);
      const farSideW = getDisplayWidth(farImg, sideScale) * 0.9;
      const farSideCX =
        state.transitionDir === 1 ? state.targetSideX[0] : state.targetSideX[1];

      drawPerspectiveSideImage(
        farImg,
        farAsset,
        farSideCX,
        p5.height / 2,
        farSideW,
        sideH,
        state.transitionDir === 1 ? "left" : "right",
        sideScale,
      );
    }

    for (let y = 0; y < p5.height; y++) {
      if (y >= topBound && y <= bottomBound) {
        if (!state.isTransitioning) {
          // ---- IDLE IMAGE STATE ----
          const centerImg = media[state.currentIdx];
          const centerAsset = getRenderableAsset(centerImg, true);
          const centerHeight =
            getRenderableAssetHeight(centerImg, centerAsset) || imgH;
          const centerW = getDisplayWidth(centerImg, 1, true);
          const centerH = getDisplayHeight(centerImg);
          const cx = p5.width / 2 - centerW / 2;
          const cImgSy = p5.map(y, topBound, bottomBound, 0, centerHeight);
          const centerCrop = getHorizontalCrop(centerImg, centerAsset, centerW);
          pgWarp.image(
            centerAsset,
            cx,
            y,
            centerW,
            1,
            centerCrop.sx,
            cImgSy,
            centerCrop.sw,
            1,
          );
        } else {
          // ---- TRANSITION IMAGE STATE ----
          const isMobile = p5.width < 980;
          const transitionSideBoost =
            p5.width > 1000
              ? p5.map(p5.width, 1000, 1800, 0.96, 1.08, true)
              : 1;
          const baseSideScale = isMobile ? 0.72 : 0.82;
          const sideScale = baseSideScale * transitionSideBoost;
          const inImg = media[transition.incomingIdx];
          const outImg = media[transition.outgoingIdx];
          const sideW = getDisplayWidth(outImg, sideScale);
          const sideH = getDisplayHeight(outImg, sideScale);
          let inStartX =
            state.transitionDir === 1
              ? state.targetSideX[1] - getDisplayWidth(inImg, sideScale) / 2
              : state.targetSideX[0] - getDisplayWidth(inImg, sideScale) / 2;
          let outEndX =
            state.transitionDir === 1
              ? state.targetSideX[0] - sideW / 2
              : state.targetSideX[1] - sideW / 2;

          const incomingCenterX =
            p5.width / 2 - getDisplayWidth(inImg, 1, true) / 2;
          const outgoingCenterX =
            p5.width / 2 - getDisplayWidth(outImg, 1, true) / 2;
          const incomingSideW = getDisplayWidth(inImg, sideScale);
          const incomingCenterW = getDisplayWidth(inImg, 1, true);
          const incomingX = p5.lerp(inStartX, incomingCenterX, e);
          const outgoingX = p5.lerp(outgoingCenterX, outEndX, e);
          const outgoingW = p5.lerp(getDisplayWidth(outImg, 1, true), sideW, e);
          const outgoingH = p5.lerp(getDisplayHeight(outImg), sideH, e);
          const incomingW = p5.lerp(incomingSideW, incomingCenterW, e);
          const outgoingTop = p5.height / 2 - outgoingH / 2;
          const outgoingBottom = p5.height / 2 + outgoingH / 2;

          const inAsset = getRenderableAsset(inImg, true);
          const outAsset = getRenderableAsset(outImg, false);
          const inSy = p5.map(
            y,
            topBound,
            bottomBound,
            0,
            getRenderableAssetHeight(inImg, inAsset) || imgH,
          );

          if (y >= outgoingTop && y <= outgoingBottom) {
            const outSy = p5.map(
              y,
              outgoingTop,
              outgoingBottom,
              0,
              getRenderableAssetHeight(outImg, outAsset) || imgH,
            );
            const outCrop = getHorizontalCrop(
              outImg,
              outAsset,
              outgoingW,
              outgoingH / imgH,
            );
            pgWarp.image(
              outAsset,
              outgoingX,
              y,
              outgoingW,
              1,
              outCrop.sx,
              outSy,
              outCrop.sw,
              1,
            );
          }
          const inCrop = getHorizontalCrop(inImg, inAsset, incomingW);
          pgWarp.image(
            inAsset,
            incomingX,
            y,
            incomingW,
            1,
            inCrop.sx,
            inSy,
            inCrop.sw,
            1,
          );

        }
      } else {
        // ---- GREY TEXT STRETCH ----
        let distFromEdge = y < topBound ? topBound - y : y - bottomBound;
        let normalizedDist = p5.map(distFromEdge, 0, p5.height / 2, 0, 1);
        let tailSway =
          y < topBound ? p5.sin(time * 1.2) : p5.sin(time * 1.2 + p5.PI);
        let tailOffset = tailSway * (p5.width * 0.1) * normalizedDist;
        const minWidth = imgW * 0.8;
        const maxWidth = p5.width * 0.95;
        let baseW = p5.lerp(minWidth, maxWidth, p5.pow(normalizedDist, 0.7));
        let pulse = state.isTransitioning ? p5.sin(t * p5.PI) : 0;
        let directionalStretch = p5.width * 0.28 * pulse;
        let centerShift = directionalStretch * 0.5 * state.transitionDir;
        let leftExtra = 0;
        let rightExtra = 0;

        if (state.transitionDir === 1) {
          rightExtra = directionalStretch;
        } else if (state.transitionDir === -1) {
          leftExtra = directionalStretch;
        }

        let finalW = baseW + leftExtra + rightExtra;
        let dx =
          p5.width / 2 -
          finalW / 2 +
          globalSlide +
          tailOffset +
          centerShift;

        const isMobileText = p5.width < 720;
        const textSampleSpan = isMobileText
          ? p5.min(p5.width, p5.height) * 0.11
          : 110;
        let sy =
          y < topBound
            ? p5.map(
                y,
                isMobileText ? 0 : topBound - 220,
                topBound,
                p5.height / 2 - textSampleSpan,
                p5.height / 2,
              )
            : p5.map(
                y,
                bottomBound,
                isMobileText ? p5.height : bottomBound + 220,
                p5.height / 2,
                p5.height / 2 + textSampleSpan,
              );

        pgWarp.image(pgText, dx, y, finalW, 1, 0, sy, p5.width, 1);
      }
    }
    p5.image(pgWarp, 0, 0);

    if (state.revealPhase === "revealing") {
      if (!state.revealStart) {
        state.revealStart = p5.millis();
      }

      const revealProgress = p5.constrain(
        (p5.millis() - state.revealStart) / 900,
        0,
        1,
      );
      drawTopBottomRevealMask(p5, revealProgress);

      if (revealProgress >= 1) {
        state.revealPhase = "done";
      }
    }
  };

  const startTransition = (p5, dir) => {
    const media = mediaRef.current;
    const state = stateRef.current;
    const transition = transitionRef.current;

    if (state.isTransitioning || media.length === 0) return;
    transition.outgoingIdx = state.currentIdx;
    state.transitionDir = dir;
    transition.incomingIdx =
      dir === 1
        ? (state.currentIdx + 1) % media.length
        : (state.currentIdx - 1 + media.length) % media.length;
    state.transitionStart = p5.millis();
    state.isTransitioning = true;
  };

  const getAssetWidth = (item) => {
    if (!item) return 0;
    if (item.type === "video") return item.asset?.elt?.videoWidth || 0;
    return item.asset?.width || 0;
  };

  const getAssetHeight = (item) => {
    if (!item) return 0;
    if (item.type === "video") return item.asset?.elt?.videoHeight || 0;
    return item.asset?.height || 0;
  };

  const getRenderableAsset = (item, isCenter) => {
    if (!item) return null;
    if (item.type !== "video") return item.asset;

    const videoReady = Boolean(item.asset?.elt?.videoWidth);
    if (isCenter && videoReady) {
      return item.asset;
    }

    return item.posterAsset || item.asset;
  };

  const getRenderableAssetWidth = (item, asset) => {
    if (!item || !asset) return 0;
    if (item.type === "video" && asset === item.asset) {
      return getAssetWidth(item);
    }
    return asset.width || 0;
  };

  const getRenderableAssetHeight = (item, asset) => {
    if (!item || !asset) return 0;
    if (item.type === "video" && asset === item.asset) {
      return getAssetHeight(item);
    }
    return asset.height || 0;
  };

  const syncVideoPlayback = (
    items,
    activeIndex,
    isTransitioning,
    canPlayActiveMedia,
  ) => {
    items.forEach((item, index) => {
      if (item?.type !== "video" || !item.asset?.elt) return;

      const video = item.asset;
      const shouldPlay =
        canPlayActiveMedia && !isTransitioning && index === activeIndex;

      if (shouldPlay) {
        if (video.elt.paused) {
          video.loop();
        }
      } else if (!video.elt.paused) {
        video.pause();
        if (index !== activeIndex) {
          video.time(0);
        }
      }
    });
  };

  return (
    <ClientSketch
      setup={setup}
      draw={draw}
      mousePressed={(p5) => {
        if (p5.mouseX < p5.width * 0.4) {
          startTransition(p5, -1);
        } else if (p5.mouseX > p5.width * 0.6) {
          startTransition(p5, 1);
        }
      }}
      windowResized={(p5) => {
        p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
        buffersRef.current.pgText = p5.createGraphics(p5.width, p5.height);
        buffersRef.current.pgWarp = p5.createGraphics(p5.width, p5.height);
        buffersRef.current.pgSpeckles = makeSpeckleLayer(p5);
        updateSideTargets(p5);
        stateRef.current.sideX = [...stateRef.current.targetSideX];
      }}
    />
  );
}

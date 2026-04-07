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
  });
  const mediaRef = useRef([]);
  const stateRef = useRef({
    currentIdx: 1,
    sideX: [0, 0],
    targetSideX: [0, 0],
    isTransitioning: false,
    transitionDir: 0,
    transitionStart: 0,
  });
  const transitionDur = 700;
  const transitionRef = useRef({
    outgoingIdx: 1,
    incomingIdx: 1,
  });

  const BG_COLOR = [227, 48, 3];
  const TEXT_COL = [207, 207, 207];
  const WORD = "LOADING";

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
    const gap = p5.width * 0.32;
    stateRef.current.targetSideX = [p5.width / 2 - gap, p5.width / 2 + gap];
  };

  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
    const { pgText, pgWarp } = buffersRef.current;
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
      return;
    }

    syncVideoPlayback(
      media,
      state.currentIdx,
      state.isTransitioning,
      canPlayActiveMedia,
    );

    p5.background(...BG_COLOR);

    const time = p5.millis() * 0.0015;
    drawTextLayer(p5);
    pgWarp.clear();

    const imgW = p5.min(p5.width, p5.height) * 0.45;
    const imgH = imgW * 1.3;
    const topBound = p5.height / 2 - imgH / 2;
    const bottomBound = p5.height / 2 + imgH / 2;

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

    for (let y = 0; y < p5.height; y++) {
      if (y >= topBound && y <= bottomBound) {
        if (!state.isTransitioning) {
          // ---- IDLE IMAGE STATE ----
          const centerImg = media[state.currentIdx];
          const centerAsset = getRenderableAsset(centerImg, true);
          const centerHeight =
            getRenderableAssetHeight(centerImg, centerAsset) || imgH;
          const cx = p5.width / 2 - imgW / 2;
          const cImgSy = p5.map(y, topBound, bottomBound, 0, centerHeight);
          pgWarp.image(
            centerAsset,
            cx,
            y,
            imgW,
            1,
            0,
            cImgSy,
            getRenderableAssetWidth(centerImg, centerAsset) || imgW,
            1,
          );

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
            const baseSideScale = isMobile ? 0.62 : 0.7;
            let finalW = imgW * baseSideScale * sideBoost;
            let finalH = imgH * baseSideScale * sideBoost;
            let dx = state.sideX[i] - finalW / 2;
            let sideTop = p5.height / 2 - finalH / 2;
            let sideBottom = p5.height / 2 + finalH / 2;

            if (y < sideTop || y > sideBottom) {
              continue;
            }

            const sideImg = media[displayIndices[i]];
            const sideAsset = getRenderableAsset(sideImg, false);
            const imgSy = p5.map(
              y,
              sideTop,
              sideBottom,
              0,
              getRenderableAssetHeight(sideImg, sideAsset) || imgH,
            );
            pgWarp.image(
              sideAsset,
              dx,
              y,
              finalW,
              1,
              0,
              imgSy,
              getRenderableAssetWidth(sideImg, sideAsset) || imgW,
              1,
            );
          }
        } else {
          // ---- TRANSITION IMAGE STATE ----
          const isMobile = p5.width < 980;
          const transitionSideBoost =
            p5.width > 1000
              ? p5.map(p5.width, 1000, 1800, 0.96, 1.08, true)
              : 1;
          const baseSideScale = isMobile ? 0.62 : 0.7;
          const sideW = imgW * baseSideScale * transitionSideBoost;
          const sideH = imgH * baseSideScale * transitionSideBoost;
          const sideTop = p5.height / 2 - sideH / 2;
          const sideBottom = p5.height / 2 + sideH / 2;
          let inStartX =
            state.transitionDir === 1
              ? state.targetSideX[1] - sideW / 2
              : state.targetSideX[0] - sideW / 2;
          let outEndX =
            state.transitionDir === 1
              ? state.targetSideX[0] - sideW / 2
              : state.targetSideX[1] - sideW / 2;

          const centerX = p5.width / 2 - imgW / 2;
          const incomingX = p5.lerp(inStartX, centerX, e);
          const outgoingX = p5.lerp(centerX, outEndX, e);
          const outgoingW = p5.lerp(imgW, sideW, e);
          const outgoingH = p5.lerp(imgH, sideH, e);
          const outgoingTop = p5.height / 2 - outgoingH / 2;
          const outgoingBottom = p5.height / 2 + outgoingH / 2;

          const inImg = media[transition.incomingIdx];
          const outImg = media[transition.outgoingIdx];
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
            pgWarp.image(
              outAsset,
              outgoingX,
              y,
              outgoingW,
              1,
              0,
              outSy,
              getRenderableAssetWidth(outImg, outAsset) || imgW,
              1,
            );
          }
          pgWarp.image(
            inAsset,
            incomingX,
            y,
            imgW,
            1,
            0,
            inSy,
            getRenderableAssetWidth(inImg, inAsset) || imgW,
            1,
          );

          let farIdx =
            state.transitionDir === 1
              ? (transition.outgoingIdx - 1 + media.length) % media.length
              : (transition.outgoingIdx + 1) % media.length;
          let farSideCX =
            state.transitionDir === 1
              ? state.targetSideX[0]
              : state.targetSideX[1];
          if (y >= sideTop && y <= sideBottom) {
            const farImg = media[farIdx];
            const farAsset = getRenderableAsset(farImg, false);
            let fSy = p5.map(
              y,
              sideTop,
              sideBottom,
              0,
              getRenderableAssetHeight(farImg, farAsset) || imgH,
            );
            pgWarp.image(
              farAsset,
              farSideCX - sideW / 2,
              y,
              sideW,
              1,
              0,
              fSy,
              getRenderableAssetWidth(farImg, farAsset) || imgW,
              1,
            );
          }
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

        let sy =
          y < topBound
            ? p5.map(
                y,
                topBound - 220,
                topBound,
                p5.height / 2 - 110,
                p5.height / 2,
              )
            : p5.map(
                y,
                bottomBound,
                bottomBound + 220,
                p5.height / 2,
                p5.height / 2 + 110,
              );

        pgWarp.image(pgText, dx, y, finalW, 1, 0, sy, p5.width, 1);
      }
    }
    p5.image(pgWarp, 0, 0);
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
        updateSideTargets(p5);
        stateRef.current.sideX = [...stateRef.current.targetSideX];
      }}
    />
  );
}

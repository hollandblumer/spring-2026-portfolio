"use client";

import { useCallback, useEffect, useRef } from "react";

export default function Preloader({
  onComplete,
  onExitStart,
  onSelectProject,
  projectIndices,
  morphEnabled = true,
  effectStrength = 1,
  glassRects = [],
  projectOpen = false,
  canExit = false,
}) {
  const frameRef = useRef(null);
  const frameLoadedRef = useRef(false);
  const exitStartedRef = useRef(false);
  const completedRef = useRef(false);

  const sendReady = useCallback(() => {
    if (!canExit || !frameLoadedRef.current) return;
    frameRef.current?.contentWindow?.postMessage(
      "portfolio-loader-ready",
      window.location.origin,
    );
  }, [canExit]);

  useEffect(() => {
    sendReady();
  }, [sendReady]);

  useEffect(() => {
    if (!frameLoadedRef.current || !projectIndices?.length) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "portfolio-grid-filter", indices: projectIndices },
      window.location.origin,
    );
  }, [projectIndices]);

  useEffect(() => {
    if (!frameLoadedRef.current) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "portfolio-grid-morph", enabled: morphEnabled },
      window.location.origin,
    );
  }, [morphEnabled]);

  useEffect(() => {
    if (!frameLoadedRef.current) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "portfolio-grid-effect-strength", value: effectStrength },
      window.location.origin,
    );
  }, [effectStrength]);

  useEffect(() => {
    if (!frameLoadedRef.current) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "portfolio-grid-glass-rects", rects: glassRects },
      window.location.origin,
    );
  }, [glassRects]);

  useEffect(() => {
    if (!frameLoadedRef.current || projectOpen) return;
    frameRef.current?.contentWindow?.postMessage(
      { type: "portfolio-grid-project-close" },
      window.location.origin,
    );
  }, [projectOpen]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow
      ) {
        return;
      }

      if (
        event.data === "portfolio-loader-exit-start" &&
        !exitStartedRef.current
      ) {
        exitStartedRef.current = true;
        onExitStart?.();
      }

      if (
        event.data === "portfolio-loader-complete" &&
        !completedRef.current
      ) {
        completedRef.current = true;
        onComplete?.();
      }

      if (
        event.data?.type === "portfolio-loader-open-project" &&
        Number.isInteger(event.data.index)
      ) {
        onSelectProject?.(event.data.index, event.data.origin);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onComplete, onExitStart, onSelectProject]);

  const handleLoad = () => {
    frameLoadedRef.current = true;
    sendReady();
    if (projectIndices?.length) {
      frameRef.current?.contentWindow?.postMessage(
        { type: "portfolio-grid-filter", indices: projectIndices },
        window.location.origin,
      );
    }
    frameRef.current?.contentWindow?.postMessage(
      { type: "portfolio-grid-morph", enabled: morphEnabled },
      window.location.origin,
    );
    frameRef.current?.contentWindow?.postMessage(
      { type: "portfolio-grid-effect-strength", value: effectStrength },
      window.location.origin,
    );
    frameRef.current?.contentWindow?.postMessage(
      { type: "portfolio-grid-glass-rects", rects: glassRects },
      window.location.origin,
    );
  };

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-transparent${projectOpen ? " pointer-events-none" : ""}`}
      role="status"
      aria-label="Loading portfolio"
    >
      <iframe
        ref={frameRef}
        src="/loader-scenes/slinky-grid.html"
        title="Loading portfolio"
        className="absolute inset-0 h-full w-full border-0"
        onLoad={handleLoad}
      />
      <span className="sr-only">Loading portfolio</span>
    </div>
  );
}

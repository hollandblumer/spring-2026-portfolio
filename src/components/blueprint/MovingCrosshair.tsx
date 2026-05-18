"use client";

import React from "react";
import type { DetectedElement } from "@/lib/posters";

export function MovingCrosshair({
  target,
  onMove,
}: {
  target: DetectedElement;
  onMove: (x: string, y: string) => void;
}) {
  function moveCrosshair(event: React.PointerEvent<HTMLDivElement>) {
    const bounds =
      event.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
    if (!bounds) return;

    const x = Math.min(
      100,
      Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100),
    );
    const y = Math.min(
      100,
      Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100),
    );

    onMove(`${x.toFixed(1)}%`, `${y.toFixed(1)}%`);
  }

  const lineMask = `radial-gradient(circle 34px at ${target.x} ${target.y}, transparent 0 32px, black 33px)`;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 transition-all duration-200 ease-out"
        style={{ maskImage: lineMask, WebkitMaskImage: lineMask }}
      >
        <div
          className="absolute left-0 h-px w-full -translate-y-1/2 bg-[#74b2c4]/76 shadow-[0_0_8px_rgba(116,178,196,0.18)]"
          style={{ top: target.y }}
        />
        <div
          className="absolute top-0 h-full w-px -translate-x-1/2 bg-[#74b2c4]/76 shadow-[0_0_8px_rgba(116,178,196,0.18)]"
          style={{ left: target.x }}
        />
      </div>
      <div
        className="absolute h-px w-px transition-all duration-200 ease-out"
        style={{ left: target.x, top: target.y }}
      >
        <div
          className="pointer-events-auto absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-move touch-none rounded-full border-2 border-[#74b2c4]/88 bg-transparent shadow-[inset_0_0_0_1px_rgba(27,28,33,0.9),0_0_14px_rgba(116,178,196,0.22)]"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            moveCrosshair(event);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            moveCrosshair(event);
          }}
        />
      </div>
    </div>
  );
}

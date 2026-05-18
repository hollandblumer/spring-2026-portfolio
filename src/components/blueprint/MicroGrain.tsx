"use client";

import { useEffect, useRef } from "react";

export function MicroGrain({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const context = ctx;

    function generateMicroGrain() {
      if (!canvas) return;

      const scale = 2;
      const width = Math.max(1, Math.floor(canvas.offsetWidth * scale));
      const height = Math.max(1, Math.floor(canvas.offsetHeight * scale));

      canvas.width = width;
      canvas.height = height;

      const imageData = context.createImageData(width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const val = Math.random() * 255;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 255;
      }

      context.putImageData(imageData, 0, 0);
    }

    const resizeObserver = new ResizeObserver(generateMicroGrain);
    resizeObserver.observe(canvas);
    generateMicroGrain();

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply opacity-15 ${className}`}
      aria-hidden="true"
    />
  );
}

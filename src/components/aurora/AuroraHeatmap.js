"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import styles from "./AuroraForecastApp.module.css";

function hexPoint(progress, radius) {
  const segment = Math.floor(progress * 6);
  const localProgress = (progress * 6) % 1;
  const point = (index) => {
    const angle = -Math.PI / 2 + ((index % 6) / 6) * Math.PI * 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  };
  const start = point(segment);
  const end = point(segment + 1);
  return {
    x: start.x + (end.x - start.x) * localProgress,
    y: start.y + (end.y - start.y) * localProgress,
    angle: Math.atan2(end.y - start.y, end.x - start.x),
  };
}

export default function AuroraHeatmap({ chance, cloudCover, location, origin, status, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    let frame = 0;
    let width = 0;
    let height = 0;
    let elapsed = 0;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      context.fillStyle = "#010408";
      context.fillRect(0, 0, width, height);
    };

    const drawWordRing = (word, radius, count, fontSize, reverse, intensity) => {
      const characters = word.toUpperCase().split("");
      context.save();
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `550 ${fontSize}px ${getComputedStyle(document.body).fontFamily}`;
      context.globalCompositeOperation = "screen";

      for (let index = 0; index < count; index += 1) {
        const progress = (index / count + elapsed * (reverse ? -0.008 : 0.005)) % 1;
        const point = hexPoint(progress < 0 ? progress + 1 : progress, radius);
        const pulse = 0.55 + Math.sin(elapsed * 1.4 + index * 0.48) * 0.18;
        context.save();
        context.translate(width / 2 + point.x, height / 2 + point.y);
        context.rotate(point.angle + (reverse ? -Math.PI / 2 : Math.PI / 2));
        context.shadowBlur = 22 + intensity * 30;
        context.shadowColor = index % 5 === 0 ? "#a66cff" : "#58ff9b";
        context.fillStyle = index % 5 === 0
          ? `rgba(166, 108, 255, ${pulse * intensity})`
          : `rgba(88, 255, 155, ${pulse * intensity})`;
        context.fillText(characters[index % characters.length], 0, 0);
        context.restore();
      }
      context.restore();
    };

    const render = () => {
      elapsed += 1 / 60;
      const shortestSide = Math.min(width, height);
      const intensity = 0.28 + chance / 180;

      context.save();
      context.globalCompositeOperation = "copy";
      context.translate(width / 2, height / 2);
      context.scale(0.991, 0.991);
      context.translate(-width / 2, -height / 2);
      context.drawImage(canvas, 0, 0);
      context.restore();

      context.fillStyle = "rgba(1, 4, 8, 0.055)";
      context.fillRect(0, 0, width, height);

      drawWordRing("AURORA", shortestSide * 0.36, 54, Math.max(17, shortestSide * 0.038), false, intensity);
      drawWordRing("FORECAST", shortestSide * 0.17, 30, Math.max(11, shortestSide * 0.021), true, intensity * 0.86);

      const core = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, shortestSide * 0.12);
      core.addColorStop(0, "rgba(1, 4, 8, 1)");
      core.addColorStop(0.72, "rgba(1, 4, 8, 0.88)");
      core.addColorStop(1, "rgba(1, 4, 8, 0)");
      context.fillStyle = core;
      context.fillRect(0, 0, width, height);

      frame = window.requestAnimationFrame(render);
    };

    resize();
    render();
    window.addEventListener("resize", resize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [chance]);

  return (
    <div
      className={styles.heatmapExperience}
      role="dialog"
      aria-modal="true"
      aria-label="Aurora signal heat map"
      style={{ "--origin-x": `${origin.x}px`, "--origin-y": `${origin.y}px` }}
    >
      <canvas ref={canvasRef} className={styles.heatmapCanvas} aria-hidden="true" />
      <div className={styles.heatmapBackdrop} aria-hidden="true" />
      <div className={styles.heatmapWordTransition} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <span key={index}>Aurora</span>)}
      </div>
      <header className={styles.heatmapHeader}>
        <div>
          <span>Signal heat map</span>
          <strong>{location}</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Close signal heat map"><X size={18} /></button>
      </header>
      <div className={styles.heatmapCore}>
        <span>Local visibility</span>
        <strong>{chance}%</strong>
        <p>{status} · {cloudCover}% cloud cover</p>
      </div>
      <div className={styles.heatmapLegend}>
        <span><i className={styles.legendLow} /> Low signal</span>
        <span><i className={styles.legendHigh} /> High signal</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

const EDGE_COLOR = {
  r: 128,
  g: 129,
  b: 133,
};
const VECTOR_FILL_ALPHA = 220;
const EDGE_ERODE_ALPHA_THRESHOLD = 150;

export function BlueprintCanvas({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const w = 900;
      const h = 1200;

      canvas.width = w;
      canvas.height = h;

      const scale = Math.min(w / img.width, h / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const x = (w - drawW) / 2;
      const y = (h - drawH) / 2;

      const temp = document.createElement("canvas");
      const tctx = temp.getContext("2d", { willReadFrequently: true });
      if (!tctx) return;

      temp.width = w;
      temp.height = h;

      tctx.fillStyle = "#1b1d23";
      tctx.fillRect(0, 0, w, h);
      tctx.drawImage(img, x, y, drawW, drawH);

      const imgData = tctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const gray = new Float32Array(w * h);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
      }

      const blurX = new Float32Array(w * h);
      const smoothedGray = new Float32Array(w * h);
      const blurKernel = [1, 4, 6, 4, 1];
      const blurWeight = 16;

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const i = py * w + px;
          let sum = 0;

          for (let k = -2; k <= 2; k++) {
            const sx = Math.min(w - 1, Math.max(0, px + k));
            sum += gray[py * w + sx] * blurKernel[k + 2];
          }

          blurX[i] = sum / blurWeight;
        }
      }

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const i = py * w + px;
          let sum = 0;

          for (let k = -2; k <= 2; k++) {
            const sy = Math.min(h - 1, Math.max(0, py + k));
            sum += blurX[sy * w + px] * blurKernel[k + 2];
          }

          smoothedGray[i] = sum / blurWeight;
        }
      }

      const edgeData = ctx.createImageData(w, h);
      const edge = edgeData.data;
      const mask = new Uint8Array(w * h);

      for (let py = 1; py < h - 1; py++) {
        for (let px = 1; px < w - 1; px++) {
          const i = py * w + px;
          const out = i * 4;

          const gx =
            -smoothedGray[i - w - 1] +
            smoothedGray[i - w + 1] -
            2 * smoothedGray[i - 1] +
            2 * smoothedGray[i + 1] -
            smoothedGray[i + w - 1] +
            smoothedGray[i + w + 1];

          const gy =
            -smoothedGray[i - w - 1] -
            2 * smoothedGray[i - w] -
            smoothedGray[i - w + 1] +
            smoothedGray[i + w - 1] +
            2 * smoothedGray[i + w] +
            smoothedGray[i + w + 1];

          const mag = Math.sqrt(gx * gx + gy * gy);

          const framePadding = 14;

          const nearImageFrame =
            Math.abs(px - x) < framePadding ||
            Math.abs(px - (x + drawW)) < framePadding ||
            Math.abs(py - y) < framePadding ||
            Math.abs(py - (y + drawH)) < framePadding;

          if (nearImageFrame) {
            edge[out + 3] = 0;
            continue;
          }

          if (mag > 95) {
            edge[out] = EDGE_COLOR.r;
            edge[out + 1] = EDGE_COLOR.g;
            edge[out + 2] = EDGE_COLOR.b;
            edge[out + 3] = Math.min(255, 220 + (mag - 95) * 1.9);
            mask[i] = 1;
          } else if (mag > 58) {
            edge[out] = EDGE_COLOR.r;
            edge[out + 1] = EDGE_COLOR.g;
            edge[out + 2] = EDGE_COLOR.b;
            edge[out + 3] = Math.min(190, 82 + (mag - 58) * 2.6);
            mask[i] = 1;
          } else {
            edge[out + 3] = 0;
          }
        }
      }

      const cleanupZone = (px: number, py: number) => {
        const topRightCaption =
          px > x + drawW * 0.42 &&
          px < x + drawW * 0.98 &&
          py > y + drawH * 0.015 &&
          py < y + drawH * 0.15;

        const bottomCaption =
          px > x + drawW * 0.0 &&
          px < x + drawW * 1.0 &&
          py > y + drawH * 0.88 &&
          py < y + drawH * 0.995;

        return topRightCaption || bottomCaption;
      };

      const visited = new Uint8Array(w * h);
      const stack: number[] = [];

      for (let py = 1; py < h - 1; py++) {
        for (let px = 1; px < w - 1; px++) {
          const start = py * w + px;

          if (!mask[start] || visited[start] || !cleanupZone(px, py)) continue;

          const pixels: number[] = [];
          let minX = px;
          let maxX = px;
          let minY = py;
          let maxY = py;
          let alphaSum = 0;

          stack.length = 0;
          stack.push(start);
          visited[start] = 1;

          while (stack.length) {
            const idx = stack.pop()!;
            pixels.push(idx);

            const cx = idx % w;
            const cy = Math.floor(idx / w);

            minX = Math.min(minX, cx);
            maxX = Math.max(maxX, cx);
            minY = Math.min(minY, cy);
            maxY = Math.max(maxY, cy);

            alphaSum += edge[idx * 4 + 3];

            const neighbors = [
              idx - 1,
              idx + 1,
              idx - w,
              idx + w,
              idx - w - 1,
              idx - w + 1,
              idx + w - 1,
              idx + w + 1,
            ];

            for (const nIdx of neighbors) {
              if (nIdx <= 0 || nIdx >= w * h) continue;

              const nx = nIdx % w;
              const ny = Math.floor(nIdx / w);

              if (mask[nIdx] && !visited[nIdx] && cleanupZone(nx, ny)) {
                visited[nIdx] = 1;
                stack.push(nIdx);
              }
            }
          }

          const count = pixels.length;
          const compW = maxX - minX + 1;
          const compH = maxY - minY + 1;
          const ratio = compW / Math.max(1, compH);
          const avgAlpha = alphaSum / Math.max(1, count);
          const density = count / Math.max(1, compW * compH);

          const smallTextBlob =
            count < 1000 && compH < 42 && compW < 270 && density > 0.045;

          const flatCaptionBlob =
            count < 1700 && compH < 32 && ratio > 1.45 && density > 0.035;

          const faintTextResidue =
            count < 1400 && compH < 44 && avgAlpha < 230 && density > 0.025;

          if (smallTextBlob || flatCaptionBlob || faintTextResidue) {
            for (const idx of pixels) {
              edge[idx * 4 + 3] = 0;
              mask[idx] = 0;
            }
          }
        }
      }

      const rightCornerZone = (px: number, py: number) =>
        px > x + drawW * 0.64 &&
        px < x + drawW * 0.8 &&
        py > y + drawH * 0.8 &&
        py < y + drawH * 0.93;

      const visitedRight = new Uint8Array(w * h);
      const stackRight: number[] = [];

      for (let py = 1; py < h - 1; py++) {
        for (let px = 1; px < w - 1; px++) {
          const start = py * w + px;

          if (!mask[start] || visitedRight[start] || !rightCornerZone(px, py)) {
            continue;
          }

          const pixels: number[] = [];
          let minX = px;
          let maxX = px;
          let minY = py;
          let maxY = py;

          stackRight.length = 0;
          stackRight.push(start);
          visitedRight[start] = 1;

          while (stackRight.length) {
            const idx = stackRight.pop()!;
            pixels.push(idx);

            const cx = idx % w;
            const cy = Math.floor(idx / w);

            minX = Math.min(minX, cx);
            maxX = Math.max(maxX, cx);
            minY = Math.min(minY, cy);
            maxY = Math.max(maxY, cy);

            const neighbors = [
              idx - 1,
              idx + 1,
              idx - w,
              idx + w,
              idx - w - 1,
              idx - w + 1,
              idx + w - 1,
              idx + w + 1,
            ];

            for (const nIdx of neighbors) {
              if (nIdx <= 0 || nIdx >= w * h) continue;

              const nx = nIdx % w;
              const ny = Math.floor(nIdx / w);

              if (
                mask[nIdx] &&
                !visitedRight[nIdx] &&
                rightCornerZone(nx, ny)
              ) {
                visitedRight[nIdx] = 1;
                stackRight.push(nIdx);
              }
            }
          }

          const count = pixels.length;
          const compW = maxX - minX + 1;
          const compH = maxY - minY + 1;
          const ratio = compW / Math.max(1, compH);
          const density = count / Math.max(1, compW * compH);

          const looksLikeSmallCaption =
            count < 900 && compH < 34 && compW < 220 && density > 0.035;

          const looksLikeTinyWord = count < 500 && compH < 26 && ratio > 1.2;

          if (looksLikeSmallCaption || looksLikeTinyWord) {
            for (const idx of pixels) {
              edge[idx * 4 + 3] = 0;
              mask[idx] = 0;
            }
          }
        }
      }

      // Erode boundary pixels before bridging so the blueprint strokes stay lean.
      const eroded = new Uint8ClampedArray(edge);

      for (let py = 1; py < h - 1; py++) {
        for (let px = 1; px < w - 1; px++) {
          const i = py * w + px;
          const out = i * 4;
          const alpha = edge[out + 3];

          if (!alpha) continue;

          const left = edge[(i - 1) * 4 + 3] > 0;
          const right = edge[(i + 1) * 4 + 3] > 0;
          const top = edge[(i - w) * 4 + 3] > 0;
          const bottom = edge[(i + w) * 4 + 3] > 0;
          const cardinalCount =
            Number(left) + Number(right) + Number(top) + Number(bottom);

          if (alpha < EDGE_ERODE_ALPHA_THRESHOLD || cardinalCount < 3) {
            eroded[out + 3] = 0;
          }
        }
      }

      edge.set(eroded);

      // Bridge only single-pixel gaps so the vector pass does not thicken strokes.
      const lineMask = new Uint8Array(w * h);

      for (let i = 0; i < w * h; i++) {
        lineMask[i] = edge[i * 4 + 3] > 70 ? 1 : 0;
      }

      const bridged = new Uint8Array(w * h);

      for (let py = 2; py < h - 2; py++) {
        for (let px = 2; px < w - 2; px++) {
          const i = py * w + px;
          if (lineMask[i]) continue;

          const horizontal =
            lineMask[i - 1] &&
            lineMask[i - 2] &&
            lineMask[i + 1] &&
            lineMask[i + 2];

          const vertical =
            lineMask[i - w] &&
            lineMask[i - 2 * w] &&
            lineMask[i + w] &&
            lineMask[i + 2 * w];

          const diag1 =
            lineMask[i - w - 1] &&
            lineMask[i - 2 * w - 2] &&
            lineMask[i + w + 1] &&
            lineMask[i + 2 * w + 2];

          const diag2 =
            lineMask[i - w + 1] &&
            lineMask[i - 2 * w + 2] &&
            lineMask[i + w - 1] &&
            lineMask[i + 2 * w - 2];

          if (horizontal || vertical || diag1 || diag2) {
            bridged[i] = 1;
          }
        }
      }

      for (let i = 0; i < w * h; i++) {
        const out = i * 4;

        if (bridged[i]) {
          const existingAlpha = edge[out + 3];
          if (existingAlpha) continue;

          edge[out] = EDGE_COLOR.r;
          edge[out + 1] = EDGE_COLOR.g;
          edge[out + 2] = EDGE_COLOR.b;
          edge[out + 3] = VECTOR_FILL_ALPHA;
        }
      }

      const softened = new Uint8ClampedArray(edge);

      for (let py = 1; py < h - 1; py++) {
        for (let px = 1; px < w - 1; px++) {
          const i = py * w + px;
          const out = i * 4;

          if (!edge[out + 3]) continue;

          let alphaSum = edge[out + 3] * 4;
          let weightSum = 4;

          const neighbors = [
            i - 1,
            i + 1,
            i - w,
            i + w,
            i - w - 1,
            i - w + 1,
            i + w - 1,
            i + w + 1,
          ];

          for (const nIdx of neighbors) {
            const a = edge[nIdx * 4 + 3];
            alphaSum += a;
            weightSum += 1;
          }

          softened[out] = EDGE_COLOR.r;
          softened[out + 1] = EDGE_COLOR.g;
          softened[out + 2] = EDGE_COLOR.b;
          softened[out + 3] = Math.max(edge[out + 3], alphaSum / weightSum);
        }
      }

      edge.set(softened);

      ctx.putImageData(edgeData, 0, 0);
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full object-contain"
    />
  );
}

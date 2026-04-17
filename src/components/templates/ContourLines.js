"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bricolage_Grotesque,
  Libre_Baskerville,
  Monoton,
  Shrikhand,
} from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const baskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const shrikhand = Shrikhand({
  subsets: ["latin"],
  weight: "400",
});

const monoton = Monoton({
  subsets: ["latin"],
  weight: "400",
});

const FONT_OPTIONS = [
  {
    id: "bricolage",
    name: "Bricolage",
    fontFamily: bricolage.style.fontFamily,
    className: bricolage.className,
    weight: 800,
  },
  {
    id: "baskerville",
    name: "Baskerville",
    fontFamily: baskerville.style.fontFamily,
    className: baskerville.className,
    weight: 700,
  },
  {
    id: "shrikhand",
    name: "Shrikhand",
    fontFamily: shrikhand.style.fontFamily,
    className: shrikhand.className,
    weight: 400,
  },
  {
    id: "monoton",
    name: "Monoton",
    fontFamily: monoton.style.fontFamily,
    className: monoton.className,
    weight: 400,
  },
];
const DEFAULT_FONT_ID = "bricolage";
const FONT_CLASS_NAMES = FONT_OPTIONS.map((fontOption) => fontOption.className).join(" ");
const EXPORT_VIDEO_SECONDS = 7;
const EXPORT_VIDEO_MS = EXPORT_VIDEO_SECONDS * 1000;

function getFontOption(fontId) {
  return (
    FONT_OPTIONS.find((fontOption) => fontOption.id === fontId) ||
    FONT_OPTIONS[0]
  );
}

const DEFAULT_COLOR_STOPS = [
  { id: "text", value: "#ffffff" },
  { id: "orange", value: "#f76833" },
  { id: "black-1", value: "#0c0c0c" },
  { id: "blue", value: "#4c65f0" },
  { id: "black-2", value: "#0c0c0c" },
  { id: "paper", value: "#fffaeb" },
  { id: "black-3", value: "#0c0c0c" },
  { id: "yellow", value: "#ffc60b" },
  { id: "black-4", value: "#0c0c0c" },
  { id: "green", value: "#266141" },
  { id: "black-5", value: "#0c0c0c" },
];

const COLOR_PALETTES = [
  {
    name: "Original",
    stops: DEFAULT_COLOR_STOPS,
  },
  {
    name: "Purple Yellow",
    stops: [
      { id: "text", value: "#fff7c8" },
      { id: "purple-1", value: "#6f35ff" },
      { id: "black-1", value: "#0c0c0c" },
      { id: "yellow-1", value: "#ffd51c" },
      { id: "black-2", value: "#0c0c0c" },
      { id: "purple-2", value: "#b27cff" },
      { id: "black-3", value: "#0c0c0c" },
      { id: "yellow-2", value: "#fff06a" },
      { id: "black-4", value: "#0c0c0c" },
    ],
  },
  {
    name: "Forest Paper",
    stops: [
      { id: "text", value: "#fff9df" },
      { id: "green-1", value: "#266141" },
      { id: "black-1", value: "#0c0c0c" },
      { id: "paper", value: "#fffaeb" },
      { id: "black-2", value: "#0c0c0c" },
      { id: "olive", value: "#6a7040" },
      { id: "black-3", value: "#0c0c0c" },
    ],
  },
  {
    name: "Blue Cream",
    stops: [
      { id: "text", value: "#fffaf0" },
      { id: "blue-1", value: "#1e4cff" },
      { id: "black-1", value: "#0c0c0c" },
      { id: "cream", value: "#fff1c7" },
      { id: "black-2", value: "#0c0c0c" },
      { id: "cyan", value: "#43d5e8" },
      { id: "black-3", value: "#0c0c0c" },
    ],
  },
  {
    name: "Hot Citrus",
    stops: [
      { id: "text", value: "#ffffff" },
      { id: "orange", value: "#ff5a1f" },
      { id: "black-1", value: "#0c0c0c" },
      { id: "yellow", value: "#ffe100" },
      { id: "black-2", value: "#0c0c0c" },
      { id: "pink", value: "#ff3d9a" },
      { id: "black-3", value: "#0c0c0c" },
    ],
  },
  {
    name: "Mono Silver",
    stops: [
      { id: "text", value: "#ffffff" },
      { id: "silver-1", value: "#f2f2f2" },
      { id: "black-1", value: "#0c0c0c" },
      { id: "silver-2", value: "#9b9b9b" },
      { id: "black-2", value: "#0c0c0c" },
      { id: "silver-3", value: "#d7d7d7" },
      { id: "black-3", value: "#0c0c0c" },
    ],
  },
];

const DEFAULT_TEXT_LAYERS = [
  {
    id: "main",
    label: "Main text",
    defaultLabel: "Main text",
    text: "Templates",
    defaultText: "Templates",
    x: 50,
    defaultX: 50,
    y: 48,
    defaultY: 48,
    size: 0.17,
    defaultSize: 0.17,
    fontId: DEFAULT_FONT_ID,
    tracking: -3,
    align: "center",
  },
  {
    id: "sub",
    label: "Sub text",
    defaultLabel: "Sub text",
    text: "OUT NOW",
    defaultText: "OUT NOW",
    x: 50,
    defaultX: 50,
    y: 58,
    defaultY: 58,
    size: 0.065,
    defaultSize: 0.065,
    fontId: DEFAULT_FONT_ID,
    tracking: -1.5,
    align: "center",
  },
  {
    id: "top-left",
    label: "Top left",
    defaultLabel: "Top left",
    text: "VOL. 01",
    defaultText: "VOL. 01",
    x: 8,
    defaultX: 8,
    y: 8,
    defaultY: 8,
    size: 0.031,
    defaultSize: 0.031,
    fontId: DEFAULT_FONT_ID,
    tracking: 0,
    align: "left",
  },
  {
    id: "top-right",
    label: "Top right",
    defaultLabel: "Top right",
    text: "2026",
    defaultText: "2026",
    x: 92,
    defaultX: 92,
    y: 8,
    defaultY: 8,
    size: 0.031,
    defaultSize: 0.031,
    fontId: DEFAULT_FONT_ID,
    tracking: 0,
    align: "right",
  },
  {
    id: "bottom-left",
    label: "Bottom left",
    defaultLabel: "Bottom left",
    text: "SYSTEM",
    defaultText: "SYSTEM",
    x: 8,
    defaultX: 8,
    y: 92,
    defaultY: 92,
    size: 0.031,
    defaultSize: 0.031,
    fontId: DEFAULT_FONT_ID,
    tracking: 0,
    align: "left",
  },
  {
    id: "bottom-right",
    label: "Bottom right",
    defaultLabel: "Bottom right",
    text: "ASSETS",
    defaultText: "ASSETS",
    x: 92,
    defaultX: 92,
    y: 92,
    defaultY: 92,
    size: 0.031,
    defaultSize: 0.031,
    fontId: DEFAULT_FONT_ID,
    tracking: 0,
    align: "right",
  },
];

function edt1d(f, n) {
  const v = new Int32Array(n);
  const z = new Float32Array(n + 1);
  const d = new Float32Array(n);
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;

  for (let q = 1; q < n; q++) {
    let s;
    while (true) {
      const vk = v[k];
      s = ((f[q] + q * q) - (f[vk] + vk * vk)) / (2 * q - 2 * vk);
      if (s > z[k]) break;
      k--;
      if (k < 0) {
        k = 0;
        break;
      }
    }
    k++;
    v[k] = q;
    z[k + 1] = Infinity;
    z[k] = s;
  }

  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const vk = v[k];
    const dx = q - vk;
    d[q] = dx * dx + f[vk];
  }
  return d;
}

function edt2d(mask, w, h) {
  const inf = 1e20;
  const rowBuf = new Float32Array(w);
  const tmp = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    const base = y * w;
    for (let x = 0; x < w; x++) {
      rowBuf[x] = mask[base + x] ? 0 : inf;
    }
    const row = edt1d(rowBuf, w);
    for (let x = 0; x < w; x++) {
      tmp[base + x] = row[x];
    }
  }

  const colBuf = new Float32Array(h);
  const out = new Float32Array(w * h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      colBuf[y] = tmp[x + y * w];
    }
    const col = edt1d(colBuf, h);
    for (let y = 0; y < h; y++) {
      out[x + y * w] = col[y];
    }
  }
  return out;
}

function drawTextTracked(ctx, text, x, y, trackingPx, align = "center") {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    trackingPx * Math.max(0, chars.length - 1);

  let cursorX = x;
  if (align === "center") cursorX = x - total / 2;
  if (align === "right") cursorX = x - total;

  chars.forEach((ch, index) => {
    ctx.fillText(ch, cursorX, y);
    cursorX += widths[index] + trackingPx;
  });
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function clonePalette(stops) {
  return stops.map((stop) => ({ ...stop }));
}

const COLOR_BANK_HEXES = [
  "#003c96",
  "#005062",
  "#0057cc",
  "#0081fe",
  "#00ab55",
  "#02b70e",
  "#032613",
  "#045328",
  "#05140c",
  "#053d1f",
  "#054221",
  "#056b34",
  "#05d50b",
  "#068440",
  "#06c755",
  "#07552b",
  "#075a2d",
  "#0866ff",
  "#097239",
  "#0b0b0a",
  "#0b2819",
  "#0cbd2a",
  "#0cbe2a",
  "#0f1a52",
  "#103c25",
  "#11a69c",
  "#132167",
  "#17287d",
  "#181816",
  "#1d2f86",
  "#1e3dd7",
  "#22379b",
  "#223aaa",
  "#229ed9",
  "#22a596",
  "#238b53",
  "#240029",
  "#242421",
  "#25d366",
  "#262622",
  "#273eb0",
  "#2741bf",
  "#289f5f",
  "#291000",
  "#2aabee",
  "#2b48d4",
  "#2c4be2",
  "#2d2d29",
  "#2db46c",
  "#33332e",
  "#36362b",
  "#376df6",
  "#380000",
  "#3a0042",
  "#3b3b36",
  "#3e2723",
  "#400387",
  "#4189ed",
  "#421b00",
  "#435ee5",
  "#474742",
  "#494943",
  "#5069e8",
  "#51005c",
  "#520000",
  "#55185e",
  "#55554f",
  "#556717",
  "#583b91",
  "#5865f2",
  "#5a5a54",
  "#5b74f0",
  "#5bd292",
  "#5bf675",
  "#5c2500",
  "#600606",
  "#612700",
  "#617bff",
  "#62625b",
  "#64656c",
  "#660e00",
  "#676760",
  "#677eee",
  "#681d72",
  "#6845ab",
  "#6b0000",
  "#6c1e76",
  "#6fd7a0",
  "#7360f2",
  "#74746c",
  "#767676",
  "#774fc4",
  "#780808",
  "#787873",
  "#7a2286",
  "#7a3100",
  "#7a90ff",
  "#7e238b",
  "#803300",
  "#83ddad",
  "#85857f",
  "#860909",
  "#8e279b",
  "#8f8f8f",
  "#900909",
  "#90f0e1",
  "#91289f",
  "#91918c",
  "#924af7",
  "#92a4ff",
  "#943b00",
  "#993d00",
  "#9e0a0a",
  "#9ee5bf",
  "#a02caf",
  "#a8b7ff",
  "#ad0b0b",
  "#b0b0a6",
  "#b2001b",
  "#b21371",
  "#b24700",
  "#b331c4",
  "#b3ebcd",
  "#b60c0c",
  "#b8c2ff",
  "#bcbcb3",
  "#bcecd1",
  "#bd31a0",
  "#c2ccff",
  "#c45205",
  "#c50c0c",
  "#c548d6",
  "#c75258",
  "#c7f0da",
  "#c7f783",
  "#c85bd2",
  "#c8c8c1",
  "#c9caa3",
  "#cbb5f5",
  "#cc001f",
  "#cc5dda",
  "#cecec5",
  "#cf5606",
  "#cff1df",
  "#d06111",
  "#d17711",
  "#d1842d",
  "#d1d8ff",
  "#d271df",
  "#d4b0ff",
  "#d7c797",
  "#dadad3",
  "#dadada",
  "#db5b06",
  "#dbe1ff",
  "#dccdfa",
  "#dce9fa",
  "#dd0e0e",
  "#de2c62",
  "#e0e0d6",
  "#e0e3ff",
  "#e2e2e2",
  "#e3f7ec",
  "#e57534",
  "#e5e5e0",
  "#e60023",
  "#e76ff6",
  "#eb87f7",
  "#ebe2fd",
  "#ebebe5",
  "#ebeeff",
  "#ede9e6",
  "#ef9ff9",
  "#efefeb",
  "#f2681f",
  "#f3eee8",
  "#f50a0a",
  "#f5adff",
  "#f5f8f9",
  "#f6f6f3",
  "#f72c2c",
  "#f84f4f",
  "#f8b8ff",
  "#f8c7ff",
  "#fad1ff",
  "#faf7e6",
  "#fbdfff",
  "#fbfbf9",
  "#fdebff",
  "#fe7920",
  "#fe8839",
  "#fe9752",
  "#ff0076",
  "#ff4500",
  "#ff5383",
  "#ff5c5c",
  "#ff7575",
  "#ff8f8f",
  "#ff944d",
  "#ffa366",
  "#ffa3a3",
  "#ffa570",
  "#ffb380",
  "#ffb8b8",
  "#ffbdbd",
  "#ffc199",
  "#ffd0ad",
  "#ffd0b2",
  "#ffd1d1",
  "#ffd7d7",
  "#ffdec7",
  "#ffe0cc",
  "#ffe40d",
  "#ffeb3b",
  "#ffebeb",
  "#ffede0",
  "#fffc00",
  "#ffffff",
];

function randomColorBankHex(usedColors) {
  const availableColors = COLOR_BANK_HEXES.filter(
    (color) => !usedColors.has(color),
  );
  const sourceColors = availableColors.length > 0 ? availableColors : COLOR_BANK_HEXES;
  const nextColor = sourceColors[Math.floor(Math.random() * sourceColors.length)];
  usedColors.add(nextColor);
  return nextColor;
}

export default function ContourLines() {
  const canvasRef = useRef(null);
  const shellRef = useRef(null);
  const textCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const dragLayerIdRef = useRef(null);
  const dragColorIdRef = useRef(null);
  const textLayersRef = useRef(DEFAULT_TEXT_LAYERS);
  const fieldRef = useRef({
    width: 0,
    height: 0,
    dpr: 1,
    dist2: null,
    insideMask: null,
  });

  const [textLayers, setTextLayers] = useState(DEFAULT_TEXT_LAYERS);
  const [showLayerLabels, setShowLayerLabels] = useState(false);
  const [colorStops, setColorStops] = useState(() =>
    clonePalette(DEFAULT_COLOR_STOPS),
  );
  const [bandWidth, setBandWidth] = useState(8);
  const [flowSpeed, setFlowSpeed] = useState(28);
  const [fontScale, setFontScale] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const textColor = useMemo(() => hexToRgb(colorStops[0].value), [colorStops]);
  const contourPalette = useMemo(
    () => colorStops.slice(1).map((stop) => hexToRgb(stop.value)),
    [colorStops],
  );

  useEffect(() => {
    textLayersRef.current = textLayers;
  }, [textLayers]);

  function updateTextLayer(id, patch) {
    setTextLayers((layers) =>
      layers.map((layer) =>
        layer.id === id ? { ...layer, ...patch } : layer,
      ),
    );
  }

  function addTextLayer() {
    setTextLayers((layers) => [
      ...layers,
      {
        id: `custom-${Date.now()}`,
        label: `Text ${layers.length + 1}`,
        defaultLabel: `Text ${layers.length + 1}`,
        text: "NEW TEXT",
        defaultText: "NEW TEXT",
        x: 50,
        defaultX: 50,
        y: 50,
        defaultY: 50,
        size: 0.08,
        defaultSize: 0.08,
        fontId: DEFAULT_FONT_ID,
        tracking: -1,
        align: "center",
      },
    ]);
  }

  function resetTextLayer(id) {
    setTextLayers((layers) =>
      layers.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              x: layer.defaultX,
              y: layer.defaultY,
              size: layer.defaultSize,
            }
          : layer,
      ),
    );
  }

  function updateColorStop(id, value) {
    setColorStops((stops) =>
      stops.map((stop) => (stop.id === id ? { ...stop, value } : stop)),
    );
  }

  function addContourColor() {
    setColorStops((stops) => [
      ...stops,
      {
        id: `color-${Date.now()}`,
        value: "#cfcfcf",
      },
    ]);
  }

  function randomizeContourColors() {
    setColorStops((stops) => {
      const usedColors = new Set();
      return stops.map((stop) => ({
        ...stop,
        value: randomColorBankHex(usedColors),
      }));
    });
  }

  function deleteContourColor(id) {
    setColorStops((stops) => {
      const lineStops = stops.slice(1);
      if (lineStops.length <= 1) return stops;
      return stops.filter((stop) => stop.id === "text" || stop.id !== id);
    });
  }

  function handleColorDragStart(id, event) {
    dragColorIdRef.current = id;
    event.dataTransfer.effectAllowed = "move";
  }

  function handleColorDragOver(event) {
    event.preventDefault();
  }

  function handleColorDrop(targetId, event) {
    event.preventDefault();
    const sourceId = dragColorIdRef.current;
    dragColorIdRef.current = null;
    if (!sourceId || sourceId === targetId) return;

    setColorStops((stops) => {
      const textStop = stops[0];
      const lineStops = stops.slice(1);
      const sourceIndex = lineStops.findIndex((stop) => stop.id === sourceId);
      const targetIndex = lineStops.findIndex((stop) => stop.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return stops;

      const nextLineStops = [...lineStops];
      const [moved] = nextLineStops.splice(sourceIndex, 1);
      nextLineStops.splice(targetIndex, 0, moved);

      return [textStop, ...nextLineStops];
    });
  }

  function getPointerPosition(event) {
    const shell = shellRef.current;
    if (!shell) return null;

    const rect = shell.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    return {
      x: Math.min(100, Math.max(0, Math.round(x))),
      y: Math.min(100, Math.max(0, Math.round(y))),
    };
  }

  function findClosestLayer(point) {
    let closestLayer = null;
    let closestDistance = Infinity;

    textLayersRef.current.forEach((layer) => {
      const dx = layer.x - point.x;
      const dy = layer.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < closestDistance) {
        closestLayer = layer;
        closestDistance = distance;
      }
    });

    return closestDistance <= 16 ? closestLayer : null;
  }

  function moveLayerToPointer(id, event) {
    const point = getPointerPosition(event);
    if (!point) return;
    updateTextLayer(id, point);
  }

  function handleDragStart(id, event) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragLayerIdRef.current = id;
    moveLayerToPointer(id, event);
  }

  function handleCanvasPointerDown(event) {
    const point = getPointerPosition(event);
    if (!point) return;

    const layer = findClosestLayer(point);
    if (!layer) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragLayerIdRef.current = layer.id;
    updateTextLayer(layer.id, point);
  }

  function handlePointerMove(event) {
    if (!dragLayerIdRef.current) return;
    moveLayerToPointer(dragLayerIdRef.current, event);
  }

  function handlePointerUp(event) {
    if (dragLayerIdRef.current) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    dragLayerIdRef.current = null;
  }

  const buildDistanceField = useCallback(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell) return;

    const rect = shell.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));

    canvas.width = width;
    canvas.height = height;

    const textCanvas = textCanvasRef.current || document.createElement("canvas");
    textCanvasRef.current = textCanvas;
    textCanvas.width = width;
    textCanvas.height = height;

    const textCtx = textCanvas.getContext("2d", { willReadFrequently: true });
    if (!textCtx) return;

    textCtx.setTransform(1, 0, 0, 1, 0, 0);
    textCtx.clearRect(0, 0, width, height);
    textCtx.fillStyle = "white";
    textCtx.textBaseline = "middle";

    textLayers.forEach((layer) => {
      const text = layer.text.trim();
      if (!text) return;

      const fontSize = width * layer.size * fontScale;
      const layerFont = getFontOption(layer.fontId);
      textCtx.font = `${layerFont.weight} ${fontSize}px ${layerFont.fontFamily}, sans-serif`;
      drawTextTracked(
        textCtx,
        text,
        width * (layer.x / 100),
        height * (layer.y / 100),
        layer.tracking * dpr,
        layer.align,
      );
    });

    const image = textCtx.getImageData(0, 0, width, height);
    const insideMask = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      insideMask[i] = image.data[i * 4 + 3] > 128 ? 1 : 0;
    }

    fieldRef.current = {
      width,
      height,
      dpr,
      insideMask,
      dist2: edt2d(insideMask, width, height),
    };
  }, [fontScale, textLayers]);

  const render = useCallback(
    (timeSec) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });
      const { width, height, dpr, insideMask, dist2 } = fieldRef.current;
      if (!canvas || !ctx || !insideMask || !dist2) return;

      const output = ctx.createImageData(width, height);
      const pixels = output.data;
      const offset = timeSec * flowSpeed * dpr;
      const scaledBandWidth = bandWidth * dpr;
      const linePalette = contourPalette.length > 0
        ? contourPalette
        : [{ r: 12, g: 12, b: 12 }];

      for (let i = 0; i < width * height; i++) {
        const pixelIndex = i * 4;
        if (insideMask[i]) {
          pixels[pixelIndex] = textColor.r;
          pixels[pixelIndex + 1] = textColor.g;
          pixels[pixelIndex + 2] = textColor.b;
          pixels[pixelIndex + 3] = 255;
          continue;
        }

        const distance = Math.sqrt(dist2[i]);
        const phase = (distance - offset) / scaledBandWidth;
        const color =
          linePalette[Math.floor(Math.abs(phase)) % linePalette.length];
        pixels[pixelIndex] = color.r;
        pixels[pixelIndex + 1] = color.g;
        pixels[pixelIndex + 2] = color.b;
        pixels[pixelIndex + 3] = 255;
      }

      ctx.putImageData(output, 0, 0);
    },
    [bandWidth, contourPalette, flowSpeed, textColor],
  );

  useEffect(() => {
    let cancelled = false;
    let resizeTimer;

    const start = async () => {
      await document.fonts.ready;
      if (cancelled) return;
      buildDistanceField();

      const frame = (now) => {
        render(now * 0.001);
        animationRef.current = requestAnimationFrame(frame);
      };
      animationRef.current = requestAnimationFrame(frame);
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(buildDistanceField, 120);
    };

    start();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.clearTimeout(resizeTimer);
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [buildDistanceField, render]);

  function saveImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "contour-lines-template.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function saveVideo() {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.captureStream || isRecording) return;

    const stream = canvas.captureStream(60);
    const chunks = [];
    let recorder;

    try {
      recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    } catch {
      recorder = new MediaRecorder(stream);
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = () => {
      setIsRecording(false);
      stream.getTracks().forEach((track) => track.stop());

      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "contour-lines-template.webm";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    };

    setIsRecording(true);
    recorder.start();
    window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, EXPORT_VIDEO_MS);
  }

  return (
    <section className="contour-lines-wrapper">
      <div className="contour-controls">
        <div className="template-controls-title template-controls-title--contour">
          <span className="template-controls-title__top">Contour Lines</span>
          <span className="template-controls-title__bottom">Contour Lines</span>
        </div>

        <details className="contour-step">
          <summary className="contour-step-title">Text</summary>
          <div className="contour-row">
            <label className="contour-label-toggle">
              <input
                type="checkbox"
                checked={showLayerLabels}
                onChange={(event) => setShowLayerLabels(event.target.checked)}
              />
              <span>Show labels</span>
            </label>

            {textLayers.map((layer, index) => (
              <details
                className="contour-text-layer"
                key={layer.id}
                open={index === 0 ? true : undefined}
              >
                <summary className="contour-layer-header">
                  <span className="contour-layer-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="contour-layer-name">{layer.label}</span>
                </summary>

                <label className="contour-control">
                  <span className="contour-label">
                    {index + 1}. {layer.label}
                  </span>
                  <textarea
                    rows={2}
                    value={layer.text}
                    onChange={(event) =>
                      updateTextLayer(layer.id, { text: event.target.value })
                    }
                  />
                </label>

                <div className="contour-compact-controls">
                  <label className="contour-control contour-control--compact">
                    <div className="contour-label-row">
                      <span className="contour-label">X</span>
                      <span className="contour-value">{layer.x}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={layer.x}
                      onChange={(event) =>
                        updateTextLayer(layer.id, {
                          x: parseInt(event.target.value, 10),
                        })
                      }
                    />
                  </label>

                  <label className="contour-control contour-control--compact">
                    <div className="contour-label-row">
                      <span className="contour-label">Y</span>
                      <span className="contour-value">{layer.y}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={layer.y}
                      onChange={(event) =>
                        updateTextLayer(layer.id, {
                          y: parseInt(event.target.value, 10),
                        })
                      }
                    />
                  </label>

                  <label className="contour-control contour-control--compact">
                    <div className="contour-label-row">
                      <span className="contour-label">Size</span>
                      <span className="contour-value">
                        {layer.size.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="0.22"
                      step="0.005"
                      value={layer.size}
                      onChange={(event) =>
                        updateTextLayer(layer.id, {
                          size: parseFloat(event.target.value),
                        })
                      }
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="contour-layer-reset"
                  onClick={() => resetTextLayer(layer.id)}
                >
                  Reset position / size
                </button>

                <label className="contour-control contour-font-select-control">
                  <div className="contour-label-row">
                    <span className="contour-label">Font</span>
                    <span className="contour-value">
                      {getFontOption(layer.fontId).name}
                    </span>
                  </div>
                  <select
                    className="contour-font-select"
                    value={layer.fontId || DEFAULT_FONT_ID}
                    onChange={(event) =>
                      updateTextLayer(layer.id, { fontId: event.target.value })
                    }
                  >
                    {FONT_OPTIONS.map((fontOption) => (
                      <option key={fontOption.id} value={fontOption.id}>
                        {fontOption.name}
                      </option>
                    ))}
                  </select>
                </label>
              </details>
            ))}

            <button
              type="button"
              className="contour-add-button"
              onClick={addTextLayer}
            >
              + Add text
            </button>
          </div>
        </details>

        <details className="contour-step">
          <summary className="contour-step-title">Style</summary>
          <div className="contour-row">
            <label className="contour-control">
              <div className="contour-label-row">
                <span className="contour-label">Band width</span>
                <span className="contour-value">{bandWidth}</span>
              </div>
              <input
                type="range"
                min="3"
                max="18"
                step="1"
                value={bandWidth}
                onChange={(event) => setBandWidth(parseInt(event.target.value, 10))}
              />
            </label>
            <label className="contour-control">
              <div className="contour-label-row">
                <span className="contour-label">Text scale</span>
                <span className="contour-value">{fontScale.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.25"
                step="0.05"
                value={fontScale}
                onChange={(event) => setFontScale(parseFloat(event.target.value))}
              />
            </label>
          </div>
        </details>

        <details className="contour-step">
          <summary className="contour-step-title">Color</summary>
          <div className="contour-row">
            <label className="contour-color-row contour-color-row--text">
              <span className="contour-color-order">Text</span>
              <span
                className="contour-color-swatch"
                style={{ backgroundColor: colorStops[0].value }}
              />
              <input
                type="color"
                value={colorStops[0].value}
                onChange={(event) =>
                  updateColorStop(colorStops[0].id, event.target.value)
                }
              />
            </label>

            <div className="contour-palette-group">
              <span className="contour-palette-label">Palettes</span>
              <div className="contour-palette-row">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    type="button"
                    className="contour-palette-button"
                    key={palette.name}
                    onClick={() => setColorStops(clonePalette(palette.stops))}
                  >
                    {palette.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="contour-add-button"
              onClick={addContourColor}
            >
              + Add color
            </button>

            <div className="contour-color-actions">
              <button
                type="button"
                className="contour-color-reset"
                onClick={randomizeContourColors}
              >
                Random colors
              </button>

              <button
                type="button"
                className="contour-color-reset"
                onClick={() => setColorStops(clonePalette(DEFAULT_COLOR_STOPS))}
              >
                Reset colors
              </button>
            </div>

            <div className="contour-color-list">
              {colorStops.slice(1).map((stop, index) => (
                <div
                  className="contour-color-row"
                  draggable
                  key={stop.id}
                  onDragStart={(event) => handleColorDragStart(stop.id, event)}
                  onDragOver={handleColorDragOver}
                  onDrop={(event) => handleColorDrop(stop.id, event)}
                >
                  <span className="contour-color-order">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="contour-color-swatch"
                    style={{ backgroundColor: stop.value }}
                  />
                  <input
                    type="color"
                    value={stop.value}
                    onChange={(event) =>
                      updateColorStop(stop.id, event.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="contour-color-delete"
                    onClick={() => deleteContourColor(stop.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </details>

        <details className="contour-step">
          <summary className="contour-step-title">Animation</summary>
          <div className="contour-row">
            <label className="contour-control">
              <div className="contour-label-row">
                <span className="contour-label">Flow speed</span>
                <span className="contour-value">{flowSpeed}</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                step="1"
                value={flowSpeed}
                onChange={(event) => setFlowSpeed(parseInt(event.target.value, 10))}
              />
            </label>
          </div>
        </details>

        <details className="contour-step">
          <summary className="contour-step-title template-caret-title">
            Export
          </summary>
          <div className="contour-row">
            <button
              type="button"
              className="contour-action-button"
              onClick={saveImage}
            >
              Save image
            </button>

            <button
              type="button"
              className="contour-action-button"
              onClick={saveVideo}
              disabled={isRecording}
            >
              {isRecording
                ? `Recording ${EXPORT_VIDEO_SECONDS}s...`
                : `Record ${EXPORT_VIDEO_SECONDS}s video`}
            </button>
          </div>
        </details>
      </div>

      <div className="contour-display-area">
        <div
          className={`contour-canvas-shell ${FONT_CLASS_NAMES}`}
          ref={shellRef}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <canvas ref={canvasRef} />
          {showLayerLabels && (
            <div className="contour-drag-overlay" aria-hidden="true">
              {textLayers.map((layer) => (
                <button
                  type="button"
                  className="contour-drag-handle"
                  key={layer.id}
                  style={{ left: `${layer.x}%`, top: `${layer.y}%` }}
                  tabIndex={-1}
                  onPointerDown={(event) => handleDragStart(layer.id, event)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

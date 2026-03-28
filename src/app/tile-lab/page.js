"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ClientSketch from "../../components/ClientSketch";
import ElasticMenu from "../../components/ElasticMenu";

const DEFAULT_IMAGE = "/tile-lab/jimi.jpg";
const DEFAULT_BG = "#E33003";
const DEFAULT_DARK = "#705208";
const DEFAULT_LIGHT = "#CFCFCF";

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function TileLab() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [darkColor, setDarkColor] = useState(DEFAULT_DARK);
  const [lightColor, setLightColor] = useState(DEFAULT_LIGHT);
  const [minSize, setMinSize] = useState(10);
  const [maxSize, setMaxSize] = useState(72);
  const [threshold, setThreshold] = useState(28);
  const [manualPattern, setManualPattern] = useState("auto");
  const [sourceImage, setSourceImage] = useState(DEFAULT_IMAGE);

  const p5Ref = useRef(null);
  const imgRef = useRef(null);
  const tilesRef = useRef([]);
  const manualTilesRef = useRef([]);
  const objectUrlRef = useRef(null);
  const paletteRef = useRef({
    bg: hexToRgb(DEFAULT_BG),
    dark: hexToRgb(DEFAULT_DARK),
    light: hexToRgb(DEFAULT_LIGHT),
  });
  const configRef = useRef({
    minSize: 10,
    maxSize: 72,
    threshold: 28,
    manualPattern: "auto",
  });

  useEffect(() => {
    setMounted(true);
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    paletteRef.current = {
      bg: hexToRgb(bgColor),
      dark: hexToRgb(darkColor),
      light: hexToRgb(lightColor),
    };
  }, [bgColor, darkColor, lightColor]);

  useEffect(() => {
    configRef.current = { minSize, maxSize, threshold, manualPattern };
    regenerateMosaic();
  }, [minSize, maxSize, threshold, manualPattern]);

  useEffect(() => {
    if (p5Ref.current) {
      loadCurrentImage(p5Ref.current);
    }
  }, [sourceImage]);

  const getAverageBrightness = (x, y, size, width, height) => {
    const image = imgRef.current;
    if (!image || image.width <= 1) return 255;

    let sum = 0;
    let count = 0;
    const endX = Math.min(x + size, width);
    const endY = Math.min(y + size, height);

    for (let i = x; i < endX; i += 2) {
      for (let j = y; j < endY; j += 2) {
        const index = (Math.floor(i) + Math.floor(j) * image.width) * 4;
        sum +=
          (image.pixels[index] +
            image.pixels[index + 1] +
            image.pixels[index + 2]) /
          3;
        count += 1;
      }
    }

    return count > 0 ? sum / count : 255;
  };

  const getContrast = (x, y, size, avg, width, height) => {
    const image = imgRef.current;
    if (!image || image.width <= 1) return 0;

    let diffSum = 0;
    let count = 0;
    const endX = Math.min(x + size, width);
    const endY = Math.min(y + size, height);

    for (let i = x; i < endX; i += 4) {
      for (let j = y; j < endY; j += 4) {
        const index = (Math.floor(i) + Math.floor(j) * image.width) * 4;
        const brightness =
          (image.pixels[index] +
            image.pixels[index + 1] +
            image.pixels[index + 2]) /
          3;
        diffSum += Math.abs(brightness - avg);
        count += 1;
      }
    }

    return count > 0 ? diffSum / count : 0;
  };

  const resolvePattern = (brightness, requestedPattern) => {
    if (requestedPattern !== "auto") return requestedPattern;
    if (brightness < 40) return "solid";
    if (brightness < 80) return "columns";
    if (brightness < 120) return "diagonal";
    if (brightness < 160) return "blocks";
    if (brightness < 200) return "rows";
    return "dot";
  };

  const renderPattern = (p5, x, y, size, brightness, pattern) => {
    const { dark, light } = paletteRef.current;
    const greyValue = p5.map(brightness, 0, 255, 45, 220);

    p5.push();
    p5.translate(x, y);
    p5.rectMode(p5.CORNER);
    p5.stroke(greyValue);
    p5.strokeWeight(size * 0.08);
    p5.noFill();

    if (pattern === "solid") {
      p5.noStroke();
      p5.fill(...dark);
      p5.rect(0, 0, size, size);
    } else if (pattern === "columns") {
      p5.fill(...dark, 90);
      p5.rect(0, 0, size, size);
      p5.stroke(...light);
      for (let i = 0; i <= size; i += size / 3) {
        p5.line(i, 0, i, size);
      }
    } else if (pattern === "diagonal") {
      p5.stroke(...dark);
      for (let i = 0; i <= size * 2; i += size / 4) {
        p5.line(i, 0, 0, i);
      }
    } else if (pattern === "blocks") {
      p5.noStroke();
      p5.fill(...dark, 180);
      p5.rect(0, 0, size / 2, size / 2);
      p5.rect(size / 2, size / 2, size / 2, size / 2);
      p5.fill(...light, 220);
      p5.rect(size / 2, 0, size / 2, size / 2);
      p5.rect(0, size / 2, size / 2, size / 2);
    } else if (pattern === "rows") {
      p5.stroke(...light);
      for (let i = 0; i <= size; i += size / 5) {
        p5.line(0, i, size, i);
      }
    } else {
      p5.noStroke();
      p5.fill(...light);
      p5.ellipse(size / 2, size / 2, size / 2.3, size / 2.3);
    }

    p5.stroke(0, 35);
    p5.strokeWeight(0.5);
    p5.noFill();
    p5.rect(0, 0, size, size);
    p5.pop();
  };

  const createTile = (x, y, size, brightness, p5, requestedPattern = "auto") => ({
    targetX: x,
    targetY: y,
    size,
    brightness,
    pattern: resolvePattern(brightness, requestedPattern),
    currX: p5.random(-220, p5.width + 220),
    currY: p5.random(-p5.height, -80),
    speed: p5.random(0.045, 0.095),
    settled: false,
    update() {
      if (this.settled) return;
      this.currX = p5.lerp(this.currX, this.targetX, this.speed);
      this.currY = p5.lerp(this.currY, this.targetY, this.speed);
      if (p5.dist(this.currX, this.currY, this.targetX, this.targetY) < 0.2) {
        this.currX = this.targetX;
        this.currY = this.targetY;
        this.settled = true;
      }
    },
    display() {
      renderPattern(
        p5,
        this.currX,
        this.currY,
        this.size,
        this.brightness,
        this.pattern,
      );
    },
  });

  const generateTiles = (p5, x, y, size, width, height, target) => {
    const avg = getAverageBrightness(x, y, size, width, height);
    const detail = getContrast(x, y, size, avg, width, height);

    if (detail > configRef.current.threshold && size > configRef.current.minSize) {
      const half = size / 2;
      generateTiles(p5, x, y, half, width, height, target);
      generateTiles(p5, x + half, y, half, width, height, target);
      generateTiles(p5, x, y + half, half, width, height, target);
      generateTiles(p5, x + half, y + half, half, width, height, target);
      return;
    }

    if (avg <= 238) {
      target.push(createTile(x, y, size, avg, p5));
    }
  };

  const regenerateMosaic = () => {
    const p5 = p5Ref.current;
    if (!p5 || !imgRef.current || imgRef.current.width <= 1) return;

    const generatedTiles = [];
    for (let x = 0; x < p5.width; x += configRef.current.maxSize) {
      for (let y = 0; y < p5.height; y += configRef.current.maxSize) {
        generateTiles(
          p5,
          x,
          y,
          configRef.current.maxSize,
          p5.width,
          p5.height,
          generatedTiles,
        );
      }
    }

    tilesRef.current = generatedTiles;
    manualTilesRef.current = [];
    if (!p5.isLooping()) p5.loop();
  };

  const loadCurrentImage = (p5) => {
    if (!p5) return;
    imgRef.current = p5.loadImage(sourceImage, (image) => {
      image.resize(p5.width, p5.height);
      image.loadPixels();
      regenerateMosaic();
    });
  };

  const setup = (p5, canvasParentRef) => {
    p5Ref.current = p5;
    p5.createCanvas(800, 1000).parent(canvasParentRef);
    p5.pixelDensity(2);
    loadCurrentImage(p5);
  };

  const draw = (p5) => {
    p5.background(...paletteRef.current.bg);

    let allSettled = true;
    [...tilesRef.current, ...manualTilesRef.current].forEach((tile) => {
      tile.update();
      tile.display();
      if (!tile.settled) allSettled = false;
    });

    if (allSettled && p5.isLooping()) {
      p5.noLoop();
    } else if (!allSettled && !p5.isLooping()) {
      p5.loop();
    }
  };

  const mousePressed = (p5) => {
    if (
      p5.mouseX < 0 ||
      p5.mouseX > p5.width ||
      p5.mouseY < 0 ||
      p5.mouseY > p5.height
    ) {
      return;
    }

    const size = clamp(configRef.current.minSize * 2, 16, configRef.current.maxSize);
    const snappedX = Math.floor(p5.mouseX / size) * size;
    const snappedY = Math.floor(p5.mouseY / size) * size;
    const brightness = getAverageBrightness(snappedX, snappedY, size, p5.width, p5.height);

    manualTilesRef.current.push(
      createTile(
        snappedX,
        snappedY,
        size,
        brightness,
        p5,
        configRef.current.manualPattern,
      ),
    );

    if (!p5.isLooping()) p5.loop();
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSourceImage(url);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-[#E33003] text-[#705208]">
      {menuOpen && (
        <button
          type="button"
          className="slideout-backdrop"
          aria-label="Close menu"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setMenuOpen(false);
          }}
        />
      )}

      <nav
        className={`slideout-menu${menuOpen ? " open" : ""}`}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <ul>
          <li>
            <Link href="/" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/tile-lab" onClick={() => setMenuOpen(false)}>
              Tile Lab
            </Link>
          </li>
          <li>
            <Link href="/templates" onClick={() => setMenuOpen(false)}>
              Templates
            </Link>
          </li>
          <li>
            <a
              href="mailto:hollandblumer6@icloud.com"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>
          </li>
        </ul>
      </nav>

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-5 py-5 lg:flex-row lg:gap-8 lg:px-8">
        <aside className="w-full max-w-[360px] rounded-[28px] border border-[rgba(112,82,8,0.18)] bg-[rgba(207,207,207,0.52)] p-5 backdrop-blur-md lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:overflow-y-auto">
          <div className="mb-6 border-b border-[rgba(112,82,8,0.18)] pb-5">
            <div className="mb-5 h-11 w-11">
              <ElasticMenu
                isOpen={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
              />
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#705208]">
              Tile Lab
            </h1>
            <p className="mt-3 text-sm leading-6 text-[rgba(112,82,8,0.8)]">
              Build a mosaic from the default image or upload your own. If you
              do not see a tile you like, click into the canvas to place your
              own.
            </p>
          </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[rgba(112,82,8,0.72)]">
                Source
              </h2>
              <label className="block rounded-2xl border border-[rgba(112,82,8,0.16)] bg-[rgba(255,255,255,0.42)] p-4 text-sm">
                <span className="mb-2 block font-medium">Upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="block w-full text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => setSourceImage(DEFAULT_IMAGE)}
                className="w-full rounded-full border border-[rgba(112,82,8,0.22)] bg-[rgba(255,255,255,0.5)] px-4 py-3 text-sm font-medium transition hover:bg-[rgba(255,255,255,0.68)]"
              >
                Reset to Jimi
              </button>
            </section>

            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[rgba(112,82,8,0.72)]">
                Palette
              </h2>
              {[
                ["Background", bgColor, setBgColor],
                ["Dark Tile", darkColor, setDarkColor],
                ["Light Tile", lightColor, setLightColor],
              ].map(([label, value, setter]) => (
                <label
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-[rgba(112,82,8,0.16)] bg-[rgba(255,255,255,0.42)] px-4 py-3 text-sm"
                >
                  <span>{label}</span>
                  <input
                    type="color"
                    value={value}
                    onChange={(event) => setter(event.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"
                  />
                </label>
              ))}
            </section>

            <section className="space-y-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[rgba(112,82,8,0.72)]">
                Mosaic
              </h2>
              {[
                ["Minimum tile", minSize, setMinSize, 8, 40],
                ["Maximum tile", maxSize, setMaxSize, 32, 120],
                ["Detail threshold", threshold, setThreshold, 8, 60],
              ].map(([label, value, setter, min, max]) => (
                <label key={label} className="block rounded-2xl border border-[rgba(112,82,8,0.16)] bg-[rgba(255,255,255,0.42)] p-4 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span>{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(event) => setter(Number(event.target.value))}
                    className="w-full accent-[#705208]"
                  />
                </label>
              ))}
              <button
                type="button"
                onClick={regenerateMosaic}
                className="w-full rounded-full bg-[#705208] px-4 py-3 text-sm font-semibold text-[#f1ece0] transition hover:bg-[rgba(112,82,8,0.88)]"
              >
                Regenerate mosaic
              </button>
            </section>

            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-[rgba(112,82,8,0.72)]">
                Add Your Own Tiles
              </h2>
              <label className="block rounded-2xl border border-[rgba(112,82,8,0.16)] bg-[rgba(255,255,255,0.42)] p-4 text-sm">
                <span className="mb-2 block font-medium">Click behavior</span>
                <select
                  value={manualPattern}
                  onChange={(event) => setManualPattern(event.target.value)}
                  className="w-full rounded-xl border border-[rgba(112,82,8,0.18)] bg-white/80 px-3 py-2"
                >
                  <option value="auto">Auto from image</option>
                  <option value="solid">Solid</option>
                  <option value="columns">Columns</option>
                  <option value="diagonal">Diagonal</option>
                  <option value="blocks">Blocks</option>
                  <option value="rows">Rows</option>
                  <option value="dot">Dot</option>
                </select>
              </label>
              <p className="text-sm leading-6 text-[rgba(112,82,8,0.8)]">
                Click anywhere on the canvas to drop in new tiles over the
                generated mosaic.
              </p>
            </section>
          </div>

        </aside>

        <main className="flex min-w-0 flex-1 items-center justify-center">
          <div
            className="rounded-[26px] border-[4px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
            style={{ borderColor: "rgba(112,82,8,0.48)" }}
          >
            <div className="overflow-hidden rounded-[20px]">
              <ClientSketch
                preload={() => {}}
                setup={setup}
                draw={draw}
                mousePressed={mousePressed}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

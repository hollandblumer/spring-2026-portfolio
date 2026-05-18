export const svgFilterSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SVG Filter Text</title>
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background: #131313;
    }

    #text {
      margin: 0;
      color: #ffffe0;
      font-family: Georgia, serif;
      font-size: clamp(4rem, 16vw, 12rem);
      font-weight: 900;
      font-style: italic;
      letter-spacing: -0.08em;
      filter: url("#noise") blur(2px);
    }
  </style>
</head>
<body>
  <p id="text">EDIT TEXT</p>

  <svg width="0" height="0" aria-hidden="true">
    <defs>
      <filter id="noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.002"
          numOctaves="3"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="300"
        />
      </filter>
    </defs>
  </svg>
</body>
</html>`;

export const inkBleedWavyLinesSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ink Bleed Wavy Lines</title>
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background: #f6f7fd;
    }

    canvas {
      width: min(90vw, 760px);
      height: min(80vh, 560px);
    }
  </style>
</head>
<body>
  <canvas id="inkLines"></canvas>

  <script>
    const canvas = document.getElementById("inkLines");
    const ctx = canvas.getContext("2d");

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function path(y, offset) {
      return (
        0.5 +
        0.16 * Math.sin(y * 6 + offset) +
        0.08 * Math.sin(y * 15 + 1.3 + offset * 0.4) +
        0.035 * Math.sin(y * 32 + 0.6)
      );
    }

    function draw() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let stripe = -9; stripe <= 9; stripe++) {
        ctx.beginPath();
        ctx.strokeStyle = stripe % 2 === 0 ? "#111111" : "#dfeff2";
        ctx.lineWidth = 10 + Math.sin(stripe) * 2;

        for (let y = 0; y <= height; y += 4) {
          const u = y / height;
          const center = path(u, stripe * 0.18) * width;
          const bleed = Math.sin(u * 70 + stripe) * 2.5;
          const x = center + stripe * 15 + bleed;

          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      }
    }

    window.addEventListener("resize", () => {
      resize();
      draw();
    });

    resize();
    draw();
  </script>
</body>
</html>`;

export const metaballsSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Metaball Ink Bleed</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #ffffff;
    }

    .metaballs {
      width: min(80vw, 620px);
      height: 420px;
      filter: contrast(24);
      background: #ffffff;
      overflow: hidden;
    }

    .blob {
      position: absolute;
      width: 180px;
      height: 180px;
      border-radius: 999px;
      background: #131313;
      filter: blur(22px);
      opacity: 0.92;
    }
  </style>
</head>
<body>
  <div class="metaballs">
    <div class="blob" style="left: 20%; top: 18%"></div>
    <div class="blob" style="left: 35%; top: 28%"></div>
    <div class="blob" style="left: 48%; top: 42%"></div>
    <div class="blob" style="left: 62%; top: 24%"></div>
  </div>
</body>
</html>`;

export const envelopeSineWaveSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Modulated Oscilloscope Wave</title>
  <style>
    body {
      margin: 0;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }

    canvas {
      display: block;
    }
  </style>
</head>
<body>
<canvas id="waveCanvas"></canvas>

<script>
  const canvas = document.getElementById("waveCanvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  let time = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const waveWidth = 600;

    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const baseAmplitude = 120;
    const frequency = 0.06;

    for (let x = 0; x <= waveWidth; x++) {
      const screenX = cx - waveWidth / 2 + x;
      const dist = (x - waveWidth / 2) / (waveWidth / 2);
      const envelope = Math.cos(dist * (Math.PI / 2));
      const y = cy + envelope * Math.sin(x * frequency - time) * baseAmplitude;

      if (x === 0) ctx.moveTo(screenX, y);
      else ctx.lineTo(screenX, y);
    }

    ctx.stroke();

    time += 0.15;
    requestAnimationFrame(draw);
  }

  draw();
</script>
</body>
</html>`;

export const logarithmicSpiralSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Logarithmic Spiral</title>
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background: #ffffff;
    }

    canvas {
      width: min(90vw, 720px);
      height: min(90vw, 720px);
    }
  </style>
</head>
<body>
  <canvas id="spiralCanvas"></canvas>

  <script>
    const canvas = document.getElementById("spiralCanvas");
    const ctx = canvas.getContext("2d");

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const cx = width / 2;
      const cy = height / 2;
      const arms = 34;
      const maxTheta = Math.PI * 7.5;
      const growth = 0.18;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#111111";

      for (let arm = 0; arm < arms; arm++) {
        const start = (Math.PI * 2 * arm) / arms;

        ctx.beginPath();
        ctx.moveTo(cx, cy);

        for (let t = 0; t <= maxTheta; t += 0.035) {
          const r = 2.4 * Math.exp(growth * t);
          const theta = start + t;
          ctx.lineTo(cx + Math.cos(theta) * r, cy + Math.sin(theta) * r);
        }

        for (let t = maxTheta; t >= 0; t -= 0.035) {
          const r = 2.4 * Math.exp(growth * t);
          const theta = start + t + Math.PI / arms;
          ctx.lineTo(cx + Math.cos(theta) * r, cy + Math.sin(theta) * r);
        }

        ctx.closePath();
        ctx.fill();
      }
    }

    window.addEventListener("resize", () => {
      resize();
      draw();
    });

    resize();
    draw();
  </script>
</body>
</html>`;

export const contourLinesSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contour Lines</title>
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background: #fffaf0;
      font-family: system-ui, sans-serif;
    }
  </style>
</head>
<body>
  <canvas id="contourCanvas" width="720" height="720"></canvas>

  <script>
// Contour bands from a signed/distance-style field around text.
// The full reference file builds a text alpha mask, runs a 2D distance
// transform, then colors each pixel by its distance band.

const palette = [
  { r: 247, g: 104, b: 51 },
  { r: 12, g: 12, b: 12 },
  { r: 76, g: 101, b: 240 },
  { r: 255, g: 250, b: 235 },
  { r: 255, g: 198, b: 11 },
  { r: 38, g: 97, b: 65 },
];

const bandWidth = 8;
const flowSpeed = 28;

function renderContourPixel(distance, time, dpr) {
  const offset = time * flowSpeed * dpr;
  const phase = (distance - offset) / (bandWidth * dpr);
  const index = Math.floor(Math.abs(phase)) % palette.length;
  return palette[index];
}

const canvas = document.getElementById("contourCanvas");
const ctx = canvas.getContext("2d");
ctx.font = "900 112px Georgia";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

function draw(time = 0) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width;
  const height = canvas.height;
  const image = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - width / 2;
      const dy = y - height / 2;
      const distance = Math.hypot(dx, dy);
      const color = renderContourPixel(distance, time * 0.001, dpr);
      const index = (y * width + x) * 4;
      image.data[index] = color.r;
      image.data[index + 1] = color.g;
      image.data[index + 2] = color.b;
      image.data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  ctx.fillStyle = "#fffaf0";
  ctx.fillText("TYPE", width / 2, height / 2);
  requestAnimationFrame(draw);
}

draw();
  </script>
</body>
</html>`;

export const eggWarpSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Egg Text Warp</title>
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background: #111;
      color: #f8f0d8;
      font-family: Georgia, serif;
      overflow: hidden;
    }

    .egg {
      width: min(72vw, 460px);
      aspect-ratio: 0.72;
      display: grid;
      place-items: center;
      border-radius: 52% 48% 46% 54% / 62% 62% 38% 38%;
      background: #f1d34b;
      overflow: hidden;
    }

    .egg span {
      max-width: 90%;
      font-size: clamp(2.8rem, 12vw, 7rem);
      font-weight: 900;
      line-height: 0.78;
      text-align: center;
      color: #121212;
      transform: scaleX(0.72) scaleY(1.3);
      filter: url("#warp");
    }
  </style>
</head>
<body>
  <div class="egg"><span>EDIT TEXT</span></div>

  <svg width="0" height="0" aria-hidden="true">
    <filter id="warp">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" />
      <feDisplacementMap in="SourceGraphic" scale="34" />
    </filter>
  </svg>

  <script>
// Three.js shader approach for a Wes Wilson-style egg text warp.
// The full reference draws repeated poster text to a canvas texture,
// then maps it through an oval bulge and edge-slit distortion.

const uniforms = {
  u_warp: { value: 1.35 },
  u_tall: { value: 3.2 },
  u_scale: { value: 0.36 },
  u_waveAmp: { value: 0.08 },
  u_waveFreq: { value: 3.5 },
  u_scanPinch: { value: 1.8 },
};

function eggWarpUv(p, time) {
  const radius = 0.5;
  const r2 = p.x * p.x + (p.y * p.y) / (uniforms.u_tall.value ** 2);
  const z = Math.sqrt(Math.max(0, 1 - r2 * uniforms.u_warp.value));
  const bulgeP = {
    x: p.x / (z + 0.5),
    y: p.y / (z + 0.5),
  };

  const wave =
    Math.sin(bulgeP.x * uniforms.u_waveFreq.value + time * 2) *
    uniforms.u_waveAmp.value;

  return {
    x: bulgeP.x * 0.3 + 0.5 + time * 0.13,
    y: bulgeP.y * 0.3 + 0.5 + wave,
  };
}
  </script>
</body>
</html>`;

export const eyePatternSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Eye Circle Packing</title>
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background: #f0f0f0;
    }
  </style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js"></script>
  <script>
// Recreate the eye/olive motif as circle packing. Each packed circle
// contains an offset inner circle and red core, producing a repeated
// eye-like field with small rotational drift.

const PRIMARY_OLIVE = "rgb(85, 107, 47)";
const CORE_RED = "#E54423";
const LIGHT_BACKGROUND = "rgb(240, 240, 240)";

function drawPackedEye(c) {
  c.rotation += c.rotationSpeed;

  push();
  translate(c.pos.x, c.pos.y);
  rotate(c.rotation);

  const innerR = c.rad * 0.7;
  const coreR = c.rad * 0.4;
  const offset = -c.rad * 0.2;
  const coreShift = offset - (innerR - coreR) / 2;

  noStroke();
  fill(PRIMARY_OLIVE);
  ellipse(0, 0, c.rad * 2);

  fill(LIGHT_BACKGROUND);
  ellipse(offset, offset, innerR * 2);

  fill(CORE_RED);
  ellipse(coreShift, coreShift, coreR * 2);
  pop();
}

function circlePack({ minSize, maxSize, maxAttempts, maxCount }) {
  const circles = [];
  const p = createVector();

  while (circles.length < maxCount) {
    let invalidSpot = true;
    let attempts = 0;

    while (invalidSpot && attempts < maxAttempts) {
      p.x = random(-width / 2 + maxSize, width / 2 - maxSize);
      p.y = random(-height / 2 + maxSize, height / 2 - maxSize);
      attempts++;
      invalidSpot = circles.some((circle) => dist(p.x, p.y, circle.pos.x, circle.pos.y) <= circle.rad);
    }

    if (invalidSpot) continue;

    let rad = maxSize;
    for (const circle of circles) {
      rad = min(rad, dist(p.x, p.y, circle.pos.x, circle.pos.y) - circle.rad);
    }

    const margin = min(width / 2 - abs(p.x), height / 2 - abs(p.y));
    rad = constrain(rad, minSize, min(maxSize, margin));
    if (rad < minSize) continue;

    circles.push({
      pos: createVector(p.x, p.y),
      rad,
      rotation: random(TAU),
      rotationSpeed: random(-0.01, 0.01),
    });
  }

  return circles;
}

let packedEyes = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  packedEyes = circlePack({
    minSize: 10,
    maxSize: 42,
    maxAttempts: 90,
    maxCount: 170,
  });
}

function draw() {
  background(LIGHT_BACKGROUND);
  translate(width / 2, height / 2);
  for (const eye of packedEyes) drawPackedEye(eye);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  packedEyes = circlePack({
    minSize: 10,
    maxSize: 42,
    maxAttempts: 90,
    maxCount: 170,
  });
}
  </script>
</body>
</html>`;

export const fractalTreesSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fractal Trees</title>
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background: #fff8e6;
    }

    canvas {
      width: min(90vw, 760px);
      height: min(80vh, 620px);
    }
  </style>
</head>
<body>
  <canvas id="trees"></canvas>

  <script>
// Fractal tree / branching ornament
// Recursive branches create the curled plant-like structure.

function branch(ctx, length, depth) {
  if (depth <= 0) return;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -length);
  ctx.stroke();
  ctx.translate(0, -length);

  for (const angle of [-0.62, 0.48]) {
    ctx.save();
    ctx.rotate(angle);
    ctx.scale(0.82, 0.82);
    branch(ctx, length * 0.72, depth - 1);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, length * 0.12, 0, Math.PI * 1.7);
  ctx.stroke();
}

const canvas = document.getElementById("trees");
const ctx = canvas.getContext("2d");

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#171717";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.save();
  ctx.translate(width / 2, height * 0.86);
  branch(ctx, height * 0.18, 8);
  ctx.restore();
}

window.addEventListener("resize", () => {
  resize();
  draw();
});

resize();
draw();
  </script>
</body>
</html>`;

export const organicTextFillSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Organic Text Fill</title>
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background: #f4efda;
    }
  </style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js"></script>
  <script>
// Fill hand-drawn organic shapes with text by scanline-warping a text buffer.

function calculateEdges(points, height) {
  const edges = new Array(Math.floor(height)).fill(null);

  for (let y = 0; y < height; y++) {
    const intersections = [];

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        const t = (y - p1.y) / (p2.y - p1.y);
        intersections.push(p1.x + t * (p2.x - p1.x));
      }
    }

    if (intersections.length >= 2) {
      intersections.sort((a, b) => a - b);
      edges[y] = {
        xL: intersections[0],
        xR: intersections[intersections.length - 1],
      };
    }
  }

  return edges;
}

function warpTextIntoShape(p5, textBuffer, edges, minY, maxY) {
  for (let y = minY; y <= maxY; y++) {
    const edge = edges[y];
    if (!edge) continue;

    const targetWidth = Math.max(1, edge.xR - edge.xL);
    const sourceY = p5.map(y, minY, maxY, textBuffer.height * 0.3, textBuffer.height * 0.7);
    p5.image(textBuffer, edge.xL, y, targetWidth, 1, 0, sourceY, textBuffer.width, 1);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
}

function draw() {
  background("#f4efda");
  const points = [
    createVector(width * 0.25, height * 0.24),
    createVector(width * 0.75, height * 0.2),
    createVector(width * 0.82, height * 0.6),
    createVector(width * 0.55, height * 0.82),
    createVector(width * 0.22, height * 0.66),
  ];
  const textBuffer = createGraphics(900, 220);
  textBuffer.background("#f4efda");
  textBuffer.fill("#151515");
  textBuffer.textAlign(CENTER, CENTER);
  textBuffer.textStyle(BOLD);
  textBuffer.textSize(96);
  textBuffer.text("EDIT TEXT EDIT TEXT EDIT TEXT", textBuffer.width / 2, textBuffer.height / 2);

  const edges = calculateEdges(points, height);
  noStroke();
  fill("#151515");
  beginShape();
  for (const point of points) vertex(point.x, point.y);
  endShape(CLOSE);
  warpTextIntoShape(window, textBuffer, edges, 0, height - 1);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}
  </script>
</body>
</html>`;

export const sphericalBent3dTextSample = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Spherical Bent 3D Text</title>
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      background: #111;
      color: #f8f0d8;
      font-family: Georgia, serif;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <h1>EDIT TEXT</h1>

  <script type="module">
// Bend extruded Three.js text over a spherical surface.

function sphereBendGeometry(geometry, strength = 0.058, radius = 19) {
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    const theta = x * strength;
    const phi = y * strength * 0.55;

    const newX = radius * Math.sin(theta) * Math.cos(phi);
    const newY = radius * Math.sin(phi);
    const newZ = radius * Math.cos(theta) * Math.cos(phi) - radius;

    position.setXYZ(i, newX, newY, newZ + z * 1.8);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

// Use sphereBendGeometry() after creating a Three.js TextGeometry.
// This document wrapper keeps the snippet copyable as HTML.
  </script>
</body>
</html>`;

export const codeSamples = {
  svg: svgFilterSample,
  "ink-bleed": inkBleedWavyLinesSample,
  "logarithmic-spiral": logarithmicSpiralSample,
  metaballs: metaballsSample,
  "envelope-sine": envelopeSineWaveSample,
  "contour-lines": contourLinesSample,
  "egg-warp": eggWarpSample,
  "eye-pattern": eyePatternSample,
  "fractal-trees": fractalTreesSample,
  "organic-text-fill": organicTextFillSample,
  "spherical-3d-text": sphericalBent3dTextSample,
};

export type CodeSampleId = keyof typeof codeSamples;

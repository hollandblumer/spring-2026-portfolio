"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const BG = "#272727";
const HPI = Math.PI / 2;
const CARD_RATIO = 4.9 / 3.45;
const ENABLE_BRIDGE_SHUFFLE = false;
const COLORS = {
  edge: "#373737",
};
const CAROUSEL = {
  gapPx: 15,
  ease: 0.075,
  wheel: 0.0026,
  snapDist: 0.08,
  snapDelay: 120,
  shrinkAttack: 0.25,
  shrinkDecay: 0.06,
};
const GRID_LIQUID_LENS = {
  sizeX: 1.35,
  sizeY: 1.35,
  rotation: 0,
  dispersion: 11,
  rimStart: 0.56,
  rimTangential: 0.62,
  rimFreq1: 2,
  rimFreq2: 1,
  shimmerFreq: 12,
  shimmerSpeed: 3.5,
  shimmerDepth: 0.1,
  glow: 1.7,
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smooth(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function lerpPose(a, b, t) {
  const aScaleX = a.scaleX ?? a.scale;
  const aScaleY = a.scaleY ?? a.scale;
  const bScaleX = b.scaleX ?? b.scale;
  const bScaleY = b.scaleY ?? b.scale;

  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    z: mix(a.z, b.z, t),
    rx: mix(a.rx, b.rx, t),
    ry: mix(a.ry, b.ry, t),
    rz: mix(a.rz, b.rz, t),
    scale: mix(a.scale, b.scale, t),
    scaleX: mix(aScaleX, bScaleX, t),
    scaleY: mix(aScaleY, bScaleY, t),
    bend: mix(a.bend, b.bend, t),
  };
}

function seg(t, a, b) {
  return smooth(clamp01((t - a) / (b - a)));
}

function applyPose(group, pose) {
  group.position.set(pose.x, pose.y, pose.z);
  group.rotation.set(pose.rx, pose.ry, pose.rz);
  group.scale.set(
    pose.scaleX ?? pose.scale,
    pose.scaleY ?? pose.scale,
    pose.scale,
  );
}

function getPacket(index, total) {
  const half = Math.ceil(total / 2);
  const side = index < half ? -1 : 1;
  const local = index < half ? index : index - half;
  const slot = local * 2 + (side > 0 ? 1 : 0);
  return { side, local, slot, half };
}

function getLayer(slot, total) {
  const center = (total - 1) / 2;
  return total - Math.abs(slot - center);
}

function getGridPose(index, total, viewport, offset = 0, shrink = 0) {
  const { slot } = getPacket(index, total);
  const columns = viewport.width <= 1024 ? 2 : 3;
  const row = Math.floor(slot / columns);
  const col = slot % columns;
  const gap = (CAROUSEL.gapPx / Math.max(1, viewport.height)) * viewport.worldH;
  const fitW = (viewport.worldW - gap * (columns + 1)) / columns;
  const gridAspect = 4 / 5;
  const panelW = fitW * (1 - shrink * 0.18);
  const panelH = panelW / gridAspect;
  const visibleRows = Math.max(
    1,
    Math.floor((viewport.worldH + gap) / (panelH + gap)),
  );
  const scaleX = panelW / viewport.cardW;
  const scaleY = panelH / viewport.cardH;
  const scale = Math.max(scaleX, scaleY);
  const totalW = columns * panelW + (columns - 1) * gap;
  const totalRows = Math.ceil(total / columns);
  const maxOffset = Math.max(0, totalRows - visibleRows);
  const rowOffset = Math.max(0, Math.min(maxOffset, offset));
  const centerY = viewport.worldH * 0.02;
  const depth = 1 - Math.min(1, Math.abs(row - rowOffset - (visibleRows - 1) / 2) / 3);

  return {
    x: col * (panelW + gap) - totalW / 2 + panelW / 2,
    y:
      centerY +
      ((visibleRows - 1) / 2 - (row - rowOffset)) * (panelH + gap),
    z: depth * 0.08,
    rx: 0,
    ry: 0,
    rz: 0,
    scale,
    scaleX,
    scaleY,
    bend: -0.14,
  };
}

function buildCardTexture(loader, project) {
  return new Promise((resolve) => {
    const source = project.poster || project.src;
    loader.load(
      source,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        resolve(texture);
      },
      undefined,
      () => resolve(null),
    );
  });
}

function deformPlane(mesh, bend, cardW) {
  const geometry = mesh.geometry;
  const base = geometry.userData.basePositions;
  const position = geometry.attributes.position;
  const direction = bend < 0 ? -1 : 1;
  const angle = Math.max(0.0001, Math.abs(bend));
  const radius = cardW / angle;
  const widthComp = bend < 0 ? angle / (2 * Math.sin(angle / 2)) : 1;

  for (let i = 0; i < position.count; i += 1) {
    const ix = i * 3;
    const x = base[ix];
    const y = base[ix + 1];
    const nx = x / cardW;
    const theta = nx * angle;
    const curvedX = radius * Math.sin(theta) * widthComp;
    const curvedZ = radius * (Math.cos(theta) - 1) * direction;
    position.setXYZ(i, curvedX, y, curvedZ + base[ix + 2]);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

export default function HomeBridgeShuffle({
  projects,
  shuffleSignal,
  visible = true,
  marbleTexture,
  onActiveProjectChange,
  onOpenProject,
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const activeRef = useRef(0);
  const visibleRef = useRef(visible);
  const revealStartedAtRef = useRef(null);

  const textureProjects = useMemo(
    () => projects.map((project, index) => ({ ...project, slot: index })),
    [projects],
  );

  useEffect(() => {
    visibleRef.current = visible;
    revealStartedAtRef.current = visible ? performance.now() : null;
  }, [visible]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let frameId = 0;
    let destroyed = false;
    let state = ENABLE_BRIDGE_SHUFFLE ? "intro" : "grid";
    let stateTime = 0;
    let lastTime = performance.now();
    let hoverTarget = null;
    let wasHovering = false;
    const carousel = {
      current: 0,
      target: 0,
      speedShrink: 0,
      lastWheelAt: 0,
      snapQueued: false,
    };
    const cards = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -80, 80);
    camera.position.set(0, -0.8, 20);
    camera.lookAt(0, -0.8, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(BG, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    container.appendChild(renderer.domElement);

    const world = new THREE.Group();
    scene.add(world);
    const dpr = renderer.getPixelRatio();
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
    renderTarget.texture.colorSpace = THREE.LinearSRGBColorSpace;
    const slitScene = new THREE.Scene();
    const slitCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const slitUniforms = {
      uTex: { value: renderTarget.texture },
      uTime: { value: 0 },
      uFx: { value: 0 },
      uFloorEdge: { value: 0.16 },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uSizeX: { value: GRID_LIQUID_LENS.sizeX },
      uSizeY: { value: GRID_LIQUID_LENS.sizeY },
      uAspect: { value: 1 },
      uRotation: { value: (GRID_LIQUID_LENS.rotation * Math.PI) / 180 },
      uDispersion: { value: GRID_LIQUID_LENS.dispersion },
      uRimStart: { value: GRID_LIQUID_LENS.rimStart },
      uRimTangential: { value: GRID_LIQUID_LENS.rimTangential },
      uRimFreq1: { value: GRID_LIQUID_LENS.rimFreq1 },
      uRimFreq2: { value: GRID_LIQUID_LENS.rimFreq2 },
      uShimmerFreq: { value: GRID_LIQUID_LENS.shimmerFreq },
      uShimmerSpeed: { value: GRID_LIQUID_LENS.shimmerSpeed },
      uShimmerDepth: { value: GRID_LIQUID_LENS.shimmerDepth },
      uGlow: { value: GRID_LIQUID_LENS.glow },
    };
    const slitMaterial = new THREE.ShaderMaterial({
      uniforms: slitUniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uTex;
        uniform float uTime;
        uniform float uFx;
        uniform float uFloorEdge;
        uniform vec2 uCenter;
        uniform float uSizeX;
        uniform float uSizeY;
        uniform float uAspect;
        uniform float uRotation;
        uniform float uDispersion;
        uniform float uRimStart;
        uniform float uRimTangential;
        uniform float uRimFreq1;
        uniform float uRimFreq2;
        uniform float uShimmerFreq;
        uniform float uShimmerSpeed;
        uniform float uShimmerDepth;
        uniform float uGlow;

        const int MAX_SAMPLES = 12;

        vec2 marbleDrop(vec2 p, vec2 center, float radius) {
          vec2 delta = p - center;
          float distanceToDrop = length(delta);
          if (distanceToDrop < 0.0001) return p;

          if (distanceToDrop <= radius) {
            float inside = 1.0 - distanceToDrop / radius;
            float angle = inside * 1.35;
            float ca = cos(angle);
            float sa = sin(angle);
            vec2 spun = mat2(ca, -sa, sa, ca) * delta;
            return center + spun * vec2(0.72, 1.18);
          }

          float pushedDistance = sqrt(max(
            0.0,
            distanceToDrop * distanceToDrop - radius * radius
          ));
          return center + delta * (pushedDistance / distanceToDrop);
        }

        vec3 wavyGridEdgeExtension(vec3 base, out float extensionAlpha) {
          float edgeBand = uFloorEdge;
          float edgeAmount = 1.0 - smoothstep(0.0, edgeBand, vUv.y);

          if (edgeAmount <= 0.0) {
            extensionAlpha = 0.0;
            return base;
          }

          float depth = 1.0 - vUv.y / edgeBand;
          float floorDepth = pow(clamp(depth, 0.0, 1.0), 0.82);

          vec2 originalP = vec2(vUv.x, floorDepth);
          vec2 marbleP = originalP;
          float drift = uTime * 0.025;

          // Paper-marbling drops push the already-painted grid colors into
          // nested lobes before the rake combs them into long ribbons.
          marbleP = marbleDrop(marbleP, vec2(0.18 + sin(drift) * 0.025, 0.2), 0.17);
          marbleP = marbleDrop(marbleP, vec2(0.44, 0.34 + cos(drift * 0.8) * 0.025), 0.2);
          marbleP = marbleDrop(marbleP, vec2(0.72 + sin(drift * 0.6) * 0.03, 0.18), 0.14);
          marbleP = marbleDrop(marbleP, vec2(0.82, 0.58), 0.22);
          marbleP = marbleDrop(marbleP, vec2(0.26, 0.72), 0.19);
          marbleP = marbleDrop(marbleP, vec2(0.56, 0.84), 0.16);
          marbleP = marbleDrop(marbleP, vec2(0.08, 0.48), 0.13);
          marbleP = marbleDrop(marbleP, vec2(0.93, 0.82), 0.15);

          vec2 rakeDirA = normalize(vec2(0.94, 0.34));
          vec2 rakeNormA = vec2(-rakeDirA.y, rakeDirA.x);
          float rakeA = dot(marbleP - vec2(0.5, 0.48), rakeNormA);
          marbleP -= rakeDirA * 0.11 * exp(-abs(rakeA) / 0.12);

          vec2 rakeDirB = normalize(vec2(-0.72, 0.7));
          vec2 rakeNormB = vec2(-rakeDirB.y, rakeDirB.x);
          float rakeB = dot(marbleP - vec2(0.47, 0.68), rakeNormB);
          marbleP -= rakeDirB * 0.075 * exp(-abs(rakeB) / 0.09);

          float comb =
            sin(marbleP.y * 31.0 + marbleP.x * 8.0 + uTime * 0.12) * 0.027 +
            sin(marbleP.y * 67.0 - marbleP.x * 5.0) * 0.012 +
            sin(marbleP.y * 113.0 + marbleP.x * 13.0) * 0.004;
          marbleP.x += comb;
          marbleP.y +=
            sin(marbleP.x * 18.0 - marbleP.y * 7.0) * 0.022 +
            sin(marbleP.x * 43.0 + 0.8) * 0.008;

          float seamRelease = smoothstep(0.0, 0.16, floorDepth);
          vec2 sampleP = mix(originalP, marbleP, seamRelease);
          // Keep the result grounded like a shallow puddle: it stays attached
          // across the bottom row, then spreads sideways as it settles.
          float floorWidth = mix(1.0, 1.24, smoothstep(0.08, 0.72, floorDepth));
          float marbledSourceX =
            0.5 + (sampleP.x - 0.5) / floorWidth;

          // The first pixels of the puddle are a literal continuation of the
          // card edge above them. Farther out, repeatedly fold that same
          // shallow strip into crisp marbling ribbons.
          float nearbyArtworkBand = min(0.18, 1.0 - edgeBand);
          float ribbonField =
            sampleP.y * 3.6 +
            sin(sampleP.x * 19.0 + sampleP.y * 8.0) * 0.24 +
            sin(sampleP.x * 47.0 - sampleP.y * 15.0) * 0.075;
          float ribbonDepth = fract(ribbonField);
          ribbonDepth =
            mix(ribbonDepth, smoothstep(0.08, 0.92, ribbonDepth), 0.72);

          float sourceX = mix(vUv.x, marbledSourceX, seamRelease);
          float sourceY = mix(
            edgeBand + min(0.003, nearbyArtworkBand),
            edgeBand + ribbonDepth * nearbyArtworkBand,
            seamRelease
          );

          vec3 melted = texture2D(
            uTex,
            vec2(
              clamp(sourceX, 0.0, 1.0),
              clamp(sourceY, 0.0, 1.0)
            )
          ).rgb;

          // An irregular but predominantly horizontal silhouette prevents the
          // marble from reading as a rectangular curtain or a vertical drip.
          float sideNoise =
            sin(floorDepth * 17.0 + uTime * 0.035) * 0.014 +
            sin(floorDepth * 39.0 - 1.7) * 0.006;
          float puddleHalfWidth =
            mix(0.505, 0.475, smoothstep(0.0, 0.62, floorDepth)) +
            sideNoise;
          float sideDistance = puddleHalfWidth - abs(vUv.x - 0.5);
          float puddleMask = smoothstep(0.0, 0.012, sideDistance);

          extensionAlpha =
            smoothstep(0.0, 0.035, edgeAmount) * puddleMask;
          return melted;
        }

        vec3 liquidLens(out float alpha) {
          vec2 p = vUv - uCenter;
          p.x *= uAspect;
          float ca = cos(uRotation);
          float sa = sin(uRotation);
          vec2 rp = mat2(ca, -sa, sa, ca) * p;
          vec2 halfSize = vec2(uSizeX, uSizeY);
          float nd = length(rp / halfSize);
          if (nd > 1.0) {
            alpha = 0.0;
            return vec3(0.0);
          }

          vec2 offset = vUv - uCenter;
          vec2 radialDir = normalize(offset + 0.000001);
          vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
          float angle = atan(rp.y, rp.x);
          float rimStrength = smoothstep(uRimStart, 1.0, nd);
          float fluidWave =
            sin(angle * uRimFreq1 + uTime * 0.38) * 0.55 +
            sin(angle * uRimFreq2 - uTime * 0.24) * 0.25;
          float rScreen = (uSizeX + uSizeY) * 0.5;
          vec2 rimOff = tangentDir * fluidWave * rimStrength * rScreen * uRimTangential;

          vec2 baseUV = uCenter + offset + rimOff;
          float rimMask = smoothstep(0.48, 1.0, nd);
          vec2 dispDir = offset * uDispersion * 0.004 * rimMask;

          vec3 col = vec3(0.0);
          vec3 weightSum = vec3(0.0);
          for (int i = 0; i < MAX_SAMPLES; i++) {
            float t = float(i) / float(MAX_SAMPLES - 1);
            vec2 sUV = baseUV + dispDir * (t - 0.5);
            vec3 sampleColor = texture2D(uTex, sUV).rgb;
            vec3 w = vec3(
              exp(-pow((t - 0.0) / 0.38, 2.0)),
              exp(-pow((t - 0.5) / 0.38, 2.0)),
              exp(-pow((t - 1.0) / 0.38, 2.0))
            );
            col += sampleColor * w;
            weightSum += w;
          }
          col /= max(weightSum, vec3(0.001));

          float shimmer =
            sin(angle * uShimmerFreq + uTime * uShimmerSpeed) * uShimmerDepth +
            (1.0 - uShimmerDepth);
          float glass = exp(-pow((nd * 0.5 - 0.49) / 0.02, 2.0)) * shimmer;
          col += vec3(glass * 0.13);
          col += vec3(exp(-(nd * nd) / 0.025) * uGlow * 0.004);
          col *= mix(0.94, 1.02, smoothstep(0.0, 0.45, nd));

          alpha = smoothstep(1.22, 0.72, nd);
          return col;
        }

        void main() {
          vec3 base = texture2D(uTex, vUv).rgb;
          float extensionAlpha = 0.0;
          vec3 extended = wavyGridEdgeExtension(base, extensionAlpha);
          gl_FragColor = vec4(extended, extensionAlpha * uFx);
          #include <colorspace_fragment>
        }
      `,
    });
    const slitQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      slitMaterial,
    );
    slitScene.add(slitQuad);

    const viewport = {
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight,
      worldH: 8.8,
      worldW: 8.8,
      cardW: 4.2,
      cardH: 2.95,
      tableY: -1.7,
      pileX: 1.95,
    };

    const resize = () => {
      viewport.width = container.clientWidth || window.innerWidth;
      viewport.height = container.clientHeight || window.innerHeight;
      const aspect = viewport.width / Math.max(1, viewport.height);
      viewport.worldH = viewport.width < 760 ? 11.4 : 8.8;
      viewport.worldW = viewport.worldH * aspect;
      viewport.cardW = viewport.width < 760 ? 3.4 : 4.2;
      viewport.cardH = viewport.cardW / CARD_RATIO;
      viewport.tableY = viewport.width < 760 ? -2.6 : -1.75;
      viewport.pileX = Math.min(viewport.cardW * 0.49, viewport.worldW * 0.18);

      camera.left = -viewport.worldW / 2;
      camera.right = viewport.worldW / 2;
      camera.top = viewport.worldH / 2;
      camera.bottom = -viewport.worldH / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(viewport.width, viewport.height, false);
      renderTarget.setSize(viewport.width * dpr, viewport.height * dpr);
      slitUniforms.uAspect.value = viewport.width / Math.max(1, viewport.height);

      const columns = viewport.width <= 1024 ? 2 : 3;
      const gap =
        (CAROUSEL.gapPx / Math.max(1, viewport.height)) * viewport.worldH;
      const panelW =
        (viewport.worldW - gap * (columns + 1)) / columns;
      const panelH = panelW / (4 / 5);
      const visibleRows = Math.max(
        1,
        Math.floor((viewport.worldH + gap) / (panelH + gap)),
      );
      const centerY = viewport.worldH * 0.02;
      const lowestRowY =
        centerY - ((visibleRows - 1) / 2) * (panelH + gap);
      const bottomEdgeUv =
        0.5 + (lowestRowY - panelH / 2) / viewport.worldH;
      slitUniforms.uFloorEdge.value = Math.max(
        0.045,
        Math.min(0.3, bottomEdgeUv),
      );
    };

    resize();
    window.addEventListener("resize", resize);

    const loader = new THREE.TextureLoader();

    const makeCard = (project, index, texture, marbleCardTexture) => {
      const { slot } = getPacket(index, textureProjects.length);
      const group = new THREE.Group();
      const geometry = new THREE.PlaneGeometry(viewport.cardW, viewport.cardH, 48, 18);
      geometry.userData.basePositions = geometry.attributes.position.array.slice();
      geometry.userData.cardW = viewport.cardW;

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        color: texture ? "#ffffff" : "#cfcfcf",
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      });
      const image = new THREE.Mesh(geometry, material);
      image.userData.cardGroup = group;
      image.renderOrder = slot * 2 + 1;
      group.add(image);

      const marbleGeometry = geometry.clone();
      marbleGeometry.userData.basePositions =
        marbleGeometry.attributes.position.array.slice();
      marbleGeometry.userData.cardW = viewport.cardW;
      const marbleFace = new THREE.Mesh(
        marbleGeometry,
        new THREE.MeshBasicMaterial({
          map: marbleCardTexture,
          color: marbleCardTexture ? "#ffffff" : "#cfcfcf",
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
        }),
      );
      marbleFace.position.z = -0.009;
      marbleFace.renderOrder = slot * 2;
      group.add(marbleFace);

      const backGeometry = new THREE.PlaneGeometry(viewport.cardW, viewport.cardH, 48, 18);
      backGeometry.userData.basePositions = backGeometry.attributes.position.array.slice();
      backGeometry.userData.cardW = viewport.cardW;
      const back = new THREE.Mesh(
        backGeometry,
        new THREE.MeshBasicMaterial({
          color: COLORS.edge,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
        }),
      );
      back.position.z = -0.018;
      back.renderOrder = slot * 2;
      group.add(back);

      group.userData = {
        index,
        project,
        mesh: image,
        marbleFace,
        back,
        bend: 0,
        target: getGridPose(index, textureProjects.length, viewport),
      };

      applyPose(group, {
        x: 0,
        y: viewport.tableY + index * 0.025,
        z: slot * 0.012,
        rx: -HPI,
        ry: 0,
        rz: 0,
        scale: 0.94,
        bend: 0,
      });
      world.add(group);
      cards.push(group);
    };

    Promise.all([
      Promise.all(
        textureProjects.map((project) => buildCardTexture(loader, project)),
      ),
      marbleTexture
        ? buildCardTexture(loader, { src: marbleTexture })
        : Promise.resolve(null),
    ]).then(
      ([textures, marbleCardTexture]) => {
        if (destroyed) return;
        textureProjects.forEach((project, index) =>
          makeCard(project, index, textures[index], marbleCardTexture),
        );
      },
    );

    const interleavedY = (slot) => viewport.tableY + 0.16 + slot * 0.032;

    const stackPose = (index) => ({
      x: 0,
      y: viewport.tableY + index * 0.025,
      z: getPacket(index, textureProjects.length).slot * 0.012,
      rx: -HPI,
      ry: 0,
      rz: 0,
      scale: 0.94,
      bend: 0,
    });

    const landedStackPose = (index) => {
      const { slot } = getPacket(index, textureProjects.length);

      return {
        x: 0,
        y: interleavedY(slot),
        z: slot * 0.022,
        rx: -HPI,
        ry: 0,
        rz: 0,
        scale: 0.94,
        bend: 0,
      };
    };

    const splitPose = (index) => {
      const { side, local, slot } = getPacket(index, textureProjects.length);
      return {
        x: side * viewport.pileX,
        y: viewport.tableY + 0.28 + local * 0.045,
        z: slot * 0.015,
        rx: -HPI,
        ry: 0,
        rz: side * 0.055,
        scale: 0.94,
        bend: -1.18,
      };
    };

    const rifflePose = (index, progress) => {
      const { side, local, slot } = getPacket(index, textureProjects.length);
      const delay = local * 0.052 + (side > 0 ? 0.028 : 0);
      const fall = smooth(clamp01((progress - delay) / 0.48));
      const flutter = Math.sin(fall * Math.PI);
      const start = splitPose(index);
      const end = {
        x: side * (viewport.cardW / 2 - 0.28) + (slot % 2 === 0 ? -0.025 : 0.025),
        y: interleavedY(slot),
        z: slot * 0.022,
        rx: -HPI,
        ry: side * flutter * 0.14,
        rz: side * 0.025,
        scale: 0.94,
        bend: 0.05,
      };

      return {
        ...lerpPose(start, end, fall),
        y: mix(start.y, end.y, fall) + flutter * 0.12,
      };
    };

    const bridgePose = (index, progress) => {
      const mid = (textureProjects.length - 1) / 2;
      const { side, local, slot } = getPacket(index, textureProjects.length);
      const shell = 0.026;
      const innerRadius = viewport.cardW * 0.29;
      const fullPhi = viewport.cardW / innerRadius;
      const handRise = 0.42;
      const t = clamp01(progress);
      const slide = seg(t, 0.01, 0.3);
      const buckle = seg(t, 0.18, 1);
      const weight = seg(t, 0.19, 0.3);
      const flatX = side * (viewport.cardW / 2 - 0.28);
      const flatY = mix(
        viewport.tableY + 0.28 + local * 0.045,
        interleavedY(slot),
        slide,
      );
      const buckleT = 0.14 + 0.86 * buckle;
      const overlap = viewport.cardW * buckleT;
      const strip = 2 * viewport.cardW - overlap;
      const phi = fullPhi * buckleT;
      const radius = strip / phi;
      const cardRadius = radius + slot * shell;
      const phiMid = side * (phi / 2 - viewport.cardW / (2 * radius));
      const handY = viewport.tableY + 0.16 + handRise * buckle;
      const arcX = cardRadius * Math.sin(phiMid);
      const arcY = handY + cardRadius * Math.cos(phiMid) - radius * Math.cos(phi / 2);

      return {
        x: mix(flatX, arcX, weight),
        y: mix(flatY, arcY, weight),
        z: getLayer(slot, textureProjects.length) * 0.03,
        rx: -HPI,
        ry: mix(0, phiMid, weight),
        rz: side * 0.05 * (1 - smooth(t)),
        scale: 0.94,
        bend: mix(0.05, viewport.cardW / cardRadius, weight),
      };
    };

    const cascadePose = (index, progress) => {
      const { side, slot } = getPacket(index, textureProjects.length);
      const delay = slot * 0.026;
      const local = smooth(clamp01((progress - delay) / 0.82));
      const flick = Math.sin(local * Math.PI);
      const start = bridgePose(index, 1);
      const end = landedStackPose(index);

      return {
        ...lerpPose(start, end, local),
        x: mix(start.x, end.x, local) + side * flick * 0.18,
        bend: start.bend * (1 - local),
      };
    };

    const gridMovePose = (index, progress) => {
      const { slot } = getPacket(index, textureProjects.length);
      const delay = slot * 0.018;
      const local = smooth(clamp01((progress - delay) / 0.62));
      const lift = Math.sin(local * Math.PI) * 0.38;
      const start = landedStackPose(index);
      const grid = getGridPose(index, textureProjects.length, viewport);
      return {
        ...lerpPose(start, grid, local),
        y: mix(start.y, grid.y, local) + lift,
        bend: 0,
      };
    };

    const poseFor = (index, t) => {
      const stacked = stackPose(index);
      const split = splitPose(index);

      if (t < 0.13) return lerpPose(stacked, split, smooth(t / 0.13));
      if (t < 0.18) return split;
      if (t < 0.4) return rifflePose(index, (t - 0.18) / 0.22);
      if (t < 0.6) return bridgePose(index, (t - 0.4) / 0.2);
      if (t < 0.84) return cascadePose(index, (t - 0.6) / 0.24);
      return gridMovePose(index, (t - 0.84) / 0.16);
    };

    const startShuffle = () => {
      if (!cards.length) return;
      if (!ENABLE_BRIDGE_SHUFFLE) {
        state = "grid";
        stateTime = 0;
        return;
      }
      state = "shuffle";
      stateTime = 0;
    };

    sceneRef.current = { startShuffle };

    const setPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const updateHover = (event) => {
      if (!cards.length || state !== "grid") return;
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(
        cards.map((card) => card.userData.mesh),
        false,
      );
      hoverTarget = intersections[0]?.object?.userData?.cardGroup || null;
      const isHovering = Boolean(hoverTarget);
      if (isHovering !== wasHovering) {
        wasHovering = isHovering;
        document
          .querySelector('iframe[title="Loading portfolio"]')
          ?.contentWindow?.postMessage(
            { type: "home-card-hover", active: isHovering },
            window.location.origin,
          );
      }
      renderer.domElement.style.cursor = hoverTarget ? "pointer" : "grab";
      if (hoverTarget) {
        const nextIndex = hoverTarget.userData.index;
        if (activeRef.current !== nextIndex) {
          activeRef.current = nextIndex;
          onActiveProjectChange?.(nextIndex);
        }
      }
    };

    const handleClick = (event) => {
      if (state !== "grid") {
        startShuffle();
        return;
      }
      updateHover(event);
      if (hoverTarget) onOpenProject?.(hoverTarget.userData.index);
    };
    const clearHover = () => {
      hoverTarget = null;
      if (!wasHovering) return;
      wasHovering = false;
      document
        .querySelector('iframe[title="Loading portfolio"]')
        ?.contentWindow?.postMessage(
          { type: "home-card-hover", active: false },
          window.location.origin,
        );
    };

    const handleKeyDown = (event) => {
      if (event.code === "Space") {
        if (!ENABLE_BRIDGE_SHUFFLE) return;
        event.preventDefault();
        startShuffle();
      }
    };

    const handleWheel = (event) => {
      if (state !== "grid") return;
      event.preventDefault();
      const columns = viewport.width <= 1024 ? 2 : 3;
      const gap =
        (CAROUSEL.gapPx / Math.max(1, viewport.height)) * viewport.worldH;
      const panelW =
        (viewport.worldW - gap * (columns + 1)) / columns;
      const panelH = panelW / (4 / 5);
      const visibleRows = Math.max(
        1,
        Math.floor((viewport.worldH + gap) / (panelH + gap)),
      );
      const maxOffset = Math.max(
        0,
        Math.ceil(textureProjects.length / columns) - visibleRows,
      );
      carousel.target = Math.max(
        0,
        Math.min(
          maxOffset,
          carousel.target + event.deltaY * CAROUSEL.wheel,
        ),
      );
      carousel.lastWheelAt = performance.now();
      carousel.snapQueued = false;
    };

    renderer.domElement.addEventListener("pointermove", updateHover);
    renderer.domElement.addEventListener("pointerleave", clearHover);
    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.045);
      lastTime = now;
      stateTime += dt;

      if (ENABLE_BRIDGE_SHUFFLE && state === "intro" && stateTime > 0.35) {
        startShuffle();
      }

      const glide = carousel.target - carousel.current;
      carousel.current += glide * CAROUSEL.ease;
      const speed = Math.abs(glide);
      const targetShrink = Math.min(1, speed / 1.4);
      carousel.speedShrink = mix(
        carousel.speedShrink,
        targetShrink,
        targetShrink > carousel.speedShrink
          ? CAROUSEL.shrinkAttack
          : CAROUSEL.shrinkDecay,
      );

      if (
        state === "grid" &&
        !carousel.snapQueued &&
        Math.abs(glide) < CAROUSEL.snapDist &&
        now - carousel.lastWheelAt > CAROUSEL.snapDelay
      ) {
        carousel.target = Math.round(carousel.target);
        carousel.snapQueued = true;
      }

      const columns = viewport.width <= 1024 ? 2 : 3;
      const activeSlot = Math.max(
        0,
        Math.min(
          textureProjects.length - 1,
          Math.round(carousel.current) * columns,
        ),
      );
      const activeCard = cards.find(
        (card) =>
          getPacket(card.userData.index, textureProjects.length).slot === activeSlot,
      );
      if (activeCard && activeRef.current !== activeCard.userData.index) {
        activeRef.current = activeCard.userData.index;
        onActiveProjectChange?.(activeCard.userData.index);
      }

      cards.forEach((card, index) => {
        const { slot } = getPacket(index, textureProjects.length);
        const revealStartedAt = revealStartedAtRef.current;
        const revealProgress =
          visibleRef.current && revealStartedAt !== null
            ? smooth(clamp01((now - revealStartedAt - slot * 145) / 520))
            : 0;
        const imageProgress =
          visibleRef.current && revealStartedAt !== null
            ? smooth(clamp01((now - revealStartedAt - slot * 145 - 260) / 720))
            : 0;
        card.userData.mesh.material.opacity = imageProgress;
        card.userData.marbleFace.material.opacity =
          revealProgress * (1 - imageProgress);
        card.userData.back.material.opacity = revealProgress;
        const layer =
          state === "grid"
            ? textureProjects.length - Math.abs(slot - carousel.current)
            : slot;
        card.userData.back.renderOrder = layer * 3;
        card.userData.marbleFace.renderOrder = layer * 3 + 1;
        card.userData.mesh.renderOrder = layer * 3 + 2;

        let target;
        if (state === "shuffle" || state === "intro") {
          const t = clamp01(stateTime / 5.6);
          target = poseFor(index, t);
          if (t >= 1 && index === cards.length - 1) state = "grid";
        } else {
          target = getGridPose(
            index,
            textureProjects.length,
            viewport,
            carousel.current,
            carousel.speedShrink,
          );
          if (hoverTarget === card) {
            target = {
              ...target,
              y: target.y + 0.13,
              z: target.z + 0.22,
              scale: target.scale * 1.035,
              scaleX: target.scaleX * 1.035,
              scaleY: target.scaleY * 1.035,
            };
          }
        }

        // Keep the card face planar while it rises out of the background. Depth and
        // a restrained scale overshoot create the lift without making the image wavy.
        if (state === "grid" && revealProgress < 1) {
          const gooArc = Math.sin(revealProgress * Math.PI);
          target = {
            ...target,
            z: target.z + gooArc * 0.42,
            scaleX:
              target.scaleX * (0.94 + revealProgress * 0.06 + gooArc * 0.045),
            scaleY:
              target.scaleY * (0.94 + revealProgress * 0.06 + gooArc * 0.045),
            bend: target.bend,
          };
        }

        card.userData.bend = mix(card.userData.bend, target.bend, 0.22);
        applyPose(card, target);
        deformPlane(card.userData.mesh, card.userData.bend, viewport.cardW);
        deformPlane(card.userData.marbleFace, card.userData.bend, viewport.cardW);
        deformPlane(card.userData.back, card.userData.bend, viewport.cardW);
      });

      world.rotation.x = mix(world.rotation.x, state === "grid" ? 0 : 0.08, 0.06);
      world.rotation.y = 0;
      slitUniforms.uTime.value = now * 0.001;
      // Keep the card presentation clean over the retained marble background.
      // The previous liquid-lens extension read as a gooey layer beneath it.
      slitUniforms.uFx.value = 0;
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      renderer.autoClear = false;
      renderer.render(slitScene, slitCamera);
      renderer.autoClear = true;
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      destroyed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      renderer.domElement.removeEventListener("pointermove", updateHover);
      renderer.domElement.removeEventListener("pointerleave", clearHover);
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      sceneRef.current = null;
      cards.forEach((card) => {
        card.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        });
      });
      renderTarget.dispose();
      slitQuad.geometry.dispose();
      slitMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [textureProjects, marbleTexture, onActiveProjectChange, onOpenProject]);

  useEffect(() => {
    if (shuffleSignal > 0) sceneRef.current?.startShuffle();
  }, [shuffleSignal]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-10 overflow-hidden ${
        visible ? "" : "pointer-events-none"
      }`}
    >
    </div>
  );
}

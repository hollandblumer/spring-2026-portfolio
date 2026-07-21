"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const TEX_W = 4096;
const TEX_H = 2048;
const PLANE_W = 8;
const PLANE_H = 4;
const TEXT_Y_OFFSET = 3;
const FLAT_ROWS = 50;
const CURL_ROWS = 260;
const COLS = 50;

const DEFAULTS = {
  text: "SPIRAL",
  cutStart: 0.85,
  curlTurns: 3.5,
  curlRadius: 0.3,
  curlTaper: 3,
  curlLength: 11,
  peelDepth: 0.4,
  retractSpeed: 0.6,
  bgColor: "#bfaed4",
  textColor: "#ce0002",
  backColor: "#e4dcdc",
};

function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits);
}

export default function TwistText() {
  const shellRef = useRef(null);
  const settingsRef = useRef(DEFAULTS);
  const sceneApiRef = useRef(null);
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    settingsRef.current = settings;
    sceneApiRef.current?.drawTextTexture();
    sceneApiRef.current?.updateSceneColors();
    sceneApiRef.current?.rebuild();
  }, [settings]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;

    const textCanvas = document.createElement("canvas");
    textCanvas.width = TEX_W;
    textCanvas.height = TEX_H;
    const textContext = textCanvas.getContext("2d");

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = TEX_W;
    maskCanvas.height = TEX_H;
    const maskContext = maskCanvas.getContext("2d");

    const texture = new THREE.CanvasTexture(textCanvas);
    const maskTexture = new THREE.CanvasTexture(maskCanvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    const clock = new THREE.Clock();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    shell.appendChild(renderer.domElement);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    for (const tex of [texture, maskTexture]) {
      tex.anisotropy = maxAniso;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
    }

    let planeGeo = null;
    let frontMesh = null;
    let backMesh = null;
    let animationFrame = 0;
    let camAngle = 0;
    let camElev = 0;
    let camDist = 9;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const cameraTargetY = 1.3;

    function drawTextTexture() {
      const current = settingsRef.current;

      textContext.clearRect(0, 0, TEX_W, TEX_H);
      textContext.fillStyle = current.textColor;
      textContext.textAlign = "center";
      textContext.textBaseline = "middle";
      textContext.font = "bold 1040px Impact, Arial Narrow, sans-serif";
      textContext.fillText(current.text || " ", TEX_W / 2, TEX_H / 2, TEX_W - 40);
      texture.needsUpdate = true;

      maskContext.clearRect(0, 0, TEX_W, TEX_H);
      maskContext.fillStyle = "#ffffff";
      maskContext.textAlign = "center";
      maskContext.textBaseline = "middle";
      maskContext.font = "bold 1040px Impact, Arial Narrow, sans-serif";
      maskContext.fillText(current.text || " ", TEX_W / 2, TEX_H / 2, TEX_W - 40);
      maskTexture.needsUpdate = true;
    }

    const frontMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: true,
      alphaTest: 0.06,
    });
    const backMat = new THREE.MeshBasicMaterial({
      map: maskTexture,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: true,
      alphaTest: 0.06,
      color: settingsRef.current.backColor,
    });

    function applyCutStart(geo, cutStart) {
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      const flatFrac = geo.userData.flatFrac;
      const curlT = geo.userData.curlT;
      const curlBaseY = geo.userData.curlBaseY;
      const flatVertCount = geo.userData.flatVertCount;
      const yShift = -cutStart * PLANE_H;

      for (let v = 0; v < pos.count; v += 1) {
        if (v < flatVertCount) {
          const rowFrac = flatFrac[v];
          pos.setY(v, -rowFrac * cutStart * PLANE_H);
          uv.setY(v, 1 - rowFrac * cutStart);
        } else {
          const t = curlT[v];
          pos.setY(v, curlBaseY[v] + yShift);
          uv.setY(v, (1 - cutStart) * (1 - t));
        }
      }

      pos.needsUpdate = true;
      uv.needsUpdate = true;
    }

    function buildGeometry() {
      const current = settingsRef.current;
      const positions = [];
      const uvs = [];
      const indices = [];
      const flatFrac = [];
      const curlT = [];
      const up = new THREE.Vector3(0, 1, 0);
      const epsilon = 1e-4;
      const seamEaseT0 = 0.08;

      function helixPoint(t) {
        const omega = current.curlTurns * Math.PI * 2;
        const angle =
          t < seamEaseT0
            ? omega * ((2 * t * t) / seamEaseT0 - (t * t * t) / (seamEaseT0 * seamEaseT0))
            : omega * t;
        const radius = current.curlRadius * Math.pow(Math.max(0, 1 - t), current.curlTaper);
        const axisOffset = -current.curlRadius * (1 - t);

        return new THREE.Vector3(
          radius * Math.cos(angle) + axisOffset,
          -t * current.curlLength,
          radius * Math.sin(angle),
        );
      }

      for (let r = 0; r <= FLAT_ROWS; r += 1) {
        const rowFrac = r / FLAT_ROWS;
        for (let c = 0; c <= COLS; c += 1) {
          const cu = c / COLS;
          positions.push((cu - 0.5) * PLANE_W, 0, 0);
          uvs.push(cu, 1);
          flatFrac.push(rowFrac);
          curlT.push(0);
        }
      }

      function smoothstep01(x) {
        const clamped = Math.min(1, Math.max(0, x));
        return clamped * clamped * (3 - 2 * clamped);
      }

      const flatBinormal = new THREE.Vector3(1, 0, 0);
      let prevBinormal = new THREE.Vector3(1, 0, 0);
      for (let i = 0; i <= CURL_ROWS; i += 1) {
        const t = i / CURL_ROWS;
        const center = helixPoint(t);
        const tBack = Math.max(0, t - epsilon);
        const tFwd = Math.min(1, t + epsilon);
        const tangent = helixPoint(tFwd).sub(helixPoint(tBack)).normalize();
        let binormal = new THREE.Vector3().crossVectors(tangent, up);

        if (binormal.lengthSq() < 1e-6) {
          binormal = prevBinormal.clone();
        } else {
          binormal.normalize();
          if (binormal.dot(prevBinormal) < 0) binormal.negate();
        }
        prevBinormal = binormal;

        const blend = smoothstep01(t / 0.08);
        const orientBinormal = flatBinormal.clone().lerp(binormal, blend).normalize();
        const width = PLANE_W * (1 - t * 0.2);

        for (let c = 0; c <= COLS; c += 1) {
          const cu = c / COLS;
          const p = center.clone().addScaledVector(orientBinormal, (cu - 0.5) * width);
          positions.push(p.x, p.y, p.z);
          uvs.push(cu, 1 - t);
          flatFrac.push(0);
          curlT.push(t);
        }
      }

      const totalRows = FLAT_ROWS + CURL_ROWS;
      for (let r = 0; r < totalRows; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          const a = r * (COLS + 1) + c;
          const b = a + 1;
          const cIdx = a + (COLS + 1);
          const d = cIdx + 1;
          indices.push(a, cIdx, b, b, cIdx, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.userData.flatFrac = new Float32Array(flatFrac);
      geo.userData.curlT = new Float32Array(curlT);
      geo.userData.curlBaseY = new Float32Array(positions.filter((_, index) => index % 3 === 1));
      geo.userData.flatVertCount = (FLAT_ROWS + 1) * (COLS + 1);
      applyCutStart(geo, current.cutStart);
      return geo;
    }

    function rebuild() {
      const newGeo = buildGeometry();
      if (planeGeo) planeGeo.dispose();
      planeGeo = newGeo;

      if (!frontMesh) {
        frontMesh = new THREE.Mesh(planeGeo, frontMat);
        backMesh = new THREE.Mesh(planeGeo, backMat);
        frontMesh.position.y = TEXT_Y_OFFSET;
        backMesh.position.y = TEXT_Y_OFFSET;
        scene.add(frontMesh, backMesh);
      } else {
        frontMesh.geometry = planeGeo;
        backMesh.geometry = planeGeo;
      }
    }

    function updateSceneColors() {
      const current = settingsRef.current;
      scene.background = new THREE.Color(current.bgColor);
      scene.fog = new THREE.FogExp2(new THREE.Color(current.bgColor).getHex(), 0.01);
      renderer.setClearColor(new THREE.Color(current.bgColor).getHex());
      backMat.color.set(current.backColor);
    }

    function updateCamera() {
      camera.position.x = Math.sin(camAngle) * camDist;
      camera.position.z = Math.cos(camAngle) * camDist;
      camera.position.y = cameraTargetY + camElev * camDist;
      camera.lookAt(0, cameraTargetY, 0);
    }

    function getCycleDuration(current) {
      return 1.2 + 4 + 1.5 + current.retractSpeed;
    }

    function animatePeel(time) {
      if (!planeGeo) return;
      const current = settingsRef.current;
      const cyclePos = time % getCycleDuration(current);
      let p = 0;

      if (cyclePos < 1.2) {
        p = 0;
      } else if (cyclePos < 5.2) {
        const raw = (cyclePos - 1.2) / 4;
        p = raw * raw * (3 - 2 * raw);
      } else if (cyclePos < 6.7) {
        p = 1;
      } else {
        const raw = (cyclePos - 6.7) / current.retractSpeed;
        p = 1 - raw * raw;
      }

      const cutStart = current.cutStart + (current.peelDepth - current.cutStart) * p;
      applyCutStart(planeGeo, cutStart);
    }

    function resize() {
      const rect = shell.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function loop() {
      animationFrame = requestAnimationFrame(loop);
      animatePeel(clock.getElapsedTime());
      updateCamera();
      renderer.render(scene, camera);
    }

    function handlePointerDown(event) {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      shell.setPointerCapture?.(event.pointerId);
    }

    function handlePointerMove(event) {
      if (!dragging) return;
      camAngle -= (event.clientX - lastX) * 0.006;
      camElev = Math.max(-0.4, Math.min(0.7, camElev + (event.clientY - lastY) * 0.004));
      lastX = event.clientX;
      lastY = event.clientY;
    }

    function handlePointerUp(event) {
      dragging = false;
      shell.releasePointerCapture?.(event.pointerId);
    }

    function handleWheel(event) {
      camDist = Math.max(3, Math.min(20, camDist + event.deltaY * 0.01));
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(shell);
    shell.addEventListener("pointerdown", handlePointerDown);
    shell.addEventListener("pointermove", handlePointerMove);
    shell.addEventListener("pointerup", handlePointerUp);
    shell.addEventListener("pointercancel", handlePointerUp);
    shell.addEventListener("wheel", handleWheel, { passive: true });

    drawTextTexture();
    updateSceneColors();
    rebuild();
    sceneApiRef.current = { drawTextTexture, updateSceneColors, rebuild };
    resize();
    loop();

    return () => {
      sceneApiRef.current = null;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      shell.removeEventListener("pointerdown", handlePointerDown);
      shell.removeEventListener("pointermove", handlePointerMove);
      shell.removeEventListener("pointerup", handlePointerUp);
      shell.removeEventListener("pointercancel", handlePointerUp);
      shell.removeEventListener("wheel", handleWheel);
      frontMat.dispose();
      backMat.dispose();
      texture.dispose();
      maskTexture.dispose();
      if (planeGeo) planeGeo.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="twist-wrapper">
      <div className="contour-controls twist-controls">
        <div className="template-controls-title template-controls-title--contour">
          <span className="template-controls-title__top">Twist</span>
          <span className="template-controls-title__bottom">Twist</span>
        </div>

        <details className="contour-step" open>
          <summary className="contour-step-title">Text</summary>
          <div className="contour-row">
            <label className="contour-control">
              <span className="contour-label">Text</span>
              <input
                type="text"
                value={settings.text}
                onChange={(event) => updateSetting("text", event.target.value)}
              />
            </label>
          </div>
        </details>

        <details className="contour-step" open>
          <summary className="contour-step-title">Twist</summary>
          <div className="contour-row">
            {[
              ["cutStart", "Peel starts at", 0.15, 0.85, 0.01, 2],
              ["peelDepth", "Peel stops at", 0.15, 0.85, 0.01, 2],
              ["curlLength", "Peel length", 2, 16, 0.1, 1],
              ["retractSpeed", "Retract speed", 0.1, 2, 0.1, 1],
              ["curlTurns", "Curl turns", 1, 24, 0.5, 1],
              ["curlRadius", "Curl radius", 0.3, 3, 0.05, 2],
              ["curlTaper", "Tightness", 0.3, 3, 0.05, 2],
            ].map(([key, label, min, max, step, digits]) => (
              <label className="contour-control" key={key}>
                <div className="contour-label-row">
                  <span className="contour-label">{label}</span>
                  <span className="contour-value">{formatNumber(settings[key], digits)}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={settings[key]}
                  onChange={(event) => updateSetting(key, parseFloat(event.target.value))}
                />
              </label>
            ))}
          </div>
        </details>

        <details className="contour-step">
          <summary className="contour-step-title">Color</summary>
          <div className="contour-row">
            {[
              ["bgColor", "Background"],
              ["textColor", "Letter"],
              ["backColor", "Back"],
            ].map(([key, label]) => (
              <label className="contour-color-row contour-color-row--text" key={key}>
                <span className="contour-color-order">{label}</span>
                <span
                  className="contour-color-swatch"
                  style={{ backgroundColor: settings[key] }}
                />
                <input
                  type="color"
                  value={settings[key]}
                  onChange={(event) => updateSetting(key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </details>
      </div>

      <div className="twist-display-area">
        <div className="twist-canvas-shell" ref={shellRef} />
      </div>
    </section>
  );
}

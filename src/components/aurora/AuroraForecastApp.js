"use client";

import { Camera, LocateFixed, MapPin, ScanLine, Search, X } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import AuroraHeatmap from "./AuroraHeatmap";
import styles from "./AuroraForecastApp.module.css";

const NOAA_KP_FORECAST_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json";
const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_INTERVAL_MS = 15 * 60 * 1000;
const FORECAST_POINT_COUNT = 145;
const FALLBACK_KP_FORECAST = Array.from({ length: FORECAST_POINT_COUNT }, () => 0);
const DEFAULT_LOCATION = { latitude: 40.7128, longitude: -74.006, name: "New York", region: "New York", timezone: "America/New_York" };
const PRELOADER_LINES = Array.from({ length: 36 }, (_, index) => {
  const wave = (Math.sin(index * 0.42) + 1) / 2;
  const swell = Math.exp(-Math.pow((index - 20) / 9, 2));
  return Math.round(12 + wave * 24 + swell * 48);
});

function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

function parseNoaaTime(timeTag) {
  return new Date(`${timeTag}Z`).getTime();
}

function buildKpForecast(rows, startTime) {
  const points = rows
    .map((row) => ({ kp: Number(row.kp), time: parseNoaaTime(row.time_tag) }))
    .filter((row) => Number.isFinite(row.kp) && Number.isFinite(row.time))
    .sort((a, b) => a.time - b.time);

  if (points.length < 2) return [];

  return Array.from({ length: FORECAST_POINT_COUNT }, (_, index) => {
    const time = startTime.getTime() + index * FORECAST_INTERVAL_MS;
    const nextIndex = points.findIndex((point) => point.time >= time);

    if (nextIndex <= 0) return points[Math.max(0, nextIndex)]?.kp ?? 0;
    if (nextIndex === -1) return points.at(-1).kp;

    const previous = points[nextIndex - 1];
    const next = points[nextIndex];
    const progress = (time - previous.time) / (next.time - previous.time);
    return Number((previous.kp + (next.kp - previous.kp) * progress).toFixed(2));
  });
}

function nearestHourlyValue(weather, time, key, fallback) {
  if (!weather?.hourly?.time?.length) return fallback;
  const index = weather.hourly.time.reduce((best, value, candidate) => (
    Math.abs(new Date(`${value}Z`).getTime() - time) < Math.abs(new Date(`${weather.hourly.time[best]}Z`).getTime() - time)
      ? candidate
      : best
  ), 0);
  return weather.hourly[key]?.[index] ?? fallback;
}

function estimateViewingChance(kp, location, weather, time) {
  const requiredKp = Math.max(0, Math.min(9, (66 - Math.abs(location.latitude)) / 3));
  const geomagneticChance = 100 / (1 + Math.exp(-(kp - requiredKp) * 1.55));
  const cloudCover = nearestHourlyValue(weather, time, "cloud_cover", 50);
  const isDay = nearestHourlyValue(weather, time, "is_day", 1);
  const visibility = nearestHourlyValue(weather, time, "visibility", 16000);
  const darknessFactor = isDay ? 0.015 : 1;
  const cloudFactor = Math.pow(Math.max(0.05, 1 - cloudCover / 100), 1.35);
  const visibilityFactor = Math.max(0.35, Math.min(1, visibility / 16000));
  return Math.round(Math.max(0, Math.min(99, geomagneticChance * darknessFactor * cloudFactor * visibilityFactor)));
}

function kpToBarHeight(kp) {
  return Math.max(14, Math.min(100, 14 + (kp / 9) * 86));
}

function buildSmoothPath(values) {
  const points = values.map((height, index) => ({
    x: ((index + 0.5) / values.length) * 100,
    y: 100 - height * 0.9,
  }));

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX},${previous.y} ${controlX},${point.y} ${point.x},${point.y}`;
  }, `M ${points[0].x},${points[0].y}`);
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const auroraFragmentShader = `
uniform vec2 iResolution;
uniform float iTime;
uniform float uDithering;
uniform float uSpeed;
uniform float uSeed;
uniform vec3 uColorBase;
uniform vec3 uColorHigh;
uniform vec3 uSkyDark;
uniform vec3 uSkyDeep;
uniform float uStarDensity;
uniform float uStarSize;
uniform float uStarBlinkRate;
uniform float uStarIntensity;
uniform vec3 uStarColor;
uniform mat3 uCamMatrix;

const float RAY_ITERATIONS = 55.0;
const float Y_OFFSET_BOTTOM = 45.0;
const float VOLUME_DEPTH = 80.0;
vec3 BOUND_LOW = vec3(-500.0, Y_OFFSET_BOTTOM, -500.0);
vec3 BOUND_HIGH = vec3(500.0, Y_OFFSET_BOTTOM + VOLUME_DEPTH, 500.0);

float generateRandomFloat(vec2 seedVal) {
  vec3 p3 = fract(vec3(seedVal.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float computeHash1(float v) {
  vec3 hVec = fract(vec3(v) * 0.1031);
  hVec += dot(hVec, hVec.yzx + 19.19);
  return fract((hVec.x + hVec.y) * hVec.z);
}

float computeHash3(vec3 v3) {
  v3 = fract(v3 * vec3(0.1031, 0.1030, 0.0973));
  v3 += dot(v3, v3.yxz + 33.33);
  return fract((v3.xxy + v3.yxx) * v3.zyx).x;
}

float evaluateVolumeNoise(vec3 coord) {
  vec3 gridP = floor(coord);
  vec3 fractP = fract(coord);
  fractP = fractP * fractP * (3.0 - 2.0 * fractP);
  return mix(
    mix(mix(computeHash3(gridP), computeHash3(gridP + vec3(1.0,0.0,0.0)), fractP.x),
        mix(computeHash3(gridP + vec3(0.0,1.0,0.0)), computeHash3(gridP + vec3(1.0,1.0,0.0)), fractP.x), fractP.y),
    mix(mix(computeHash3(gridP + vec3(0.0,0.0,1.0)), computeHash3(gridP + vec3(1.0,0.0,1.0)), fractP.x),
        mix(computeHash3(gridP + vec3(0.0,1.0,1.0)), computeHash3(gridP + vec3(1.0,1.0,1.0)), fractP.x), fractP.y), fractP.z
  );
}

float smoothCurve(float valT) { return valT * valT * valT * (valT * (6.0 * valT - 15.0) + 10.0); }

float pickGradient(float hVal, float posVal) {
  int idx = int(1e4 * hVal);
  return (idx & 1) == 0 ? posVal : -posVal;
}

float calculateLineNoise(float pt) {
  float ptInt = floor(pt);
  float ptFract = pt - ptInt;
  float wght = smoothCurve(ptFract);
  return mix(pickGradient(computeHash1(ptInt), ptFract), pickGradient(computeHash1(ptInt + 1.0), ptFract - 1.0), wght) * 2.0;
}

float fractalVolumePattern(vec3 spacePt) {
  float accum = 0.0, wghtSum = 0.0, curWght = 1.0, curFreq = 1.0;
  for(int stepId = 0; stepId < 4; stepId++) {
    float nVal = evaluateVolumeNoise(spacePt * curFreq);
    accum += (1.0 - nVal) * curWght;
    wghtSum += curWght;
    curWght *= 0.5; curFreq *= 2.0;
  }
  return clamp(accum / wghtSum, 0.0, 1.0);
}

vec2 computeBoxIntersection(vec3 rOrigin, vec3 rVector, vec3 bLow, vec3 bHigh) {
  vec3 tLower = (bLow - rOrigin) / rVector;
  vec3 tUpper = (bHigh - rOrigin) / rVector;
  vec3 tm1 = min(tLower, tUpper), tm2 = max(tLower, tUpper);
  return vec2(max(max(tm1.x, tm1.y), tm1.z), min(min(tm2.x, tm2.y), tm2.z));
}

bool checkVolumeHit(vec3 rOrg, vec3 rDir, out float enterDist, out float travelDist) {
  vec2 hitPoints = computeBoxIntersection(rOrg, rDir, BOUND_LOW, BOUND_HIGH);
  if(rOrg.y > BOUND_LOW.y && rOrg.y < BOUND_HIGH.y) hitPoints.x = 1e-4;
  enterDist = hitPoints.x;
  travelDist = hitPoints.y - hitPoints.x;
  return hitPoints.x > 0.0 && hitPoints.x < hitPoints.y;
}

vec3 warpSpatialCoords(vec3 rawPos, float timeFlow) {
  float normHeight = (rawPos.y - Y_OFFSET_BOTTOM) / VOLUME_DEPTH;
  vec3 warpedP = 0.04 * vec3(rawPos.x, 2.0 * timeFlow, 0.225 * rawPos.z + timeFlow * 0.5);
  warpedP.xz += vec2(uSeed * 17.3, uSeed * 29.1);
  warpedP.x += 0.3 * normHeight + 5.5 * cos(0.005 * rawPos.z);
  warpedP.x += 0.02 * calculateLineNoise(0.1 * rawPos.z + timeFlow * 2.0);
  return warpedP;
}

float sampleCloudThickness(vec3 localPt) {
  float timeFlow = iTime * uSpeed;
  vec3 shiftedPt = warpSpatialCoords(localPt, timeFlow);
  float basePattern = fractalVolumePattern(shiftedPt);
  vec3 squishedPt = vec3(basePattern, localPt.y - BOUND_LOW.y, basePattern) * vec3(1.0, 0.006, 1.0) + vec3(0.0, 0.48, 0.0);
  squishedPt.y += 0.015 * calculateLineNoise(1.0 * timeFlow + shiftedPt.z) + 0.015 * calculateLineNoise(-2.0 * timeFlow + shiftedPt.z);
  float curtain = max(0.0, pow(0.55 / max(length(squishedPt), 1e-7), 12.0) * cos(0.13 * shiftedPt.x));
  float verticalStrands = mix(0.58, 1.38, pow(evaluateVolumeNoise(vec3(shiftedPt.x * 2.8, 0.0, shiftedPt.z * 0.38)), 3.0));
  return curtain * verticalStrands;
}

vec3 renderAtmosphericLights(vec3 camOrg, vec3 camDir, float noiseShift) {
  float startTrace = 0.0, traceLen = 0.0;
  if(!checkVolumeHit(camOrg, camDir, startTrace, traceLen)) return vec3(0.0);
  float marchStep = traceLen / RAY_ITERATIONS;
  startTrace += marchStep * noiseShift * 0.25;
  vec3 currentPos = camOrg + startTrace * camDir, lightAccum = vec3(0.0);
  float transmittance = 1.0;
  for(float stepIdx = 0.0; stepIdx < RAY_ITERATIONS; stepIdx++) {
    float localDens = sampleCloudThickness(currentPos);
    float rearCurtain = sampleCloudThickness(currentPos + vec3(44.0, 7.0, 34.0)) * 0.34;
    float edgeX = smoothstep(500.0, 360.0, abs(currentPos.x));
    float edgeZ = smoothstep(500.0, 320.0, abs(currentPos.z));
    float edgeY = smoothstep(Y_OFFSET_BOTTOM, Y_OFFSET_BOTTOM + 12.0, currentPos.y) * smoothstep(Y_OFFSET_BOTTOM + VOLUME_DEPTH, Y_OFFSET_BOTTOM + VOLUME_DEPTH - 12.0, currentPos.y);
    float boundaryFade = edgeX * edgeY * edgeZ;
    float colorHeight = (currentPos.y - BOUND_LOW.y) / VOLUME_DEPTH;
    float foldEdge = smoothstep(0.0, 0.32, abs(localDens - sampleCloudThickness(currentPos + vec3(2.5, 0.0, 0.0))));
    vec3 frontColor = mix(uColorBase * 0.72, uColorBase * 1.32, foldEdge);
    frontColor = mix(frontColor, uColorHigh, smoothstep(0.16, 0.8, colorHeight) * (0.35 + foldEdge * 0.65));
    vec3 layerColor = frontColor * localDens + uColorHigh * rearCurtain;
    float density = (localDens + rearCurtain * 0.7) * boundaryFade;
    lightAccum += transmittance * layerColor * boundaryFade * marchStep * 0.072;
    transmittance *= exp(-density * marchStep * 0.018);
    currentPos += camDir * marchStep;
  }
  return lightAccum;
}

vec3 renderStarfield(vec3 viewDir, float timeFlow) {
  float gridScale = 400.0;
  vec3 spaceGrid = floor(viewDir * gridScale), spaceLocal = fract(viewDir * gridScale) - 0.5;
  float cellHash = computeHash3(spaceGrid);
  if(cellHash < (1.0 - uStarDensity * 0.15)) return vec3(0.0);
  float radius = min(max(0.08, gridScale * 1.5 / iResolution.y) * uStarSize, 0.5);
  float blinkAnim = 0.3 + 0.7 * sin(timeFlow * uStarBlinkRate * (1.5 + fract(cellHash * 31.4) * 2.0) + cellHash * 100.0);
  return uStarColor * smoothstep(radius, 0.0, length(spaceLocal)) * (0.08 / radius) * mix(1.0, blinkAnim, step(0.85, fract(cellHash * 31.415)));
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy, screenPos = fragCoord - iResolution.xy / 2.0;
  vec3 sightVec = normalize(uCamMatrix * vec3(screenPos, -(0.5 * iResolution.y / tan(radians(60.0) / 2.0))));
  float ditherShift = generateRandomFloat(fragCoord + vec2(iTime * 13.0, iTime * 27.0));
  vec3 finalOutput = mix(uSkyDark, uSkyDeep, clamp(sightVec.y * 1.5, 0.0, 1.0));
  finalOutput += renderStarfield(sightVec, iTime) * uStarIntensity + renderAtmosphericLights(vec3(0.0, 10.0, 0.0) + sightVec * 10.0, sightVec, ditherShift);
  finalOutput = clamp((finalOutput * (2.51 * finalOutput + 0.03)) / (finalOutput * (2.43 * finalOutput + 0.59) + 0.14), 0.0, 1.0);
  gl_FragColor = vec4(pow(finalOutput, vec3(0.4545)) + (generateRandomFloat(fragCoord + vec2(iTime * 17.0, -iTime * 11.0)) - 0.5) * uDithering, 1.0);
}
`;

const starFragmentShader = `
uniform vec2 iResolution;
uniform float iTime;
uniform float uStarDensity;
uniform float uStarSize;
uniform float uStarBlinkRate;
uniform float uStarIntensity;
uniform vec3 uStarColor;
uniform mat3 uCamMatrix;

float computeHash3(vec3 v3) {
  v3 = fract(v3 * vec3(0.1031, 0.1030, 0.0973));
  v3 += dot(v3, v3.yxz + 33.33);
  return fract((v3.xxy + v3.yxx) * v3.zyx).x;
}

vec3 renderStarfield(vec3 viewDir, float timeFlow) {
  float gridScale = 400.0;
  vec3 spaceGrid = floor(viewDir * gridScale), spaceLocal = fract(viewDir * gridScale) - 0.5;
  float cellHash = computeHash3(spaceGrid);
  if(cellHash < (1.0 - uStarDensity * 0.15)) return vec3(0.0);
  float radius = min(max(0.08, gridScale * 1.5 / iResolution.y) * uStarSize, 0.5);
  float blinkAnim = 0.3 + 0.7 * sin(timeFlow * uStarBlinkRate * (1.5 + fract(cellHash * 31.4) * 2.0) + cellHash * 100.0);
  return uStarColor * smoothstep(radius, 0.0, length(spaceLocal)) * (0.08 / radius) * mix(1.0, blinkAnim, step(0.85, fract(cellHash * 31.415)));
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy, screenPos = fragCoord - iResolution.xy / 2.0;
  vec3 sightVec = normalize(uCamMatrix * vec3(screenPos, -(0.5 * iResolution.y / tan(radians(60.0) / 2.0))));
  vec3 finalOutput = renderStarfield(sightVec, iTime) * uStarIntensity;
  finalOutput = clamp((finalOutput * (2.51 * finalOutput + 0.03)) / (finalOutput * (2.43 * finalOutput + 0.59) + 0.14), 0.0, 1.0);
  gl_FragColor = vec4(pow(finalOutput, vec3(0.4545)), 1.0);
}
`;

function buildCameraMatrix(THREE, gazePoint, targetMatrixElements) {
  const zAxis = new THREE.Vector3().copy(gazePoint).normalize();
  const xAxis = new THREE.Vector3()
    .crossVectors(zAxis, new THREE.Vector3(0, 1, 0))
    .normalize();
  const yAxis = new THREE.Vector3().crossVectors(xAxis, zAxis);

  targetMatrixElements[0] = xAxis.x;
  targetMatrixElements[1] = xAxis.y;
  targetMatrixElements[2] = xAxis.z;
  targetMatrixElements[3] = yAxis.x;
  targetMatrixElements[4] = yAxis.y;
  targetMatrixElements[5] = yAxis.z;
  targetMatrixElements[6] = -zAxis.x;
  targetMatrixElements[7] = -zAxis.y;
  targetMatrixElements[8] = -zAxis.z;
}

function setupRenderer(THREE, container, fragmentShader, uniforms, alpha = true) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha });
  renderer.setPixelRatio(1);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: alpha,
    depthWrite: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(plane);

  return { camera, material, plane, renderer, scene };
}

export default function AuroraForecastApp() {
  const heroRef = useRef(null);
  const starsRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [experienceMode, setExperienceMode] = useState("camera");
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [forecastStart, setForecastStart] = useState(null);
  const [kpForecast, setKpForecast] = useState(FALLBACK_KP_FORECAST);
  const [forecastStatus, setForecastStatus] = useState("Loading NOAA forecast");
  const [forecastUpdatedAt, setForecastUpdatedAt] = useState("");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationError, setLocationError] = useState("");
  const [weather, setWeather] = useState(null);
  const [nowTime, setNowTime] = useState("");
  const [preloaderVisible, setPreloaderVisible] = useState(true);
  const [qrCode, setQrCode] = useState("");
  const [selectedForecast, setSelectedForecast] = useState(0);
  const [heatmapOpen, setHeatmapOpen] = useState(false);
  const [heatmapOrigin, setHeatmapOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = window.setTimeout(() => setPreloaderVisible(false), 2900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    async function start() {
      const THREE = await import("three");
      if (disposed || !heroRef.current || !starsRef.current) return;

      const heroUniforms = {
        iResolution: { value: new THREE.Vector2() },
        iTime: { value: 0 },
        uDithering: { value: 0.0228 },
        uSpeed: { value: 0.35 },
        uSeed: { value: 75 },
        uColorBase: { value: new THREE.Color("#59ff8f") },
        uColorHigh: { value: new THREE.Color("#a66cff") },
        uSkyDark: { value: new THREE.Color("#000000") },
        uSkyDeep: { value: new THREE.Color("#000000") },
        uStarDensity: { value: 0.11 },
        uStarSize: { value: 0.8 },
        uStarBlinkRate: { value: 4.0 },
        uStarIntensity: { value: 0.7 },
        uStarColor: { value: new THREE.Color("#ffffff") },
        uCamMatrix: { value: new THREE.Matrix3() },
      };
      const starUniforms = {
        iResolution: { value: new THREE.Vector2() },
        iTime: { value: 0 },
        uStarDensity: { value: 0.11 },
        uStarSize: { value: 0.8 },
        uStarBlinkRate: { value: 4.0 },
        uStarIntensity: { value: 0.7 },
        uStarColor: { value: new THREE.Color("#ffffff") },
        uCamMatrix: { value: new THREE.Matrix3() },
      };
      const hero = setupRenderer(THREE, heroRef.current, auroraFragmentShader, heroUniforms, false);
      const stars = setupRenderer(THREE, starsRef.current, starFragmentShader, starUniforms, false);
      const clock = new THREE.Clock();

      function resize() {
        const heroWidth = heroRef.current?.clientWidth || 1;
        const heroHeight = heroRef.current?.clientHeight || 1;
        hero.renderer.setSize(heroWidth, heroHeight);
        heroUniforms.iResolution.value.set(heroWidth, heroHeight);
        stars.renderer.setSize(window.innerWidth, window.innerHeight);
        starUniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
      }

      function animate() {
        const elapsed = clock.getElapsedTime();
        heroUniforms.iTime.value = elapsed;
        starUniforms.iTime.value = elapsed;
        const gazeX = -0.4 + Math.sin(elapsed * 0.1) * 0.1;
        const gazeY = 0.45 + Math.cos(elapsed * 0.05) * 0.05;
        const gazePoint = new THREE.Vector3(gazeX, gazeY, -1);
        buildCameraMatrix(THREE, gazePoint, heroUniforms.uCamMatrix.value.elements);
        buildCameraMatrix(THREE, gazePoint, starUniforms.uCamMatrix.value.elements);
        hero.renderer.render(hero.scene, hero.camera);
        stars.renderer.render(stars.scene, stars.camera);
        frame = window.requestAnimationFrame(animate);
      }

      resize();
      animate();
      window.addEventListener("resize", resize);
      cleanup = () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        hero.material.dispose();
        hero.plane.geometry.dispose();
        hero.renderer.dispose();
        hero.renderer.domElement.remove();
        stars.material.dispose();
        stars.plane.geometry.dispose();
        stars.renderer.dispose();
        stars.renderer.domElement.remove();
      };
    }

    start();
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (window.location.search.includes("camera=1")) {
      setExperienceMode("camera");
      setExperienceOpen(true);
    }

    return stopCamera;
  }, [stopCamera]);

  useEffect(() => {
    const updateNowTime = () => {
      const now = new Date();
      setNowTime(formatTime(now, location.timezone));
    };

    updateNowTime();
    const timer = window.setInterval(updateNowTime, 30_000);
    return () => window.clearInterval(timer);
  }, [location.timezone]);

  useEffect(() => {
    let disposed = false;

    const loadWeather = async () => {
      try {
        const params = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          hourly: "cloud_cover,is_day,visibility",
          forecast_days: "4",
          timezone: "UTC",
        });
        const response = await fetch(`${OPEN_METEO_FORECAST_URL}?${params}`);
        if (!response.ok) throw new Error("Weather request failed");
        const nextWeather = await response.json();
        if (!disposed) setWeather(nextWeather);
      } catch {
        if (!disposed) setWeather(null);
      }
    };

    loadWeather();
    const timer = window.setInterval(loadWeather, 15 * 60 * 1000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [location]);

  useEffect(() => {
    let disposed = false;

    const loadForecast = async () => {
      try {
        const response = await fetch(NOAA_KP_FORECAST_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`NOAA request failed with ${response.status}`);

        const rows = await response.json();
        const roundedStart = new Date();
        roundedStart.setMinutes(Math.floor(roundedStart.getMinutes() / 15) * 15, 0, 0);
        const nextForecast = buildKpForecast(rows, roundedStart);
        if (!nextForecast.length) throw new Error("NOAA returned no usable forecast points");

        if (!disposed) {
          setForecastStart(roundedStart);
          setKpForecast(nextForecast);
          setSelectedForecast(0);
          setForecastStatus("Live NOAA forecast");
          setForecastUpdatedAt(formatTime(new Date(), location.timezone));
        }
      } catch {
        if (!disposed) setForecastStatus("NOAA forecast unavailable");
      }
    };

    loadForecast();
    const timer = window.setInterval(loadForecast, 5 * 60 * 1000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [location.timezone]);

  const searchLocations = async (event) => {
    event.preventDefault();
    const query = locationQuery.trim();
    if (query.length < 2) return;
    setLocationError("");

    try {
      const response = await fetch(`${OPEN_METEO_GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      if (!response.ok) throw new Error("Location search failed");
      const data = await response.json();
      setLocationResults(data.results || []);
      if (!data.results?.length) setLocationError("No matching locations found.");
    } catch {
      setLocationError("Location search is unavailable right now.");
    }
  };

  const chooseLocation = (result) => {
    setLocation({
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name,
      region: result.admin1 || result.country,
      timezone: result.timezone,
    });
    setLocationOpen(false);
    setLocationResults([]);
    setLocationQuery("");
  };

  const useCurrentLocation = () => {
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          name: "Current Location",
          region: `${Math.abs(coords.latitude).toFixed(2)}°${coords.latitude >= 0 ? "N" : "S"}, ${Math.abs(coords.longitude).toFixed(2)}°${coords.longitude >= 0 ? "E" : "W"}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setLocationOpen(false);
      },
      () => setLocationError("Location access was unavailable. Search for your city instead."),
    );
  };

  const startCamera = async () => {
    setCameraError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError("Camera access was unavailable. Check your browser permissions and try again.");
    }
  };

  const openCameraExperience = async () => {
    const isPhone = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 800;
    setExperienceMode(isPhone ? "camera" : "qr");
    setExperienceOpen(true);

    if (!isPhone) {
      const cameraUrl = `${window.location.origin}${window.location.pathname}?camera=1`;
      setQrCode(await QRCode.toDataURL(cameraUrl, {
        color: { dark: "#000000", light: "#ffffff" },
        margin: 1,
        width: 240,
      }));
    }
  };

  const closeCameraExperience = () => {
    stopCamera();
    setExperienceOpen(false);
    setCameraError("");
  };

  const timeAtIndex = (index) => {
    if (!forecastStart) return "";
    return formatTime(new Date(forecastStart.getTime() + index * FORECAST_INTERVAL_MS), location.timezone);
  };
  const chanceForecast = kpForecast.map((kp, index) => estimateViewingChance(
    kp,
    location,
    weather,
    forecastStart ? forecastStart.getTime() + index * FORECAST_INTERVAL_MS : Date.now(),
  ));
  const twelveHourPointCount = 49;
  const opportunitySearchEnd = Math.min(kpForecast.length - 1, 96);
  const opportunityPeakIndex = chanceForecast.reduce((bestIndex, chance, index) => (
    index <= opportunitySearchEnd
      && chance * 100 + (nearestHourlyValue(weather, forecastStart ? forecastStart.getTime() + index * FORECAST_INTERVAL_MS : Date.now(), "is_day", 1) ? 0 : 1)
        > chanceForecast[bestIndex] * 100 + (nearestHourlyValue(weather, forecastStart ? forecastStart.getTime() + bestIndex * FORECAST_INTERVAL_MS : Date.now(), "is_day", 1) ? 0 : 1)
      ? index
      : bestIndex
  ), 0);
  const windowStart = Math.max(0, Math.min(opportunityPeakIndex - 24, kpForecast.length - twelveHourPointCount));
  const windowEnd = Math.min(kpForecast.length - 1, windowStart + twelveHourPointCount - 1);
  const visibleForecast = kpForecast.slice(windowStart, windowEnd + 1);
  const visibleChances = chanceForecast.slice(windowStart, windowEnd + 1);
  const visibleBarHeights = visibleForecast.map(kpToBarHeight);
  const peakIndex = chanceForecast.reduce((bestIndex, value, index) => {
    if (index < windowStart || index > windowEnd) return bestIndex;
    return value > chanceForecast[bestIndex] ? index : bestIndex;
  }, windowStart);
  const trendPath = buildSmoothPath(visibleBarHeights);
  const selectedKp = kpForecast[selectedForecast].toFixed(1);
  const selectedChance = chanceForecast[selectedForecast];
  const selectedVisibilityLevel = selectedChance >= 55 ? "Good" : selectedChance >= 20 ? "Fair" : "Poor";
  const selectedTime = forecastStart ? forecastStart.getTime() + selectedForecast * FORECAST_INTERVAL_MS : Date.now();
  const selectedCloudCover = Math.round(nearestHourlyValue(weather, selectedTime, "cloud_cover", 50));
  const selectedIsDay = Boolean(nearestHourlyValue(weather, selectedTime, "is_day", 1));
  const selectedAtmosphericVisibility = Math.round(nearestHourlyValue(weather, selectedTime, "visibility", 16000) / 1000);
  const requiredKp = Math.max(0, Math.min(9, (66 - Math.abs(location.latitude)) / 3));
  const kpGap = Math.max(0, requiredKp - Number(selectedKp));
  const visibilityStatus = selectedChance >= 55 ? "Likely visible" : selectedChance >= 20 ? "Might be visible" : "Unlikely";
  const visibilitySummary = selectedIsDay
    ? "Daylight is the main obstacle. Check the best nighttime window below."
    : selectedCloudCover >= 70
      ? `Cloud cover is the main obstacle at ${selectedCloudCover}%.`
      : kpGap > 0.5
        ? `Magnetic activity needs to rise about ${kpGap.toFixed(1)} Kp for this location.`
        : "Conditions are lining up. Find a dark place with a clear northern horizon.";
  const nightIndexes = kpForecast.map((_, index) => index).filter((index) => {
    if (!forecastStart) return false;
    const hour = Number(new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: location.timezone,
    }).format(new Date(forecastStart.getTime() + index * FORECAST_INTERVAL_MS)));
    return index <= 72 && (hour >= 20 || hour < 6);
  });
  const nightPeakIndex = nightIndexes.reduce((bestIndex, index) => (
    bestIndex === null || chanceForecast[index] > chanceForecast[bestIndex] ? index : bestIndex
  ), null);
  const viewingPeakIndex = nightPeakIndex ?? peakIndex;
  const viewingPeakKp = kpForecast[viewingPeakIndex];
  const viewingPeakChance = chanceForecast[viewingPeakIndex];
  const nakedEyeStart = Math.max(0, viewingPeakIndex - 6);
  const nakedEyeEnd = Math.min(kpForecast.length - 1, viewingPeakIndex + 6);
  const nakedEyeWindow = forecastStart
    ? `${timeAtIndex(nakedEyeStart)} - ${timeAtIndex(nakedEyeEnd)}`
    : "Calculating...";

  return (
    <main className={styles.page}>
      {preloaderVisible && (
        <div className={styles.preloader} aria-label="Loading aurora forecast">
          <div className={styles.preloaderSky} aria-hidden="true">
            <div className={styles.preloaderOrbit}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.preloaderGlow} />
            <div className={styles.preloaderLines}>
              {PRELOADER_LINES.map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  style={{
                    "--line-height": `${height}%`,
                    "--line-delay": `${index * 22}ms`,
                  }}
                />
              ))}
            </div>
            <div className={styles.preloaderHorizon} />
          </div>
          <div className={styles.preloaderLabel}>
            <span>Calibrating the night sky</span>
            <strong>Aurora Forecast</strong>
            <i />
          </div>
        </div>
      )}
      <div ref={starsRef} className={styles.stars} aria-hidden="true" />
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div ref={heroRef} className={styles.aurora} aria-hidden="true" />
          <div className={styles.heroText}>
            <div>
              <h1>Aurora Forecast</h1>
              <button type="button" className={styles.heroLocation} onClick={() => setLocationOpen((open) => !open)}>
                <MapPin size={17} strokeWidth={1.8} />
                {location.name}{location.region ? `, ${location.region}` : ""}
              </button>
              <p className={styles.lastUpdated}>{forecastStatus} · Updated {forecastUpdatedAt || "now"}</p>
              {locationOpen && (
                <div className={styles.locationPicker}>
                  <form onSubmit={searchLocations}>
                    <input
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      placeholder="Search city or postal code"
                      aria-label="Search city or postal code"
                    />
                    <button type="submit" aria-label="Search locations"><Search size={16} /></button>
                  </form>
                  <button type="button" className={styles.currentLocationButton} onClick={useCurrentLocation}>
                    <LocateFixed size={15} /> Use my location
                  </button>
                  {locationResults.map((result) => (
                    <button type="button" className={styles.locationResult} key={result.id} onClick={() => chooseLocation(result)}>
                      <strong>{result.name}</strong>
                      <span>{[result.admin1, result.country].filter(Boolean).join(", ")}</span>
                    </button>
                  ))}
                  {locationError && <p className={styles.locationError}>{locationError}</p>}
                </div>
              )}
            </div>
            <div className={styles.location}>
              <button
                type="button"
                className={styles.cameraButton}
                onClick={openCameraExperience}
                aria-label="Open northern lights camera view"
              >
                <span className={styles.compass} aria-hidden="true">
                  <span className={`${styles.compassPoint} ${styles.compassNorth}`}>N</span>
                  <span className={`${styles.compassPoint} ${styles.compassEast}`}>E</span>
                  <span className={`${styles.compassPoint} ${styles.compassSouth}`}>S</span>
                  <span className={`${styles.compassPoint} ${styles.compassWest}`}>W</span>
                  <span className={styles.compassTicks} />
                  <span className={styles.compassNeedle} />
                  <span className={styles.compassDot} />
                </span>
                <span className={styles.compassReadout}>
                  <span>Best view direction</span>
                  <strong>NNE (23°)</strong>
                  <span>Elevation <strong>12°</strong></span>
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className={styles.forecastPanel}>
          <div className={styles.visibilityBrief}>
            <div className={styles.briefVerdict}>
              <span className={styles.briefEyebrow}>Aurora visibility at {timeAtIndex(selectedForecast) || nowTime}</span>
              <div className={styles.briefStatusLine}>
                <i className={`${styles.statusDot} ${selectedChance >= 55 ? styles.statusGood : selectedChance >= 20 ? styles.statusFair : styles.statusPoor}`} />
                <h2>{visibilityStatus}</h2>
                <strong>{selectedChance}%</strong>
              </div>
              <p>{visibilitySummary}</p>
              <button
                type="button"
                className={styles.heatmapTrigger}
                onClick={(event) => {
                  const bounds = event.currentTarget.querySelector("span").getBoundingClientRect();
                  setHeatmapOrigin({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
                  setHeatmapOpen(true);
                }}
              >
                <span>Aurora</span>
                <strong>Open signal heat map</strong>
              </button>
            </div>
            <div className={styles.briefFactors}>
              <div className={styles.factor}>
                <span>Kp now</span>
                <strong>{selectedKp}</strong>
                <small>Need {requiredKp.toFixed(1)}+</small>
              </div>
              <div className={styles.factor}>
                <span>Clouds</span>
                <strong>{selectedCloudCover}%</strong>
                <small>{selectedCloudCover <= 25 ? "Clear" : selectedCloudCover <= 60 ? "Partly cloudy" : "Cloudy"}</small>
              </div>
              <div className={styles.factor}>
                <span>Sky</span>
                <strong>{selectedIsDay ? "Day" : "Dark"}</strong>
                <small>{selectedIsDay ? "Sun above horizon" : "Viewing hours"}</small>
              </div>
              <div className={styles.factor}>
                <span>Visibility</span>
                <strong>{selectedAtmosphericVisibility}<em> km</em></strong>
                <small>{selectedAtmosphericVisibility >= 12 ? "Clear air" : "Reduced"}</small>
              </div>
            </div>
          </div>

          <div className={styles.nowBlock}>
            <p className={styles.statHeading}>Current Forecast</p>
            <p className={styles.statTime}>{timeAtIndex(selectedForecast) || nowTime || "Current time"}</p>
            <div className={styles.kpReading}>
              <span className={styles.kpValue}>{selectedKp}</span>
              <span className={styles.kpLevel}>{selectedVisibilityLevel}</span>
            </div>
            <p className={styles.statCaption}>Kp index · NOAA 3-hour forecast</p>
            <p className={styles.localChance}><strong>{selectedChance}%</strong> estimated chance to see it here</p>
          </div>

          <div className={styles.chart}>
            <div className={styles.chartSummary}>
              <span>Best 12-hour viewing window</span>
              <strong>{viewingPeakChance}% peak chance</strong>
            </div>
            <div className={styles.plot}>
              <div className={styles.bars}>
                {visibleForecast.map((kp, visibleIndex) => {
                  const index = windowStart + visibleIndex;
                  const height = visibleBarHeights[visibleIndex];
                  const chance = visibleChances[visibleIndex];
                  return (
                  <button
                    type="button"
                    key={`${kp}-${index}`}
                    className={`${styles.bar} ${index < selectedForecast ? styles.active : ""} ${index > selectedForecast ? styles.future : ""} ${index === selectedForecast ? styles.currentBar : ""} ${index === viewingPeakIndex ? styles.peakBar : ""}`}
                    style={{ height: `${height}%` }}
                    onClick={() => setSelectedForecast(index)}
                    onFocus={() => setSelectedForecast(index)}
                    aria-label={`${timeAtIndex(index)}: ${chance}% estimated local viewing chance, NOAA forecast Kp ${kp.toFixed(1)}`}
                    aria-pressed={index === selectedForecast}
                  >
                    <span className={styles.barValue}>{chance}% · Kp {kp.toFixed(1)}</span>
                    {index === viewingPeakIndex && (
                      <span className={styles.peakLabel}>
                        <strong>{viewingPeakChance}%</strong>
                        <span>{timeAtIndex(viewingPeakIndex)}</span>
                      </span>
                    )}
                  </button>
                  );
                })}
              </div>
              <svg className={styles.neonLine} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d={trendPath} fill="none" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className={styles.timeline}>
              <span>{timeAtIndex(windowStart)}</span>
              <span>Peak {timeAtIndex(viewingPeakIndex)}</span>
              <span>{timeAtIndex(windowEnd)}</span>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.forecastRow}>
              <div>
                <p className={styles.rowHeading}>Best Forecast Window</p>
                <p className={styles.bestTime}>{nakedEyeWindow}</p>
              </div>
              <div className={styles.percentStat}>
                <p><span>{viewingPeakChance}</span>%</p>
                <p className={styles.percentCaption}>Estimated local chance · Kp {viewingPeakKp.toFixed(1)} at {timeAtIndex(viewingPeakIndex)}</p>
              </div>
            </div>

            <div className={styles.forecastRow}>
              <div>
                <p className={styles.rowHeading}>Nearby Areas with Better Visibility</p>
                <p className={styles.nearbyAreas}>Look for darker skies away from city lights with a clear northern horizon.</p>
              </div>
              <div className={styles.visibilityGain}>
                <strong>Darker</strong>
                <span>lower light pollution than NYC</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {experienceOpen && (
        <div className={styles.experienceBackdrop} role="dialog" aria-modal="true" aria-label="Northern lights camera view">
          <button type="button" className={styles.closeExperience} onClick={closeCameraExperience} aria-label="Close camera view">
            <X size={22} />
          </button>

          {experienceMode === "camera" ? (
            <div className={styles.cameraExperience}>
              <video ref={videoRef} className={styles.cameraVideo} playsInline muted />
              {cameraActive && <div className={styles.cameraAurora} aria-hidden="true" />}
              <div className={styles.cameraHud}>
                <ScanLine size={24} />
                <p>Enhanced aurora view</p>
                {!cameraActive && <button type="button" onClick={startCamera}>Start camera</button>}
                {cameraError && <p className={styles.cameraError}>{cameraError}</p>}
              </div>
            </div>
          ) : (
            <div className={styles.qrExperience}>
              <Camera size={28} strokeWidth={1.4} />
              <h2>See the northern lights through your phone</h2>
              <p>Scan this code to open the enhanced camera view.</p>
              {qrCode && <Image src={qrCode} alt="QR code to open the northern lights camera view" width={240} height={240} unoptimized />}
            </div>
          )}
        </div>
      )}
      {heatmapOpen && (
        <AuroraHeatmap
          chance={selectedChance}
          cloudCover={selectedCloudCover}
          location={`${location.name}${location.region ? `, ${location.region}` : ""}`}
          origin={heatmapOrigin}
          status={visibilityStatus}
          onClose={() => setHeatmapOpen(false)}
        />
      )}
    </main>
  );
}

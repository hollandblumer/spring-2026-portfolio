"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ImageSpiralCarousel({
  mediaItems = [],
  currentIndex = 0,
  onIndexChange,
  className = "",
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshesRef = useRef([]);
  const frameRef = useRef(null);
  const focusRef = useRef(currentIndex);
  const targetScrollRef = useRef(0);
  const currentScrollRef = useRef(0);
  const autoOffsetRef = useRef(0);
  const visualFocusRef = useRef(currentIndex);
  const targetFocusRef = useRef(currentIndex);
  const smoothCamRef = useRef(new THREE.Vector3(0, 0, 42));
  const smoothLookRef = useRef(new THREE.Vector3(0, 0, 0));
  const dragRef = useRef({ active: false, y: 0, moved: false });
  const setFocusTargetRef = useRef(null);
  const introStartRef = useRef(0);
  const vortexRef = useRef(0);
  const triggerVortexRef = useRef(null);
  const lastMoveTimeRef = useRef(0);
  const previousIndexRef = useRef(currentIndex);

  useEffect(() => {
    const previousIndex = previousIndexRef.current;
    focusRef.current = currentIndex;
    setFocusTargetRef.current?.(currentIndex);
    if (previousIndex !== currentIndex) {
      triggerVortexRef.current?.(0.62);
      previousIndexRef.current = currentIndex;
    }
  }, [currentIndex, mediaItems.length]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || mediaItems.length === 0) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xe33003, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.1,
      220,
    );
    camera.position.copy(smoothCamRef.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xe33003, 0);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const makeSpeckleField = () => {
      const isMobileViewport = window.innerWidth < 720;
      const speckCount = Math.min(
        isMobileViewport ? 4200 : 5200,
        Math.max(
          isMobileViewport ? 3200 : 0,
          Math.floor(
            window.innerWidth *
              window.innerHeight *
              (isMobileViewport ? 0.0105 : 0.0045),
          ),
        ),
      );
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(speckCount * 3);
      const seeds = new Float32Array(speckCount);
      const sizes = new Float32Array(speckCount);
      const anchors = new Float32Array(speckCount);
      const maxSpeckSize = Math.max(
        isMobileViewport ? 2.3 : 1.6,
        window.innerWidth * (isMobileViewport ? 0.0048 : 0.002),
      );
      const worldWidth = isMobileViewport ? 34 : 88;
      const worldHeight = isMobileViewport ? 60 : 52;
      const randomBell = () => {
        const u = Math.max(0.0001, Math.random());
        const v = Math.max(0.0001, Math.random());
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
      };
      const fract = (value) => value - Math.floor(value);
      const speckleSizeAt = (x, y) => {
        const coarse =
          fract(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) * 0.62;
        const fine =
          fract(Math.sin(x * 34.121 + y * 9.713) * 12641.1357) * 0.38;
        return Math.pow(coarse + fine, 1.2);
      };

      for (let i = 0; i < speckCount; i++) {
        const clusterRoll = Math.random();
        const cornerParticle = clusterRoll < 0.46;
        let x = (Math.random() - 0.5) * worldWidth;
        let y = (Math.random() - 0.5) * worldHeight;
        let anchor = 0;

        if (cornerParticle) {
          const topRight = clusterRoll < 0.23;
          const centerX = isMobileViewport
            ? topRight
              ? 11.5
              : -12
            : topRight
              ? 27.5
              : -28.5;
          const centerY = isMobileViewport
            ? topRight
              ? 20
              : -20
            : topRight
              ? 15.5
              : -16.5;
          const diagonalX = topRight ? -1 : 1;
          const diagonalY = topRight ? -1 : 1;
          const spreadRoll = Math.random();
          const angle = Math.random() * Math.PI * 2;

          if (spreadRoll < 0.5) {
            const radius =
              Math.pow(Math.random(), 0.62) * (isMobileViewport ? 8.5 : 15);
            x =
              centerX +
              Math.cos(angle) *
                radius *
                (0.82 + Math.random() * (isMobileViewport ? 0.42 : 0.72));
            y =
              centerY +
              Math.sin(angle) *
                radius *
                (0.58 + Math.random() * (isMobileViewport ? 0.4 : 0.56));
            anchor = 0.9 + Math.random() * 0.1;
          } else if (spreadRoll < 0.82) {
            const radius =
              (isMobileViewport ? 4 : 8) +
              Math.pow(Math.random(), 0.7) *
                (isMobileViewport ? 13 : 24);
            x =
              centerX +
              diagonalX *
                radius *
                (0.34 + Math.random() * (isMobileViewport ? 0.38 : 0.52)) +
              randomBell() * (isMobileViewport ? 3.3 : 5.8);
            y =
              centerY +
              diagonalY *
                radius *
                (0.26 + Math.random() * (isMobileViewport ? 0.32 : 0.44)) +
              randomBell() * (isMobileViewport ? 3 : 4.5);
            anchor = 0.74 + Math.random() * 0.18;
          } else {
            const radius =
              (isMobileViewport ? 8 : 15) +
              Math.random() * (isMobileViewport ? 14 : 25);
            x =
              centerX +
              Math.cos(angle) * radius +
              randomBell() * (isMobileViewport ? 3.8 : 7);
            y =
              centerY +
              Math.sin(angle) * radius * 0.72 +
              randomBell() * (isMobileViewport ? 3.4 : 5.5);
            anchor = 0.6 + Math.random() * 0.22;
          }

          x = THREE.MathUtils.clamp(x, -worldWidth * 0.52, worldWidth * 0.52);
          y = THREE.MathUtils.clamp(y, -worldHeight * 0.52, worldHeight * 0.52);
        }

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = -8 - Math.random() * 26;
        seeds[i] = Math.random() * Math.PI * 2;
        anchors[i] = anchor;
        sizes[i] =
          Math.max(0.2, speckleSizeAt(x, y) * maxSpeckSize) *
          (cornerParticle ? 1.12 : 1);
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("aAnchor", new THREE.BufferAttribute(anchors, 1));

      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("rgb(255, 226, 136)") },
          uOpacity: { value: (isMobileViewport ? 58 : 44) / 255 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uVortex: { value: 0 },
        },
        vertexShader: `
          attribute float aSeed;
          attribute float aSize;
          attribute float aAnchor;
          uniform float uTime;
          uniform float uPixelRatio;
          uniform float uVortex;
          varying float vAlpha;

          void main() {
            vec3 p = position;
            float driftScale = mix(1.0, 0.26, aAnchor);
            p.x += sin(uTime * 0.16 + aSeed) * 0.42 * driftScale;
            p.y += cos(uTime * 0.13 + aSeed * 1.7) * 0.32 * driftScale;
            float yNorm = clamp((p.y + 22.0) / 44.0, 0.0, 1.0);
            float radius = max(length(p.xz), 0.001);
            float freeAmount = 1.0 - aAnchor;
            float freeVortex = uVortex * freeAmount;
            float funnelRadius = mix(1.25, 15.5, pow(yNorm, 1.45));
            float funnelBand = 1.0 - smoothstep(0.0, 11.0, abs(radius - funnelRadius));
            float corePull = smoothstep(30.0, 1.2, radius);
            float tornadoMask = max(funnelBand, corePull * 0.72) * freeVortex;
            float twist = freeVortex * (10.5 - p.y * 0.24 + uTime * 8.0 + aSeed);
            float c = cos(twist);
            float s = sin(twist);
            vec2 spun = mat2(c, -s, s, c) * p.xz;
            float targetRadius = mix(radius, funnelRadius, tornadoMask * 0.86);
            p.xz = normalize(spun) * targetRadius;
            p.y += freeVortex * (3.4 + yNorm * 7.2);
            p.y += sin(radius * 0.52 - uTime * 5.8 + aSeed) * freeVortex * 1.35 * driftScale;
            p.z += corePull * freeVortex * 7.5;

            gl_PointSize = (max(0.75, aSize * 1.18) + tornadoMask * 1.65) * uPixelRatio;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            vAlpha = 0.82 + 0.18 * sin(aSeed + uTime * 0.21) + tornadoMask * 0.72;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vAlpha;

          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float d = length(uv);
            float disc = 1.0 - smoothstep(0.46, 0.5, d);
            float alpha = disc * uOpacity * vAlpha;
            gl_FragColor = vec4(uColor, alpha);
            #include <colorspace_fragment>
          }
        `,
      });

      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      points.renderOrder = -10;
      return points;
    };

    const speckles = makeSpeckleField();
    scene.add(speckles);

    const makeImageMaterial = () => {
      return new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          uTexture: { value: null },
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uBend: { value: 0.18 },
          uBendDirection: { value: 1 },
          uWind: { value: 0 },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uBend;
          uniform float uBendDirection;
          uniform float uWind;
          varying vec2 vUv;

          void main() {
            vUv = uv;
            vec3 p = position;
            float horizontal = (uv.x - 0.5) * 2.0;
            float vertical = (uv.y - 0.5) * 2.0;
            float edgeCurl = horizontal * horizontal * uBend;
            float centerCup = (1.0 - horizontal * horizontal) * (0.12 + uBend * 0.42);
            float verticalCup = (1.0 - vertical * vertical) * (0.04 + uBend * 0.12);
            float ripple = sin((uv.y * 3.14159 + uTime) * 2.0) * (0.035 + uWind * 0.055);
            float crossWave = sin((uv.x * 4.4 + uv.y * 2.1) + uTime * 1.4) * uWind * 0.035;
            float edgeLift = abs(horizontal) * (0.07 + uWind * 0.025);

            p.z += (centerCup + verticalCup - edgeCurl - edgeLift) * uBendDirection + ripple + crossWave;
            p.x += horizontal * (0.035 + uBend * 0.06) + sin(vertical * 2.2 + uTime * 0.7) * (0.012 + uWind * 0.018) * abs(horizontal);
            p.y += cos(horizontal * 2.8 + uTime * 0.9) * uWind * 0.025;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uOpacity;
          varying vec2 vUv;

          void main() {
            vec4 tex = texture2D(uTexture, vUv);
            gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
            #include <colorspace_fragment>
          }
        `,
      });
    };

    const textureLoader = new THREE.TextureLoader();
    introStartRef.current = performance.now();
    const mobileImageBounds = { width: 3.95, height: 5.12 };
    const desktopImageBounds = { width: 7.15, height: 8.6 };
    const getImageBounds = () =>
      window.innerWidth < 768 ? mobileImageBounds : desktopImageBounds;
    const applyImageScale = (image) => {
      const imageAspect = image.userData.aspect;
      if (!imageAspect) return;

      const bounds = getImageBounds();
      let imageWidth = bounds.width;
      let imageHeight = imageWidth / imageAspect;

      if (imageHeight > bounds.height) {
        imageHeight = bounds.height;
        imageWidth = imageHeight * imageAspect;
      }

      image.scale.set(imageWidth, imageHeight, 1);
    };

    const items = mediaItems.map((item, index) => {
      const imageSrc = item.poster || item.src;
      const group = new THREE.Group();
      const image = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1, 28, 36),
        makeImageMaterial(),
      );

      image.position.z = 0.018;
      group.add(image);
      group.userData.index = index;
      group.userData.title = item.title;
      group.userData.materials = {
        image: image.material,
      };

      textureLoader.load(imageSrc, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = true;
        texture.center.set(0.5, 0.5);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const imageAspect = texture.image.width / texture.image.height;
        image.userData.aspect = imageAspect;
        applyImageScale(image);

        image.material.uniforms.uTexture.value = texture;
        image.material.needsUpdate = true;
      });

      scene.add(group);
      return group;
    });
    meshesRef.current = items;

    const getRadius = () => {
      const minSide = Math.min(window.innerWidth, window.innerHeight);
      return minSide < 720 ? 8.5 : 15.5;
    };

    const getCylinderPoint = (u, v) => {
      const radius = getRadius();
      const height = Math.min(58, Math.max(38, window.innerHeight / 15));
      const angle = u * Math.PI * 2;

      return new THREE.Vector3(
        Math.cos(angle) * radius,
        (v - 0.5) * height,
        Math.sin(angle) * radius,
      );
    };

    const triggerVortex = (amount = 0.35) => {
      const now = performance.now();
      const timeSinceMove = now - lastMoveTimeRef.current;
      const speedBoost =
        lastMoveTimeRef.current && timeSinceMove < 420
          ? THREE.MathUtils.clamp(
              THREE.MathUtils.mapLinear(timeSinceMove, 420, 80, 0.1, 0.75),
              0.1,
              0.85,
            )
          : 0;

      vortexRef.current = Math.min(1.45, vortexRef.current + amount + speedBoost);
      lastMoveTimeRef.current = now;
    };
    triggerVortexRef.current = triggerVortex;

    const moveFocusTo = (index, immediate = false) => {
      const count = mediaItems.length;
      const current = visualFocusRef.current;
      let nextTarget = index;

      while (nextTarget - current > count / 2) {
        nextTarget -= count;
      }

      while (nextTarget - current < -count / 2) {
        nextTarget += count;
      }

      targetFocusRef.current = nextTarget;

      if (immediate) {
        visualFocusRef.current = nextTarget;
        return;
      }

      triggerVortex(Math.min(0.7, 0.28 + Math.abs(nextTarget - current) * 0.08));
    };

    setFocusTargetRef.current = moveFocusTo;
    moveFocusTo(focusRef.current, true);

    const setFocus = (nextIndex) => {
      const wrapped = (nextIndex + mediaItems.length) % mediaItems.length;
      focusRef.current = wrapped;
      moveFocusTo(wrapped);
      onIndexChange?.(wrapped + 1);
    };

    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") setFocus(focusRef.current + 1);
      if (event.key === "ArrowLeft") setFocus(focusRef.current - 1);
    };

    const handleWheel = (event) => {
      targetScrollRef.current += event.deltaY * 0.0015;
      triggerVortex(Math.min(0.3, Math.abs(event.deltaY) * 0.0008));
    };

    const handlePointerDown = (event) => {
      dragRef.current = { active: true, y: event.clientY, moved: false };
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
      const drag = dragRef.current;
      if (!drag.active) return;

      const dy = event.clientY - drag.y;
      targetScrollRef.current += dy * 0.004;
      triggerVortex(Math.min(0.22, Math.abs(dy) * 0.006));
      drag.y = event.clientY;
      drag.moved = drag.moved || Math.abs(dy) > 2;
    };

    const handlePointerUp = (event) => {
      const drag = dragRef.current;
      dragRef.current = { active: false, y: 0, moved: false };
      renderer.domElement.releasePointerCapture?.(event.pointerId);

      if (drag.moved) return;
      if (event.clientX > window.innerWidth * 0.58) setFocus(focusRef.current + 1);
      if (event.clientX < window.innerWidth * 0.42) setFocus(focusRef.current - 1);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      speckles.material.uniforms.uPixelRatio.value = Math.min(
        window.devicePixelRatio,
        2,
      );
      meshesRef.current.forEach((poster) => {
        const image = poster.children.find((child) => child.isMesh);
        if (image) {
          applyImageScale(image);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: true });
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointercancel", handlePointerUp);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      speckles.material.uniforms.uTime.value = now * 0.001;
      vortexRef.current += (0 - vortexRef.current) * 0.035;
      speckles.material.uniforms.uVortex.value = vortexRef.current;
      const introProgress = THREE.MathUtils.clamp(
        (now - introStartRef.current) / 1700,
        0,
        1,
      );
      const introEase = 1 - Math.pow(1 - introProgress, 3);

      autoOffsetRef.current += 0.0018;
      currentScrollRef.current +=
        (targetScrollRef.current - currentScrollRef.current) * 0.08;

      const count = meshesRef.current.length;
      visualFocusRef.current +=
        (targetFocusRef.current - visualFocusRef.current) * 0.12;
      const visualFocus = visualFocusRef.current;

      meshesRef.current.forEach((poster) => {
        const index = poster.userData.index;
        const isFocused = index === focusRef.current;
        let relativeIndex = index - visualFocus;

        if (relativeIndex > count / 2) {
          relativeIndex -= count;
        }

        if (relativeIndex < -count / 2) {
          relativeIndex += count;
        }

        const introDelay = index * 0.04;
        const localIntro = THREE.MathUtils.clamp(
          (introProgress - introDelay) / Math.max(0.2, 1 - introDelay),
          0,
          1,
        );
        const localEase = 1 - Math.pow(1 - localIntro, 3);
        const introWrap = 1 - localEase;
        const u =
          ((0.25 + relativeIndex / count + introWrap * (0.82 + index * 0.025)) +
            1) %
          1;
        const position = getCylinderPoint(u, 0.5);
        const finalY = relativeIndex * (window.innerWidth < 720 ? 4.2 : 5.1);
        const introLift = introWrap * (window.innerWidth < 720 ? 28 : 38);
        position.y = finalY - introLift;
        const angle = u * Math.PI * 2;
        const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
        const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        const windPhase = now * 0.00135 + index * 0.86 + relativeIndex * 0.22;
        const windStrength = isFocused ? 0.75 : 1;
        const helixWind = Math.sin(windPhase) * (window.innerWidth < 720 ? 0.08 : 0.14) * windStrength;
        const radialBreath = Math.cos(windPhase * 0.82) * (window.innerWidth < 720 ? 0.08 : 0.16);
        position.add(tangent.multiplyScalar(helixWind));
        position.add(radial.multiplyScalar(radialBreath));

        const drift = new THREE.Vector3(
          Math.sin(index * 1.17) * 1.1,
          -3.5 + Math.cos(index * 0.91) * 0.8,
          -2.4,
        ).multiplyScalar(1 - localEase);
        const float = Math.sin(now * 0.0011 + index * 0.74) * 0.18;

        poster.position.copy(position.clone().add(drift));
        poster.position.y += float * localEase;
        poster.lookAt(new THREE.Vector3(0, position.y * 0.28, 0));
        poster.rotateY(Math.PI);
        poster.rotateZ(
          (Math.sin(now * 0.0007 + index) * 0.025 +
            Math.sin(windPhase * 1.15) * 0.045) *
            localEase,
        );

        const depthFade = THREE.MathUtils.clamp((position.z + 18) / 34, 0.12, 1);
        const { image } = poster.userData.materials;
        const textureReady = Boolean(image.uniforms.uTexture.value);
        image.uniforms.uTime.value = now * 0.001 + index * 0.31;
        image.uniforms.uOpacity.value =
          textureReady ? (isFocused ? 1 : 0.3 + depthFade * 0.68) * localEase : 0;
        image.uniforms.uBend.value =
          (isFocused ? 0.28 : 0.34) +
          Math.sin(now * 0.0008 + index) * 0.045;
        image.uniforms.uBendDirection.value =
          isFocused || position.z >= 0 ? 1 : -1;
        image.uniforms.uWind.value =
          (isFocused ? 0.45 : 0.72) + Math.sin(windPhase) * 0.18;

        const scaleBoost = THREE.MathUtils.clamp((position.z + 16) / 32, 0, 1);
        const scale =
          (0.56 + introEase * 0.44) *
          (0.84 + scaleBoost * 0.28 + (isFocused ? 0.2 : 0));
        poster.scale.set(scale, scale, scale);
      });

      const focusMesh = meshesRef.current[focusRef.current];

      if (focusMesh) {
        const worldPos = focusMesh.position.clone();
        const cameraDistance = window.innerWidth < 720 ? 26 : 36;
        const targetCamPos = new THREE.Vector3(
          0,
          window.innerWidth < 720 ? 0.2 : 0.45,
          cameraDistance,
        );
        const targetLookAt = new THREE.Vector3(
          0,
          0,
          0,
        );

        smoothCamRef.current.lerp(targetCamPos, 0.045);
        smoothLookRef.current.lerp(targetLookAt, 0.055);
        camera.position.copy(smoothCamRef.current);
        camera.lookAt(smoothLookRef.current);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      meshesRef.current.forEach((poster) => {
        scene.remove(poster);
        poster.traverse((child) => {
          if (!child.isMesh) return;
          child.geometry.dispose();
          if (child.material.uniforms?.uTexture?.value) {
            child.material.uniforms.uTexture.value.dispose();
          }
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        });
      });
      meshesRef.current = [];
      setFocusTargetRef.current = null;
      triggerVortexRef.current = null;
      scene.remove(speckles);
      speckles.geometry.dispose();
      speckles.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mediaItems, onIndexChange]);

  return (
    <div
      ref={mountRef}
      className={`fixed inset-0 h-screen w-screen cursor-grab active:cursor-grabbing ${className}`}
      aria-label="Project image spiral carousel"
    />
  );
}

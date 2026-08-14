"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const CARD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CARD_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 uParallax;
  uniform float uAspect;
  uniform float uImageAspect;
  uniform float uHover;

  void main() {
    vec2 cover = vec2(1.0);
    if (uImageAspect > uAspect) cover.x = uAspect / uImageAspect;
    else cover.y = uImageAspect / uAspect;

    vec2 uv = (vUv - 0.5) * cover + 0.5;
    uv += uParallax * (0.35 + uHover * 0.65);
    vec3 color = texture2D(uTexture, clamp(uv, 0.001, 0.999)).rgb;
    color *= 1.0 + uHover * 0.035;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const SCREEN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const TRAIL_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uPrevious;
  uniform vec2 uPointer;
  uniform float uActive;

  void main() {
    float previous = texture2D(uPrevious, vUv).r * 0.945;
    float stamp = (1.0 - smoothstep(0.0, 0.115, distance(vUv, uPointer))) * uActive;
    float value = max(previous, stamp);
    gl_FragColor = vec4(value, value, value, 1.0);
  }
`;

const POST_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uScene;
  uniform sampler2D uTrail;
  uniform float uSpeed;

  void main() {
    vec2 center = vUv - 0.5;
    float radius = dot(center, center);
    vec2 uv = center * (1.0 - (0.48 + uSpeed * 0.18) * radius) + 0.5;
    float trail = texture2D(uTrail, vUv).r;
    float split = trail * 0.012 + uSpeed * 0.0015;
    float blur = trail * 0.0045;
    vec2 rgbOffset = vec2(split, split * 0.45);

    vec3 color;
    color.r = texture2D(uScene, uv + rgbOffset).r;
    color.g = texture2D(uScene, uv).g;
    color.b = texture2D(uScene, uv - rgbOffset).b;
    color += texture2D(uScene, uv + vec2(blur, 0.0)).rgb;
    color += texture2D(uScene, uv - vec2(blur, 0.0)).rgb;
    color += texture2D(uScene, uv + vec2(0.0, blur)).rgb;
    color += texture2D(uScene, uv - vec2(0.0, blur)).rgb;
    color /= 5.0;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

const GRID_FLOAT_SPEED = 18;

function disposeMaterial(material) {
  material.uniforms?.uTexture?.value?.dispose();
  material.dispose();
}

export default function WebGLProjectGrid({ projects, onSelectProject }) {
  const hostRef = useRef(null);
  const onSelectRef = useRef(onSelectProject);

  useEffect(() => {
    onSelectRef.current = onSelectProject;
  }, [onSelectProject]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x272727, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "webgl-project-grid__canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x272727);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    camera.position.z = 2;
    const group = new THREE.Group();
    scene.add(group);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const cards = projects.map((project, index) => {
      const texture = loader.load(project.poster);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      const material = new THREE.ShaderMaterial({
        vertexShader: CARD_VERTEX,
        fragmentShader: CARD_FRAGMENT,
        uniforms: {
          uTexture: { value: texture },
          uParallax: { value: new THREE.Vector2() },
          uAspect: { value: 0.8 },
          uImageAspect: { value: 0.8 },
          uHover: { value: 0 },
        },
      });
      texture.onUpdate = () => {
        const image = texture.image;
        if (image?.width && image?.height) {
          material.uniforms.uImageAspect.value = image.width / image.height;
        }
      };
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.index = index;
      group.add(mesh);
      return mesh;
    });

    const targetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    };
    let trailA = new THREE.WebGLRenderTarget(256, 256, targetOptions);
    let trailB = new THREE.WebGLRenderTarget(256, 256, targetOptions);
    const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
      ...targetOptions,
      depthBuffer: true,
    });
    const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const screenGeometry = new THREE.PlaneGeometry(2, 2);
    const trailMaterial = new THREE.ShaderMaterial({
      vertexShader: SCREEN_VERTEX,
      fragmentShader: TRAIL_FRAGMENT,
      uniforms: {
        uPrevious: { value: trailA.texture },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uActive: { value: 0 },
      },
    });
    const trailScene = new THREE.Scene();
    trailScene.add(new THREE.Mesh(screenGeometry, trailMaterial));
    const postMaterial = new THREE.ShaderMaterial({
      vertexShader: SCREEN_VERTEX,
      fragmentShader: POST_FRAGMENT,
      uniforms: {
        uScene: { value: sceneTarget.texture },
        uTrail: { value: trailA.texture },
        uSpeed: { value: 0 },
      },
    });
    const postScene = new THREE.Scene();
    postScene.add(new THREE.Mesh(screenGeometry, postMaterial));

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-2, -2);
    const parallaxTarget = new THREE.Vector2();
    let previousTime = performance.now();
    let frameId = 0;
    let columns = 3;
    let cardWidth = 1;
    let cardHeight = 1.25;
    let rowStep = 1.25;
    let totalHeight = 1;
    let sideGap = 24;
    let cardGap = 12;
    let viewportWidth = 1;
    let viewportHeight = 1;
    let targetScroll = 0;
    let currentScroll = 0;
    let velocity = 0;
    let dragging = false;
    let didDrag = false;
    let downX = 0;
    let downY = 0;
    let lastY = 0;
    let hovered = null;
    let pointerVisible = false;
    let horizontalPan = 0;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const wrap = (value, size) =>
      ((value + size / 2) % size + size) % size - size / 2;

    const layout = () => {
      cards.forEach((card, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x =
          -viewportWidth / 2 +
          sideGap +
          cardWidth / 2 +
          column * (cardWidth + cardGap);
        const baseY = viewportHeight / 2 - 96 - cardHeight / 2 - row * rowStep;
        card.position.set(x, wrap(baseY + currentScroll, totalHeight), 0);
        card.scale.set(cardWidth, cardHeight, 1);
        card.material.uniforms.uAspect.value = cardWidth / cardHeight;
      });
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      viewportWidth = Math.max(1, rect.width);
      viewportHeight = Math.max(1, rect.height);
      columns = viewportWidth >= 1024 ? 3 : 2;
      sideGap = viewportWidth >= 640 ? 24 : 18;
      cardGap = 12;
      cardWidth =
        (viewportWidth - sideGap * 2 - cardGap * (columns - 1)) / columns;
      cardHeight = cardWidth * 1.25;
      rowStep = cardHeight + cardGap;
      const rowCount = Math.ceil(cards.length / columns);
      totalHeight = Math.max(rowStep, rowCount * rowStep);
      camera.left = -viewportWidth / 2;
      camera.right = viewportWidth / 2;
      camera.top = viewportHeight / 2;
      camera.bottom = -viewportHeight / 2;
      camera.updateProjectionMatrix();
      const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      sceneTarget.setSize(
        Math.max(1, viewportWidth * pixelRatio * 0.9),
        Math.max(1, viewportHeight * pixelRatio * 0.9),
      );
      layout();
    };

    const setPointer = (event) => {
      const rect = host.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      pointer.set(x * 2 - 1, -(y * 2 - 1));
      trailMaterial.uniforms.uPointer.value.set(x, 1 - y);
      parallaxTarget.set(
        THREE.MathUtils.clamp(pointer.x * 0.025, -0.035, 0.035),
        THREE.MathUtils.clamp(pointer.y * 0.025, -0.035, 0.035),
      );
      pointerVisible = true;
    };

    const onPointerDown = (event) => {
      setPointer(event);
      dragging = true;
      didDrag = false;
      downX = event.clientX;
      downY = lastY = event.clientY;
      renderer.domElement.classList.add("is-dragging");
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      setPointer(event);
      if (!dragging) return;
      const deltaY = event.clientY - lastY;
      lastY = event.clientY;
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) {
        didDrag = true;
      }
      targetScroll -= deltaY;
      velocity = -deltaY;
    };
    const onPointerUp = (event) => {
      renderer.domElement.classList.remove("is-dragging");
      const shouldOpen = dragging && !didDrag && hovered;
      dragging = false;
      renderer.domElement.releasePointerCapture?.(event.pointerId);
      if (shouldOpen) onSelectRef.current?.(hovered.userData.index);
    };
    const onPointerLeave = () => {
      pointerVisible = false;
      if (!dragging) pointer.set(-2, -2);
    };
    const onWheel = (event) => {
      event.preventDefault();
      const delta = event.deltaY * 0.52;
      targetScroll += delta;
      velocity = delta;
    };
    const onKeyDown = (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? rowStep * 0.7 : -rowStep * 0.7;
      targetScroll += delta;
      velocity = delta * 0.08;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    host.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", resize);
    resize();

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - previousTime) / 1000, 0.05);
      previousTime = now;
      if (!dragging) {
        targetScroll += velocity;
        velocity *= Math.pow(0.9, delta * 60);
        if (!reduceMotion) targetScroll += delta * GRID_FLOAT_SPEED;
      }
      currentScroll += (targetScroll - currentScroll) * (1 - Math.exp(-delta * 10));
      const panTarget = pointerVisible ? -pointer.x * 100 : 0;
      horizontalPan +=
        (panTarget - horizontalPan) * (1 - Math.exp(-delta * 4.5));
      group.position.x = horizontalPan;
      layout();

      raycaster.setFromCamera(pointer, camera);
      hovered = raycaster.intersectObjects(cards, false)[0]?.object || null;
      renderer.domElement.classList.toggle("is-hovering", Boolean(hovered));
      cards.forEach((card) => {
        const hoverTarget = card === hovered && !dragging ? 1 : 0;
        card.material.uniforms.uHover.value +=
          (hoverTarget - card.material.uniforms.uHover.value) * 0.12;
        card.material.uniforms.uParallax.value.lerp(parallaxTarget, 0.055);
      });

      trailMaterial.uniforms.uActive.value +=
        ((hovered && pointerVisible && !dragging ? 1 : 0) -
          trailMaterial.uniforms.uActive.value) *
        0.12;
      trailMaterial.uniforms.uPrevious.value = trailA.texture;
      renderer.setRenderTarget(trailB);
      renderer.render(trailScene, screenCamera);
      [trailA, trailB] = [trailB, trailA];

      renderer.setRenderTarget(sceneTarget);
      renderer.clear();
      renderer.render(scene, camera);
      postMaterial.uniforms.uScene.value = sceneTarget.texture;
      postMaterial.uniforms.uTrail.value = trailA.texture;
      postMaterial.uniforms.uSpeed.value +=
        (Math.min(Math.abs(velocity) / 35, 1) -
          postMaterial.uniforms.uSpeed.value) *
        0.08;
      renderer.setRenderTarget(null);
      renderer.render(postScene, screenCamera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      host.removeEventListener("keydown", onKeyDown);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("wheel", onWheel);
      cards.forEach((card) => disposeMaterial(card.material));
      geometry.dispose();
      screenGeometry.dispose();
      trailMaterial.dispose();
      postMaterial.dispose();
      trailA.dispose();
      trailB.dispose();
      sceneTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [projects]);

  return (
    <section
      ref={hostRef}
      className="webgl-project-grid absolute inset-0 z-[8] bg-[#272727]"
      tabIndex={0}
      aria-label="Project grid. Drag or scroll to browse, then select a project."
    >
      <div className="sr-only">
        {projects.map((project, index) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelectProject(index)}
          >
            Open {project.title}
          </button>
        ))}
      </div>
    </section>
  );
}

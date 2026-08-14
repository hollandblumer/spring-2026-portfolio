"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ProjectPageTransition({ project, onComplete }) {
  const canvasRef = useRef(null);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    });
    if (!gl) {
      completeRef.current?.();
      return undefined;
    }

    const vertex = `attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
    const fragment = `precision highp float;varying vec2 uv;uniform sampler2D page;uniform vec2 aspect,center;uniform float time,reveal;
      float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p*=2.;a*=.5;}return v;}
      void main(){
        const float WIDTH=.35;const float AMP=.06;
        vec2 ar=vec2(aspect.x,1.);
        float radius=max(max(length(center*ar),length((vec2(1.,0.)-center)*ar)),max(length((vec2(0.,1.)-center)*ar),length((vec2(1.)-center)*ar)));
        float d=distance(uv*ar,center*ar)/max(.001,radius);
        float n=(fbm(uv*3.+time*.25)-.5)*2.*AMP*sin(3.14159*reveal);
        float progress=reveal*(1.+WIDTH)+n;
        float amount=1.-smoothstep(-WIDTH,0.,d-progress);
        vec2 sampleUv=(uv-center)*amount+center;
        vec3 image=texture2D(page,clamp(sampleUv,0.,1.)).rgb;
        gl_FragColor=vec4(image*amount,amount);
      }`;
    const shader = (type, source) => {
      const value = gl.createShader(type);
      gl.shaderSource(value, source);
      gl.compileShader(value);
      return value;
    };
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {
      page: gl.getUniformLocation(program, "page"),
      aspect: gl.getUniformLocation(program, "aspect"),
      time: gl.getUniformLocation(program, "time"),
      reveal: gl.getUniformLocation(program, "reveal"),
      center: gl.getUniformLocation(program, "center"),
    };
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let cancelled = false;
    let frame;
    const image = new Image();
    const beginTransition = () => {
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const page = document.createElement("canvas");
      page.width = canvas.width;
      page.height = canvas.height;
      const context = page.getContext("2d");
      context.scale(dpr, dpr);
      const width = window.innerWidth;
      const height = window.innerHeight;
      context.fillStyle = "#faf9f6";
      context.fillRect(0, 0, width, height);
      if (image.naturalWidth) {
        const headerHeight = width < 640 ? 80 : 96;
        const maxWidth = Math.min(width - (width < 640 ? 40 : 64), 1100);
        const maxHeight = Math.max(180, height - headerHeight - (width < 640 ? 64 : 80));
        const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
        const drawWidth = image.naturalWidth * scale;
        const drawHeight = image.naturalHeight * scale;
        context.drawImage(image, (width - drawWidth) / 2, headerHeight + (height - headerHeight - drawHeight) / 2, drawWidth, drawHeight);
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, page);
      gl.uniform1i(uniforms.page, 0);
      const startedAt = performance.now();
      const ease = (value) => value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
      const tick = (now) => {
        const progress = Math.min(1, (now - startedAt) / 900);
        gl.uniform2f(uniforms.aspect, width / height, 1);
        gl.uniform2f(uniforms.center, 0.5, 0.5);
        gl.uniform1f(uniforms.time, now * 0.001);
        gl.uniform1f(uniforms.reveal, ease(progress));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (progress < 1) frame = requestAnimationFrame(tick);
        else completeRef.current?.();
      };
      frame = requestAnimationFrame(tick);
    };
    image.onload = beginTransition;
    image.onerror = beginTransition;
    image.src = project.poster;
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [project]);

  return createPortal(
    <canvas ref={canvasRef} className="project-page-transition" aria-hidden="true" />,
    document.body,
  );
}

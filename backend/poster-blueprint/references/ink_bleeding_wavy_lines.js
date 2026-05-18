let sh;

const vert = `
precision mediump float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
}
`;

const frag = `
precision mediump float;

varying vec2 vTexCoord;
uniform float u_time;
uniform vec2 u_resolution;

float path(float y) {
  float x = 0.5;
  x += 0.16 * sin(y * 6.0);
  x += 0.08 * sin(y * 15.0 + 1.3);
  x += 0.035 * sin(y * 32.0 + 0.6);
  return x;
}

void main() {
  vec2 uv = vTexCoord;

  // p5 texcoords are upside down compared to screen feeling
  uv.y = 1.0 - uv.y;

  float center = path(uv.y);

  float d = abs(uv.x - center);

  float widthVar = 0.26 + 0.02 * sin(uv.y * 10.0);
  float stripe = 0.04;

  float band = mod(floor(d / stripe), 4.0);

  vec3 pink = vec3(0.95, 0.84, 0.92);
  vec3 blue = vec3(0.88, 0.97, 0.98);
  vec3 black = vec3(0.0);

  vec3 color = black;

  if (band < 0.5) {
    color = pink;
  } else if (band < 1.5) {
    color = black;
  } else if (band < 2.5) {
    color = blue;
  } else {
    color = black;
  }

  float mask = smoothstep(widthVar, 0.0, d);
  color *= mask;

  gl_FragColor = vec4(color, 1.0);
}
`;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  sh = createShader(vert, frag);
}

function draw() {
  background(0);
  shader(sh);
  sh.setUniform("u_time", millis() * 0.001);
  sh.setUniform("u_resolution", [width, height]);

  rect(-width / 2, -height / 2, width, height);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

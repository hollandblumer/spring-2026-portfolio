const canvas = document.getElementById("spiralCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

let rotation = 0;

function draw() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Clear background to white
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Parameters
  const numArms = 40; // Total black stripes
  const angleStep = (Math.PI * 2) / numArms;
  const maxRadius = Math.max(canvas.width, canvas.height); // Ensure it fills the screen
  const swirlTightness = 0.003; // Controls the "twist" amount

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.fillStyle = "black";

  for (let i = 0; i < numArms; i++) {
    const startAngle = i * angleStep;

    ctx.beginPath();

    // Move to the exact center for convergence
    ctx.moveTo(0, 0);

    // Edge 1: Curve outwards to the edge of the screen
    for (let r = 0; r <= maxRadius; r += 10) {
      const theta = startAngle + r * swirlTightness;
      ctx.lineTo(Math.cos(theta) * r, Math.sin(theta) * r);
    }

    // Edge 2: Offset the angle slightly to give the arm thickness,
    // then curve back to the exact center
    for (let r = maxRadius; r >= 0; r -= 10) {
      // 0.5 ratio makes black and white stripes equal width
      const theta = startAngle + angleStep * 0.5 + r * swirlTightness;
      ctx.lineTo(Math.cos(theta) * r, Math.sin(theta) * r);
    }

    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Optional: Slow rotation to make it feel alive
  rotation += 0.002;

  requestAnimationFrame(draw);
}

draw();

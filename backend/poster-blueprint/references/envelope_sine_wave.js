const canvas = document.getElementById("waveCanvas");
const ctx = canvas.getContext("2d");

// Make canvas responsive
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
  const waveWidth = 600; // Total width of the wave effect

  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const baseAmplitude = 120;
  const frequency = 0.06;
  for (let x = 0; x <= waveWidth; x++) {
    const screenX = cx - waveWidth / 2 + x;

    let dist = (x - waveWidth / 2) / (waveWidth / 2);

    let envelope = Math.cos(dist * (Math.PI / 2));

    const y = cy + envelope * Math.sin(x * frequency - time) * baseAmplitude;

    if (x === 0) ctx.moveTo(screenX, y);
    else ctx.lineTo(screenX, y);
  }

  ctx.stroke();

  time += 0.15;
  requestAnimationFrame(draw);
}

draw();

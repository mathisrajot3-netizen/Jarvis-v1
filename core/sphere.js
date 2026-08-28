function initSphere(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const N = 420;
  const stars = [];
  for (let i = 0; i < N; i++) {
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * Math.PI * 2;
    stars.push({
      theta, phi,
      speed: 0.0015 + Math.random() * 0.004,
      offset: Math.random() * Math.PI * 2,
      baseSize: 0.6 + Math.random() * 2.4
    });
  }

  let talking = false;
  let t = 0;

  function draw() {
    t++;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.38;
    ctx.clearRect(0, 0, W, H);
    const amp = talking ? R * 0.13 : R * 0.025;

    for (let i = 0; i < N; i++) {
      const s = stars[i];
      const wob = Math.sin(t * s.speed + s.offset) * amp;
      const r = R + wob;
      const x = r * Math.sin(s.theta) * Math.cos(s.phi + t * 0.0009);
      const y = r * Math.cos(s.theta);
      const z = r * Math.sin(s.theta) * Math.sin(s.phi + t * 0.0009);
      const scale = (z + R * 1.5) / (R * 2);
      const px = cx + x, py = cy + y;
      const size = Math.max(0.4, s.baseSize * scale);
      const alpha = Math.max(0.12, scale);

      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,190,255,${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();

  return {
    setTalking: (val) => { talking = val; }
  };
}

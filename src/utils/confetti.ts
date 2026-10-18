// Self-contained canvas confetti animation
export function launchConfetti({
  particleCount = 150,
  spread = 90,
  origin = { x: 0.5, y: 0.6 }
}: {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
} = {}) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999';
  context.scale(pixelRatio, pixelRatio);
  document.body.appendChild(canvas);

  const colors = ['#ff00ff', '#00ffff', '#ffee00', '#ffffff', '#ff3377', '#00ff88'];
  const centerX = width * (origin.x ?? 0.5);
  const centerY = height * (origin.y ?? 0.6);
  const particles = Array.from({ length: Math.min(particleCount, 250) }, () => {
    const angle = ((-90 + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const speed = 4 + Math.random() * 8;
    return {
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  });

  let lastTime: number | undefined;
  let elapsed = 0;
  function animate(time: number) {
    const delta = lastTime === undefined ? 1 : Math.min((time - lastTime) / 16.67, 3);
    lastTime = time;
    elapsed += delta * 16.67;
    context!.clearRect(0, 0, width, height);
    for (const particle of particles) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vx *= Math.pow(0.985, delta);
      particle.vy += 0.18 * delta;
      particle.rotation += particle.rotationSpeed * delta;
      context!.save();
      context!.translate(particle.x, particle.y);
      context!.rotate(particle.rotation);
      context!.fillStyle = particle.color;
      context!.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.65);
      context!.restore();
    }
    if (elapsed < 3200) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(animate);
}

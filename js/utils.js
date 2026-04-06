export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function createParticles(x, y, count = 5, color = "#ffff00") {
  const parts = [];
  for (let i = 0; i < count; i++) {
    parts.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30,
      color: color
    });
  }
  return parts;
}
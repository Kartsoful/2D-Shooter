export function createPlayer(canvas) {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 15,
    speed: 4,
    health: 100
  };
}

export function updatePlayer(player, keys) {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;
}

export function drawPlayer(ctx, player) {
  ctx.fillStyle = "lime";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
}
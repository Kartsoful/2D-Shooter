export function createPlayer(canvas) {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 15,
    speed: 3.0,
    health: 100,
    shieldTime: 0,
    dashTime: 0,
    dashCooldown: 0,
    dashDir: { x: 0, y: 0 }
  };
}

export function updatePlayer(player, keys, canvas) {
  if (player.dashTime > 0) {
    player.x += player.dashDir.x * player.speed * 3;
    player.y += player.dashDir.y * player.speed * 3;
    player.dashTime--;
  } else {
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;
  }

  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));

  if (player.dashCooldown > 0) {
    player.dashCooldown--;
  }
}

export function drawPlayer(ctx, player) {
  ctx.fillStyle = "lime";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
}
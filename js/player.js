export function createPlayer(canvas) {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 15,
    speed: 3.0,
    health: 100,
    shieldTime: 0,
    speedBoostTime: 0,
    dashTime: 0,
    dashCooldown: 0,
    dashDir: { x: 0, y: 0 },
    muzzleFlashTime: 0
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

  if (player.muzzleFlashTime > 0) {
    player.muzzleFlashTime--;
  }
}

export function drawPlayer(ctx, player, mouse) {
  ctx.fillStyle = "lime";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();

  // Muzzle flash
  if (player.muzzleFlashTime > 0) {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const flashX = player.x + Math.cos(angle) * (player.size + 5);
    const flashY = player.y + Math.sin(angle) * (player.size + 5);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(flashX, flashY, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}
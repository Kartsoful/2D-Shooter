
export function shoot(player, mouse, bullets, currentWeapon, explosiveAmmo, piercingAmmo) {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    
    let type = "normal";
    let consume = false;

    if (currentWeapon === "explosive" && explosiveAmmo > 0) {
        type = "explosive";
        consume = true;
    } else if (currentWeapon === "piercing" && piercingAmmo > 0) {
        type = "piercing";
        consume = true;
    }

    bullets.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(angle) * 7,
        dy: Math.sin(angle) * 7,
        size: type === "normal" ? 5 : 7,
        type: type,
        color: type === "explosive" ? "#ff8800" : type === "piercing" ? "#00ccff" : "#ffff00"
    });

    if (consume) {
        if (type === "explosive") explosiveAmmo--;
        else piercingAmmo--;
    }

    return { explosiveAmmo, piercingAmmo };
}

export function updateBullets(bullets, canvas) {
  bullets.forEach((b, i) => {
    b.x += b.dx;
    b.y += b.dy;

    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1);
    }
  });
}

export function drawBullets(ctx, bullets) {
  ctx.fillStyle = "yellow";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

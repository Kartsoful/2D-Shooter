
export function shoot(player, mouse, bullets, currentWeapon, explosiveAmmo, piercingAmmo, shotgunAmmo) {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    
    let type = "normal";
    let consume = false;

    if (currentWeapon === "explosive" && explosiveAmmo > 0) {
        type = "explosive";
        consume = true;
    } else if (currentWeapon === "piercing" && piercingAmmo > 0) {
        type = "piercing";
        consume = true;
    } else if (currentWeapon === "shotgun" && shotgunAmmo > 0) {
        // Shotgun fires 5 bullets in a spread
        const spreadAngle = Math.PI / 6; // 30 degrees total spread
        const bulletsPerShot = 5;
        
        for (let i = 0; i < bulletsPerShot; i++) {
            const bulletAngle = angle - spreadAngle/2 + (spreadAngle / (bulletsPerShot - 1)) * i;
            bullets.push({
                x: player.x,
                y: player.y,
                dx: Math.cos(bulletAngle) * 6, // Slightly slower than normal
                dy: Math.sin(bulletAngle) * 6,
                size: 4, // Smaller bullets
                type: "normal",
                color: "#ffff88" // Light yellow for shotgun
            });
        }
        
        consume = true;
        type = "shotgun"; // Special handling for ammo consumption
    }

    // Single bullet for normal, explosive, piercing
    if (type !== "shotgun") {
        bullets.push({
            x: player.x,
            y: player.y,
            dx: Math.cos(angle) * 7,
            dy: Math.sin(angle) * 7,
            size: type === "normal" ? 5 : 7,
            type: type,
            color: type === "explosive" ? "#ff8800" : type === "piercing" ? "#00ccff" : "#ffff00"
        });
    }

    if (consume) {
        if (type === "explosive") explosiveAmmo--;
        else if (type === "piercing") piercingAmmo--;
        else if (type === "shotgun") shotgunAmmo--;
    }

    return { explosiveAmmo, piercingAmmo, shotgunAmmo };
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
  bullets.forEach(b => {
    ctx.fillStyle = b.color || "#ffff00";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

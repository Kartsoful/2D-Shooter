// Luo uusi vihollinen satunnaisella tyypillä, joka on "shooter", "charger" tai "normal"
export function spawnEnemy(canvas, enemies, state, difficulty) {
    const size = Math.random() * 18 + 22;
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 : canvas.width;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 : canvas.height;
    }

    let enemyType;
    const r = Math.random();
    if (r < 0.3) enemyType = "shooter";      // 30 %
    else if (r < 0.55) enemyType = "charger";// 25 %
    else enemyType = "normal";               // 45 %

    enemies.push({
        x,
        y,
        dx: 0,
        dy: 0,
        size,
        health: 22 + Math.random() * 16 + difficulty * 7,
        type: enemyType,
        shootCooldown: enemyType === "shooter" ? (60 + Math.random() * 90) : null, // 1–2.5 s
        shootTimer: 0,
        speed: enemyType === "charger" ? (2.8 + Math.random() * 1.7 + difficulty * 0.12) :
              (1.2 + Math.random() * 0.6 + difficulty * 0.10)
    });
}

// Päivitä kaikkien vihollisten liikkeet JA mahdollinen ampuminen
export function updateEnemies(enemies, player, bullets, enemyBullets, state, difficulty) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // Liike kohti pelaajaa, varmista ettei dist==0
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.hypot(dx, dy);
        const speed = e.speed || 1.2;
        if (dist > 0.01) {
            e.x += (dx / dist) * speed;
            e.y += (dy / dist) * speed;
        }

        // Vihollisen ampuminen, jos tyypiltään shooter
        if (e.type === "shooter" && dist < 650) {
            e.shootTimer = (e.shootTimer || 0) + 1;
            if (e.shootTimer >= e.shootCooldown) {
                // Luo vihollisen ammus
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                enemyBullets.push({
                    x: e.x,
                    y: e.y,
                    dx: Math.cos(angle) * 5.5,
                    dy: Math.sin(angle) * 5.5,
                    size: 6
                });
                e.shootTimer = 0;
                e.shootCooldown = 60 + Math.random() * 90; // uusi random cooldown
            }
        }

        // Vihollisen osuma pelaajan luotiin
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (Math.hypot(e.x - b.x, e.y - b.y) < e.size + b.size) {
                e.health -= b.power || 10;
                bullets.splice(j, 1);
                if (e.health <= 0) {
                    state.score += 25 + (e.type === "shooter" ? 30 : e.type === "charger" ? 15 : 0);
                    enemies.splice(i, 1);
                    break;
                }
            }
        }
    }
}
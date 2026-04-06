// --- Vihollisten luonti ---
export function spawnEnemy(canvas, enemies, state, difficulty) {
    const typeProb = Math.random();
    let type;
    if (typeProb < 0.65) type = "basic";
    else if (typeProb < 0.85) type = "fast";
    else type = "tank";

    // Spawn kohtaan satunnaiselta reunalta
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * canvas.width; y = -20; }
    else if (edge === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; }
    else { x = -20; y = Math.random() * canvas.height; }

    let baseSpeed = 1.8, hp = 1, size = 15, cooldown = 120, dmg = 7;
    if (type === "fast") { baseSpeed = 2.8; size = 11; dmg = 4; }
    if (type === "tank") { baseSpeed = 1.05; size = 22; hp = 4; cooldown = 240; dmg = 15; }

    enemies.push({
        type,
        x,
        y,
        size,
        speed: baseSpeed + difficulty * 0.15,
        hp,
        health: hp,
        shootCooldown: cooldown,
        lastShot: 0,
        damage: dmg
    });
}

// --- Vihollisten päivittäminen ---
export function updateEnemies(enemies, player, bullets, enemyBullets, state, difficulty) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        // Liiku pelaajaa kohti
        const dx = player.x - e.x, dy = player.y - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            e.x += (dx / dist) * e.speed;
            e.y += (dy / dist) * e.speed;
        }
        // Ammunta
        e.lastShot++;
        if (e.lastShot > e.shootCooldown) {
            const angle = Math.atan2(dy, dx);
            enemyBullets.push({
                x: e.x, y: e.y,
                dx: Math.cos(angle) * 3.2,
                dy: Math.sin(angle) * 3.2,
                size: 4,
                damage: e.type === "tank" ? 7 : (e.type === "fast" ? 3 : 5) // Mahdollinen jatkokehitys
            });
            e.lastShot = 0;
        }
        // Osuma pelaajaan
        if (Math.hypot(e.x - player.x, e.y - player.y) < e.size + player.size) {
            player.health -= e.damage;
            enemies.splice(i, 1);
            continue;
        }
        // Ammus osuu viholliseen
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < b.size + e.size) {
                // Ammustyypin vaurio
                let damage = 1;
                if (b.type === "piercing") damage = 2;
                if (b.type === "explosive") {
                    // Explosive vaurioittaa myös muita lähistöllä
                    for (let k = 0; k < enemies.length; k++) {
                        const ex = enemies[k];
                        if (Math.hypot(b.x - ex.x, b.y - ex.y) < 80) {
                            if (ex.type === "tank") ex.hp -= 1;
                            else ex.health -= 1;
                        }
                    }
                }
                // Terveys päivittyy tyypin mukaan
                if (e.type === "tank") e.hp -= damage;
                else e.health -= damage;
                if (b.type !== "piercing") bullets.splice(j, 1);

                // Tarkista kuoleeko vihollinen
                const currHp = e.type === "tank" ? e.hp : e.health;
                if (currHp <= 0) {
                    state.score += (e.type === "tank" ? 50 : 10);
                    enemies.splice(i, 1);
                }
                break;
            }
        }
        // Rajat
        if (e.x < -60 || e.x > player.x * 2 + 1000 || e.y < -60 || e.y > player.y * 2 + 1000)
            enemies.splice(i, 1);
    }
}

// --- Vihollisten piirtäminen ---
export function drawEnemies(ctx, enemies, player) {
    enemies.forEach(e => {
        ctx.save();
        if (e.type === "tank") ctx.fillStyle = "#bb2222";
        else if (e.type === "fast") ctx.fillStyle = "#44ccee";
        else ctx.fillStyle = "#ffaa33";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
        // HP-näyttö
        ctx.fillStyle = "#fff";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(e.type === "tank" ? e.hp : e.health, e.x, e.y + 3);
        ctx.restore();
    });
}
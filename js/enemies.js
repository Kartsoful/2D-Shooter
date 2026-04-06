import { distance } from "./utils.js";

export function spawnEnemy(canvas, enemies, state, difficulty = 1) {
    // Valitaan satunnainen reuna, josta vihollinen spawnaa
    const edge = Math.floor(Math.random() * 4);
    let x, y;

    switch (edge) {
        case 0:  // vasemmalta
            x = -25;
            y = Math.random() * canvas.height;
            break;
        case 1:  // oikealta
            x = canvas.width + 25;
            y = Math.random() * canvas.height;
            break;
        case 2:  // yläreunasta
            x = Math.random() * canvas.width;
            y = -25;
            break;
        case 3:  // alareunasta
            x = Math.random() * canvas.width;
            y = canvas.height + 25;
            break;
    }

    const rand = Math.random();

    let enemy;

    // Shooter (magenta)
    if (rand < 0.10 + difficulty * 0.03) {
        enemy = {
            x: x,
            y: y,
            size: 18,
            speed: 1.6 + difficulty * 0.3,
            type: "shooter",
            shootCooldown: 0,
            color: "#ff00ff",
            health: 1
        };
    }
    // Tank (sininen, paljon hp)
    else if (rand < 0.22 + difficulty * 0.025) {
        enemy = {
            x: x,
            y: y,
            size: 24,
            speed: 1.05 + difficulty * 0.13,
            type: "tank",
            hp: Math.floor(5 + difficulty * 2.2),   // 5 - 12+ hp
            color: "#4488ff"
        };
    }
    // Normaali vihollinen (punainen)
    else {
        enemy = {
            x: x,
            y: y,
            size: 16,
            speed: 2.1 + difficulty * 0.4,
            type: "normal",
            health: 1,
            color: "#ff4444"
        };
    }

    enemies.push(enemy);
}


export function updateEnemies(enemies, player, bullets, enemyBullets, state, difficulty = 1) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // Liikuta vihollista kohti pelaajaa
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            e.x += (dx / dist) * e.speed;
            e.y += (dy / dist) * e.speed;
        }

        // Shooter ampuu
        if (e.type === "shooter") {
            e.shootCooldown--;
            if (e.shootCooldown <= 0) {
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                enemyBullets.push({
                    x: e.x,
                    y: e.y,
                    dx: Math.cos(angle) * 5.5,
                    dy: Math.sin(angle) * 5.5,
                    size: 6,
                    damage: 10
                });
                e.shootCooldown = Math.floor(45 / difficulty);  // ampuu nopeammin vaikeammalla
            }
        }

        // Törmäys pelaajan luoteihin
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (Math.hypot(e.x - b.x, e.y - b.y) < e.size + b.size) {
                
                // Vahinko
                if (e.health) {
                    e.health -= (b.type === "explosive" ? 2 : 1);
                } else {
                    e.health = 0; // normaaleille ja vanhoille
                }

                // Poista luoti (paitsi piercing)
                if (b.type !== "piercing") {
                    bullets.splice(j, 1);
                }

                // Jos health nollassa tai alle → tuhoudu
                if (!e.health || e.health <= 0) {
                    if (e.type === "tank") state.score += 30;
                    else if (e.type === "shooter") state.score += 20;
                    else state.score += 10;

                    enemies.splice(i, 1);
                    break;
                }
            }
        }

        // Pelaaja törmää viholliseen
        if (Math.hypot(e.x - player.x, e.y - player.y) < e.size + player.size) {
            player.health -= (e.type === "tank" ? 25 : 15);
            enemies.splice(i, 1);
        }
    }
}

export function drawEnemies(ctx, enemies, player) {
    enemies.forEach(e => {

        // Värit tyypin mukaan
        if (e.type === "shooter") {
            ctx.fillStyle = "yellow";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
        } else if (e.type === "tank") {
            ctx.fillStyle = "blue";
        } else {
            ctx.fillStyle = "red";
        }

        // Piirrä vihollinen
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();

        if (e.type === "shooter") {
            ctx.stroke();

            const angle = Math.atan2(player.y - e.y, player.x - e.x);
            const length = e.size + 10;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x + Math.cos(angle) * length, e.y + Math.sin(angle) * length);
            ctx.stroke();
        }

        // === TANK HEALTHBAR (korjattu) ===
        if (e.type === "tank" && e.hp !== undefined) {
            const barWidth = 36;
            const barHeight = 6;
            const hpPercent = Math.max(0, e.hp / 12);   // max mahdollinen hp spawnissa

            // Tausta (musta)
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(e.x - barWidth / 2, e.y - e.size - 14, barWidth, barHeight);

            // HP palkki
            ctx.fillStyle = e.hp > 6 ? "lime" : e.hp > 3 ? "orange" : "red";
            ctx.fillRect(e.x - barWidth / 2, e.y - e.size - 14, barWidth * hpPercent, barHeight);

            // Reunaviiva
            ctx.strokeStyle = "white";
            ctx.lineWidth = 1;
            ctx.strokeRect(e.x - barWidth / 2, e.y - e.size - 14, barWidth, barHeight);
        }
    });
}
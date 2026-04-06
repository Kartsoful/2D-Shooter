import { distance } from "./utils.js";

export function spawnEnemy(canvas, enemies, state, difficulty = 1) {
    const edge = Math.floor(Math.random() * 4);
    let x, y;

    if (edge === 0) { x = Math.random() * canvas.width; y = -20; }
    else if (edge === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height + 20; }
    else { x = -20; y = Math.random() * canvas.height; }

    const rand = Math.random();
    let enemy;

    if (rand < 0.08 + difficulty * 0.025) {           // Shooter
        enemy = {
            x, y,
            size: 18,
            speed: 1.8 + difficulty * 0.25,
            type: "shooter",
            shootCooldown: 0,
            color: "#ff00ff",
            health: 1
        };
    } 
    else if (rand < 0.16 + difficulty * 0.02) {       // Tank
        enemy = {
            x, y,
            size: 24,
            speed: 1.1 + difficulty * 0.12,
            type: "tank",
            health: Math.floor(3 + difficulty * 1.8),
            color: "#ff8800"
        };
    } 
    else {                                            // Normaali vihollinen
        enemy = {
            x, y,
            size: 16,
            speed: 2.2 + difficulty * 0.35,
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

    // Shooterille outline + tähtäyssuunta
    if (e.type === "shooter") {
      ctx.stroke();

      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      const length = e.size + 10;

      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(
        e.x + Math.cos(angle) * length,
        e.y + Math.sin(angle) * length
      );
      ctx.stroke();
    }

    // Tankille HP bar
    if (e.type === "tank") {
      const barWidth = 30;
      const barHeight = 4;

      const maxHp = 10; // sama kuin spawnissa max

      // tausta
      ctx.fillStyle = "black";
      ctx.fillRect(
        e.x - barWidth / 2,
        e.y - e.size - 10,
        barWidth,
        barHeight
      );

      // hp
      ctx.fillStyle = "lime";
      ctx.fillRect(
        e.x - barWidth / 2,
        e.y - e.size - 10,
        barWidth * (e.hp / maxHp),
        barHeight
      );
    }

  });
}   
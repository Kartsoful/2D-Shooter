
import { distance } from "./utils.js";

export function spawnEnemy(canvas, enemies, state) {
  const edge = Math.floor(Math.random() * 4);
  let x, y;

  if (edge === 0) { x = 0; y = Math.random() * canvas.height; }
  if (edge === 1) { x = canvas.width; y = Math.random() * canvas.height; }
  if (edge === 2) { x = Math.random() * canvas.width; y = 0; }
  if (edge === 3) { x = Math.random() * canvas.width; y = canvas.height; }

  // 20% chance ranged enemy
  const isShooter = Math.random() < 0.12;
  const isTank = Math.random() < 0.1;
  
    if (isShooter) {
        enemies.push({
        x,
        y,
        size: 18,
        speed: 0.8,
        type: "shooter",
        shootCooldown: 0
        });
    } else if (isTank) {
    enemies.push({
        x,
        y,
        size: 20,
        speed: 1,
        type: "tank",
        hp: Math.floor(Math.random() * 8) + 3 // 3–10
    });
    } else {
        enemies.push({
        x,
        y,
        size: 15,
        speed: 1.5 + state.score * 0.004,
        type: "normal"
        });
    }
}


export function updateEnemies(enemies, player, bullets, enemyBullets, state) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    const angle = Math.atan2(player.y - e.y, player.x - e.x);

    // 🔹 DEFAULT LIIKE (normal + tank)
    if (e.type === "normal" || e.type === "tank") {
      e.x += Math.cos(angle) * e.speed;
      e.y += Math.sin(angle) * e.speed;
    }

    // 🔹 SHOOTER LOGIIKKA
    if (e.type === "shooter") {
      const dist = Math.hypot(player.x - e.x, player.y - e.y);

      // pysyy etäällä
      if (dist > 200) {
        e.x += Math.cos(angle) * e.speed;
        e.y += Math.sin(angle) * e.speed;
      }

      // ampuu
      e.shootCooldown--;

      if (e.shootCooldown <= 0) {
        enemyBullets.push({
          x: e.x,
          y: e.y,
          dx: Math.cos(angle) * 4,
          dy: Math.sin(angle) * 4,
          size: 5
        });

        e.shootCooldown = 60;
      }
    }

    // 🔹 OSUMA PELAAJAAN
    if (Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) {
      player.health -= (e.type === "tank" ? 2 : 1);

      if (player.health <= 0) {
        state.gameOver = true;
      }
    }

    // 🔹 BULLET COLLISION
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];

      if (Math.hypot(b.x - e.x, b.y - e.y) < b.size + e.size) {
        if (b.type === "piercing") {
            // ei poisteta bulletia
            } else {
            bullets.splice(j, 1);
        }

        if (b.type === "explosive") {
            const radius = 50;

            enemies.forEach((enemy, k) => {
                const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);

                if (dist < radius) {
                enemy.hp ? enemy.hp-- : enemies.splice(k, 1);
                }
            });

            bullets.splice(j, 1);
        }

        // tank ottaa damagea
        if (e.type === "tank") {
          e.hp--;

          if (e.hp <= 0) {
            enemies.splice(i, 1);
            state.score += 3;
          }
        } else {
          enemies.splice(i, 1);
          state.score++;
        }

        break;
      }
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

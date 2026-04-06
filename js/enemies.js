
import { distance, createParticles } from "./utils.js";

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
        speed: 0.65,
        type: "shooter",
        shootCooldown: 0
        });
    } else if (isTank) {
    enemies.push({
        x,
        y,
        size: 20,
        speed: 0.9,
        type: "tank",
        hp: Math.floor(Math.random() * 8) + 3 // 3–10
    });
    } else {
        enemies.push({
        x,
        y,
        size: 15,
        speed: 1.2 + state.score * 0.003,
        type: "normal"
        });
    }
}

export function spawnBoss(canvas, enemies, state) {
  state.bossActive = true;
  const bossLevel = state.bossCount + 1;
  const baseHp = 35 + bossLevel * 10;
  const hpVariation = Math.floor(Math.random() * 21) - 10; // -10 to +10
  const speedVariation = (Math.random() - 0.5) * 0.4; // -0.2 to +0.2
  const shootVariation = Math.floor(Math.random() * 21) - 10; // -10 to +10
  const spawnVariation = Math.floor(Math.random() * 41) - 20; // -20 to +20

  enemies.push({
    x: canvas.width / 2,
    y: -80,
    size: 40,
    speed: Math.max(0.8, 1.0 + bossLevel * 0.1 + speedVariation),
    type: "boss",
    hp: Math.max(20, baseHp + hpVariation),
    maxHp: Math.max(20, baseHp + hpVariation),
    shootCooldown: Math.max(40, 90 - bossLevel * 5 + shootVariation),
    spawnCooldown: Math.max(100, 220 - bossLevel * 10 + spawnVariation),
    phase: 0
  });
}

export function updateEnemies(enemies, player, bullets, enemyBullets, state, difficulty, particles, shake) {
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
          dx: Math.cos(angle) * 3.0,
          dy: Math.sin(angle) * 3.0,
          size: 5
        });

        e.shootCooldown = 60;
      }
    }

    // 🔹 BOSS LOGIIKKA
    if (e.type === "boss") {
      if (e.y < 120) {
        e.y += 1.1;
      } else {
        e.phase += 0.04 + difficulty * 0.002;
        e.x += Math.cos(e.phase) * 1.8;
        e.y += Math.sin(e.phase * 0.6) * 0.5;
      }

      e.shootCooldown--;
      if (e.shootCooldown <= 0) {
        const bossAngle = Math.atan2(player.y - e.y, player.x - e.x);
        for (let spread = -2; spread <= 2; spread++) {
          const angleOffset = bossAngle + spread * 0.18;
          enemyBullets.push({
            x: e.x,
            y: e.y,
            dx: Math.cos(angleOffset) * 3.5,
            dy: Math.sin(angleOffset) * 3.5,
            size: 6
          });
        }
        e.shootCooldown = 110;
      }

      e.spawnCooldown--;
      if (e.spawnCooldown <= 0) {
        enemies.push({
          x: e.x + (Math.random() - 0.5) * 80,
          y: e.y + e.size + 12,
          size: 14,
          speed: 0.95 + difficulty * 0.03,
          type: "normal"
        });
        e.spawnCooldown = 220;
      }
    }

    // 🔹 OSUMA PELAAJAAN
    if (Math.hypot(player.x - e.x, player.y - e.y) < player.size + e.size) {
      if (player.shieldTime <= 0) {
        player.health -= (e.type === "tank" ? 2 : 1);

        if (player.health <= 0) {
          state.gameOver = true;
        }
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

            for (let k = enemies.length - 1; k >= 0; k--) {
                const enemy = enemies[k];
                const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);

                if (dist < radius) {
                    if (enemy.hp) {
                        enemy.hp--;
                    } else {
                        particles.push(...createParticles(enemy.x, enemy.y, 5, enemy.type === "boss" ? "purple" : enemy.type === "tank" ? "blue" : "red"));
                        enemies.splice(k, 1);
                    }
                }
            }

            bullets.splice(j, 1);
        }

        // tank ottaa damagea
        if (e.type === "tank") {
          e.hp--;

          if (e.hp <= 0) {
            enemies.splice(i, 1);
            state.score += 3;
            particles.push(...createParticles(e.x, e.y, 8, "blue"));
          }
        } else if (e.type === "boss") {
          e.hp -= b.type === "piercing" ? 0.5 : 1;
          if (e.hp <= 0) {
            enemies.splice(i, 1);
            state.score += 10;
            state.bossActive = false;
            state.bossSpawned = false;
            state.bossCount++;
            particles.push(...createParticles(e.x, e.y, 20, "purple"));
            shake += 10;
          }
        } else {
          enemies.splice(i, 1);
          state.score++;
          particles.push(...createParticles(e.x, e.y, 5, "red"));
        }

        break;
      }
    }
  }

  // Enemy bullet collision with player
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const eb = enemyBullets[i];
    if (Math.hypot(eb.x - player.x, eb.y - player.y) < eb.size + player.size) {
      if (player.shieldTime <= 0) {
        player.health -= 1;
        if (player.health <= 0) {
          state.gameOver = true;
        }
      }
      enemyBullets.splice(i, 1);
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
    } else if (e.type === "boss") {
      ctx.fillStyle = "purple";
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
    } else {
      ctx.fillStyle = "red";
    }

    // Piirrä vihollinen
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();

    if (e.type === "boss") {
      ctx.stroke();
    }

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

    // Bossille HP bar
    if (e.type === "boss") {
      const barWidth = 78;
      const barHeight = 6;
      const maxHp = e.maxHp;

      ctx.fillStyle = "black";
      ctx.fillRect(
        e.x - barWidth / 2,
        e.y - e.size - 14,
        barWidth,
        barHeight
      );

      ctx.fillStyle = "hotpink";
      ctx.fillRect(
        e.x - barWidth / 2,
        e.y - e.size - 14,
        barWidth * (e.hp / maxHp),
        barHeight
      );

      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        e.x - barWidth / 2,
        e.y - e.size - 14,
        barWidth,
        barHeight
      );
    }

  });
}   

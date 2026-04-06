export function spawnEnemy(canvas, enemies, state, difficulty) {
    const enemyTypes = ["basic", "tank", "fast"];
    const type = Math.random() < 0.7 ? "basic" : Math.random() < 0.5 ? "tank" : "fast";
    
    const side = Math.random() * 4;
    let x, y;
    
    if (side < 1) { x = Math.random() * canvas.width; y = -20; }
    else if (side < 2) { x = canvas.width + 20; y = Math.random() * canvas.height; }
    else if (side < 3) { x = Math.random() * canvas.width; y = canvas.height + 20; }
    else { x = -20; y = Math.random() * canvas.height; }
    
    const baseSpeed = type === "fast" ? 2.5 : type === "tank" ? 0.8 : 1.5;
    
    enemies.push({
        x: x,
        y: y,
        type: type,
        speed: baseSpeed * (0.8 + difficulty * 0.15),
        size: type === "tank" ? 20 : type === "fast" ? 10 : 15,
        health: type === "tank" ? 3 : 1,
        hp: type === "tank" ? 3 : 1,
        shootCooldown: type === "tank" ? 180 : 120,
        lastShot: 0
    });
}

export function updateEnemies(enemies, player, bullets, enemyBullets, state, difficulty) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        
        // Liikutus pelaajaa kohti
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 0) {
            e.x += (dx / distance) * e.speed;
            e.y += (dy / distance) * e.speed;
        }
        
        // Ammunta
        e.lastShot++;
        if (e.lastShot > e.shootCooldown) {
            const angle = Math.atan2(dy, dx);
            enemyBullets.push({
                x: e.x,
                y: e.y,
                dx: Math.cos(angle) * 4,
                dy: Math.sin(angle) * 4,
                size: 4
            });
            e.lastShot = 0;
        }
        
        // Osuma pelaajaan
        if (Math.hypot(e.x - player.x, e.y - player.y) < e.size + player.size) {
            player.health -= 0.5;
            enemies.splice(i, 1);
            continue;
        }
        
        // Luodin osuma viholliseen
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            
            if (Math.hypot(b.x - e.x, b.y - e.y) < b.size + e.size) {
                // Tarkistetaan vihollisen tyyppi terveydelle
                if (e.type === 'tank') {
                    if (e.hp <= 0) {
                        state.score += 50;
                        enemies.splice(i, 1);
                        bullets.splice(j, 1);
                        break;
                    }
                    e.hp -= b.type === "piercing" ? 2 : 1;
                } else {
                    if (e.health <= 0) {
                        state.score += 10;
                        enemies.splice(i, 1);
                        bullets.splice(j, 1);
                        break;
                    }
                    e.health -= b.type === "piercing" ? 2 : 1;
                }
                
                // Räjähtävät ammukset
                if (b.type === "explosive") {
                    for (let k = enemies.length - 1; k >= 0; k--) {
                        const other = enemies[k];
                        if (Math.hypot(b.x - other.x, b.y - other.y) < 80) {
                            if (other.type === 'tank') {
                                other.hp = Math.max(0, other.hp - 1);
                                if (other.hp <= 0) state.score += 50;
                            } else {
                                other.health = Math.max(0, other.health - 1);
                                if (other.health <= 0) state.score += 10;
                            }
                        }
                    }
                    bullets.splice(j, 1);
                    break;
                }
                
                // Normaali luoti - poista vain explosive ollessa
                if (b.type !== "piercing") {
                    bullets.splice(j, 1);
                }
                break;
            }
        }
        
        // Poista jos menee ruudun ulkopuolelle
        if (e.x < -50 || e.x > canvas.width + 50 || e.y < -50 || e.y > canvas.height + 50) {
            enemies.splice(i, 1);
        }
    }
}

export function drawEnemies(ctx, enemies, player) {
    enemies.forEach(e => {
        // Väri tyypittäin
        if (e.type === "tank") {
            ctx.fillStyle = "#ff0000";
        } else if (e.type === "fast") {
            ctx.fillStyle = "#00ffff";
        } else {
            ctx.fillStyle = "#ff8800";
        }
        
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        const health = e.type === 'tank' ? e.hp : e.health;
        ctx.fillText(health, e.x, e.y);
    });
}
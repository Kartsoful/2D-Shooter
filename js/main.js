import { createPlayer, updatePlayer, drawPlayer } from "./player.js";
import { shoot, updateBullets, drawBullets } from "./bullets.js";
import { spawnEnemy, spawnBoss, updateEnemies, drawEnemies } from "./enemies.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const uiPanel = document.getElementById("ui");
const instructionsPanel = document.getElementById("instructions");

canvas.width = window.innerWidth * 0.98;
canvas.height = window.innerHeight * 0.98;

const weapons = ["normal", "piercing", "explosive", "shotgun"];
const shieldDuration = 600;
const dashDuration = 12;
const dashCooldownTime = 180;
const baseShootCooldown = 200;

// Game variables
let player, bullets, enemies, enemyBullets, powerUps, state;
let weaponIndex = 0;
let explosiveAmmo = 0;
let piercingAmmo = 0;
let shotgunAmmo = 0;
let currentWeapon = "normal";
let keys = {}, mouse = { x: 0, y: 0 }, mouseDown = false;
let lastShot = 0;
let shootCooldown = baseShootCooldown;
let gameStarted = false;
let isPaused = false;
let difficulty = 1;        // Kasvaa ajan myötä
let gameTime = 0;
let particles = [];
let stars = [];
let shake = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let gameMode = 'normal';
let lastFrameTime = performance.now();
let nextDifficultyTime = 600;

// ==================== INPUT ====================
document.addEventListener("keydown", e => {
    if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        togglePause();
        return;
    }

    if (e.code === "Space") {
        e.preventDefault();
        attemptDash();
    }
    keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
document.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
document.addEventListener("mousedown", () => mouseDown = true);
document.addEventListener("mouseup", () => mouseDown = false);

// Wheel aseenvaihto
document.addEventListener("wheel", (e) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    selectNextWeapon(direction);
});

// ==================== GAME LOOP ====================
function gameLoop(timestamp = performance.now()) {
    if (!gameStarted || state.gameOver || isPaused) return;
    const deltaMs = Math.min(50, Math.max(0, timestamp - lastFrameTime));
    const dt = deltaMs / (1000 / 60);
    lastFrameTime = timestamp;

    gameTime += dt;
    if (gameTime >= nextDifficultyTime) {
        difficulty += 0.05;   // vaikeutuu hitaammin
        nextDifficultyTime += 600;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawStars(ctx, stars);

    updatePlayer(player, keys, canvas, dt);
    updateBullets(bullets, canvas, dt);
    updateBullets(enemyBullets, canvas, dt);
    updateEnemies(enemies, player, bullets, enemyBullets, state, difficulty, particles, shake, dt);
    updatePowerUps();
    updateWeaponLogic();
    updateShieldTimer(dt);
    updateSpeedBoostTimer(dt);
    updateRapidFireTimer(dt);
    updateStreakTimer(dt);
    updateParticles(particles, dt);
    updateStars(stars, canvas, dt);

    if (!state.bossSpawned && state.score >= 15 + state.bossCount * 30) {
        spawnBoss(canvas, enemies, state);
        state.bossSpawned = true;
    }

    checkWaveProgression();

    if (!isPaused && mouseDown && Date.now() - lastShot > shootCooldown) {
        const result = shoot(player, mouse, bullets, currentWeapon, explosiveAmmo, piercingAmmo, shotgunAmmo);
        explosiveAmmo = result.explosiveAmmo;
        piercingAmmo = result.piercingAmmo;
        shotgunAmmo = result.shotgunAmmo;
        player.muzzleFlashTime = 5 * dt;
        lastShot = Date.now();
    }

    if (player.health <= 0) {
        triggerGameOver();
        return;
    }

    // Apply shake
    ctx.save();
    if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake *= 0.9;
        if (shake < 0.1) shake = 0;
    }

    drawPlayer(ctx, player, mouse);
    drawBullets(ctx, bullets);
    drawEnemies(ctx, enemies, player);
    drawBossBar();
    drawPowerUps(ctx, powerUps);
    drawEnemyBullets(ctx, enemyBullets);
    drawParticles(ctx, particles);

    ctx.restore();

    updatePanelVisibility();
    drawUI();

    requestAnimationFrame(gameLoop);
}

// ==================== WAVE SYSTEM ====================
function checkWaveProgression() {
    if (gameMode === 'normal' && state.enemiesKilledThisWave >= state.waveEnemiesRequired) {
        // Advance to next wave
        state.wave++;
        const pointsEarned = Math.floor(state.wave / 2) + 1; // 1-2 points per wave
        state.upgradePoints += pointsEarned;
        
        // Increase difficulty and requirements for next wave
        state.waveEnemiesRequired = 10 + (state.wave - 1) * 5; // 10, 15, 20, 25...
        state.enemiesKilledThisWave = 0;
        player.health = Math.min(100, player.health + 10);
        player.shieldTime = Math.min(shieldDuration, player.shieldTime + 120);
        
        // Show wave completion message (could be enhanced with UI)
        console.log(`Wave ${state.wave - 1} completed! Earned ${pointsEarned} upgrade points.`);
        console.log(`Next wave requires ${state.waveEnemiesRequired} enemies.`);
    }
}

// ==================== HELPERS ====================
function updateWeaponLogic() {
    if (currentWeapon === "explosive" && explosiveAmmo <= 0) { currentWeapon = "normal"; weaponIndex = 0; }
    if (currentWeapon === "piercing" && piercingAmmo <= 0) { currentWeapon = "normal"; weaponIndex = 0; }
    if (currentWeapon === "shotgun" && shotgunAmmo <= 0) { currentWeapon = "normal"; weaponIndex = 0; }
}

function weaponHasAmmo(weaponName) {
    if (weaponName === "explosive") return explosiveAmmo > 0;
    if (weaponName === "piercing") return piercingAmmo > 0;
    if (weaponName === "shotgun") return shotgunAmmo > 0;
    return true;
}

function selectNextWeapon(direction) {
    for (let step = 1; step <= weapons.length; step++) {
        const idx = (weaponIndex + direction * step + weapons.length) % weapons.length;
        const weaponName = weapons[idx];
        if (weaponHasAmmo(weaponName)) {
            weaponIndex = idx;
            currentWeapon = weaponName;
            return;
        }
    }
}

function getDashDirection() {
    let dx = 0;
    let dy = 0;

    if (keys["w"]) dy -= 1;
    if (keys["s"]) dy += 1;
    if (keys["a"]) dx -= 1;
    if (keys["d"]) dx += 1;

    if (dx === 0 && dy === 0) {
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        dx = Math.cos(angle);
        dy = Math.sin(angle);
    }

    const length = Math.hypot(dx, dy);
    return length === 0 ? null : { x: dx / length, y: dy / length };
}

function attemptDash() {
    if (!gameStarted || state?.gameOver || player.dashCooldown > 0 || player.dashTime > 0) return;
    const dir = getDashDirection();
    if (!dir) return;
    player.dashDir = dir;
    player.dashTime = dashDuration;
    player.dashCooldown = dashCooldownTime;
}

function updateShieldTimer(dt = 1) {
    if (player.shieldTime > 0) {
        player.shieldTime -= dt;
    }
}

function updateSpeedBoostTimer(dt = 1) {
    if (player.speedBoostTime > 0) {
        player.speedBoostTime -= dt;
        if (player.speedBoostTime <= 0) {
            player.speed = 3.0; // Reset to normal speed
        }
    }
}

function updateRapidFireTimer(dt = 1) {
    if (player.rapidFireTime > 0) {
        player.rapidFireTime -= dt;
        shootCooldown = 110;
    } else {
        shootCooldown = baseShootCooldown;
    }
}

function updateStreakTimer(dt = 1) {
    if (!state) return;
    if (state.streakTimer > 0) {
        state.streakTimer -= dt;
        if (state.streakTimer <= 0) {
            state.killStreak = 0;
            state.scoreMultiplier = 1;
        }
    }
}

function getPanelDistance(panel) {
    const rect = panel.getBoundingClientRect();
    const px = player.x;
    const py = player.y;

    const dx = Math.max(rect.left - px, 0, px - rect.right);
    const dy = Math.max(rect.top - py, 0, py - rect.bottom);
    return Math.hypot(dx, dy);
}

function getPanelVisibility(panel) {
    const dist = getPanelDistance(panel);
    const fadeStart = 160;
    const fadeEnd = 60;

    if (dist >= fadeStart) return 1;
    if (dist <= fadeEnd) return 0.15;

    return 0.15 + ((dist - fadeEnd) / (fadeStart - fadeEnd)) * 0.85;
}

function updatePanelVisibility() {
    if (uiPanel) {
        const opacity = getPanelVisibility(uiPanel);
        uiPanel.style.opacity = opacity;
        uiPanel.style.pointerEvents = opacity < 0.2 ? "none" : "auto";
    }

    if (instructionsPanel) {
        const opacity = getPanelVisibility(instructionsPanel);
        instructionsPanel.style.opacity = opacity;
        instructionsPanel.style.pointerEvents = opacity < 0.2 ? "none" : "auto";
    }
}

function createParticles(x, y, count = 5, color = "#ffff00") {
  const parts = [];
  for (let i = 0; i < count; i++) {
    parts.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30,
      color: color
    });
  }
  return parts;
}

function updateParticles(particles, dt = 1) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(ctx, particles) {
  particles.forEach(p => {
    const alpha = p.life / 30;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function createStars(canvas) {
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 0.5 + 0.1,
      size: Math.random() * 2 + 1
    });
  }
  return stars;
}

function updateStars(stars, canvas, dt = 1) {
  stars.forEach(s => {
    s.x -= s.speed * dt;
    if (s.x < 0) {
      s.x = canvas.width;
      s.y = Math.random() * canvas.height;
    }
  });
}

function drawStars(ctx, stars) {
  ctx.fillStyle = "#ffffff";
  stars.forEach(s => {
    ctx.globalAlpha = Math.random() * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        if (Math.hypot(player.x - p.x, player.y - p.y) < player.size + p.size) {
            if (p.type === "explosive") {
                explosiveAmmo += Math.floor(Math.random() * 18) + 20;
            } else if (p.type === "piercing") {
                piercingAmmo += Math.floor(Math.random() * 18) + 20;
            } else if (p.type === "shotgun") {
                shotgunAmmo += Math.floor(Math.random() * 12) + 10; // Less ammo but more powerful
            } else if (p.type === "shield") {
                player.shieldTime = Math.min(player.shieldTime + 360, shieldDuration);
            } else if (p.type === "health") {
                player.health = Math.min(player.health + 25, 100);
            } else if (p.type === "speed") {
                player.speedBoostTime = Math.min((player.speedBoostTime || 0) + 600, 600); // 10 seconds max
                player.speed = 4.5; // Temporarily increase speed
            } else if (p.type === "rapidfire") {
                player.rapidFireTime = Math.min((player.rapidFireTime || 0) + 480, 720);
            }
            powerUps.splice(i, 1);
        }
    }
}

function drawPowerUps(ctx, powerUps) {
    powerUps.forEach(p => {
        if (p.type === "explosive") ctx.fillStyle = "#ff4444";
        else if (p.type === "piercing") ctx.fillStyle = "#44aaff";
        else if (p.type === "shotgun") ctx.fillStyle = "#ffaa00";
        else if (p.type === "shield") ctx.fillStyle = "#88ff88";
        else if (p.type === "health") ctx.fillStyle = "#00ff00";
        else if (p.type === "speed") ctx.fillStyle = "#ffff44";
        else if (p.type === "rapidfire") ctx.fillStyle = "#ff66ff";

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawUI() {
    document.getElementById("score").textContent = state.score;
    document.getElementById("highscore").textContent = highScore;
    document.getElementById("health").textContent = Math.max(0, player.health || 100);
    document.getElementById("weapon").textContent = currentWeapon;
    document.getElementById("explosive").textContent = explosiveAmmo;
    document.getElementById("piercing").textContent = piercingAmmo;
    document.getElementById("shotgun").textContent = shotgunAmmo;
    document.getElementById("shield").textContent = Math.ceil((player.shieldTime || 0) / 60);
    document.getElementById("rapidfire").textContent = Math.ceil((player.rapidFireTime || 0) / 60);
    document.getElementById("multiplier").textContent = `x${(state.scoreMultiplier || 1).toFixed(2)}`;
    document.getElementById("dash").textContent = player.dashCooldown > 0 ? Math.ceil(player.dashCooldown / 60) : "Ready";

    const healthPercent = Math.max(0, Math.min(100, player.health || 0));
    document.getElementById("healthBar").style.width = `${healthPercent}%`;

    const dashReadyPercent = player.dashCooldown > 0
        ? Math.max(0, 100 - (player.dashCooldown / dashCooldownTime) * 100)
        : 100;
    document.getElementById("dashBar").style.width = `${dashReadyPercent}%`;
}

function triggerGameOver() {
    state.gameOver = true;
    if (state.score > highScore) {
        highScore = state.score;
        localStorage.setItem('highScore', highScore);
    }
    document.getElementById("finalScore").textContent = state.score;
    document.getElementById("gameOver").style.display = "flex";
}

function drawBossBar() {
    const boss = enemies.find(e => e.type === "boss");
    if (!boss) return;

    const barWidth = 330;
    const barHeight = 14;
    const x = (canvas.width - barWidth) / 2;
    const y = 18;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(x - 3, y - 3, barWidth + 6, barHeight + 6);

    ctx.fillStyle = "#ff4f9f";
    ctx.fillRect(x, y, barWidth * (boss.hp / boss.maxHp), barHeight);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Arial";
    ctx.fillText("BOSS HEALTH", x, y - 6);
}

function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.dx;
        b.y += b.dy;

        // Poista jos menee ruudun ulkopuolelle
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }

        // Osuma pelaajaan
        if (Math.hypot(b.x - player.x, b.y - player.y) < player.size + b.size) {
            if (player.shieldTime <= 0) {
                player.health -= 1;
            }
            enemyBullets.splice(i, 1);
        }
    }
}

function drawEnemyBullets(ctx, enemyBullets) {
    ctx.fillStyle = "#ff00ff";   // magenta, helppo erottaa
    enemyBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function resetGame() {
    player = createPlayer(canvas);
    player.rapidFireTime = 0;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    powerUps = [];
    particles = [];
    stars = createStars(canvas);
    shake = 0;
    state = { 
        score: 0, 
        gameOver: false, 
        bossSpawned: false, 
        bossActive: false, 
        bossCount: 0,
        wave: 1,
        upgradePoints: 0,
        enemiesKilledThisWave: 0,
        waveEnemiesRequired: 10,
        killStreak: 0,
        streakTimer: 0,
        scoreMultiplier: 1
    };
    weaponIndex = 0;
    explosiveAmmo = 0;
    piercingAmmo = 0;
    shotgunAmmo = 0;
    currentWeapon = "normal";
    difficulty = 1;
    gameTime = 0;
    nextDifficultyTime = 600;
    isPaused = false;
    shootCooldown = baseShootCooldown;
    lastFrameTime = performance.now();
}

function togglePause() {
    if (!gameStarted || state?.gameOver) return;
    isPaused = !isPaused;
    document.getElementById("pauseScreen").style.display = isPaused ? "flex" : "none";
    if (!isPaused) gameLoop();
}

// Start button
document.getElementById("startBtn").addEventListener("click", () => {
    gameMode = 'normal';
    resetGame();
    document.getElementById("startScreen").style.display = "none";
    gameStarted = true;
    gameLoop();
});

// Survival mode
document.getElementById("survivalBtn").addEventListener("click", () => {
    gameMode = 'survival';
    resetGame();
    document.getElementById("startScreen").style.display = "none";
    gameStarted = true;
    gameLoop();
});

// Restart
window.restart = function() {
    document.getElementById("gameOver").style.display = "none";
    resetGame();
    gameStarted = true;
    gameLoop();
};

// Spawnaus
setInterval(() => {
    if (gameStarted && !state.gameOver && !isPaused) {
        spawnEnemy(canvas, enemies, state, difficulty);
    }
}, 1800);

setInterval(() => {
    if (gameStarted && !state.gameOver && !isPaused) {
        const r = Math.random();
        let powerUpType;
        if (r < 0.18) powerUpType = "piercing";
        else if (r < 0.36) powerUpType = "explosive";
        else if (r < 0.52) powerUpType = "shield";
        else if (r < 0.68) powerUpType = "health";
        else if (r < 0.82) powerUpType = "speed";
        else if (r < 0.92) powerUpType = "shotgun";
        else powerUpType = "rapidfire";
        
        powerUps.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: Math.random() * (canvas.height - 40) + 20,
            size: 12,
            type: powerUpType
        });
    }
}, 9000);

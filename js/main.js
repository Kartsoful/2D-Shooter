import { createPlayer, updatePlayer, drawPlayer } from "./player.js";
import { shoot, updateBullets, drawBullets } from "./bullets.js";
import { spawnEnemy, updateEnemies, drawEnemies } from "./enemies.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.98;
canvas.height = window.innerHeight * 0.98;

const weapons = ["normal", "piercing", "explosive"];

// Game variables
let player, bullets, enemies, enemyBullets, powerUps, state;
let weaponIndex = 0;
let explosiveAmmo = 0;
let piercingAmmo = 0;
let currentWeapon = "normal";
let keys = {}, mouse = { x: 0, y: 0 }, mouseDown = false;
let lastShot = 0;
const shootCooldown = 120;
let gameStarted = false;
let difficulty = 1;        // Kasvaa ajan myötä
let gameTime = 0;

// ==================== INPUT ====================
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
document.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
document.addEventListener("mousedown", () => mouseDown = true);
document.addEventListener("mouseup", () => mouseDown = false);

// Wheel aseenvaihto
document.addEventListener("wheel", (e) => {
    let nextIndex = (weaponIndex + (e.deltaY > 0 ? 1 : -1) + weapons.length) % weapons.length;
    let nextWeapon = weapons[nextIndex];
    if ((nextWeapon === "explosive" && explosiveAmmo <= 0) || 
        (nextWeapon === "piercing" && piercingAmmo <= 0)) return;
    weaponIndex = nextIndex;
    currentWeapon = nextWeapon;
});

// ==================== GAME LOOP ====================
function gameLoop() {
    if (!gameStarted || state.gameOver) return;

    gameTime++;
    if (gameTime % 480 === 0) {        // vaikeutuu noin 8 sekunnin välein
        difficulty += 0.2;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayer(player, keys, canvas);
    updateBullets(bullets, canvas);
    updateEnemies(enemies, player, bullets, enemyBullets, state, difficulty);

    updatePowerUps();
    updateWeaponLogic();

    if (mouseDown && Date.now() - lastShot > shootCooldown) {
        const result = shoot(player, mouse, bullets, currentWeapon, explosiveAmmo, piercingAmmo);
        explosiveAmmo = result.explosiveAmmo;
        piercingAmmo = result.piercingAmmo;
        lastShot = Date.now();
    }

    if (player.health <= 0) {
        triggerGameOver();
        return;
    }

    drawPlayer(ctx, player);
    drawBullets(ctx, bullets);
    drawEnemies(ctx, enemies, player);
    drawPowerUps(ctx, powerUps);
    drawEnemyBullets(ctx, enemyBullets);
    updateEnemyBullets();

    drawUI();

    requestAnimationFrame(gameLoop);
}

// ==================== HELPERS ====================
function updateWeaponLogic() {
    if (currentWeapon === "explosive" && explosiveAmmo <= 0) { currentWeapon = "normal"; weaponIndex = 0; }
    if (currentWeapon === "piercing" && piercingAmmo <= 0) { currentWeapon = "normal"; weaponIndex = 0; }
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        if (Math.hypot(player.x - p.x, player.y - p.y) < player.size + p.size) {
            const amount = Math.floor(Math.random() * 16) + 15;
            if (p.type === "explosive") explosiveAmmo += amount;
            else piercingAmmo += amount;
            powerUps.splice(i, 1);
        }
    }
}

function drawPowerUps(ctx, powerUps) {
    powerUps.forEach(p => {
        ctx.fillStyle = p.type === "explosive" ? "#ff4444" : "#44aaff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawUI() {
    document.getElementById("score").textContent = state.score;
    document.getElementById("health").textContent = Math.max(0, player.health || 100);
    document.getElementById("weapon").textContent = currentWeapon;
    document.getElementById("explosive").textContent = explosiveAmmo;
    document.getElementById("piercing").textContent = piercingAmmo;
}

function triggerGameOver() {
    state.gameOver = true;
    document.getElementById("finalScore").textContent = state.score;
    document.getElementById("gameOver").style.display = "flex";
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
            player.health -= 1;
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
    bullets = [];
    enemies = [];
    enemyBullets = [];
    powerUps = [];
    state = { score: 0, gameOver: false };
    weaponIndex = 0;
    explosiveAmmo = 0;
    piercingAmmo = 0;
    currentWeapon = "normal";
    difficulty = 1;
    gameTime = 0;
    gameStarted = false;
}

// Start button
document.getElementById("startBtn").addEventListener("click", () => {
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

// Viholliset spawn (vaikeutuu ajan myötä)
setInterval(() => {
    if (gameStarted && !state.gameOver) {
        spawnEnemy(canvas, enemies, state, difficulty);
    }
}, Math.max(400, 900 - difficulty * 40));   // spawnaa nopeammin kun vaikeutuu

// Power-upit
setInterval(() => {
    if (gameStarted && !state.gameOver) {
        powerUps.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: Math.random() * (canvas.height - 40) + 20,
            size: 12,
            type: Math.random() < 0.5 ? "piercing" : "explosive"
        });
    }
}, 8500);
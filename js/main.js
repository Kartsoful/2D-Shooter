import { createPlayer, updatePlayer, drawPlayer } from "./player.js";
import { shoot, updateBullets, drawBullets } from "./bullets.js";
import { spawnEnemy, updateEnemies, drawEnemies } from "./enemies.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const weapons = ["normal", "piercing", "explosive"];

// State
let player = createPlayer(canvas);
let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerUps = [];
let state = { score: 0, gameOver: false };
let weaponIndex = 0;
let explosiveAmmo = 0;
let piercingAmmo = 0;
let currentWeapon = "normal";

let keys = {};
let mouse = { x: 0, y: 0 };
let mouseDown = false;
let lastShot = 0;
const shootCooldown = 150;   // ms

// Input
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
document.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
document.addEventListener("mousedown", () => mouseDown = true);
document.addEventListener("mouseup", () => mouseDown = false);

// Wheel aseenvaihto
document.addEventListener("wheel", (e) => {
    let nextIndex = (weaponIndex + (e.deltaY > 0 ? 1 : -1) + weapons.length) % weapons.length;
    let nextWeapon = weapons[nextIndex];

    if (nextWeapon === "explosive" && explosiveAmmo <= 0) return;
    if (nextWeapon === "piercing" && piercingAmmo <= 0) return;

    weaponIndex = nextIndex;
    currentWeapon = nextWeapon;
});

// ====================== GAME LOOP ======================
function gameLoop() {
    if (state.gameOver) return;

    // Update
    updatePlayer(player, keys);
    updateBullets(bullets, canvas);
    updateEnemies(enemies, player, bullets, enemyBullets, state);
    updatePowerUps();

    updateWeaponLogic();

    // Shooting
    if (mouseDown && Date.now() - lastShot > shootCooldown) {
        const result = shoot(player, mouse, bullets, currentWeapon, explosiveAmmo, piercingAmmo);
        explosiveAmmo = result.explosiveAmmo;
        piercingAmmo = result.piercingAmmo;
        lastShot = Date.now();
    }

    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer(ctx, player);
    drawBullets(ctx, bullets);
    drawEnemies(ctx, enemies);
    drawPowerUps(ctx, powerUps);

    updateUI();

    requestAnimationFrame(gameLoop);
}

// ====================== HELPERS ======================
function updateWeaponLogic() {
    if (currentWeapon === "explosive" && explosiveAmmo <= 0) {
        currentWeapon = "normal";
        weaponIndex = 0;
    }
    if (currentWeapon === "piercing" && piercingAmmo <= 0) {
        currentWeapon = "normal";
        weaponIndex = 0;
    }
}

function updateUI() {
    document.getElementById("score").textContent = state.score;
    document.getElementById("health").textContent = Math.max(0, player.health);
    document.getElementById("weapon").textContent = currentWeapon;
    document.getElementById("explosive").textContent = explosiveAmmo;
    document.getElementById("piercing").textContent = piercingAmmo;
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

// Spawnit
setInterval(() => {
    if (!state.gameOver) spawnEnemy(canvas, enemies, state);
}, 800);

setInterval(() => {
    if (!state.gameOver) {
        powerUps.push({
            x: Math.random() * (canvas.width - 50) + 25,
            y: Math.random() * (canvas.height - 50) + 25,
            size: 12,
            type: Math.random() < 0.5 ? "piercing" : "explosive"
        });
    }
}, 9000);

// Start-painike
document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("startScreen").style.display = "none";
    gameLoop();
});

// Restart
window.restart = function () {
    player = createPlayer(canvas);
    bullets = [];
    enemies = [];
    enemyBullets = [];
    powerUps = [];
    state = { score: 0, gameOver: false };
    explosiveAmmo = 0;
    piercingAmmo = 0;
    currentWeapon = "normal";
    weaponIndex = 0;
    document.getElementById("gameOver").style.display = "none";
    gameLoop();
};
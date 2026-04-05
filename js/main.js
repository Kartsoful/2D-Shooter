import { createPlayer, updatePlayer, drawPlayer } from "./player.js";
import { shoot, updateBullets, drawBullets } from "./bullets.js";
import { spawnEnemy, updateEnemies, drawEnemies } from "./enemies.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const weapons = ["normal", "piercing", "explosive"];


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// State
let player = createPlayer(canvas);
let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerUps = [];
let weaponType = "normal"; // normal | piercing | explosive
let state = { score: 0, gameOver: false };
let weaponIndex = 0;
let normalAmmo = Infinity;        // normaali ammukset loputtomiin
let explosiveAmmo = 0;
let piercingAmmo = 0;
let spawnRate = 1000;
let currentWeapon = "normal";     // "normal" | "explosive" | "piercing"

// Input
let keys = {};
let mouse = { x: 0, y: 0 };

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
document.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

document.addEventListener("click", () => {
    if (!state.gameOver) {
        const result = shoot(player, mouse, bullets, currentWeapon, explosiveAmmo, piercingAmmo);
        explosiveAmmo = result.explosiveAmmo;
        piercingAmmo = result.piercingAmmo;
    }
});

document.addEventListener("wheel", (e) => {
    let nextIndex = (weaponIndex + (e.deltaY > 0 ? 1 : -1) + weapons.length) % weapons.length;
    let nextWeapon = weapons[nextIndex];

    // Tarkista onko ammuksia
    if (nextWeapon === "explosive" && explosiveAmmo <= 0) return;
    if (nextWeapon === "piercing" && piercingAmmo <= 0) return;

    weaponIndex = nextIndex;
    currentWeapon = nextWeapon;
});

// Game loop
function gameLoop() {
    if (state.gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Päivitykset
    updatePlayer(player, keys, canvas);
    updateBullets(bullets, canvas);
    updateEnemies(enemies, player, enemyBullets, canvas);
    updatePowerUps(powerUps, player);

    // === AMMO & WEAPON LOGIIKKA ===
    updateWeaponLogic();

    // Ampuminen (hiiri)
    if (mouseDown && Date.now() - lastShot > shootCooldown) {
        const result = shoot(player, mouse, bullets, currentWeapon, explosiveAmmo, piercingAmmo);
        explosiveAmmo = result.explosiveAmmo;
        piercingAmmo = result.piercingAmmo;
        lastShot = Date.now();
    }

    // Piirto
    drawPlayer(ctx, player);
    drawBullets(ctx, bullets);
    drawEnemies(ctx, enemies);
    drawPowerUps(ctx, powerUps);
    drawUI();

    requestAnimationFrame(gameLoop);
}

// Restart (global for button)
window.restart = function () {
  player = createPlayer(canvas);
  bullets = [];
  enemies = [];
  enemyBullets = [];
  state = { score: 0, gameOver: false };
  spawnRate = 1000;

  document.getElementById("gameOver").style.display = "none";
  loop();
};



function spawnLoop() {
  if (!state.gameOver) {
    spawnEnemy(canvas, enemies, state);
    spawnRate *= 0.99; // nopeutuu
    setTimeout(spawnLoop, spawnRate);
  }
}

function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];

    b.x += b.dx;
    b.y += b.dy;

    if (Math.hypot(player.x - b.x, player.y - b.y) < player.size + b.size) {
        player.health -= 5;
        enemyBullets.splice(i, 1);
        continue;
    }

    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
        enemyBullets.splice(i, 1);
    }
    }
}

function drawEnemyBullets(ctx, enemyBullets) {
  ctx.fillStyle = "orange";
  enemyBullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function spawnPowerUp() {
  powerUps.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: 10,
    type: Math.random() < 0.5 ? "piercing" : "explosive"
  });
}

setInterval(spawnPowerUp, 8000);

function drawPowerUps(ctx, powerUps) {
  powerUps.forEach(p => {
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateWeapon() {
    if (currentWeapon === "explosive" && explosiveAmmo <= 0) {
        currentWeapon = "normal";
        weaponIndex = weapons.indexOf("normal");
    }
    if (currentWeapon === "piercing" && piercingAmmo <= 0) {
        currentWeapon = "normal";
        weaponIndex = weapons.indexOf("normal");
    }
}

// Automaattinen aseenvaihto kun ammukset loppuu
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

// UI-päivitys
function drawUI() {
    document.getElementById("score").textContent = state.score;
    document.getElementById("health").textContent = player.health;
    document.getElementById("weapon").textContent = currentWeapon;
    document.getElementById("explosive").textContent = explosiveAmmo;
    document.getElementById("piercing").textContent = piercingAmmo;

    // Värikoodaus
    document.getElementById("weapon").style.color = 
        currentWeapon === "explosive" ? "#ff4444" : 
        currentWeapon === "piercing" ? "#44aaff" : "#ffffff";
}

spawnLoop();
// Start
gameLoop();
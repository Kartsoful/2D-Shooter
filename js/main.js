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
  if (!state.gameOver) shoot(player, mouse, bullets, weaponType);
});

document.addEventListener("wheel", (e) => {
  if (e.deltaY > 0) {
    weaponIndex = (weaponIndex + 1) % weapons.length;
  } else {
    weaponIndex = (weaponIndex - 1 + weapons.length) % weapons.length;
  }

  weaponType = weapons[weaponIndex];
});

// Game loop
function loop() {
  if (!state.gameOver) {
    updatePlayer(player, keys);
    updateBullets(bullets, canvas);
    updateEnemyBullets(); // ✅ TÄNNE
    updateEnemies(enemies, player, bullets, enemyBullets, state);

    powerUps.forEach((p, i) => {
        if (Math.hypot(player.x - p.x, player.y - p.y) < player.size + p.size) {
             weaponType = p.type; powerUps.splice(i, 1);
            }
        });
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer(ctx, player);
    drawBullets(ctx, bullets);
    drawEnemyBullets(ctx, enemyBullets); // ✅ TÄNNE
    drawEnemies(ctx, enemies, player);
    drawPowerUps(ctx, powerUps);

    document.getElementById("score").textContent = state.score;
    document.getElementById("health").textContent = player.health;
    document.getElementById("weapon").textContent = weaponType;

    requestAnimationFrame(loop);
  } else {
    document.getElementById("gameOver").style.display = "block";
  }
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

// Spawn loop
let spawnRate = 1000;

function spawnLoop() {
  if (!state.gameOver) {
    spawnEnemy(canvas, enemies, state);
    spawnRate *= 0.98; // nopeutuu
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

spawnLoop();
// Start
loop();
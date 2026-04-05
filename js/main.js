import { createPlayer, updatePlayer, drawPlayer } from "./player.js";
import { shoot, updateBullets, drawBullets } from "./bullets.js";
import { spawnEnemy, updateEnemies, drawEnemies } from "./enemies.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// State
let player = createPlayer(canvas);
let bullets = [];
let enemies = [];
let enemyBullets = [];
let state = { score: 0, gameOver: false };

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
  if (!state.gameOver) shoot(player, mouse, bullets);
});

// Game loop
function loop() {
  if (!state.gameOver) {
    updatePlayer(player, keys);
    updateBullets(bullets, canvas);
    updateEnemyBullets(); // ✅ TÄNNE
    updateEnemies(enemies, player, bullets, enemyBullets, state);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer(ctx, player);
    drawBullets(ctx, bullets);
    drawEnemyBullets(ctx, enemyBullets); // ✅ TÄNNE
    drawEnemies(ctx, enemies, player);

    document.getElementById("score").textContent = state.score;
    document.getElementById("health").textContent = player.health;

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

spawnLoop();
// Start
loop();
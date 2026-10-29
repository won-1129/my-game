const canvas = document.getElementById("game"); // HTML에서 게임 캔버스를 가져옵니다.
const ctx = canvas.getContext("2d"); // 캔버스에 그림을 그릴 도구를 가져옵니다.

// 게임 물체의 크기와 위치, 속도를 모아 둡니다.
const roadHeight = 75; // 화면 아래쪽 회색 바다의 높이입니다.
const roadTop = canvas.height - roadHeight; // 회색 바다가 시작되는 높이입니다.
const playerWidth = 32; // 플레이어 사각형의 가로 크기입니다.
const playerHeight = playerWidth * 1.5; // 플레이어의 세로 크기를 가로의 1.5배로 설정합니다.
const playerPixelSize = 4; // 도트 캐릭터 한 칸의 크기입니다.
const playerSprite = [
  "..HHHH..",
  ".HHHHHH.",
  ".HSSSS..",
  ".HSESSS.",
  "..SSSS..",
  "...YY...",
  ".TTYYTT.",
  "TTTTTTTT",
  ".TTTTTT.",
  ".TT..TT.",
  ".BB..BB.",
  "BBB..BBB",
]; // 청록색 옷과 노란 목도리를 한 오리지널 도트 캐릭터입니다.
const playerJumpSprite = [
  "..HHHH..",
  ".HHHHHH.",
  ".HSSSS..",
  ".HSESSS.",
  "..SSSS..",
  ".T.YY.T.",
  "TTTYYTTT",
  ".TTTTTT.",
  "..TTTT..",
  "..T..T..",
  ".BB..BB.",
  ".BB..BB.",
]; // 공중에서는 팔과 다리를 벌린 점프 포즈를 사용합니다.
const playerColors = {
  H: "#263238",
  S: "#f2c08b",
  E: "#263238",
  T: "#168c83",
  Y: "#f2c744",
  B: "#594236",
};
const playerSpeed = 5; // 플레이어가 한 프레임에 이동하는 픽셀 수입니다.
const gravity = 0.5; // 매 프레임 세로 속도에 더하는 중력입니다.
const jumpStrength = 12; // 점프할 때 적용하는 위쪽 속도의 크기입니다.
const playerHitFlashDuration = 60; // 장애물에 맞은 뒤 깜빡이는 프레임 수입니다.
let playerX = (canvas.width - playerWidth) / 2; // 플레이어를 화면 가로 가운데에 둡니다.
let playerY = roadTop - playerHeight; // 플레이어를 회색 바다의 윗면에 올려둡니다.
let playerFacing = 1; // 1은 오른쪽, -1은 왼쪽을 바라보는 방향입니다.
let playerVelocityY = 0; // 플레이어의 세로 이동 속도입니다.
let isOnGround = true; // 플레이어가 바닥에 있는지 저장합니다.
let playerHitFlashFrames = 0; // 장애물에 맞은 뒤 남은 깜빡임 시간입니다.
const keys = {}; // 눌린 키의 현재 상태를 저장합니다.
const controlKeyMap = {
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  ArrowUp: "ArrowUp",
  a: "ArrowLeft",
  d: "ArrowRight",
  w: "ArrowUp",
}; // WASD 입력을 방향키와 같은 조작으로 연결합니다.
const obstacleRadius = 10; // 빨간 장애물 원의 반지름입니다.
const obstacleCount = 9; // 화면에 나타날 장애물의 개수입니다.
const obstacleMinSpeed = 1.5; // 장애물의 최소 낙하 속도입니다.
const obstacleMaxSpeed = 4; // 장애물의 최대 낙하 속도입니다.
const bonusRadius = 10; // 목숨을 회복하는 녹색 원의 반지름입니다.
const bonusSpawnInterval = 5000; // 녹색 원을 생성하는 간격(밀리초)입니다.
const bonusSpawnCount = 2; // 한 번에 생성하는 녹색 원의 개수입니다.
const clouds = [
  { x: canvas.width * 0.15, y: canvas.height * 0.12, size: 0.12, speedX: 0.22 },
  { x: canvas.width * 0.58, y: canvas.height * 0.18, size: 0.1, speedX: 0.16 },
  { x: canvas.width * 0.88, y: canvas.height * 0.1, size: 0.14, speedX: 0.2 },
]; // 구름의 위치, 크기와 천천히 움직이는 속도입니다.
const explosionParticleCount = 12; // 한 번 터질 때 흩어지는 파편 수입니다.
const explosionDuration = 28; // 폭발 효과가 유지되는 프레임 수입니다.
const explosionGravity = 0.12; // 폭발 파편에 적용되는 아래 방향 중력입니다.
const obstacles = Array.from({ length: obstacleCount }, () => ({
  x: obstacleRadius + Math.random() * (canvas.width - obstacleRadius * 2),
  y: Math.random() * canvas.height * 0.55,
  speedY: obstacleMinSpeed + Math.random() * (obstacleMaxSpeed - obstacleMinSpeed),
})); // 장애물마다 위치와 아래로 떨어지는 속도를 저장합니다.
const bonusObstacles = []; // 목숨을 회복하는 녹색 원을 저장합니다.
let lastBonusSpawnTime = performance.now(); // 마지막 녹색 원 생성 시각입니다.
const explosions = []; // 충돌할 때 생기는 폭발 효과를 저장합니다.
const healEffects = []; // 목숨 회복 표시 효과를 저장합니다.
const healEffectDuration = 36; // 회복 효과가 유지되는 프레임 수입니다.
let lives = 3; // 남은 목숨 수를 저장합니다.
const timerValue = "0.00"; // 화면에 표시할 버틴 시간입니다.
const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
skyGradient.addColorStop(0, "#4da9e8");
skyGradient.addColorStop(1, "#d8f1ff");

function drawCloud(cloud) {
  const cloudWidth = canvas.width * cloud.size;
  const puffRadius = cloudWidth * 0.2;
  const centerY = cloud.y;

  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.beginPath();
  ctx.arc(cloud.x - cloudWidth * 0.25, centerY, puffRadius, 0, Math.PI * 2);
  ctx.arc(cloud.x, centerY - puffRadius * 0.35, puffRadius * 1.3, 0, Math.PI * 2);
  ctx.arc(cloud.x + cloudWidth * 0.25, centerY, puffRadius, 0, Math.PI * 2);
  ctx.arc(cloud.x, centerY + puffRadius * 0.25, puffRadius * 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  if (playerHitFlashFrames > 0 && Math.floor(playerHitFlashFrames / 5) % 2 === 0) {
    return; // 깜빡임 주기에 따라 플레이어를 잠시 그리지 않습니다.
  }

  const sprite = isOnGround ? playerSprite : playerJumpSprite;
  ctx.save();
  ctx.translate(
    playerX + (playerFacing === -1 ? playerWidth : 0),
    playerY,
  );
  ctx.scale(playerFacing, 1);

  sprite.forEach((row, y) => {
    [...row].forEach((pixel, x) => {
      if (pixel !== ".") {
        ctx.fillStyle = playerColors[pixel];
        ctx.fillRect(
          x * playerPixelSize,
          y * playerPixelSize,
          playerPixelSize,
          playerPixelSize,
        );
      }
    });
  });
  ctx.restore();
}

function drawSchool() {
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const outline = "#332442";
  const brick = "#a34f50";
  const roof = "#d8dfc4";
  const trim = "#858b79";

  // 학교 전체를 세로로 키워 기단이 회색 바닥 시작점에 닿게 합니다.
  const schoolTop = height * 0.21;
  const schoolBottom = height * 0.703;
  const schoolScaleY = (roadTop - height * 0.015) / (schoolBottom - schoolTop);
  ctx.save();
  ctx.translate(0, height * 0.015 - schoolTop * schoolScaleY);
  ctx.scale(1, schoolScaleY);

  // 굵은 외곽선과 계단형 지붕으로 픽셀풍 학교 실루엣을 만듭니다.
  ctx.fillStyle = outline;
  ctx.fillRect(width * 0.1, height * 0.47, width * 0.8, height * 0.24);
  ctx.fillRect(width * 0.32, height * 0.3, width * 0.36, height * 0.27);
  ctx.fillRect(width * 0.33, height * 0.28, width * 0.34, height * 0.03);
  ctx.fillRect(width * 0.37, height * 0.25, width * 0.26, height * 0.03);
  ctx.fillRect(width * 0.43, height * 0.22, width * 0.14, height * 0.03);
  ctx.fillRect(width * 0.48, height * 0.21, width * 0.04, height * 0.02);

  // 양쪽 날개와 가운데 교실을 붉은 벽돌색으로 채웁니다.
  ctx.fillStyle = brick;
  ctx.fillRect(width * 0.11, height * 0.48, width * 0.78, height * 0.2);
  ctx.fillRect(width * 0.34, height * 0.32, width * 0.32, height * 0.23);

  // 양쪽 지붕과 중앙 현관 위의 차양을 겹친 띠로 그립니다.
  ctx.fillStyle = outline;
  ctx.fillRect(width * 0.08, height * 0.43, width * 0.84, height * 0.055);
  ctx.fillRect(width * 0.33, height * 0.54, width * 0.34, height * 0.035);
  ctx.fillStyle = roof;
  ctx.fillRect(width * 0.09, height * 0.44, width * 0.82, height * 0.022);
  ctx.fillRect(width * 0.11, height * 0.47, width * 0.78, height * 0.018);
  ctx.fillRect(width * 0.34, height * 0.55, width * 0.32, height * 0.012);
  ctx.fillStyle = trim;
  ctx.fillRect(width * 0.09, height * 0.465, width * 0.82, height * 0.012);
  ctx.fillRect(width * 0.34, height * 0.565, width * 0.32, height * 0.012);

  // 중앙 지붕의 밝은 테두리와 시계를 그립니다.
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.moveTo(width * 0.3, height * 0.33);
  ctx.lineTo(centerX, height * 0.24);
  ctx.lineTo(width * 0.7, height * 0.33);
  ctx.lineTo(width * 0.7, height * 0.35);
  ctx.lineTo(centerX, height * 0.27);
  ctx.lineTo(width * 0.3, height * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(width * 0.315, height * 0.33);
  ctx.lineTo(centerX, height * 0.255);
  ctx.lineTo(width * 0.685, height * 0.33);
  ctx.lineTo(width * 0.685, height * 0.34);
  ctx.lineTo(centerX, height * 0.27);
  ctx.lineTo(width * 0.315, height * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.arc(centerX, height * 0.33, width * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.arc(centerX, height * 0.33, width * 0.018, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = outline;
  ctx.fillRect(centerX - width * 0.002, height * 0.318, width * 0.004, height * 0.013);
  ctx.fillRect(centerX, height * 0.329, width * 0.012, height * 0.004);

  // 날개 양쪽에 어두운 격자창을 배치합니다.
  const sideWindowRows = [0.505, 0.61];
  const sideWindowColumns = [0.16, 0.25, 0.71, 0.8];
  sideWindowRows.forEach((row) => {
    sideWindowColumns.forEach((column) => {
      const windowX = width * column;
      const windowY = height * row;
      ctx.fillStyle = outline;
      ctx.fillRect(
        windowX - width * 0.006,
        windowY - height * 0.006,
        width * 0.052,
        height * 0.052,
      );
      ctx.fillStyle = "#455064";
      ctx.fillRect(windowX, windowY, width * 0.04, height * 0.044);
      ctx.fillStyle = "#a87b86";
      ctx.fillRect(windowX, windowY + height * 0.02, width * 0.04, height * 0.006);
      ctx.fillRect(windowX + width * 0.018, windowY, width * 0.007, height * 0.044);
    });
  });

  // 중앙 위층의 세로 창문과 가운데 쌍문 현관을 그립니다.
  for (let column = 0; column < 4; column += 1) {
    const windowX = width * (0.385 + column * 0.06);
    ctx.fillStyle = outline;
    ctx.fillRect(windowX, height * 0.365, width * 0.032, height * 0.065);
    ctx.fillStyle = "#455064";
    ctx.fillRect(windowX + width * 0.007, height * 0.373, width * 0.018, height * 0.05);
  }
  ctx.fillStyle = outline;
  ctx.fillRect(centerX - width * 0.065, height * 0.57, width * 0.13, height * 0.13);
  ctx.fillStyle = "#d5aa68";
  ctx.fillRect(centerX - width * 0.055, height * 0.58, width * 0.11, height * 0.12);
  ctx.fillStyle = "#684a4d";
  ctx.fillRect(centerX - width * 0.004, height * 0.58, width * 0.008, height * 0.12);
  ctx.fillStyle = outline;
  ctx.fillRect(centerX - width * 0.04, height * 0.615, width * 0.012, height * 0.012);
  ctx.fillRect(centerX + width * 0.028, height * 0.615, width * 0.012, height * 0.012);

  // 건물 아래에 계단과 밝은 기단을 덧붙입니다.
  ctx.fillStyle = outline;
  ctx.fillRect(width * 0.09, height * 0.68, width * 0.82, height * 0.035);
  ctx.fillStyle = roof;
  ctx.fillRect(width * 0.105, height * 0.685, width * 0.79, height * 0.018);

  ctx.restore();
}

function resetObstacle(obstacle) {
  obstacle.x = obstacleRadius + Math.random() * (canvas.width - obstacleRadius * 2);
  obstacle.y = -obstacleRadius;
  obstacle.speedY =
    obstacleMinSpeed + Math.random() * (obstacleMaxSpeed - obstacleMinSpeed);
}

function createExplosion(x, y) {
  const particles = Array.from({ length: explosionParticleCount }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    return {
      x,
      y,
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      color: Math.random() < 0.5 ? "#ffd34e" : "#ff7043",
    };
  });
  explosions.push({ x, y, age: 0, particles });
}

function drawExplosions() {
  explosions.forEach((explosion) => {
    const progress = explosion.age / explosionDuration;
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = "#ffd34e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, 5 + progress * 24, 0, Math.PI * 2);
    ctx.stroke();

    explosion.particles.forEach((particle) => {
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
  });
  ctx.globalAlpha = 1;
}

function drawHealEffects() {
  healEffects.forEach((effect) => {
    const progress = effect.age / healEffectDuration;
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = "#20c957";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 6 + progress * 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#20c957";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("+1", effect.x, effect.y - 12 - progress * 20);
  });
  ctx.globalAlpha = 1;
  ctx.textAlign = "start";
}

function gameLoop() {
  const currentTime = performance.now();
  if (currentTime - lastBonusSpawnTime >= bonusSpawnInterval) {
    for (let index = 0; index < bonusSpawnCount; index += 1) {
      bonusObstacles.push({
        x: bonusRadius + Math.random() * (canvas.width - bonusRadius * 2),
        y: -bonusRadius * (index * 2 + 1),
        speedY: obstacleMinSpeed + Math.random() * (obstacleMaxSpeed - obstacleMinSpeed),
      });
    }
    lastBonusSpawnTime = currentTime;
  }

  if (playerHitFlashFrames > 0) {
    playerHitFlashFrames -= 1;
  }

  // 누른 좌우 방향키에 따라 플레이어를 이동합니다.
  const moveX = Number(Boolean(keys.ArrowRight)) - Number(Boolean(keys.ArrowLeft));
  if (moveX !== 0) {
    playerFacing = moveX;
  }
  playerX = Math.max(
    0,
    Math.min(canvas.width - playerWidth, playerX + moveX * playerSpeed),
  );

  // 중력으로 세로 속도를 바꾸고 플레이어의 높이를 갱신합니다.
  playerVelocityY += gravity;
  playerY += playerVelocityY;
  if (playerY + playerHeight >= roadTop) {
    playerY = roadTop - playerHeight;
    playerVelocityY = 0;
    isOnGround = true;
  }

  // 지우기: 이전 프레임에 그린 화면을 지웁니다.
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 계산: 장애물을 아래로 움직이고, 플레이어나 회색 바다에 닿으면 위로 되돌립니다.
  obstacles.forEach((obstacle) => {
    obstacle.y += obstacle.speedY;

    const closestX = Math.max(playerX, Math.min(obstacle.x, playerX + playerWidth));
    const closestY = Math.max(playerY, Math.min(obstacle.y, playerY + playerHeight));
    const distanceX = obstacle.x - closestX;
    const distanceY = obstacle.y - closestY;
    const touchesPlayer =
      playerHitFlashFrames === 0 &&
      distanceX * distanceX + distanceY * distanceY <= obstacleRadius * obstacleRadius;

    const touchesSea = obstacle.y + obstacleRadius >= roadTop;
    if (touchesPlayer || touchesSea) {
      if (touchesPlayer) {
        lives = Math.max(0, lives - 1);
        playerHitFlashFrames = playerHitFlashDuration;
      }
      createExplosion(obstacle.x, obstacle.y);
      resetObstacle(obstacle);
    }
  });

  // 목숨 회복 원을 아래로 내리고, 플레이어가 닿으면 목숨을 회복합니다.
  for (let index = bonusObstacles.length - 1; index >= 0; index -= 1) {
    const bonus = bonusObstacles[index];
    bonus.y += bonus.speedY;

    const closestX = Math.max(playerX, Math.min(bonus.x, playerX + playerWidth));
    const closestY = Math.max(playerY, Math.min(bonus.y, playerY + playerHeight));
    const distanceX = bonus.x - closestX;
    const distanceY = bonus.y - closestY;
    const touchesPlayer =
      distanceX * distanceX + distanceY * distanceY <= bonusRadius * bonusRadius;

    if (touchesPlayer) {
      lives += 1;
      healEffects.push({
        x: playerX + playerWidth / 2,
        y: playerY + playerHeight / 2,
        age: 0,
      });
      bonusObstacles.splice(index, 1);
    } else if (bonus.y + bonusRadius >= roadTop) {
      bonusObstacles.splice(index, 1);
    }
  }

  // 계산: 폭발 파편을 퍼뜨리고 시간이 지난 효과를 정리합니다.
  explosions.forEach((explosion) => {
    explosion.age += 1;
    explosion.particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.speedY += explosionGravity;
    });
  });
  for (let index = explosions.length - 1; index >= 0; index -= 1) {
    if (explosions[index].age >= explosionDuration) {
      explosions.splice(index, 1);
    }
  }
  healEffects.forEach((effect) => {
    effect.age += 1;
  });
  for (let index = healEffects.length - 1; index >= 0; index -= 1) {
    if (healEffects[index].age >= healEffectDuration) {
      healEffects.splice(index, 1);
    }
  }

  // 계산: 구름을 천천히 오른쪽으로 옮기고 화면 밖에서 반대편으로 이어 붙입니다.
  clouds.forEach((cloud) => {
    const cloudWidth = canvas.width * cloud.size;
    cloud.x += cloud.speedX;
    if (cloud.x - cloudWidth / 2 > canvas.width) {
      cloud.x = -cloudWidth / 2;
    }
  });

  // 그리기: 하늘, 회색 바다, 장애물, 플레이어와 상태 표시를 그립니다.
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 학교를 그리기 전에 구름을 그려 배경 뒤에 보이게 합니다.
  clouds.forEach(drawCloud);
  drawSchool();

  ctx.fillStyle = "gray";
  ctx.fillRect(0, roadTop, canvas.width, roadHeight);

  ctx.fillStyle = "red";
  obstacles.forEach((obstacle) => {
    ctx.beginPath();
    ctx.arc(obstacle.x, obstacle.y, obstacleRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#20c957";
  bonusObstacles.forEach((bonus) => {
    ctx.beginPath();
    ctx.arc(bonus.x, bonus.y, bonusRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  drawPlayer();

  // 그리기: 충돌 지점에 퍼져 나가는 고리와 불꽃 파편을 그립니다.
  drawExplosions();
  drawHealEffects();

  ctx.fillStyle = "red";
  ctx.font = "26px sans-serif";
  ctx.fillText("♥", 18, 36);
  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText(String(lives), 50, 35);

  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(timerValue, canvas.width / 2, 35);
  ctx.textAlign = "start";

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

document.addEventListener("keydown", (event) => {
  const controlKey = controlKeyMap[event.key] || controlKeyMap[event.key.toLowerCase()];
  if (controlKey) {
    if (controlKey === "ArrowUp" && !keys.ArrowUp && isOnGround) {
      playerVelocityY = -jumpStrength;
      isOnGround = false;
    }
    keys[controlKey] = true; // 방향키와 WASD의 눌림 상태를 저장합니다.
    event.preventDefault();
  }
  if (event.key === " ") {
    if (!keys.Space && isOnGround) {
      playerVelocityY = -jumpStrength;
      isOnGround = false;
    }
    keys.Space = true; // 스페이스바를 누른 상태를 저장합니다.
    event.preventDefault(); // 스페이스바의 페이지 스크롤을 막습니다.
  }
});

document.addEventListener("keyup", (event) => {
  const controlKey = controlKeyMap[event.key] || controlKeyMap[event.key.toLowerCase()];
  if (controlKey) {
    keys[controlKey] = false; // 방향키와 WASD에서 손을 뗀 상태를 저장합니다.
  }
  if (event.key === " ") {
    keys.Space = false; // 스페이스바에서 손을 뗀 상태를 저장합니다.
  }
});

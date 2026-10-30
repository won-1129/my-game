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
const playerSpeed = 300; // 초당 이동 픽셀입니다.
const gravity = 1800; // 초당 세로 속도에 더하는 중력입니다.
const jumpStrength = 720; // 점프할 때 적용하는 초당 위쪽 속도입니다.
const playerHitFlashDuration = 1; // 장애물에 맞은 뒤 깜빡이는 시간(초)입니다.
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
const obstacleIncreaseInterval = 10; // 장애물이 하나씩 늘어나는 점수 간격(초)입니다.
const obstacleSpeedIncreaseInterval = 60; // 장애물 속도가 증가하는 간격(초)입니다.
const obstacleSpeedIncrease = 30; // 간격마다 더할 초당 낙하 속도입니다.
const fastObstacleUnlockInterval = 30; // 빠른 장애물 출현량이 늘어나는 간격(초)입니다.
const fastObstacleSpawnInterval = 10; // 빠른 장애물 출현 주기(초)입니다.
const fastObstacleSpeed = 480; // 빠른 장애물의 초당 낙하 속도입니다.
const obstacleMinSpeed = 90; // 장애물의 최소 초당 낙하 속도입니다.
const obstacleMaxSpeed = 240; // 장애물의 최대 초당 낙하 속도입니다.
const recoveryItemRadius = 10; // 회복 아이템의 반지름입니다.
const recoveryItemSpawnInterval = 5000; // 회복 아이템 생성 간격(밀리초)입니다.
const recoveryItemSpawnCount = 2; // 한 번에 생성하는 회복 아이템 개수입니다.
const clouds = [
  { x: canvas.width * 0.15, y: canvas.height * 0.12, size: 0.12, speedX: 13.2 },
  { x: canvas.width * 0.58, y: canvas.height * 0.18, size: 0.1, speedX: 9.6 },
  { x: canvas.width * 0.88, y: canvas.height * 0.1, size: 0.14, speedX: 12 },
]; // 구름의 위치, 크기와 천천히 움직이는 속도입니다.
const explosionParticleCount = 12; // 한 번 터질 때 흩어지는 파편 수입니다.
const explosionDuration = 28 / 60; // 폭발 효과가 유지되는 시간입니다.
const explosionGravity = 432; // 폭발 파편에 적용되는 초당 아래 방향 중력입니다.
const obstacles = Array.from({ length: obstacleCount }, () => ({
  x: obstacleRadius + Math.random() * (canvas.width - obstacleRadius * 2),
  y: Math.random() * canvas.height * 0.55,
  speedY: obstacleMinSpeed + Math.random() * (obstacleMaxSpeed - obstacleMinSpeed),
})); // 장애물마다 위치와 아래로 떨어지는 속도를 저장합니다.
const fastObstacles = []; // 빠르게 떨어지는 빨간 장애물을 저장합니다.
const recoveryItems = []; // 화면에 떨어지는 회복 아이템을 저장합니다.
let lastRecoveryItemSpawnTime = performance.now(); // 마지막 회복 아이템 생성 시각입니다.
let nextFastObstacleSpawnTime = 0; // 다음 빠른 장애물 출현 시각입니다.
const explosions = []; // 충돌할 때 생기는 폭발 효과를 저장합니다.
const healEffects = []; // 목숨 회복 표시 효과를 저장합니다.
const healEffectDuration = 36 / 60; // 회복 효과가 유지되는 시간입니다.
let lives = 3; // 남은 목숨 수를 저장합니다.
let startTime = 0; // 점수 계산을 시작할 시각입니다.
let score = 0; // 현재까지 버틴 시간 점수입니다.
let gameState = "playing"; // 게임 진행 상태를 저장합니다.
let lastFrameTime = 0; // 이전 프레임의 시간입니다.
const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
skyGradient.addColorStop(0, "#4da9e8");
skyGradient.addColorStop(1, "#d8f1ff");

function resetGame() {
  // 플레이어와 게임 오브젝트를 처음 상태로 되돌립니다.
  playerX = (canvas.width - playerWidth) / 2;
  playerY = roadTop - playerHeight;
  playerFacing = 1;
  playerVelocityY = 0;
  isOnGround = true;
  playerHitFlashFrames = 0;
  lives = 3;
  score = 0;
  startTime = Date.now(); // 게임을 초기화할 때 점수 시작 시각도 새로 기록합니다.
  nextFastObstacleSpawnTime = startTime + fastObstacleUnlockInterval * 1000;
  lastRecoveryItemSpawnTime = performance.now();
  lastFrameTime = 0;
  obstacles.length = obstacleCount; // 추가된 장애물을 제거해 처음 개수로 되돌립니다.
  fastObstacles.length = 0;
  recoveryItems.length = 0;
  explosions.length = 0;
  healEffects.length = 0;
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
  obstacles.forEach(resetObstacle);
  clouds[0].x = canvas.width * 0.15;
  clouds[1].x = canvas.width * 0.58;
  clouds[2].x = canvas.width * 0.88;
  gameState = "playing";
}

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
  if (
    gameState === "playing" &&
    playerHitFlashFrames > 0 &&
    Math.floor((1 - playerHitFlashFrames) * 10) % 2 === 0
  ) {
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
      speedX: Math.cos(angle) * speed * 60,
      speedY: Math.sin(angle) * speed * 60,
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

function gameLoop(timestamp) {
  const deltaSeconds =
    lastFrameTime === 0
      ? 1 / 60
      : Math.min((timestamp - lastFrameTime) / 1000, 0.05);
  lastFrameTime = timestamp;

  // 게임 상태와 관계없이 매 프레임 화면을 새로 그립니다.
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "playing") {
    score = Math.floor((Date.now() - startTime) / 1000);
    const targetObstacleCount =
      obstacleCount + Math.floor(score / obstacleIncreaseInterval);
    while (obstacles.length < targetObstacleCount) {
      obstacles.push({
        x: obstacleRadius + Math.random() * (canvas.width - obstacleRadius * 2),
        y: -obstacleRadius,
        speedY: obstacleMinSpeed + Math.random() * (obstacleMaxSpeed - obstacleMinSpeed),
      });
    }
    const currentTime = Date.now();
    while (currentTime >= nextFastObstacleSpawnTime) {
      const unlockedFastObstacleCount = Math.floor(
        (nextFastObstacleSpawnTime - startTime) /
          (fastObstacleUnlockInterval * 1000),
      );
      for (let index = 0; index < unlockedFastObstacleCount; index += 1) {
        fastObstacles.push({
          x: obstacleRadius + Math.random() * (canvas.width - obstacleRadius * 2),
          y: -obstacleRadius,
          speedY: fastObstacleSpeed,
        });
      }
      nextFastObstacleSpawnTime += fastObstacleSpawnInterval * 1000;
    }

    const currentPerformanceTime = performance.now();
    if (currentPerformanceTime - lastRecoveryItemSpawnTime >= recoveryItemSpawnInterval) {
      for (let index = 0; index < recoveryItemSpawnCount; index += 1) {
        recoveryItems.push({
          x: recoveryItemRadius + Math.random() * (canvas.width - recoveryItemRadius * 2),
          y: -recoveryItemRadius * (index * 2 + 1),
          speedY: obstacleMinSpeed + Math.random() * (obstacleMaxSpeed - obstacleMinSpeed),
        });
      }
      lastRecoveryItemSpawnTime = currentPerformanceTime;
    }

    if (playerHitFlashFrames > 0) {
      playerHitFlashFrames -= deltaSeconds;
      if (playerHitFlashFrames < 0) {
        playerHitFlashFrames = 0;
      }
    }

    // 누른 좌우 방향키에 따라 플레이어를 이동합니다.
    const moveX = Number(Boolean(keys.ArrowRight)) - Number(Boolean(keys.ArrowLeft));
    if (moveX !== 0) {
      playerFacing = moveX;
    }
    playerX = Math.max(
      0,
      Math.min(
        canvas.width - playerWidth,
        playerX + moveX * playerSpeed * deltaSeconds,
      ),
    );

    // 중력으로 세로 속도를 바꾸고 플레이어의 높이를 갱신합니다.
    playerVelocityY += gravity * deltaSeconds;
    playerY += playerVelocityY * deltaSeconds;
    if (playerY + playerHeight >= roadTop) {
      playerY = roadTop - playerHeight;
      playerVelocityY = 0;
      isOnGround = true;
    }

    // 계산: 장애물을 아래로 움직이고, 플레이어와 닿으면 게임 오버 처리합니다.
    obstacles.forEach((obstacle) => {
      if (gameState !== "playing") {
        return;
      }

      const speedIncrease =
        Math.floor(score / obstacleSpeedIncreaseInterval) * obstacleSpeedIncrease;
      obstacle.y += (obstacle.speedY + speedIncrease) * deltaSeconds;

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
          if (lives === 0) {
            score = Math.floor((Date.now() - startTime) / 1000);
            gameState = "gameover";
          }
        }
        createExplosion(obstacle.x, obstacle.y);
        resetObstacle(obstacle);
      }
    });

    // 빠른 장애물을 이동시키고, 닿으면 목숨을 줄입니다.
    for (let index = fastObstacles.length - 1; index >= 0; index -= 1) {
      if (gameState !== "playing") {
        break;
      }

      const obstacle = fastObstacles[index];
      obstacle.y += obstacle.speedY * deltaSeconds;

      const closestX = Math.max(playerX, Math.min(obstacle.x, playerX + playerWidth));
      const closestY = Math.max(playerY, Math.min(obstacle.y, playerY + playerHeight));
      const distanceX = obstacle.x - closestX;
      const distanceY = obstacle.y - closestY;
      const touchesPlayer =
        playerHitFlashFrames === 0 &&
        distanceX * distanceX + distanceY * distanceY <= obstacleRadius * obstacleRadius;

      if (touchesPlayer) {
        lives = Math.max(0, lives - 1);
        playerHitFlashFrames = playerHitFlashDuration;
        if (lives === 0) {
          score = Math.floor((Date.now() - startTime) / 1000);
          gameState = "gameover";
        }
        createExplosion(obstacle.x, obstacle.y);
      } else if (obstacle.y + obstacleRadius >= roadTop) {
        createExplosion(obstacle.x, obstacle.y);
      }
      if (touchesPlayer || obstacle.y + obstacleRadius >= roadTop) {
        fastObstacles.splice(index, 1);
      }
    }

    // 회복 아이템을 아래로 내리고, 플레이어가 닿으면 목숨을 회복합니다.
    for (
      let index = recoveryItems.length - 1;
      index >= 0 && gameState === "playing";
      index -= 1
    ) {
      const recoveryItem = recoveryItems[index];
      recoveryItem.y += recoveryItem.speedY * deltaSeconds;

      const closestX = Math.max(playerX, Math.min(recoveryItem.x, playerX + playerWidth));
      const closestY = Math.max(playerY, Math.min(recoveryItem.y, playerY + playerHeight));
      const distanceX = recoveryItem.x - closestX;
      const distanceY = recoveryItem.y - closestY;
      const touchesPlayer =
        distanceX * distanceX + distanceY * distanceY <=
        recoveryItemRadius * recoveryItemRadius;

      if (touchesPlayer) {
        lives += 1;
        healEffects.push({
          x: playerX + playerWidth / 2,
          y: playerY + playerHeight / 2,
          age: 0,
        });
        recoveryItems.splice(index, 1);
      } else if (recoveryItem.y + recoveryItemRadius >= roadTop) {
        recoveryItems.splice(index, 1);
      }
    }
  }

  // 계산: 폭발 파편을 퍼뜨리고 시간이 지난 효과를 정리합니다.
  if (gameState === "playing") {
    explosions.forEach((explosion) => {
      explosion.age += deltaSeconds;
      explosion.particles.forEach((particle) => {
        particle.x += particle.speedX * deltaSeconds;
        particle.y += particle.speedY * deltaSeconds;
        particle.speedY += explosionGravity * deltaSeconds;
      });
    });
    for (let index = explosions.length - 1; index >= 0; index -= 1) {
      if (explosions[index].age >= explosionDuration) {
        explosions.splice(index, 1);
      }
    }
    healEffects.forEach((effect) => {
      effect.age += deltaSeconds;
    });
    for (let index = healEffects.length - 1; index >= 0; index -= 1) {
      if (healEffects[index].age >= healEffectDuration) {
        healEffects.splice(index, 1);
      }
    }

    // 구름은 플레이 중에만 천천히 움직입니다.
    clouds.forEach((cloud) => {
      const cloudWidth = canvas.width * cloud.size;
      cloud.x += cloud.speedX * deltaSeconds;
      if (cloud.x - cloudWidth / 2 > canvas.width) {
        cloud.x = -cloudWidth / 2;
      }
    });
  }

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
  fastObstacles.forEach((obstacle) => {
    ctx.beginPath();
    ctx.arc(obstacle.x, obstacle.y, obstacleRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#20c957";
  recoveryItems.forEach((recoveryItem) => {
    ctx.beginPath();
    ctx.arc(recoveryItem.x, recoveryItem.y, recoveryItemRadius, 0, Math.PI * 2);
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
  ctx.fillText(`점수: ${score}`, 18, 68);

  if (gameState === "gameover") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 35);
    ctx.font = "24px sans-serif";
    ctx.fillText(`최종 점수: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.font = "18px sans-serif";
    ctx.fillText("R 키를 눌러 다시 시작", canvas.width / 2, canvas.height / 2 + 48);
    ctx.textAlign = "start";
  }

  requestAnimationFrame(gameLoop);
}

resetGame();
requestAnimationFrame(gameLoop);

document.addEventListener("keydown", (event) => {
  if (gameState === "gameover") {
    if (event.key.toLowerCase() === "r" && !event.repeat) {
      resetGame();
    }
    if (event.key.startsWith("Arrow") || event.key === " ") {
      event.preventDefault();
    }
    return;
  }

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

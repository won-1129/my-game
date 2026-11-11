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
  "HHSSSSS.",
  "HSwESSS.",
  ".HSSMS..",
  "...YY...",
  ".TYYYYT.",
  "TTTTTTTT",
  ".TTppTT.",
  "..DDDD..",
  ".DD..DD.",
  ".FF..FF.",
]; // 3/4뷰 도트 캐릭터: 머리카락이 얼굴을 감싸고, 눈은 흰자(w)+동공(E) 2픽셀, 볼터치, 청록 상의에 주머니 디테일, 노란 목도리, 남색 바지, 갈색 신발입니다.
const playerJumpSprite = [
  "..HHHH..",
  ".HHHHHH.",
  "HHSSSSS.",
  "HSwESSS.",
  ".HSSMS..",
  "T..YY..T",
  "TTYYYYTT",
  ".TTTTTT.",
  "..TppT..",
  "..D..D..",
  ".DD..DD.",
  ".FF..FF.",
]; // 공중에서는 팔을 벌리고 다리를 넓힌 점프 포즈를 사용합니다.
const playerColors = {
  H: "#263238",   // 머리카락 (짙은 회색)
  S: "#f2c08b",   // 피부색
  w: "#ffffff",   // 눈 흰자·하이라이트
  E: "#1a1a2e",   // 눈동자 (짙은 남색)
  M: "#e8887c",   // 볼터치 (연분홍)
  Y: "#f2c744",   // 목도리 (노란색)
  T: "#168c83",   // 상의 기본색 (청록)
  p: "#0d6b63",   // 상의 주머니·음영 (어두운 청록)
  D: "#3b4a6b",   // 바지 (짙은 남색)
  F: "#594236",   // 신발 (갈색)
};
const playerSpeed = 300; // 초당 이동 픽셀입니다.
const gravity = 1800; // 초당 세로 속도에 더하는 중력입니다.
const jumpStrength = 720; // 점프할 때 적용하는 초당 위쪽 속도입니다.
const playerHitFlashDuration = 1; // 적과 충돌한 뒤 깜빡이며 보호되는 시간(초)입니다.
let playerX = (canvas.width - playerWidth) / 2; // 플레이어를 화면 가로 가운데에 둡니다.
let playerY = roadTop - playerHeight; // 플레이어를 회색 바다의 윗면에 올려둡니다.
let playerFacing = 1; // 1은 오른쪽, -1은 왼쪽을 바라보는 방향입니다.
let playerVelocityY = 0; // 플레이어의 세로 이동 속도입니다.
let isOnGround = true; // 플레이어가 바닥에 있는지 저장합니다.
let playerHitFlashFrames = 0; // 충돌 후 깜빡이며 보호되는 시간이 얼마나 남았는지 저장합니다.
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
const shieldItemRadius = 10; // 보호막 아이템의 반지름입니다.
const shieldItemSpawnCount = 1; // 한 번에 생성하는 보호막 아이템 개수 (회복 아이템의 절반값)입니다.
const shieldItemSpawnInterval = 10000; // 보호막 생성 간격 (출현 빈도를 절반으로 줄인 10초(10000밀리초)마다 1개씩 생성)입니다.

// 60초 이후부터 30초마다 등장하는 지상 학생 장애물 설정입니다.
const studentWidth = 56; // 학생 무리의 가로 크기입니다.
const studentHeight = 44; // 학생 무리의 세로 크기 (점프해야만 피할 수 있는 높이)입니다.
const studentPixelSize = 4; // 도트 크기입니다.
const studentSpeed = 510; // 지상을 가로질러 달리는 초당 속도 (기존 340의 1.5배)입니다.
const studentUnlockTime = 60; // 출현 시작 시각 (60초 이후)입니다.
const studentInterval = 30; // 출현 주기 (30초마다)입니다.
const studentWarningDuration = 1.3; // 출현 전 경고 표시 시간(초)입니다.
const studentObstacles = []; // 현재 화면을 달리는 학생 장애물 목록입니다.
let nextStudentSpawnTime = studentUnlockTime + 4 + Math.random() * 20; // 다음 학생 출현 시각(초)입니다.
let pendingStudentDirection = Math.random() < 0.5 ? 1 : -1; // 1: 왼쪽->오른쪽, -1: 오른쪽->왼쪽

// 학생 도트 스프라이트 색상 및 달리기 애니메이션 프레임입니다.
const studentColors = {
  H: "#263238", // 머리카락 (짙은 회색)
  S: "#f2c08b", // 피부색
  E: "#1a1a2e", // 눈
  C: "#ffffff", // 교복 셔츠
  N: "#1e3a5f", // 교복 자켓 (네이비)
  B: "#d35400", // 책가방 (오렌지 브라운)
  D: "#34495e", // 교복 바지 (슬랙스)
  F: "#2c3e50", // 학생 신발
};

const studentSpriteFrame1 = [
  "....HHH........HHH...",
  "...HHHHH......HHHHH..",
  "...HSSES......HSSES..",
  "...SSSS.......SSSS...",
  "..NCBNNN.....NCBNNN..",
  "..NNNNNN.....NNNNNN..",
  "...NNNN.......NNNN...",
  "...DD.DD......D...D..",
  "..DD...DD....DD...DD.",
  "..FF...FF....FF...FF.",
  ".....................",
];

const studentSpriteFrame2 = [
  "....HHH........HHH...",
  "...HHHHH......HHHHH..",
  "...HSSES......HSSES..",
  "...SSSS.......SSSS...",
  "..NCBNNN.....NCBNNN..",
  "..NNNNNN.....NNNNNN..",
  "...NNNN.......NNNN...",
  "..DD...DD.....DD.DD..",
  ".DD.....DD...DD...DD.",
  ".FF.....FF...FF...FF.",
  ".....................",
];
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
const shieldItems = []; // 화면에 떨어지는 회색 보호막 아이템을 저장합니다.
let lastRecoveryItemSpawnTime = performance.now(); // 마지막 회복 아이템 생성 시각입니다.
let lastShieldItemSpawnTime = performance.now(); // 마지막 보호막 아이템 생성 시각입니다.
let nextFastObstacleSpawnTime = 0; // 다음 빠른 장애물 출현 시각입니다.
const explosions = []; // 충돌할 때 생기는 폭발 효과를 저장합니다.
const healEffects = []; // 목숨 회복 표시 효과를 저장합니다.
const healEffectDuration = 36 / 60; // 회복 효과가 유지되는 시간입니다.
const shieldEffects = []; // 보호막 획득 표시 효과를 저장합니다.
const shieldEffectDuration = 36 / 60; // 보호막 효과가 유지되는 시간입니다.
let lives = 3; // 남은 목숨 수를 저장합니다.
let shields = 0; // 플레이어가 보유한 보호막 개수입니다.
let showHitbox = false; // true로 설정하면 충돌 판정 영역을 빨간 테두리로 표시합니다.
let startTime = 0; // 점수 계산을 시작할 시각입니다.
let elapsedSeconds = 0; // 진행 시간(초)입니다.
let score = 0; // 최소 속도에 비례해 증가하는 게임 점수입니다.
let gameState = "playing"; // 게임 진행 상태를 저장합니다.
let lastFrameTime = 0; // 이전 프레임의 시간입니다.
let pauseStartTime = 0; // 일시정지 시작 시각입니다.
let pauseStartPerf = 0; // 일시정지 시작 고정밀 시각입니다.
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
  shields = 0;
  score = 0;
  elapsedSeconds = 0;
  startTime = Date.now(); // 게임을 초기화할 때 점수 시작 시각도 새로 기록합니다.
  nextFastObstacleSpawnTime = startTime + fastObstacleUnlockInterval * 1000;
  lastRecoveryItemSpawnTime = performance.now();
  lastShieldItemSpawnTime = performance.now();
  pauseStartTime = 0;
  pauseStartPerf = 0;
  lastFrameTime = 0;
  obstacles.length = obstacleCount; // 추가된 장애물을 제거해 처음 개수로 되돌립니다.
  fastObstacles.length = 0;
  recoveryItems.length = 0;
  shieldItems.length = 0;
  studentObstacles.length = 0;
  nextStudentSpawnTime = studentUnlockTime + 4 + Math.random() * 20;
  pendingStudentDirection = Math.random() < 0.5 ? 1 : -1;
  explosions.length = 0;
  healEffects.length = 0;
  shieldEffects.length = 0;
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
    Math.round(playerX + (playerFacing === -1 ? playerWidth : 0)),
    Math.round(playerY),
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

function drawStudents() {
  studentObstacles.forEach((student) => {
    const frame =
      Math.floor(student.animTimer * 15) % 2 === 0
        ? studentSpriteFrame1
        : studentSpriteFrame2;
    ctx.save();
    ctx.translate(
      Math.round(student.x + (student.direction === -1 ? student.width : 0)),
      Math.round(student.y),
    );
    ctx.scale(student.direction, 1);

    frame.forEach((row, y) => {
      [...row].forEach((pixel, x) => {
        if (pixel !== "." && studentColors[pixel]) {
          ctx.fillStyle = studentColors[pixel];
          ctx.fillRect(
            x * studentPixelSize,
            y * studentPixelSize,
            studentPixelSize,
            studentPixelSize,
          );
        }
      });
    });
    ctx.restore();
  });
}

function drawStudentWarning() {
  if (gameState !== "playing") return;
  const timeUntilSpawn = nextStudentSpawnTime - elapsedSeconds;
  if (
    elapsedSeconds >= studentUnlockTime - studentWarningDuration &&
    timeUntilSpawn > 0 &&
    timeUntilSpawn <= studentWarningDuration
  ) {
    const flash = Math.floor(timeUntilSpawn * 8) % 2 === 0;
    if (flash) {
      ctx.save();
      const warningY = roadTop - studentHeight - 14;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = pendingStudentDirection === 1 ? "left" : "right";
      ctx.fillStyle = "#ffdd33";
      ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
      ctx.shadowBlur = 6;
      if (pendingStudentDirection === 1) {
        ctx.fillText("▶▶ ⚠ 학생들 뛰어오는 중! (점프 준비)", 16, warningY);
      } else {
        ctx.fillText("(점프 준비) ⚠ 학생들 뛰어오는 중! ◀◀", canvas.width - 16, warningY);
      }
      ctx.restore();
    }
  }
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

function drawShieldEffects() {
  shieldEffects.forEach((effect) => {
    const progress = effect.age / shieldEffectDuration;
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = "#90a4ae";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 6 + progress * 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#b0bec5";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("+보호막", effect.x, effect.y - 12 - progress * 20);
  });
  ctx.globalAlpha = 1;
  ctx.textAlign = "start";
}

// 회복 아이템의 원형 충돌 판정 영역을 테두리로 그립니다.
function drawCircleHitbox(x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

// 두 사각형이 가로와 세로 방향 모두에서 겹치는지 확인합니다.
function checkCollision(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

// 원 중심과 반지름으로 적의 사각형 충돌 영역을 만듭니다.
function getEnemyHitbox(enemy) {
  return {
    x: enemy.x - obstacleRadius,
    y: enemy.y - obstacleRadius,
    width: obstacleRadius * 2,
    height: obstacleRadius * 2,
  };
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
    elapsedSeconds = Math.max(0, (Date.now() - startTime) / 1000);

    // 최소 속도 증가량 계산 (60초마다 30씩 증가)
    const speedIncrease =
      Math.floor(elapsedSeconds / obstacleSpeedIncreaseInterval) * obstacleSpeedIncrease;
    const currentMinSpeed = obstacleMinSpeed + speedIncrease;
    // 처음에는 초당 1점씩 증가하며, 최소 속도가 늘어날수록 점수 증가율도 비례하여 상승합니다.
    const scoreMultiplier = currentMinSpeed / obstacleMinSpeed;
    score += deltaSeconds * scoreMultiplier;

    const targetObstacleCount =
      obstacleCount + Math.floor(elapsedSeconds / obstacleIncreaseInterval);
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

    // 보호막 아이템은 출현 빈도를 줄여 10초마다 1개씩 생성됩니다.
    if (currentPerformanceTime - lastShieldItemSpawnTime >= shieldItemSpawnInterval) {
      for (let index = 0; index < shieldItemSpawnCount; index += 1) {
        shieldItems.push({
          x: shieldItemRadius + Math.random() * (canvas.width - shieldItemRadius * 2),
          y: -shieldItemRadius * (index * 2 + 1),
          speedY: obstacleMinSpeed + Math.random() * (obstacleMaxSpeed - obstacleMinSpeed),
        });
      }
      lastShieldItemSpawnTime = currentPerformanceTime;
    }

    // 60초 이후부터 30초마다 랜덤한 시점에 지상 학생 장애물이 출현합니다.
    if (elapsedSeconds >= nextStudentSpawnTime) {
      studentObstacles.push({
        x: pendingStudentDirection === 1 ? -studentWidth : canvas.width,
        y: roadTop - studentHeight,
        width: studentWidth,
        height: studentHeight,
        speedX: pendingStudentDirection === 1 ? studentSpeed : -studentSpeed,
        direction: pendingStudentDirection,
        animTimer: 0,
        hit: false,
      });

      // 다음 30초 주기 내의 랜덤 출현 시점 예약
      const periodIndex = Math.floor((elapsedSeconds - studentUnlockTime) / studentInterval);
      const nextPeriodStart = studentUnlockTime + (periodIndex + 1) * studentInterval;
      nextStudentSpawnTime = nextPeriodStart + 3 + Math.random() * 22;
      pendingStudentDirection = Math.random() < 0.5 ? 1 : -1;
    }

    if (playerHitFlashFrames > 0) {
      playerHitFlashFrames = Math.max(0, playerHitFlashFrames - deltaSeconds);
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

    // 일반 장애물을 아래로 이동합니다.
    obstacles.forEach((obstacle) => {
      obstacle.y += (obstacle.speedY + speedIncrease) * deltaSeconds;
    });

    // 빠른 장애물도 이동한 뒤 충돌 여부를 확인합니다.
    fastObstacles.forEach((obstacle) => {
      obstacle.y += obstacle.speedY * deltaSeconds;
    });

    // 일반 적과 빠른 적을 enemies 배열로 모아 사각형 충돌을 확인합니다.
    const enemies = [...obstacles, ...fastObstacles];
    const playerHitbox = {
      x: playerX,
      y: playerY,
      width: playerWidth,
      height: playerHeight,
    };
    enemies.forEach((enemy) => {
      if (
        gameState === "playing" &&
        playerHitFlashFrames === 0 &&
        checkCollision(playerHitbox, getEnemyHitbox(enemy))
      ) {
        if (shields > 0) {
          shields -= 1; // 장애물에 맞았을 때 생명보다 보호막이 먼저 깎입니다.
        } else {
          lives = Math.max(0, lives - 1);
        }
        playerHitFlashFrames = playerHitFlashDuration;
        createExplosion(enemy.x, enemy.y);

        if (fastObstacles.includes(enemy)) {
          fastObstacles.splice(fastObstacles.indexOf(enemy), 1);
        } else {
          resetObstacle(enemy);
        }

        if (lives === 0) {
          gameState = "gameover";
        }
      }
    });

    // 충돌 검사가 끝난 뒤 바닥에 닿은 적을 재배치하거나 제거합니다.
    obstacles.forEach((obstacle) => {
      if (obstacle.y + obstacleRadius >= roadTop) {
        createExplosion(obstacle.x, obstacle.y);
        resetObstacle(obstacle);
      }
    });
    for (let index = fastObstacles.length - 1; index >= 0; index -= 1) {
      const obstacle = fastObstacles[index];
      if (obstacle.y + obstacleRadius >= roadTop) {
        createExplosion(obstacle.x, obstacle.y);
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
        if (lives < 3) {
          lives += 1;
          healEffects.push({
            x: playerX + playerWidth / 2,
            y: playerY + playerHeight / 2,
            age: 0,
          });
        }
        recoveryItems.splice(index, 1);
      } else if (recoveryItem.y + recoveryItemRadius >= roadTop) {
        recoveryItems.splice(index, 1);
      }
    }

    // 보호막 아이템을 아래로 내리고, 플레이어가 닿으면 보호막을 충전합니다.
    for (
      let index = shieldItems.length - 1;
      index >= 0 && gameState === "playing";
      index -= 1
    ) {
      const shieldItem = shieldItems[index];
      shieldItem.y += shieldItem.speedY * deltaSeconds;

      const closestX = Math.max(playerX, Math.min(shieldItem.x, playerX + playerWidth));
      const closestY = Math.max(playerY, Math.min(shieldItem.y, playerY + playerHeight));
      const distanceX = shieldItem.x - closestX;
      const distanceY = shieldItem.y - closestY;
      const touchesPlayer =
        distanceX * distanceX + distanceY * distanceY <=
        shieldItemRadius * shieldItemRadius;

      if (touchesPlayer) {
        shields += 1; // 보호막을 먹으면 먹을수록 증가합니다.
        shieldEffects.push({
          x: playerX + playerWidth / 2,
          y: playerY + playerHeight / 2,
          age: 0,
        });
        shieldItems.splice(index, 1);
      } else if (shieldItem.y + shieldItemRadius >= roadTop) {
        shieldItems.splice(index, 1);
      }
    }

    // 학생 장애물을 가로로 이동하고, 점프하지 않은 플레이어와의 충돌을 검사합니다.
    for (let index = studentObstacles.length - 1; index >= 0; index -= 1) {
      const student = studentObstacles[index];
      student.x += student.speedX * deltaSeconds;
      student.animTimer += deltaSeconds;

      // 플레이어와 충돌 검사 (지상에 서 있으면 무조건 닿고, 점프하면 피할 수 있음)
      if (
        gameState === "playing" &&
        playerHitFlashFrames === 0 &&
        !student.hit &&
        checkCollision(playerHitbox, student)
      ) {
        student.hit = true;
        if (shields > 0) {
          shields -= 1;
        } else {
          lives = Math.max(0, lives - 1);
        }
        playerHitFlashFrames = playerHitFlashDuration;
        createExplosion(playerX + playerWidth / 2, playerY + playerHeight / 2);

        if (lives === 0) {
          gameState = "gameover";
        }
      }

      // 화면 밖으로 완전히 벗어나면 학생 장애물 제거
      if (
        (student.direction === 1 && student.x > canvas.width + 60) ||
        (student.direction === -1 && student.x + student.width < -60)
      ) {
        studentObstacles.splice(index, 1);
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
    shieldEffects.forEach((effect) => {
      effect.age += deltaSeconds;
    });
    for (let index = shieldEffects.length - 1; index >= 0; index -= 1) {
      if (shieldEffects[index].age >= shieldEffectDuration) {
        shieldEffects.splice(index, 1);
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

  // 보호막 아이템 (회색)
  shieldItems.forEach((shieldItem) => {
    ctx.fillStyle = "#90a4ae";
    ctx.beginPath();
    ctx.arc(shieldItem.x, shieldItem.y, shieldItemRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cfd8dc";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // 지상 학생 장애물 그리기
  drawStudents();

  drawPlayer();

  // 충돌 판정에 사용하는 플레이어, 적, 회복 아이템, 보호막 아이템, 학생 장애물의 영역을 표시합니다.
  if (showHitbox) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.strokeRect(playerX, playerY, playerWidth, playerHeight);
    [...obstacles, ...fastObstacles].forEach((enemy) => {
      const hitbox = getEnemyHitbox(enemy);
      ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    });
    recoveryItems.forEach((recoveryItem) => {
      drawCircleHitbox(recoveryItem.x, recoveryItem.y, recoveryItemRadius);
    });
    shieldItems.forEach((shieldItem) => {
      drawCircleHitbox(shieldItem.x, shieldItem.y, shieldItemRadius);
    });
    studentObstacles.forEach((student) => {
      ctx.strokeRect(student.x, student.y, student.width, student.height);
    });
  }

  // 그리기: 충돌 지점에 퍼져 나가는 고리와 불꽃 파편을 그립니다.
  drawExplosions();
  drawHealEffects();
  drawShieldEffects();
  drawStudentWarning();

  // 맨 위 중앙: 진행 시간 표시 (MM:SS)
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = Math.floor(elapsedSeconds % 60);
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  ctx.save();
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(`진행 시간: ${formattedTime}`, canvas.width / 2, 35);
  ctx.restore();

  ctx.fillStyle = "red";
  ctx.font = "26px sans-serif";
  ctx.fillText("♥", 18, 36);
  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText(String(lives), 50, 35);

  // 플레이어가 보호막을 획득했을 때 목숨 숫자 옆에 회색으로 x1, x2... 표시
  if (shields > 0) {
    const livesWidth = ctx.measureText(String(lives)).width;
    ctx.fillStyle = "#b0bec5";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(`x${shields}`, 50 + livesWidth + 8, 35);
  }

  const displayScore = Math.floor(score);
  const scoreText = `점수: ${displayScore}`;
  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText(scoreText, 18, 68);

  const currentSpeedIncrease =
    Math.floor(elapsedSeconds / obstacleSpeedIncreaseInterval) * obstacleSpeedIncrease;
  const currentMultiplier = (obstacleMinSpeed + currentSpeedIncrease) / obstacleMinSpeed;
  if (currentMultiplier > 1) {
    const textWidth = ctx.measureText(scoreText).width;
    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "#ffd34e";
    ctx.fillText(`(x${currentMultiplier.toFixed(1)})`, 24 + textWidth, 68);
  }

  if (gameState === "paused") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("일시정지", canvas.width / 2, canvas.height / 2 - 15);
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#e0e0e0";
    ctx.fillText("ESC 키를 눌러 계속하기", canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = "start";
  }

  if (gameState === "gameover") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "24px sans-serif";
    ctx.fillText(`최종 점수: ${displayScore}`, canvas.width / 2, canvas.height / 2 + 5);
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#ffd34e";
    ctx.fillText(`진행 시간: ${formattedTime}`, canvas.width / 2, canvas.height / 2 + 38);
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("R 키를 눌러 다시 시작", canvas.width / 2, canvas.height / 2 + 75);
    ctx.textAlign = "start";
  }

  requestAnimationFrame(gameLoop);
}

resetGame();
requestAnimationFrame(gameLoop);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (gameState === "playing") {
      gameState = "paused";
      pauseStartTime = Date.now();
      pauseStartPerf = performance.now();
      Object.keys(keys).forEach((key) => {
        keys[key] = false;
      });
      event.preventDefault();
      return;
    }
    if (gameState === "paused") {
      const pauseDuration = Date.now() - pauseStartTime;
      startTime += pauseDuration;
      nextFastObstacleSpawnTime += pauseDuration;
      const pausePerfDuration = performance.now() - pauseStartPerf;
      lastRecoveryItemSpawnTime += pausePerfDuration;
      lastShieldItemSpawnTime += pausePerfDuration;
      lastFrameTime = 0;
      gameState = "playing";
      event.preventDefault();
      return;
    }
  }

  if (gameState === "paused") {
    if (event.key.startsWith("Arrow") || event.key === " ") {
      event.preventDefault();
    }
    return;
  }
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

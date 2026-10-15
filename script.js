const canvas = document.getElementById("game"); // HTML에서 게임 캔버스를 가져옵니다.
const ctx = canvas.getContext("2d"); // 캔버스에 그림을 그릴 도구를 가져옵니다.

// 첫 화면에 보이는 요소들의 위치와 크기입니다.
const roadHeight = 150; // 화면 아래쪽 회색 길의 높이입니다.
const playerSize = 32; // 플레이어 사각형의 가로와 세로 크기입니다.
const playerX = (canvas.width - playerSize) / 2; // 플레이어를 화면 가로 가운데에 둡니다.
const playerY = canvas.height - roadHeight + (roadHeight - playerSize) / 2; // 플레이어를 길의 세로 가운데에 둡니다.
const obstacleRadius = 10; // 빨간 과제 원의 반지름입니다. 지름은 20픽셀입니다.
const obstacles = [ // 움직이지 않는 첫 화면의 과제 10개 중심 좌표입니다.
  { x: 70, y: 90 },
  { x: 210, y: 150 },
  { x: 350, y: 90 },
  { x: 490, y: 150 },
  { x: 630, y: 90 },
  { x: 130, y: 240 },
  { x: 270, y: 300 },
  { x: 410, y: 240 },
  { x: 550, y: 300 },
  { x: 690, y: 240 },
]; // 과제 좌표를 바꾸려면 위 숫자들을 수정합니다.
const lives = 3; // 첫 화면에 표시할 목숨 수입니다.
const timerValue = "0.00"; // 첫 화면의 버틴 시간입니다.

// 하늘을 위쪽의 진한 파랑에서 아래쪽의 밝은 하늘색으로 그라데이션합니다.
const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height - roadHeight);
skyGradient.addColorStop(0, "#3b82c4");
skyGradient.addColorStop(1, "#b9e7f5");
ctx.fillStyle = skyGradient;
ctx.fillRect(0, 0, canvas.width, canvas.height - roadHeight);

// 화면 아래쪽 1/4에 회색 길을 그립니다.
ctx.fillStyle = "gray";
ctx.fillRect(0, canvas.height - roadHeight, canvas.width, roadHeight);

// 위쪽 하늘에 움직이지 않는 빨간 과제 원 10개를 그립니다.
ctx.fillStyle = "red";
obstacles.forEach((obstacle) => {
  ctx.beginPath();
  ctx.arc(obstacle.x, obstacle.y, obstacleRadius, 0, Math.PI * 2);
  ctx.fill();
});

// 길 가운데에 파란색 32×32 플레이어를 그립니다.
ctx.fillStyle = "blue";
ctx.fillRect(playerX, playerY, playerSize, playerSize);

// 왼쪽 위에 빨간 하트와 남은 목숨 수를 표시합니다.
ctx.fillStyle = "red";
ctx.font = "26px sans-serif";
ctx.fillText("♥", 18, 36);
ctx.fillStyle = "white";
ctx.font = "20px sans-serif";
ctx.fillText(String(lives), 50, 35);

// 화면 가운데 위에 버틴 시간을 소수점 둘째 자리까지 표시합니다.
ctx.fillStyle = "white";
ctx.font = "20px sans-serif";
ctx.textAlign = "center";
ctx.fillText(timerValue, canvas.width / 2, 35);
ctx.textAlign = "start";

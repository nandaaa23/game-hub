const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startModal = document.getElementById('startModal');
const startButton = document.getElementById('startButton');
const pitchMeterBar = document.getElementById('pitch-meter-bar');

canvas.width = 400;
canvas.height = 600;

const birdImg = new Image();
birdImg.src = 'bird.png';
const pipeTopImg = new Image();
pipeTopImg.src = 'pipe-top.png';
const pipeBottomImg = new Image();
pipeBottomImg.src = 'pipe-bottom.png';
const backgroundImg = new Image();
backgroundImg.src = 'background.png';

let gameRunning = false;
let score = 0;
const gravity = 0.2;
const flapStrength = -5;
const pipeSpeed = 2.5;
const pipeGap = 150;
const pipeWidth = 80;
const pipeHeight = 400;
const pipeInterval = 100;

const bird = {
  x: 80,
  y: canvas.height / 2,
  width: 34,
  height: 24,
  velocity: 0,
  angle: 0,
};

let pipes = [];
let frameCount = 0;

let audioContext;
let analyser;
let microphone;
const VOLUME_THRESHOLD = 0.10;
const VOLUME_SMOOTHING_FACTOR = 0.05;
let smoothedVolume = 0;

let lastFlapTime = 0;
const FLAP_COOLDOWN = 300;

async function setupAudio() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Your browser does not support the audio API!');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 256;
  } catch (err) {
    console.error('Microphone access error:', err);
    alert('Microphone access denied. Please allow microphone access to play.');
  }
}

function getVolume() {
  if (!analyser) return 0;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const value = (dataArray[i] - 128) / 128;
    sum += value * value;
  }
  return Math.sqrt(sum / dataArray.length);
}

function gameLoop() {
  if (!gameRunning) return;

  bird.velocity += gravity;
  bird.y += bird.velocity;
  bird.angle = Math.min(90, bird.velocity * 5);

  frameCount++;
  if (frameCount % pipeInterval === 0) {
    const pipeY = Math.random() * (canvas.height - pipeGap - 200) + 100;
    pipes.push({ x: canvas.width, y: pipeY, scored: false }); // 
  }
  pipes.forEach(pipe => pipe.x -= pipeSpeed);
  pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

  if (bird.y > canvas.height - bird.height || bird.y < 0) endGame();
  pipes.forEach(pipe => {
    const withinX = bird.x + bird.width > pipe.x && bird.x < pipe.x + pipeWidth;
    const hitsY = bird.y < pipe.y || bird.y + bird.height > pipe.y + pipeGap;
    if (withinX && hitsY) endGame();
  });

  pipes.forEach(pipe => {
    const padding = 5; 

    const birdLeft = bird.x + padding;
    const birdRight = bird.x + bird.width - padding;
    const birdTop = bird.y + padding;
    const birdBottom = bird.y + bird.height - padding;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipeWidth;
    const pipeTopOpening = pipe.y;
    const pipeBottomOpening = pipe.y + pipeGap;

    const withinX = birdRight > pipeLeft && birdLeft < pipeRight;
    const hitsY = birdTop < pipeTopOpening || birdBottom > pipeBottomOpening;

    if (withinX && hitsY) endGame();
});

  const volume = getVolume();
  smoothedVolume = VOLUME_SMOOTHING_FACTOR * volume + (1 - VOLUME_SMOOTHING_FACTOR) * smoothedVolume;
  const now = Date.now();
  if (smoothedVolume > VOLUME_THRESHOLD && now - lastFlapTime > FLAP_COOLDOWN) {
    bird.velocity = flapStrength;
    lastFlapTime = now;
  }

  if (pitchMeterBar) {
    pitchMeterBar.style.width = `${Math.min(100, (smoothedVolume / 0.4) * 100)}%`;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (backgroundImg.complete) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  }

  pipes.forEach(pipe => {
    if (pipeTopImg.complete) ctx.drawImage(pipeTopImg, pipe.x, pipe.y - pipeHeight, pipeWidth, pipeHeight);
    if (pipeBottomImg.complete) ctx.drawImage(pipeBottomImg, pipe.x, pipe.y + pipeGap, pipeWidth, pipeHeight);
  });

  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  ctx.rotate(bird.angle * Math.PI / 180);
  if (birdImg.complete) {
    ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  }
  ctx.restore();

  requestAnimationFrame(gameLoop);
}

function startGame() {
  startModal.style.display = 'none';
  score = 0;
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  frameCount = pipeInterval;
  scoreElement.textContent = score;
  gameRunning = true;
  gameLoop();
}

function endGame() {
  gameRunning = false;
  startModal.querySelector('h2').textContent = `Game Over! Score: ${score}`;
  startModal.querySelector('button').textContent = 'Play Again';
  startModal.style.display = 'flex';
}

startButton.addEventListener('click', async () => {
  if (!audioContext || audioContext.state === 'closed') {
    await setupAudio();
  }
  if (audioContext) {
    startGame();
  }
});

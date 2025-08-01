// --- Basic Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startModal = document.getElementById('startModal');
const startButton = document.getElementById('startButton');
const pitchMeterBar = document.getElementById('pitch-meter-bar');

canvas.width = 400;
canvas.height = 600;

// --- Image Loading ---
const birdImg = new Image();
birdImg.src = 'bird.png';
const pipeTopImg = new Image();
pipeTopImg.src = 'pipe-top.png';
const pipeBottomImg = new Image();
pipeBottomImg.src = 'pipe-bottom.png';
const backgroundImg = new Image();
backgroundImg.src = 'background.png';

// --- Game State & Constants ---
let gameRunning = false;
let score = 0;
const gravity = 0.25;
const flapStrength = -4;
const pipeSpeed = 2.5;
const pipeGap = 150;
const pipeWidth = 52;
const pipeHeight = 320;
const pipeInterval = 90;

// --- Bird ---
const bird = {
    x: 80,
    y: canvas.height / 2,
    width: 34,
    height: 24,
    velocity: 0,
    angle: 0,
};

// --- Pipes ---
let pipes = [];
let frameCount = 0;

// --- Audio Processing ---
let audioContext, analyser, microphone;
const PITCH_THRESHOLD = 350;
let smoothedPitch = 0;
const PITCH_SMOOTHING_FACTOR = 0.2;
let lastFlapTime = 0;
const FLAP_COOLDOWN = 400;

async function setupAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 2048;
    } catch (err) {
        alert('Microphone access denied. Please allow microphone access to play.');
    }
}

function getPitch() {
    if (!analyser) return 0;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataArray);

    let rms = 0;
    for (let i = 0; i < dataArray.length; i++) {
        rms += dataArray[i] * dataArray[i];
    }
    rms = Math.sqrt(rms / dataArray.length);
    if (rms < 0.01) return 0;

    let bestCorrelation = 0;
    let bestOffset = -1;
    for (let offset = 10; offset < dataArray.length; offset++) {
        let correlation = 0;
        for (let i = 0; i < dataArray.length - offset; i++) {
            correlation += dataArray[i] * dataArray[i + offset];
        }
        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestOffset = offset;
        }
    }
    if (bestOffset === -1) return 0;
    return audioContext.sampleRate / bestOffset;
}

// --- Game Loop ---
function gameLoop() {
    if (!gameRunning) return;

    // Physics
    bird.velocity += gravity;
    bird.y += bird.velocity;
    bird.angle = Math.min(90, bird.velocity * 5);

    // Clamp bird inside canvas
    bird.y = Math.max(0, Math.min(canvas.height - bird.height, bird.y));

    // Pipe logic
    frameCount++;
    if (frameCount % pipeInterval === 0) {
        const pipeY = Math.random() * (canvas.height - pipeGap - 200) + 100;
        pipes.push({ x: canvas.width, y: pipeY });
    }
    pipes.forEach(pipe => pipe.x -= pipeSpeed);
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    // --- Remove pipe collision detection ---
    // Game ends ONLY if bird touches top/bottom
    if (bird.y <= 0 || bird.y + bird.height >= canvas.height) {
        endGame();
    }

    // Score update
    pipes.forEach(pipe => {
        if (pipe.x + pipeWidth < bird.x && !pipe.scored) {
            pipe.scored = true;
            score++;
            scoreElement.textContent = score;
        }
    });

    // Pitch logic
    const pitch = getPitch();
    smoothedPitch = PITCH_SMOOTHING_FACTOR * pitch + (1 - PITCH_SMOOTHING_FACTOR) * smoothedPitch;
    const now = Date.now();
    if (smoothedPitch > PITCH_THRESHOLD && now - lastFlapTime > FLAP_COOLDOWN) {
        bird.velocity = flapStrength;
        lastFlapTime = now;
    }

    if (pitchMeterBar) {
        pitchMeterBar.style.width = `${Math.min(100, (smoothedPitch / 800) * 100)}%`;
    }

    // --- Draw ---
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

// --- Game State ---
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
    await setupAudio();
    if (audioContext) {
        startGame();
    }
});

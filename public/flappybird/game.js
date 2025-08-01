// --- Basic Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startModal = document.getElementById('startModal');
const startButton = document.getElementById('startButton');
const pitchMeterBar = document.getElementById('pitch-meter-bar');

canvas.width = 400;
canvas.height = 600;

// --- Image Loading (for a more classic look) ---
const birdImg = new Image();
birdImg.src = 'bird.png'; // Add a 34x24px bird image for best results
const pipeTopImg = new Image();
pipeTopImg.src = 'pipe-top.png'; // A 52x320px image of the top pipe
const pipeBottomImg = new Image();
pipeBottomImg.src = 'pipe-bottom.png'; // A 52x320px image of the bottom pipe
const backgroundImg = new Image();
backgroundImg.src = 'background.png'; // A seamless background image

// --- Game State & Constants ---
let gameRunning = false;
let score = 0;
const gravity = 0.25;
const flapStrength = -4;
const pipeSpeed = 2.5;
const pipeGap = 150;
const pipeWidth = 52;
const pipeHeight = 320;
const pipeInterval = 90; // Frames between pipes

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

// --- Audio Processing (with Smoothing) ---
let audioContext;
let analyser;
let microphone;
const PITCH_THRESHOLD = 500; // Hz - A reasonable threshold for a high note
let smoothedPitch = 0;
const PITCH_SMOOTHING_FACTOR = 0.2; // Lower value = smoother, but less responsive

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

    // Autocorrelation algorithm to find the fundamental frequency (pitch)
    let rms = 0;
    for (let i = 0; i < dataArray.length; i++) {
        rms += dataArray[i] * dataArray[i];
    }
    rms = Math.sqrt(rms / dataArray.length);
    if (rms < 0.01) return 0; // Not enough signal

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

    // --- Update ---
    // Bird physics
    bird.velocity += gravity;
    bird.y += bird.velocity;
    bird.angle = Math.min(90, bird.velocity * 5); // Angle of the bird

    // Pipe management
    frameCount++;
    if (frameCount % pipeInterval === 0) {
        const pipeY = Math.random() * (canvas.height - pipeGap - 200) + 100;
        pipes.push({ x: canvas.width, y: pipeY });
    }
    pipes.forEach(pipe => pipe.x -= pipeSpeed);
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    // Collision detection
    if (bird.y > canvas.height - bird.height || bird.y < 0) endGame();
    pipes.forEach(pipe => {
        if (bird.x + bird.width > pipe.x && bird.x < pipe.x + pipeWidth &&
            (bird.y < pipe.y || bird.y + bird.height > pipe.y + pipeGap)) {
            endGame();
        }
    });
    
    // Score
    pipes.forEach(pipe => {
        if (pipe.x + pipeWidth < bird.x && !pipe.scored) {
            pipe.scored = true;
            score++;
            scoreElement.textContent = score;
        }
    });

    // --- Voice Control with Smoothing ---
    const pitch = getPitch();
    // Use an exponential moving average to smooth the pitch value
    smoothedPitch = PITCH_SMOOTHING_FACTOR * pitch + (1 - PITCH_SMOOTHING_FACTOR) * smoothedPitch;
    
    if (smoothedPitch > PITCH_THRESHOLD) {
        bird.velocity = flapStrength;
    }
    pitchMeterBar.style.width = `${Math.min(100, (smoothedPitch / 800) * 100)}%`;


    // --- Draw ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    if (backgroundImg.complete) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    }
    
    // Draw pipes (obstacles)
    pipes.forEach(pipe => {
        if(pipeTopImg.complete) ctx.drawImage(pipeTopImg, pipe.x, pipe.y - pipeHeight, pipeWidth, pipeHeight);
        if(pipeBottomImg.complete) ctx.drawImage(pipeBottomImg, pipe.x, pipe.y + pipeGap, pipeWidth, pipeHeight);
    });
    
    // Draw and rotate bird
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.angle * Math.PI / 180);
    if (birdImg.complete) {
        ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    }
    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// --- Game State Management ---
function startGame() {
    startModal.style.display = 'none';
    score = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    frameCount = pipeInterval; // Spawn the first pipe immediately
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
// --- Basic Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const videoElement = document.getElementById('videoElement');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startModal = document.getElementById('startModal');
const startButton = document.getElementById('startButton');

// Make canvas fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Asset Loading ---
const backgroundImage = new Image();
backgroundImage.src = 'background.jpg'; // Add your background image

const fruitImages = {
    apple: { whole: new Image(), half1: new Image(), half2: new Image() },
    bomb: { whole: new Image() },
};
fruitImages.apple.whole.src = 'apple.png';
fruitImages.apple.half1.src = 'apple-1.png';
fruitImages.apple.half2.src = 'apple-2.png';
fruitImages.bomb.whole.src = 'bomb.png';

// --- Game State ---
let score = 0;
let lives = 3;
let fruits = [];
let cutPieces = [];
let sliceTrails = { left: [], right: [] };
let gameRunning = false;
let fruitSpawnInterval;

// --- MediaPipe Pose Setup ---
const pose = new window.Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});
pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5 });
pose.onResults(onPoseResults);

const camera = new Camera(videoElement, {
    onFrame: async () => await pose.send({ image: videoElement }),
    width: 1280,
    height: 720,
});
camera.start();

// --- Game Object Classes ---
class Fruit {
    constructor() {
        this.type = Math.random() < 0.2 ? 'bomb' : 'apple';
        this.imageSet = fruitImages[this.type];
        this.radius = this.type === 'bomb' ? 35 : 45;
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + this.radius;
        this.velocity = { x: Math.random() * 4 - 2, y: -(Math.random() * 5 + 10) };
        this.gravity = 0.15;
    }
    update() {
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
    draw() {
        if (this.imageSet.whole.complete) {
            ctx.drawImage(this.imageSet.whole, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        }
    }
}

class CutPiece {
    constructor(x, y, image) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.radius = 30;
        this.velocity = { x: Math.random() * 6 - 3, y: Math.random() * -6 };
        this.gravity = 0.2;
        this.alpha = 1;
    }
    update() {
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
    draw() {
        if (this.image.complete) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.drawImage(this.image, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            ctx.restore();
        }
    }
}

// --- Main Loop and Game Logic ---
function onPoseResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.scale(-1, 1); // Flip horizontally for a mirror effect
    ctx.globalAlpha = 0.7; // Make it slightly transparent
    ctx.drawImage(results.image, -canvas.width + 20, 20, 200, 150);
    ctx.restore();

    if (gameRunning) {
        [...fruits, ...cutPieces].forEach(obj => {
            obj.update();
            obj.draw();
        });
        cutPieces = cutPieces.filter(p => p.alpha > 0);
    }

    if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: 'white', lineWidth: 4 });
        drawLandmarks(ctx, results.poseLandmarks, { color: 'cyan', lineWidth: 2 });

        if (gameRunning) {
            const now = Date.now();
            const hands = {
                left: results.poseLandmarks[19], // Left index
                right: results.poseLandmarks[20] // Right index
            };

            for (const side in hands) {
                const landmark = hands[side];
                if (landmark && landmark.visibility > 0.4) {
                    const trail = sliceTrails[side];
                    trail.push({ x: landmark.x * canvas.width, y: landmark.y * canvas.height, time: now });
                    checkSlice(trail);
                    sliceTrails[side] = trail.filter(p => now - p.time < 300);
                }
            }
        }
    }

    for (const side in sliceTrails) {
        const trail = sliceTrails[side];
        if (trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);
            trail.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 5;
            ctx.stroke();
        }
    }
    
    // Request the next frame
    requestAnimationFrame(() => {});
}

function checkSlice(trail) {
    if (trail.length < 2) return;
    const startPoint = trail[trail.length - 2];
    const endPoint = trail[trail.length - 1];

    for (let i = fruits.length - 1; i >= 0; i--) {
        const fruit = fruits[i];
        if (intersects(startPoint, endPoint, fruit)) {
            if (fruit.type === 'bomb') {
                endGame();
                return;
            }
            cutPieces.push(new CutPiece(fruit.x, fruit.y, fruit.imageSet.half1));
            cutPieces.push(new CutPiece(fruit.x, fruit.y, fruit.imageSet.half2));
            fruits.splice(i, 1);
            score += 10;
            scoreElement.textContent = `Score: ${score}`;
        }
    }
}

function intersects(start, end, circle) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);
    const dot = (((circle.x - start.x) * dx) + ((circle.y - start.y) * dy)) / Math.pow(len, 2);
    const closestX = start.x + (dot * dx);
    const closestY = start.y + (dot * dy);
    if (!isWithinSegment(closestX, closestY, start, end)) return false;
    return Math.hypot(closestX - circle.x, closestY - circle.y) < circle.radius;
}

function isWithinSegment(px, py, start, end) {
    const d1 = Math.hypot(px - start.x, py - start.y);
    const d2 = Math.hypot(px - end.x, py - end.y);
    const lineLen = Math.hypot(start.x - end.x, start.y - end.y);
    return Math.abs(d1 + d2 - lineLen) < 1;
}

// --- Game State Management ---
function startGame() {
    startModal.style.display = 'none';
    score = 0;
    lives = 3;
    fruits = [];
    cutPieces = [];
    scoreElement.textContent = `Score: 0`;
    livesElement.textContent = `Lives: 3`;
    gameRunning = true;
    fruitSpawnInterval = setInterval(() => fruits.push(new Fruit()), 1000);
}

function endGame() {
    gameRunning = false;
    clearInterval(fruitSpawnInterval);
    alert(`Game Over! Your score: ${score}`);
    startModal.style.display = 'flex';
}

startButton.addEventListener('click', startGame);
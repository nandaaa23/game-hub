// --- Canvas and Toolbar Setup ---
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const videoElement = document.getElementById('videoElement');
const colorPicker = document.getElementById('colorPicker');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const clearButton = document.getElementById('clearButton');

// --- Drawing State ---
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// --- MediaPipe Pose Setup ---
const pose = new window.Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});
pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
});
pose.onResults(onPoseResults);

// --- Camera Setup ---
const camera = new Camera(videoElement, {
    onFrame: async () => await pose.send({ image: videoElement }),
    width: 1280,
    height: 720,
});
camera.start();

// --- Main Drawing Loop (Called by MediaPipe) ---
function onPoseResults(results) {
    ctx.save();
    ctx.globalAlpha = 0.7; // Make it slightly transparent
    ctx.scale(-1, 1); // Flip horizontally for a mirror effect
    const webcamWidth = 200;
    const webcamHeight = 150;
    const margin = 20;
    // Draw the flipped image, adjusting the x-coordinate to keep it in the corner
    ctx.drawImage(results.image, -canvas.width + margin, margin, webcamWidth, webcamHeight);
    ctx.restore();

    if (!results.poseLandmarks) {
        isDrawing = false;
        return;
    }

    const landmarks = results.poseLandmarks;
    const pointer = landmarks[0];


    if (!pointer || pointer.visibility < 0.5) {
        isDrawing = false;
        return;
    }

    const currentX = canvas.width - (pointer.x * canvas.width);
    const currentY = pointer.y * canvas.height;

    if (!isDrawing) {
        isDrawing = true;
        [lastX, lastY] = [currentX, currentY];
    }
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    [lastX, lastY] = [currentX, currentY];
    
    ctx.fillStyle = colorPicker.value;
    ctx.beginPath();
    ctx.arc(currentX, currentY, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
}

// --- Toolbar Event Listeners ---
colorPicker.addEventListener('change', (e) => ctx.strokeStyle = e.target.value);
brushSizeSlider.addEventListener('input', (e) => {
    ctx.lineWidth = e.target.value;
    brushSizeValue.textContent = e.target.value;
});
clearButton.addEventListener('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

// --- Initial Setup ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.querySelector('.toolbar').offsetHeight;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSizeSlider.value;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
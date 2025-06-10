// --- GAME STATE ---
let score = 0;
let autoClicker = 0;
let clickMultiplier = 1;
let raveActive = false;

let nextRaveIn = 30;      // seconds until next rave
let raveTimeRemaining = 0; // counts down from 5 when rave starts

// --- ELEMENTS ---
const scoreDisplay       = document.getElementById('score');
const clickerButton      = document.getElementById('clicker-button');
const resetButton        = document.getElementById('reset-button');
const waltuhImage        = document.getElementById('waltuh-image');
const waltuhAudio        = document.getElementById('waltuh-audio');
const raveEffect         = document.getElementById('rave-effect');
const rainbowLights      = document.getElementById('rainbow-lights');
const raveTimeDisplay    = document.getElementById('rave-time');
const nextRaveTimeDisplay= document.getElementById('next-rave-time');

// --- SCORE LOGIC ---
function updateScore() {
  scoreDisplay.textContent = 'pervitins: ' + score;
}

clickerButton.addEventListener('click', () => {
  score += clickMultiplier;
  if (raveActive) score += clickMultiplier; // double during rave
  updateScore();
});

resetButton.addEventListener('click', () => {
  score = autoClicker = 0;
  clickMultiplier = 1;
  updateScore();
});

// Example shop item
document.getElementById('item1').addEventListener('click', () => {
  if (score >= 50) {
    score -= 50;
    autoClicker++;
    updateScore();
    waltuhImage.style.display = 'block';
    waltuhAudio.play();
  }
});

// --- RAVE LOGIC ---

// Count down to next rave every second
const nextRaveInterval = setInterval(() => {
  if (!raveActive) {
    nextRaveTimeDisplay.textContent = nextRaveIn;
    nextRaveIn--;
    if (nextRaveIn < 0) startRave();
  }
}, 1000);

// Trigger a rave
function startRave() {
  raveActive = true;
  raveTimeRemaining = 5; // 5-second rave
  raveEffect.style.display = 'flex';
  rainbowLights.style.display = 'block';

  // Reset next rave counter
  nextRaveIn = 30;

  // Rave countdown
  const raveInterval = setInterval(() => {
    raveTimeDisplay.textContent = raveTimeRemaining;
    raveTimeRemaining--;
    if (raveTimeRemaining < 0) {
      clearInterval(raveInterval);
      endRave();
    }
  }, 1000);
}

// Clean up after rave
function endRave() {
  raveActive = false;
  raveEffect.style.display = 'none';
  rainbowLights.style.display = 'none';
  raveTimeDisplay.textContent = '0';
}

updateScore();

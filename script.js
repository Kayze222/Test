// Initialize score and items
let score = 0;
let autoClicker = 0;
let clickMultiplier = 1;
let raveActive = false;
let nextRaveIn = 30;
let raveTimeRemaining = 5;

// Get elements
const scoreDisplay = document.getElementById('score');
const clickerButton = document.getElementById('clicker-button');
const resetButton = document.getElementById('reset-button');
const shopItems = {
  item1: document.getElementById('item1'),
  item2: document.getElementById('item2'),
  item3: document.getElementById('item3'),
  item4: document.getElementById('item4'),
  item5: document.getElementById('item5')
};

// Rave effect elements
const raveEffect = document.getElementById('rave-effect');
const rainbowLights = document.getElementById('rainbow-lights');
const raveTimer = document.getElementById('rave-timer');
const raveTimeDisplay = document.getElementById('rave-time');
const nextRaveTimeDisplay = document.getElementById('next-rave-time');

// Update score display
function updateScore() {
  scoreDisplay.textContent = 'pervitins: ' + score;
}

// Increase score on click (with multiplier)
clickerButton.addEventListener('click', function() {
  score += clickMultiplier;
  if (raveActive) {
    score += clickMultiplier; // Double profits during rave
  }
  updateScore();
});

// Reset score
resetButton.addEventListener('click', function() {
  score = 0;
  autoClicker = 0;
  clickMultiplier = 1;
  updateScore();
});

// Shop item functionality
shopItems.item1.addEventListener('click', function() {
  if (score >= 50) {
    score -= 50;
    autoClicker++;
    updateScore();

    // Show Waltuh image and play sound when "hire waltuh" is clicked
    waltuhImage.style.display = 'block';
    waltuhAudio.play();
  }
});

// Rave function (trigger every 30 seconds)
setInterval(function() {
  if (!raveActive && nextRaveIn <= 0) {
    raveActive = true;
    raveEffect.style.display = 'flex';
    rainbowLights.style.display = 'block';

    // Rave countdown
    let raveCountdown = setInterval(function() {
      raveTimeDisplay.textContent = raveTimeRemaining;
      raveTimeRemaining--;
      if (raveTimeRemaining < 0) {
        clearInterval(raveCountdown);
        raveEffect.style.display = 'none';
        rainbowLights.style.display = 'none';
        raveActive = false;
        raveTimeRemaining = 5; // Reset rave time
        nextRaveIn = 30; // Reset the countdown for next rave
      }
    }, 1000);

  }
  // Update next rave timer
  nextRaveTimeDisplay.textContent = nextRaveIn;
  nextRaveIn--;

}, 1000); // Update timer every second

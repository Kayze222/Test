// Initialize score and items
let score = 0;
let autoClicker = 0;
let clickMultiplier = 1;
let raveActive = false;

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

// Waltuh image and audio
const waltuhImage = document.getElementById('waltuh-image');
const waltuhAudio = document.getElementById('waltuh-audio');

// Rave effect
const raveEffect = document.getElementById('rave-effect');
const rainbowLights = document.getElementById('rainbow-lights');

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
  if (!raveActive) {
    raveActive = true;
    raveEffect.style.display = 'flex';
    setTimeout(function() {
      raveEffect.style.display = 'none';
      raveActive = false;
    }, 10000); // Last for 10 seconds
  }
}, 30000); // Every 30 seconds

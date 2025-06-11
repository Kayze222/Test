import confetti from 'canvas-confetti';

// --- STATE ---
let score = 0;
let perSecond = 0;

const upgrades = [
    { name: 'vero slaves', baseCost: 15, pps: 0.1, count: 0, icon: 'minimoose.png' },
    { name: 'game advertisement', baseCost: 100, pps: 1, count: 0, icon: 'rubber_pig.png' },
    { name: 'shady connection', baseCost: 1100, pps: 8, count: 0, icon: 'voot_cruiser.png' },
    { name: 'scout', baseCost: 12000, pps: 47, count: 0, icon: 'irken_armada.png' },
    { name: 'music label', baseCost: 130000, pps: 260, count: 0, icon: 'the_tallest.png' },
    { name: 'waltuh white', baseCost: 1400000, pps: 1400, count: 0, icon: 'megadoomer.png' },
    { name: 'presidential backing', baseCost: 15000000, pps: 7800, count: 0, icon: 'white_house.png' },
    { name: 'adam sandlers approval', baseCost: 200000000, pps: 44000, count: 0, icon: 'adam_sandler.png' },
    { name: 'poland', baseCost: 3300000000, pps: 260000, count: 0, icon: 'poland.png' },
    { name: 'moon mission', baseCost: 51000000000, pps: 1600000, count: 0, icon: 'the_moon.png' },
    { name: 'nukes luscious ass', baseCost: 750000000000, pps: 10000000, count: 0, icon: 'nuke.png' }
];

// --- DOM ELEMENTS ---
const scoreDisplay = document.getElementById('score');
const ppsDisplay = document.getElementById('pps');
const clickerImage = document.getElementById('clicker-image');
const upgradesGrid = document.getElementById('upgrades-grid');
const resetButton = document.getElementById('reset-button');
const saveButton = document.getElementById('save-button');
const loadButton = document.getElementById('load-button');
const slotMachineContainer = document.getElementById('slot-machine-container');
const slotMachine2Container = document.getElementById('slot-machine-2-container');
const startButton = document.getElementById('start-button');
const loadingScreen = document.getElementById('loading-screen');
const gameContainer = document.getElementById('game-container');


// --- AUDIO ---
let audioContext;
const audioBuffers = {};

function initAudio() {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

async function loadSound(name, url) {
    if (!audioContext) return;
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers[name] = audioBuffer;
    } catch (error) {
        console.error(`Failed to load sound: ${name}`, error);
    }
}

function playSound(name) {
    if (!audioContext || !audioBuffers[name]) return;
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers[name];
    source.connect(audioContext.destination);
    source.start(0);
}

// --- GAME LOGIC ---
function formatNumber(num) {
    if (num < 1e6) return num.toLocaleString('en', {maximumFractionDigits: 0});
    if (num < 1e9) return (num / 1e6).toFixed(2) + 'M';
    if (num < 1e12) return (num / 1e9).toFixed(2) + 'B';
    if (num < 1e15) return (num / 1e12).toFixed(2) + 'T';
    return num.toExponential(2);
}

function calculateCost(upgrade) {
    return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count));
}

function buyUpgrade(index) {
    const upgrade = upgrades[index];
    const cost = calculateCost(upgrade);
    if (score >= cost) {
        score -= cost;
        upgrade.count++;
        recalculatePPS();
        updateUI();
        playSound('buy');
    }
}

function recalculatePPS() {
    perSecond = upgrades.reduce((total, u) => total + u.count * u.pps, 0);
}

function clickAction() {
    score++;
    updateUI();
    playSound('click');
    
    // Add a little visual effect on click
    const clicker = document.getElementById('zim-clicker');
    const plusOne = document.createElement('div');
    plusOne.textContent = '+1';
    plusOne.style.position = 'absolute';
    plusOne.style.left = `${Math.random() * 50 + 25}%`;
    plusOne.style.top = `${Math.random() * 20 + 40}%`;
    plusOne.style.fontSize = '1.5em';
    plusOne.style.fontWeight = 'bold';
    plusOne.style.color = '#ff00ff';
    plusOne.style.pointerEvents = 'none';
    plusOne.style.textShadow = '1px 1px #00ffff';
    plusOne.style.transition = 'opacity 0.5s, transform 0.5s';
    clicker.appendChild(plusOne);

    setTimeout(() => {
        plusOne.style.opacity = '0';
        plusOne.style.transform = 'translateY(-50px)';
        setTimeout(() => plusOne.remove(), 500);
    }, 100);
}

function gameLoop() {
    score += perSecond / 10; // Update 10 times per second for smoother display
    updateUI();
}

function updateUI() {
    scoreDisplay.textContent = formatNumber(Math.floor(score));
    ppsDisplay.textContent = formatNumber(perSecond.toFixed(1));
    updateUpgradesUI();
    updateSlotsUI();
}

function updateUpgradesUI() {
    upgrades.forEach((upgrade, index) => {
        const cost = calculateCost(upgrade);
        const el = document.getElementById(`upgrade-${index}`);
        if (el) {
            el.querySelector('.cost').textContent = formatNumber(cost);
            el.querySelector('.count').textContent = upgrade.count;
            if (score < cost) {
                el.classList.add('disabled');
            } else {
                el.classList.remove('disabled');
            }
        }
    });
}

function updateSlotsUI() {
    const spinBtn = document.getElementById('slot-btn');
    if (spinBtn) spinBtn.disabled = score < 100;

    const superSpinBtn = document.getElementById('super-slot-btn');
    if (superSpinBtn) superSpinBtn.disabled = score < 10000;
}

// --- SHOP/UPGRADES ---
function generateShop() {
    upgradesGrid.innerHTML = '';
    upgrades.forEach((upgrade, index) => {
        const cost = calculateCost(upgrade);
        const upgradeEl = document.createElement('div');
        upgradeEl.className = 'upgrade';
        upgradeEl.id = `upgrade-${index}`;
        upgradeEl.innerHTML = `
            <img src="${upgrade.icon}" alt="${upgrade.name}">
            <h4>${upgrade.name}</h4>
            <p>Cost: <span class="cost">${formatNumber(cost)}</span></p>
            <p>Owned: <span class="count">${upgrade.count}</span></p>
        `;
        upgradeEl.addEventListener('click', () => buyUpgrade(index));
        upgradesGrid.appendChild(upgradeEl);
    });
}

// --- SLOT MACHINES ---
function generateSlotMachine(container, idPrefix, title, cost, spinFn, icons) {
    container.innerHTML = `
        <div class="slot-machine">
            <h3>${title}</h3>
            <div class="slots-display">
                <img src="${icons[0]}" id="${idPrefix}1" class="slot-img">
                <img src="${icons[1]}" id="${idPrefix}2" class="slot-img">
                <img src="${icons[2]}" id="${idPrefix}3" class="slot-img">
            </div>
            <button id="${idPrefix}-btn">Spin (${formatNumber(cost)})</button>
            <p class="slots-result" id="${idPrefix}-result"></p>
        </div>
    `;
    document.getElementById(`${idPrefix}-btn`).addEventListener('click', spinFn);
}

const slotIcons = ['gir.png', 'minimoose.png', 'rubber_pig.png', 'zim_head.png'];
const superSlotIcons = ['the_tallest.png', 'voot_cruiser.png', 'irken_armada.png', 'nuke.png'];

async function spinSlots(cost, idPrefix, icons, resultEl, winMultipliers) {
    if (score < cost) {
        playSound('fail');
        return;
    }
    score -= cost;
    playSound('slots_spin');

    const btn = document.getElementById(`${idPrefix}-btn`);
    btn.disabled = true;

    const slots = [
        document.getElementById(`${idPrefix}1`),
        document.getElementById(`${idPrefix}2`),
        document.getElementById(`${idPrefix}3`),
    ];
    
    const spinInterval = setInterval(() => {
        slots.forEach(s => s.src = icons[Math.floor(Math.random() * icons.length)]);
    }, 100);

    setTimeout(() => {
        clearInterval(spinInterval);
        const results = [
            icons[Math.floor(Math.random() * icons.length)],
            icons[Math.floor(Math.random() * icons.length)],
            icons[Math.floor(Math.random() * icons.length)],
        ];
        slots.forEach((s, i) => s.src = results[i]);

        let winAmount = 0;
        if (results[0] === results[1] && results[1] === results[2]) {
            winAmount = cost * winMultipliers.triple;
            resultEl.textContent = `TRIPLE WIN! +${formatNumber(winAmount)}!`;
            playSound('slots_win');
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }});
        } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
            winAmount = cost * winMultipliers.double;
            resultEl.textContent = `DOUBLE! +${formatNumber(winAmount)}.`;
            playSound('success');
        } else {
            resultEl.textContent = "DEFEAT! Nothing for you!";
            playSound('fail');
        }
        score += winAmount;
        updateUI();
    }, 2000);
}

// --- SAVE/LOAD ---
function saveGame() {
    const gameState = {
        score,
        upgrades: upgrades.map(u => ({ count: u.count }))
    };
    localStorage.setItem('zimClickerSave', JSON.stringify(gameState));
    saveButton.textContent = 'Saved!';
    setTimeout(() => { saveButton.textContent = 'Save Progress'; }, 1500);
}

function loadGame() {
    const savedState = localStorage.getItem('zimClickerSave');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        score = gameState.score;
        gameState.upgrades.forEach((savedUpgrade, index) => {
            if (upgrades[index]) {
                upgrades[index].count = savedUpgrade.count;
            }
        });
        return true;
    }
    return false;
}

function resetGame() {
    if (confirm("Are you sure you want to erase all your glorious progress for the Irken Empire?")) {
        localStorage.removeItem('zimClickerSave');
        score = 0;
        perSecond = 0;
        upgrades.forEach(u => u.count = 0);
        recalculatePPS();
        updateUI();
    }
}

// --- INITIALIZATION ---
function init() {
    loadGame();
    recalculatePPS();
    generateShop();
    generateSlotMachine(slotMachineContainer, 'slot', "GIR's Slots", 100, 
        () => spinSlots(100, 'slot', slotIcons, document.getElementById('slot-result'), {triple: 20, double: 3}), 
        slotIcons);
    generateSlotMachine(slotMachine2Container, 'super-slot', "SUPER SLOTS OF DOOM!", 10000, 
        () => spinSlots(10000, 'super-slot', superSlotIcons, document.getElementById('super-slot-result'), {triple: 50, double: 5}), 
        superSlotIcons);

    clickerImage.addEventListener('click', clickAction);
    resetButton.addEventListener('click', resetGame);
    saveButton.addEventListener('click', saveGame);
    loadButton.addEventListener('click', () => {
        if (loadGame()) {
            recalculatePPS();
            updateUI();
            loadButton.textContent = 'Loaded!';
        } else {
            loadButton.textContent = 'No Save Found';
        }
        setTimeout(() => { loadButton.textContent = 'Load Progress'; }, 1500);
    });
    
    setInterval(gameLoop, 100);
    setInterval(saveGame, 30000);

    updateUI();
}

startButton.addEventListener('click', () => {
    loadingScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    initAudio();
    loadSound('click', 'click.mp3');
    loadSound('buy', 'buy.mp3');
    loadSound('fail', 'fail.mp3');
    loadSound('slots_spin', 'slots_spin.mp3');
    loadSound('slots_win', 'slots_win.mp3');
    loadSound('success', 'success.mp3');
}, { once: true });


document.addEventListener('DOMContentLoaded', init);
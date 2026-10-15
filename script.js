// Keep the celebration effect self-contained: the previous Skypack import could
// return HTTP 500 and prevent the entire clicker module from initializing.
function confetti({ particleCount = 150, spread = 90, origin = { y: 0.6 } } = {}) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    context.scale(pixelRatio, pixelRatio);
    document.body.appendChild(canvas);

    const colors = ['#ff00ff', '#00ffff', '#ffee00', '#ffffff', '#ff3377'];
    const centerX = width * (origin.x ?? 0.5);
    const centerY = height * (origin.y ?? 0.6);
    const particles = Array.from({ length: Math.min(particleCount, 250) }, () => {
        const angle = (-90 + (Math.random() - 0.5) * spread) * Math.PI / 180;
        const speed = 4 + Math.random() * 8;
        return {
            x: centerX, y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            size: 3 + Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    });

    let lastTime;
    let elapsed = 0;
    function animate(time) {
        const delta = lastTime === undefined ? 1 : Math.min((time - lastTime) / 16.67, 3);
        lastTime = time;
        elapsed += delta * 16.67;
        context.clearRect(0, 0, width, height);
        for (const particle of particles) {
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;
            particle.vx *= Math.pow(0.985, delta);
            particle.vy += 0.18 * delta;
            particle.rotation += particle.rotationSpeed * delta;
            context.save();
            context.translate(particle.x, particle.y);
            context.rotate(particle.rotation);
            context.fillStyle = particle.color;
            context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.65);
            context.restore();
        }
        if (elapsed < 3200) {
            requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    }
    requestAnimationFrame(animate);
}

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
    if (spinBtn) spinBtn.disabled = score < 100 || activeSlotSpins.has('slot');

    const superSpinBtn = document.getElementById('super-slot-btn');
    if (superSpinBtn) superSpinBtn.disabled = score < 10000 || activeSlotSpins.has('super-slot');
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

// Optimised animated WebP made from the supplied Foxy jumpscare GIF.
// Bundled with the game - no separate image hosting or CDN required.
const FOXY_JUMPSCARE_WEBP = 'data:image/webp;base64,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';
const activeSlotSpins = new Set();

function showFoxyJumpscare() {
    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;z-index:2147483647;background:#29291c;overflow:hidden;';
    const img = document.createElement('img');
    img.alt = '';
    img.src = FOXY_JUMPSCARE_WEBP;
    img.style.cssText = 'display:block;width:100%;height:100%;object-fit:fill;image-rendering:pixelated;';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 1050);
}

const slotIcons = ['gir.png', 'minimoose.png', 'rubber_pig.png', 'zim_head.png'];
const superSlotIcons = ['the_tallest.png', 'voot_cruiser.png', 'irken_armada.png', 'nuke.png'];

async function spinSlots(cost, idPrefix, icons, resultEl, winMultipliers) {
    if (activeSlotSpins.has(idPrefix)) return;
    if (score < cost) {
        playSound('fail');
        return;
    }
    activeSlotSpins.add(idPrefix);
    // Independent 0.1% chance on every paid spin of either slot machine.
    const jumpscareThisSpin = Math.random() < 0.001;
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
        activeSlotSpins.delete(idPrefix);
        updateUI();
        if (jumpscareThisSpin) showFoxyJumpscare();
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
        score = gameState.score || 0;

        if (Array.isArray(gameState.upgrades)) {
            gameState.upgrades.forEach((savedUpgrade, index) => {
                if (upgrades[index]) {
                    upgrades[index].count = savedUpgrade.count;
                }
            });
        }

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
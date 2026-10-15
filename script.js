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
let casinoEpoch = 0;
const casinoStats = { gambled: 0, bestWin: 0, bonks: 0 };

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
    updateCasinoUI();
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

// Optimised animated WebP made from the supplied Foxy jumpscare GIF.
// Bundled with the game - no separate image hosting or CDN required.
const FOXY_JUMPSCARE_WEBP = 'data:image/webp;base64,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';

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
    if (score < cost) {
        playSound('fail');
        return;
    }
    // Independent 0.1% chance on every paid spin of either slot machine.
    const jumpscareThisSpin = Math.random() < 0.001;
    score -= cost;
    updateUI(); // Keep affordability accurate while allowing overlapping spins.
    playSound('slots_spin');

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
        if (jumpscareThisSpin) showFoxyJumpscare();
    }, 2000);
}

// --- BAD DECISIONS INC. ---
// All stakes and winnings use the same fictional pervitin balance as the slots.
const coinHistory = [];
const wheelPrizes = [0, 0, 0.5, 0.5, 1, 1, 2, 8];
let wheelBusy = false;
let wheelRotation = 0;
let wheelTimeout = null;
let crashRound = null;
let crashFrame = null;
let bonkRound = null;
let bonkTimer = null;
let bonkCooldownUntil = 0;

function casinoMessage(id, message, outcome) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('casino-win', outcome === 'win');
    el.classList.toggle('casino-lose', outcome === 'lose');
}

function casinoStake(inputId, resultId) {
    const input = document.getElementById(inputId);
    const wager = Number(input.value);
    if (!Number.isSafeInteger(wager) || wager < 1) {
        casinoMessage(resultId, 'please enter an actual number, you creature', 'lose');
        playSound('fail');
        return null;
    }
    if (wager > score) {
        casinoMessage(resultId, 'insufficient financial irresponsibility', 'lose');
        playSound('fail');
        return null;
    }
    score -= wager;
    casinoStats.gambled += wager;
    // The original slots keep their own 0.1% jumpscare roll. New paid games
    // get the same independent 1 in 1000 chance per wager.
    if (Math.random() < 0.001) {
        setTimeout(showFoxyJumpscare, 550);
    }
    updateUI();
    return wager;
}

function casinoPayout(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const prize = Math.floor(amount);
    score += prize;
    casinoStats.bestWin = Math.max(casinoStats.bestWin, prize);
    if (prize > 0) playSound('success');
    if (prize >= 5000) {
        confetti({particleCount: 95, spread: 80, origin: {y: 0.7}});
    }
    updateUI();
}

function flipDivorceCoin(choice) {
    const bet = casinoStake('coin-bet', 'coin-result');
    if (bet === null) return;
    const wonSide = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = choice === wonSide;
    const epoch = casinoEpoch;
    const coin = document.getElementById('coin-disc');
    coin.textContent = '?';
    coin.classList.add('flipping');
    playSound('click');
    setTimeout(() => {
        if (epoch !== casinoEpoch) return;
        coin.classList.remove('flipping');
        coin.textContent = wonSide === 'heads' ? 'h' : 't';
        if (won) {
            const prize = Math.floor(bet * 1.9);
            casinoPayout(prize);
            casinoMessage('coin-result', 'correct. +' + formatNumber(prize) + '. genius behaviour', 'win');
        } else {
            playSound('fail');
            casinoMessage('coin-result', 'wrong. -' + formatNumber(bet) + '. the coin hates you', 'lose');
        }
        coinHistory.unshift(wonSide === 'heads' ? 'h' : 't');
        if (coinHistory.length > 10) coinHistory.pop();
        const history = document.getElementById('coin-history');
        history.replaceChildren();
        for (const side of coinHistory) {
            const marker = document.createElement('span');
            marker.textContent = side;
            history.appendChild(marker);
        }
    }, 280);
}

function spinQuestionableWheel() {
    if (wheelBusy) return;
    const bet = casinoStake('wheel-bet', 'wheel-result');
    if (bet === null) return;
    wheelBusy = true;
    const epoch = casinoEpoch;
    const index = Math.floor(Math.random() * wheelPrizes.length);
    const multiplier = wheelPrizes[index];
    const wheel = document.getElementById('wheel-disc');
    const segmentSize = 360 / wheelPrizes.length;
    const current = ((wheelRotation % 360) + 360) % 360;
    const target = (360 - (index + 0.5) * segmentSize + 360) % 360;
    wheelRotation += 1440 + ((target - current + 360) % 360);
    wheel.style.transform = 'rotate(' + wheelRotation + 'deg)';
    document.getElementById('wheel-label').textContent = '?';
    casinoMessage('wheel-result', 'the wheel is consulting its lawyer');
    playSound('slots_spin');
    updateCasinoUI();
    wheelTimeout = setTimeout(() => {
        wheelTimeout = null;
        if (casinoEpoch !== epoch) return;
        wheelBusy = false;
        document.getElementById('wheel-label').textContent = multiplier + 'x';
        const prize = Math.floor(bet * multiplier);
        if (prize > 0) {
            casinoPayout(prize);
            casinoMessage('wheel-result', multiplier + 'x. +' + formatNumber(prize) + ' pervitins. suspicious', 'win');
        } else {
            playSound('fail');
            casinoMessage('wheel-result', '0x. the wheel has seized your assets', 'lose');
        }
        updateCasinoUI();
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 1450);
}

function crashMultiplier(elapsedMs) {
    const s = elapsedMs / 1000;
    return 1 + 0.35 * s + 0.055 * s * s;
}

function crashPaint(multiplier, busted) {
    const readout = document.getElementById('crash-number');
    readout.textContent = multiplier.toFixed(2) + 'x';
    readout.classList.toggle('busted', Boolean(busted));
    document.getElementById('crash-meter-fill').style.width =
        Math.min(100, (multiplier - 1) / 9 * 100) + '%';
}

function crashEnd(payout, message, busted) {
    if (!crashRound) return;
    crashRound = null;
    if (crashFrame !== null) cancelAnimationFrame(crashFrame);
    crashFrame = null;
    if (payout > 0) casinoPayout(payout);
    else playSound('fail');
    casinoMessage('crash-result', message, payout > 0 ? 'win' : 'lose');
    document.getElementById('crash-number').classList.toggle('busted', Boolean(busted));
    updateCasinoUI();
}

function crashTick() {
    if (!crashRound) return;
    const value = crashMultiplier(Date.now() - crashRound.started);
    if (value >= crashRound.bustAt) {
        crashPaint(crashRound.bustAt, true);
        crashEnd(0, 'crashed at ' + crashRound.bustAt.toFixed(2) + 'x. idiot tax collected', true);
        return;
    }
    crashPaint(value, false);
    crashFrame = requestAnimationFrame(crashTick);
}

function startCrash() {
    if (crashRound) return;
    const bet = casinoStake('crash-bet', 'crash-result');
    if (bet === null) return;
    crashRound = {
        bet: bet,
        started: Date.now(),
        // Mostly low multipliers with occasional moonshots, capped at 30x.
        bustAt: Math.max(1.01, Math.min(30, 0.95 / (1 - Math.random())))
    };
    crashPaint(1, false);
    casinoMessage('crash-result', 'cash out. no pressure. absolutely no pressure');
    playSound('slots_spin');
    updateCasinoUI();
    crashFrame = requestAnimationFrame(crashTick);
}

function cashOutCrash() {
    if (!crashRound) return;
    // Calculate from the clock, not the last frame, so background tabs cannot
    // cash out a run which actually crashed while rendering was suspended.
    const current = crashMultiplier(Date.now() - crashRound.started);
    if (current >= crashRound.bustAt) {
        crashPaint(crashRound.bustAt, true);
        crashEnd(0, 'crashed at ' + crashRound.bustAt.toFixed(2) + 'x. too slow', true);
        return;
    }
    const prize = Math.floor(crashRound.bet * current);
    crashPaint(current, false);
    crashEnd(prize, 'escaped at ' + current.toFixed(2) + 'x. +' + formatNumber(prize), false);
}

function renderBonkGrid() {
    const grid = document.getElementById('bonk-grid');
    if (!grid || !grid.children.length) return;
    for (let i = 0; i < grid.children.length; i++) {
        const btn = grid.children[i];
        const isTarget = bonkRound && bonkRound.target === i;
        btn.replaceChildren();
        btn.classList.toggle('has-pig', Boolean(isTarget));
        if (isTarget) {
            const img = document.createElement('img');
            img.src = 'rubber_pig.png';
            img.alt = '';
            btn.appendChild(img);
            btn.setAttribute('aria-label', 'bonk the pig, hole ' + (i + 1));
        } else {
            btn.setAttribute('aria-label', 'empty hole ' + (i + 1));
        }
    }
}

function endBonk() {
    if (!bonkRound) return;
    const hits = bonkRound.hits;
    bonkRound = null;
    clearInterval(bonkTimer);
    bonkTimer = null;
    bonkCooldownUntil = Date.now() + 20000;
    renderBonkGrid();
    casinoMessage('bonk-result', hits + ' bonks. your government is very upset', hits > 0 ? 'win' : 'lose');
    updateCasinoUI();
}

function bonkPig(index) {
    if (!bonkRound || bonkRound.target !== index) return;
    if (Date.now() >= bonkRound.ends) {
        endBonk();
        return;
    }
    bonkRound.hits++;
    casinoStats.bonks++;
    const reward = 10 + Math.min(30, bonkRound.hits * 2);
    score += reward;
    playSound('click');
    document.getElementById('bonk-count').textContent = String(bonkRound.hits);
    const old = bonkRound.target;
    bonkRound.target = (old + 1 + Math.floor(Math.random() * 8)) % 9;
    renderBonkGrid();
    updateUI();
}

function startBonk() {
    if (bonkRound || Date.now() < bonkCooldownUntil) return;
    bonkRound = { hits: 0, target: Math.floor(Math.random() * 9), ends: Date.now() + 10000 };
    document.getElementById('bonk-count').textContent = '0';
    casinoMessage('bonk-result', 'he has committed tax fraud. get him');
    renderBonkGrid();
    playSound('slots_spin');
    updateCasinoUI();
    bonkTimer = setInterval(() => {
        if (!bonkRound) return;
        if (Date.now() >= bonkRound.ends) {
            endBonk();
        } else {
            updateCasinoUI();
        }
    }, 80);
}

function updateCasinoUI() {
    if (!document.getElementById('casino-area')) return;
    document.getElementById('casino-gambled').textContent = formatNumber(casinoStats.gambled);
    document.getElementById('casino-best').textContent = formatNumber(casinoStats.bestWin);
    document.getElementById('wheel-spin').disabled = wheelBusy;
    document.getElementById('crash-start').disabled = Boolean(crashRound);
    document.getElementById('crash-cashout').disabled = !crashRound;
    const bonkButton = document.getElementById('bonk-start');
    const cooldown = Math.max(0, bonkCooldownUntil - Date.now());
    bonkButton.disabled = Boolean(bonkRound) || cooldown > 0;
    bonkButton.textContent = bonkRound ? 'pig currently loose' :
        cooldown > 0 ? 'pig on break ' + Math.ceil(cooldown / 1000) + 's' : 'release the pig';
    if (bonkRound) {
        document.getElementById('bonk-time').textContent =
            (Math.max(0, bonkRound.ends - Date.now()) / 1000).toFixed(1);
    }
}

function cancelCasinoRounds() {
    casinoEpoch++;
    clearTimeout(wheelTimeout);
    wheelTimeout = null;
    wheelBusy = false;
    if (crashFrame !== null) cancelAnimationFrame(crashFrame);
    crashFrame = null;
    crashRound = null;
    clearInterval(bonkTimer);
    bonkTimer = null;
    bonkRound = null;
    coinHistory.length = 0;
    const history = document.getElementById('coin-history');
    if (history) history.replaceChildren();
    const coin = document.getElementById('coin-disc');
    if (coin) coin.classList.remove('flipping');
    renderBonkGrid();
}

function initCasino() {
    if (!document.getElementById('casino-area')) return;
    const modeButtons = document.querySelectorAll('[data-casino-tab]');
    for (const button of modeButtons) {
        button.addEventListener('click', () => {
            for (const other of modeButtons) {
                const active = other === button;
                other.classList.toggle('is-active', active);
                other.setAttribute('aria-pressed', String(active));
            }
            for (const panel of document.querySelectorAll('.casino-mode')) {
                panel.hidden = panel.id !== 'casino-' + button.dataset.casinoTab;
            }
        });
    }
    for (const button of document.querySelectorAll('[data-bet-max]')) {
        button.addEventListener('click', () => {
            const input = document.getElementById(button.dataset.betMax);
            input.value = String(Math.max(1, Math.floor(Math.min(score, Number.MAX_SAFE_INTEGER))));
        });
    }
    document.getElementById('coin-head').addEventListener('click', () => flipDivorceCoin('heads'));
    document.getElementById('coin-tail').addEventListener('click', () => flipDivorceCoin('tails'));
    const wheelFace = document.getElementById('wheel-disc');
    for (let i = 0; i < wheelPrizes.length; i++) {
        const label = document.createElement('span');
        const angle = (i + 0.5) * (360 / wheelPrizes.length);
        label.className = 'casino-wheel-prize';
        label.textContent = wheelPrizes[i] + 'x';
        label.style.transform = 'translate(-50%, -50%) rotate(' + angle +
            'deg) translateY(-72px) rotate(' + (-angle) + 'deg)';
        wheelFace.appendChild(label);
    }
    document.getElementById('wheel-spin').addEventListener('click', spinQuestionableWheel);
    document.getElementById('crash-start').addEventListener('click', startCrash);
    document.getElementById('crash-cashout').addEventListener('click', cashOutCrash);
    const grid = document.getElementById('bonk-grid');
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'bonk-cell';
        cell.addEventListener('click', () => bonkPig(i));
        grid.appendChild(cell);
    }
    document.getElementById('bonk-start').addEventListener('click', startBonk);
    renderBonkGrid();
    updateCasinoUI();
}

// --- SAVE/LOAD ---
function saveGame() {
    const gameState = {
        score,
        upgrades: upgrades.map(u => ({ count: u.count })),
        casino: { ...casinoStats }
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

        cancelCasinoRounds();
        casinoStats.gambled = 0;
        casinoStats.bestWin = 0;
        casinoStats.bonks = 0;
        if (gameState.casino && typeof gameState.casino === 'object') {
            for (const key of Object.keys(casinoStats)) {
                const value = Number(gameState.casino[key]);
                if (Number.isFinite(value) && value >= 0) casinoStats[key] = Math.floor(value);
            }
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
        cancelCasinoRounds();
        casinoStats.gambled = 0;
        casinoStats.bestWin = 0;
        casinoStats.bonks = 0;
        bonkCooldownUntil = 0;
        recalculatePPS();
        updateUI();
    }
}

// --- INITIALIZATION ---
function init() {
    loadGame();
    recalculatePPS();
    generateShop();
    initCasino();
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
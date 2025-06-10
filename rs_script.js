document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const screens = {
        start: document.getElementById('start-screen'),
        hub: document.getElementById('hub-screen'),
        shop: document.getElementById('shop-screen'),
        game: document.getElementById('game-screen'),
        end: document.getElementById('end-screen'),
    };

    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const hubHeistButton = document.getElementById('hub-heist-button');
    const hubShopButton = document.getElementById('hub-shop-button');
    const shopBackButton = document.getElementById('shop-back-button');
    const escapeButton = document.getElementById('escape-button');

    const componentElements = document.querySelectorAll('.component');
    const inventoryList = document.getElementById('inventory-list');
    const scoreElement = document.getElementById('score');
    const timeElement = document.getElementById('time');

    const endMessage = document.getElementById('end-message');
    const finalScore = document.getElementById('final-score');

    const cpuElement = document.getElementById('cpu');

    const bankBalanceElement = document.getElementById('bank-balance');
    const shopBalanceElement = document.getElementById('shop-balance');
    const shopItemsContainer = document.getElementById('shop-items-container');

    // --- Audio ---
    const sounds = {
        click: new Audio('click.mp3'),
        unscrew: new Audio('unscrew.mp3'),
        success: new Audio('success.mp3'),
        fail: new Audio('fail.mp3'),
        background: new Audio('bg-music.mp3'),
    };
    sounds.background.loop = true;
    sounds.background.volume = 0.3;

    // --- Game State ---
    let score = 0;
    let timeLeft = 60;
    let timerInterval;
    let partsData;

    const defaultGameState = {
        bankBalance: 0,
        upgrades: {
            timeBonus: 0,
            valueMultiplier: 1.0,
            hasCrowbar: false,
        }
    };
    let gameState = {};

    const shopItems = [
        { id: 'toolkit', name: 'Advanced Toolkit', price: 500, description: 'Permanently adds 5 seconds to the heist timer. Can be bought up to 5 times.', onBuy: () => { gameState.upgrades.timeBonus += 5; }, checkOwned: () => gameState.upgrades.timeBonus >= 25 },
        { id: 'crowbar', name: 'Crowbar', price: 200, description: 'Required to pry out the bulky Power Supply Unit (PSU). One-time purchase.', onBuy: () => { gameState.upgrades.hasCrowbar = true; }, checkOwned: () => gameState.upgrades.hasCrowbar },
        { id: 'contact', name: 'Shady Contact', price: 1000, description: 'Permanently increases the value of all parts by 10%. Can be bought up to 3 times.', onBuy: () => { gameState.upgrades.valueMultiplier = parseFloat((gameState.upgrades.valueMultiplier + 0.1).toFixed(1)); }, checkOwned: () => Math.round((gameState.upgrades.valueMultiplier - 1.0) * 10) >= 3 },
    ];

    const initialPartsData = () => [
        { id: 'gpu', name: 'GPU', value: 1600, removed: false, prerequisites: [] },
        { id: 'ram1', name: 'RAM Stick', value: 100, removed: false, prerequisites: [] },
        { id: 'ram2', name: 'RAM Stick', value: 100, removed: false, prerequisites: [] },
        { id: 'cpu-cooler', name: 'CPU Cooler', value: 80, removed: false, prerequisites: [] },
        { id: 'ssd', name: 'M.2 SSD', value: 120, removed: false, prerequisites: [] },
        { id: 'cpu', name: 'CPU', value: 500, removed: false, prerequisites: ['cpu-cooler'] },
        { id: 'motherboard', name: 'Motherboard', value: 300, removed: false, prerequisites: ['gpu', 'ram1', 'ram2', 'cpu', 'ssd'] },
        { id: 'psu', name: 'PSU', value: 150, removed: false, prerequisites: ['crowbar'] }
    ];

    // --- State Management ---
    function saveState() {
        localStorage.setItem('romanian_sim_state', JSON.stringify(gameState));
    }

    function loadState() {
        const savedState = localStorage.getItem('romanian_sim_state');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            gameState = { ...defaultGameState, ...parsedState };
            gameState.upgrades = { ...defaultGameState.upgrades, ...parsedState.upgrades };
        } else {
            gameState = JSON.parse(JSON.stringify(defaultGameState)); // Deep copy
        }
    }

    function resetState() {
        localStorage.removeItem('romanian_sim_state');
        gameState = JSON.parse(JSON.stringify(defaultGameState)); // Deep copy
    }

    // --- Screen Management ---
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.add('hidden'));
        screens[screenName].classList.remove('hidden');
    }

    // --- UI Update ---
    function updateHubUI() {
        bankBalanceElement.textContent = gameState.bankBalance;
    }

    function updateShopUI() {
        shopBalanceElement.textContent = gameState.bankBalance;
        document.querySelectorAll('.shop-item button').forEach(button => {
            const itemId = button.dataset.itemId;
            const item = shopItems.find(i => i.id === itemId);
            if (!item) return;

            if (item.checkOwned()) {
                 button.disabled = true;
                 button.textContent = 'Max Owned';
            } else if (gameState.bankBalance < item.price) {
                button.disabled = true;
                button.textContent = `Buy (${item.price} Lei)`;
            } else {
                button.disabled = false;
                button.textContent = `Buy (${item.price} Lei)`;
            }
        });
    }

    function populateShop() {
        shopItemsContainer.innerHTML = '';
        shopItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <p class="price">Cost: ${item.price} Lei</p>
                <button data-item-id="${item.id}">Buy (${item.price} Lei)</button>
            `;
            shopItemsContainer.appendChild(itemDiv);
            itemDiv.querySelector('button').addEventListener('click', () => buyItem(item.id));
        });
    }

    function buyItem(itemId) {
        const item = shopItems.find(i => i.id === itemId);
        if (item && gameState.bankBalance >= item.price && !item.checkOwned()) {
            sounds.click.play();
            gameState.bankBalance -= item.price;
            item.onBuy();
            saveState();
            updateShopUI();
            updateHubUI();
        }
    }

    // --- Game Logic ---
    function initGame() {
        score = 0;
        timeLeft = Math.floor(Math.random() * (60 - 20 + 1)) + 20 + gameState.upgrades.timeBonus;
        partsData = initialPartsData();

        timeElement.textContent = timeLeft;
        scoreElement.textContent = score;
        inventoryList.innerHTML = '';

        componentElements.forEach(el => {
            el.classList.remove('removed');
            el.style.animation = '';
        });
        
        cpuElement.style.visibility = 'hidden';

        showScreen('game');
        startGame();
    }

    function startGame() {
        sounds.background.currentTime = 0;
        sounds.background.play();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function updateTimer() {
        timeLeft--;
        timeElement.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame(false);
        }
    }

    function endGame(isVictory, reason = '') {
        clearInterval(timerInterval);
        sounds.background.pause();
        showScreen('end');

        finalScore.textContent = score;

        if (isVictory) {
            sounds.success.play();
            if (reason === 'escaped') {
                endMessage.textContent = "Escaped Safely!";
            } else {
                endMessage.textContent = "Heist Successful!";
            }
            gameState.bankBalance += score;
            saveState();
            restartButton.textContent = 'Back to Hideout';
            restartButton.onclick = () => {
                sounds.click.play();
                showScreen('hub');
                updateHubUI();
            };
        } else {
            sounds.fail.play();
            endMessage.textContent = "Busted! You Lost Everything.";
            resetState();
            restartButton.textContent = 'Start Over';
            restartButton.onclick = () => {
                sounds.click.play();
                showScreen('start');
            };
        }
    }

    function handlePartClick(e) {
        const partId = e.target.dataset.partId;
        const part = partsData.find(p => p.id === partId);

        if (!part || part.removed) return;

        const prerequisitesMet = part.prerequisites.every(prereqId => {
            if (prereqId === 'crowbar') return gameState.upgrades.hasCrowbar;
            
            const prereqPart = partsData.find(p => p.id === prereqId);
            return prereqPart && prereqPart.removed;
        });

        if (prerequisitesMet) {
            part.removed = true;
            score += Math.round(part.value * gameState.upgrades.valueMultiplier);

            sounds.unscrew.currentTime = 0;
            sounds.unscrew.play();
            
            e.target.classList.add('removed');
            
            if (part.id === 'cpu-cooler') {
                cpuElement.style.visibility = 'visible';
            }

            updateUI();

            const allPartsRemoved = partsData.every(p => p.removed);
            if (allPartsRemoved) {
                endGame(true);
            }
        } else {
            e.target.style.animation = 'shake 0.3s';
            setTimeout(() => e.target.style.animation = '', 300);
        }
    }
    
    function updateUI() {
        scoreElement.textContent = score;
        inventoryList.innerHTML = '';
        partsData.filter(p => p.removed).forEach(p => {
            const li = document.createElement('li');
            const valueGained = Math.round(p.value * gameState.upgrades.valueMultiplier);
            li.textContent = `${p.name} (+${valueGained} Lei)`;
            inventoryList.appendChild(li);
        });
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', () => {
        sounds.click.play();
        showScreen('hub');
        updateHubUI();
    });

    hubHeistButton.addEventListener('click', () => {
        sounds.click.play();
        initGame();
    });

    hubShopButton.addEventListener('click', () => {
        sounds.click.play();
        showScreen('shop');
        updateShopUI();
    });

    shopBackButton.addEventListener('click', () => {
        sounds.click.play();
        showScreen('hub');
    });

    escapeButton.addEventListener('click', () => {
        sounds.click.play();
        endGame(true, 'escaped');
    });

    componentElements.forEach(el => {
        el.addEventListener('click', handlePartClick);
    });

    // Add a simple shake animation to CSS for feedback
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `@keyframes shake {
      0%, 100% { transform: translateX(0) rotate(-1deg); }
      25% { transform: translateX(-5px) rotate(-1deg); }
      75% { transform: translateX(5px) rotate(-1deg); }
    }`;
    if (document.head) {
         document.head.appendChild(styleSheet);
    }
   
    // --- Initial Setup ---
    loadState();
    populateShop();
});
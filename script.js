document.addEventListener('DOMContentLoaded', () => {
    const gameState = {
        pervitins: 0,
        pervitinsPerClick: 1,
        pervitinsPerSecond: 0,
    };

    const buildings = [
        { id: 0, name: "gilld chees", baseCost: 15, pps: 0.5, owned: 0, flavor: "look at the greed", icon: 'gir.png', unlocked: true },
        { id: 1, name: "idk", baseCost: 100, pps: 1, owned: 0, flavor: "Floats menacingly. For DOOM.", icon: 'minimoose.png', unlocked: false },
        { id: 2, name: "jeff bezim", baseCost: 1100, pps: 8, owned: 0, flavor: "Tiny ships for... reconnaissance.", icon: 'voot_cruiser.png', unlocked: false },
        { id: 3, name: "dildo", baseCost: 12000, pps: 47, owned: 0, flavor: "It's got a squeaky sound!", icon: 'megadoomer.png', unlocked: false },
        { id: 4, name: "are you not bored yet", baseCost: 130000, pps: 260, owned: 0, flavor: "The entire might of the Irken Empire.", icon: 'irken_armada.png', unlocked: false },
        { id: 5, name: "zorn dealers", baseCost: 1400000, pps: 1400, owned: 0, flavor: "They drop Pervitins while snacking.", icon: 'the_tallest.png', unlocked: false }
    ];

    const flavorTexts = [
        "fuck shit up", "not family freindly", "the jonkler likes balls", "how big is an balls? ", "oopy goopy", "larry.", "I WAS IN HELL LOOKING AT HEAVEN", "GLADOS can get it ngl", "big booty latinas", "scout direct me to the nearest hentai factory" , "i shoved my dick inside a bread before - scout" , "i only hit my wife -Kumi 2025" , "top 10 most breedable sluts in west korea -scout 3.5.2025" , "No memes in dumb quotes -vero" , "I hate the concept of giant pussy walking towards you, shooting pussy beam at you - demonic" , "why are you licking my shit? - jorgen" , "Fuck kids, I DIDN'T MEAN IT LIKE THA - jeezer." , "it just gets boring when they turn 18 - jeezer." , "pengis - henhenma"
    ];

    // DOM Elements
    const pervitinCountEl = document.getElementById('pervitin-count');
    const ppsCountEl = document.getElementById('pps-count');
    const zimHeadEl = document.getElementById('zim-head');
    const zimClickerEl = document.getElementById('zim-clicker');
    const storeEl = document.getElementById('store');
    const flavorTextEl = document.getElementById('flavor-text');
    
    // Buttons
    const startButton = document.getElementById('start-button');
    const loadingScreen = document.getElementById('loading-screen');
    const gameContainer = document.getElementById('game-container');
    const saveButton = document.getElementById('save-button');
    const loadButton = document.getElementById('load-button');
    const resetButton = document.getElementById('reset-button'); const spinButton = document.getElementById('spin-button');
    const spinCostText = document.getElementById('spin-cost-text');
    const slotsResultEl = document.getElementById('slots-result');
    const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];

    // Audio
    let audioContext;
    const audioBuffers = {};
    let backgroundMusicSource;

    async function setupAudio() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const soundFiles = ['click.mp3', 'buy.mp3', 'error.mp3', 'background-music.mp3', 'slots_spin.mp3', 'slots_win.mp3'];
        for (const file of soundFiles) {
            const response = await fetch(file);
            const arrayBuffer = await response.arrayBuffer();
            audioBuffers[file] = await audioContext.decodeAudioData(arrayBuffer);
        }
    }

    function playSound(name, loop = false) {
        if (!audioContext || !audioBuffers[name]) return;
        
        if (name === 'background-music.mp3' && backgroundMusicSource) {
            backgroundMusicSource.stop();
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers[name];
        source.connect(audioContext.destination);
        source.loop = loop;
        source.start(0);

        if (loop) {
            backgroundMusicSource = source;
        }
    }

    function formatNumber(num) {
        if (num < 1000) return num.toFixed(1).replace(/\.0$/, '');
        const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];
        const i = Math.floor(Math.log10(num) / 3);
        const shortNum = (num / Math.pow(1000, i)).toFixed(2);
        return shortNum.replace(/\.00$/, '') + suffixes[i];
    }

    function updateDisplay() {
        pervitinCountEl.textContent = formatNumber(Math.floor(gameState.pervitins));
        ppsCountEl.textContent = formatNumber(gameState.pervitinsPerSecond);
        document.title = `${formatNumber(Math.floor(gameState.pervitins))} Pervitins - Zim Clicker`;
        updateStore();
    }

    function calculateCost(building) {
        return Math.ceil(building.baseCost * Math.pow(1.15, building.owned));
    }

    function renderStore() {
        storeEl.innerHTML = '';
        buildings.forEach(b => {
            if (b.unlocked) {
                const cost = calculateCost(b);
                const buildingDiv = document.createElement('div');
                buildingDiv.className = 'building';
                buildingDiv.id = `building-${b.id}`;
                
                let buildingHTML;
                if (b.type === 'special') {
                    buildingHTML = `
                        <img src="${b.icon}" alt="${b.name}" class="building-icon">
                        <div class="building-info">
                            <h3>${b.name}</h3>
                            <p class="building-cost">
                                <img src="pervitin_icon.png" class="cost-icon"> ${formatNumber(cost)}
                            </p>
                            <p>${b.description || ''}</p>
                        </div>
                        <div class="building-owned">${b.owned > 0 ? '✔️' : 'BUY'}</div>
                    `;
                } else {
                    buildingHTML = `
                        <img src="${b.icon}" alt="${b.name}" class="building-icon">
                        <div class="building-info">
                            <h3>${b.name}</h3>
                            <p class="building-cost">
                                <img src="pervitin_icon.png" class="cost-icon"> ${formatNumber(cost)}
                            </p>
                            <p>+${formatNumber(b.pps)} PPS</p>
                        </div>
                        <div class="building-owned">${b.owned}</div>
                    `;
                }
                buildingDiv.innerHTML = buildingHTML;

                if ((b.type === 'special' && b.owned > 0) || (b.name === "The Tallest" && b.owned >= 100)) { // Example of a cap
                     buildingDiv.classList.add('disabled');
                } else {
                    buildingDiv.addEventListener('click', () => buyBuilding(b.id));
                }
                storeEl.appendChild(buildingDiv);
            }
        });
        updateStore(); // To set initial affordable status
    }

    function updateStore() {
        buildings.forEach(b => {
            if (b.unlocked) {
                const buildingEl = document.getElementById(`building-${b.id}`);
                if (!buildingEl) return;
                
                const affordable = gameState.pervitins >= calculateCost(b);
                buildingEl.classList.toggle('affordable', affordable && !buildingEl.classList.contains('disabled'));

                if (b.type !== 'special') {
                    const costEl = buildingEl.querySelector('.building-cost');
                    costEl.innerHTML = `<img src="pervitin_icon.png" class="cost-icon"> ${formatNumber(calculateCost(b))}`;
                    
                    const ownedEl = buildingEl.querySelector('.building-owned');
                    ownedEl.textContent = b.owned;
                }
            }
        });
    }

    function unlockBuildings() {
        let unlockedNew = false;
        buildings.forEach(b => {
            if (!b.unlocked && gameState.pervitins >= b.baseCost * 0.75) {
                b.unlocked = true;
                unlockedNew = true;
            }
        });
        if (unlockedNew) {
            renderStore();
        }
    }

    function buyBuilding(id) {
        const building = buildings.find(b => b.id === id);
        const cost = calculateCost(building);

        if (gameState.pervitins >= cost) {
            if (building.type === 'special') {
                if (building.owned > 0) {
                    playSound('error.mp3');
                    return; // Already bought
                }
                playSound('buy.mp3');
                gameState.pervitins -= cost;
                building.owned = 1;
                if (building.actionName && typeof actions[building.actionName] === 'function') {
                    actions[building.actionName]();
                }
                renderStore(); // Re-render to show it as bought
                updateDisplay();
            } else {
                playSound('buy.mp3');
                gameState.pervitins -= cost;
                building.owned++;
                gameState.pervitinsPerSecond += building.pps;
                updateDisplay();
            }
        } else {
            playSound('error.mp3');
        }
    }
    
    function showFloatingText(x, y) {
        const textEl = document.createElement('div');
        textEl.className = 'floating-text';
        textEl.textContent = `+${formatNumber(gameState.pervitinsPerClick)}`;
        
        // Position relative to the clicker element's parent for better consistency
        const parentRect = zimClickerEl.parentElement.getBoundingClientRect();
        textEl.style.left = `${x - parentRect.left}px`;
        textEl.style.top = `${y - parentRect.top - 20}px`; // Start slightly above the click position

        zimClickerEl.parentElement.appendChild(textEl);

        setTimeout(() => {
            textEl.remove();
        }, 1000);
    }

    function handleZimClick(event) {
        playSound('click.mp3');
        gameState.pervitins += gameState.pervitinsPerClick;
        showFloatingText(event.clientX, event.clientY);
        updateDisplay();
    }

    function changeFlavorText() {
        const newFlavor = flavorTexts[Math.floor(Math.random() * flavorTexts.length)];
        flavorTextEl.textContent = newFlavor;
    }
    
    function saveGame() {
        const savedState = {
            ...gameState,
            buildings: buildings.map(b => ({ id: b.id, owned: b.owned, unlocked: b.unlocked }))
        };
        localStorage.setItem('zimClickerSave', JSON.stringify(savedState));
        alert("Your pathetic progress has been saved!");
    }

    function loadGame() {
        const savedStateJSON = localStorage.getItem('zimClickerSave');
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            
            gameState.pervitins = savedState.pervitins;
            gameState.pervitinsPerClick = savedState.pervitinsPerClick;

            let totalPPS = 0;
            savedState.buildings.forEach(savedBuilding => {
                const gameBuilding = buildings.find(b => b.id === savedBuilding.id);
                if (gameBuilding) {
                    gameBuilding.owned = savedBuilding.owned;
                    gameBuilding.unlocked = savedBuilding.unlocked;
                    if (gameBuilding.type === 'special' && gameBuilding.owned > 0) {
                        if (gameBuilding.actionName && typeof actions[gameBuilding.actionName] === 'function') {
                           actions[gameBuilding.actionName]();
                        }
                    } else if (gameBuilding.pps) {
                        totalPPS += gameBuilding.owned * gameBuilding.pps;
                    }
                }
            });
            gameState.pervitinsPerSecond = totalPPS;
            
            renderStore();
            updateDisplay();
            alert("progress restored");
        } else {
            alert("no progress found");
        }
    }
    
    function resetGame() {
        if (confirm("btw this resets everything")) {
            localStorage.removeItem('zimClickerSave');
            window.location.reload();
        }
    }

    function gameLoop() {
        gameState.pervitins += gameState.pervitinsPerSecond / 10; // Update 10 times per second
        unlockBuildings();
        updateDisplay();
        spinButton.disabled = gameState.pervitins < spinCost;
    }

    // COSMETIC UPGRADE FUNCTIONS
    function pinWalterToScreen() {
        if (document.getElementById('walter-white-pinned')) return;
        
        const walter = document.createElement('img');
        walter.id = 'walter-white-pinned';
        walter.src = 'walter_white.png';
        walter.alt = 'A mysterious chemist';
        walter.style.left = '10vw';
        walter.style.top = '50vh';
        
        document.body.appendChild(walter);
        
        let isDragging = false;
        let offsetX, offsetY;

        const startDrag = (e) => {
            isDragging = true;
            const event = e.touches ? e.touches[0] : e;
            offsetX = event.clientX - walter.offsetLeft;
            offsetY = event.clientY - walter.offsetTop;
            walter.style.cursor = 'grabbing';
            e.preventDefault();
        };

        const drag = (e) => {
            if (isDragging) {
                const event = e.touches ? e.touches[0] : e;
                walter.style.left = `${event.clientX - offsetX}px`;
                walter.style.top = `${event.clientY - offsetY}px`;
            }
        };

        const endDrag = () => {
            isDragging = false;
            walter.style.cursor = 'grab';
        };

        walter.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);

        walter.addEventListener('touchstart', startDrag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', endDrag);
    }

    function startSpawningZombies() {
        if (window.zombieInterval) return;

        window.zombieInterval = setInterval(() => {
            const zombie = document.createElement('img');
            zombie.src = 'zombie.png';
            zombie.className = 'wandering-zombie';
            zombie.style.bottom = `${Math.random() * 20 + 5}%`; // Randomize height
            
            if (Math.random() > 0.5) {
                zombie.style.transform = 'scaleX(-1)'; // Flip direction
            }
            
            document.body.appendChild(zombie);
            
            setTimeout(() => {
                zombie.remove();
            }, 15000); // Corresponds to animation duration in CSS
        }, 8000); // Spawn every 8 seconds
    }

    const actions = { pinWalterToScreen, startSpawningZombies };

    // SLOTS LOGIC
    const spinCost = 1000;
    const slotSymbols = [
        { icon: 'rubber_pig.png', weight: 40, payout: 2 }, // Common
        { icon: 'gir.png', weight: 25, payout: 5 },
        { icon: 'minimoose.png', weight: 15, payout: 25 },
        { icon: 'voot_cruiser.png', weight: 10, payout: 100 },
        { icon: 'zim_head.png', weight: 5, payout: 500 }, // Rarest
    ];
    const weightedSymbols = slotSymbols.flatMap(s => Array(s.weight).fill(s));

    function getRandomSymbol() {
        return weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
    }

    async function spinSlots() {
        if (gameState.pervitins < spinCost || spinButton.disabled) {
            playSound('error.mp3');
            return;
        }

        gameState.pervitins -= spinCost;
        spinButton.disabled = true;
        slotsResultEl.textContent = '';
        playSound('slots_spin.mp3');

        // Animate reels
        reels.forEach(r => r.classList.add('spinning'));
        let spinInterval = setInterval(() => {
            reels.forEach(reel => {
                reel.querySelector('img').src = getRandomSymbol().icon;
            });
        }, 50);

        // Stop reels one by one
        setTimeout(() => {
            clearInterval(spinInterval);
            
            const finalResults = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
            reels.forEach((reel, i) => {
                reel.querySelector('img').src = finalResults[i].icon;
                reel.classList.remove('spinning');
            });

            checkWin(finalResults);
            updateDisplay();

        }, 1500); // Spin duration
    }

    function checkWin(results) {
        let winAmount = 0;
        let winMessage = "do it again";

        if (results[0].icon === results[1].icon && results[1].icon === results[2].icon) {
            // Three of a kind
            winAmount = spinCost * results[0].payout;
            winMessage = `lets goooo ${formatNumber(winAmount)}!`;
            playSound('slots_win.mp3');
        } else if (results[0].icon === results[1].icon || results[1].icon === results[2].icon) {
            // Two of a kind (adjacent)
            const matchedSymbol = results[0].icon === results[1].icon ? results[0] : results[1];
            winAmount = spinCost * (matchedSymbol.payout / 4);
            winMessage = `nice, u got ${formatNumber(Math.floor(winAmount))}!`;
        }
        
        if (winAmount > 0) {
            gameState.pervitins += winAmount;
        }
        slotsResultEl.textContent = winMessage;
    }
    
    function init() {
        zimClickerEl.addEventListener('click', handleZimClick);
        saveButton.addEventListener('click', saveGame);
        loadButton.addEventListener('click', loadGame);
        resetButton.addEventListener('click', resetGame);
        spinButton.addEventListener('click', spinSlots);
        
        spinCostText.textContent = `Cost: ${formatNumber(spinCost)} Pervitins`;
        loadGame(); // Try to load game on start
        renderStore();
        updateDisplay();
        setInterval(gameLoop, 100);
        setInterval(changeFlavorText, 5000);
    }
    
    startButton.addEventListener('click', async () => {
        loadingScreen.style.display = 'none';
        gameContainer.classList.remove('hidden');
        gameContainer.style.display = 'grid'; // because hidden has display: none !important maybe
        
        await setupAudio();
        playSound('background-music.mp3', true);
        init();
    }, { once: true });
});

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
    const resetButton = document.getElementById('reset-button');

    // Audio
    let audioContext;
    const audioBuffers = {};
    let backgroundMusicSource;

    async function setupAudio() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const soundFiles = ['click.mp3', 'buy.mp3', 'error.mp3', 'background-music.mp3'];
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
                buildingDiv.innerHTML = `
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
                buildingDiv.addEventListener('click', () => buyBuilding(b.id));
                storeEl.appendChild(buildingDiv);
            }
        });
    }

    function updateStore() {
        buildings.forEach(b => {
            if (b.unlocked) {
                const buildingEl = document.getElementById(`building-${b.id}`);
                if (!buildingEl) return;
                
                buildingEl.classList.toggle('affordable', gameState.pervitins >= calculateCost(b));
                
                const costEl = buildingEl.querySelector('.building-cost');
                costEl.innerHTML = `<img src="pervitin_icon.png" class="cost-icon"> ${formatNumber(calculateCost(b))}`;
                
                const ownedEl = buildingEl.querySelector('.building-owned');
                ownedEl.textContent = b.owned;
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
            playSound('buy.mp3');
            gameState.pervitins -= cost;
            building.owned++;
            gameState.pervitinsPerSecond += building.pps;
            updateDisplay();
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
                    totalPPS += gameBuilding.owned * gameBuilding.pps;
                }
            });
            gameState.pervitinsPerSecond = totalPPS;
            
            renderStore();
            updateDisplay();
            alert("Your previous session of DOOM has been restored!");
        } else {
            alert("No saved game found, you incompetent human!");
        }
    }
    
    function resetGame() {
        if (confirm("Are you sure you want to erase all your hard-earned DOOM? This cannot be undone!")) {
            localStorage.removeItem('zimClickerSave');
            window.location.reload();
        }
    }

    function gameLoop() {
        gameState.pervitins += gameState.pervitinsPerSecond / 10; // Update 10 times per second
        unlockBuildings();
        updateDisplay();
    }
    
    function init() {
        zimClickerEl.addEventListener('click', handleZimClick);
        saveButton.addEventListener('click', saveGame);
        loadButton.addEventListener('click', loadGame);
        resetButton.addEventListener('click', resetGame);
        
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


import { createApp, ref, computed, watch, nextTick, onMounted } from 'vue';

createApp({
    setup() {
        const gameState = ref('setup');
        const enemyImage = ref(null);
        const enemyName = ref('');
        const enemyPersonality = ref('');
        const enemyHealth = ref('');
        const playerHealth = ref('100');
        const setupError = ref('');
        const isLoading = ref(false);
        const loadingMessage = ref('');
        const audioInitialized = ref(false);
        const menuMusic = new Audio('/youtube_ivZ9wYvApRI_audio.mp3');
        const battleMusic = new Audio('/youtube_GPL5Hkl11IQ_audio.mp3');
        const customBattleMusic = ref(null);
        const damageSound = new Audio('/snd_damage.wav');
        const buttonSound = new Audio('/v91x2y.mp3');
        
        // Loop music
        menuMusic.loop = true;
        battleMusic.loop = true;
        
        // Battle state
        const enemy = ref({
            name: '',
            maxHealth: 100,
            currentHealth: 100,
            attacks: [],
            dialogue: {
                intro: [],
                attack: [],
                block: [],
                heal: [],
                special: [],
                hit: [],
                victory: [],
                defeat: []
            }
        });
        
        const player = ref({
            name: 'You',
            maxHealth: 100,
            currentHealth: 100,
            avatar: null,
            inventory: []
        });
        
        const currentDialogue = ref('');
        const displayedText = ref('');
        const isTyping = ref(false);
        const dialogueQueue = ref([]);
        const battleEnd = ref(null);
        const showEnemyHit = ref(false);
        const showPlayerHit = ref(false);
        const isProcessing = ref(false);
        const showInventory = ref(false);
        const showAttackOptions = ref(false);
        const customItemName = ref('');
        const customItemValue = ref(5);
        const customItemType = ref('heal');
        const isCreatingItem = ref(false);
        const itemCreationError = ref('');
        const inventoryItems = ref([
            { id: 1, name: 'Healing Potion', description: 'Restores 30 HP', effect: 'heal', value: 30 },
            { id: 2, name: 'Defense Shield', description: 'Reduces incoming damage by 4', effect: 'defense', value: 4 },
            { id: 3, name: 'Power Boost', description: 'Increases attack damage by 5', effect: 'attack', value: 5 }
        ]);
        
        const canStartBattle = computed(() => {
            return enemyImage.value && enemyName.value && enemyPersonality.value;
        });
        
        // Upload enemy image
        const handleImageUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                if (!file.type.match('image.*')) {
                    setupError.value = 'Please upload an image file';
                    return;
                }
                
                setupError.value = '';
                const reader = new FileReader();
                reader.onload = (e) => {
                    enemyImage.value = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        
        // Handle custom battle music upload
        const handleMusicUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                if (!file.type.match('audio.*')) {
                    setupError.value = 'Please upload an audio file';
                    return;
                }
                
                setupError.value = '';
                const url = URL.createObjectURL(file);
                customBattleMusic.value = {
                    file: new Audio(url),
                    name: file.name
                };
                customBattleMusic.value.file.loop = true;
            }
        };
        
        // Clear custom music
        const clearCustomMusic = () => {
            if (customBattleMusic.value) {
                // Revoke object URL to free up memory
                URL.revokeObjectURL(customBattleMusic.value.file.src);
                customBattleMusic.value = null;
            }
        };

        // Initialize audio when the user first clicks anywhere on the page
        const initAudio = () => {
            if (!audioInitialized.value) {
                menuMusic.play().catch(e => console.error("Error playing music:", e));
                audioInitialized.value = true;
            }
        };

        // Play button sound
        const playButtonSound = () => {
            if (audioInitialized.value) {
                buttonSound.currentTime = 0;
                buttonSound.play().catch(e => console.error("Error playing button sound:", e));
            }
        };

        // Play damage sound
        const playDamageSound = () => {
            if (audioInitialized.value) {
                damageSound.currentTime = 0;
                damageSound.play().catch(e => console.error("Error playing damage sound:", e));
            }
        };

        // Add a one-time global click listener to trigger audio initialization on first user gesture
        onMounted(() => {
            document.addEventListener('click', initAudio, { once: true });
            // Global listener: play the button sound when any button is clicked.
            document.addEventListener('click', (e) => {
                if (e.target.closest('button')) {
                    playButtonSound();
                }
            });
        });

        // Switch music based on game state
        watch(gameState, (newState, oldState) => {
            if (audioInitialized.value) {
                if (newState === 'setup') {
                    if (customBattleMusic.value) {
                        customBattleMusic.value.file.pause();
                        customBattleMusic.value.file.currentTime = 0;
                    } else {
                        battleMusic.pause();
                        battleMusic.currentTime = 0;
                    }
                    menuMusic.play().catch(e => console.error("Error playing music:", e));
                } else if (newState === 'battle') {
                    menuMusic.pause();
                    menuMusic.currentTime = 0;
                    if (customBattleMusic.value) {
                        customBattleMusic.value.file.play().catch(e => console.error("Error playing custom music:", e));
                    } else {
                        battleMusic.play().catch(e => console.error("Error playing music:", e));
                    }
                }
            }
        });
        
        // Initialize battle
        const startBattle = async () => {
            if (!canStartBattle.value) {
                setupError.value = 'Please fill in all required fields';
                return;
            }
            
            isLoading.value = true;
            loadingMessage.value = 'Analyzing enemy sprite and generating battle data...';
            
            try {
                // Get user information
                const user = await websim.getUser();
                
                // Get enemy analysis based on uploaded image and descriptions
                const enemyData = await analyzeEnemy();
                
                // Set enemy stats
                enemy.value = {
                    name: enemyName.value,
                    maxHealth: enemyData.health,
                    currentHealth: enemyData.health,
                    attacks: enemyData.attacks,
                    dialogue: enemyData.dialogue
                };
                
                // Set player stats with user info and KEEP EXISTING INVENTORY
                const initialPlayerHealth = parseInt(playerHealth.value) || 100;
                player.value = {
                    name: user ? `${user.username} (You)` : 'You',
                    maxHealth: initialPlayerHealth,
                    currentHealth: initialPlayerHealth,
                    avatar: user ? user.avatar_url : null,
                    inventory: [...player.value.inventory] // Keep existing inventory
                };
                
                // Start battle
                gameState.value = 'battle';
                isLoading.value = false; // Fix loading spinner
                
                // Queue intro dialogue
                dialogueQueue.value = [...enemyData.dialogue.intro];
                advanceDialogue();
                
            } catch (error) {
                console.error('Error starting battle:', error);
                setupError.value = 'Error analyzing enemy. Please try again.';
                isLoading.value = false;
            }
        };
        
        // Generate enemy data based on image and input
        const analyzeEnemy = async () => {
            // This would be a call to the AI for generating enemy stats and dialogue
            try {
                const imageDataUrl = enemyImage.value;
                
                // Format our prompt for the AI
                const analysisResult = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are an AI game master for a turn-based battle game. Based on an uploaded enemy sprite and description, generate appropriate stats, attacks, and dialogue for a battle sequence. Be creative and match the tone to the visual appearance and described personality. Keep intro dialogues brief (1-3 lines) and make them directly related to each other - this is crucial. Do not generate long or unrelated intro sequences.`
                        },
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Generate battle data for this enemy:
                                    Name: ${enemyName.value}
                                    Personality: ${enemyPersonality.value}
                                    ${enemyHealth.value ? `Health: ${enemyHealth.value}` : ''}
                                    
                                    Respond with JSON data containing:
                                    - health: number (between 80-150, or use the provided value)
                                    - attacks: array of attack objects with properties:
                                      - name: string (attack name)
                                      - type: string ("damage", "block", "heal", or "special")
                                      - value: number (damage amount or heal amount)
                                      - description: string (description of what the attack does)
                                      - chance: number (probability weight for this attack, higher = more common)
                                    - dialogue: object containing arrays of strings for different scenarios:
                                      - intro: 1-3 BRIEF intro dialogues that are directly related to each other (important!)
                                      - attack: 4-6 different attack dialogues
                                      - block: 4-6 different dialogues when blocking player's attack
                                      - heal: 4-6 different dialogues when healing
                                      - special: 4-6 different dialogues for special attacks
                                      - hit: 4-6 different dialogues when taking damage
                                      - victory: 4-6 different victory dialogues
                                      - defeat: 4-6 different defeat dialogues
                                    
                                    Make the dialogue match the personality description and visual appearance. Create at least 5-6 diverse attacks with different types.`
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: imageDataUrl }
                                }
                            ]
                        }
                    ],
                    json: true
                });
                
                const enemyData = JSON.parse(analysisResult.content);
                
                // Use provided health if available, otherwise use AI-determined health
                if (enemyHealth.value) {
                    enemyData.health = parseInt(enemyHealth.value);
                }
                
                // Ensure intro dialogues are limited to max 3 lines
                if (enemyData.dialogue.intro.length > 3) {
                    enemyData.dialogue.intro = enemyData.dialogue.intro.slice(0, 3);
                }
                
                return enemyData;
                
            } catch (error) {
                console.error('AI analysis error:', error);
                throw new Error('Failed to analyze enemy');
            }
        };
        
        // Text typing effect for dialogue
        const typeText = async (text) => {
            isTyping.value = true;
            displayedText.value = '';
            
            for (let i = 0; i < text.length; i++) {
                displayedText.value += text[i];
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            isTyping.value = false;
            // Add a short pause after text is fully displayed
            await new Promise(resolve => setTimeout(resolve, 800));
        };
        
        // Advance dialogue in queue
        const advanceDialogue = async () => {
            if (dialogueQueue.value.length > 0) {
                currentDialogue.value = dialogueQueue.value.shift();
                await typeText(currentDialogue.value);
                // Keep checking for more dialogue
                if (dialogueQueue.value.length > 0) {
                    await advanceDialogue();
                } else {
                    // If no more dialogue, clear and allow actions
                    currentDialogue.value = '';
                    displayedText.value = '';
                    await new Promise(resolve => setTimeout(resolve, 500));
                    isProcessing.value = false;
                }
            } else {
                currentDialogue.value = '';
                displayedText.value = '';
                // Add a pause before showing attack buttons
                await new Promise(resolve => setTimeout(resolve, 500));
                // Now that all dialogue is done, allow player actions
                isProcessing.value = false;
            }
        };
        
        // Player attacks
        const useAttack = async (attackType) => {
            // Disable actions while processing
            isProcessing.value = true;
            showAttackOptions.value = false;
            
            let damage = 0;
            let attackName = '';
            
            // Calculate damage based on attack type
            switch (attackType) {
                case 'quick':
                    damage = Math.floor(Math.random() * 10) + 5; // 5-14 damage
                    attackName = 'Quick Attack';
                    break;
                case 'heavy':
                    damage = Math.floor(Math.random() * 15) + 10; // 10-24 damage
                    attackName = 'Heavy Attack';
                    break;
                case 'special':
                    damage = Math.floor(Math.random() * 20) + 15; // 15-34 damage
                    attackName = 'Special Move';
                    break;
                case 'defend':
                    damage = 0;
                    attackName = 'Defend';
                    // Recover some health when defending
                    const healAmount = Math.min(10, player.value.maxHealth - player.value.currentHealth);
                    player.value.currentHealth = Math.min(
                        player.value.currentHealth + healAmount,
                        player.value.maxHealth
                    );
                    break;
            }
            
            // Show player attack dialogue
            currentDialogue.value = `${player.value.name} uses ${attackName}!`;
            await typeText(currentDialogue.value);
            
            // Add pause between attack and damage
            await new Promise(resolve => setTimeout(resolve, 600));
            
            if (damage > 0) {
                // Check if enemy is blocking
                if (enemy.value.nextAttackBlocked) {
                    // Reduce damage by 50-75%
                    const damageReduction = Math.floor(damage * (0.5 + Math.random() * 0.25));
                    damage = Math.max(1, damage - damageReduction);
                    
                    // Show blocked message
                    currentDialogue.value = `${enemy.value.name} blocks! Damage reduced to ${damage}!`;
                    await typeText(currentDialogue.value);
                    
                    // Reset block flag
                    enemy.value.nextAttackBlocked = false;
                    
                    // Add pause after block message
                    await new Promise(resolve => setTimeout(resolve, 600));
                }
                
                // Apply damage to enemy
                enemy.value.currentHealth = Math.max(0, enemy.value.currentHealth - damage);
                
                // Show hit animation
                showEnemyHit.value = true;
                playDamageSound();
                setTimeout(() => {
                    showEnemyHit.value = false;
                }, 500);
                
                // Show damage dialogue
                currentDialogue.value = `${enemy.value.name} takes ${damage} damage!`;
                await typeText(currentDialogue.value);
                
                // Add pause after damage
                await new Promise(resolve => setTimeout(resolve, 600));
                
                // Show enemy reaction dialogue - randomly select from available hit dialogues
                if (enemy.value.dialogue.hit.length > 0) {
                    const hitDialogue = enemy.value.dialogue.hit[Math.floor(Math.random() * enemy.value.dialogue.hit.length)];
                    currentDialogue.value = hitDialogue;
                    await typeText(currentDialogue.value);
                }
            } else {
                // Show defend dialogue
                const healAmount = Math.min(10, player.value.maxHealth - player.value.currentHealth);
                currentDialogue.value = `${player.value.name} defends and recovers ${healAmount} health!`;
                await typeText(currentDialogue.value);
            }
            
            // Check if enemy is defeated
            if (enemy.value.currentHealth <= 0) {
                await endBattle('victory');
                return;
            }
            
            // Add pause before enemy turn
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Enemy turn
            await enemyTurn();
            
            // This is the fix for the defend softlock - ensure isProcessing is set to false at the end
            isProcessing.value = false;
        };
        
        // Use item from inventory
        const useItem = async (item, index) => {
            isProcessing.value = true;
            showInventory.value = false;
            
            // Show dialogue for item use
            currentDialogue.value = `${player.value.name} uses ${item.name}!`;
            await typeText(currentDialogue.value);
            
            // Apply item effect
            switch (item.effect) {
                case 'heal':
                    const healAmount = Math.min(item.value, player.value.maxHealth - player.value.currentHealth);
                    player.value.currentHealth = player.value.currentHealth + healAmount;
                    currentDialogue.value = `You recovered ${healAmount} HP!`;
                    break;
                case 'defense':
                    player.value.damageReduction = item.value;
                    currentDialogue.value = `Your defense increased! Damage reduced by ${item.value}!`;
                    break;
                case 'attack':
                    player.value.attackBoost = item.value;
                    currentDialogue.value = `Your attack increased by ${item.value}!`;
                    break;
            }
            
            // Remove the used item from inventory
            player.value.inventory.splice(index, 1);
            
            // Display effect text
            await typeText(currentDialogue.value);
            
            // Add pause before enemy turn
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Enemy turn
            await enemyTurn();
            
            // Reset processing flag
            isProcessing.value = false;
        };
        
        // Toggle fight options (attack menu)
        const toggleAttackOptions = () => {
            showAttackOptions.value = !showAttackOptions.value;
            showInventory.value = false;
        };
        
        // Toggle inventory
        const toggleInventory = () => {
            showInventory.value = !showInventory.value;
            showAttackOptions.value = false;
        };
        
        // Add items to inventory (setup screen)
        const addItemToInventory = (item) => {
            player.value.inventory.push({...item});
        };
        
        // Enemy attack turn
        const enemyTurn = async () => {
            // Set processing flag to prevent player actions
            isProcessing.value = true;
            
            // Select weighted random attack based on chance property
            const totalWeight = enemy.value.attacks.reduce((sum, attack) => sum + (attack.chance || 1), 0);
            let randomWeight = Math.random() * totalWeight;
            let selectedAttack = null;
            
            for (const attack of enemy.value.attacks) {
                randomWeight -= (attack.chance || 1);
                if (randomWeight <= 0) {
                    selectedAttack = attack;
                    break;
                }
            }
            
            if (!selectedAttack) {
                selectedAttack = enemy.value.attacks[0]; // Fallback
            }
            
            // Choose appropriate dialogue based on attack type
            let attackDialogues;
            switch (selectedAttack.type) {
                case 'block':
                    attackDialogues = enemy.value.dialogue.block || enemy.value.dialogue.attack;
                    break;
                case 'heal':
                    attackDialogues = enemy.value.dialogue.heal || enemy.value.dialogue.attack;
                    break;
                case 'special':
                    attackDialogues = enemy.value.dialogue.special || enemy.value.dialogue.attack;
                    break;
                case 'damage':
                default:
                    attackDialogues = enemy.value.dialogue.attack;
            }
            
            const attackDialogue = attackDialogues[Math.floor(Math.random() * attackDialogues.length)];
            currentDialogue.value = attackDialogue;
            await typeText(currentDialogue.value);
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            currentDialogue.value = `${enemy.value.name} uses ${selectedAttack.name}!`;
            await typeText(currentDialogue.value);
            
            await new Promise(resolve => setTimeout(resolve, 600));
            
            // Convert attack value to a number for safety
            const damageValue = Number(selectedAttack.value) || 0;
            
            // Apply attack effect based on type
            switch (selectedAttack.type) {
                case 'damage':
                    if (player.value.damageReduction) {
                        const reducedDamage = Math.max(1, damageValue - player.value.damageReduction);
                        player.value.currentHealth = Math.max(0, player.value.currentHealth - reducedDamage);
                        
                        currentDialogue.value = `Defense shield absorbs ${player.value.damageReduction} damage!`;
                        await typeText(currentDialogue.value);
                        
                        currentDialogue.value = `You take ${reducedDamage} damage!`;
                        await typeText(currentDialogue.value);
                        
                        player.value.damageReduction = null;
                    } else {
                        player.value.currentHealth = Math.max(0, player.value.currentHealth - damageValue);
                        currentDialogue.value = `You take ${damageValue} damage!`;
                        await typeText(currentDialogue.value);
                    }
                    break;
                    
                case 'block':
                    // Set a flag to indicate player's next attack is reduced
                    player.value.nextAttackBlocked = true;
                    currentDialogue.value = selectedAttack.description || `${enemy.value.name} prepares to block your next attack!`;
                    await typeText(currentDialogue.value);
                    break;
                    
                case 'heal':
                    const healAmount = Math.min(damageValue, enemy.value.maxHealth - enemy.value.currentHealth);
                    enemy.value.currentHealth = Math.min(enemy.value.maxHealth, enemy.value.currentHealth + healAmount);
                    
                    currentDialogue.value = `${enemy.value.name} recovers ${healAmount} health!`;
                    await typeText(currentDialogue.value);
                    break;
                    
                case 'special':
                    player.value.currentHealth = Math.max(0, player.value.currentHealth - damageValue);
                    
                    showPlayerHit.value = true;
                    playDamageSound();
                    setTimeout(() => {
                        showPlayerHit.value = false;
                    }, 500);
                    
                    currentDialogue.value = selectedAttack.description || `A special attack hits you for ${damageValue} damage!`;
                    await typeText(currentDialogue.value);
                    break;
                    
                default:
                    // Treat any unknown attack type as damage
                    player.value.currentHealth = Math.max(0, player.value.currentHealth - damageValue);
                    currentDialogue.value = `You take ${damageValue} damage!`;
                    await typeText(currentDialogue.value);
                    break;
            }
            
            if (player.value.currentHealth <= 0) {
                await endBattle('defeat');
            } else {
                await new Promise(resolve => setTimeout(resolve, 800));
                currentDialogue.value = '';
            }
        };
        
        // End battle sequence
        const endBattle = async (result) => {
            battleEnd.value = result;
            isLoading.value = false; // Ensure loading spinner is hidden
            
            if (result === 'victory') {
                // Victory dialogues - show one at a time from the defeat dialogue array
                for (let i = 0; i < Math.min(3, enemy.value.dialogue.defeat.length); i++) {
                    // Randomly select a dialogue that hasn't been shown yet
                    const dialogueIndex = Math.floor(Math.random() * enemy.value.dialogue.defeat.length);
                    const dialogue = enemy.value.dialogue.defeat[dialogueIndex];
                    
                    currentDialogue.value = dialogue;
                    await typeText(currentDialogue.value);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Remove used dialogue to avoid repetition
                    enemy.value.dialogue.defeat.splice(dialogueIndex, 1);
                }
            } else {
                // Defeat dialogues - show one at a time from the victory dialogue array
                for (let i = 0; i < Math.min(3, enemy.value.dialogue.victory.length); i++) {
                    // Randomly select a dialogue that hasn't been shown yet
                    const dialogueIndex = Math.floor(Math.random() * enemy.value.dialogue.victory.length);
                    const dialogue = enemy.value.dialogue.victory[dialogueIndex];
                    
                    currentDialogue.value = dialogue;
                    await typeText(currentDialogue.value);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Remove used dialogue to avoid repetition
                    enemy.value.dialogue.victory.splice(dialogueIndex, 1);
                }
            }
            
            currentDialogue.value = '';
            // Stop battle music when battle ends
            if (audioInitialized.value) {
                battleMusic.pause();
                battleMusic.currentTime = 0;
                menuMusic.play().catch(e => console.error("Error playing music:", e));
            }
        };
        
        // Reset game to setup screen
        const resetGame = () => {
            gameState.value = 'setup';
            enemyName.value = '';
            enemyPersonality.value = '';
            enemyHealth.value = '';
            setupError.value = '';
            battleEnd.value = null;
            dialogueQueue.value = [];
            currentDialogue.value = '';
            displayedText.value = '';
            isProcessing.value = false;
            showInventory.value = false;
            showAttackOptions.value = false;
            // Clear image
            enemyImage.value = null;
            // Keep custom battle music
        };
        
        // Create custom item with AI
        const createCustomItem = async () => {
            if (!customItemName.value.trim()) {
                itemCreationError.value = 'Please enter an item name';
                return;
            }
            
            // Check for spaces and limit length
            const normalizedName = customItemName.value.trim().replace(/\s+/g, '');
            if (normalizedName.length > 15) {
                itemCreationError.value = 'Item name must be 15 characters or less (without spaces)';
                return;
            }
            
            isCreatingItem.value = true;
            itemCreationError.value = '';
            
            try {
                // Generate item using AI
                const completion = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are an AI game item generator for a turn-based RPG battle game. Create a creative item based on user input.`
                        },
                        {
                            role: "user",
                            content: `Create a battle item called "${customItemName.value}" of type "${customItemType.value}" with a base value of ${customItemValue.value}.
                            
                            Respond with JSON data for an RPG item with these properties:
                            - name: string (use the provided name, with no spaces)
                            - description: string (creative description of what the item does, maximum 60 characters)
                            - effect: string (must be one of: "heal", "defense", "attack" - use the type provided)
                            - value: number (use the provided value as a base but you can adjust ±2 for balance)
                            
                            Be creative with the description, but keep it concise and match the item name theme.`
                        }
                    ],
                    json: true
                });
                
                const itemData = JSON.parse(completion.content);
                
                // Add the new item to inventory
                player.value.inventory.push({
                    id: Date.now(), // Generate unique ID
                    name: itemData.name,
                    description: itemData.description,
                    effect: itemData.effect,
                    value: itemData.value
                });
                
                // Reset form
                customItemName.value = '';
                customItemValue.value = 5;
                
            } catch (error) {
                console.error('Error creating item:', error);
                itemCreationError.value = 'Failed to create item. Please try again.';
            } finally {
                isCreatingItem.value = false;
            }
        };

        const deleteItem = (index) => {
            player.value.inventory.splice(index, 1);
        };

        return {
            gameState,
            enemyImage,
            enemyName,
            enemyPersonality,
            enemyHealth,
            playerHealth,
            setupError,
            isLoading,
            loadingMessage,
            enemy,
            player,
            currentDialogue,
            displayedText,
            isTyping,
            battleEnd,
            showEnemyHit,
            showPlayerHit,
            canStartBattle,
            handleImageUpload,
            handleMusicUpload,
            startBattle,
            advanceDialogue,
            useAttack,
            resetGame,
            isProcessing,
            showInventory,
            showAttackOptions,
            toggleInventory,
            toggleAttackOptions,
            useItem,
            inventoryItems,
            addItemToInventory,
            customItemName,
            customItemValue,
            customItemType,
            createCustomItem,
            isCreatingItem,
            itemCreationError,
            deleteItem,
            initAudio,
            audioInitialized,
            customBattleMusic,
            clearCustomMusic
        };
    }
}).mount('#app');
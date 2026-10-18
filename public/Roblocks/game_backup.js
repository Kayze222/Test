import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Points, BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three';

// Create audio element for background music
const backgroundMusic = new Audio('/ROBLOX runaway.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Set initial volume to 50%
let isMusicPlaying = true;

// Add near the top of the file with other music variables
const globalMusicControls = {
    toggleBtn: document.getElementById('global-toggle-music'),
    volumeSlider: document.getElementById('global-music-volume')
};

// Function to handle user interaction and start music
function initializeAudio() {
    // Start playing on user interaction
    backgroundMusic.play().catch(error => {
        console.log("Audio autoplay failed:", error);
    });
    
    // Remove the event listener once audio is playing
    document.removeEventListener('click', initializeAudio);
    document.removeEventListener('keydown', initializeAudio);
}

// Add event listeners for user interaction
document.addEventListener('click', initializeAudio);
document.addEventListener('keydown', initializeAudio);

globalMusicControls.toggleBtn.addEventListener('click', () => {
    if (isMusicPlaying) {
        backgroundMusic.pause();
        globalMusicControls.toggleBtn.textContent = 'Play Music';
    } else {
        backgroundMusic.play();
        globalMusicControls.toggleBtn.textContent = 'Pause Music';
    }
    isMusicPlaying = !isMusicPlaying;
});

globalMusicControls.volumeSlider.addEventListener('input', (e) => {
    backgroundMusic.volume = parseFloat(e.target.value);
    // Update admin panel volume slider if it exists and user is admin
    if (isAdmin && document.getElementById('music-volume')) {
        document.getElementById('music-volume').value = e.target.value;
    }
});

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function createNameTag(username) {
    const nametag = document.createElement('div');
    nametag.className = 'nametag';
    
    const isLocalPlayer = username === room.peers[room.clientId]?.username;
    const safeUsername = escapeHtml(username); // Escape username

    if (username === 'hardcore') { 
        nametag.style.color = '#ff0000';
        nametag.textContent = '👑 [OWNER] ' + safeUsername;
    } else if (ADMIN_USERS.includes(username)) { 
        nametag.style.color = '#ff4444';
        nametag.textContent = '[ADMIN] ' + safeUsername;
    } else if (isLocalPlayer && window.adminSettings?.nametagFormat) {
        nametag.style.color = window.adminSettings.nametagColor;
        // adminSettings.nametagFormat is admin input, used with textContent so HTML within it will be literal
        nametag.textContent = window.adminSettings.nametagFormat.replace('[USER]', safeUsername);
    } else {
        nametag.style.color = '#ffffff';
        nametag.textContent = safeUsername;
    }
    
    document.body.appendChild(nametag);
    return nametag;
}

function createChatBubble(message) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = message;
    document.body.appendChild(bubble);
    
    // Automatically remove bubble after 5 seconds
    setTimeout(() => {
        if (bubble.parentNode) {
            bubble.parentNode.removeChild(bubble);
        }
    }, 5000);
    
    return bubble;
}

const chatBubbleStyle = document.createElement('style');
chatBubbleStyle.textContent = `
    .chat-bubble {
        position: absolute;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 10px;
        font-family: 'Source Sans Pro', sans-serif;
        font-size: 14px;
        pointer-events: none;
        white-space: pre-wrap;
        max-width: 200px;
        text-align: center;
        transform: translate(-50%, -50%);
        z-index: 1000;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(chatBubbleStyle);

const textureLoader = new THREE.TextureLoader();
const headTexture = textureLoader.load('/pngOfTheHeadLOLL.png');

// Scene setup first
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Enable shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Ensure correct color space for renderer output
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Initialize multiplayer room after scene is created
const room = new WebsimSocket();
await room.initialize();

const ADMIN_USERS = ['hardcore', 'websimbro', 'bastiancarcamo', 'yos', 'grey168', 'Dorian2007', 'jayy', 'uglybridge9252621', 'uglybridge', 'adjectivenounnumber', 'Lwebb2013', 'readystatue8153930']; 
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Initialize admin panel if user is admin
const adminPanel = document.getElementById('admin-panel');
const kickSelect = document.getElementById('kick-player');
const kickButton = document.getElementById('kick-button');
const characterScale = document.getElementById('character-scale');
const torsoScale = document.getElementById('torso-scale');
const headColorPicker = document.getElementById('head-color');
const torsoColorPicker = document.getElementById('torso-color');
const armsColorPicker = document.getElementById('arms-color');
const legsColorPicker = document.getElementById('legs-color');
const particleEffect = document.getElementById('particle-effect');

let isAdmin = ADMIN_USERS.includes(room.peers[room.clientId]?.username);
let isOwner = room.peers[room.clientId]?.username === 'hardcore'; 

// Check if current user is admin
if (isAdmin) {
    adminPanel.style.display = 'block';
    
    // Setup admin controls
    characterScale.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        character.scale.set(scale, scale, scale);
        room.updatePresence({
            characterScale: scale
        });
    });

    torsoScale.addEventListener('input', (e) => {
        const scale = parseFloat(e.target.value);
        torso.scale.set(scale, scale, 1);
        room.updatePresence({
            torsoScale: scale
        });
    });

    // Update player list for kick function
    function updateKickList() {
        kickSelect.innerHTML = '<option value="">Select Player</option>';
        Object.entries(room.peers).forEach(([clientId, peer]) => {
            if (clientId !== room.clientId && !ADMIN_USERS.includes(peer.username)) { 
                const option = document.createElement('option');
                option.value = clientId;
                option.textContent = peer.username; 
                kickSelect.appendChild(option);
            }
        });
    }

    kickButton.addEventListener('click', () => {
        const selectedId = kickSelect.value;
        const currentUser = room.peers[room.clientId]?.username;
        const targetUser = room.peers[selectedId]?.username;
        
        if (selectedId) {
            // Only owner can kick other admins
            if (currentUser === 'hardcore' || !ADMIN_USERS.includes(targetUser)) { 
                room.send({
                    type: 'kick',
                    targetId: selectedId
                });
            } else {
                addSystemMessage("Only the owner can kick other admins.");
            }
        }
    });

    // Update kick list when peers change
    room.subscribePresence(() => {
        updateKickList();
    });

    // Music controls
    const musicVolume = document.getElementById('music-volume');
    const toggleMusic = document.getElementById('toggle-music');
    
    musicVolume.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        backgroundMusic.volume = volume;
        // Keep global controls in sync
        globalMusicControls.volumeSlider.value = volume;
    });
    
    toggleMusic.addEventListener('click', () => {
        if (isMusicPlaying) {
            backgroundMusic.pause();
            toggleMusic.textContent = 'Play Music';
            globalMusicControls.toggleBtn.textContent = 'Play Music';
        } else {
            backgroundMusic.play();
            toggleMusic.textContent = 'Pause Music';
            globalMusicControls.toggleBtn.textContent = 'Pause Music';
        }
        isMusicPlaying = !isMusicPlaying;
    });

    // Color customization handlers
    function updateCharacterColor(partName, color) {
        const colorObj = new THREE.Color(color);
        
        switch(partName) {
            case 'head':
                if (headMesh) {
                    headMesh.material.color = colorObj;
                }
                room.updatePresence({ headColor: color });
                break;
            case 'torso':
                if (torso) {
                    torso.material.color = colorObj;
                }
                room.updatePresence({ torsoColor: color });
                break;
            case 'arms':
                if (leftArmMesh) leftArmMesh.material.color = colorObj;
                if (rightArmMesh) rightArmMesh.material.color = colorObj;
                room.updatePresence({ armsColor: color });
                break;
            case 'legs':
                if (leftLegMesh) leftLegMesh.material.color = colorObj;
                if (rightLegMesh) rightLegMesh.material.color = colorObj;
                room.updatePresence({ legsColor: color });
                break;
        }
    }

    headColorPicker.addEventListener('input', (e) => updateCharacterColor('head', e.target.value));
    torsoColorPicker.addEventListener('input', (e) => updateCharacterColor('torso', e.target.value));
    armsColorPicker.addEventListener('input', (e) => updateCharacterColor('arms', e.target.value));
    legsColorPicker.addEventListener('input', (e) => updateCharacterColor('legs', e.target.value));
}

if (isAdmin) {
    // Add after existing admin panel setup code:
    
    // Initialize admin settings if not exists
    window.adminSettings = window.adminSettings || {
        nametagFormat: '[USER]',
        nametagColor: '#ffffff',
        chatFormat: '[USER]: ',
        chatColor: '#ffffff',
        particleEffect: 'none'
    };

    // Create new control group for nametag settings
    const nametagControls = document.createElement('div');
    nametagControls.className = 'control-group';
    nametagControls.innerHTML = `
        <h4>My Nametag Settings</h4>
        <label>My Format:
            <input type="text" id="nametag-format" value="[USER]" placeholder="Use [USER] for username">
        </label>
        <label>My Color:
            <input type="color" id="nametag-color" value="#ffffff">
        </label>
        <button id="apply-nametag" class="admin-button">Apply My Nametag Changes</button>
    `;
    adminPanel.querySelector('.admin-controls').appendChild(nametagControls);

    // Create new control group for chat name settings
    const chatControls = document.createElement('div');
    chatControls.className = 'control-group';
    chatControls.innerHTML = `
        <h4>My Chat Name Settings</h4>
        <label>My Format:
            <input type="text" id="chat-name-format" value="[USER]: " placeholder="Use [USER] for username">
        </label>
        <label>My Color:
            <input type="color" id="chat-name-color" value="#ffffff">
        </label>
        <button id="apply-chat" class="admin-button">Apply My Chat Changes</button>
    `;
    adminPanel.querySelector('.admin-controls').appendChild(chatControls);

    // Add event listeners for the new controls
    document.getElementById('apply-nametag').addEventListener('click', () => {
        window.adminSettings.nametagFormat = document.getElementById('nametag-format').value;
        window.adminSettings.nametagColor = document.getElementById('nametag-color').value;
        
        // Only update my nametag if it exists in the players Map
        const myPlayer = players.get(room.clientId);
        if (myPlayer && myPlayer.nametag) {
            const username = room.peers[room.clientId]?.username;
            if (username) {
                // Remove old nametag
                if (myPlayer.nametag.parentNode) {
                    myPlayer.nametag.parentNode.removeChild(myPlayer.nametag);
                }
                // Create new nametag with updated settings
                myPlayer.nametag = createNameTag(username);
            }
        }
    });

    document.getElementById('apply-chat').addEventListener('click', () => {
        window.adminSettings.chatFormat = document.getElementById('chat-name-format').value;
        window.adminSettings.chatColor = document.getElementById('chat-name-color').value;
    });

    particleEffect.addEventListener('change', (e) => {
        if (!window.adminSettings) window.adminSettings = {};
        window.adminSettings.particleEffect = e.target.value;
        
        // Update particle system based on selected effect
        if (particleSystem) {
            const effect = particleEffects[e.target.value];
            if (effect) {
                particleMaterial.size = effect.size;
                particles = []; // Clear existing particles
            }
        }
    });
}

if (isAdmin) {
    // Add monster mode controls
    const toggleMonster = document.getElementById('toggle-monster');
    const monsterControls = document.getElementById('monster-controls');
    const monsterScale = document.getElementById('monster-scale');
    const monsterColor = document.getElementById('monster-color');
    const monsterGlow = document.getElementById('monster-glow');
    
    toggleMonster.addEventListener('click', () => {
        isMonsterMode = !isMonsterMode;
        monsterControls.style.display = isMonsterMode ? 'block' : 'none';
        
        if (isMonsterMode) {
            // Apply monster appearance
            character.scale.setScalar(parseFloat(monsterScale.value));
            if (headMesh) headMesh.material.color.set(monsterColor.value);
            if (postProcessPass) {
                postProcessPass.uniforms.tintColor.value = new THREE.Color(monsterColor.value);
                postProcessPass.uniforms.tintAmount.value = parseFloat(monsterGlow.value);
            }
        } else {
            // Reset appearance
            character.scale.setScalar(1);
            if (headMesh) headMesh.material.color.set('#ffffff');
            if (postProcessPass) {
                postProcessPass.uniforms.tintAmount.value = 0;
            }
        }
        
        room.updatePresence({
            isMonster: isMonsterMode,
            monsterScale: parseFloat(monsterScale.value),
            monsterColor: monsterColor.value,
            monsterGlow: parseFloat(monsterGlow.value)
        });
    });
    
    monsterScale.addEventListener('input', (e) => {
        if (isMonsterMode) {
            character.scale.setScalar(parseFloat(e.target.value));
            room.updatePresence({ monsterScale: parseFloat(e.target.value) });
        }
    });
    
    monsterColor.addEventListener('input', (e) => {
        if (isMonsterMode && headMesh) {
            headMesh.material.color.set(e.target.value);
            room.updatePresence({ monsterColor: e.target.value });
        }
    });
    
    monsterGlow.addEventListener('input', (e) => {
        if (isMonsterMode && postProcessPass) {
            postProcessPass.uniforms.tintAmount.value = parseFloat(e.target.value);
            room.updatePresence({ monsterGlow: parseFloat(e.target.value) });
        }
    });

    // Add system message controls
    const systemMessage = document.getElementById('system-message');
    const sendSystemMessage = document.getElementById('send-system-message');
    
    sendSystemMessage.addEventListener('click', () => {
        if (systemMessage.value.trim()) {
            room.send({
                type: 'chat',
                message: systemMessage.value,
                channel: 'system'
            });
            systemMessage.value = '';
        }
    });

    // Add fly mode controls
    const toggleFly = document.getElementById('toggle-fly');
    const flyControls = document.getElementById('fly-controls');
    const flySpeedInput = document.getElementById('fly-speed');
    const verticalSpeedInput = document.getElementById('vertical-speed');

    toggleFly.addEventListener('click', () => {
        isFlyMode = !isFlyMode;
        flyControls.style.display = isFlyMode ? 'block' : 'none';
        gravity = isFlyMode ? 0 : 20;
        characterVelocity.set(0, 0, 0);
    });

    flySpeedInput.addEventListener('input', (e) => {
        flySpeed = parseFloat(e.target.value);
    });

    verticalSpeedInput.addEventListener('input', (e) => {
        verticalSpeed = parseFloat(e.target.value);
    });
}

let isMonsterMode = false;
let isFlyMode = false;
let flySpeed = 10;
let verticalSpeed = 10;

// Mobile controls setup
const mobileControls = document.getElementById('mobile-controls');
const joystickArea = document.getElementById('joystick-area');
const joystick = document.getElementById('joystick');
const joystickHead = document.getElementById('joystick-head');
const mobileJump = document.getElementById('mobile-jump');

if (isMobile) {
    mobileControls.style.display = 'block';
    
    let joystickActive = false;
    let joystickOrigin = { x: 0, y: 0 };
    let currentJoystickPos = { x: 0, y: 0 };

    // Joystick touch handlers
    joystickArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joystickArea.getBoundingClientRect();
        joystickOrigin.x = touch.clientX - rect.left;
        joystickOrigin.y = touch.clientY - rect.top;
        joystickActive = true;
        
        // Center the joystick on initial touch
        joystick.style.left = `${joystickOrigin.x - joystick.offsetWidth/2}px`;
        joystick.style.top = `${joystickOrigin.y - joystick.offsetHeight/2}px`;
    });

    joystickArea.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const rect = joystickArea.getBoundingClientRect();
        currentJoystickPos.x = touch.clientX - rect.left;
        currentJoystickPos.y = touch.clientY - rect.top;
        
        // Calculate joystick head position
        const deltaX = currentJoystickPos.x - joystickOrigin.x;
        const deltaY = currentJoystickPos.y - joystickOrigin.y;
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 35);
        const angle = Math.atan2(deltaY, deltaX);
        
        const headX = distance * Math.cos(angle);
        const headY = distance * Math.sin(angle);
        
        joystickHead.style.transform = `translate(${headX}px, ${headY}px)`;
        
        // Update movement keys based on joystick position
        const threshold = 10;
        keys.w = deltaY < -threshold;
        keys.s = deltaY > threshold;
        keys.a = deltaX < -threshold;
        keys.d = deltaX > threshold;
    });

    joystickArea.addEventListener('touchend', () => {
        joystickActive = false;
        joystickHead.style.transform = '';
        keys.w = keys.a = keys.s = keys.d = false;
    });

    // Mobile jump button
    mobileJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[' '] = true;
    });

    mobileJump.addEventListener('touchend', () => {
        keys[' '] = false;
    });

    // Mobile camera control
    let lastTouchX = 0;
    let lastTouchY = 0;
    
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1 && !e.target.closest('#joystick-area, #mobile-jump')) {
            const touch = e.touches[0];
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && !e.target.closest('#joystick-area, #mobile-jump')) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - lastTouchX;
            const deltaY = touch.clientY - lastTouchY;
            
            cameraYaw -= deltaX * 0.01;
            cameraPitch += deltaY * 0.01;
            cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch));
            
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
        }
    });
}

// Chat system variables
const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSettingsPanel = document.getElementById('chat-settings-panel');
const chatSettingsToggle = document.getElementById('chat-settings-toggle');
const settingsInputs = chatSettingsPanel.querySelectorAll('[data-setting]');
const generateSettingsStringButton = document.getElementById('generate-settings-string');
const settingsStringOutput = document.getElementById('settings-string-output');

// --- Chat system variables ---
const mutedUsers = new Set();
let currentChannel = 'general';

// --- Anti-spam variables ---
let lastMessageTime = 0;
const messageCooldown = 1500; // 1.5 seconds cooldown between messages

// --- Chat Settings ---
const defaultChatSettings = {
    "containerWidth": 435,
    "messagesHeight": 165,
    "containerTop": 10,
    "containerLeft": 10,
    "containerBgColor": "#000000",
    "containerBgOpacity": 0.61,
    "containerBorderColor": "#ffffff",
    "containerBorderOpacity": 0,
    "containerBorderRadius": 0,
    "fontFamily": "'Source Sans Pro', sans-serif",
    "textSize": 21,
    "textColor": "#ffffff",
    "usernameColor": "#4caf50",
    "systemTextColor": "#ffffff",
    "helpTextColor": "#87ceeb",
    "inputPadding": 20,
    "inputBgColor": "#ffffff",
    "inputBgOpacity": 0.33,
    "inputBorderColor": "#ffffff",
    "inputBorderOpacity": 0,
    "inputBorderRadius": 0,
    "inputText color": "#ffffff",
    "inputTextOpacity": 0
};

let currentChatSettings = { ...defaultChatSettings };

// Function to apply chat settings
function applyChatSettings(settings) {
    chatContainer.style.width = `${settings.containerWidth}px`;
    chatContainer.style.height = 'auto';
    chatContainer.style.top = `${settings.containerTop}px`;
    chatContainer.style.left = `${settings.containerLeft}px`;
    chatContainer.style.backgroundColor = `rgba(${hexToRgb(settings.containerBgColor).r}, ${hexToRgb(settings.containerBgColor).g}, ${hexToRgb(settings.containerBgColor).b}, ${settings.containerBgOpacity})`;
    chatContainer.style.borderColor = `rgba(${hexToRgb(settings.containerBorderColor).r}, ${hexToRgb(settings.containerBorderColor).g}, ${hexToRgb(settings.containerBorderColor).b}, ${settings.containerBorderOpacity})`;
    chatContainer.style.borderRadius = `${settings.containerBorderRadius}px`;
    chatContainer.style.fontFamily = settings.fontFamily;

    chatMessages.style.height = `${settings.messagesHeight}px`;
    chatMessages.style.color = settings.textColor;
    chatMessages.style.fontSize = `${settings.textSize}px`;
    chatInput.style.fontSize = `${settings.textSize}px`;

    chatMessages.querySelectorAll('.chat-username').forEach(el => el.style.color = settings.usernameColor);
    chatMessages.querySelectorAll('.system-message').forEach(el => el.style.color = settings.systemTextColor);
    chatMessages.querySelectorAll('.help-message').forEach(el => el.style.color = settings.helpTextColor);
    chatMessages.querySelectorAll('.chat-message:not(.system-message):not(.help-message) .chat-text').forEach(el => el.style.color = settings.textColor);
    chatMessages.querySelectorAll('.chat-message').forEach(el => el.style.fontSize = `${settings.textSize}px`);


    chatInput.style.padding = `${settings.inputPadding}px`;
    chatInput.style.backgroundColor = `rgba(${hexToRgb(settings.inputBgColor).r}, ${hexToRgb(settings.inputBgColor).g}, ${hexToRgb(settings.inputBgColor).b}, ${settings.inputBgOpacity})`;
    chatInput.style.borderColor = `rgba(${hexToRgb(settings.inputBorderColor).r}, ${hexToRgb(settings.inputBorderColor).g}, ${hexToRgb(settings.inputBorderColor).b}, ${settings.inputBorderOpacity})`;
    chatInput.style.borderRadius = `${settings.inputBorderRadius}px`;

    const inputTextColorRgb = hexToRgb(settings['inputText color']);
    chatInput.style.color = `rgba(${inputTextColorRgb.r}, ${inputTextColorRgb.g}, ${inputTextColorRgb.b}, ${settings.inputTextOpacity})`;
    chatInput.style.fontWeight = 'bold';

    chatInput.style.fontFamily = settings.fontFamily;
}

// Helper to convert hex to rgb
function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

// Function to toggle chat settings panel visibility
function toggleChatSettings() {
    const isVisible = chatSettingsPanel.style.display === 'block';
    chatSettingsPanel.style.display = isVisible ? 'none' : 'block';
}

// Function to update chat settings from controls
function updateSettingsFromControls() {
    settingsInputs.forEach(input => {
        const settingName = input.dataset.setting;
        let value;
        if (input.type === 'range') {
            value = parseFloat(input.value);
        } else {
            value = input.value;
        }
        currentChatSettings[settingName] = value;
    });
    applyChatSettings(currentChatSettings);
}

// Function to populate controls from current settings
function populateControlsFromSettings() {
    settingsInputs.forEach(input => {
        const settingName = input.dataset.setting;
        if (currentChatSettings.hasOwnProperty(settingName)) {
            input.value = currentChatSettings[settingName];
        }
    });
}

// Add welcome message
const addSystemMessage = (message) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message system-message';
    messageDiv.textContent = message;
    messageDiv.style.fontSize = `${currentChatSettings.textSize}px`; // Apply font size
    messageDiv.style.color = currentChatSettings.systemTextColor; // Apply color
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Add help message
const showHelpMessage = () => {
    const helpMessages = [
        "These are basic chat commands.",
        "/c <channel> : switch channel in menu tabs.",
        "/whisper <speaker> or /w <speaker> : open private message channel with speaker.",
        "/mute <speaker> : mute a speaker.",
        "/unmute <speaker> : unmute a speaker.",
        "/e dance : perform default dance",
        "/e dance1 : perform dance style 1",
        "/e dance2 : perform dance style 2",
        "/e dance3 : perform dance style 3"
    ];

    helpMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message help-message';
        messageDiv.textContent = msg;
        messageDiv.style.fontSize = `${currentChatSettings.textSize}px`;
        messageDiv.style.color = currentChatSettings.helpTextColor;
        chatMessages.appendChild(messageDiv);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Chat commands handler
const handleChatCommand = (input) => {
    const args = input.split(' ');
    const command = args[0].toLowerCase();

    switch (command) {
        case '/?':
        case '/help':
            showHelpMessage();
            return true;

        case '/c':
            if (args[1]) {
                currentChannel = args[1];
                addSystemMessage(`Switched to channel: ${args[1]}`);
            }
            return true;

        case '/w':
        case '/whisper':
            if (args[1]) {
                addSystemMessage(`Started private chat with ${args[1]}`);
            }
            return true;

        case '/mute':
            if (args[1]) {
                mutedUsers.add(args[1]);
                addSystemMessage(`Muted ${args[1]}`);
            }
            return true;

        case '/unmute':
            if (args[1]) {
                mutedUsers.delete(args[1]);
                addSystemMessage(`Unmuted ${args[1]}`);
            }
            return true;

        case '/e':
            if (args[1]) {
                const emote = args[1].toLowerCase();
                switch (emote) {
                    case 'dance':
                        startDance('default');
                        return true;
                    case 'dance1':
                        startDance('dance1');
                        return true;
                    case 'dance2':
                        startDance('dance2');
                        return true;
                    case 'dance3':
                        startDance('dance3');
                        return true;
                }
            }
            return false;

        default:
            return false;
    }
};

// Handle sending chat messages
chatInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter' && chatInput.value.trim()) {
        event.preventDefault();

        // --- Anti-spam check ---
        const currentTime = Date.now();
        if (currentTime - lastMessageTime < messageCooldown) {
            addSystemMessage(`Please wait ${Math.ceil((lastMessageTime + messageCooldown - currentTime) / 1000)} seconds before sending another message.`);
            return;
        }
        // --- End anti-spam check ---


        const message = chatInput.value.trim();
        chatInput.value = '';

        if (document.activeElement !== chatInput) {
            return;
        }

        if (message.startsWith('/')) {
            if (!handleChatCommand(message)) {
                addSystemMessage('Unknown command. Use /? or /help for command list.');
            } else {
                 lastMessageTime = currentTime; // Commands also respect cooldown
            }
            return;
        }

        const userIsAdmin = ADMIN_USERS.includes(room.peers[room.clientId]?.username);
        const userIsOwner = room.peers[room.clientId]?.username === 'hardcore'; 

        if (userIsAdmin || userIsOwner) { 
            // Bypass filter for admins and owner
            lastMessageTime = currentTime;
            room.send({
                type: 'chat',
                message: message,
                channel: currentChannel
            });
        } else {
            // Regular users go through filter
            try {
                chatInput.disabled = true;
                chatInput.placeholder = "Checking message...";
                const completion = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `Analyze the following message for inappropriate content (e.g., hate speech, harassment, explicit material, etc.). Respond directly with JSON, following this JSON schema, and no other text: { "isAppropriate": boolean; }`,
                        },
                        {
                            role: "user",
                            content: `The message is: "${message}"`,
                        },
                    ],
                    json: true,
                });

                const result = JSON.parse(completion.content);
                const isAppropriate = result.isAppropriate;

                if (isAppropriate) {
                     lastMessageTime = currentTime; // Update last message time only if sent
                    room.send({
                        type: 'chat',
                        message: message,
                        channel: currentChannel
                    });
                } else {
                    addSystemMessage("Your message was blocked by the content filter.");
                }

            } catch (error) {
                console.error("AI filter error:", error);
                addSystemMessage("Failed to process message through content filter. Message blocked.");
            } finally {
                chatInput.disabled = false;
                chatInput.placeholder = "Press Enter to chat...";
            }
        }
    }
});

// Event listeners for chat settings
chatSettingsToggle.addEventListener('click', toggleChatSettings);

settingsInputs.forEach(input => {
    input.addEventListener('input', updateSettingsFromControls);
    if (input.type === 'color') {
        input.addEventListener('change', updateSettingsFromControls);
    }
});

generateSettingsStringButton.addEventListener('click', () => {
    settingsStringOutput.value = JSON.stringify(currentChatSettings, null, 2);
});

// Initial population and application of settings
populateControlsFromSettings();
applyChatSettings(currentChatSettings);
addSystemMessage("Chat '/?' or '/help' for a list of chat commands.");

// Handle receiving messages
room.onmessage = (event) => {
    const data = event.data;
    switch (data.type) {
        case "disconnected":
            if (players.has(data.clientId)) {
                // Remove nametag
                const playerData = players.get(data.clientId);
                if (playerData.nametag && playerData.nametag.parentNode) {
                    playerData.nametag.parentNode.removeChild(playerData.nametag);
                }
                
                // Remove chat bubble
                if (chatBubbles.has(data.clientId)) {
                    const oldBubble = chatBubbles.get(data.clientId);
                    if (oldBubble && oldBubble.parentNode) {
                        oldBubble.parentNode.removeChild(oldBubble);
                    }
                    chatBubbles.delete(data.clientId);
                }

                // Remove all mesh objects and materials before removing character
                const character = playerData.character;
                character.traverse((child) => {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => mat.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                });

                // Remove character from scene
                scene.remove(character);
                players.delete(data.clientId);
            }
            break;

        case "chat":
            const senderUsername = room.peers[data.clientId]?.username;
            if (senderUsername && mutedUsers.has(senderUsername)) {
                return;
            }

            const rawUsername = senderUsername || 'Unknown'; // Keep raw for comparisons
            const safeUsername = escapeHtml(rawUsername);
            const safeMessage = escapeHtml(data.message);

            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message';

            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'chat-username';

            const textSpan = document.createElement('span');
            textSpan.className = 'chat-text';
            textSpan.textContent = safeMessage;

            let usernameTextContent;

            if (rawUsername === 'hardcore') { 
                usernameSpan.style.color = '#ff0000';
                usernameTextContent = `👑 [OWNER] ${safeUsername}:`;
            } else if (ADMIN_USERS.includes(rawUsername)) { 
                usernameSpan.style.color = '#ff4444';
                usernameTextContent = `[ADMIN] ${safeUsername}:`;
            } else if (data.clientId === room.clientId && window.adminSettings?.chatFormat && typeof window.adminSettings.chatColor !== 'undefined') {
                // User's own message with admin format settings
                usernameSpan.style.color = window.adminSettings.chatColor;
                // adminSettings.chatFormat is admin input. By using textContent, any HTML in it will be literal.
                usernameTextContent = window.adminSettings.chatFormat.replace('[USER]', safeUsername);
                // Ensure format ends with a colon if not already present, or decide format must include it.
                // For simplicity, let's assume the format string (e.g., "[USER]:" or "The Great [USER] says:") handles this.
            } else {
                // Standard user message
                // Default color will be applied by currentChatSettings.usernameColor later
                usernameTextContent = `${safeUsername}:`;
            }
            usernameSpan.textContent = usernameTextContent;

            messageDiv.appendChild(usernameSpan);
            // Add a space between username and message text using a text node
            messageDiv.appendChild(document.createTextNode(' '));
            messageDiv.appendChild(textSpan);
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Apply general chat settings (font size, default colors if not overridden)
            // Ensure the specific color set above is not overridden by currentChatSettings.usernameColor unless it's the default case
            if (!usernameSpan.style.color) { // Only apply default if no specific color was set
                 usernameSpan.style.color = currentChatSettings.usernameColor;
            }
            textSpan.style.color = currentChatSettings.textColor;
            messageDiv.style.fontSize = `${currentChatSettings.textSize}px`;


            if (data.clientId !== room.clientId) {
                if (players.has(data.clientId)) {
                    if (chatBubbles.has(data.clientId)) {
                        const oldBubble = chatBubbles.get(data.clientId);
                        if (oldBubble && oldBubble.parentNode) {
                            oldBubble.parentNode.removeChild(oldBubble);
                        }
                    }
                    
                    const bubble = createChatBubble(safeMessage);
                    chatBubbles.set(data.clientId, bubble);
                }
            }
            break;

        case "emote":
            if (players.has(data.clientId)) {
                const player = players.get(data.clientId);
                player.currentDance = data.dance;
                player.danceStartTime = performance.now() / 1000; // Convert to seconds
                
                // Reset limb rotations when dance changes
                if (player.limbs) {
                    const { leftArm, rightArm, leftLeg, rightLeg } = player.limbs;
                    if (leftArm) leftArm.rotation.set(0, 0, 0);
                    if (rightArm) rightArm.rotation.set(0, 0, 0);
                    if (leftLeg) leftLeg.rotation.set(0, 0, 0);
                    if (rightLeg) rightLeg.rotation.set(0, 0, 0);
                }
            }
            break;

        case "kick":
            if (data.targetId === room.clientId) {
                window.location.reload(); // Force reload for kicked player
            }
            break;
    }
};

const players = new Map(); 
const chatBubbles = new Map();

room.subscribePresence((presence) => {
    // First, remove any players that are no longer in the presence data
    const currentClientIds = new Set(Object.keys(presence));
    for (const [clientId, player] of players.entries()) {
        if (!currentClientIds.has(clientId)) {
            // Remove player if they're no longer in presence data
            if (player.nametag && player.nametag.parentNode) {
                player.nametag.parentNode.removeChild(player.nametag);
            }
            if (chatBubbles.has(clientId)) {
                const bubble = chatBubbles.get(clientId);
                if (bubble && bubble.parentNode) {
                    bubble.parentNode.removeChild(bubble);
                }
                chatBubbles.delete(clientId);
            }
            scene.remove(player.character);
            players.delete(clientId);
        }
    }

    // Then handle current players
    for (const [clientId, playerState] of Object.entries(presence)) {
        // Skip creating/updating player object for local player
        if (clientId === room.clientId) continue;

        if (!players.has(clientId)) {
            const playerCharacter = createPlayerCharacter(clientId); 
            if (!playerCharacter) continue; 
            
            const username = room.peers[clientId]?.username || 'Unknown';
            const nametag = createNameTag(username);
            
            scene.add(playerCharacter);
            players.set(clientId, { 
                character: playerCharacter, 
                nametag, 
                currentDance: null, 
                danceStartTime: 0,
                limbs: {
                    leftArm: playerCharacter.children.find(c => c instanceof THREE.Group && c.position.x === -1.5 && c.position.y === 1),
                    rightArm: playerCharacter.children.find(c => c instanceof THREE.Group && c.position.x === 1.5 && c.position.y === 1),
                    leftLeg: playerCharacter.children.find(c => c instanceof THREE.Group && c.position.x === -0.5 && c.position.y === -1),
                    rightLeg: playerCharacter.children.find(c => c instanceof THREE.Group && c.position.x === 0.5 && c.position.y === -1)
                },
                lastPosition: new THREE.Vector3()
            });
        }

        const player = players.get(clientId);

        // Update animations
        if (playerState.isMoving || playerState.isJumping) {
            // Store last position for movement detection
            if (!player.lastPosition) {
                player.lastPosition = new THREE.Vector3();
            }
            
            // Calculate horizontal movement
            const isMovingHorizontally = player.lastPosition.distanceToSquared(
                new THREE.Vector3(playerState.position.x, 0, playerState.position.z)
            ) > 0.001;

            // Update limb animations based on movement state
            if (player.limbs) {
                const { leftArm, rightArm, leftLeg, rightLeg } = player.limbs;
                
                if (playerState.isJumping) {
                    // Jump animation
                    const armJumpRotation = Math.PI;
                    leftArm.rotation.x = armJumpRotation;
                    rightArm.rotation.x = armJumpRotation;
                    leftLeg.rotation.x = 0;
                    rightLeg.rotation.x = 0;
                } else if (isMovingHorizontally) {
                    // Walking animation
                    const walkingAngle = (Date.now() % 1000) / 1000 * Math.PI * 2;
                    const maxSwingAngle = 1.17;
                    
                    leftArm.rotation.x = Math.sin(walkingAngle) * maxSwingAngle;
                    rightArm.rotation.x = Math.sin(walkingAngle + Math.PI) * maxSwingAngle;
                    leftLeg.rotation.x = Math.sin(walkingAngle + Math.PI) * maxSwingAngle;
                    rightLeg.rotation.x = Math.sin(walkingAngle) * maxSwingAngle;
                } else {
                    // Reset to idle position
                    leftArm.rotation.x = 0;
                    rightArm.rotation.x = 0;
                    leftLeg.rotation.x = 0;
                    rightLeg.rotation.x = 0;
                }
            }

            // Update last position
            player.lastPosition.copy(new THREE.Vector3(playerState.position.x, playerState.position.y, playerState.position.z));
        }

        // Update colors if they changed
        if (playerState.torsoColor) {
            const torso = player.character.children.find(child => child instanceof THREE.Mesh);
            if (torso && torso.material) {
                torso.material.color.set(playerState.torsoColor);
            }
        }
        
        if (playerState.armsColor) {
            const leftArm = player.limbs.leftArm?.children[0];
            const rightArm = player.limbs.rightArm?.children[0];
            if (leftArm?.material) leftArm.material.color.set(playerState.armsColor);
            if (rightArm?.material) rightArm.material.color.set(playerState.armsColor);
        }
        
        if (playerState.legsColor) {
            const leftLeg = player.limbs.leftLeg?.children[0];
            const rightLeg = player.limbs.rightLeg?.children[0];
            if (leftLeg?.material) leftLeg.material.color.set(playerState.legsColor);
            if (rightLeg?.material) rightLeg.material.color.set(playerState.legsColor);
        }

        // Update head color if changed
        if (playerState.headColor && player.character) {
            player.character.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material.map === headTexture) {
                    child.material.color.set(playerState.headColor);
                }
            });
        }

        // Update position and rotation
        if (playerState.position) {
            player.character.position.set(
                playerState.position.x,
                playerState.position.y,
                playerState.position.z
            );
        }
        
        if (playerState.rotation) {
            player.character.rotation.set(
                playerState.rotation._x,
                playerState.rotation._y,
                playerState.rotation._z,
                'YXZ'
            );
        }

        // Update character scale
        if (playerState.characterScale) {
            player.character.scale.setScalar(playerState.characterScale);
        }
        
        // Update torso scale
        if (playerState.torsoScale) {
            const torso = player.character.children.find(child => child instanceof THREE.Mesh);
            if (torso) {
                torso.scale.set(playerState.torsoScale, playerState.torsoScale, 1);
            }
        }
        
        if (playerState.isMonster) {
            player.character.scale.setScalar(playerState.monsterScale || 2);
            player.character.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material.map === headTexture) {
                    child.material.color.set(playerState.monsterColor || '#ff0000');
                }
            });
        }
    }
});

function createPlayerCharacter(clientId) {
    if (clientId === room.clientId) {
        return null;
    }
    
    const playerCharacter = new THREE.Group();
    
    // Use ADMIN_USERS const
    const isSpecialUser = ADMIN_USERS.includes(room.peers[clientId]?.username) || room.peers[clientId]?.username === 'hardcore'; 
    
    const torsoGeometry = new RoundedBoxGeometry(2, 2, 1, 1, 0.055125 * 1.1025);
    const torsoMaterial = new THREE.MeshPhongMaterial({
        color: isSpecialUser ? new THREE.Color(1, 0, 0) : 
            new THREE.Color(23 / 255, 107 / 255, 170 / 255), 
        flatShading: true,
        transparent: true,
        opacity: 1.0
    });
    
    const torso = new THREE.Mesh(
        torsoGeometry, 
        torsoMaterial
    );
    torso.castShadow = true;
    playerCharacter.add(torso);

    const armGeometry = new RoundedBoxGeometry(1, 2, 1, 1, 0.055125 * 1.1025);
    const armMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(244 / 255, 204 / 255, 67 / 255),
        flatShading: true,
        transparent: true,
        opacity: 1.0
    });

    const leftArmPivot = new THREE.Group();
    const leftArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    leftArmMesh.position.y = -1;
    leftArmMesh.castShadow = true;
    leftArmPivot.add(leftArmMesh);
    leftArmPivot.position.set(-1.5, 1, 0);
    leftArmPivot.rotation.order = 'YXZ';
    playerCharacter.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    const rightArmMesh = new THREE.Mesh(armGeometry, armMaterial);
    rightArmMesh.position.y = -1;
    rightArmMesh.castShadow = true;

    rightArmPivot.add(rightArmMesh);
    rightArmPivot.position.set(1.5, 1, 0);
    rightArmPivot.rotation.order = 'YXZ';
    playerCharacter.add(rightArmPivot);

    const legGeometry = new RoundedBoxGeometry(1, 2, 1, 1, 0.055125 * 1.1025);
    const legMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(165 / 255, 188 / 255, 80 / 255),
        flatShading: true,
        transparent: true,
        opacity: 1.0
    });

    const leftLegPivot = new THREE.Group();
    const leftLegMesh = new THREE.Mesh(legGeometry, legMaterial);
    leftLegMesh.position.y = -1;
    leftLegMesh.castShadow = true;
    leftLegPivot.add(leftLegMesh);
    leftLegPivot.position.set(-0.5, -1, 0);
    leftLegPivot.rotation.order = 'YXZ';
    playerCharacter.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    const rightLegMesh = new THREE.Mesh(legGeometry, legMaterial);
    rightLegMesh.position.y = -1;
    rightLegPivot.add(rightLegMesh);
    rightLegPivot.position.set(0.5, -1, 0);
    rightLegPivot.rotation.order = 'YXZ';
    playerCharacter.add(rightLegPivot);

    const objLoader = new OBJLoader();
    objLoader.load('Bighead.obj', (loadedHead) => {
        loadedHead.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Use the already loaded headTexture
                child.material = new THREE.MeshPhongMaterial({
                    map: headTexture,
                    flatShading: false,
                    transparent: true,
                    opacity: 1.0
                });
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        loadedHead.scale.set(0.6, 0.6, 0.6);
        loadedHead.position.copy(initialHeadOffset);

        playerCharacter.add(loadedHead);
    });

    return playerCharacter;
}

let gamepad = null;
const gamepadStates = new Map();
const GAMEPAD_DEADZONE = 0.1;

function updateGamepad() {
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
        if (!gp) continue;
        
        // Store initial state for buttons
        if (!gamepadStates.has(gp.index)) {
            gamepadStates.set(gp.index, new Array(gp.buttons.length).fill(false));
        }
        
        // Update gamepad reference to most recently used one
        gamepad = gp;
        
        // Get the stored button states
        const buttonStates = gamepadStates.get(gp.index);
        
        // Check all buttons
        for (let i = 0; i < gp.buttons.length; i++) {
            const isPressed = gp.buttons[i].pressed;
            // Button state changed from not pressed to pressed
            if (isPressed && !buttonStates[i]) {
                handleGamepadButtonDown(i);
            }
            // Update stored state
            buttonStates[i] = isPressed;
        }
        
        // Handle analog sticks
        handleGamepadAxes(gp);
    }
}

function handleGamepadButtonDown(buttonIndex) {
    switch (buttonIndex) {
        case 0: // A button - Jump
            keys[' '] = true;
            setTimeout(() => keys[' '] = false, 100);
            break;
        case 1: // B button - Dance
            startDance('default');
            break;
        case 2: // X button - Dance 2
            startDance('dance1');
            break;
        case 3: // Y button - Dance 3
            startDance('dance2');
            break;
        case 9: // Start button - Toggle music
            if (isMusicPlaying) {
                backgroundMusic.pause();
            } else {
                backgroundMusic.play();
            }
            isMusicPlaying = !isMusicPlaying;
            break;
    }
}

function handleGamepadAxes(gp) {
    // Left stick
    const leftX = Math.abs(gp.axes[0]) > GAMEPAD_DEADZONE ? gp.axes[0] : 0;
    const leftY = Math.abs(gp.axes[1]) > GAMEPAD_DEADZONE ? gp.axes[1] : 0;
    
    // Right stick
    const rightX = Math.abs(gp.axes[2]) > GAMEPAD_DEADZONE ? gp.axes[2] : 0;
    const rightY = Math.abs(gp.axes[3]) > GAMEPAD_DEADZONE ? gp.axes[3] : 0;
    
    // Movement (Left stick)
    keys.a = leftX < -GAMEPAD_DEADZONE;
    keys.d = leftX > GAMEPAD_DEADZONE;
    keys.w = leftY < -GAMEPAD_DEADZONE;
    keys.s = leftY > GAMEPAD_DEADZONE;
    
    // Camera (Right stick)
    if (Math.abs(rightX) > GAMEPAD_DEADZONE || Math.abs(rightY) > GAMEPAD_DEADZONE) {
        cameraYaw -= rightX * 0.05;
        cameraPitch += rightY * 0.05;
        cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch));
    }
}

// Add gamepad connected/disconnected event listeners
window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connected:", e.gamepad);
    gamepadStates.set(e.gamepad.index, new Array(e.gamepad.buttons.length).fill(false));
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnected:", e.gamepad);
    gamepadStates.delete(e.gamepad.index);
    if (gamepad && gamepad.index === e.gamepad.index) {
        gamepad = null;
    }
});

// Set up post-processing composer
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Custom shader for post-processing (Saturation, Contrast, Tint)
const PostProcessShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'saturation': { value: 1.0 },
        'contrast': { value: 1.0 },
        'tintColor': { value: new THREE.Color(0x000000) },
        'tintAmount': { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float saturation;
        uniform float contrast;
        uniform vec3 tintColor;
        uniform float tintAmount;

        varying vec2 vUv;

        void main() {
            vec4 texel = texture2D( tDiffuse, vUv );
            vec3 color = texel.rgb;

            color = (color - 0.5) * contrast + 0.5;

            vec3 luminance = vec3(0.2126, 0.7152, 0.0722);
            vec3 gray = vec3(dot(color, luminance));
            color = mix(gray, color, saturation);

            color = mix(color, tintColor, tintAmount);

            gl_FragColor = vec4(color, texel.a);
        }
    `
};

const postProcessPass = new ShaderPass(PostProcessShader);
composer.addPass(postProcessPass);

const GradientShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'topColor': { value: new THREE.Color(0.4, 0.85, 1.0) },
        'bottomColor': { value: new THREE.Color(0.7, 0.95, 1.0) },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;

        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);

            vec3 gradientColor = mix(bottomColor, topColor, vUv.y);

            float isSky = float(distance(texel.rgb, vec3(0.5, 0.9, 1.0)) < 0.01);
            vec3 finalColor = mix(texel.rgb, gradientColor, isSky);

            gl_FragColor = vec4(finalColor, texel.a);
        }
    `
};

const gradientPass = new ShaderPass(GradientShader);
composer.addPass(gradientPass);

// Skybox definitions
const skyboxes = {
    "Blue Sky": new THREE.Color(0.5, 0.7, 1.0),
    "Cloud Skybox": [
        '/right.png',
        '/left.png',
        '/top (1).png',
        '/bottom.png',
        '/front.png',
        '/back.png'
    ],
    "skybox": [
        '/right.png',
        '/left.png',
        '/top (1).png',
        '/bottom.png',
        '/front.png',
        '/back.png'
    ],
    "texture from sky": [
        '/right.png',
        '/left.png',
        '/top (1).png',
        '/bottom.png',
        '/front.png',
        '/back.png'
    ],
    "Cyan Gradient": new THREE.Color(0.5, 0.9, 1.0),
};

// Function to load and set the skybox texture or color
function loadSkybox(skyboxName) {
    console.log(`Attempting to load skybox: "${skyboxName}"`);
    const skyboxConfig = skyboxes[skyboxName];

    if (!skyboxConfig) {
        console.error(`Skybox "${skyboxName}" not found in configuration.`);
        scene.background = null;
        return;
    }

    scene.background = new THREE.Color(0.5, 0.9, 1.0);

    if (gradientPass && gradientPass.uniforms) {
        gradientPass.uniforms.topColor.value.setRGB(0.4, 0.85, 1.0);
        gradientPass.uniforms.bottomColor.value.setRGB(0.7, 0.95, 1.0);
    }
}

loadSkybox("Cyan Gradient");

// Define a conversion factor for "studs" to Three.js units
const STUDS_TO_UNITS = 0.25;

// Declare head variable and a variable for the head mesh itself
let head = null;
let headMesh = null;

// Variables for limb pivot groups and meshes
let leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot;
let leftArmMesh, rightArmMesh, leftLegMesh, rightLegMesh;

// Variable for the camera target object
let cameraTarget = null;
const cameraTargetWorldPosition = new THREE.Vector3();

// Lighting variables
let ambientLight;
let directionalLight;

// Floor variables
let floor;
let floorMaterial;
let floorTexture;
let initialFloorColor = new THREE.Color(99 / 255, 95 / 255, 98 / 255);
const floorHeight = -3;
const characterBaseOffset = -3;

// Collision Boundaries
const floorBoundaries = {
    minX: -50,
    maxX: 50,
    minZ: -50,
    maxZ: 50
};
const voidThreshold = floorHeight - 20;

// Spawn point
const spawnPoint = new THREE.Vector3(0, floorHeight - characterBaseOffset + 0.01, 0);

// Character properties
const initialHeadOffset = new THREE.Vector3(-89.8 * STUDS_TO_UNITS, 4.1 * STUDS_TO_UNITS, 28.4 * STUDS_TO_UNITS);
const initialHeadScale = 0.60;
const initialHeadAnchor = new THREE.Vector3(0, 0, 0);

// Physics parameters
let gravity = 20;
let characterVelocity = new THREE.Vector3(0, 0, 0);
let jumpPower = 49.6 * STUDS_TO_UNITS;

// Animation parameters
let walkingSpeed = 9.4;
let walkingAngle = 0;
let maxSwingAngle = 1.17;
const animationLerpFactor = 0.1;
const armJumpRotation = Math.PI;

// Movement parameters
let moveSpeed = 9.33;
let characterRotationSpeed = 0.11;
const firstPersonRotationSpeed = 0.2;

// Lighting parameters
const initialAmbientColor = new THREE.Color(0.54, 0.54, 0.54);
const initialAmbientIntensity = 2.55;
const initialSunColor = new THREE.Color(1.00, 1.00, 1.00);
const initialSunIntensity = 2.40;
const initialSunAzimuth = 220 * THREE.MathUtils.DEG2RAD;
const initialSunAltitude = 45 * THREE.MathUtils.DEG2RAD;

// Post-processing parameters
const initialSaturation = 0.93;
const initialContrast = 0.93;
const initialTintColor = new THREE.Color("#000000");
const initialTintAmount = 0.00;

// Floor texture parameters
const initialFloorTextureRepeat = 72;
const initialFloorBrightness = 3.00;

// --- Camera System Variables ---
let cameraDistance = 15;
let currentCameraDistance = cameraDistance;
const minCameraDistance = 0.1;
const maxCameraDistance = 30;
const zoomSpeedMouse = 0.05;

// Thresholds for transparency/first-person based on distance to camera target
const firstPersonDistance = 0.5;
const nearCharacterDistance = 3.0;

let cameraYaw = Math.PI * 1.5;
let cameraPitch = THREE.MathUtils.degToRad(15);
const minPitch = THREE.MathUtils.degToRad(-60);
const maxPitch = THREE.MathUtils.degToRad(80);
const cameraRotationSpeed = 0.005;

let isCameraRotating = false;
let previousMouseX = 0;
let previousMouseY = 0;

// Temporary variables for calculations in animate loop
const tempVector = new THREE.Vector3();
const dummy = new THREE.Object3D();

let particleSystem = null;
let particlePositions = [];
let particleColors = [];
let particleGeometry = null;
let particleMaterial = null;
const MAX_PARTICLES = 1000;
const PARTICLE_LIFETIME = 1; // seconds
let particles = [];

const particleEffects = {
    none: {
        enabled: false
    },
    sparkles: {
        color: new THREE.Color(1, 1, 1),
        size: 0.2,
        speed: 2,
        spread: 0.5,
        lifetime: 1,
        rate: 50
    },
    fire: {
        color: new THREE.Color(1, 0.5, 0),
        size: 0.3,
        speed: 3,
        spread: 0.3,
        lifetime: 0.7,
        rate: 70
    },
    rainbow: {
        color: null, // Will be dynamically set
        size: 0.25,
        speed: 2.5,
        spread: 0.4,
        lifetime: 1.2,
        rate: 60
    }
};

function initParticleSystem() {
    particleGeometry = new BufferGeometry();
    
    // Initialize arrays for particle attributes
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 3);
    
    particleGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    
    particleMaterial = new PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });
    
    particleSystem = new Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

function updateParticles(delta) {
    if (!particleSystem || !window.adminSettings?.particleEffect || 
        window.adminSettings.particleEffect === 'none') return;

    const effect = particleEffects[window.adminSettings.particleEffect];
    if (!effect) return;

    // Update existing particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.life -= delta;

        if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        // Update particle position
        particle.position.x += particle.velocity.x * delta;
        particle.position.y += particle.velocity.y * delta;
        particle.position.z += particle.velocity.z * delta;

        // Update opacity based on lifetime
        const normalizedLife = particle.life / effect.lifetime;
        particle.opacity = normalizedLife;

        // Special handling for rainbow effect
        if (window.adminSettings.particleEffect === 'rainbow') {
            const hue = (Date.now() * 0.001 + Math.random()) % 1;
            particle.color.setHSL(hue, 1, 0.5);
        }
    }

    // Create new particles if needed
    const spawnCount = effect.rate * delta;
    for (let i = 0; i < spawnCount && particles.length < MAX_PARTICLES; i++) {
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * effect.spread,
            Math.random() * effect.speed,
            (Math.random() - 0.5) * effect.spread
        );

        const particle = {
            position: character.position.clone().add(new THREE.Vector3(0, 1, 0)),
            velocity: velocity,
            life: effect.lifetime,
            opacity: 1,
            color: effect.color ? effect.color.clone() : new THREE.Color().setHSL(Math.random(), 1, 0.5)
        };

        particles.push(particle);
    }

    // Update geometry
    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);

    particles.forEach((particle, i) => {
        positions[i * 3] = particle.position.x;
        positions[i * 3 + 1] = particle.position.y;
        positions[i * 3 + 2] = particle.position.z;

        colors[i * 3] = particle.color.r;
        colors[i * 3 + 1] = particle.color.g;
        colors[i * 3 + 2] = particle.color.b;
    });

    particleGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    
    particleMaterial.opacity = 0.6;
}

// Initialize particle system after scene setup
initParticleSystem();

// Function to apply character properties based on initial values
function applyCharacterProperties() {
    if (head) {
        head.scale.set(initialHeadScale, initialHeadScale, initialHeadScale);
        head.position.copy(initialHeadOffset);
        if (headMesh) {
            headMesh.position.copy(initialHeadAnchor);
        }
    }
}

// Function to apply lighting based on initial values
function applyLighting() {
    if (ambientLight) {
        ambientLight.color.copy(initialAmbientColor);
        ambientLight.intensity = initialAmbientIntensity;
    }
    if (directionalLight) {
        directionalLight.color.copy(initialSunColor);
        directionalLight.intensity = initialSunIntensity;

        const radius = 200;
        const x = radius * Math.cos(initialSunAltitude) * Math.sin(initialSunAzimuth);
        const y = radius * Math.sin(initialSunAltitude);
        const z = radius * Math.cos(initialSunAltitude) * Math.cos(initialSunAzimuth);
        directionalLight.position.set(x, y, z);

        directionalLight.target.position.set(0, floorHeight + characterBaseOffset + 1, 0);
        directionalLight.target.updateMatrixWorld();
    }
}

// Function to apply post-processing based on initial values
function applyPostProcessing() {
    if (postProcessPass && postProcessPass.uniforms) {
        postProcessPass.uniforms.saturation.value = initialSaturation;
        postProcessPass.uniforms.contrast.value = initialContrast;
        postProcessPass.uniforms.tintColor.value = initialTintColor;
        postProcessPass.uniforms.tintAmount.value = initialTintAmount;
    }
}

// Function to apply floor texture repeat based on initial value
function applyFloorTextureRepeat() {
    if (floorTexture) {
        floorTexture.repeat.set(initialFloorTextureRepeat, initialFloorTextureRepeat);
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.needsUpdate = true;
    }
}

// Function to apply floor brightness based on initial value
function applyFloorBrightness() {
    if (floorMaterial) {
        floorMaterial.color.copy(initialFloorColor).multiplyScalar(initialFloorBrightness);
    }
}

// --- Camera System Event Listeners ---
renderer.domElement.addEventListener('mousedown', (event) => {
    if (document.activeElement !== chatInput && event.button === 2) {
        isCameraRotating = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
        event.preventDefault();
    }
});

renderer.domElement.addEventListener('mouseup', (event) => {
    if (event.button === 2) {
        isCameraRotating = false;
    }
});

renderer.domElement.addEventListener('mousemove', (event) => {
    if (isCameraRotating) {
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;
        cameraYaw -= deltaX * cameraRotationSpeed;
        cameraPitch += deltaY * cameraRotationSpeed;

        cameraPitch = Math.max(minPitch, Math.min(maxPitch, cameraPitch));

        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});

renderer.domElement.addEventListener('wheel', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom) {
        event.preventDefault();
        currentCameraDistance += event.deltaY * zoomSpeedMouse;

        currentCameraDistance = Math.max(minCameraDistance, Math.min(maxCameraDistance, currentCameraDistance));
    }
});

renderer.domElement.addEventListener('contextmenu', (event) => {
    if (event.button === 2) {
        event.preventDefault();
    }
});

// Clock for delta time
const clock = new THREE.Clock();

// Declare the keys object for tracking input
let keys = {};

// Add event listeners for keyboard input
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (document.activeElement === chatInput) {
        // Allow space in chat input
        if (key === ' ') {
            return;
        }
         // Allow Enter in chat input (handled by keypress)
        if (key === 'enter') {
             return;
        }
        // For other keys while in chat, just process them normally (like backspace, letters etc.)
        // Don't set keys[key] = true here as we don't want them to trigger game movement.
    } else {
        // Only set keys[key] for game movement when NOT in chat input
        keys[key] = true;
        if (key === ' ') {
            event.preventDefault(); // Prevent default space behavior (scrolling)
        }

        const numKey = parseInt(event.key);
        if (!isNaN(numKey)) {
            const slotIndex = (numKey === 0) ? 9 : numKey - 1;
             // Handle inventory selection here if needed
        }
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    // Always set keys[key] to false on keyup, regardless of chat input focus
    keys[key] = false;
});

// Character creation
const character = new THREE.Group();

const torsoGeometry = new RoundedBoxGeometry(2, 2, 1, 1, 0.055125 * 1.1025);
const torsoMaterial = new THREE.MeshPhongMaterial({
    color: ADMIN_USERS.includes(room.peers[room.clientId]?.username) || room.peers[room.clientId]?.username === 'hardcore' ? 
        new THREE.Color(1, 0, 0) : 
        new THREE.Color(23 / 255, 107 / 255, 170 / 255), 
    flatShading: true,
    transparent: true,
    opacity: 1.0
});
const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
torso.castShadow = true;
character.add(torso);

cameraTarget = new THREE.Object3D();
cameraTarget.position.set(0, 1.5, 0);
character.add(cameraTarget);

const armGeometry = new RoundedBoxGeometry(1, 2, 1, 1, 0.055125 * 1.1025);
const armMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(244 / 255, 204 / 255, 67 / 255),
    flatShading: true,
    transparent: true,
    opacity: 1.0
});

leftArmPivot = new THREE.Group();
leftArmMesh = new THREE.Mesh(armGeometry, armMaterial);
leftArmMesh.position.y = -1;
leftArmMesh.castShadow = true;
leftArmPivot.add(leftArmMesh);
leftArmPivot.position.set(-1.5, 1, 0);
leftArmPivot.rotation.order = 'YXZ';
character.add(leftArmPivot);

rightArmPivot = new THREE.Group();
rightArmMesh = new THREE.Mesh(armGeometry, armMaterial);
rightArmMesh.position.y = -1;
rightArmMesh.castShadow = true;

rightArmPivot.add(rightArmMesh);
rightArmPivot.position.set(1.5, 1, 0);
rightArmPivot.rotation.order = 'YXZ';
character.add(rightArmPivot);

const legGeometry = new RoundedBoxGeometry(1, 2, 1, 1, 0.055125 * 1.1025);
const legMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(165 / 255, 188 / 255, 80 / 255),
    flatShading: true,
    transparent: true,
    opacity: 1.0
});

leftLegPivot = new THREE.Group();
leftLegMesh = new THREE.Mesh(legGeometry, legMaterial);
leftLegMesh.position.y = -1;
leftLegMesh.castShadow = true;
leftLegPivot.add(leftLegMesh);
leftLegPivot.position.set(-0.5, -1, 0);
leftLegPivot.rotation.order = 'YXZ';
character.add(leftLegPivot);

rightLegPivot = new THREE.Group();
rightLegMesh = new THREE.Mesh(legGeometry, legMaterial);
rightLegMesh.position.y = -1;
rightLegPivot.add(rightLegMesh);
rightLegPivot.position.set(0.5, -1, 0);
rightLegPivot.rotation.order = 'YXZ';
character.add(rightLegPivot);

const objLoader = new OBJLoader();
objLoader.load('Bighead.obj', (loadedHead) => {
    head = loadedHead;

    head.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            headMesh = child;
            child.material = new THREE.MeshPhongMaterial({
                map: headTexture,
                flatShading: false,
                transparent: true,
                opacity: 1.0
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    applyCharacterProperties();

    character.add(head);
});

const floorGeometry = new THREE.BoxGeometry(512, 20, 512);
const floorTextureLoader = new THREE.TextureLoader();
floorTexture = floorTextureLoader.load('/74271da913ead2df3efbe300944f49a7f18dab14.png',
    () => {
        floorTexture.colorSpace = THREE.SRGBColorSpace;
        applyFloorTextureRepeat();
        floorMaterial = new THREE.MeshPhongMaterial({ map: floorTexture, color: initialFloorColor.clone() });
        floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -13;
        floor.receiveShadow = true;
        scene.add(floor);
        applyFloorBrightness();
    },
    undefined,
    (err) => {
        console.error('Error loading floor texture:', err);
        floorTexture = null;
        floorMaterial = new THREE.MeshPhongMaterial({ color: initialFloorColor.clone() });
        floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -13;
        floor.receiveShadow = true;
        scene.add(floor);
        applyFloorBrightness();
    }
);

ambientLight = new THREE.AmbientLight();
scene.add(ambientLight);

directionalLight = new THREE.DirectionalLight();
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 400;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.bias = -0.001;

scene.add(directionalLight);
scene.add(directionalLight.target);

applyLighting();
applyPostProcessing();

scene.add(character);

let lastSentPosition = new THREE.Vector3();
let lastSentRotation = new THREE.Euler();

let currentDance = null;
let danceStartTime = 0;

const danceAnimations = {
    default: {
        duration: 2,
        armLoop: (t) => ({
            left: {
                x: Math.sin(t * Math.PI * 2) * 1.5,
                y: Math.cos(t * Math.PI * 2) * 0.5,
                z: Math.sin(t * Math.PI * 2) * 0.3
            },
            right: {
                x: Math.sin(t * Math.PI * 2 + Math.PI) * 1.5,
                y: Math.cos(t * Math.PI * 2 + Math.PI) * 0.5,
                z: Math.sin(t * Math.PI * 2 + Math.PI) * 0.3
            }
        }),
        legLoop: (t) => ({
            left: {
                x: Math.sin(t * Math.PI * 2) * 0.5,
                y: 0,
                z: 0
            },
            right: {
                x: Math.sin(t * Math.PI * 2 + Math.PI) * 0.5,
                y: 0,
                z: 0
            }
        })
    },
    dance1: {
        duration: 1.5,
        armLoop: (t) => ({
            left: {
                x: Math.sin(t * Math.PI * 4) * 2,
                y: Math.cos(t * Math.PI * 2) * 0.3,
                z: 0
            },
            right: {
                x: Math.sin(t * Math.PI * 4 + Math.PI) * 2,
                y: Math.cos(t * Math.PI * 2 + Math.PI) * 0.3,
                z: 0
            }
        }),
        legLoop: (t) => ({
            left: {
                x: Math.sin(t * Math.PI * 4) * 0.3,
                y: 0,
                z: 0
            },
            right: {
                x: Math.sin(t * Math.PI * 4 + Math.PI) * 0.3,
                y: 0,
                z: 0
            }
        })
    },
    dance2: {
        duration: 2.5,
        armLoop: (t) => ({
            left: {
                x: Math.sin(t * Math.PI) * 1,
                y: Math.cos(t * Math.PI * 4) * 0.5,
                z: Math.sin(t * Math.PI * 2) * 1
            },
            right: {
                x: Math.sin(t * Math.PI + Math.PI) * 1,
                y: Math.cos(t * Math.PI * 4 + Math.PI) * 0.5,
                z: Math.sin(t * Math.PI * 2 + Math.PI) * 1
            }
        }),
        legLoop: (t) => ({
            left: {
                x: Math.sin(t * Math.PI * 2) * 0.4,
                y: Math.cos(t * Math.PI * 2) * 0.2,
                z: 0
            },
            right: {
                x: Math.sin(t * Math.PI * 2 + Math.PI) * 0.4,
                y: Math.cos(t * Math.PI * 2 + Math.PI) * 0.2,
                z: 0
            }
        })
    },
    dance3: {
        duration: 3,
        armLoop: (t) => ({
            left: {
                x: Math.sin(t * Math.PI * 2) * 2,
                y: Math.abs(Math.sin(t * Math.PI * 4)) * 1,
                z: Math.cos(t * Math.PI * 2) * 0.5
            },
            right: {
                x: Math.sin(t * Math.PI * 2 + Math.PI) * 2,
                y: Math.abs(Math.sin(t * Math.PI * 4 + Math.PI)) * 1,
                z: Math.cos(t * Math.PI * 2 + Math.PI) * 0.5
            }
        }),
        legLoop: (t) => ({
            left: {
                x: Math.sin(t * Math.PI * 4) * 0.3,
                y: Math.cos(t * Math.PI * 2) * 0.2,
                z: Math.sin(t * Math.PI * 2) * 0.2
            },
            right: {
                x: Math.sin(t * Math.PI * 4 + Math.PI) * 0.3,
                y: Math.cos(t * Math.PI * 2 + Math.PI) * 0.2,
                z: Math.sin(t * Math.PI * 2 + Math.PI) * 0.2
            }
        })
    }
};

function startDance(danceName) {
    if (danceAnimations[danceName]) {
        currentDance = danceName;
        danceStartTime = performance.now() / 1000; // Convert to seconds
        room.send({
            type: 'emote',
            dance: danceName
        });
    }
}

function updateCharacterTransparency() {
    // Get distance from camera to character
    const distanceToCharacter = camera.position.distanceTo(character.position);

    // Calculate opacity based on distance
    let opacity = 1.0;
    if (distanceToCharacter < firstPersonDistance) {
        opacity = 0.0; // Fully transparent in first person
    } else if (distanceToCharacter < nearCharacterDistance) {
        // Fade in between firstPersonDistance and nearCharacterDistance
        opacity = (distanceToCharacter - firstPersonDistance) / (nearCharacterDistance - firstPersonDistance);
    }

    // Apply opacity to character parts
    if (torsoMaterial) torsoMaterial.opacity = opacity;
    if (leftArmMesh) leftArmMesh.material.opacity = opacity;
    if (rightArmMesh) rightArmMesh.material.opacity = opacity;
    if (leftLegMesh) leftLegMesh.material.opacity = opacity;
    if (rightLegMesh) rightLegMesh.material.opacity = opacity;
    if (headMesh) headMesh.material.opacity = opacity;

    // Update material visibility
    const visible = opacity > 0;
    if (torsoMaterial) torsoMaterial.visible = visible;
    if (leftArmMesh) leftArmMesh.material.visible = visible;
    if (rightArmMesh) rightArmMesh.material.visible = visible;
    if (leftLegMesh) leftLegMesh.material.visible = visible;
    if (rightLegMesh) rightLegMesh.material.visible = visible;
    if (headMesh) headMesh.material.visible = visible;
}

function createObby() {
    // Move obby further away and down 1 more stud (updating y positions)
    const platforms = [
        { pos: [120, 0, 30], size: [6, 1, 6], type: 'platform' },    
        { pos: [130, 3, 30], size: [6, 1, 6], type: 'platform' },   
        { pos: [140, 6, 30], size: [6, 1, 6], type: 'platform' },
        { pos: [140, 9, 40], size: [6, 1, 6], type: 'platform' },
        { pos: [130, 12, 40], size: [6, 1, 6], type: 'platform' },
        { pos: [120, 15, 40], size: [6, 1, 6], type: 'platform' },
        // Add more challenging platforms
        { pos: [125, 18, 45], size: [3, 1, 3], type: 'platform' },
        { pos: [135, 18, 45], size: [3, 1, 3], type: 'platform' },
        { pos: [130, 21, 50], size: [6, 1, 6], type: 'platform' },
        // Smaller lava hazards between platforms
        { pos: [127.5, 17, 42.5], size: [4, 0.5, 4], type: 'lava' }, 
        { pos: [132.5, 20, 47.5], size: [4, 0.5, 4], type: 'lava' }, 
        // Final stretch
        { pos: [140, 21, 55], size: [3, 1, 3], type: 'platform' },
        { pos: [145, 21, 60], size: [3, 1, 3], type: 'platform' },
        // Victory platform
        { pos: [150, 21, 65], size: [8, 1, 8], type: 'victory' }
    ];

    // Create geometries and materials only once
    const platformGeometry = new THREE.BoxGeometry(1, 1, 1);
    const platformMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x44ff44,
        transparent: true,
        opacity: 0.8
    });

    const lavaMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.7,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });

    const victoryMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700, 
        transparent: true,
        opacity: 0.9,
        emissive: 0xffd700,
        emissiveIntensity: 0.3
    });

    // Create platforms if they don't exist yet
    if (!window.obbyPlatforms) {
        window.obbyPlatforms = platforms.map(({ pos, size, type }) => {
            const platform = new THREE.Mesh(
                platformGeometry, 
                type === 'lava' ? lavaMaterial.clone() : 
                type === 'victory' ? victoryMaterial.clone() : 
                platformMaterial.clone()
            );
            platform.position.set(pos[0], pos[1], pos[2]);
            platform.scale.set(size[0], size[1], size[2]);
            platform.receiveShadow = true;
            platform.castShadow = true;
            
            platform.userData.isObbyPlatform = true;
            platform.userData.type = type;
            platform.userData.hitbox = new THREE.Box3();
            
            scene.add(platform);
            return platform;
        });
    }
}

function checkCollisions() {
    if (!window.obbyPlatforms) return false;

    const characterBox = new THREE.Box3().setFromObject(character);
    const characterCenter = characterBox.getCenter(new THREE.Vector3());
    const characterSize = characterBox.getSize(new THREE.Vector3());
    const characterBottom = characterCenter.y - (characterSize.y / 2);
    
    const COLLISION_BUFFER = 0.1;
    const MAX_STEP_HEIGHT = 0.5;
    let isOnGround = false;

    for (const platform of window.obbyPlatforms) {
        const platformBox = new THREE.Box3().setFromObject(platform);
        
        // Skip distant platforms for performance
        if (platform.position.distanceTo(character.position) > 15) continue;

        if (characterBox.intersectsBox(platformBox)) {
            // Check for lava collision
            if (platform.userData.type === 'lava') {
                // Teleport to spawn point
                character.position.copy(spawnPoint);
                characterVelocity.set(0, 0, 0);
                return false;
            }

            // Check for victory platform
            if (platform.userData.type === 'victory') {
                const username = room.peers[room.clientId]?.username || 'Unknown';
                if (!platform.userData.lastTouchedBy || platform.userData.lastTouchedBy !== room.clientId) {
                    platform.userData.lastTouchedBy = room.clientId;
                    room.send({
                        type: 'chat',
                        message: `🏆 ${username} FINISHED THE OBBY! 🏆`,
                        channel: 'system'
                    });
                }
            }

            const overlap = {
                x: Math.min(characterBox.max.x - platformBox.min.x, platformBox.max.x - characterBox.min.x),
                y: Math.min(characterBox.max.y - platformBox.min.y, platformBox.max.y - characterBox.min.y),
                z: Math.min(characterBox.max.z - platformBox.min.z, platformBox.max.z - characterBox.min.z)
            };

            // Only handle collisions for non-lava platforms
            if (platform.userData.type !== 'lava') {
                const minOverlap = Math.min(overlap.x, overlap.y, overlap.z);
                
                const platformTop = platformBox.max.y;
                const characterFeet = character.position.y + characterBaseOffset;
                const heightDifference = platformTop - characterFeet;

                if (overlap.y === minOverlap) {
                    if (characterBottom <= platformBox.max.y + COLLISION_BUFFER && 
                        characterVelocity.y <= 0) {
                        character.position.y = platformBox.max.y - characterBaseOffset + COLLISION_BUFFER;
                        characterVelocity.y = 0;
                        isOnGround = true;
                    } else if (characterVelocity.y > 0) {
                        character.position.y = platformBox.min.y - characterSize.y + COLLISION_BUFFER;
                        characterVelocity.y = 0;
                    }
                } else if (heightDifference <= MAX_STEP_HEIGHT && characterVelocity.y <= 0) {
                    character.position.y = platformTop - characterBaseOffset + COLLISION_BUFFER;
                    characterVelocity.y = 0;
                    isOnGround = true;
                } else {
                    if (overlap.x < overlap.z) {
                        const pushDirection = characterCenter.x > platformBox.getCenter(new THREE.Vector3()).x ? 1 : -1;
                        character.position.x += overlap.x * pushDirection;
                        characterVelocity.x = 0;
                    } else {
                        const pushDirection = characterCenter.z > platformBox.getCenter(new THREE.Vector3()).z ? 1 : -1;
                        character.position.z += overlap.z * pushDirection;
                        characterVelocity.z = 0;
                    }
                }
            }
        }
    }

    return isOnGround;
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    
    // Skip frame if delta is too high (prevents large jumps during lag)
    if (delta > 0.1) return;
    
    // Throttle presence updates
    const PRESENCE_UPDATE_INTERVAL = 100; // ms
    const now = performance.now();
    if (!window.lastPresenceUpdate || now - window.lastPresenceUpdate >= PRESENCE_UPDATE_INTERVAL) {
        window.lastPresenceUpdate = now;
        
        if (character.position.distanceToSquared(lastSentPosition) > 0.01 ||
            character.rotation.equals(lastSentRotation) === false) {
            lastSentPosition.copy(character.position);
            lastSentRotation.copy(character.rotation);

            if (currentDance) {
                currentDance = null;
                room.send({
                    type: 'emote',
                    dance: null
                });
            }

            // Add movement state to presence update
            const isMoving = keys.w || keys.a || keys.s || keys.d;
            const isJumping = characterVelocity.y > 0.1;

            room.updatePresence({
                position: {
                    x: character.position.x,
                    y: character.position.y,
                    z: character.position.z
                },
                rotation: {
                    _x: character.rotation.x,
                    _y: character.rotation.y,
                    _z: character.rotation.z
                },
                isMoving: isMoving,
                isJumping: isJumping,
                characterScale: character.scale.x,
                torsoScale: torso.scale.x
            });
        }
    }

    // Throttle nametag and chat bubble updates
    const UI_UPDATE_INTERVAL = 50; // ms
    if (!window.lastUIUpdate || now - window.lastUIUpdate >= UI_UPDATE_INTERVAL) {
        window.lastUIUpdate = now;
        updateNametags();
        updateChatBubbles();
    }

    if (character && cameraTarget) {
        const horizontalMoveDirection = new THREE.Vector3(0, 0, 0);
        const cameraForward = new THREE.Vector3();
        const cameraRight = new THREE.Vector3();

        camera.getWorldDirection(cameraForward);
        cameraForward.setY(0).normalize();
        cameraRight.crossVectors(new THREE.Vector3(0, 1, 0), cameraForward).normalize();

        let isMovingHorizontally = false;

        if (keys.w) {
            horizontalMoveDirection.add(cameraForward);
            isMovingHorizontally = true;
        }
        if (keys.s) {
            horizontalMoveDirection.sub(cameraForward);
            isMovingHorizontally = true;
        }
        if (keys.a) {
            horizontalMoveDirection.add(cameraRight);
            isMovingHorizontally = true;
        }
        if (keys.d) {
            horizontalMoveDirection.sub(cameraRight);
            isMovingHorizontally = true;
        }

        if (horizontalMoveDirection.lengthSq() > 0.001) {
            horizontalMoveDirection.normalize();
        } else {
            characterVelocity.x = THREE.MathUtils.lerp(characterVelocity.x, 0, 0.1);
            characterVelocity.z = THREE.MathUtils.lerp(characterVelocity.z, 0, 0.1);
        }

        if (isMovingHorizontally) {
            characterVelocity.x = horizontalMoveDirection.x * moveSpeed;
            characterVelocity.z = horizontalMoveDirection.z * moveSpeed;

            const targetLookAtPoint = character.position.clone().add(horizontalMoveDirection);

            const dummy = new THREE.Object3D();
            dummy.position.copy(character.position);
            dummy.lookAt(targetLookAtPoint);

            const rotate180 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
            const finalTargetQuaternion = dummy.quaternion.clone().multiply(rotate180);

            character.quaternion.slerp(finalTargetQuaternion, characterRotationSpeed);
        }

        const characterBaseY = character.position.y + characterBaseOffset;

        const isOnPlatform = checkCollisions();
        const isGrounded = characterBaseY <= floorHeight + 0.05 || isOnPlatform;

        characterVelocity.y -= gravity * delta;

        if (keys[' '] && isGrounded) {
            characterVelocity.y = jumpPower;
            keys[' '] = false;
        }

        character.position.addScaledVector(characterVelocity, delta);

        const newCharacterBaseY = character.position.y + characterBaseOffset;

        if (newCharacterBaseY < floorHeight) {
            character.position.y = floorHeight - characterBaseOffset;
            characterVelocity.y = 0;
            if (characterVelocity.y <= 0) {
                characterVelocity.y = 0.001;
            }
        }

        if (leftArmPivot && rightArmPivot && leftLegPivot && rightLegPivot) {
            if (currentDance) {
                const currentTime = performance.now() / 1000;
                const danceTime = (currentTime - danceStartTime) % danceAnimations[currentDance].duration;
                const normalizedTime = danceTime / danceAnimations[currentDance].duration;

                // Get the rotations for this frame
                const armRotations = danceAnimations[currentDance].armLoop(normalizedTime);
                const legRotations = danceAnimations[currentDance].legLoop(normalizedTime);

                leftArmPivot.rotation.set(armRotations.left.x, armRotations.left.y, armRotations.left.z);
                rightArmPivot.rotation.set(armRotations.right.x, armRotations.right.y, armRotations.right.z);
                leftLegPivot.rotation.set(legRotations.left.x, legRotations.left.y, legRotations.left.z);
                rightLegPivot.rotation.set(legRotations.right.x, legRotations.right.y, legRotations.right.z);

                // Stop dancing if any movement key is pressed
                if (keys.w || keys.a || keys.s || keys[' ']) {
                    currentDance = null;
                }
            } else {
                // Original walking/jumping animation code
                const armTargetRotation = new THREE.Quaternion();
                const legTargetRotation = new THREE.Quaternion();
                const identityRotation = new THREE.Quaternion().identity();

                if (!isGrounded) {
                    armTargetRotation.setFromAxisAngle(new THREE.Vector3(1, 0, 0), armJumpRotation);
                    legTargetRotation.copy(identityRotation);

                    walkingAngle = 0;
                } else if (isMovingHorizontally) {
                    walkingAngle += walkingSpeed * delta;

                    const leftArmSwingAngle = Math.sin(walkingAngle) * maxSwingAngle;
                    const rightArmSwingAngle = Math.sin(walkingAngle + Math.PI) * maxSwingAngle;

                    leftArmPivot.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), leftArmSwingAngle), animationLerpFactor);
                    rightArmPivot.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rightArmSwingAngle), animationLerpFactor);

                    const leftLegSwingAngle = Math.sin(walkingAngle + Math.PI) * maxSwingAngle;
                    const rightLegSwingAngle = Math.sin(walkingAngle) * maxSwingAngle;

                    leftLegPivot.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), leftLegSwingAngle), animationLerpFactor);
                    rightLegPivot.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rightLegSwingAngle), animationLerpFactor);
                } else {
                    armTargetRotation.copy(identityRotation);
                    legTargetRotation.copy(identityRotation);

                    const angleThreshold = 0.01;
                    const currentLeftArmAngle = new THREE.Euler().setFromQuaternion(leftArmPivot.quaternion, leftArmPivot.rotation.order).x;
                    const isAnyHorizontalKey = keys.w || keys.s || keys.a || keys.d;
                    if (!isAnyHorizontalKey && Math.abs(currentLeftArmAngle) < angleThreshold && characterVelocity.lengthSq() < 0.001)
                        walkingAngle = 0;
                }

                if (!isMovingHorizontally || !isGrounded) {
                    leftArmPivot.quaternion.slerp(armTargetRotation, animationLerpFactor);
                    rightArmPivot.quaternion.slerp(armTargetRotation, animationLerpFactor);
                    leftLegPivot.quaternion.slerp(legTargetRotation, animationLerpFactor);
                    rightLegPivot.quaternion.slerp(legTargetRotation, animationLerpFactor);
                } else if (!isMovingHorizontally && isGrounded) {
                    leftLegPivot.quaternion.slerp(legTargetRotation, animationLerpFactor);
                    rightLegPivot.quaternion.slerp(legTargetRotation, animationLerpFactor);
                }
            }
        }

        cameraTarget.getWorldPosition(cameraTargetWorldPosition);

        const desiredCameraPosition = new THREE.Vector3(
            cameraTargetWorldPosition.x + currentCameraDistance * Math.sin(cameraYaw) * Math.cos(cameraPitch),
            cameraTargetWorldPosition.y + currentCameraDistance * Math.sin(cameraPitch),
            cameraTargetWorldPosition.z + currentCameraDistance * Math.cos(cameraYaw) * Math.cos(cameraPitch)
        );

        const minCameraY = floorHeight + characterBaseOffset + 0.5;
        if (desiredCameraPosition.y < minCameraY) {
            desiredCameraPosition.y = minCameraY;
        }

        camera.position.copy(desiredCameraPosition);
        camera.lookAt(cameraTargetWorldPosition);
    }

    if (character && cameraTarget) {
        if (isFlyMode) {
            // Fly mode movement
            if (keys.w) characterVelocity.z = -flySpeed;
            if (keys.s) characterVelocity.z = flySpeed;
            if (keys.a) characterVelocity.x = -flySpeed;
            if (keys.d) characterVelocity.x = flySpeed;
            if (keys[' ']) characterVelocity.y = verticalSpeed;
            if (keys.shift) characterVelocity.y = -verticalSpeed;

            // Apply camera-relative movement in fly mode
            const cameraRotation = new THREE.Euler(0, camera.rotation.y, 0);
            const movement = new THREE.Vector3(characterVelocity.x, 0, characterVelocity.z);
            movement.applyEuler(cameraRotation);
            
            character.position.x += movement.x * delta;
            character.position.y += characterVelocity.y * delta;
            character.position.z += movement.z * delta;
            
            // Reset velocity each frame in fly mode
            characterVelocity.set(0, 0, 0);
        } else {
            // ... existing normal movement code ...
        }
    }

    updateCharacterTransparency();
    
    createObby();

    const isOnPlatform = checkCollisions();
    if (isOnPlatform && keys[' ']) {
        characterVelocity.y = jumpPower;
        keys[' '] = false;
    }

    updateNametags();
    updateChatBubbles();

    // Update gamepad state
    updateGamepad();

    if (particleSystem) {
        updateParticles(delta);
    }

    composer.render();
}

function updateNametags() {
    const tempPos = new THREE.Vector3();
    
    // Update other players' nametags
    players.forEach((player, clientId) => {
        if (player.character && player.nametag) {
            // Position above the head
            tempPos.setFromMatrixPosition(player.character.matrixWorld);
            tempPos.y += 3; // Adjust this value to position the nametag appropriately

            // Convert 3D position to screen coordinates
            tempPos.project(camera);

            // Convert to CSS coordinates
            const x = (tempPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-tempPos.y * 0.5 + 0.5) * window.innerHeight;

            // Update nametag position if it's in front of the camera
            if (tempPos.z < 1) {
                player.nametag.style.display = 'block';
                player.nametag.style.left = `${x}px`;
                player.nametag.style.top = `${y}px`;
            } else {
                player.nametag.style.display = 'none';
            }
        }
    });
}

function updateChatBubbles() {
    const tempPos = new THREE.Vector3();
    
    chatBubbles.forEach((bubble, clientId) => {
        if (players.has(clientId)) {
            const player = players.get(clientId);
            // Position above the head and nametag
            tempPos.setFromMatrixPosition(player.character.matrixWorld);
            tempPos.y += 4; // Position above nametag

            // Convert 3D position to screen coordinates
            tempPos.project(camera);

            // Convert to CSS coordinates
            const x = (tempPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-tempPos.y * 0.5 + 0.5) * window.innerHeight;

            // Update bubble position if it's in front of the camera
            if (tempPos.z < 1) {
                bubble.style.display = 'block';
                bubble.style.left = `${x}px`;
                bubble.style.top = `${y}px`;
            } else {
                bubble.style.display = 'none';
            }
        }
    });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    updateNametags();
    updateChatBubbles();
});

animate();
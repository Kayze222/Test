import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import { soundManager } from '../../utils/audio';
import { launchConfetti } from '../../utils/confetti';
import {
  Palette,
  MessageSquare,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Swords,
  Zap,
  Moon,
  Hammer,
  RotateCcw,
  User,
} from 'lucide-react';

interface PlayerCustomization {
  username: string;
  headColor: string;
  torsoColor: string;
  armsColor: string;
  legsColor: string;
  face: 'smile' | 'chill' | 'evil' | 'cool';
  accessory: 'none' | 'crown' | 'fedora' | 'halo' | 'propeller';
  trail: 'none' | 'sparkles' | 'fire' | 'rainbow';
}

const DEFAULT_CUSTOMIZATION: PlayerCustomization = {
  username: 'Zimmer_' + Math.floor(1000 + Math.random() * 9000),
  headColor: '#f5cd30',
  torsoColor: '#0055ff',
  armsColor: '#f5cd30',
  legsColor: '#a5bc50',
  face: 'smile',
  accessory: 'crown',
  trail: 'sparkles',
};

export const Zoblox: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [customization, setCustomization] = useState<PlayerCustomization>(() => {
    try {
      const saved = localStorage.getItem('zoblox_customization_v1');
      return saved ? { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(saved) } : DEFAULT_CUSTOMIZATION;
    } catch {
      return DEFAULT_CUSTOMIZATION;
    }
  });

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string }>>([
    { sender: 'System', text: 'Welcome to Zoblox! Press 1-4 to change gears. Press C to customize!' },
    { sender: 'Skoodge', text: 'Anyone wanna race the Obby?' },
  ]);
  const [activeGear, setActiveGear] = useState<'sword' | 'speed' | 'gravity' | 'trowel'>('sword');
  const [health, setHealth] = useState(100);
  const [kos, setKos] = useState(0);
  const [coins, setCoins] = useState(0);
  const [obbyStage, setObbyStage] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const stateRef = useRef({
    customization,
    activeGear,
    health: 100,
  });
  stateRef.current = { customization, activeGear, health };

  useEffect(() => {
    localStorage.setItem('zoblox_customization_v1', JSON.stringify(customization));
  }, [customization]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // --- THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#7ec0ee');
    scene.fog = new THREE.FogExp2('#7ec0ee', 0.008);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Audio for background runaway theme
    const bgAudio = new Audio('/Roblocks/ROBLOX runaway.mp3');
    bgAudio.loop = true;
    bgAudio.volume = 0.35;
    bgAudio.play().catch(() => {});

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(40, 80, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    scene.add(dirLight);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const studTexture = textureLoader.load('/stud texture.png', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(60, 60);
    });

    const headFaceTexture = textureLoader.load('/Roblocks/HEAD.png');

    // Baseplate
    const baseplateGeo = new THREE.BoxGeometry(200, 4, 200);
    const baseplateMat = new THREE.MeshStandardMaterial({
      color: 0x4ca832,
      map: studTexture,
      roughness: 0.8,
    });
    const baseplate = new THREE.Mesh(baseplateGeo, baseplateMat);
    baseplate.position.y = -2;
    baseplate.receiveShadow = true;
    scene.add(baseplate);

    // --- OBBY CREATION ---
    const obbyCheckpoints: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(15, 12, -20),
      new THREE.Vector3(15, 26, -45),
      new THREE.Vector3(0, 42, -50),
    ];

    const platforms: Array<{ mesh: THREE.Mesh; isLava?: boolean; checkpointIndex?: number; isGoal?: boolean }> = [];

    // Rainbow stepping blocks
    const rainbowColors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0x8800ff];
    for (let i = 0; i < 20; i++) {
      const geo = new THREE.BoxGeometry(6, 1, 6);
      const isLava = i % 5 === 4;
      const mat = new THREE.MeshStandardMaterial({
        color: isLava ? 0xff0033 : rainbowColors[i % rainbowColors.length],
        emissive: isLava ? 0xff0000 : 0x000000,
        emissiveIntensity: isLava ? 0.6 : 0,
        roughness: 0.3,
      });
      const p = new THREE.Mesh(geo, mat);
      const angle = (i * Math.PI) / 8;
      p.position.set(Math.sin(angle) * (18 + i * 1.2), 2 + i * 2.2, -15 - i * 3);
      p.castShadow = true;
      p.receiveShadow = true;
      scene.add(p);
      platforms.push({ mesh: p, isLava });
    }

    // Winner Platform at the peak
    const winnerGeo = new THREE.CylinderGeometry(10, 10, 2, 24);
    const winnerMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xaa8800,
      emissiveIntensity: 0.4,
    });
    const winnerPlate = new THREE.Mesh(winnerGeo, winnerMat);
    winnerPlate.position.set(0, 48, -75);
    winnerPlate.receiveShadow = true;
    scene.add(winnerPlate);
    platforms.push({ mesh: winnerPlate, isGoal: true });

    // Floating Winner Trophy
    const trophyGeo = new THREE.ConeGeometry(3, 5, 8);
    const trophyMat = new THREE.MeshStandardMaterial({ color: 0xffe600, metalness: 0.9, roughness: 0.1 });
    const trophyMesh = new THREE.Mesh(trophyGeo, trophyMat);
    trophyMesh.position.set(0, 52, -75);
    trophyMesh.rotation.x = Math.PI;
    scene.add(trophyMesh);

    // --- ROTATING COINS ---
    const coinsList: Array<{ mesh: THREE.Mesh; collected: boolean }> = [];
    for (let c = 0; c < 14; c++) {
      const coinGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
      const coinMat = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x664400,
      });
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.z = Math.PI / 2;
      const angle = (c * Math.PI * 2) / 14;
      coin.position.set(Math.cos(angle) * 35, 2.5 + (c % 3) * 1.5, Math.sin(angle) * 35);
      scene.add(coin);
      coinsList.push({ mesh: coin, collected: false });
    }

    // --- BUILD CUBE HEAD AVATAR FACTORY ---
    function buildCubeAvatar(colors: PlayerCustomization, accessoryType = 'crown') {
      const group = new THREE.Group();

      // Materials
      const headMaterials = [
        new THREE.MeshStandardMaterial({ color: colors.headColor }), // right
        new THREE.MeshStandardMaterial({ color: colors.headColor }), // left
        new THREE.MeshStandardMaterial({ color: colors.headColor }), // top
        new THREE.MeshStandardMaterial({ color: colors.headColor }), // bottom
        new THREE.MeshStandardMaterial({ color: colors.headColor, map: headFaceTexture }), // FRONT FACE!
        new THREE.MeshStandardMaterial({ color: colors.headColor }), // back
      ];

      // Authentic Cube Head (1.2 x 1.2 x 1.2)
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), headMaterials);
      head.position.y = 2.1;
      head.castShadow = true;
      group.add(head);

      // Torso (2 x 2 x 1)
      const torsoMat = new THREE.MeshStandardMaterial({ color: colors.torsoColor, roughness: 0.5 });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), torsoMat);
      torso.position.y = 0.5;
      torso.castShadow = true;
      group.add(torso);

      // Arms (1 x 2 x 1)
      const armMat = new THREE.MeshStandardMaterial({ color: colors.armsColor, roughness: 0.5 });
      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), armMat);
      leftArm.position.set(-1.5, 0.5, 0);
      leftArm.castShadow = true;
      group.add(leftArm);

      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), armMat);
      rightArm.position.set(1.5, 0.5, 0);
      rightArm.castShadow = true;
      group.add(rightArm);

      // Legs (1 x 2 x 1)
      const legMat = new THREE.MeshStandardMaterial({ color: colors.legsColor, roughness: 0.5 });
      const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), legMat);
      leftLeg.position.set(-0.5, -1.5, 0);
      leftLeg.castShadow = true;
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), legMat);
      rightLeg.position.set(0.5, -1.5, 0);
      rightLeg.castShadow = true;
      group.add(rightLeg);

      // Accessories
      if (accessoryType === 'crown') {
        const crown = new THREE.Mesh(
          new THREE.CylinderGeometry(0.7, 0.6, 0.4, 6),
          new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 })
        );
        crown.position.y = 2.85;
        group.add(crown);
      } else if (accessoryType === 'halo') {
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(0.7, 0.08, 8, 24),
          new THREE.MeshStandardMaterial({ color: 0xffff55, emissive: 0xffff55, emissiveIntensity: 0.8 })
        );
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 3.0;
        group.add(halo);
      } else if (accessoryType === 'fedora') {
        const fedora = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 1.2, 0.35, 16),
          new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        fedora.position.y = 2.8;
        group.add(fedora);
      }

      // Hand item / sword
      const swordGroup = new THREE.Group();
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 2.6, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xddddff, metalness: 0.9, roughness: 0.2 })
      );
      blade.position.y = 1.3;
      const hilt = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.15, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x885522 })
      );
      hilt.position.y = 0.2;
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      handle.position.y = -0.2;
      swordGroup.add(blade, hilt, handle);
      swordGroup.position.set(1.5, 0.2, 0.6);
      swordGroup.rotation.x = Math.PI / 3;
      group.add(swordGroup);

      return {
        root: group,
        head,
        torso,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        swordGroup,
        headMaterials,
      };
    }

    // Build Local Player Avatar
    const playerAvatar = buildCubeAvatar(stateRef.current.customization, stateRef.current.customization.accessory);
    playerAvatar.root.position.set(0, 2.5, 10);
    scene.add(playerAvatar.root);

    // --- BOT PLAYERS (MULTIPLAYER COMPANIONS) ---
    const botData = [
      { name: 'Tallest_Purple', color: '#8800ff', x: -10, z: 5, angle: 0 },
      { name: 'NoobMaster2007', color: '#00ccff', x: 12, z: -10, angle: Math.PI },
      { name: 'Waltuh_White', color: '#ffdd00', x: -15, z: -20, angle: Math.PI / 2 },
    ];

    const botAvatars = botData.map((b) => {
      const botAv = buildCubeAvatar(
        {
          username: b.name,
          headColor: '#f5cd30',
          torsoColor: b.color,
          armsColor: '#f5cd30',
          legsColor: '#225588',
          face: 'smile',
          accessory: 'halo',
          trail: 'none',
        },
        'halo'
      );
      botAv.root.position.set(b.x, 2.5, b.z);
      scene.add(botAv.root);
      return { ...botAv, data: b, vx: 0.1, vz: 0.1 };
    });

    // --- REAL MULTIPLAYER SOCKET CONNECTION ---
    const socket: Socket = io();
    socketRef.current = socket;
    const remotePlayers: Record<string, any> = {};

    socket.on('init', (data: any) => {
      // Create avatars for players already in the room
      for (const [id, p] of Object.entries<any>(data.players)) {
        if (id === socket.id) continue;
        const remote = buildCubeAvatar(
          {
            username: p.username,
            headColor: p.colors?.head || '#f5cd30',
            torsoColor: p.colors?.torso || '#0055ff',
            armsColor: p.colors?.arms || '#f5cd30',
            legsColor: p.colors?.legs || '#a5bc50',
            face: 'smile',
            accessory: p.accessory || 'crown',
            trail: 'none',
          },
          p.accessory
        );
        remote.root.position.set(p.x, p.y, p.z);
        scene.add(remote.root);
        remotePlayers[id] = remote;
      }
    });

    socket.on('player:joined', (p: any) => {
      if (remotePlayers[p.id]) return;
      const remote = buildCubeAvatar(
        {
          username: p.username,
          headColor: p.colors?.head || '#f5cd30',
          torsoColor: p.colors?.torso || '#0055ff',
          armsColor: p.colors?.arms || '#f5cd30',
          legsColor: p.colors?.legs || '#a5bc50',
          face: 'smile',
          accessory: p.accessory || 'crown',
          trail: 'none',
        },
        p.accessory
      );
      remote.root.position.set(p.x, p.y, p.z);
      scene.add(remote.root);
      remotePlayers[p.id] = remote;
      setChatMessages((prev) => [...prev, { sender: 'System', text: `${p.username} joined Zoblox!` }]);
    });

    socket.on('state:sync', (allPlayers: Record<string, any>) => {
      for (const [id, p] of Object.entries(allPlayers)) {
        if (id === socket.id) continue;
        const remote = remotePlayers[id];
        if (remote) {
          remote.root.position.lerp(new THREE.Vector3(p.x, p.y, p.z), 0.3);
          remote.root.rotation.y = p.rotY;
        }
      }
    });

    socket.on('player:left', (id: string) => {
      if (remotePlayers[id]) {
        scene.remove(remotePlayers[id].root);
        delete remotePlayers[id];
      }
    });

    socket.on('player:chatted', (data: any) => {
      setChatMessages((prev) => [...prev.slice(-20), { sender: data.username, text: data.message }]);
    });

    // --- CONTROLS & PHYSICS ---
    const keys: Record<string, boolean> = {};
    const playerPos = playerAvatar.root.position;
    let velocityY = 0;
    let isGrounded = true;
    let yaw = 0;
    let pitch = 0.3;
    let isSlashing = false;
    let slashTimer = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'KeyC') {
        setShowCustomizeModal((prev) => !prev);
      }
      if (e.code === 'Digit1') setActiveGear('sword');
      if (e.code === 'Digit2') {
        setActiveGear('speed');
        soundManager.play('click');
      }
      if (e.code === 'Digit3') {
        setActiveGear('gravity');
        soundManager.play('click');
      }
      if (e.code === 'Digit4') {
        setActiveGear('trowel');
        soundManager.play('click');
      }
      if (e.code === 'KeyF') {
        triggerSlash();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    let isPointerLocked = false;
    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === renderer.domElement) {
        if (!isPointerLocked) {
          renderer.domElement.requestPointerLock();
          isPointerLocked = true;
        }
        triggerSlash();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === renderer.domElement) {
        yaw -= e.movementX * 0.003;
        pitch = Math.max(-0.6, Math.min(0.8, pitch + e.movementY * 0.003));
      }
    };

    document.addEventListener('pointerlockchange', () => {
      isPointerLocked = document.pointerLockElement === renderer.domElement;
    });

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);

    function triggerSlash() {
      if (isSlashing) return;
      isSlashing = true;
      slashTimer = 0.3;
      soundManager.play('click');

      // Check hit against bots or players
      botAvatars.forEach((bot) => {
        if (bot.root.position.distanceTo(playerPos) < 4.5) {
          soundManager.play('damage');
          setKos((k) => k + 1);
          bot.root.position.set((Math.random() - 0.5) * 30, 2.5, (Math.random() - 0.5) * 30);
          setChatMessages((prev) => [
            ...prev,
            { sender: 'PvP', text: `You KO'd ${bot.data.name} with your Linked Sword!` },
          ]);
        }
      });
    }

    // --- ANIMATION LOOP ---
    let walkCycle = 0;
    let lastTime = performance.now();

    const animate = () => {
      requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Rotate trophy & coins
      trophyMesh.rotation.y += 0.02;
      coinsList.forEach((c) => {
        if (!c.collected) {
          c.mesh.rotation.y += 0.04;
          // Check collection
          if (c.mesh.position.distanceTo(playerPos) < 2.5) {
            c.collected = true;
            c.mesh.visible = false;
            setCoins((prev) => prev + 1);
            soundManager.play('buy');
          }
        }
      });

      // Handle Gears Speed / Jump Modifiers
      const speedCoilMult = stateRef.current.activeGear === 'speed' ? 2.0 : 1.0;
      const gravityCoilMult = stateRef.current.activeGear === 'gravity' ? 0.45 : 1.0;
      const moveSpeed = 16 * speedCoilMult;

      // Player Movement vectors
      let moveX = 0;
      let moveZ = 0;

      if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

      const isMoving = moveX !== 0 || moveZ !== 0;

      if (isMoving) {
        const moveVec = new THREE.Vector3(moveX, 0, moveZ).normalize();
        moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

        playerPos.x += moveVec.x * moveSpeed * dt;
        playerPos.z += moveVec.z * moveSpeed * dt;

        playerAvatar.root.rotation.y = Math.atan2(moveVec.x, moveVec.z);
        walkCycle += dt * 10 * speedCoilMult;
      } else {
        walkCycle = 0;
      }

      // Jump & Gravity
      if ((keys['Space'] || keys['KeyE']) && isGrounded) {
        velocityY = (stateRef.current.activeGear === 'gravity' ? 24 : 15);
        isGrounded = false;
        soundManager.play('button');
      }

      velocityY -= 32 * gravityCoilMult * dt;
      playerPos.y += velocityY * dt;

      // Platform Collisions (Obby & Baseplate)
      let onPlatform = false;
      const playerFeet = playerPos.y - 1.5;

      // Baseplate floor
      if (playerPos.y <= 2.5) {
        playerPos.y = 2.5;
        velocityY = 0;
        isGrounded = true;
        onPlatform = true;
      }

      // Check obby platforms
      platforms.forEach((p) => {
        const box = new THREE.Box3().setFromObject(p.mesh);
        if (
          playerPos.x >= box.min.x &&
          playerPos.x <= box.max.x &&
          playerPos.z >= box.min.z &&
          playerPos.z <= box.max.z
        ) {
          // If hit red lava
          if (p.isLava) {
            soundManager.play('fail');
            playerPos.copy(obbyCheckpoints[stateRef.current.health > 0 ? 0 : 0]);
            playerPos.y = 3;
            velocityY = 0;
            return;
          }

          // If reached Goal
          if (p.isGoal) {
            launchConfetti();
            setCoins((c) => c + 10);
            setChatMessages((prev) => [
              ...prev,
              { sender: 'Victory', text: '🏆 You reached the Winner Platform peak!' },
            ]);
            p.isGoal = false;
          }

          if (playerFeet <= box.max.y && playerFeet >= box.max.y - 1.5 && velocityY <= 0) {
            playerPos.y = box.max.y + 1.5;
            velocityY = 0;
            isGrounded = true;
            onPlatform = true;
          }
        }
      });

      // Respawn if fell off world
      if (playerPos.y < -15) {
        playerPos.set(0, 4, 10);
        velocityY = 0;
      }

      // Limbs swinging animation
      if (isMoving) {
        const swing = Math.sin(walkCycle) * 0.7;
        playerAvatar.leftArm.rotation.x = -swing;
        playerAvatar.rightArm.rotation.x = swing;
        playerAvatar.leftLeg.rotation.x = swing;
        playerAvatar.rightLeg.rotation.x = -swing;
      } else {
        playerAvatar.leftArm.rotation.x = 0;
        playerAvatar.rightArm.rotation.x = 0;
        playerAvatar.leftLeg.rotation.x = 0;
        playerAvatar.rightLeg.rotation.x = 0;
      }

      // Sword slash animation
      if (isSlashing) {
        slashTimer -= dt;
        playerAvatar.swordGroup.rotation.x = Math.PI / 1.5 + Math.sin(slashTimer * 20) * 1.2;
        if (slashTimer <= 0) {
          isSlashing = false;
          playerAvatar.swordGroup.rotation.x = Math.PI / 3;
        }
      }

      // Smooth Third-Person Camera Tracking
      const camOffset = new THREE.Vector3(0, 3 + pitch * 5, 8 + pitch * 2);
      camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      camera.position.copy(playerPos).add(camOffset);
      camera.lookAt(playerPos.x, playerPos.y + 1.2, playerPos.z);

      // Bot Companions Wander
      botAvatars.forEach((bot, idx) => {
        bot.data.angle += dt * 0.4 * (idx % 2 === 0 ? 1 : -1);
        bot.root.position.x += Math.cos(bot.data.angle) * 4 * dt;
        bot.root.position.z += Math.sin(bot.data.angle) * 4 * dt;
        bot.root.rotation.y = -bot.data.angle + Math.PI / 2;

        const bSwing = Math.sin(now * 0.008 + idx) * 0.5;
        bot.leftLeg.rotation.x = bSwing;
        bot.rightLeg.rotation.x = -bSwing;
      });

      // Send update to multiplayer server
      if (socket.connected) {
        socket.emit('player:update', {
          x: playerPos.x,
          y: playerPos.y,
          z: playerPos.z,
          rotY: playerAvatar.root.rotation.y,
          anim: isMoving ? 'walk' : 'idle',
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      bgAudio.pause();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      socket.disconnect();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    soundManager.play('click');
    setChatMessages((prev) => [...prev.slice(-20), { sender: customization.username, text: chatInput.trim() }]);
    if (socketRef.current) {
      socketRef.current.emit('player:chat', chatInput.trim());
    }
    setChatInput('');
  };

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        userSelect: 'none',
        backgroundColor: '#7ec0ee',
      }}
    >
      {/* Top Left: Leaderboard & Stats HUD */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 60,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '2px solid #00ff88',
          fontFamily: "'Source Sans Pro', sans-serif",
          color: 'white',
          fontSize: '14px',
          boxShadow: '0 0 15px rgba(0,255,136,0.3)',
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#00ff88', marginBottom: '4px' }}>
          ⚔️ ZOBLOX ARENA
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Player: <strong>{customization.username}</strong></span>
          <span>🏆 KOs: <strong style={{ color: '#ffd700' }}>{kos}</strong></span>
          <span>🪙 Coins: <strong style={{ color: '#ffff00' }}>{coins}</strong></span>
        </div>
      </div>

      {/* Top Right: Customization & Sound Action Buttons */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 60,
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          onClick={() => {
            soundManager.play('click');
            setShowCustomizeModal(true);
          }}
          style={{
            backgroundColor: '#00ff88',
            color: 'black',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "'Source Sans Pro', sans-serif",
            fontSize: '14px',
            boxShadow: '0 0 15px rgba(0,255,136,0.4)',
          }}
        >
          <Palette size={18} />
          <span>Customize Avatar [C]</span>
        </button>
      </div>

      {/* Bottom Center: Hotbar Gears (1-4) */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          display: 'flex',
          gap: '12px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '8px 12px',
          borderRadius: '16px',
          border: '2px solid rgba(255,255,255,0.3)',
        }}
      >
        <button
          onClick={() => setActiveGear('sword')}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: activeGear === 'sword' ? '2px solid #00ff88' : '1px solid #555',
            backgroundColor: activeGear === 'sword' ? 'rgba(0,255,136,0.2)' : '#1a1a1a',
            color: activeGear === 'sword' ? '#00ff88' : '#ccc',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Swords size={20} />
          <span style={{ fontSize: '11px', marginTop: '2px' }}>[1] Sword</span>
        </button>

        <button
          onClick={() => setActiveGear('speed')}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: activeGear === 'speed' ? '2px solid #00ffff' : '1px solid #555',
            backgroundColor: activeGear === 'speed' ? 'rgba(0,255,255,0.2)' : '#1a1a1a',
            color: activeGear === 'speed' ? '#00ffff' : '#ccc',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Zap size={20} />
          <span style={{ fontSize: '11px', marginTop: '2px' }}>[2] Speed Coil</span>
        </button>

        <button
          onClick={() => setActiveGear('gravity')}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: activeGear === 'gravity' ? '2px solid #ff00ff' : '1px solid #555',
            backgroundColor: activeGear === 'gravity' ? 'rgba(255,0,255,0.2)' : '#1a1a1a',
            color: activeGear === 'gravity' ? '#ff00ff' : '#ccc',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Moon size={20} />
          <span style={{ fontSize: '11px', marginTop: '2px' }}>[3] Gravity Coil</span>
        </button>

        <button
          onClick={() => setActiveGear('trowel')}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: activeGear === 'trowel' ? '2px solid #ffff00' : '1px solid #555',
            backgroundColor: activeGear === 'trowel' ? 'rgba(255,255,0,0.2)' : '#1a1a1a',
            color: activeGear === 'trowel' ? '#ffff00' : '#ccc',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <Hammer size={20} />
          <span style={{ fontSize: '11px', marginTop: '2px' }}>[4] Trowel</span>
        </button>
      </div>

      {/* Bottom Left: Multiplayer Chat Box */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 16,
          zIndex: 60,
          width: '320px',
          backgroundColor: 'rgba(0,0,0,0.65)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Source Sans Pro', sans-serif",
        }}
      >
        <div
          style={{
            maxHeight: '140px',
            overflowY: 'auto',
            padding: '8px 12px',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {chatMessages.map((msg, idx) => (
            <div key={idx} style={{ wordBreak: 'break-word' }}>
              <span style={{ color: msg.sender === 'System' ? '#00ffff' : '#00ff88', fontWeight: 'bold' }}>
                [{msg.sender}]:{' '}
              </span>
              <span style={{ color: 'white' }}>{msg.text}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendChat} style={{ display: 'flex', borderTop: '1px solid #444' }}>
          <input
            type="text"
            placeholder="Type message to chat..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              padding: '8px 10px',
              color: 'white',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#00ff88',
              border: 'none',
              color: 'black',
              padding: '6px 12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* CUSTOMIZE AVATAR MODAL */}
      {showCustomizeModal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: "'Source Sans Pro', sans-serif",
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#1b1922',
              border: '3px solid #00ff88',
              borderRadius: '16px',
              padding: '24px',
              color: 'white',
              boxShadow: '0 0 30px rgba(0,255,136,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#00ff88', margin: 0 }}>
                🎨 ZOBLOX CHARACTER CUSTOMIZER
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '8px' }}>
              {/* Username Tag */}
              <div>
                <label style={{ fontSize: '13px', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                  Player Name:
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={customization.username}
                  onChange={(e) => setCustomization({ ...customization, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#111',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: '#00ff88',
                    fontWeight: 'bold',
                  }}
                />
              </div>

              {/* Cube Head & Body Colors */}
              <div>
                <label style={{ fontSize: '13px', color: '#aaa', display: 'block', marginBottom: '6px' }}>
                  Classic Block Colors:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#222', padding: '6px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px' }}>Cube Head</span>
                    <input
                      type="color"
                      value={customization.headColor}
                      onChange={(e) => setCustomization({ ...customization, headColor: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#222', padding: '6px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px' }}>Torso</span>
                    <input
                      type="color"
                      value={customization.torsoColor}
                      onChange={(e) => setCustomization({ ...customization, torsoColor: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#222', padding: '6px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px' }}>Arms</span>
                    <input
                      type="color"
                      value={customization.armsColor}
                      onChange={(e) => setCustomization({ ...customization, armsColor: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#222', padding: '6px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px' }}>Legs</span>
                    <input
                      type="color"
                      value={customization.legsColor}
                      onChange={(e) => setCustomization({ ...customization, legsColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Head Accessories */}
              <div>
                <label style={{ fontSize: '13px', color: '#aaa', display: 'block', marginBottom: '6px' }}>
                  Head Accessory:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(['none', 'crown', 'fedora', 'halo'] as const).map((acc) => (
                    <button
                      key={acc}
                      onClick={() => setCustomization({ ...customization, accessory: acc })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: customization.accessory === acc ? '2px solid #00ff88' : '1px solid #444',
                        backgroundColor: customization.accessory === acc ? 'rgba(0,255,136,0.2)' : '#222',
                        color: customization.accessory === acc ? '#00ff88' : '#ccc',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                      }}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trail effects */}
              <div>
                <label style={{ fontSize: '13px', color: '#aaa', display: 'block', marginBottom: '6px' }}>
                  Particle Aura:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(['none', 'sparkles', 'fire', 'rainbow'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCustomization({ ...customization, trail: t })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: customization.trail === t ? '2px solid #00ff88' : '1px solid #444',
                        backgroundColor: customization.trail === t ? 'rgba(0,255,136,0.2)' : '#222',
                        color: customization.trail === t ? '#00ff88' : '#ccc',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  soundManager.play('click');
                  setShowCustomizeModal(false);
                }}
                style={{
                  backgroundColor: '#00ff88',
                  color: 'black',
                  fontWeight: 'bold',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Apply & Save Avatar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

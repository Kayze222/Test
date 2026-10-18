import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

interface PlayerState {
  id: string;
  username: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  anim: 'idle' | 'walk' | 'jump' | 'slash';
  colors: {
    torso: string;
    head: string;
    arms: string;
    legs: string;
  };
  accessory: string;
  equippedGear: 'sword' | 'speed' | 'gravity' | 'trowel';
  health: number;
  kos: number;
  chat?: string;
  chatTimer?: number;
}

const players: Record<string, PlayerState> = {};
const placedBlocks: Array<{ id: string; x: number; y: number; z: number; color: string }> = [];

io.on('connection', (socket) => {
  // New player joined
  players[socket.id] = {
    id: socket.id,
    username: `Zimmer_${socket.id.slice(0, 4)}`,
    x: (Math.random() - 0.5) * 10,
    y: 2,
    z: (Math.random() - 0.5) * 10,
    rotY: 0,
    anim: 'idle',
    colors: {
      torso: '#0055ff',
      head: '#f5cd30',
      arms: '#f5cd30',
      legs: '#a5bc50',
    },
    accessory: 'none',
    equippedGear: 'sword',
    health: 100,
    kos: 0,
  };

  // Send initial world state to the connecting client
  socket.emit('init', {
    id: socket.id,
    players,
    placedBlocks,
  });

  // Notify everyone else
  socket.broadcast.emit('player:joined', players[socket.id]);

  // Handle player motion / state sync
  socket.on('player:update', (data: Partial<PlayerState>) => {
    if (!players[socket.id]) return;
    Object.assign(players[socket.id], data);
  });

  // Handle character customization
  socket.on('player:customize', (data: { username?: string; colors?: any; accessory?: string }) => {
    if (!players[socket.id]) return;
    if (data.username) players[socket.id].username = data.username.slice(0, 16);
    if (data.colors) players[socket.id].colors = data.colors;
    if (data.accessory) players[socket.id].accessory = data.accessory;
    io.emit('player:customized', players[socket.id]);
  });

  // Handle chat messages
  socket.on('player:chat', (message: string) => {
    if (!players[socket.id] || typeof message !== 'string') return;
    const cleanMsg = message.trim().slice(0, 120);
    if (!cleanMsg) return;

    players[socket.id].chat = cleanMsg;
    players[socket.id].chatTimer = Date.now() + 5000;
    io.emit('player:chatted', {
      id: socket.id,
      username: players[socket.id].username,
      message: cleanMsg,
    });
  });

  // Handle sword attack & hits
  socket.on('player:hit', (targetId: string) => {
    if (!players[targetId] || !players[socket.id]) return;
    const target = players[targetId];
    target.health = Math.max(0, target.health - 25);

    if (target.health <= 0) {
      players[socket.id].kos += 1;
      target.health = 100;
      target.x = (Math.random() - 0.5) * 12;
      target.y = 2;
      target.z = (Math.random() - 0.5) * 12;
      io.emit('player:respawned', { id: targetId, killer: players[socket.id].username });
    }

    io.emit('player:damaged', { id: targetId, health: target.health, attackerId: socket.id });
  });

  // Handle block placing (trowel gear)
  socket.on('block:place', (block: { x: number; y: number; z: number; color: string }) => {
    if (placedBlocks.length > 300) placedBlocks.shift(); // keep memory bounded
    const newBlock = { id: `block_${Date.now()}_${Math.random()}`, ...block };
    placedBlocks.push(newBlock);
    io.emit('block:placed', newBlock);
  });

  // Disconnect
  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('player:left', socket.id);
  });
});

// Fixed tick rate server state broadcast (30Hz)
setInterval(() => {
  io.emit('state:sync', players);
}, 1000 / 30);

// Setup Vite dev middleware or serve built frontend
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Zornhub Arcade] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

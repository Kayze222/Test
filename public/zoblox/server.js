// server.js (Node.js)
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const TICK_RATE = 30; // 30 updates per second
let players = {};

io.on('connection', socket => {
  console.log('Player connected:', socket.id);
  players[socket.id] = { position: { x:0, y:0, z:0 }, rotation: { _x:0,_y:0,_z:0 } };
  
  socket.emit('init', { id: socket.id, players });
  socket.broadcast.emit('playerJoined', socket.id);

  socket.on('update', (data) => {
    players[socket.id] = data;
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

// Broadcast updates at fixed tick rate
setInterval(() => {
  io.emit('state', players);
}, 1000 / TICK_RATE);

server.listen(3000, () => console.log('Server listening on port 3000'));

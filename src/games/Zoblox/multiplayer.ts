/**
 * Zoblox lightweight peer-to-peer rooms.
 * Trystero connects players using public Nostr signaling relays; game data
 * travels directly between browsers over encrypted WebRTC data channels.
 * These are presence counts of reachable peers, not a central player registry.
 */
const APP_ID = 'uk.co.zornhub.zoblox.multiplayer.2026';
const MODULE_URL = 'https://esm.sh/trystero@0.26.0?bundle';

export type LobbyNumber = 1 | 2 | 3;
type Listener = (payload: any) => void;
type Player = {
  id: string; username: string; x: number; y: number; z: number;
  rotY: number; anim: string; health: number; kos: number;
  colors: { head: string; torso: string; arms: string; legs: string };
  accessory: string;
};

let libraryPromise: Promise<any> | null = null;
function loadLibrary(): Promise<any> {
  // Dynamic remote module avoids adding an out-of-sync dependency to bun.lock.
  if (!libraryPromise) libraryPromise = import(/* @vite-ignore */ MODULE_URL).catch(error => {
    libraryPromise = null;
    throw error;
  });
  return libraryPromise;
}

function validLobby(value: unknown): value is LobbyNumber {
  return value === 1 || value === 2 || value === 3;
}

export function watchZobloxLobbies(
  onCounts: (counts: [number, number, number]) => void,
  onError?: (message: string) => void
) {
  let selected: LobbyNumber | null = null;
  let closed = false;
  let room: any = null;
  let broadcast: any = null;
  const selections = new Map<string, LobbyNumber | null>();
  const update = () => {
    const counts: [number, number, number] = [0, 0, 0];
    if (selected) counts[selected - 1] += 1;
    selections.forEach(lobby => { if (lobby) counts[lobby - 1] += 1; });
    if (!closed) onCounts(counts);
  };
  update();

  void loadLibrary().then(({ joinRoom }) => {
    if (closed) return;
    room = joinRoom({ appId: APP_ID }, 'directory-v1');
    broadcast = room.makeAction('selection');
    broadcast.onMessage = (payload: any, { peerId }: { peerId: string }) => {
      if (!selections.has(peerId)) return;
      selections.set(peerId, validLobby(payload?.lobby) ? payload.lobby : null);
      update();
    };
    room.onPeerJoin = (peerId: string) => {
      selections.set(peerId, null);
      update();
      void broadcast.send({ lobby: selected }, { target: peerId }).catch(() => {});
    };
    room.onPeerLeave = (peerId: string) => {
      selections.delete(peerId);
      update();
    };
    // The UI may have selected a room before the signaling library loaded.
    update();
  }).catch(() => { if (!closed) onError?.('Unable to reach the lobby network. Check your connection.'); });

  return {
    select(lobby: LobbyNumber | null) {
      selected = lobby;
      update();
      if (broadcast) void broadcast.send({ lobby }).catch(() => {});
    },
    close() {
      closed = true;
      if (room) void room.leave();
      selections.clear();
    }
  };
}

/** Socket.IO-like API used by the existing Three.js arena. */
export class ZobloxPeerSocket {
  id: string | undefined;
  connected = false;
  private closed = false;
  private room: any = null;
  private action: any = null;
  private listeners = new Map<string, Set<Listener>>();
  private peers = new Map<string, Player>();
  private lastSent = 0;
  private player: Player;

  constructor(lobby: LobbyNumber, customization: {
    username: string; headColor: string; torsoColor: string;
    armsColor: string; legsColor: string; accessory: string;
  }) {
    this.player = {
      id: '', username: customization.username.slice(0, 16),
      x: 0, y: 2.5, z: 10, rotY: 0, anim: 'idle',
      health: 100, kos: 0,
      colors: { head: customization.headColor, torso: customization.torsoColor,
        arms: customization.armsColor, legs: customization.legsColor },
      accessory: customization.accessory
    };
    void this.open(lobby);
  }

  on(event: string, listener: Listener) {
    const listeners = this.listeners.get(event) || new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return this;
  }

  private notify(event: string, data: any) {
    if (this.closed) return;
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  private send(data: any, target?: string) {
    if (!this.action || this.closed) return;
    const options = target ? { target } : undefined;
    void this.action.send(data, options).catch(() => {});
  }

  private async open(lobby: LobbyNumber) {
    try {
      const { joinRoom, selfId } = await loadLibrary();
      if (this.closed) return;
      this.id = selfId;
      this.player.id = selfId;
      this.room = joinRoom({ appId: APP_ID }, 'arena-v1-' + lobby);
      this.action = this.room.makeAction('game');
      this.action.onMessage = (packet: any, { peerId }: { peerId: string }) => {
        if (!packet || typeof packet !== 'object') return;
        if (packet.type === 'state') {
          if (!packet.player || typeof packet.player !== 'object') return;
          const incoming = packet.player as Player;
          const current: Player = {
            id: peerId,
            username: String(incoming.username || 'Player').slice(0, 16),
            x: Number.isFinite(incoming.x) ? incoming.x : 0,
            y: Number.isFinite(incoming.y) ? incoming.y : 2.5,
            z: Number.isFinite(incoming.z) ? incoming.z : 10,
            rotY: Number.isFinite(incoming.rotY) ? incoming.rotY : 0,
            anim: String(incoming.anim || 'idle'),
            colors: incoming.colors || this.player.colors,
            accessory: String(incoming.accessory || 'none'),
            health: Number.isFinite(incoming.health) ? incoming.health : 100,
            kos: Number.isFinite(incoming.kos) ? incoming.kos : 0,
          };
          const old = this.peers.get(peerId);
          this.peers.set(peerId, current);
          if (!old) this.notify('player:joined', current);
          else if (old.accessory !== current.accessory ||
            JSON.stringify(old.colors) !== JSON.stringify(current.colors)) {
            this.notify('player:customized', current);
          }
          this.notify('state:sync', Object.fromEntries(this.peers));
        } else if (packet.type === 'chat') {
          const message = String(packet.message || '').trim().slice(0, 120);
          if (message) this.notify('player:chatted', {
            id: peerId, username: this.peers.get(peerId)?.username || 'Player', message
          });
        } else if (packet.type === 'hit' && packet.targetId === this.id) {
          this.player.health = Math.max(0, this.player.health - 25);
          this.notify('player:damaged', { health: this.player.health, attackerId: peerId });
          if (this.player.health === 0) {
            this.player.health = 100;
            this.player.x = 0; this.player.y = 3; this.player.z = 10;
            this.notify('player:respawned', { id: this.id });
            this.send({ type: 'ko', targetId: peerId }, peerId);
          }
          this.send({ type: 'state', player: this.player });
        } else if (packet.type === 'ko' && packet.targetId === this.id) {
          this.player.kos++;
          this.notify('player:ko', { id: peerId, username: this.peers.get(peerId)?.username || 'Player' });
        }
      };
      this.room.onPeerJoin = (peerId: string) => {
        this.send({ type: 'state', player: this.player }, peerId);
      };
      this.room.onPeerLeave = (peerId: string) => {
        this.peers.delete(peerId);
        this.notify('player:left', peerId);
      };
      this.connected = true;
      this.notify('init', { id: this.id, players: {} });
    } catch (error) {
      this.notify('connection:error', 'Unable to connect to other players.');
    }
  }

  emit(event: string, data: any) {
    if (this.closed) return;
    if (event === 'player:update') {
      Object.assign(this.player, {
        x: data.x, y: data.y, z: data.z, rotY: data.rotY, anim: data.anim
      });
      // Don't send render-frame-rate traffic to every peer.
      if (performance.now() - this.lastSent > 80) {
        this.lastSent = performance.now();
        this.send({ type: 'state', player: this.player });
      }
    } else if (event === 'player:customize') {
      this.player.username = String(data.username || this.player.username).slice(0, 16);
      if (data.colors) this.player.colors = data.colors;
      if (data.accessory) this.player.accessory = data.accessory;
      this.send({ type: 'state', player: this.player });
    } else if (event === 'player:chat') {
      const message = String(data || '').trim().slice(0, 120);
      if (message) this.send({ type: 'chat', message });
    } else if (event === 'player:hit' && typeof data === 'string') {
      this.send({ type: 'hit', targetId: data }, data);
    }
  }

  disconnect() {
    this.closed = true;
    this.connected = false;
    if (this.room) void this.room.leave();
    this.listeners.clear();
    this.peers.clear();
  }
}

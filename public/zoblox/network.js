// Browser multiplayer adapter for the original standalone Zoblox game.
// Uses the same Trystero 0.26 signaling API as the React version, with a
// separate namespace so incompatible map/game states never mix.
const APP_ID = 'uk.co.zornhub.zoblox.multiplayer.2026';
const MODULE_URL = 'https://esm.sh/trystero@0.26.0?bundle';
let loading = null;

export function loadPeerLibrary() {
  if (!loading) {
    loading = import(/* @vite-ignore */ MODULE_URL).catch(error => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

export function startLobbyDirectory(lib, onCounts) {
  const room = lib.joinRoom({ appId: APP_ID }, 'standalone-directory-v1');
  const message = room.makeAction('selection');
  let selected = null;
  const peers = new Map();
  let closed = false;

  const update = () => {
    if (closed) return;
    const counts = [0, 0, 0];
    if (selected) counts[selected - 1] += 1;
    for (const lobby of peers.values()) {
      if (lobby) counts[lobby - 1] += 1;
    }
    onCounts(counts);
  };
  message.onMessage = (data, { peerId }) => {
    if (!peers.has(peerId)) return;
    const chosen = [1, 2, 3].includes(data?.lobby) ? data.lobby : null;
    peers.set(peerId, chosen);
    update();
  };
  room.onPeerJoin = peerId => {
    peers.set(peerId, null);
    update();
    void message.send({ lobby: selected }, { target: peerId }).catch(() => {});
  };
  room.onPeerLeave = peerId => {
    peers.delete(peerId);
    update();
  };
  update();

  return {
    select(lobby) {
      selected = [1, 2, 3].includes(lobby) ? lobby : null;
      update();
      void message.send({ lobby: selected }).catch(() => {});
    },
    leave() {
      closed = true;
      void room.leave();
      peers.clear();
    }
  };
}

export function createLegacyRoom(lib, lobby, requestedName) {
  if (![1, 2, 3].includes(lobby)) throw new Error('Choose a lobby before entering the game');
  const clientId = lib.selfId;
  const username = String(requestedName || 'Player').trim().slice(0, 16) || 'Player';
  const connection = lib.joinRoom({ appId: APP_ID }, 'standalone-arena-v1-' + lobby);
  const action = connection.makeAction('game');
  const peers = { [clientId]: { username } };
  const presence = {};
  let ownPresence = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { _x: 0, _y: 0, _z: 0 },
    isMoving: false, isJumping: false
  };
  let presenceListener = null;
  let closed = false;
  const adapter = {
    clientId,
    peers,
    onmessage: () => {},
    subscribePresence(fn) {
      presenceListener = fn;
      fn({ ...presence });
    },
    updatePresence(patch) {
      if (closed || !patch || typeof patch !== 'object') return;
      ownPresence = { ...ownPresence, ...patch };
      void action.send({ type: 'presence', username, presence: ownPresence }).catch(() => {});
    },
    send(message) {
      if (closed || !message || typeof message !== 'object') return;
      // A peer cannot be trusted to kick another peer in a serverless room.
      if (message.type === 'kick' || message.type === 'disconnected') return;
      const safe = { ...message, clientId };
      if (safe.type === 'chat') safe.message = String(safe.message || '').slice(0, 120);
      adapter.onmessage({ data: safe });
      void action.send({ type: 'event', event: safe }).catch(() => {});
    },
    close() {
      closed = true;
      void connection.leave();
    }
  };

  const updateSubscribers = () => {
    if (!closed) presenceListener?.({ ...presence });
  };
  action.onMessage = (data, { peerId }) => {
    if (closed || !data || typeof data !== 'object') return;
    if (data.type === 'hello' || data.type === 'presence') {
      if (!peers[peerId]) peers[peerId] = {};
      peers[peerId].username = String(data.username || 'Player').slice(0, 16);
      const validState = data.presence;
      if (validState && typeof validState === 'object' &&
        validState.position && typeof validState.position === 'object' &&
        validState.rotation && typeof validState.rotation === 'object') {
        const { x, y, z } = validState.position;
        if ([x, y, z].every(Number.isFinite)) {
          presence[peerId] = validState;
          updateSubscribers();
        }
      }
      if (data.type === 'hello') {
        void action.send({ type: 'presence', username, presence: ownPresence },
          { target: peerId }).catch(() => {});
      }
    } else if (data.type === 'event' && data.event) {
      const event = data.event;
      if (event.type === 'kick' || event.type === 'disconnected') return;
      const safe = { ...event, clientId: peerId };
      if (safe.type === 'chat') safe.message = String(safe.message || '').slice(0, 120);
      adapter.onmessage({ data: safe });
    }
  };
  connection.onPeerJoin = peerId => {
    void action.send({ type: 'hello', username, presence: ownPresence },
      { target: peerId }).catch(() => {});
  };
  connection.onPeerLeave = peerId => {
    delete peers[peerId];
    delete presence[peerId];
    adapter.onmessage({ data: { type: 'disconnected', clientId: peerId } });
    updateSubscribers();
  };
  window.addEventListener('pagehide', () => adapter.close(), { once: true });
  return adapter;
}

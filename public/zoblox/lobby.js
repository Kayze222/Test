
import { loadPeerLibrary, startLobbyDirectory } from './network.js';

const style = document.createElement('style');
style.textContent = `
#zoblox-lobby { position:fixed; inset:0; z-index:50000; overflow:auto;
  display:flex; align-items:center; justify-content:center; padding:24px;
  box-sizing:border-box; font-family:'Source Sans Pro',Arial,sans-serif;
  background:radial-gradient(circle at 50% 15%,#316554,#14201e 70%); color:white; }
#zoblox-lobby * { box-sizing:border-box; }
#zoblox-lobby .zb-wrap { width:min(820px,100%); }
#zoblox-lobby .zb-kicker { font-size:12px; letter-spacing:5px;
  font-weight:800; color:#66ffc0; text-align:center; }
#zoblox-lobby h1 { text-align:center; font-size:clamp(50px,10vw,82px);
  letter-spacing:4px; margin:5px 0; line-height:1; color:white;
  text-shadow:6px 6px 0 #0b1512; }
#zoblox-lobby .zb-description { text-align:center; margin:14px 0 28px;
  color:#c6d9d3; }
#zoblox-lobby .zb-profile { display:flex; align-items:center; gap:12px; margin:0 auto 24px;
  padding:14px; border-radius:11px; border:1px solid #63786f; background:#1e2d2a;
  max-width:430px; }
#zoblox-lobby .zb-profile label { font-size:12px; color:#a8d5c4; font-weight:bold; white-space:nowrap; }
#zoblox-lobby .zb-profile input { width:100%; min-width:0; background:#0f1d19;
  padding:10px 11px; border-radius:6px; border:1px solid #3b6757; color:#fff; font:inherit; }
#zoblox-lobby .zb-rooms { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:15px; }
#zoblox-lobby .zb-room { display:flex; flex-direction:column; justify-content:space-between;
  cursor:pointer; text-align:left; color:#fff; min-height:225px; padding:20px; border-radius:13px;
  background:#252d2b; border:2px solid #53665d; box-shadow:0 7px 0 #0a1612; font:inherit; }
#zoblox-lobby .zb-room:hover, #zoblox-lobby .zb-room:focus-visible { border-color:#55ffad; transform:translateY(-2px); }
#zoblox-lobby .zb-room:disabled { opacity:.6; cursor:wait; transform:none; }
#zoblox-lobby .zb-label { font-size:12px; color:#61edaa; letter-spacing:2px; font-weight:800; }
#zoblox-lobby h2 { margin:15px 0 4px; font-size:27px; font-weight:900; }
#zoblox-lobby .zb-hint { font-size:13px; color:#aebdb7; }
#zoblox-lobby .zb-count { margin:0 0 14px; font-weight:700; font-size:14px; }
#zoblox-lobby .zb-dot { display:inline-block; width:9px; height:9px;
  border-radius:50%; margin-right:7px; background:#4dff9b; }
#zoblox-lobby .zb-join { display:block; border-radius:7px; text-align:center;
  padding:11px; background:#4cff9e; color:#07160e; font-size:13px; font-weight:900; }
#zoblox-lobby .zb-status { margin-top:27px; text-align:center; color:#c6d9d3; font-size:13px; }
#zoblox-lobby .zb-back { display:block; width:max-content; margin:17px auto 0;
  color:#83ffbb; text-decoration:none; font-size:13px; }
#zoblox-leave { position:fixed; z-index:49000; top:12px; left:12px;
  background:#1a2d25; color:white; font:700 14px Arial,sans-serif; cursor:pointer;
  border:2px solid #51ffad; padding:11px 16px; border-radius:9px; }
@media(max-width:650px) { #zoblox-lobby .zb-rooms { grid-template-columns:1fr; }
  #zoblox-lobby .zb-room { min-height:140px; } }
`;
document.head.append(style);

const overlay = document.createElement('div');
overlay.id = 'zoblox-lobby';
overlay.innerHTML = `
  <section class="zb-wrap">
    <div class="zb-kicker">ZORNHUB ARCADE</div>
    <h1>ZOBLOX</h1>
    <p class="zb-description">Select a server and play with real people.</p>
    <div class="zb-profile">
      <label for="zb-name">PLAYER NAME</label>
      <input id="zb-name" type="text" maxlength="16" autocomplete="off" placeholder="Your name">
    </div>
    <div class="zb-rooms">
      <button class="zb-room" data-lobby="1" type="button">
        <div><div class="zb-label">SERVER 01</div><h2>CLASSIC</h2><div class="zb-hint">The original baseplate</div></div>
        <div><div class="zb-count"><span class="zb-dot"></span><span data-count="1">Checking...</span></div><span class="zb-join">JOIN SERVER →</span></div>
      </button>
      <button class="zb-room" data-lobby="2" type="button">
        <div><div class="zb-label">SERVER 02</div><h2>CHAOS</h2><div class="zb-hint">Your own space for chaos</div></div>
        <div><div class="zb-count"><span class="zb-dot"></span><span data-count="2">Checking...</span></div><span class="zb-join">JOIN SERVER →</span></div>
      </button>
      <button class="zb-room" data-lobby="3" type="button">
        <div><div class="zb-label">SERVER 03</div><h2>OBBY</h2><div class="zb-hint">Take on the obstacle course</div></div>
        <div><div class="zb-count"><span class="zb-dot"></span><span data-count="3">Checking...</span></div><span class="zb-join">JOIN SERVER →</span></div>
      </button>
    </div>
    <p class="zb-status" role="status" aria-live="polite">Connecting to the multiplayer network...</p>
    <a class="zb-back" href="/#zoblox">← Return to arcade</a>
  </section>`;
document.body.appendChild(overlay);
const nameInput = overlay.querySelector('#zb-name');
const status = overlay.querySelector('.zb-status');
nameInput.value = localStorage.getItem('zoblox_player_name') || 'Player_' + Math.floor(1000 + Math.random() * 9000);
let network = null;
let directory = null;
let joining = false;

const updateCounts = counts => {
  for (let i = 1; i <= 3; i++) {
    const n = counts[i - 1];
    overlay.querySelector('[data-count="' + i + '"]').textContent =
      n + (n === 1 ? ' player online' : ' players online');
  }
};
const loading = loadPeerLibrary().then(lib => {
  network = lib;
  directory = startLobbyDirectory(lib, updateCounts);
  status.textContent = 'Pick a server to join. Player counts reflect connected browsers.';
}).catch(err => {
  console.error('Zoblox peer network unavailable:', err);
  status.textContent = 'Multiplayer network unavailable. Please refresh and try again.';
  status.style.color = '#ff9f9f';
});

overlay.querySelectorAll('[data-lobby]').forEach(button => {
  button.addEventListener('click', async () => {
    if (joining) return;
    joining = true;
    overlay.querySelectorAll('[data-lobby]').forEach(b => { b.disabled = true; });
    status.textContent = 'Joining lobby ' + button.dataset.lobby + '...';
    try {
      await loading;
      if (!network || !directory) throw new Error('Multiplayer network unavailable');
      const lobby = Number(button.dataset.lobby);
      const username = nameInput.value.trim().replace(/[<>]/g, '').slice(0, 16) ||
        'Player_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('zoblox_player_name', username);
      window.zobloxNetwork = network;
      window.zobloxLobby = lobby;
      window.zobloxName = username;
      directory.select(lobby);
      await import('./game.js');
      overlay.remove();

      const leave = document.createElement('button');
      leave.id = 'zoblox-leave';
      leave.textContent = '← Lobbies';
      leave.addEventListener('click', () => location.reload());
      document.body.append(leave);
    } catch (err) {
      console.error('Zoblox lobby join failed:', err);
      directory?.select(null);
      status.textContent = 'Failed to enter. Please refresh and retry.';
      status.style.color = '#ff9f9f';
    } finally {
      joining = false;
      overlay.querySelectorAll('[data-lobby]').forEach(b => { b.disabled = false; });
    }
  });
});

window.addEventListener('pagehide', () => directory?.leave(), { once: true });

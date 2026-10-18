const set = (id, message, ok) => {
  const target = document.getElementById(id);
  if (!target) return;
  target.textContent = message;
  target.className = ok ? 'ok' : 'warn';
};

const isolated = window.crossOriginIsolated === true;
const memoryReady = typeof SharedArrayBuffer !== 'undefined';
set('isolation', isolated ? 'READY' : 'HEADERS MISSING', isolated);
set('memory', memoryReady ? 'SUPPORTED' : 'UNAVAILABLE', memoryReady);

let webgl2 = false;
try {
  const canvas = document.createElement('canvas');
  webgl2 = Boolean(canvas.getContext('webgl2'));
} catch (_error) {}
set('graphics', webgl2 ? 'SUPPORTED' : 'NOT AVAILABLE', webgl2);

const inspect = document.getElementById('inspect');
try {
  const response = await fetch('/halo/engine/version.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Engine build unavailable');
  const version = await response.json();
  const build = version.build ?? version.build_number ?? version.version ?? 'Present';
  set('engine', 'INSTALLED (' + String(build).slice(0, 35) + ')', true);
  if (inspect) inspect.removeAttribute('aria-disabled');
} catch (_error) {
  set('engine', 'NOT DEPLOYED', false);
}

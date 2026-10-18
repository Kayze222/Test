/**
 * Stage 1: install the authentic, asset-free OpenCE browser runtime.
 * Nothing from the copyrighted Halo retail game is downloaded or bundled.
 * Release is pinned by both tag and GitHub-published SHA-256 digest.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TAG = 'build-235';
const EXPECTED_SHA256 = '7bbeabddcb8f694dd96bcac948faf7dacbe6cd1fb3e2568c3a5d14178e8eb9f8';
const URL = 'https://github.com/OpenCommunityEdition/OpenCE/releases/download/' + TAG + '/halo-web-release.zip';
const OUTPUT = resolve(fileURLToPath(new URL('../dist/halo/engine/', import.meta.url)));

async function findWebRoot(folder, depth = 0) {
  if (depth > 5) return null;
  const items = await readdir(folder, { withFileTypes: true });
  if (items.some(item => item.isFile() && item.name === 'index.html') &&
      items.some(item => item.isFile() && item.name === 'version.json')) {
    return folder;
  }
  for (const item of items) {
    if (!item.isDirectory() || item.name === '__MACOSX') continue;
    const found = await findWebRoot(join(folder, item.name), depth + 1);
    if (found) return found;
  }
  return null;
}

async function main() {
  if (process.env.HALO_SKIP_WEB_INSTALL === '1') {
    console.log('[OpenCE] Installation skipped for local frontend-only testing');
    return;
  }

  const temp = await mkdtemp(join(tmpdir(), 'zornhub-opence-'));
  try {
    console.log('[OpenCE] Downloading pinned engine release ' + TAG);
    const response = await fetch(URL, {
      headers: { 'User-Agent': 'Zornhub-OpenCE-Stage1' },
      redirect: 'follow',
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) throw new Error('Release download failed: HTTP ' + response.status);
    const archive = Buffer.from(await response.arrayBuffer());
    if (archive.length > 50000000) throw new Error('Unexpectedly large engine archive');
    const digest = createHash('sha256').update(archive).digest('hex');
    if (digest !== EXPECTED_SHA256) throw new Error('OpenCE release SHA256 mismatch');
    const zipFile = join(temp, 'halo-web-release.zip');
    await writeFile(zipFile, archive);
    const extracted = join(temp, 'extracted');
    await mkdir(extracted);
    execFileSync('unzip', ['-q', zipFile, '-d', extracted], {
      timeout: 60000,
      stdio: 'pipe',
    });
    const webRoot = await findWebRoot(extracted);
    if (!webRoot) throw new Error('OpenCE archive missing browser entry files');
    await mkdir(OUTPUT, { recursive: true });
    await cp(webRoot, OUTPUT, { recursive: true, force: true });
    const version = JSON.parse(await readFile(join(OUTPUT, 'version.json'), 'utf8'));
    await writeFile(join(OUTPUT, 'zornhub-build.json'), JSON.stringify({
      project: 'OpenCommunityEdition/OpenCE',
      upstreamTag: TAG,
      archiveSha256: EXPECTED_SHA256,
      includesHaloRetailAssets: false
    }, null, 2));
    console.log('[OpenCE] Runtime installed in ' + OUTPUT);
    console.log('[OpenCE] Build version: ' + JSON.stringify(version).slice(0, 180));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
await main();

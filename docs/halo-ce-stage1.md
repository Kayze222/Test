# Halo CE (OpenCE) - Zornhub Stage 1

## Purpose

This stage integrates the **actual OpenCE Halo: Combat Evolved browser engine**, not a Halo-inspired remake, into an isolated Zornhub preview. It does **not** distribute the game's retail assets, so **the original game is not yet playable without user-provided data**. The user's final requirement is one-click play with no file selection or install; that can only be implemented after rights to publicly distribute those assets are established.

### File map

- /halo/ - Zornhub integration preview and readiness checks
- /halo/engine/ - self-hosted upstream OpenCE WebAssembly runtime, extracted at build time
- scripts/install-halo-web.mjs - pinned source zip download, SHA-256 validation, extraction
- vercel.json - COOP/COEP headers for WebAssembly pthreads and SharedArrayBuffer
- src/components/ArcadeLobby.tsx - Zornhub entry point, isolated from all other games

### Integrity and provenance

Upstream: https://github.com/OpenCommunityEdition/OpenCE
Release: build-235, halo-web-release.zip
SHA-256: 7bbeabddcb8f694dd96bcac948faf7dacbe6cd1fb3e2568c3a5d14178e8eb9f8

The release is pinned; updates must be intentional and tested. No maps, retail assets, or game data are in this branch. The upstream web build normally asks the visitor to supply a legally obtained Xbox disc image or maps directory. That is only exposed behind the developer diagnostic link, **not** claimed as a zero-upload finished release.

### Test

1. Run npm run build in an environment with outbound HTTPS and unzip.
2. Confirm dist/halo/index.html and dist/halo/engine/{index.html,version.json}.
3. Deploy **preview branch only**, not main, and open /halo/.
4. Confirm crossOriginIsolated true, WebGL2 and SharedArrayBuffer checks pass on desktop.
5. Open /halo/engine/ in a test browser. With no game maps, only the source-runtime/setup UI can be evaluated. Do not claim campaign or multiplayer game testing is complete.
6. Ensure / and other Zornhub games are unaffected.
7. The engine cannot run copyrighted retail content until lawful distribution and asset-loading have been solved.

### Future stage - licensed zero-file launch

- Obtain verified authorization for redistribution of Microsoft's Halo retail game data.
- Host the permitted maps/audio/assets from an approved source; do not commit them to this public repository.
- Implement licensed, versioned, hash-verified fetching into OpenCE's OPFS game-data folder, with progress, storage checks, retries, consent, and offline cache.
- Validate campaign, multiplayer, controller support, memory, storage and cross-browser performance before enabling a real PLAY button.
- OpenCE's own asset importer alone **does not** meet the user's no-files requirement.
- Production merge and deployment should be explicitly approved after preview review, ideally after the other agent's edits stabilize.

### Technical concerns

Browser WebAssembly requires ~2.1 GB memory; original map data requires roughly 3 GB local storage. The site's existing Zoblox Socket.IO game and other React components should not be refactored for this preview. Vercel preview protection may require project sign-in.

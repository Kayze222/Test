# BLOOD//CIRCUIT (V4 UNCANNY)

A static browser FPS. This folder contains the V4 Expanded Arena + Uncanny Enemies source, including the embedded VCR OSD Mono font.

## Deploy on Vercel

1. Project lives in the `blood-circuit/` subdirectory of the shared `Kayze222/Test` repository to avoid modifying other projects.
2. In Vercel, import `Kayze222/Test` and set **Root Directory: blood-circuit**.
3. Choose **Framework Preset: Other**, with no build command or output directory.
4. Deploy. Future pushes to the production branch (`main`) automatically deploy the latest version. Pull requests and other branches can receive preview deployments.

If working with ChatGPT, ask it to push the finished changes to the connected GitHub repository. Publishing files to a ChatGPT Sites project does not automatically update Vercel.

## Run locally

Serve this folder using any HTTP static server (for example, `python -m http.server 8000`) and visit `http://localhost:8000`. The browser's `file://` mode blocks ESM scripts.

## Notes

- No Node dependencies or framework build step.
- Progress is stored in browser localStorage per origin, so localhost, ChatGPT Sites and Vercel saves are separate.
- Use only project-owned assets and code when republishing.
- Test playability on the deployed URL; static/JS integrity checks do not substitute for a full WebGL playtest.

## V4 enemy and art update

Four new active enemies: **Stalker** (teleport warning), **Skitter** (flanking melee), **Chorister** (hovering fan projectile volley), and **Leech** (health-draining melee). New ambient watcher silhouettes, red flickering lights, stained terrain, darker fog and online-sourced CC0 surface textures with offline procedural fallbacks. See `ASSET_CREDITS.md`.

**Playtest milestones:** Skitter starts in wave 3, Stalker in wave 4, Chorister in wave 6 and Leech in wave 8. The optional online-sourced CC0 material maps fall back gracefully when blocked.

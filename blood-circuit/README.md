# BLOOD//CIRCUIT - V10 Original Sprite Sheets

Retro 3D arena with classic 2D first-person weapon/hand sprite overlay.

## Changes
- Retired the skinned GLB arm viewmodel (and the async GLTF loader) from the render path.
- Original-style weapon and hand frames extracted from the user-supplied pistol, shotgun, heavy-gun and Joblez hand sheets in `assets/viewmodels/`.
- New `sprite-viewmodel.js` frame system for three weapons, muzzle flash, parry fists and frame-based weapon lowering.
- Viewmodel is a transparent pixel-art canvas, separate from the WebGL arena, supporting bob, recoil, strafe tilt, slides and switching.
- Existing combat mechanics, muzzle traces, coins, chests and progression remain unchanged.
- V10 uses direct crops from user-supplied reference sprite sheets, not the generated Kenney-based V9 art. Third-party source asset redistribution rights have not been verified. Confirm permissions or replace with licensed alternatives before a public commercial release.
- No runtime remote textures or image CDN dependencies.

## Run
Serve this directory over HTTP, such as `python -m http.server 8000`. Play at http://localhost:8000. Pushing the `blood-circuit` folder to `Kayze222/Test` main deploys through Vercel.

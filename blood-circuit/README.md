# BLOOD//CIRCUIT - V9 Sprite Viewmodels

Retro 3D arena with classic 2D first-person weapon/hand sprite overlay.

## Changes
- Retired the skinned GLB arm viewmodel (and the async GLTF loader) from the render path.
- Original weapon + hands frames in `assets/viewmodels/`.
- New `sprite-viewmodel.js` frame system for three weapons, muzzle flash, parry fists and frame-based weapon lowering.
- Viewmodel is a transparent pixel-art canvas, separate from the WebGL arena, supporting bob, recoil, strafe tilt, slides and switching.
- Existing combat mechanics, muzzle traces, coins, chests and progression remain unchanged.
- All original sprites are based on the project's Kenney Blaster Kit 2.1 CC0 models, with newly drawn 2D hand shapes. Reference screenshots were not copied.
- No runtime remote textures or image CDN dependencies.

## Run
Serve this directory over HTTP, such as `python -m http.server 8000`. Play at http://localhost:8000. Pushing the `blood-circuit` folder to `Kayze222/Test` main deploys through Vercel.

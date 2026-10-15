# Source textures (CC0)

The V4 industrial albedo textures are from **ambientCG**, sourced via
[petroulacl/fps-asset-kit](https://github.com/petroulacl/fps-asset-kit).
They are distributed under the Creative Commons CC0 1.0 public-domain dedication.

- `Concrete034` - floor / cast concrete
- `Plaster001` - broken, stained interior wall
- `Metal049A` - industrial sheet metal

Original source: https://ambientcg.com/

The three albedo maps are optimized to 512 pixels, delivered over HTTPS by
Cloudinary, and assigned to the existing arena surface materials in
`arena-textures.js`. If external texture loading is blocked or unavailable,
procedural textures take over automatically. The game does **not** require
external textures in order to function. No live API calls are needed.

Texture URLs are openly declared in `arena-textures.js`.


## V10 first-person art

The `assets/viewmodels/*.png` sprites in this version are edited crops from the user-supplied reference sheets (pistol, shotgun, heavy gun and Joblez hands). They may incorporate third-party game artwork. Their original licenses have not been verified, and inclusion here does **not** imply a CC0 license. Secure distribution permission before a public or commercial release.

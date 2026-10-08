# Animesh Portfolio V10 — Cosmic Flagship Edition

An upgraded, responsive GitHub Pages portfolio built on the V9 design. This is the complete `docs/` static site, **not** a replacement for the README of your GitHub profile.

## What's new

- **Fullscreen warp intro:** 2-second star-tunnel animation, with a visible **Skip Intro** button, automatic exit, and reduced-motion handling.
- **Planet-to-planet travel:** Click the small planets in the hero or the planetary side navigation to travel between sections with a warp transition. Drag the globe to orbit the camera when the Three.js scene has loaded.
- **Deeper interactive HUD:** space-sector labels, glass panels, navigable planets, and controls that preserve the underlying links.
- **Continuously moving galaxy background:** an original animated **WebGL fragment shader** with star layers, nebula noise, and subtle cursor parallax. A moving CSS + canvas background remains available if WebGL is unsupported.
- **Real Three.js scene:** procedurally textured planet, 5 clickable smaller planets, volumetric-style atmosphere, orbit paths, comet particle trail, and starfield. The 3D scene is optional and **falls back to the existing self-contained 2D globe** when its CDN or WebGL is unavailable.
- **Expanded About section:** extra space, 3 complete paragraphs, a separate galaxy orb, and responsive text layout with no fixed content height. Uses your existing real profile photograph.
- **Motion controls:** Pause motion, reduced-motion preference, keyboard-accessible navigation and skip intro.

## Files

```
Animesh-Portfolio-V10/
  START_HERE.md
  docs/
    index.html
    style.css
    app.js
    scene.js          # animated canvas fallback + About/Contact globes
    three-scene.js    # genuine Three.js scene (loaded over HTTPS)
    galaxy.js         # standalone WebGL galaxy shader
    warp.js           # warp intro + click-to-travel transitions
    .nojekyll
    assets/
      avatar.png
      favicon.svg
```

## Preview locally (Windows PowerShell)

Open VS Code's terminal **inside the extracted `Animesh-Portfolio-V10` folder** and run:

```powershell
py -m http.server 5500 --directory docs
```

Then visit **http://localhost:5500/**. Do not open `index.html` as a `file:///` URL; module imports are expected to run through a local web server.

### Internet requirement

The optional Three.js engine and OrbitControls load from **jsDelivr** (`three@0.167.1`) via an import map. These require internet access. If unavailable, the bundled, local 2D globe, starfield and page navigation still work. GitHub statistics and contribution images also require their external services. No npm setup is required for the static deployment.

## Deploy to your existing GitHub Pages portfolio

Your repository: https://github.com/Animesh-666/Animesh-666  
Your Pages settings: `main` branch → `/docs`

1. Open your **existing local clone** of `Animesh-666` in VS Code. Check for uncommitted work before pulling:

```powershell
git switch main
git status
git pull --ff-only origin main
```

2. Extract this V10 package. **Copy the contents of its `docs` folder** over the contents of your existing repository's `docs` folder. Do not replace the entire repository or the profile `README.md`. Preserve your GitHub Actions workflows.

3. Confirm the files are present, then commit and push:

```powershell
git status
git add docs
git commit -m "Launch V10 Cosmic Flagship portfolio"
git push origin main
```

4. Visit https://animesh-666.github.io/Animesh-666/ after Pages deploys, then hard-refresh (Ctrl + Shift + R).

## How to customize

- Headline, About, projects and contacts: `docs/index.html`
- Colors, glass panels, responsive behavior: `docs/style.css`
- Native background shader color/motion: `docs/galaxy.js`
- Star-warp timing/navigation: `docs/warp.js`
- Real 3D solar system/camera: `docs/three-scene.js`
- API stats, menu, pause button: `docs/app.js`

## Performance & accessibility

The galaxy shader caps resolution and runs near 30–35 fps; the hero scene only animates when visible. Reduced-motion preferences and Pause motion are respected. On mobile, the smaller destination navigator is hidden and the standard menu remains available.

## Testing

JavaScript syntax, local-file references and browser checks for navigation, intro skip, motion pause, About text visibility, and page overflow have been run. Full CDN-backed Three.js rendering could not be tested from this offline build environment; test it from an internet-connected browser before publishing to your live site.

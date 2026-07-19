# Babylon.js WebXR Starter + Havok Physics

A minimal but complete WebXR (VR) sample built with [Babylon.js](https://www.babylonjs.com/),
Vite and TypeScript — the **Babylon.js twin of the Three.js + Jolt starter**, with the
same modules and the same behavior so the two frameworks are easy to compare side by side.

Grab the hovering cubes with the controller **grip button** or a hand-tracking **pinch**,
move them around, release to **throw** or drop. Runs as a normal 3D web page on desktop
and as an immersive VR experience on WebXR devices such as the **Meta Quest 3**.

## What it demonstrates

- Engine / scene / render-loop setup and WebXR via `createDefaultXRExperienceAsync`
- **Havok physics** (the engine recommended by the Babylon.js team, WASM-based like Jolt):
  dynamic bodies, kinematic ("animated") bodies, gravity switching, restitution
- Grab & throw: a held cube is kinematic and follows the hand via `setTargetTransform`,
  so Havok derives its velocity — releasing mid-motion throws it
- XR input: controllers (grip button) **and** tracked hands (pinch) through one code path
- Hover highlight via per-frame ray picking against the grabbable cubes
- An invisible physics room so thrown cubes stay in the play area
- Teleportation on the floor mesh (Babylon bonus — one line, no Three.js equivalent)
- Lazy-loaded Babylon.js Inspector for debugging (`Ctrl+Alt+I`)

## Module structure (mirrors the Three.js starter)

```
src/main.ts          wires the modules together, runs the render loop
src/scene.ts         Babylon.js bootstrap: engine, scene, camera, WebXR, desktop fallback
src/physics.ts       Havok setup — the only module that talks to the physics API
src/environment.ts   lights, floor, grid, torus knot, invisible physics room
src/cubes.ts         the grabbable cubes: meshes + physics bodies
src/input.ts         XR input devices: controllers + tracked hands
src/interaction.ts   gameplay: hover, grab, throw
```

Worth comparing with the Three.js version:

- `physics.ts` is a fraction of `physics.js` — Babylon has physics integration built in
  (no object layers, no manual `stepSimulation()`, no body→mesh sync).
- `scene.ts`'s one `createDefaultXRExperienceAsync` call replaces XRButton +
  controller/hand model factories + laser pointer setup.
- `interaction.ts` is logic-for-logic identical to `interaction.js`.

## Running it

```bash
npm install
npm run dev
```

Vite prints two URLs, e.g.

```
Local:   https://localhost:5173/
Network: https://192.168.x.x:5173/
```

### On desktop

Open the **Local** URL. Orbit with the mouse, zoom with the wheel.
`Ctrl+Alt+I` opens the Inspector (scene explorer + property grid).

> The HTTPS certificate is self-signed (dev only) — accept the browser warning.

### On Meta Quest 3

1. PC and Quest must be on the **same Wi-Fi network**.
2. Open the **Network** URL (`https://<your-pc-ip>:5173`) in the Quest browser.
3. Accept the self-signed-certificate warning (Advanced → Proceed).
4. Tap the **goggles button** in the bottom-right corner to enter VR.

In VR:

- **Point + GRIP button** (or **pinch** with tracked hands) on a cube → grab it
- Move and **release** → throw or drop (first release switches that cube's gravity on)
- **Thumbstick forward** → teleport arc onto the floor, release to teleport

Put the controllers down to switch to hand tracking (enable it in the Quest
settings under *Movement tracking* if pinching does nothing).

WebXR only works over HTTPS, which is why the dev server uses
`@vitejs/plugin-basic-ssl` (see [vite.config.ts](vite.config.ts)).

## Troubleshooting

- **No goggles button?** The browser has no WebXR support (normal on desktop
  Chrome without a headset). The page still works as a flat 3D app.
- **Quest can't reach the URL?** Check both devices are on the same network
  and that the Windows firewall allows Node.js/Vite on private networks.
- **Black screen after certificate warning?** Reload the page once after
  accepting the certificate.
- **`Cannot use 'import.meta' outside a module` or WASM errors?** Make sure
  `@babylonjs/havok` stays excluded from Vite's `optimizeDeps`
  (see [vite.config.ts](vite.config.ts)).

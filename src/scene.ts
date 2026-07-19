/**
 * scene.ts — Babylon.js bootstrap
 * -------------------------------
 * Creates the core objects every Babylon.js app needs (engine, scene,
 * camera), enables WebXR and the desktop fallback controls. No
 * app-specific content lives here — that is what environment.ts and
 * cubes.ts are for.
 *
 * Compare with scene.js in the Three.js starter: Babylon's Engine plays
 * the role of Three's WebGLRenderer, and createDefaultXRExperienceAsync
 * replaces the manual XRButton + controller setup.
 */

import { ArcRotateCamera, Color4, Engine, Scene, Vector3 } from "@babylonjs/core";

// The canvas Babylon.js renders into (Three.js creates its own canvas via
// the renderer; in Babylon we create it and hand it to the engine).
const canvas = document.createElement("canvas");
canvas.id = "renderCanvas";
document.querySelector<HTMLDivElement>("#app")!.appendChild(canvas);

// The engine is the bridge between Babylon.js and WebGL — the counterpart
// of Three's WebGLRenderer({ antialias: true }).
export const engine = new Engine(canvas, true, { stencil: true });

export const scene = new Scene(engine);
scene.clearColor = Color4.FromHexString("#202830FF"); // = Three's scene.background

// Desktop fallback: orbit the camera with the mouse when no headset is
// used — the counterpart of Three's OrbitControls. In WebXR, 1 unit = 1 m,
// so the camera orbits a point at roughly chest height.
const camera = new ArcRotateCamera(
  "desktopCamera",
  -Math.PI / 2, // look along -Z, same as the Three.js starter
  1.35, // slightly above the horizon
  2.5, // distance to the target
  new Vector3(0, 1.2, -0.5),
  scene,
);
camera.minZ = 0.05; // near plane: 5 cm — objects get close to your face in VR
camera.wheelDeltaPercentage = 0.01;
camera.attachControl(canvas, true);

// --- WebXR -------------------------------------------------------------
// One call does what took several manual steps in Three.js:
//  - feature-detects WebXR and adds the "goggles" button (= XRButton)
//  - creates the XR camera that follows the headset pose
//  - loads controller models + laser pointer (= XRControllerModelFactory)
//  - prepares thumbstick teleportation (no Three.js equivalent — bonus!)
export const xr = await scene.createDefaultXRExperienceAsync({
  // Request every optional feature the device supports — this puts
  // "hand-tracking" into the session request, like the XRButton
  // optionalFeatures option in the Three.js starter.
  optionalFeatures: true,
});

// xr.baseExperience is undefined when the browser has no WebXR support —
// the app then keeps running as a normal 3D web page (desktop fallback).
if (!xr.baseExperience) {
  console.warn("WebXR is not available in this browser — desktop mode only.");
}

// Keep the desktop canvas sharp on window resize (irrelevant inside VR,
// where the XR session controls the framebuffer size).
window.addEventListener("resize", () => engine.resize());

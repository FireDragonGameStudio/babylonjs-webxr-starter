/**
 * Babylon.js WebXR Starter + Havok Physics
 * ----------------------------------------
 * A minimal but complete WebXR (VR) application for headsets like the
 * Meta Quest 3: grab the hovering cubes with the controller GRIP button
 * or a hand-tracking PINCH, move them around, release to throw or drop.
 * On desktop (no headset) the scene still renders with mouse orbit controls.
 *
 * This is the Babylon.js twin of the Three.js + Jolt starter — same
 * modules, same behavior, so the two are easy to compare:
 *
 *   main.ts          <- you are here: wires the modules together and runs
 *                       the render loop
 *   scene.ts         -> Babylon.js bootstrap: engine, scene, camera,
 *                       WebXR experience, desktop fallback
 *   physics.ts       -> Havok physics setup (the only module that talks
 *                       to the physics API directly)
 *   environment.ts   -> lights, floor, grid, decoration, invisible
 *                       physics room
 *   cubes.ts         -> the grabbable cubes: meshes + physics bodies
 *   input.ts         -> XR input devices: controllers + tracked hands
 *   interaction.ts   -> gameplay: hover, grab, throw
 *
 * Note how much shorter the render loop is compared to main.js: Babylon
 * steps the physics world and syncs bodies to meshes inside scene.render(),
 * so two of the four update calls simply don't exist here.
 */

import "./style.css";
import { WebXRState } from "@babylonjs/core";
import { engine, scene, xr } from "./scene";
import { updateEnvironment } from "./environment";
import { updateInteraction } from "./interaction";

// Babylon's runRenderLoop is headset-aware out of the box: inside a VR
// session the headset drives the frame rate (e.g. 90 Hz on Quest 3),
// outside it's the monitor. (Three.js needed setAnimationLoop for this.)
engine.runRenderLoop(() => {
  // Clamp the delta so a long stall (tab switch, debugger) doesn't make
  // the torus knot jump. The physics engine clamps its own step internally.
  const deltaTime = Math.min(engine.getDeltaTime() / 1000, 0.1);
  const isPresenting = xr.baseExperience?.state === WebXRState.IN_XR;

  updateEnvironment(deltaTime); // rotate the torus knot
  updateInteraction(isPresenting); // hover + held cubes
  scene.render(); // ALSO steps physics + syncs bodies to meshes
});

// Dev helper: Ctrl+Alt+I toggles the Babylon.js Inspector (scene explorer +
// property grid). Loaded lazily so it never ships in a production bundle path.
window.addEventListener("keydown", async (event) => {
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "i") {
    await import("@babylonjs/inspector");
    if (scene.debugLayer.isVisible()) {
      scene.debugLayer.hide();
    } else {
      await scene.debugLayer.show({ embedMode: true });
    }
  }
});

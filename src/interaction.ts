/**
 * interaction.ts — grabbing, throwing, hovering
 * ---------------------------------------------
 * The gameplay logic: point at a cube, grab it (grip button on a
 * controller, pinch gesture with a tracked hand), move it around,
 * release to throw or drop it.
 *
 * The physics details (kinematic vs. dynamic bodies, velocities) are
 * hidden behind the functions exported by physics.ts — this module only
 * decides WHEN those things happen. Logic-for-logic identical to
 * interaction.js in the Three.js starter.
 */

import { Color3, Quaternion, Ray, Vector3, type Mesh, type StandardMaterial } from "@babylonjs/core";
import { scene } from "./scene";
import { grabSources, getGrabAnchor, setGrabListeners, type GrabSource } from "./input";
import { interactables, bodyOf } from "./cubes";
import { makeKinematic, makeDynamic, teleportBody, moveKinematicBody } from "./physics";

const HOVER_EMISSIVE = Color3.FromHexString("#222222");
const HELD_EMISSIVE = Color3.FromHexString("#333333");

// Reusable temp objects — same trick as in the Three.js starter: avoid
// allocating vectors in code that runs every frame.
const tmpRay = new Ray(Vector3.Zero(), Vector3.Forward(), 5);
const tmpQuat = new Quaternion();

const setEmissive = (mesh: Mesh, color: Color3) => {
  (mesh.material as StandardMaterial).emissiveColor = color;
};

// ---------------------------------------------------------------------------
// Targeting
// ---------------------------------------------------------------------------

// Babylon gives us the pointing ray directly (in Three.js we had to build
// it from the controller's matrix). Only the cubes are considered.
function getIntersection(source: GrabSource): Mesh | null {
  source.controller.getWorldPointerRayToRef(tmpRay);
  const hit = scene.pickWithRay(tmpRay, (mesh) => interactables.includes(mesh as Mesh));
  return (hit?.pickedMesh as Mesh) ?? null;
}

const isHeld = (mesh: Mesh) => grabSources.some((s) => s.held?.mesh === mesh);

// ---------------------------------------------------------------------------
// Grab / release
// ---------------------------------------------------------------------------

// Grab: if the ray hits a cube, snap it to the anchor. While held, the body
// is KINEMATIC ("animated" in Havok terms): we dictate its motion and the
// physics engine derives its velocity from that motion — which is exactly
// what makes the throw on release work. The same handler serves both input
// types; only the button differs (grip vs. pinch — see input.ts).
function grab(source: GrabSource): void {
  const mesh = getIntersection(source);
  const anchor = getGrabAnchor(source);
  if (!mesh || !anchor || isHeld(mesh)) return;

  const body = bodyOf(mesh);
  makeKinematic(body);

  // Snap the cube instantly into the hand — no velocity involved.
  // From then on it follows the anchor pose (see updateHeldBody).
  teleportBody(body, anchor.absolutePosition, anchor.absoluteRotationQuaternion);

  source.held = { mesh, body };
  setEmissive(mesh, HELD_EMISSIVE);
}

// Release: hand the body back to the simulation with gravity enabled.
// It keeps the linear + angular velocity of the hand motion — released while
// moving, the cube is thrown; released while still, it just drops.
function release(source: GrabSource): void {
  if (!source.held) return;
  makeDynamic(source.held.body, 1);
  setEmissive(source.held.mesh, Color3.Black());
  source.held = null;
}

setGrabListeners(grab, release);

// ---------------------------------------------------------------------------
// Per-frame updates
// ---------------------------------------------------------------------------

// While holding: move the kinematic body to the anchor pose every frame,
// so Havok continuously knows the hand's velocity.
function updateHeldBody(source: GrabSource): void {
  if (!source.held) return;

  const anchor = getGrabAnchor(source);
  if (!anchor) return; // hand lost tracking — keep the cube where it is

  tmpQuat.copyFrom(anchor.absoluteRotationQuaternion);
  moveKinematicBody(source.held.body, anchor.absolutePosition, tmpQuat);
}

// Hover feedback: highlight whatever the ray points at.
function updateHover(source: GrabSource): void {
  if (source.held) return;

  if (source.hovered) {
    setEmissive(source.hovered, Color3.Black());
    source.hovered = null;
  }

  const mesh = getIntersection(source);
  if (mesh && !isHeld(mesh)) {
    setEmissive(mesh, HOVER_EMISSIVE);
    source.hovered = mesh;
  }
}

/** Per-frame interaction update (called from the render loop). */
export function updateInteraction(isPresenting: boolean): void {
  // Hover states only make sense while an XR session is active.
  if (isPresenting) {
    grabSources.forEach(updateHover);
  }
  grabSources.forEach(updateHeldBody);
}

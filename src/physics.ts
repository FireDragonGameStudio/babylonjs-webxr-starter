/**
 * physics.ts — Havok Physics setup + helpers
 * ------------------------------------------
 * Havok is the physics engine recommended by the Babylon.js team; like
 * Jolt in the Three.js starter it is a C++ engine compiled to WebAssembly.
 *
 * The big architectural difference to the Three.js + Jolt starter:
 * Babylon.js has physics integration BUILT IN. Bodies attach directly to
 * meshes, the engine steps the simulation inside scene.render(), and it
 * copies the simulated poses back onto the meshes automatically. That is
 * why this file is so much shorter than physics.js — no object layers,
 * no stepSimulation(), no getBodyPose()/sync step. The helpers below only
 * wrap the small API differences so the other modules read the same as
 * their Three.js counterparts.
 */

import {
  HavokPlugin,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsMotionType,
  PhysicsShapeType,
  Quaternion,
  Vector3,
  type Mesh,
  type PhysicsBody,
} from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import { scene } from "./scene";

// Instantiate the WASM module, wrap it in Babylon's plugin and switch on
// physics for the whole scene. From here on, scene.render() also advances
// the simulation.
const havok = await HavokPhysics();
scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havok));

// ---------------------------------------------------------------------------
// Body creation
// ---------------------------------------------------------------------------

/**
 * Invisible static collision box, e.g. for the floor and the room walls.
 * (Same half-extents convention as the Jolt wrapper, so environment.ts
 * can use identical numbers in both starters.)
 */
export function createStaticBox(center: Vector3, halfExtents: Vector3): PhysicsBody {
  const box = MeshBuilder.CreateBox(
    "staticCollider",
    { width: halfExtents.x * 2, height: halfExtents.y * 2, depth: halfExtents.z * 2 },
    scene,
  );
  box.position.copyFrom(center);
  box.isVisible = false;

  // A PhysicsAggregate bundles body + shape and derives the collision
  // geometry from the mesh. mass 0 = static, immovable geometry.
  const aggregate = new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 0 }, scene);
  return aggregate.body;
}

/**
 * Dynamic (simulated) box body for an existing mesh.
 * @param gravityFactor 0 = floats, 1 = normal gravity
 * @param restitution   0 = no bounce, 1 = full bounce
 */
export function createDynamicBox(
  mesh: Mesh,
  { gravityFactor = 1, restitution = 0 }: { gravityFactor?: number; restitution?: number } = {},
): PhysicsBody {
  const aggregate = new PhysicsAggregate(
    mesh,
    PhysicsShapeType.BOX,
    { mass: 1, restitution },
    scene,
  );
  aggregate.body.setGravityFactor(gravityFactor);
  return aggregate.body;
}

// ---------------------------------------------------------------------------
// Controlling bodies
// ---------------------------------------------------------------------------

/**
 * Switch a body to ANIMATED (Havok's name for kinematic): the simulation
 * no longer moves it, we do (via moveKinematicBody). Used while a cube is
 * being held.
 */
export function makeKinematic(body: PhysicsBody): void {
  body.setMotionType(PhysicsMotionType.ANIMATED);
}

/**
 * Hand a body (back) to the simulation. It keeps the velocity Havok
 * derived from the hand motion, so a body released while moving flies
 * on — a throw.
 */
export function makeDynamic(body: PhysicsBody, gravityFactor = 1): void {
  body.setGravityFactor(gravityFactor);
  body.setMotionType(PhysicsMotionType.DYNAMIC);
  // Havok quirk: a body that was driven by setTargetTransform while
  // ANIMATED keeps its keyframed (infinite) mass state after switching
  // back to DYNAMIC — it would glide on at constant velocity, ignoring
  // gravity. Re-setting the mass restores normal dynamic behavior.
  body.setMassProperties({ mass: 1 });
}

/**
 * Move a kinematic (ANIMATED) body to a target pose. Havok moves the body
 * there over the next simulation step and derives the matching linear and
 * angular velocity — exactly Jolt's MoveKinematic, and again what makes
 * the throw on release work.
 */
export function moveKinematicBody(body: PhysicsBody, position: Vector3, rotation: Quaternion): void {
  body.setTargetTransform(position, rotation);
}

/**
 * Snap a freshly grabbed body into the hand. Havok has no instant teleport
 * for animated bodies (Jolt's SetPositionAndRotation has no counterpart),
 * so the "snap" is a target transform too — the body reaches the hand
 * within one physics step, which looks instant at headset frame rates.
 */
export function teleportBody(body: PhysicsBody, position: Vector3, rotation: Quaternion): void {
  body.setTargetTransform(position, rotation);
}

/**
 * cubes.ts — the grabbable objects
 * --------------------------------
 * Creates the colored cubes, one Babylon.js mesh + one Havok physics body
 * each. Unlike the Three.js + Jolt starter there is NO sync function here:
 * Babylon's physics integration copies the simulated poses back onto the
 * meshes automatically every frame.
 */

import {
  Color3,
  MeshBuilder,
  Quaternion,
  StandardMaterial,
  type Mesh,
  type PhysicsBody,
} from "@babylonjs/core";
import { scene } from "./scene";
import { createDynamicBox } from "./physics";

// All grabbable meshes in one array so ray picking stays cheap: we only
// test the controller ray against these, not the whole scene
// (the counterpart of the THREE.Group in cubes.js).
export const interactables: Mesh[] = [];

/** The physics body belonging to a cube (stored in mesh.metadata). */
export function bodyOf(mesh: Mesh): PhysicsBody {
  return mesh.metadata.body;
}

const palette = ["#e45858", "#58e48a", "#5896e4", "#e4c558", "#b058e4"];

for (let i = 0; i < 8; i++) {
  const size = 0.15;
  const cube = MeshBuilder.CreateBox(`cube${i}`, { size }, scene);

  const material = new StandardMaterial(`cube${i}Mat`, scene);
  material.diffuseColor = Color3.FromHexString(palette[i % palette.length]);
  material.specularColor = new Color3(0.1, 0.1, 0.1); // mostly matte
  cube.material = material;

  // Scatter the cubes at a comfortable reaching height in front of the user.
  const angle = (i / 8) * Math.PI - Math.PI; // half circle in front
  const radius = 0.8 + Math.random() * 0.4;
  cube.position.set(
    Math.cos(angle) * radius,
    1.0 + Math.random() * 0.6,
    Math.sin(angle) * radius + 2,
  );
  // Physics works with quaternions, so set the start rotation as one.
  cube.rotationQuaternion = Quaternion.FromEulerAngles(
    Math.random(),
    Math.random(),
    Math.random(),
  );

  // The matching physics body, stored on the mesh so the interaction code
  // can find it. Gravity starts disabled so the cubes hover in place — the
  // first time a cube is grabbed and released, gravity is switched on for
  // it (see interaction.ts) and it behaves like a normal object from then on.
  cube.metadata = {
    body: createDynamicBox(cube, {
      gravityFactor: 0,
      restitution: 0.5, // bounce off the floor and the invisible walls
    }),
  };

  interactables.push(cube);
}

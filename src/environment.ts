/**
 * environment.ts — static scene content
 * -------------------------------------
 * Lights, floor, reference grid, the decorative torus knot, and the
 * invisible physics "room" that keeps thrown cubes inside the play area.
 * Nothing in here is interactive. Mirrors environment.js in the Three.js
 * starter — same colors, same positions, same room dimensions.
 */

import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import { scene, xr } from "./scene";
import { createStaticBox } from "./physics";

// --- Lights ----------------------------------------------------------------

// Hemispheric light: sky color from above, ground color from below.
const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
hemi.diffuse = Color3.FromHexString("#bcc7ff");
hemi.groundColor = Color3.FromHexString("#444444");
hemi.intensity = 0.9;

// The direction points from (2, 4, 3) toward the origin — the equivalent
// of Three's dirLight.position + default target.
const sun = new DirectionalLight("sun", new Vector3(-2, -4, -3).normalize(), scene);
sun.intensity = 0.9;

// --- Floor + grid ------------------------------------------------------------

// One mesh does floor color AND reference grid: GridMaterial renders grid
// lines over a solid background (Three.js needed PlaneGeometry + GridHelper).
// The grid helps users judge scale and distance in VR.
const floor = MeshBuilder.CreateGround("floor", { width: 10, height: 10 }, scene);
const floorMat = new GridMaterial("floorMat", scene);
floorMat.mainColor = Color3.FromHexString("#2e3d4d"); // background
floorMat.lineColor = Color3.FromHexString("#4a6076"); // grid lines
floorMat.gridRatio = 0.5; // line spacing: 0.5 m = GridHelper(10, 20)'s 20 divisions
floorMat.majorUnitFrequency = 2; // every 2nd line (= every meter) slightly stronger
floor.material = floorMat;

// The visible floor is also the teleportation target area in VR.
xr.teleportation?.addFloorMesh(floor);

// --- Invisible physics room --------------------------------------------------
//
// Matches the 10x10 m floor, 3 m high: floor, ceiling and four walls, so
// thrown cubes bounce back instead of disappearing into the void.
// (Identical numbers to the Three.js starter.)

const box = (x: number, y: number, z: number, hx: number, hy: number, hz: number) =>
  createStaticBox(new Vector3(x, y, z), new Vector3(hx, hy, hz));

box(0, -0.1, 0, 5.2, 0.1, 5.2); // floor (top surface at y = 0)
box(0, 3.1, 0, 5.2, 0.1, 5.2); // ceiling
box(-5.1, 1.5, 0, 0.1, 1.7, 5.2); // left wall
box(5.1, 1.5, 0, 0.1, 1.7, 5.2); // right wall
box(0, 1.5, -5.1, 5.2, 1.7, 0.1); // back wall
box(0, 1.5, 5.1, 5.2, 1.7, 0.1); // front wall

// --- Decoration --------------------------------------------------------------

// A slowly rotating "hero" object in the center so there is always motion.
// Purely decorative — it has no physics body.
const torusKnot = MeshBuilder.CreateTorusKnot(
  "torusKnot",
  { radius: 0.2, tube: 0.06, radialSegments: 128, tubularSegments: 32 },
  scene,
);
torusKnot.position.set(0, 1.4, 1.2);
const knotMat = new StandardMaterial("knotMat", scene);
knotMat.diffuseColor = Color3.FromHexString("#9ecbff");
knotMat.specularColor = new Color3(0.8, 0.8, 0.8);
knotMat.specularPower = 64; // tight highlight — the "shiny metal" look
torusKnot.material = knotMat;

/** Per-frame animation of the environment (called from the render loop). */
export function updateEnvironment(deltaTime: number): void {
  torusKnot.rotation.y += deltaTime * 0.5;
  torusKnot.rotation.x += deltaTime * 0.2;
}

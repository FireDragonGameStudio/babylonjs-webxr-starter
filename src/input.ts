/**
 * input.ts — XR input devices
 * ---------------------------
 * Sets up both input types: controllers (grip button) and tracked hands
 * (pinch gesture). No interaction logic lives here — interaction.ts
 * registers the callbacks and decides what grabbing means.
 *
 * Where Three.js hands out three fixed objects per slot (targetRay /
 * grip / hand), Babylon is event-driven: xr.input fires an observable
 * whenever an input source appears, and each source carries its spaces
 * and its "motion controller" (the buttons). A tracked hand shows up as
 * just another controller whose main component fires on PINCH — so one
 * code path below covers both input types.
 */

import {
  WebXRFeatureName,
  WebXRHandJoint,
  type AbstractMesh,
  type Mesh,
  type PhysicsBody,
  type TransformNode,
  type WebXRHandTracking,
  type WebXRInputSource,
} from "@babylonjs/core";
import { xr } from "./scene";

/** One thing that can point at and hold a cube (controller or hand). */
export interface GrabSource {
  controller: WebXRInputSource;
  /** Set while a cube is held — managed by interaction.ts. */
  held: { mesh: Mesh; body: PhysicsBody } | null;
  /** Hover highlight bookkeeping — managed by interaction.ts. */
  hovered: Mesh | null;
}

/** Everything that can currently hold a cube (controllers and hands). */
export const grabSources: GrabSource[] = [];

type GrabListener = (source: GrabSource) => void;
let onGrabStart: GrabListener = () => {};
let onGrabEnd: GrabListener = () => {};

/** interaction.ts registers what should happen on grab/release. */
export function setGrabListeners(start: GrabListener, end: GrabListener): void {
  onGrabStart = start;
  onGrabEnd = end;
}

// Hand tracking is a Babylon "feature": enabling it makes the Quest report
// hands as input sources and renders an articulated hand model for them
// (the counterpart of XRHandModelFactory). required=false: devices without
// hand tracking simply continue with controllers only.
let handTracking: WebXRHandTracking | undefined;
if (xr.baseExperience) {
  try {
    handTracking = xr.baseExperience.featuresManager.enableFeature(
      WebXRFeatureName.HAND_TRACKING,
      "latest",
      { xrInput: xr.input },
      true,
      false,
    ) as WebXRHandTracking;
  } catch {
    console.warn("Hand tracking not available — controllers only.");
  }

  // Fires for every input source: physical controllers AND tracked hands.
  // (The Quest switches between the two automatically when you put the
  // controllers down or pick them back up.)
  xr.input.onControllerAddedObservable.add((controller) => {
    const source: GrabSource = { controller, held: null, hovered: null };
    grabSources.push(source);

    // The motion controller (= the buttons) loads asynchronously.
    controller.onMotionControllerInitObservable.add((motionController) => {
      // Physical controller -> GRIP button ("squeeze", the side trigger).
      // Tracked hand -> its profile has no squeeze; the main component
      // fires on PINCH (thumb + index finger together).
      const grabComponent =
        motionController.getComponentOfType("squeeze") ?? motionController.getMainComponent();

      grabComponent.onButtonStateChangedObservable.add((component) => {
        if (!component.changes.pressed) return;
        if (component.pressed) onGrabStart(source);
        else onGrabEnd(source);
      });
    });

    controller.onDisposeObservable.add(() => {
      onGrabEnd(source); // don't keep holding a cube with a vanished hand
      grabSources.splice(grabSources.indexOf(source), 1);
    });
  });
}

/**
 * Where a grabbed cube attaches: controllers use the grip pose (where the
 * physical controller sits in the hand), tracked hands use the tip of the
 * index finger — the point you pinch with. Returns null while the device
 * is not tracked.
 */
export function getGrabAnchor(source: GrabSource): TransformNode | AbstractMesh | null {
  const { controller } = source;
  if (controller.inputSource.hand) {
    const hand = handTracking?.getHandByControllerId(controller.uniqueId);
    return hand?.getJointMesh(WebXRHandJoint.INDEX_FINGER_TIP) ?? null;
  }
  // grip = physical controller pose; pointer = fallback if grip is missing.
  return controller.grip ?? controller.pointer;
}

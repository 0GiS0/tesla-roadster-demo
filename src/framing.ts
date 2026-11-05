import { PerspectiveCamera, Vector3 } from 'three';
import { PARKING, ROADSTER_FOOTPRINT } from './scenario';

export const CAMERA_FOV = 43;
export const MIN_FIT_ASPECT = .35;

export interface FitFraming { width: number; height: number; direction: [number, number, number]; target?: [number, number, number] }

/** Camera placement that fits a framing box of the given world size at the given viewport aspect ratio. */
export function fitCameraPlacement(framing: FitFraming, aspect: number) {
 const target = new Vector3(...(framing.target ?? [0, 2, 0]));
 const direction = new Vector3(...framing.direction).normalize();
 const halfFov = Math.tan(CAMERA_FOV * Math.PI / 360);
 const verticalDistance = framing.height / (2 * halfFov);
 const horizontalDistance = framing.width / (2 * halfFov * Math.max(aspect, MIN_FIT_ASPECT));
 const distance = Math.max(verticalDistance, horizontalDistance) * 1.08;
 return { target, position: target.clone().addScaledVector(direction, distance) };
}

/** Height above the ground position `[x, z]` at which a vertical line leaves the frame through its top edge. */
export function topEdgeHeight(framing: FitFraming, aspect: number, ground: [number, number]): number {
 const { position, target } = fitCameraPlacement(framing, aspect);
 const camera = new PerspectiveCamera(CAMERA_FOV, Math.max(aspect, MIN_FIT_ASPECT), .1, 180);
 camera.position.copy(position);
 camera.lookAt(target);
 camera.updateMatrixWorld(true);
 const halfFov = Math.tan(CAMERA_FOV * Math.PI / 360);
 // In camera space a point is above the top frustum plane when y + z * tan(fov / 2) > 0; this is linear in the height.
 const excess = (height: number) => {
  const local = new Vector3(ground[0], height, ground[1]).applyMatrix4(camera.matrixWorldInverse);
  return local.y + local.z * halfFov;
 };
 const base = excess(0);
 return -base / (excess(1) - base);
}

const DROP_CLEARANCE = 1;

/** Start height above the asphalt that keeps the whole Roadster above the top edge of the fitted frame at the given aspect ratio. */
export function parkingDropHeight(framing: FitFraming, aspect: number): number {
 const halfLength = ROADSTER_FOOTPRINT.length / 2, halfWidth = ROADSTER_FOOTPRINT.width / 2;
 let edge = 0;
 for (const x of [-halfWidth, halfWidth]) for (const z of [-halfLength, halfLength])
  edge = Math.max(edge, topEdgeHeight(framing, aspect, [PARKING.slotX + x, PARKING.slotZ + z]));
 return edge + DROP_CLEARANCE;
}

import { describe, it, expect } from 'vitest';
import { WHEEL_RADIUS, PARKING, ROADSTER_FOOTPRINT, GREY_CAR_FOOTPRINT, greyCarPose, parkingSpaceTheft, createParkingSpaceTheft, advance } from './scenario';
import { sceneCatalog, sceneFromHash, sceneHashFor, sourceLabel } from './sceneCatalog';
import { parkingDropHeight, topEdgeHeight } from './framing';

type Rect = { cx: number; cz: number; yaw: number; length: number; width: number };
const corners = ({ cx, cz, yaw, length, width }: Rect): [number, number][] =>
 [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
  const x = a * length / 2, z = b * width / 2;
  return [cx + x * Math.cos(yaw) + z * Math.sin(yaw), cz - x * Math.sin(yaw) + z * Math.cos(yaw)];
 });
// Separating axis test; touching edges do not count as an overlap.
function overlaps(a: Rect, b: Rect): boolean {
 const ca = corners(a), cb = corners(b);
 for (const shape of [a, b]) {
  const axes: [number, number][] = [[Math.cos(shape.yaw), -Math.sin(shape.yaw)], [Math.sin(shape.yaw), Math.cos(shape.yaw)]];
  for (const [ax, az] of axes) {
   const pa = ca.map(([x, z]) => x * ax + z * az), pb = cb.map(([x, z]) => x * ax + z * az);
   if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
  }
 }
 return true;
}
const roadsterRect = (t: number): Rect => {
 const p = parkingSpaceTheft.evaluate(t);
 return { cx: p.position[0], cz: p.position[2], yaw: Math.PI / 2, ...ROADSTER_FOOTPRINT };
};
const greyRect = (t: number): Rect => {
 const g = greyCarPose(t);
 return { cx: g.position[0], cz: g.position[2], yaw: g.yaw, ...GREY_CAR_FOOTPRINT };
};
const times = Array.from({ length: 501 }, (_, i) => i * .02);

describe('Robo de plaza meme scene', () => {
 it('parks level with every wheel on the asphalt and never sinks below it', () => {
  for (const t of times) expect(parkingSpaceTheft.evaluate(t).position[1]).toBeGreaterThanOrEqual(WHEEL_RADIUS - 1e-9);
  for (const t of [5.4, 6, 8, 10]) {
   const pose = parkingSpaceTheft.evaluate(t);
   expect(pose.position[1]).toBeCloseTo(PARKING.groundY + WHEEL_RADIUS, 8);
   expect(pose.position[0]).toBe(PARKING.slotX);
   expect(pose.position[2]).toBe(PARKING.slotZ);
   expect(pose.wheelAngle).toBe(0);
  }
  expect(parkingSpaceTheft.evaluate(1).position[1]).toBeGreaterThan(WHEEL_RADIUS + 5);
 });
 it('descends monotonically and lands softly', () => {
  let previous = Infinity;
  for (const t of times) { const y = parkingSpaceTheft.evaluate(t).position[1]; expect(y).toBeLessThanOrEqual(previous + 1e-9); previous = y; }
  const arrival = parkingSpaceTheft.evaluate(5.399).position[1] - parkingSpaceTheft.evaluate(5.4).position[1];
  expect(arrival / .001).toBeLessThan(.1);
 });
 it('is deterministic and continuous across all phase boundaries', () => {
  for (const t of [1.4, 2.4, 3.1, 5.4, 7.2, 8.4, 10]) {
   const a = parkingSpaceTheft.evaluate(t - .001), b = parkingSpaceTheft.evaluate(t + .001);
   expect(Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1], a.position[2] - b.position[2])).toBeLessThan(.12);
   expect(Math.abs(a.vapor - b.vapor)).toBeLessThan(.05);
   const ga = greyCarPose(t - .001), gb = greyCarPose(t + .001);
   expect(Math.hypot(ga.position[0] - gb.position[0], ga.position[2] - gb.position[2])).toBeLessThan(.02);
   expect(Math.abs(ga.yaw - gb.yaw)).toBeLessThan(.02);
   expect(parkingSpaceTheft.evaluate(t)).toEqual(parkingSpaceTheft.evaluate(t));
   expect(greyCarPose(t)).toEqual(greyCarPose(t));
  }
 });
 it('clamps playback boundaries and ends on the completed phase', () => {
  expect(parkingSpaceTheft.duration).toBe(10);
  expect(parkingSpaceTheft.evaluate(-5)).toEqual(parkingSpaceTheft.evaluate(0));
  expect(parkingSpaceTheft.evaluate(99)).toEqual(parkingSpaceTheft.evaluate(10));
  expect(parkingSpaceTheft.evaluate(10).phase).toBe('Maniobra completada');
  expect(parkingSpaceTheft.evaluate(0).vapor).toBe(0);
  expect(parkingSpaceTheft.evaluate(10).vapor).toBe(0);
  expect(greyCarPose(99)).toEqual(greyCarPose(10));
  expect(advance(9.8, 1, true, 10)).toEqual({ time: 10, playing: false });
  expect(advance(4, 1, false, 10)).toEqual({ time: 4, playing: false });
 });
 it('keeps the grey car clear of the Roadster and the parked cars at all times', () => {
  const parked: Rect[] = PARKING.parkedBayX.map(x => ({ cx: x, cz: PARKING.slotZ, yaw: Math.PI / 2, length: 4, width: 1.75 }));
  expect(overlaps(roadsterRect(6), { ...roadsterRect(6), cx: 1 })).toBe(true);
  expect(overlaps(roadsterRect(6), { ...roadsterRect(6), cx: 3 })).toBe(false);
  for (const t of times) {
   expect(overlaps(greyRect(t), roadsterRect(t))).toBe(false);
   for (const car of parked) expect(overlaps(greyRect(t), car)).toBe(false);
  }
 });
 it('leaves exactly one marked bay free before the Roadster lands', () => {
  const marked: number[] = [];
  for (let x = -9; x <= 9; x += PARKING.bayWidth) marked.push(x);
  const free = marked.filter(x => !(PARKING.parkedBayX as readonly number[]).includes(x));
  expect(free).toEqual([PARKING.slotX]);
 });
 it('starts the descent above the top edge of every supported framing and keeps a bounded pace', () => {
  const framing = sceneFromHash('#meme/robo-de-plaza').camera.fit!;
  for (const aspect of [1440 / 900, 844 / 390, 390 / 844, 1024 / 768, 2.4]) {
   const height = parkingDropHeight(framing, aspect);
   const scenario = createParkingSpaceTheft(height);
   const start = scenario.evaluate(0);
   expect(start.position[1] - WHEEL_RADIUS).toBeCloseTo(height, 8);
   for (const x of [-1.05, 1.05]) for (const z of [-2.55, 2.55])
    expect(height).toBeGreaterThan(topEdgeHeight(framing, aspect, [PARKING.slotX + x, PARKING.slotZ + z]));
   let fastest = 0;
   for (let t = 0; t < 10; t += .02) fastest = Math.max(fastest, Math.abs(scenario.evaluate(t + .02).position[1] - scenario.evaluate(t).position[1]) / .02);
   expect(fastest).toBeLessThan(20);
   expect(scenario.evaluate(1.3).position[1] - WHEEL_RADIUS).toBeCloseTo(height, 8);
  }
 });
 it('is registered under its canonical route with a TikTok credit while the other credits stay unchanged', () => {
  const scene = sceneFromHash('#meme/robo-de-plaza');
  expect(sceneCatalog).toHaveLength(4);
  expect(scene.scenario.id).toBe('robo-de-plaza');
  expect(sceneHashFor(scene)).toBe('#meme/robo-de-plaza');
  expect(sourceLabel(scene.source!)).toBe('Visto en @krishnak3212 · Ver original en TikTok');
  expect(sourceLabel(sceneFromHash('#meme/bache-volador').source!)).toMatch(/^Visto en @.+ · Ver original en X$/);
 });
});

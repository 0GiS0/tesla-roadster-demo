import { describe,it,expect } from 'vitest';
import { Vector3,Quaternion } from 'three';
import { rampFlight,contactPose,WHEEL_RADIUS,RADIUS,HALF_WHEELBASE,DURATION,advance,potholeFlight } from './scenario';
import { buildSceneUrl,defaultScene,sceneCatalog,sceneFromHash,sceneHashFor } from './sceneCatalog';
import { copyShareLink } from './share';
describe('Rigid vehicle follows the ramp',()=>{
 it('keeps axle spacing and every wheel center on the surface through the floor transition',()=>{
  for(let s=-9;s<22;s+=.13){const p=contactPose(s);expect(Math.hypot(p.front[0]-p.rear[0],p.front[1]-p.rear[1])).toBeCloseTo(2*HALF_WHEELBASE,5);
   for(const wheel of [p.front,p.rear]){if(wheel[0]<0&&wheel[1]<1)expect(wheel[1]).toBeCloseTo(WHEEL_RADIUS);else expect(Math.hypot(wheel[0],wheel[1]-RADIUS)).toBeCloseTo(RADIUS-WHEEL_RADIUS,5);}
  }
 });
 it('is deterministic and continuous across the ascent, turn, hover and landing boundaries',()=>{
  for(const t of [13,18,19,26,27,27.5,28]){const a=rampFlight.evaluate(t-.001),b=rampFlight.evaluate(t+.001);expect(new Vector3(...a.position).distanceTo(new Vector3(...b.position))).toBeLessThan(.02);expect(new Quaternion(...a.quaternion).angleTo(new Quaternion(...b.quaternion))).toBeLessThan(.01);expect(rampFlight.evaluate(t)).toEqual(rampFlight.evaluate(t));}
 });
 it('climbs once without reverse, then turns directly into flight and lands',()=>{
  let previous=rampFlight.evaluate(0);
  for(let t=.05;t<=13;t+=.05){const current=rampFlight.evaluate(t);expect(current.position[1]).toBeGreaterThanOrEqual(previous.position[1]-1e-8);expect(current.wheelAngle).toBeLessThanOrEqual(previous.wheelAngle);expect(current.phase).toBe('Subida');previous=current;}
  const peak=rampFlight.evaluate(13),turn=rampFlight.evaluate(14),hover=rampFlight.evaluate(18),landed=rampFlight.evaluate(DURATION);
  expect(peak.position[1]).toBeGreaterThan(12);expect(turn.vapor).toBeGreaterThan(0);expect(turn.position[0]).toBeLessThan(peak.position[0]);expect(new Quaternion(...turn.quaternion).angleTo(new Quaternion())).toBeLessThan(new Quaternion(...peak.quaternion).angleTo(new Quaternion()));
  expect(hover.quaternion[2]).toBeCloseTo(0);expect(hover.position[1]).toBeCloseTo(11.5);expect(rampFlight.evaluate(19).position).toEqual(hover.position);
  for(let t=13;t<=DURATION;t+=.1)expect(rampFlight.evaluate(t).wheelAngle).toBe(peak.wheelAngle);
  expect(landed.position[1]).toBeCloseTo(WHEEL_RADIUS);expect(landed.vapor).toBe(0);expect(landed.phase).toBe('Maniobra completada');
 });
});
describe('playback boundaries',()=>{
 it('freezes paused time, clamps the 28-second end and evaluates out-of-range times safely',()=>{expect(DURATION).toBe(28);expect(advance(20,3,false)).toEqual({time:20,playing:false});expect(advance(27,10,true)).toEqual({time:28,playing:false});expect(advance(0,-2,true).time).toBe(0);expect(rampFlight.evaluate(-5)).toEqual(rampFlight.evaluate(0));expect(rampFlight.evaluate(55)).toEqual(rampFlight.evaluate(28));});
});
describe('Bache volador meme scene',()=>{
 it('keeps the car level, clears the hole, and resumes wheel rotation on landing',()=>{
  const approach=potholeFlight.evaluate(0),takeoff=potholeFlight.evaluate(4),crossing=potholeFlight.evaluate(6),landing=potholeFlight.evaluate(10),exit=potholeFlight.evaluate(11);
  expect(approach.position[1]).toBeCloseTo(WHEEL_RADIUS);expect(approach.quaternion).toEqual([0,0,0,1]);
  expect(takeoff.position[1]).toBeGreaterThan(WHEEL_RADIUS+1.9);expect(crossing.phase).toBe('Cruce del bache');expect(crossing.position[1]).toBeGreaterThan(3.8);
  expect(takeoff.wheelAngle).toBe(crossing.wheelAngle);expect(landing.wheelAngle).toBe(takeoff.wheelAngle);expect(exit.wheelAngle).toBeLessThan(landing.wheelAngle);expect(exit.position[0]).toBeGreaterThan(landing.position[0]);
 });
 it('keeps wheel clearance across the hole and returns only on safe asphalt',()=>{
  for(let time=0;time<=12;time+=.025){
   const pose=potholeFlight.evaluate(time),centerX=pose.position[0];
   if(Math.abs(centerX)<5.8)expect(pose.position[1]-WHEEL_RADIUS).toBeGreaterThan(3.8);
   else if(time>=10)expect(pose.position[1]).toBeCloseTo(WHEEL_RADIUS,2);
   else expect(pose.position[1]).toBeGreaterThanOrEqual(WHEEL_RADIUS);
  }
 });
 it('is deterministic and continuous around all 12-second phase boundaries',()=>{
  for(const t of [3,5,8,10,12]){const a=potholeFlight.evaluate(t-.001),b=potholeFlight.evaluate(t+.001);expect(Math.hypot(a.position[0]-b.position[0],a.position[1]-b.position[1])).toBeLessThan(.03);expect(potholeFlight.evaluate(t)).toEqual(potholeFlight.evaluate(t));}
  expect(potholeFlight.evaluate(12).phase).toBe('Maniobra completada');
 });
 it('keeps the midair rotation level and clamps non-finite or out-of-range sample times',()=>{
  const airborne=[3,4,5,6.5,8,9].map(time=>potholeFlight.evaluate(time));
  expect(airborne.every(pose=>pose.wheelAngle===airborne[0].wheelAngle)).toBe(true);
  for(const time of [-4,0,3,5,6.5,8,10,12,18]){
   const pose=potholeFlight.evaluate(time);
   expect(pose.position.every(Number.isFinite)).toBe(true);
   expect(pose.quaternion.every(Number.isFinite)).toBe(true);
   expect(Math.hypot(...pose.quaternion)).toBeCloseTo(1,8);
  }
  expect(potholeFlight.evaluate(-4)).toEqual(potholeFlight.evaluate(0));
  expect(potholeFlight.evaluate(18)).toEqual(potholeFlight.evaluate(12));
 });
 it('selects only known canonical hash routes and uses registry metadata for links',()=>{
  const meme=sceneFromHash('#meme/bache-volador'),original=sceneFromHash('');
  expect(sceneCatalog).toHaveLength(2);expect(meme.scenario.id).toBe('bache-volador');
  expect(sceneFromHash('#unknown')).toBe(defaultScene);expect(sceneFromHash('bache-volador')).toBe(defaultScene);
  expect(sceneHashFor(meme)).toBe('#meme/bache-volador');expect(sceneHashFor(original)).toBe('');
  expect(buildSceneUrl('https://example.test','/tesla-roadster-demo/',meme)).toBe('https://example.test/tesla-roadster-demo/#meme/bache-volador');
  expect(buildSceneUrl('https://example.test','/tesla-roadster-demo/',meme,true)).toBe('https://example.test/tesla-roadster-demo/?debug=1#meme/bache-volador');
  expect(buildSceneUrl('https://example.test','/tesla-roadster-demo/',original)).toBe('https://example.test/tesla-roadster-demo/');
  expect(advance(11,.5,true,meme.scenario.duration)).toEqual({time:11.5,playing:true});
  expect(advance(11,2,true,meme.scenario.duration)).toEqual({time:12,playing:false});
 });
});
describe('share-link clipboard fallback',()=>{
 it('reports clipboard success, rejection and unavailable clipboard distinctly',async()=>{
  const successfulClipboard={writeText:async()=>{}};
  const rejectedClipboard={writeText:async()=>{throw new Error('blocked')}};
  await expect(copyShareLink('https://example.test/meme',successfulClipboard)).resolves.toBe(true);
  await expect(copyShareLink('https://example.test/meme',rejectedClipboard)).resolves.toBe(false);
  await expect(copyShareLink('https://example.test/meme')).resolves.toBe(false);
 });
});

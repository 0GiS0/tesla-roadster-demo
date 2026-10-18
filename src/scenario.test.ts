import { describe,it,expect } from 'vitest';
import { Vector3,Quaternion } from 'three';
import { rampFlight,contactPose,WHEEL_RADIUS,RADIUS,HALF_WHEELBASE,advance } from './scenario';
describe('Rigid vehicle follows the ramp',()=>{
 it('keeps axle spacing and every wheel center on the surface through the floor transition',()=>{
  for(let s=-9;s<22;s+=.13){const p=contactPose(s);expect(Math.hypot(p.front[0]-p.rear[0],p.front[1]-p.rear[1])).toBeCloseTo(2*HALF_WHEELBASE,5);
   for(const wheel of [p.front,p.rear]){if(wheel[0]<0&&wheel[1]<1)expect(wheel[1]).toBeCloseTo(WHEEL_RADIUS);else expect(Math.hypot(wheel[0],wheel[1]-RADIUS)).toBeCloseTo(RADIUS-WHEEL_RADIUS,5);}
  }
 });
 it('is deterministic and continuous across every phase boundary',()=>{
  for(const t of [13,17,30,40,44,45,46,50,53,54]){const a=rampFlight.evaluate(t-.001),b=rampFlight.evaluate(t+.001);expect(new Vector3(...a.position).distanceTo(new Vector3(...b.position))).toBeLessThan(.02);expect(new Quaternion(...a.quaternion).angleTo(new Quaternion(...b.quaternion))).toBeLessThan(.01);expect(rampFlight.evaluate(t)).toEqual(rampFlight.evaluate(t));}
 });
 it('reverses, reclimbs, levels into flight and lands',()=>{
  expect(rampFlight.evaluate(17).position[1]).toBeGreaterThan(12);expect(rampFlight.evaluate(30).position[1]).toBeCloseTo(WHEEL_RADIUS);expect(rampFlight.evaluate(40).position[1]).toBeGreaterThan(12);expect(rampFlight.evaluate(46).quaternion[2]).toBeCloseTo(0);expect(rampFlight.evaluate(55).position[1]).toBeCloseTo(WHEEL_RADIUS);
 });
});
describe('playback boundaries',()=>{
 it('freezes paused time and clamps the end',()=>{expect(advance(42,3,false)).toEqual({time:42,playing:false});expect(advance(54,10,true)).toEqual({time:55,playing:false});expect(advance(0,-2,true).time).toBe(0);});
});

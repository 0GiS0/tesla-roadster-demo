import { describe,it,expect } from 'vitest';
import { Vector3,Quaternion } from 'three';
import { rampFlight,contactPose,WHEEL_RADIUS,RADIUS,HALF_WHEELBASE,DURATION,advance } from './scenario';
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

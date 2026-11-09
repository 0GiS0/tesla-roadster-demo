import { describe,it,expect } from 'vitest';
import { Euler,Vector3,Quaternion } from 'three';
import { rampFlight,contactPose,WHEEL_RADIUS,RADIUS,HALF_WHEELBASE,DURATION,advance,potholeFlight,cablesTangle,CABLE_CONTACT_HEIGHT,CABLE_SUPPORT_HEIGHT,CABLE_SUPPORT_CENTERLINE_HEIGHT,CABLE_SUPPORT_RADIUS,CABLE_SUPPORT_SPAN_HALF_LENGTH,CABLE_SUPPORT_WHEEL_Z,CABLE_SUPPORT_X,CABLES_EFFECT_PARTICLE_BUDGET,cableSupportHeightAt,carrierEscape,CARRIER_PLATFORM_HEIGHT,CARRIER_ESCAPE_START_X,songSkip,SONG_SKIP_DURATION,SONG_SKIP_TRAFFIC,SONG_SKIP_BUS,songNotesAt } from './scenario';
import { buildSceneUrl,defaultScene,sceneCatalog,sceneFromHash,sceneHashFor,sourceLabel } from './sceneCatalog';
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
  expect(sceneCatalog).toHaveLength(6);expect(meme.scenario.id).toBe('bache-volador');
  expect(sceneFromHash('#unknown')).toBe(defaultScene);expect(sceneFromHash('bache-volador')).toBe(defaultScene);
  expect(sceneHashFor(meme)).toBe('#meme/bache-volador');expect(sceneHashFor(original)).toBe('');
  expect(buildSceneUrl('https://example.test','/tesla-roadster-demo/',meme)).toBe('https://example.test/tesla-roadster-demo/#meme/bache-volador');
  expect(buildSceneUrl('https://example.test','/tesla-roadster-demo/',meme,true)).toBe('https://example.test/tesla-roadster-demo/?debug=1#meme/bache-volador');
  expect(buildSceneUrl('https://example.test','/tesla-roadster-demo/',original)).toBe('https://example.test/tesla-roadster-demo/');
  expect(advance(11,.5,true,meme.scenario.duration)).toEqual({time:11.5,playing:true});
  expect(advance(11,2,true,meme.scenario.duration)).toEqual({time:12,playing:false});
 });
});
describe('Cables meme scene',()=>{
 it('keeps the tire bottoms touching the cable surfaces without passing through them',()=>{
 expect(CABLE_SUPPORT_CENTERLINE_HEIGHT+CABLE_SUPPORT_RADIUS).toBeCloseTo(CABLE_SUPPORT_HEIGHT,8);
 expect(CABLE_SUPPORT_X).toContain(-HALF_WHEELBASE);
 expect(CABLE_SUPPORT_X).toContain(HALF_WHEELBASE);
 expect(CABLE_SUPPORT_WHEEL_Z.every(z=>Math.abs(z)<CABLE_SUPPORT_SPAN_HALF_LENGTH)).toBe(true);
 for(const z of CABLE_SUPPORT_WHEEL_Z)expect(cableSupportHeightAt(z)+CABLE_SUPPORT_RADIUS).toBeCloseTo(CABLE_SUPPORT_HEIGHT,8);
 for(let time=0;time<=cablesTangle.duration;time+=.025){
  const pose=cablesTangle.evaluate(time),rotation=new Euler().setFromQuaternion(new Quaternion(...pose.quaternion));
  expect(pose.position.every(Number.isFinite)).toBe(true);
  if(time<3.5)expect(pose.position[1]).toBeGreaterThanOrEqual(WHEEL_RADIUS);
  else for(const z of CABLE_SUPPORT_WHEEL_Z){
   const tireBottom=pose.position[1]-HALF_WHEELBASE*Math.abs(Math.sin(rotation.z))-WHEEL_RADIUS;
   expect(tireBottom).toBeCloseTo(cableSupportHeightAt(z)+CABLE_SUPPORT_RADIUS,6);
  }
 }
 expect(cablesTangle.evaluate(3.5).position[1]).toBeCloseTo(CABLE_CONTACT_HEIGHT);
 expect(cablesTangle.evaluate(12).position).toEqual(cablesTangle.evaluate(10).position);
 expect(cablesTangle.evaluate(12).quaternion).toEqual(cablesTangle.evaluate(10).quaternion);
 expect(cablesTangle.evaluate(12).vapor).toBe(0);
 expect(new Euler().setFromQuaternion(new Quaternion(...cablesTangle.evaluate(4).quaternion)).z).not.toBe(0);
 });
 it('is deterministic and continuous through ascent, impact, swinging and the ending',()=>{
 for(const time of [.8,3.5,4.8,5.2,10,12]){
  const before=cablesTangle.evaluate(time-.001),after=cablesTangle.evaluate(time+.001);
  expect(new Vector3(...before.position).distanceTo(new Vector3(...after.position))).toBeLessThan(.03);
  expect(new Quaternion(...before.quaternion).angleTo(new Quaternion(...after.quaternion))).toBeLessThan(.02);
  expect(cablesTangle.evaluate(time)).toEqual(cablesTangle.evaluate(time));
 }
 expect(cablesTangle.evaluate(12).phase).toBe('Maniobra completada');
 });
 it('clamps playback and keeps vapor and sparks within the fixed particle budget',()=>{
 expect(cablesTangle.evaluate(-4)).toEqual(cablesTangle.evaluate(0));
 expect(cablesTangle.evaluate(18)).toEqual(cablesTangle.evaluate(12));
 expect(advance(11,2,true,cablesTangle.duration)).toEqual({time:12,playing:false});
 expect(CABLES_EFFECT_PARTICLE_BUDGET.vapor+CABLES_EFFECT_PARTICLE_BUDGET.sparks).toBe(CABLES_EFFECT_PARTICLE_BUDGET.total);
 expect(CABLES_EFFECT_PARTICLE_BUDGET.total).toBe(256);
 for(let time=0;time<=12;time+=.1)expect(cablesTangle.evaluate(time).vapor).toBeGreaterThanOrEqual(0);
 });
 it('registers its YouTube source under the canonical shareable hash',()=>{
 const scene=sceneFromHash('#meme/cables');
 expect(scene.scenario).toBe(cablesTangle);
 expect(scene.hash).toBe('#meme/cables');
 expect(scene.source?.url).toBe('https://www.youtube.com/shorts/A3wyacegqCQ');
 expect(sourceLabel(scene.source!)).toBe('Visto en MindBodyMillions · Ver original en YouTube');
 expect(sceneCatalog).toHaveLength(6);
 });
});
describe('La fuga del portacoches meme scene',()=>{
it('starts in wheel contact and travels with the carrier until takeoff',()=>{
 const start=carrierEscape.evaluate(0),platformContact=CARRIER_PLATFORM_HEIGHT+WHEEL_RADIUS;
 expect(start.position).toEqual([CARRIER_ESCAPE_START_X,platformContact,0]);
 expect(start.speed).toBeGreaterThan(0);
 for(let time=0;time<=5;time+=.025){
  const pose=carrierEscape.evaluate(time);
  expect(pose.position[0]).toBe(CARRIER_ESCAPE_START_X);
  expect(pose.position[1]).toBeGreaterThanOrEqual(platformContact);
  expect(pose.position[1]).toBeLessThanOrEqual(platformContact+.080001);
  expect(pose.wheelAngle).toBeCloseTo(-5.2*time/WHEEL_RADIUS,8);
 }
});
it('clears the platform and upper sedan before crossing their positions',()=>{
 expect(Math.abs(CARRIER_ESCAPE_START_X+4)).toBeGreaterThan((5.1+4.35)/2);
 for(let time=5;time<=13;time+=.025){
  const pose=carrierEscape.evaluate(time);
  expect(pose.position[1]).toBeGreaterThanOrEqual(CARRIER_PLATFORM_HEIGHT+WHEEL_RADIUS-.000001);
  const upperSedanDeltas=[Math.abs(pose.position[0]+4),Math.abs(pose.position[0]-2.3)];
  for(const distance of upperSedanDeltas)if(distance<3.3)expect(pose.position[1]).toBeGreaterThan(CARRIER_PLATFORM_HEIGHT+1.9);
 }
 expect(carrierEscape.evaluate(6.2).position[1]).toBeCloseTo(CARRIER_PLATFORM_HEIGHT+WHEEL_RADIUS+.5);
 expect(carrierEscape.evaluate(12).position[0]).toBeGreaterThan(8);
});
it('is deterministic, continuous at each choreography boundary, and clamps playback',()=>{
 for(const time of [3.2,5,6.2,8,12,13]){
  const before=carrierEscape.evaluate(time-.001),after=carrierEscape.evaluate(time+.001);
  expect(new Vector3(...before.position).distanceTo(new Vector3(...after.position))).toBeLessThan(.03);
  expect(new Quaternion(...before.quaternion).angleTo(new Quaternion(...after.quaternion))).toBeLessThan(.02);
  expect(carrierEscape.evaluate(time)).toEqual(carrierEscape.evaluate(time));
 }
 expect(carrierEscape.evaluate(-5)).toEqual(carrierEscape.evaluate(0));
 expect(carrierEscape.evaluate(20)).toEqual(carrierEscape.evaluate(13));
 expect(carrierEscape.evaluate(13).phase).toBe('Maniobra completada');
 expect(advance(12,2,true,carrierEscape.duration)).toEqual({time:13,playing:false});
});
it('registers the Instagram credit on the canonical shareable route',()=>{
 const scene=sceneFromHash('#meme/fuga-del-portacoches');
 expect(scene.scenario).toBe(carrierEscape);
 expect(scene.hash).toBe('#meme/fuga-del-portacoches');
 expect(sourceLabel(scene.source!)).toBe('Visto en @chaseluxuryai · Ver original en Instagram');
 expect(sceneCatalog).toHaveLength(6);
});
});
describe('Saltar canción meme scene',()=>{
 it('starts and ends in ground contact in the same stalled lane',()=>{
  const start=songSkip.evaluate(0),end=songSkip.evaluate(SONG_SKIP_DURATION);
  expect(start.position).toEqual([0,WHEEL_RADIUS,0]);
  expect(end.position).toEqual(start.position);
  expect(end.quaternion).toEqual(start.quaternion);
  expect(start.wheelAngle).toBe(0);
 });
 it('launches vertically and clears every parked vehicle and both building rows during the flips',()=>{
  expect(SONG_SKIP_TRAFFIC.every(car=>car.position[2]!==0||Math.abs(car.position[0])>=8)).toBe(true);
  for(let time=0;time<=SONG_SKIP_DURATION;time+=.025){
   const pose=songSkip.evaluate(time);
   expect(pose.position[0]).toBe(0);
   expect(pose.position[2]).toBe(0);
   expect(pose.position[1]).toBeGreaterThanOrEqual(WHEEL_RADIUS);
   if(time>=6.5&&time<=9){
    for(const car of [...SONG_SKIP_TRAFFIC,SONG_SKIP_BUS]){
     const gapX=Math.abs(pose.position[0]-car.position[0])-(5.1+car.length)/2;
     const gapZ=Math.abs(pose.position[2]-car.position[2])-(2.1+car.width)/2;
     expect(gapX>0||gapZ>0).toBe(true);
    }
    expect(pose.position[1]-Math.hypot(5.1/2,2.1/2)).toBeGreaterThan(0);
    expect(Math.abs(pose.position[2])+2.1/2).toBeLessThan(11.5);
   }
  }
  expect(songSkip.evaluate(6.5).position[1]).toBeGreaterThan(9);
  expect(songSkip.evaluate(9).position[1]).toBeGreaterThan(WHEEL_RADIUS);
 });
 it('is deterministic, continuous at each choreography boundary, and clamps playback',()=>{
  for(const time of [3,4,6.5,8.5,9,SONG_SKIP_DURATION]){
   const before=songSkip.evaluate(time-.001),after=songSkip.evaluate(time+.001);
   expect(new Vector3(...before.position).distanceTo(new Vector3(...after.position))).toBeLessThan(.03);
   expect(new Quaternion(...before.quaternion).angleTo(new Quaternion(...after.quaternion))).toBeLessThan(.03);
   expect(Math.abs(before.vapor-after.vapor)).toBeLessThan(.03);
   expect(songSkip.evaluate(time)).toEqual(songSkip.evaluate(time));
  }
  expect(songSkip.evaluate(-5)).toEqual(songSkip.evaluate(0));
  expect(songSkip.evaluate(20)).toEqual(songSkip.evaluate(SONG_SKIP_DURATION));
  expect(songSkip.evaluate(SONG_SKIP_DURATION).phase).toBe('Maniobra completada');
  expect(advance(10,2,true,SONG_SKIP_DURATION)).toEqual({time:SONG_SKIP_DURATION,playing:false});
 });
 it('animates the musical notes from time alone and registers the TikTok credit',()=>{
  expect(songNotesAt(1)).toEqual(songNotesAt(1));
  expect(songNotesAt(1).every(note=>note.color==='first'&&note.opacity===1)).toBe(true);
  expect(songNotesAt(3).map(note=>note.position)).toEqual(songNotesAt(3.8).map(note=>note.position));
  expect(songNotesAt(3.5).every(note=>note.opacity<.3)).toBe(true);
  expect(songNotesAt(10.8).every(note=>note.color==='next'&&note.opacity>0)).toBe(true);
  const scene=sceneFromHash('#meme/saltar-cancion');
  expect(scene.scenario).toBe(songSkip);
  expect(scene.hash).toBe('#meme/saltar-cancion');
  expect(sourceLabel(scene.source!)).toBe('Visto en @2hndsum · Ver original en TikTok');
  expect(sceneCatalog).toHaveLength(6);
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

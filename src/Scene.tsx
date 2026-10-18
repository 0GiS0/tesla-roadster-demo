import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, Object3D, Quaternion, Spherical, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { rampFlight, RADIUS } from './scenario';

function Vehicle({time,onReady}:{time:number;onReady:()=>void}) {
 const {scene}=useGLTF(`${import.meta.env.BASE_URL}models/roadster.glb`);
 const model=useMemo(()=>{const copy=scene.clone(true);copy.traverse(o=>{o.castShadow=true;o.receiveShadow=true});return copy},[scene]);
 useEffect(()=>onReady(),[onReady]);
 const group=useRef<Group>(null);
 const wheels=useMemo(()=>{const result:{object:Object3D;rotation:Quaternion}[]=[];model.traverse(o=>{if(o.name.startsWith('Wheel_'))result.push({object:o,rotation:o.quaternion.clone()})});return result},[model]);
 useFrame(()=>{const p=rampFlight.evaluate(time);if(group.current){group.current.position.set(...p.position);group.current.quaternion.set(...p.quaternion)}for(const wheel of wheels)wheel.object.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(0,0,1),p.wheelAngle)).multiply(wheel.rotation)});
 return <group ref={group}><primitive object={model}/></group>;
}
function Ramp(){
 const geometry=useMemo(()=>{const vertices:number[]=[],indices:number[]=[];const count=110;for(let i=0;i<=count;i++){const a=i/count*Math.PI*185/180;for(const z of [-2.1,2.1])vertices.push(RADIUS*Math.sin(a),RADIUS*(1-Math.cos(a)),z)}for(let i=0;i<count;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2)}const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo},[]);
 return <group>
  <mesh geometry={geometry} receiveShadow castShadow><meshStandardMaterial color="#69717c" metalness={.72} roughness={.37} side={DoubleSide}/></mesh>
  <Rails/>
  <RampTruss/>

 </group>;
}
function RampTruss(){
 const ref=useRef<InstancedMesh>(null);
 const beams=useMemo(()=>{
  const all:{position:[number,number,number];length:number;angle:number}[]=[];
  const point=(a:number,r:number,z:number):[number,number,number]=>[r*Math.sin(a),RADIUS-r*Math.cos(a),z];
  const beam=(a:[number,number,number],b:[number,number,number])=>all.push({position:[(a[0]+b[0])/2,(a[1]+b[1])/2,a[2]],length:Math.hypot(b[0]-a[0],b[1]-a[1]),angle:Math.atan2(b[1]-a[1],b[0]-a[0])});
  const segments=22,end=Math.PI*185/180;
  for(const z of [-2.3,2.3])for(let i=0;i<segments;i++){
   const a=i/segments*end,b=(i+1)/segments*end;
   beam(point(a,RADIUS+.65,z),point(b,RADIUS+.65,z));
   beam(point(a,RADIUS+.08,z),point(a,RADIUS+.65,z));
   beam(point(a,RADIUS+.08,z),point(b,RADIUS+.65,z));
  }
  return all;
 },[]);
 useEffect(()=>{const dummy=new Object3D();beams.forEach((b,i)=>{dummy.position.set(...b.position);dummy.rotation.set(0,0,b.angle);dummy.scale.set(b.length,.075,.075);dummy.updateMatrix();ref.current?.setMatrixAt(i,dummy.matrix)});if(ref.current)ref.current.instanceMatrix.needsUpdate=true},[beams]);
 return <group><instancedMesh ref={ref} args={[undefined,undefined,beams.length]} castShadow><boxGeometry args={[1,1,1]}/><meshStandardMaterial color="#48515e" metalness={.8} roughness={.4}/></instancedMesh>
  {[3.2,6.6].map(x=><group key={x}>{[-2.3,2.3].map(z=><mesh key={z} position={[x,.1,z]}><boxGeometry args={[1.6,.2,.35]}/><meshStandardMaterial color="#303844" metalness={.8}/></mesh>)}</group>)}
 </group>;
}
function Rails(){
 const ref=useRef<InstancedMesh>(null);
 useEffect(()=>{const dummy=new Object3D();for(let i=0;i<220;i++){const a=(i%110+.5)/110*Math.PI*185/180;dummy.position.set(RADIUS*Math.sin(a),RADIUS*(1-Math.cos(a))+.025,i<110?-2.13:2.13);dummy.rotation.set(0,0,a);dummy.updateMatrix();ref.current?.setMatrixAt(i,dummy.matrix)}if(ref.current)ref.current.instanceMatrix.needsUpdate=true},[]);
 return <instancedMesh ref={ref} args={[undefined,undefined,220]}><boxGeometry args={[.26,.055,.055]}/><meshBasicMaterial color="#f41632" toneMapped={false}/></instancedMesh>;
}
// Fixed seeds and analytic particle ages: scrubbing and pausing never mutate the plume.
function Vapor({time}:{time:number}){
 const ref=useRef<InstancedMesh>(null);const dummy=useMemo(()=>new Object3D(),[]);
 useFrame(()=>{if(!ref.current)return;const p=rampFlight.evaluate(time);for(let i=0;i<256;i++){const seed=(Math.sin(i*127.1+31.7)*43758.5453)%1;const age=((time*.55+i*.61803398875)%1+1)%1;const lane=i%4;const spread=.035+age*.85;dummy.position.set(p.position[0]+(lane<2?-1.1:1.1)+Math.sin(i*9.3)*spread,p.position[1]-.3-age*(2+Math.min(8,p.position[1])),(lane%2?-.65:.65)+Math.cos(i*4.7)*spread);dummy.scale.setScalar(p.vapor*(.13+age*.8)*(1-age*.65)*(1+Math.abs(seed)*.4));dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix)}ref.current.instanceMatrix.needsUpdate=true;ref.current.visible=p.vapor>.001});
 return <instancedMesh ref={ref} args={[undefined,undefined,256]} frustumCulled={false}><planeGeometry args={[2,2]}/><shaderMaterial transparent depthWrite={false} toneMapped={false}
 vertexShader={`varying vec2 vUv; void main(){vUv=uv;vec4 center=modelViewMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);float size=length(instanceMatrix[0].xyz);center.xy+=position.xy*size;gl_Position=projectionMatrix*center;}`}
 fragmentShader={`varying vec2 vUv; void main(){float r=length(vUv*2.0-1.0);float alpha=pow(max(0.0,1.0-r*r),3.0)*0.48;gl_FragColor=vec4(0.94,0.97,1.0,alpha);}`}/>
</instancedMesh>;
}
function Camera({reset}:{reset:number}){
 const controls=useRef<OrbitControlsType>(null);const {camera,size,gl}=useThree();
 // A damping-disabled update consumes and clears pending orbit/pan deltas before an exact placement.
 const flushPending=(orbit:OrbitControlsType)=>{const damping=orbit.enableDamping;orbit.enableDamping=false;orbit.update();orbit.enableDamping=damping};
 useEffect(()=>{
  const orbit=controls.current;if(!orbit)return;
  flushPending(orbit);
  const portrait=size.width/size.height<.85;
  camera.position.set(portrait?-28:-23,portrait?19:16,portrait?39:29);
  orbit.target.set(-2,6,0);orbit.update();
 },[camera,reset,size.width,size.height]);
 useEffect(()=>{
  const canvas=gl.domElement;
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Vista 3D interactiva del Roadster');
  canvas.setAttribute('aria-describedby','camera-keyboard-help');
  const onKeyDown=(event:KeyboardEvent)=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_'].includes(event.key))return;
   const orbit=controls.current;if(!orbit)return;
   event.preventDefault();flushPending(orbit);
   const spherical=new Spherical().setFromVector3(camera.position.clone().sub(orbit.target));
   if(event.key==='ArrowLeft')spherical.theta-=.1;
   if(event.key==='ArrowRight')spherical.theta+=.1;
   if(event.key==='ArrowUp')spherical.phi-=.08;
   if(event.key==='ArrowDown')spherical.phi+=.08;
   if(event.key==='+'||event.key==='=')spherical.radius*=.9;
   if(event.key==='-'||event.key==='_')spherical.radius*=1.1;
   spherical.radius=Math.min(65,Math.max(12,spherical.radius));
   spherical.phi=Math.min(Math.PI*.49,Math.max(.05,spherical.phi));
   camera.position.setFromSpherical(spherical).add(orbit.target);orbit.update();
  };
  canvas.addEventListener('keydown',onKeyDown);
  return()=>canvas.removeEventListener('keydown',onKeyDown);
 },[camera,gl]);
 return <OrbitControls ref={controls} makeDefault target={[-2,6,0]} minDistance={12} maxDistance={65} maxPolarAngle={Math.PI*.49} enableDamping dampingFactor={.08}/>;
}
function Diagnostics({playing}:{playing:boolean}){
 const samples=useRef<number[]>([]),done=useRef(false);
 useFrame((_,delta)=>{if(!playing||done.current||!new URLSearchParams(location.search).has('debug'))return;samples.current.push(delta);const seconds=samples.current.reduce((a,b)=>a+b,0);if(seconds>=5){const sorted=[...samples.current].sort((a,b)=>a-b);console.info('Roadster playback performance',JSON.stringify({seconds,frames:samples.current.length,fps:samples.current.length/seconds,p95FrameMs:sorted[Math.floor(sorted.length*.95)]*1000,dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],userAgent:navigator.userAgent}));done.current=true;}});return null;
}
export function Scene({time,cameraReset,playing,onReady}:{time:number;cameraReset:number;playing:boolean;onReady:()=>void}){
 return <Canvas style={{position:'absolute',inset:0,width:'100%',height:'100%'}} shadows dpr={[1,1.6]} camera={{fov:43,near:.1,far:180}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.setClearColor('#090c13')}}>
  <fog attach="fog" args={['#090c13',47,110]}/><ambientLight intensity={.9}/><hemisphereLight args={['#b9d7ff','#202435',1.4]}/>
  <directionalLight position={[-8,20,12]} intensity={3.7} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-normalBias={.04}/>
  <directionalLight position={[10,10,-10]} color="#6f9bcf" intensity={3}/><pointLight position={[-5,10,4]} color="#f4ac8e" intensity={45}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.065,0]} receiveShadow><planeGeometry args={[180,180]}/><meshStandardMaterial color="#111722" metalness={.45} roughness={.48}/></mesh>
  <gridHelper args={[100,50,'#283343','#1a2431']} position={[0,-.055,0]}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[-10,-.05,0]}><ringGeometry args={[3.2,3.23,80]}/><meshBasicMaterial color="#697481" transparent opacity={.55}/></mesh>
  <Ramp/><Suspense fallback={null}><Vehicle time={time} onReady={onReady}/></Suspense><Vapor time={time}/><Camera reset={cameraReset}/><Diagnostics playing={playing}/>
 </Canvas>;
}

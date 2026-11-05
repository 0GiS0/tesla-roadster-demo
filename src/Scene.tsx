import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { BufferGeometry, CanvasTexture, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, Object3D, Path, Quaternion, RepeatWrapping, Spherical, Shape, ShapeGeometry, SRGBColorSpace, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { RADIUS } from './scenario';
import type { SceneDefinition } from './sceneCatalog';

function Vehicle({time,onReady,definition}:{time:number;onReady:()=>void;definition:SceneDefinition}) {
 const {scene}=useGLTF(`${import.meta.env.BASE_URL}models/roadster.glb`);
 const model=useMemo(()=>{const copy=scene.clone(true);copy.traverse(o=>{o.castShadow=true;o.receiveShadow=true});return copy},[scene]);
 useEffect(()=>onReady(),[onReady]);
 const group=useRef<Group>(null);
 const wheels=useMemo(()=>{const result:{object:Object3D;rotation:Quaternion}[]=[];model.traverse(o=>{if(o.name.startsWith('Wheel_'))result.push({object:o,rotation:o.quaternion.clone()})});return result},[model]);
 useFrame(()=>{const p=definition.scenario.evaluate(time);if(group.current){group.current.position.set(...p.position);group.current.quaternion.set(...p.quaternion)}for(const wheel of wheels)wheel.object.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(0,0,1),p.wheelAngle)).multiply(wheel.rotation)});
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
function Vapor({time,definition}:{time:number;definition:SceneDefinition}){
 const ref=useRef<InstancedMesh>(null);const dummy=useMemo(()=>new Object3D(),[]);
 useFrame(()=>{if(!ref.current)return;const p=definition.scenario.evaluate(time);for(let i=0;i<256;i++){const seed=(Math.sin(i*127.1+31.7)*43758.5453)%1;const age=((time*.55+i*.61803398875)%1+1)%1;const lane=i%4;const spread=.035+age*.85;dummy.position.set(p.position[0]+(lane<2?-1.1:1.1)+Math.sin(i*9.3)*spread,p.position[1]-.3-age*(2+Math.min(8,p.position[1])),(lane%2?-.65:.65)+Math.cos(i*4.7)*spread);dummy.scale.setScalar(p.vapor*(.13+age*.8)*(1-age*.65)*(1+Math.abs(seed)*.4));dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix)}ref.current.instanceMatrix.needsUpdate=true;ref.current.visible=p.vapor>.001});
 return <instancedMesh ref={ref} args={[undefined,undefined,256]} frustumCulled={false}><planeGeometry args={[2,2]}/><shaderMaterial transparent depthWrite={false} toneMapped={false}
 vertexShader={`varying vec2 vUv; void main(){vUv=uv;vec4 center=modelViewMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);float size=length(instanceMatrix[0].xyz);center.xy+=position.xy*size;gl_Position=projectionMatrix*center;}`}
 fragmentShader={`varying vec2 vUv; void main(){float r=length(vUv*2.0-1.0);float alpha=pow(max(0.0,1.0-r*r),3.0)*0.48;gl_FragColor=vec4(0.94,0.97,1.0,alpha);}`}/>
</instancedMesh>;
}
function Camera({reset,definition}:{reset:number;definition:SceneDefinition}){
 const controls=useRef<OrbitControlsType>(null);const {camera,size,gl}=useThree();
 // A damping-disabled update consumes and clears pending orbit/pan deltas before an exact placement.
 const flushPending=(orbit:OrbitControlsType)=>{const damping=orbit.enableDamping;orbit.enableDamping=false;orbit.update();orbit.enableDamping=damping};
 useEffect(()=>{
  const orbit=controls.current;if(!orbit)return;
  flushPending(orbit);
  const portrait=size.width/size.height<.85;
  const framing=definition.camera.fit;
  if(framing){
   const target=new Vector3(0,2,0);
   const direction=new Vector3(...framing.direction).normalize();
   const verticalDistance=framing.height/(2*Math.tan(43*Math.PI/360));
   const horizontalDistance=framing.width/(2*Math.tan(43*Math.PI/360)*Math.max(size.width/size.height,.35));
   const distance=Math.max(verticalDistance,horizontalDistance)*1.08;
   camera.position.copy(target).addScaledVector(direction,distance);
   orbit.target.copy(target);
  }else{
   const preset=portrait?definition.camera.portrait:definition.camera.desktop;
   camera.position.set(...preset.position);
   orbit.target.set(...preset.target);
  }
  orbit.update();
 },[camera,reset,size.width,size.height,definition]);
 useEffect(()=>{
  const canvas=gl.domElement;
  canvas.setAttribute('tabindex','0');
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
   spherical.radius=Math.min(definition.camera.fit?110:65,Math.max(12,spherical.radius));
   spherical.phi=Math.min(Math.PI*.49,Math.max(.05,spherical.phi));
   camera.position.setFromSpherical(spherical).add(orbit.target);orbit.update();
  };
  canvas.addEventListener('keydown',onKeyDown);
  return()=>canvas.removeEventListener('keydown',onKeyDown);
 },[camera,gl,definition]);
 return <OrbitControls ref={controls} makeDefault target={[-2,6,0]} minDistance={12} maxDistance={definition.camera.fit?110:65} maxPolarAngle={Math.PI*.49} enableDamping dampingFactor={.08}/>;
}
function Diagnostics({playing}:{playing:boolean}){
 const samples=useRef<number[]>([]),done=useRef(false);
 useFrame((_,delta)=>{if(!playing||done.current||!new URLSearchParams(location.search).has('debug'))return;samples.current.push(delta);const seconds=samples.current.reduce((a,b)=>a+b,0);if(seconds>=5){const sorted=[...samples.current].sort((a,b)=>a-b);console.info('Roadster playback performance',JSON.stringify({seconds,frames:samples.current.length,fps:samples.current.length/seconds,p95FrameMs:sorted[Math.floor(sorted.length*.95)]*1000,dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],userAgent:navigator.userAgent}));done.current=true;}});return null;
}
type PotholeGeometry={asphalt:ShapeGeometry;rim:ShapeGeometry;chippedEdge:BufferGeometry};
function createPotholeGeometry():PotholeGeometry{
 const count=24;
 const radialPath=(radius:number,reverse=false)=>{
  const path=new Path();
  for(let i=0;i<count;i++){
   const index=reverse?count-1-i:i,angle=index/count*Math.PI*2;
   const irregular=radius*(1+.05*Math.sin(index*2.7+.7)+.035*Math.cos(index*4.1+.7));
   const x=Math.cos(angle)*irregular,z=Math.sin(angle)*irregular;
   if(i===0)path.moveTo(x,z);else path.lineTo(x,z);
  }
  path.closePath();return path;
 };
 const asphalt=new Shape();asphalt.moveTo(-45,-45);asphalt.lineTo(45,-45);asphalt.lineTo(45,45);asphalt.lineTo(-45,45);asphalt.closePath();asphalt.holes.push(radialPath(3.18,true));
 const rim=new Shape();
 for(let i=0;i<count;i++){
  const angle=i/count*Math.PI*2,r=3.38*(1+.055*Math.sin(i*2.7+.7)+.025*Math.cos(i*4.3));
  if(i===0)rim.moveTo(Math.cos(angle)*r,Math.sin(angle)*r);else rim.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);
 }
 rim.closePath();rim.holes.push(radialPath(2.93,true));
 const chippedEdge=new BufferGeometry(),vertices:number[]=[],indices:number[]=[];
 for(let i=0;i<count;i++){
  const angle=i/count*Math.PI*2;
  const rough=1+.055*Math.sin(i*2.7+.7)+.025*Math.cos(i*4.3);
  const inner=1+.05*Math.sin(i*2.7+.7)+.035*Math.cos(i*4.1+.7);
  const outerRadius=3.38*rough,innerRadius=3.18*inner;
  const topY=-.035+.025*Math.sin(i*3.4),bottomY=-.25+.018*Math.cos(i*2.3);
  vertices.push(Math.cos(angle)*outerRadius,topY,Math.sin(angle)*outerRadius,Math.cos(angle)*innerRadius,bottomY,Math.sin(angle)*innerRadius);
  const start=i*2,next=((i+1)%count)*2;indices.push(start,start+1,next,next,start+1,next+1);
 }
 chippedEdge.setAttribute('position',new Float32BufferAttribute(vertices,3));
 chippedEdge.setIndex(indices);chippedEdge.computeVertexNormals();
 return {asphalt:new ShapeGeometry(asphalt),rim:new ShapeGeometry(rim),chippedEdge};
}
function Pothole(){
 const asphaltTexture=useMemo(()=>{
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const context=canvas.getContext('2d');if(!context)return null;
  context.fillStyle='#555650';context.fillRect(0,0,128,128);
  let seed=3701;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(let i=0;i<6200;i++){
   const shade=68+Math.floor(random()*80);context.fillStyle=`rgba(${shade},${shade},${shade-5},${.1+random()*.24})`;
   const size=.3+random()*1.5;context.fillRect(random()*128,random()*128,size,size*.6);
  }
  const texture=new CanvasTexture(canvas);texture.wrapS=RepeatWrapping;texture.wrapT=RepeatWrapping;texture.repeat.set(10,10);texture.colorSpace=SRGBColorSpace;
  return texture;
 },[]);
 const textureDisposal=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 useEffect(()=>{
  if(textureDisposal.current)clearTimeout(textureDisposal.current);
  return()=>{if(asphaltTexture)textureDisposal.current=setTimeout(()=>asphaltTexture.dispose(),0)};
 },[asphaltTexture]);
 const [road,setRoad]=useState<PotholeGeometry|null>(null);
 useEffect(()=>{
  const geometry=createPotholeGeometry();
  // eslint-disable-next-line react-hooks/set-state-in-effect -- geometry owns GPU resources disposed in cleanup
  setRoad(geometry);
  return()=>{geometry.asphalt.dispose();geometry.rim.dispose();geometry.chippedEdge.dispose()};
 },[]);
 if(!road)return null;
 return <group>
  <mesh geometry={road.asphalt} rotation={[-Math.PI/2,0,0]} position={[0,-.065,0]} receiveShadow>
   <meshStandardMaterial color="#ffffff" map={asphaltTexture} roughness={.98}/>
  </mesh>
  <mesh geometry={road.rim} rotation={[-Math.PI/2,0,0]} position={[0,-.06,0]} receiveShadow>
   <meshStandardMaterial color="#4b4a42" map={asphaltTexture} roughness={1} side={DoubleSide}/>
  </mesh>
  <mesh geometry={road.chippedEdge} receiveShadow><meshStandardMaterial color="#393831" roughness={1} side={DoubleSide}/></mesh>
  <mesh position={[0,-.22,0]} rotation={[-Math.PI/2,0,0]}>
   <circleGeometry args={[2.9,32]}/><meshStandardMaterial color="#6d6248" metalness={.08} roughness={.35}/>
  </mesh>
  <mesh position={[-.4,-.208,.35]} rotation={[-Math.PI/2,0,0]}>
   <ringGeometry args={[1.65,1.82,32]}/><meshStandardMaterial color="#8b7956" transparent opacity={.38} roughness={.22}/>
  </mesh>
  {[1,-1].map(side=><StreetEdge key={side} side={side as 1|-1}/>)}
  <mesh position={[3.7,.65,0]}><coneGeometry args={[.38,1.25,6]}/><meshStandardMaterial color="#dc503b"/></mesh>
  <mesh position={[3.7,.03,0]}><cylinderGeometry args={[.43,.43,.1,16]}/><meshStandardMaterial color="#e5dfce"/></mesh>
  {[-18,-7,7,18].map((x,i)=><Building key={x} position={[x,0,i%2?-14:14]} side={i%2?-1:1} color={i%2?'#d2c2a9':'#c2c0b5'}/>)}
 </group>;
}
function StreetEdge({side}:{side:1|-1}){
 return <group>
  <mesh position={[0,.04,side*5.15]} receiveShadow><boxGeometry args={[90,.22,.32]}/><meshStandardMaterial color="#b4ad9d" roughness={.9}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.02,side*7.05]} receiveShadow><planeGeometry args={[90,3.45]}/><meshStandardMaterial color="#b6b2a6" roughness={.94}/></mesh>
  <mesh position={[0,.18,side*8.95]}><boxGeometry args={[90,.35,.18]}/><meshStandardMaterial color="#8c887d" roughness={.95}/></mesh>
  {[-15,-4,7,18].map(x=><group key={x} position={[x,0,side*10.1]}>
   <mesh position={[0,.35,0]}><boxGeometry args={[4,.7,.8]}/><meshStandardMaterial color="#52604a" roughness={1}/></mesh>
   <mesh position={[-1.1,1.15,0]}><sphereGeometry args={[.85,10,8]}/><meshStandardMaterial color="#60744f" roughness={1}/></mesh>
   <mesh position={[1.05,1.05,0]}><sphereGeometry args={[.68,10,8]}/><meshStandardMaterial color="#71805a" roughness={1}/></mesh>
   <mesh position={[0,1.75,.55]}><cylinderGeometry args={[.16,.25,3.5,7]}/><meshStandardMaterial color="#735b42" roughness={1}/></mesh>
   <mesh position={[0,3.6,.55]}><sphereGeometry args={[1.45,10,8]}/><meshStandardMaterial color="#71835d" roughness={1}/></mesh>
   <mesh position={[-.7,4.05,.45]}><sphereGeometry args={[.95,10,8]}/><meshStandardMaterial color="#839067" roughness={1}/></mesh>
  </group>)}
 </group>;
}
function Building({position,color,side}:{position:[number,number,number];color:string;side:1|-1}){
 const [roof,setRoof]=useState<BufferGeometry|null>(null);
 useEffect(()=>{
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute([
   -4.4,4.65,-3.1,4.4,4.65,-3.1,4.4,5.45,0,-4.4,5.45,0,
   -4.4,4.65,3.1,4.4,4.65,3.1,4.4,5.45,0,-4.4,5.45,0,
  ],3));geometry.setIndex([0,1,2,0,2,3,4,6,5,4,7,6]);geometry.computeVertexNormals();
  // eslint-disable-next-line react-hooks/set-state-in-effect -- geometry owns GPU resources disposed in cleanup
  setRoof(geometry);
  return()=>geometry.dispose();
 },[]);
 const front=-side;
 return <group position={position}>
  <mesh position={[0,2.3,0]} castShadow receiveShadow><boxGeometry args={[8,4.6,6]}/><meshStandardMaterial color={color} roughness={.93}/></mesh>
  {roof&&<mesh geometry={roof} castShadow><meshStandardMaterial color="#9a6047" roughness={.9} side={DoubleSide}/></mesh>}
  {[-2.5,0,2.5].flatMap(x=>[1.45,3.3].map(y=>(
   <group key={`${x}-${y}`} position={[x,y,front*3.04]}>
    <mesh><boxGeometry args={[1.35,1.25,.12]}/><meshStandardMaterial color="#e2d4bd" roughness={.88}/></mesh>
    <mesh position={[0,0,front*.08]}><boxGeometry args={[1.05,.95,.08]}/><meshStandardMaterial color="#637b81" roughness={.4}/></mesh>
    <mesh position={[0,0,front*.13]}><boxGeometry args={[.06,1,.05]}/><meshStandardMaterial color="#d2c3aa"/></mesh>
   </group>
  )))}
  <mesh position={[3,1.15,front*3.08]}><boxGeometry args={[1.25,2.25,.16]}/><meshStandardMaterial color="#80664d" roughness={.86}/></mesh>
  <mesh position={[0,1.95,front*3.16]}><boxGeometry args={[8.4,.18,.38]}/><meshStandardMaterial color="#e2d6c1"/></mesh>
 </group>;
}
export function Scene({time,cameraReset,playing,onReady,definition}:{time:number;cameraReset:number;playing:boolean;onReady:()=>void;definition:SceneDefinition}){
 const street=definition.environment==='pothole',sky=street?'#c2c5bd':'#090c13';
 return <Canvas style={{position:'absolute',inset:0,width:'100%',height:'100%'}} shadows dpr={[1,1.6]} camera={{fov:43,near:.1,far:180}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}}>
  <color attach="background" args={[sky]}/>
  <fog attach="fog" args={[sky,street?58:47,street?155:110]}/>
  <ambientLight intensity={street?1.05:.9}/><hemisphereLight args={street?['#fff1d7','#68725c',1.15]:['#b9d7ff','#202435',1.4]}/>
  <directionalLight position={street?[-15,24,12]:[-8,20,12]} color={street?'#fff0d8':'#ffffff'} intensity={street?2.35:3.7} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-normalBias={.04}/>
  {!street&&<><directionalLight position={[10,10,-10]} color="#6f9bcf" intensity={3}/><pointLight position={[-5,10,4]} color="#f4ac8e" intensity={45}/></>}
  {definition.environment==='ramp'?<><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.065,0]} receiveShadow><planeGeometry args={[180,180]}/><meshStandardMaterial color="#111722" metalness={.45} roughness={.48}/></mesh><gridHelper args={[100,50,'#283343','#1a2431']} position={[0,-.055,0]}/></>:<Pothole/>}
  {definition.environment==='ramp'&&<mesh rotation={[-Math.PI/2,0,0]} position={[-10,-.05,0]}><ringGeometry args={[3.2,3.23,80]}/><meshBasicMaterial color="#697481" transparent opacity={.55}/></mesh>}
  {definition.environment==='ramp'&&<Ramp/>}<Suspense fallback={null}><Vehicle time={time} onReady={onReady} definition={definition}/></Suspense><Vapor time={time} definition={definition}/><Camera reset={cameraReset} definition={definition}/><Diagnostics playing={playing}/>
 </Canvas>;
}

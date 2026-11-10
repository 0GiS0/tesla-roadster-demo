import { DRIVE_THROUGH, driveThroughBagPose } from './scenario';

function Box({position,size,color,glow=false}:{position:[number,number,number];size:[number,number,number];color:string;glow?:boolean}){
 return <mesh position={position} castShadow={!glow} receiveShadow>
  <boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.7} emissive={glow?color:'#000000'} emissiveIntensity={glow?.45:0}/>
 </mesh>;
}

function Burger({position,scale=1}:{position:[number,number,number];scale?:number}){
 return <group position={position} scale={scale}>
  <mesh position={[0,.3,0]}><sphereGeometry args={[.75,16,8,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color="#f4b52f" roughness={.65}/></mesh>
  <Box position={[0,.24,0]} size={[1.5,.18,.65]} color="#efb52e"/>
  <Box position={[0,0,0]} size={[1.65,.24,.68]} color="#c53228"/>
  <Box position={[0,-.27,0]} size={[1.5,.25,.65]} color="#efb52e"/>
 </group>;
}

function Terrace({x,z}:{x:number;z:number}){
 return <group position={[x,0,z]}>
  <mesh position={[0,.95,0]} castShadow><cylinderGeometry args={[.85,.85,.12,12]}/><meshStandardMaterial color="#9b714b"/></mesh>
  <Box position={[0,.48,0]} size={[.12,.96,.12]} color="#363b39"/>
  {[-1,1].map(side=><group key={side} position={[side*1.1,0,0]}>
   <Box position={[0,.48,0]} size={[.65,.12,.65]} color="#825e40"/>
   <Box position={[side*.28,.95,0]} size={[.12,.85,.65]} color="#825e40"/>
   {[-.24,.24].map(offset=><Box key={offset} position={[0,.23,offset]} size={[.55,.46,.07]} color="#363b39"/>)}
  </group>)}
 </group>;
}

export function DriveThrough({time}:{time:number}){
 const bag=driveThroughBagPose(time),front=DRIVE_THROUGH.facadeZ;
 return <group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.07,0]} receiveShadow>
   <planeGeometry args={[90,70]}/><meshStandardMaterial color="#454b4d" roughness={.22} metalness={.55}/>
  </mesh>
  {[-6,-3,0,3,6].flatMap(x=>[0,1,2].map(index=><mesh key={`reflection-${x}-${index}`} position={[x+index*.13,-.055,1.3+index*1.1]} rotation={[-Math.PI/2,0,0]}>
   <planeGeometry args={[1.3-index*.25,.75]}/><meshBasicMaterial color="#d5aa62" transparent opacity={.13-index*.025} depthWrite={false}/>
  </mesh>))}
  {[[-5,4,1.4],[2,5,1.7],[-2,1.6,.7],[6,2.5,.9]].map(([x,z,radius])=><mesh key={`puddle-${x}`} position={[x,-.06,z]} rotation={[-Math.PI/2,0,0]} scale={[1,.45,1]}>
   <circleGeometry args={[radius,24]}/><meshStandardMaterial color="#88969a" roughness={.08} metalness={.65} transparent opacity={.38} depthWrite={false}/>
  </mesh>)}
  <Box position={[0,.05,-3.3]} size={[21,.2,2]} color="#b4aaa0"/>
  <Box position={[0,4.5,-6.5]} size={[16,9,4]} color="#34383a"/>
  {/* The upper facade has a real opening rather than a window painted over a wall. */}
  <Box position={[-4.85,6.45,front]} size={[6.3,4.7,.3]} color="#34383a"/>
  <Box position={[4.85,6.45,front]} size={[6.3,4.7,.3]} color="#34383a"/>
  <Box position={[0,8.5,front]} size={[3.4,.6,.3]} color="#34383a"/>
  <Box position={[0,4.8,front]} size={[3.4,1.4,.3]} color="#34383a"/>
  <Box position={[0,6.85,-3.65]} size={[3.4,2.7,.12]} color="#e5a84e" glow/>
  {[-1,1].map(side=><Box key={side} position={[side*1.8,6.85,front+.12]} size={[.22,2.9,.45]} color="#9e6135"/>)}
  {[5.45,8.25].map(y=><Box key={y} position={[0,y,front+.12]} size={[3.85,.23,.55]} color="#a46a3c"/>)}
  <Box position={[0,5.55,front+.25]} size={[3.8,.12,.8]} color="#bd8a55"/>
  {[.2,4,8.9].map(y=><Box key={y} position={[0,y,front+.02]} size={[16.5,.3,.5]} color="#55595a"/>)}
  {[-6,-3,0,3,6].map(x=><group key={x}>
   <Box position={[x,2,front+.02]} size={[2.8,3.35,.08]} color="#775b37" glow/>
   <mesh position={[x,2,front+.09]}>
    <boxGeometry args={[2.7,3.3,.04]}/><meshStandardMaterial color="#819494" metalness={.5} roughness={.12} transparent opacity={.5}/>
   </mesh>
   <Box position={[x-1.42,2,front+.14]} size={[.1,3.6,.12]} color="#292e2e"/>
   <Box position={[x,1.25,front+.18]} size={[1.4,.12,.35]} color="#bc874d"/>
   <Box position={[x,.7,front+.18]} size={[.12,1,.25]} color="#4b4031"/>
   <mesh position={[x,3.25,front+.17]} rotation={[Math.PI,0,0]}>
    <coneGeometry args={[.3,.35,12]}/><meshStandardMaterial color="#f0bc69" emissive="#efaf43" emissiveIntensity={.5}/>
   </mesh>
  </group>)}
  <Burger position={[5,6.8,front+.42]} scale={1.35}/>
  <Box position={[.75,6.15,-2.85]} size={[.6,.65,.38]} color="#b6372a"/>
  <mesh position={[.75,6.75,-2.78]} castShadow><sphereGeometry args={[.23,10,8]}/><meshStandardMaterial color="#c9956c"/></mesh>
  <Box position={[.75,6.97,-2.78]} size={[.52,.13,.48]} color="#ba382b"/>
  <Box position={[.4,6.6,-2.38]} size={[.65,.15,.25]} color="#c9956c"/>
  <group position={bag.position} rotation={[0,0,bag.rotation]}>
   <Box position={[0,0,0]} size={[.68,.85,.4]} color="#d5aa72"/>
   <Box position={[0,.45,0]} size={[.7,.09,.42]} color="#bb8c55"/>
   <mesh position={[0,.53,0]}><torusGeometry args={[.13,.025,6,12,Math.PI]}/><meshStandardMaterial color="#93683c"/></mesh>
   <Burger position={[0,-.03,.21]} scale={.26}/>
  </group>
  {[-9,9].map(x=><group key={x} position={[x,0,-1.9]}>
   <Box position={[0,2.15,0]} size={[.15,4.3,.15]} color="#363c3b"/>
   <Box position={[0,4.25,.25]} size={[.8,.16,.8]} color="#3f4543"/>
   <Box position={[0,4.12,.25]} size={[.65,.12,.65]} color="#ffe0a0" glow/>
   <mesh position={[0,.012,3.2]} rotation={[-Math.PI/2,0,0]}>
    <planeGeometry args={[.65,5]}/><meshBasicMaterial color="#e6b968" transparent opacity={.16} depthWrite={false}/>
   </mesh>
  </group>)}
  {[-7,7].map(x=><group key={x} position={[x,0,-1.9]}>
   <Box position={[0,.3,0]} size={[.8,.6,.6]} color="#424744"/>
   <mesh position={[0,.95,0]} castShadow><dodecahedronGeometry args={[.5,0]}/><meshStandardMaterial color="#707f43" flatShading/></mesh>
  </group>)}
  <Terrace x={7.8} z={4.5}/>
  <Box position={[0,.012,2.15]} size={[2,.025,.18]} color="#e0e0d6"/>
  {[-1,1].map(side=><mesh key={side} position={[1,.012,2.15+side*.25]} rotation={[0,side*Math.PI/4,0]}>
   <boxGeometry args={[.8,.025,.18]}/><meshStandardMaterial color="#e0e0d6"/>
  </mesh>)}
  {[-1.6,6.6].map(z=><Box key={z} position={[0,.005,z]} size={[30,.012,.08]} color="#babcb3"/>)}
 </group>;
}

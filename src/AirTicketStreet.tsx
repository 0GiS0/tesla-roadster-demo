import { Quaternion, Vector3 } from 'three';
import { AIR_TICKET, airTicketProps } from './scenario';

function Box({ position, size, color, glow = false }: { position: [number, number, number]; size: [number, number, number]; color: string; glow?: boolean }) {
 return <mesh position={position} castShadow={!glow} receiveShadow>
  <boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.75} emissive={glow ? color : '#000000'} emissiveIntensity={glow ? 1.5 : 0}/>
 </mesh>;
}

function Beam({ start, end, radius, color }: { start: [number, number, number]; end: [number, number, number]; radius: number; color: string }) {
 const from=new Vector3(...start),to=new Vector3(...end),delta=to.clone().sub(from);
 return <mesh position={from.add(to).multiplyScalar(.5)} quaternion={new Quaternion().setFromUnitVectors(new Vector3(0,1,0),delta.clone().normalize())} castShadow>
  <cylinderGeometry args={[radius,radius,delta.length(),6]}/><meshStandardMaterial color={color} roughness={.8}/>
 </mesh>;
}

function Patrol({flash}:{flash:boolean}){
 return <group position={[AIR_TICKET.patrolX,0,AIR_TICKET.patrolZ]}>
  <Box position={[0,.7,0]} size={[4.2,.7,1.9]} color="#e2e4df"/>
  <Box position={[-.25,1.26,0]} size={[2.3,.52,1.65]} color="#e2e4df"/>
  <Box position={[-.25,1.31,0]} size={[2.12,.39,1.69]} color="#30394c"/>
  {[-1,1].flatMap(side=>[-1.3,1.3].map(x=><mesh key={`${side}-${x}`} position={[x,.35,side*.9]} rotation={[Math.PI/2,0,0]}>
   <cylinderGeometry args={[.34,.34,.22,10]}/><meshStandardMaterial color="#20212a"/>
  </mesh>))}
  <Box position={[-.25,1.6,0]} size={[.88,.12,.34]} color="#31323b"/>
  <Box position={[-.5,1.69,0]} size={[.34,.16,.34]} color={flash?'#237bff':'#17315c'} glow={flash}/>
  <Box position={[0,1.69,0]} size={[.34,.16,.34]} color={!flash?'#f33136':'#5b222b'} glow={!flash}/>
  {[-.62,.62].map(z=><Box key={z} position={[2.12,.73,z]} size={[.06,.22,.33]} color="#fff4cc" glow/>)}
 </group>;
}

function Ladder(){
 return <group position={[AIR_TICKET.ladderX,0,AIR_TICKET.ladderZ]}>
  {[-.48,.48].flatMap(z=>[-1,1].map(side=><Beam key={`${z}-${side}`} start={[side*.82,0,z]} end={[0,2.85,z]} radius={.045} color="#aebbc4"/>))}
  {[.5,1,1.5,2,2.5].map(y=><Box key={y} position={[-.65+y*.23,y,0]} size={[.4,.065,1.1]} color="#c2ccd1"/>)}
  <Box position={[0,2.87,0]} size={[.45,.08,1.1]} color="#cad1d0"/>
 </group>;
}

function Officer({height,reach}:{height:number;reach:number}){
 return <group position={[AIR_TICKET.ladderX-.72+height*.24,height,AIR_TICKET.ladderZ]}>
  {[-.18,.18].map(z=><Box key={z} position={[0,.33,z]} size={[.18,.65,.16]} color="#252e3d"/>)}
  <Box position={[0,1.03,0]} size={[.63,.8,.42]} color="#252e3d"/>
  <Box position={[.02,1.1,.23]} size={[.48,.54,.07]} color="#3a4850"/>
  <mesh position={[0,1.66,0]} castShadow><dodecahedronGeometry args={[.23,0]}/><meshStandardMaterial color="#a18b7c" flatShading/></mesh>
  <Box position={[0,1.89,0]} size={[.53,.14,.53]} color="#252e3d"/>
  <Box position={[-.14,1.81,-.22]} size={[.42,.045,.18]} color="#252e3d"/>
  <group rotation={[reach*.35,0,0]}>
   <Box position={[.1,1.25,-.36-reach*.29]} size={[.15,.18,.7+reach*.55]} color="#293342"/>
   <Box position={[.1,1.25,-.74-reach*.55]} size={[.13,.14,.16]} color="#a18b7c"/>
  </group>
  <Box position={[-.24,1.2,.22]} size={[.15,.65,.15]} color="#293342"/>
 </group>;
}

function House({x,z,color}:{x:number;z:number;color:string}){
 return <group position={[x,0,z]}>
  <Box position={[0,2.35,0]} size={[6,4.7,4.8]} color={color}/>
  <mesh position={[0,5.25,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[4.25,1.3,4]}/><meshStandardMaterial color="#514153" flatShading/></mesh>
  {[-1.65,1.65].map(offset=><group key={offset}>
   <Box position={[offset,2.8,z<0?2.45:-2.45]} size={[1.05,1.1,.07]} color="#f0bd7e" glow/>
   <Box position={[offset,2.8,z<0?2.5:-2.5]} size={[.08,1.12,.08]} color="#604e54"/>
  </group>)}
 </group>;
}

function Tree({x,z}:{x:number;z:number}){
 return <group position={[x,0,z]}>
  <Box position={[0,1.2,0]} size={[.35,2.4,.35]} color="#614c43"/>
  <mesh position={[0,3.15,0]} castShadow><dodecahedronGeometry args={[1.35,1]}/><meshStandardMaterial color="#51664c" flatShading/></mesh>
 </group>;
}

export function AirTicketStreet({time}:{time:number}){
 const props=airTicketProps(time);
 return <group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.09,0]} receiveShadow><planeGeometry args={[110,85]}/><meshStandardMaterial color="#363845" roughness={.97}/></mesh>
  {[-1,1].map(side=><group key={side}>
   <Box position={[0,.06,side*9]} size={[100,.12,3]} color="#8c8290"/>
   <Box position={[0,.16,side*7.5]} size={[100,.26,.25]} color="#b4a8a0"/>
  </group>)}
  {[-18,-9,0,9,18].map(x=><Box key={x} position={[x,.006,-.4]} size={[3,.015,.1]} color="#b7a89d"/>)}
  <Patrol flash={props.policeFlash}/><Ladder/><Officer height={props.officerHeight} reach={props.reach}/>
  <group position={props.paperPosition} rotation={[props.paperRotation,0,props.paperRotation*.55]}>
   <mesh castShadow><boxGeometry args={[.42,.55,.035]}/><meshStandardMaterial color="#f5d155" emissive="#a27920" emissiveIntensity={.3}/></mesh>
  </group>
  {[-20,-12,12,20].flatMap((x,i)=>[-15,15].map(z=><House key={`${x}-${z}`} x={x} z={z} color={['#8e7788','#8b8b92','#8f7790','#9b857c'][i]}/>))}
  {[-15,-7,8,16].map(x=><Tree key={x} x={x} z={11}/>)}
  {[-10,9].map(x=><group key={x} position={[x,0,-8]}>
   <Box position={[0,2.8,0]} size={[.16,5.6,.16]} color="#544a4e"/>
   <Box position={[0,5.45,.58]} size={[.14,.12,1.3]} color="#544a4e"/>
   <Box position={[0,5.35,1.12]} size={[.55,.13,.45]} color="#ffe7a4" glow/>
   <pointLight position={[0,5,1]} color="#ffc577" intensity={12} distance={11}/>
  </group>)}
  {[-17,-5,7,19].map(x=><group key={x} position={[x,0,AIR_TICKET.poleZ]}>
   <Box position={[0,4.2,0]} size={[.27,8.4,.27]} color="#665045"/>
   <Box position={[0,8.15,0]} size={[.24,.15,2]} color="#665045"/>
  </group>)}
  {[8,8.3].map(y=><Beam key={y} start={[-22,y,AIR_TICKET.poleZ]} end={[24,y,AIR_TICKET.poleZ]} radius={.025} color="#222331"/>)}
  {[-12,14].map(x=><Box key={x} position={[x,.35,10.8]} size={[3,.7,.8]} color="#516346"/>)}
 </group>;
}

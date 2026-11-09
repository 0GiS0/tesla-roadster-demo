import { Quaternion, Vector3 } from 'three';
import { CARRIER_ESCAPE_START_X, CARRIER_PLATFORM_HEIGHT, carrierEscape } from './scenario';

const ROADSTER_SLOT_Z=0;
const CARRIER_LENGTH=15;
const CARRIER_WIDTH=4;
const POLE_SPACING=16;
const POLE_SPAN=64;
const DESERT_BUSHES=[
 [-28,-13,1.1],[-19,15,.8],[-12,-17,.75],[-4,13,1.15],[9,-15,.9],[18,16,.8],[27,-12,1],
] as const;
const DESERT_HILLS=[
 [-30,-34,12,8],[-13,36,14,9],[8,-35,16,10],[28,34,13,8],
] as const;

function Beam({start,end,thickness,color}:{start:[number,number,number];end:[number,number,number];thickness:number;color:string}){
 const from=new Vector3(...start),to=new Vector3(...end),direction=to.clone().sub(from);
 return <mesh position={from.add(to).multiplyScalar(.5)} quaternion={new Quaternion().setFromUnitVectors(new Vector3(0,1,0),direction.clone().normalize())} castShadow>
  <boxGeometry args={[thickness,direction.length(),thickness]}/><meshStandardMaterial color={color} roughness={.84}/>
 </mesh>;
}

function Wheel({position,radius=.68}:{position:[number,number,number];radius?:number}){
 return <group position={position} rotation={[Math.PI/2,0,0]}>
  <mesh castShadow><cylinderGeometry args={[radius,radius,.42,12]}/><meshStandardMaterial color="#252522" roughness={.9}/></mesh>
  <mesh position={[0,0,.22]}><cylinderGeometry args={[radius*.53,radius*.53,.04,10]}/><meshStandardMaterial color="#817d70" metalness={.42} roughness={.56}/></mesh>
 </group>;
}

function CarrierSedan({x,deckY,color,rock=0}:{x:number;deckY:number;color:string;rock?:number}){
 return <group position={[x,deckY,0]} rotation={[rock,0,0]}>
  <mesh position={[0,.67,0]} castShadow receiveShadow><boxGeometry args={[4.35,.72,1.92]}/><meshStandardMaterial color={color} roughness={.74}/></mesh>
  <mesh position={[-.12,1.2,0]} castShadow><boxGeometry args={[2.45,.56,1.62]}/><meshStandardMaterial color={color} roughness={.7}/></mesh>
  <mesh position={[-.12,1.22,0]}><boxGeometry args={[2.25,.4,1.66]}/><meshStandardMaterial color="#424744" roughness={.4}/></mesh>
  {[-1,1].flatMap(side=>[-1.35,1.35].map(axle=><Wheel key={`${side}-${axle}`} position={[axle,.35,side*.98]} radius={.34}/>))}
  <mesh position={[1.9,.55,.72]}><boxGeometry args={[.12,.18,.08]}/><meshStandardMaterial color="#e5c28a" emissive="#a74b22" emissiveIntensity={.18}/></mesh>
  <mesh position={[1.9,.55,-.72]}><boxGeometry args={[.12,.18,.08]}/><meshStandardMaterial color="#e5c28a" emissive="#a74b22" emissiveIntensity={.18}/></mesh>
 </group>;
}

function CarrierTruck(){
 const lowerDeck=1.25,upperDeck=CARRIER_PLATFORM_HEIGHT;
 const uprights=[-11.7,4.4];
 return <group>
  <group>
   <mesh position={[7.4,1.75,0]} castShadow receiveShadow><boxGeometry args={[4.7,2.9,3.55]}/><meshStandardMaterial color="#e9dfc9" roughness={.78}/></mesh>
   <mesh position={[9.35,1.35,0]} castShadow><boxGeometry args={[1.45,1.6,3.6]}/><meshStandardMaterial color="#e4d8c0" roughness={.78}/></mesh>
   <mesh position={[7.4,2.28,1.79]}><boxGeometry args={[1.85,1.16,.045]}/><meshStandardMaterial color="#4d5653" roughness={.4}/></mesh>
   <mesh position={[7.4,2.28,-1.79]}><boxGeometry args={[1.85,1.16,.045]}/><meshStandardMaterial color="#4d5653" roughness={.4}/></mesh>
   <mesh position={[9.78,2.12,0]}><boxGeometry args={[.045,1.38,2.8]}/><meshStandardMaterial color="#59615c" roughness={.4}/></mesh>
   <mesh position={[9.81,.92,.98]}><boxGeometry args={[.06,.3,.38]}/><meshStandardMaterial color="#d58a45" emissive="#a44925" emissiveIntensity={.25}/></mesh>
   <mesh position={[9.81,.92,-.98]}><boxGeometry args={[.06,.3,.38]}/><meshStandardMaterial color="#d58a45" emissive="#a44925" emissiveIntensity={.25}/></mesh>
  </group>
  {[6,9].flatMap(x=>[-1,1].map(side=><Wheel key={`cab-${x}-${side}`} position={[x,.69,side*1.78]}/>))}
  {[...uprights.flatMap(x=>[-1,1].map(side=>[x,side] as const))].map(([x,side])=><group key={`frame-${x}-${side}`}>
   <mesh position={[x,2.48,side*1.96]} castShadow><boxGeometry args={[.22,4.55,.22]}/><meshStandardMaterial color="#b95d32" metalness={.26} roughness={.65}/></mesh>
  </group>)}
  <mesh position={[-3.65,lowerDeck,0]} castShadow receiveShadow><boxGeometry args={[CARRIER_LENGTH,.24,CARRIER_WIDTH]}/><meshStandardMaterial color="#55534d" metalness={.42} roughness={.7}/></mesh>
  <mesh position={[-3.65,upperDeck,0]} castShadow receiveShadow><boxGeometry args={[CARRIER_LENGTH,.2,CARRIER_WIDTH]}/><meshStandardMaterial color="#b95d32" metalness={.35} roughness={.68}/></mesh>
  {[-11.15,3.85].flatMap(x=>[-1,1].map(side=><mesh key={`post-${x}-${side}`} position={[x,2.42,side*1.8]} castShadow><boxGeometry args={[.22,2.2,.22]}/><meshStandardMaterial color="#b95d32" metalness={.3} roughness={.64}/></mesh>))}
  {[-11.15,3.85].flatMap(x=>[-1,1].map(side=><Beam key={`brace-${x}-${side}`} start={[x,1.42,side*1.8]} end={[x+1.5,3.48,side*1.8]} thickness={.16} color="#a9512d"/>))}
  {[-1.8,1.45].flatMap(x=>[-1,1].map(side=><Wheel key={`trailer-${x}-${side}`} position={[x,.72,side*2.08]}/>))}
  <CarrierSedan x={-2.7} deckY={lowerDeck} color="#737777"/>
  <CarrierSedan x={-2.7} deckY={upperDeck} color="#aaa79d"/>
  <CarrierSedan x={-9.2} deckY={lowerDeck} color="#928f87"/>
 </group>;
}

function Roadside({time}:{time:number}){
 const poleOffset=(time*5.2)%POLE_SPACING;
 const poles=[-24,-8,8,24].map(x=>{
  let position=x-poleOffset;
  if(position< -32)position+=POLE_SPAN;
  return position;
 });
 return <>
  {poles.map(x=><group key={`pole-${x}`} position={[x,0,-10.4]}>
   <mesh position={[0,4.1,0]} castShadow><boxGeometry args={[.28,8.2,.28]}/><meshStandardMaterial color="#694b32" roughness={.95}/></mesh>
   <mesh position={[0,8.05,1.1]} castShadow><boxGeometry args={[.3,.24,2.5]}/><meshStandardMaterial color="#705035" roughness={.95}/></mesh>
   {[-.7,.1,.9].map(offset=><mesh key={offset} position={[0,8.25,1.1+offset]}><cylinderGeometry args={[.09,.09,.16,6]}/><meshStandardMaterial color="#c8c0a9"/></mesh>)}
  </group>)}
  <Beam start={[-32,8.3,-9.6]} end={[32,8.3,-9.6]} thickness={.035} color="#36322a"/>
  <Beam start={[-32,8.65,-9.2]} end={[32,8.65,-9.2]} thickness={.035} color="#36322a"/>
 </>;
}

export function CarrierEscape({time}:{time:number}){
 const roadster=carrierEscape.evaluate(time),padVapor=Math.max(0,Math.min(1,(time-5)/.5))*(1-Math.max(0,Math.min(1,(time-8)/1.5)));
 return <group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.16,0]} receiveShadow><planeGeometry args={[130,100]}/><meshStandardMaterial color="#bfa071" roughness={1}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.08,0]} receiveShadow><planeGeometry args={[120,9.5]}/><meshStandardMaterial color="#59574c" roughness={.94}/></mesh>
  {[-1,1].map(side=><mesh key={`shoulder-${side}`} position={[0,-.025,side*5.25]} receiveShadow><boxGeometry args={[120,.12,.7]}/><meshStandardMaterial color="#d2c19e" roughness={.95}/></mesh>)}
  {Array.from({length:11},(_,index)=>{
   let x=-50+index*10-(time*5.2)%10;
   if(x< -60)x+=110;
   return <mesh key={`dash-${index}`} position={[x,.005,0]}><boxGeometry args={[4.1,.035,.16]}/><meshBasicMaterial color="#e1d6b7"/></mesh>;
  })}
  {DESERT_HILLS.map(([x,z,width,height])=><mesh key={`hill-${x}`} position={[x,height*.31,z]} rotation={[0,(x+z)*.03,0]} castShadow receiveShadow><coneGeometry args={[width,height,6,2]}/><meshStandardMaterial color="#b99870" flatShading roughness={1}/></mesh>)}
  {DESERT_BUSHES.map(([x,z,size])=>{
   let movingX=x-(time*1.2)%70;
   if(movingX< -36)movingX+=70;
   return <group key={`bush-${x}`} position={[movingX,0,z]}>
    <mesh position={[0,size*.38,0]} castShadow><dodecahedronGeometry args={[size,0]}/><meshStandardMaterial color="#727850" flatShading roughness={1}/></mesh>
    <mesh position={[size*.65,size*.28,.2]}><dodecahedronGeometry args={[size*.58,0]}/><meshStandardMaterial color="#85865a" flatShading roughness={1}/></mesh>
   </group>;
  })}
  <Roadside time={time}/>
  <CarrierTruck/>
  <CarrierSedan x={-9.2} deckY={CARRIER_PLATFORM_HEIGHT} color="#aaa79d" rock={time<12?0:.035*Math.sin((time-12)*Math.PI*2)*Math.exp(-(time-12)*1.5)}/>
  {[1,-1].map(side=><mesh key={`tail-${side}`} position={[roadster.position[0]-2.35,roadster.position[1]+.17,roadster.position[2]+side*.58]}><boxGeometry args={[.16,.13,.12]}/><meshStandardMaterial color={time>=3.2?'#fa3e2e':'#8c3129'} emissive={time>=3.2?'#e02c1f':'#33110d'} emissiveIntensity={time>=3.2?2.2:.3}/></mesh>)}
  <group position={[CARRIER_ESCAPE_START_X,CARRIER_PLATFORM_HEIGHT+.16,0]}>
   {[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,z])=><mesh key={`${x}-${z}`} position={[x*.62,0,z*.58]} visible={padVapor>.01}><cylinderGeometry args={[.12,.18,.2,8]}/><meshStandardMaterial color="#34332f" metalness={.55} roughness={.5}/></mesh>)}
  </group>
  <group visible={time>=5} position={[CARRIER_ESCAPE_START_X,CARRIER_PLATFORM_HEIGHT,ROADSTER_SLOT_Z]}>
   <mesh position={[0,.035,0]}><boxGeometry args={[5.4,.07,2.55]}/><meshStandardMaterial color="#4d4a43" roughness={.8}/></mesh>
  </group>
 </group>;
}

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { SONG_SKIP_BUS, SONG_SKIP_TRAFFIC, songNotesAt, songSkip } from './scenario';

const BUILDING_COLORS = ['#c5ad88', '#b97858', '#d2bd98', '#c18768'];
const CAR_COLORS = ['#737c50', '#d5c7a6', '#a76548', '#777a78', '#8a8a78'];
const clamp = (value: number) => Math.min(1, Math.max(0, value));

function Buildings() {
 const buildings = useMemo(() => Array.from({ length: 16 }, (_, index) => {
  const row = index < 8 ? -1 : 1, column = index % 8;
  return { x: -30 + column * 8.6, z: row * 17.5, height: 11 + (column * 7 + index * 3) % 7, color: BUILDING_COLORS[index % BUILDING_COLORS.length], side: row };
 }), []);
 const walls = useRef<InstancedMesh>(null), roofs = useRef<InstancedMesh>(null), windows = useRef<InstancedMesh>(null);
 const windowCount = buildings.reduce((count, building) => {
  let windows = 0;
  for (let y = 1.65; y < building.height - .35; y += 2.4) windows += 3;
  return count + windows;
 }, 0);
 useEffect(() => {
  const dummy = new Object3D();
  let windowIndex = 0;
  buildings.forEach(({ x, z, height, color }, index) => {
   dummy.position.set(x, height / 2, z); dummy.updateMatrix(); walls.current?.setMatrixAt(index, dummy.matrix); walls.current?.setColorAt(index, new Color(color));
   dummy.position.set(x, height + .16, z); dummy.updateMatrix(); roofs.current?.setMatrixAt(index, dummy.matrix);
   for (let y = 1.65; y < height - .35; y += 2.4) for (const offset of [-2.6, 0, 2.6]) {
    dummy.position.set(x + offset, y, z - Math.sign(z) * 4.04); dummy.updateMatrix();
    windows.current?.setMatrixAt(windowIndex, dummy.matrix);
    windows.current?.setColorAt(windowIndex, new Color(y % 4 < 2 ? '#657a79' : '#8b8b79'));
    windowIndex++;
   }
  });
  for (const mesh of [walls.current, roofs.current, windows.current]) if (mesh) mesh.instanceMatrix.needsUpdate = true;
  for (const mesh of [walls.current, windows.current]) if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
 }, [buildings]);
 return <>
  <instancedMesh ref={walls} args={[undefined, undefined, buildings.length]} castShadow receiveShadow><boxGeometry args={[8.2, 1, 8]}/><meshStandardMaterial color="#ffffff" roughness={.94}/></instancedMesh>
  <instancedMesh ref={roofs} args={[undefined, undefined, buildings.length]} castShadow><boxGeometry args={[8.5, .32, 8.25]}/><meshStandardMaterial color="#a96246" roughness={.9}/></instancedMesh>
  <instancedMesh ref={windows} args={[undefined, undefined, windowCount]}><boxGeometry args={[1.15, 1.35, .1]}/><meshStandardMaterial color="#ffffff" roughness={.42}/></instancedMesh>
 </>;
}

function CityCar({ position, color }: { position: [number, number, number]; color: string }) {
 return <group position={position}>
  <mesh position={[0, .66, 0]} castShadow receiveShadow><boxGeometry args={[4.2, .72, 1.8]}/><meshStandardMaterial color={color} roughness={.74}/></mesh>
  <mesh position={[-.1, 1.2, 0]} castShadow><boxGeometry args={[2.45, .55, 1.58]}/><meshStandardMaterial color={color} roughness={.7}/></mesh>
  <mesh position={[-.1, 1.22, 0]}><boxGeometry args={[2.25, .38, 1.62]}/><meshStandardMaterial color="#414744" roughness={.4}/></mesh>
  {[-1, 1].flatMap(side => [-1, 1].map(axle => <mesh key={`${side}-${axle}`} position={[axle * 1.3, .34, side * .88]} rotation={[Math.PI / 2, 0, 0]}>
   <cylinderGeometry args={[.34, .34, .22, 10]}/><meshStandardMaterial color="#292a27" roughness={.9}/>
  </mesh>))}
 </group>;
}

function Bus() {
 return <group position={SONG_SKIP_BUS.position}>
  <mesh position={[0, 1.55, 0]} castShadow receiveShadow><boxGeometry args={[9.2, 2.7, 2.45]}/><meshStandardMaterial color="#d5c7a6" roughness={.76}/></mesh>
  {[-3.4, -1.7, 0, 1.7, 3.4].flatMap(x => [-1, 1].map(side => <mesh key={`${x}-${side}`} position={[x, 1.92, side * 1.24]}>
   <boxGeometry args={[1.32, .88, .04]}/><meshStandardMaterial color="#46504c" roughness={.42}/>
  </mesh>))}
  {[-3.4, 0, 3.4].flatMap(x => [-1, 1].map(side => <mesh key={`${x}-${side}`} position={[x, .38, side * 1.05]} rotation={[Math.PI / 2, 0, 0]}>
   <cylinderGeometry args={[.42, .42, .28, 12]}/><meshStandardMaterial color="#292a27" roughness={.9}/>
  </mesh>))}
 </group>;
}

function StreetFurniture() {
 const positions = [-24, -12, 0, 12, 24].flatMap(x => [-1, 1].map(side => [x, side] as const));
 return <>
  {positions.map(([x, side]) => <group key={`tree-${x}-${side}`} position={[x, 0, side * 11.6]}>
   <mesh position={[0, 1.35, 0]} castShadow><cylinderGeometry args={[.18, .24, 2.7, 7]}/><meshStandardMaterial color="#79583b" roughness={1}/></mesh>
   <mesh position={[0, 3.25, 0]} castShadow><dodecahedronGeometry args={[1.55, 0]}/><meshStandardMaterial color={side < 0 ? '#74864e' : '#71804b'} flatShading roughness={1}/></mesh>
  </group>)}
  {[-20, -4, 12, 28].flatMap(x => [-1, 1].map(side => <group key={`lamp-${x}-${side}`} position={[x, 0, side * 10.1]}>
   <mesh position={[0, 2.65, 0]} castShadow><cylinderGeometry args={[.07, .11, 5.3, 7]}/><meshStandardMaterial color="#55544c" roughness={.8}/></mesh>
   <mesh position={[0, 5.3, -.55 * side]}><boxGeometry args={[.13, .13, 1.1]}/><meshStandardMaterial color="#55544c"/></mesh>
   <mesh position={[0, 5.15, -1.1 * side]}><boxGeometry args={[.46, .14, .38]}/><meshStandardMaterial color="#f0dfb8" emissive="#d4aa6b" emissiveIntensity={.5}/></mesh>
  </group>))}
 </>;
}

function MusicalNotes({ time }: { time: number }) {
 const groups = useRef<Array<Group | null>>([]);
 const firstMaterial = useMemo(() => new MeshStandardMaterial({ color: '#f0dfbb', roughness: .48, transparent: true }), []);
 const nextMaterial = useMemo(() => new MeshStandardMaterial({ color: '#a8d7ce', roughness: .48, transparent: true }), []);
 useEffect(() => () => { firstMaterial.dispose(); nextMaterial.dispose(); }, [firstMaterial, nextMaterial]);
 useFrame(() => {
  songNotesAt(time).forEach((note, index) => {
   const group = groups.current[index];
   if (!group) return;
   group.position.set(...note.position);
   group.rotation.z = index % 2 ? -.08 : .08;
   group.visible = note.opacity > .01;
   firstMaterial.opacity = note.color === 'first' ? note.opacity : 0;
   nextMaterial.opacity = note.color === 'next' ? note.opacity : 0;
  });
 });
 return <>
  {Array.from({ length: 6 }, (_, index) => <group key={index} ref={group => { groups.current[index] = group; }}>
   <mesh position={[0, 0, 0]} scale={[.2, .14, .12]} material={firstMaterial}><sphereGeometry args={[1, 8, 6]}/></mesh>
   <mesh position={[.19, .39, 0]} material={firstMaterial}><boxGeometry args={[.08, .78, .08]}/></mesh>
   <mesh position={[.31, .75, 0]} rotation={[0, 0, .28]} material={firstMaterial}><boxGeometry args={[.3, .1, .08]}/></mesh>
   <mesh position={[0, 0, 0]} scale={[.2, .14, .12]} material={nextMaterial}><sphereGeometry args={[1, 8, 6]}/></mesh>
   <mesh position={[.19, .39, 0]} material={nextMaterial}><boxGeometry args={[.08, .78, .08]}/></mesh>
   <mesh position={[.31, .75, 0]} rotation={[0, 0, .28]} material={nextMaterial}><boxGeometry args={[.3, .1, .08]}/></mesh>
  </group>)}
 </>;
}

function ThrusterJets({ time }: { time: number }) {
 const group = useRef<Group>(null);
 useFrame(() => {
  if (!group.current) return;
  const pose = songSkip.evaluate(time);
  const lift = time >= 4 && time < 6.5 ? clamp(Math.min((time - 4) * 4, (6.5 - time) * 1.5)) : 0;
  const brake = time >= 7.8 && time < 9.1 ? clamp(Math.min((time - 7.8) * 5, (9.1 - time) * 2)) * .45 : 0;
  const power = Math.max(lift, brake);
  group.current.position.set(...pose.position);
  group.current.quaternion.set(...pose.quaternion);
  group.current.visible = power > .01;
  group.current.scale.set(1, .35 + power * 1.6, 1);
  group.current.children.forEach(child => {
   const material = (child as Mesh).material as MeshStandardMaterial;
   material.opacity = power * .72;
  });
 });
 return <group ref={group}>
  {[-1, 1].flatMap(x => [-1, 1].map(z => <mesh key={`${x}-${z}`} position={[x * 1.2, -.55, z * .62]} rotation={[Math.PI, 0, 0]}>
   <coneGeometry args={[.2, 1.9, 8]}/><meshStandardMaterial color="#fff4d8" emissive="#e8d2a8" emissiveIntensity={.65} transparent opacity={0} depthWrite={false}/>
  </mesh>))}
 </group>;
}

function VaporRing({ time }: { time: number }) {
 const ring = useRef<Mesh>(null);
 useFrame(() => {
  if (!ring.current) return;
  const age = clamp((time - 4.15) / 2.35);
  ring.current.visible = time >= 4.15 && time <= 6.5;
  ring.current.scale.setScalar(.6 + age * 2.4);
  (ring.current.material as MeshStandardMaterial).opacity = (1 - age) * .52;
 });
 return <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, .08, 0]} visible={false}>
  <torusGeometry args={[1, .11, 6, 48]}/><meshStandardMaterial color="#ddd8cb" transparent opacity={0} depthWrite={false} roughness={1}/>
 </mesh>;
}

export function SongSkipCity({ time }: { time: number }) {
 return <group>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.09, 0]} receiveShadow><planeGeometry args={[84, 20]}/><meshStandardMaterial color="#57574f" roughness={.96}/></mesh>
  {[-1, 1].map(side => <group key={side}>
   <mesh position={[0, .02, side * 10.25]} receiveShadow><boxGeometry args={[84, .16, .38]}/><meshStandardMaterial color="#817d70" roughness={.9}/></mesh>
   <mesh position={[0, .02, side * 12.15]} receiveShadow><boxGeometry args={[84, .15, 3.4]}/><meshStandardMaterial color="#bdb5a2" roughness={.94}/></mesh>
  </group>)}
  {[-2.55, 2.55].flatMap(z => [-34, -26, -18, -10, -2, 6, 14, 22, 30].map(x => <mesh key={`${x}-${z}`} position={[x, .012, z]} rotation={[-Math.PI / 2, 0, 0]}>
   <planeGeometry args={[4.2, .1]}/><meshBasicMaterial color="#d2c8ae"/>
  </mesh>))}
  <Buildings/>
  {SONG_SKIP_TRAFFIC.map((car, index) => <CityCar key={index} position={car.position} color={CAR_COLORS[index % CAR_COLORS.length]}/>)}
  <Bus/>
  <StreetFurniture/>
  <MusicalNotes time={time}/>
  <ThrusterJets time={time}/>
  <VaporRing time={time}/>
 </group>;
}

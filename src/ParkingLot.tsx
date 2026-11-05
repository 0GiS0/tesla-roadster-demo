import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Group, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three';
import { GREY_CAR_FOOTPRINT, PARKING, greyCarPose } from './scenario';

const PARKED_COLORS = ['#8a5b52', '#5f7188', '#b3a47e', '#4f6b5a', '#7d6a88', '#a77f5c', '#6c7a80', '#9a9186'];
const LAMP_X = [-12, -4, 4, 12];
const WALL_Z = -8.4;

function createAsphaltTexture() {
 const canvas = document.createElement('canvas');
 canvas.width = 128;
 canvas.height = 128;
 const context = canvas.getContext('2d');
 if (!context) return null;
 context.fillStyle = '#5d5f63';
 context.fillRect(0, 0, 128, 128);
 let seed = 911;
 const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
 for (let i = 0; i < 5200; i++) {
  const shade = 78 + Math.floor(random() * 70);
  context.fillStyle = `rgba(${shade},${shade},${shade + 2},${.1 + random() * .22})`;
  const size = .3 + random() * 1.4;
  context.fillRect(random() * 128, random() * 128, size, size * .6);
 }
 const texture = new CanvasTexture(canvas);
 texture.wrapS = RepeatWrapping;
 texture.wrapT = RepeatWrapping;
 texture.repeat.set(12, 8);
 texture.colorSpace = SRGBColorSpace;
 return texture;
}

/** Generic box-shaped car: no brands, no plates. Lights are plain emissive materials. */
function BoxCar({ color, length = 4.2, width = 1.8, lights }: { color: string; length?: number; width?: number; lights?: LightMaterials }) {
 const body = Math.max(.9, length * .22);
 const wheelOffsets = [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const;
 const lamp = (x: number, z: number, material: MeshStandardMaterial | undefined, fallback: string, key: string) => (
  <mesh key={key} position={[x, .62, z]}>
   <boxGeometry args={[.12, .22, .38]} />
   {material ? <primitive object={material} attach="material" /> : <meshStandardMaterial color={fallback} />}
  </mesh>
 );
 return <group>
  <mesh position={[0, .62, 0]} castShadow receiveShadow><boxGeometry args={[length, .7, width]} /><meshStandardMaterial color={color} roughness={.62} metalness={.1} /></mesh>
  <mesh position={[-.1, 1.18, 0]} castShadow><boxGeometry args={[length * .55, .5, width * .86]} /><meshStandardMaterial color={color} roughness={.6} metalness={.1} /></mesh>
  <mesh position={[-.1, 1.2, 0]}><boxGeometry args={[length * .5, .38, width * .88]} /><meshStandardMaterial color="#27323b" roughness={.25} /></mesh>
  {wheelOffsets.map(([sx, sz]) => <mesh key={`${sx}${sz}`} position={[sx * length * .31, .33, sz * (width / 2 - .08)]} rotation={[Math.PI / 2, 0, 0]}>
   <cylinderGeometry args={[.33, .33, .26, 12]} /><meshStandardMaterial color="#1b1d20" roughness={.9} />
  </mesh>)}
  {lamp(length / 2, -width * .34, lights?.headlight, '#e8e2cc', 'hl')}
  {lamp(length / 2, width * .34, lights?.headlight, '#e8e2cc', 'hr')}
  {lamp(-length / 2, -width * .34, lights?.tail, '#6e2a2a', 'tl')}
  {lamp(-length / 2, width * .34, lights?.tail, '#6e2a2a', 'tr')}
  {lights && <>
   <mesh position={[length / 2, .62, -width * .5 + .05]}><boxGeometry args={[.14, .14, .12]} /><primitive object={lights.indicator} attach="material" /></mesh>
   <mesh position={[-length / 2, .78, -width * .5 + .05]}><boxGeometry args={[.14, .14, .12]} /><primitive object={lights.indicator} attach="material" /></mesh>
   <mesh position={[-length / 2, .5, width * .3]}><boxGeometry args={[.12, .12, .24]} /><primitive object={lights.reverse} attach="material" /></mesh>
  </>}
 </group>;
}

type LightMaterials = { headlight: MeshStandardMaterial; tail: MeshStandardMaterial; indicator: MeshStandardMaterial; reverse: MeshStandardMaterial };

const lampMaterial = (color: string, emissive: string) => new MeshStandardMaterial({ color, emissive, emissiveIntensity: 0, roughness: .4 });

function GreyCar({ time }: { time: number }) {
 const group = useRef<Group>(null);
 const lights = useMemo<LightMaterials>(() => ({
  headlight: lampMaterial('#e8e2cc', '#fff4c8'),
  tail: lampMaterial('#6e2a2a', '#ff2a1a'),
  indicator: lampMaterial('#8a5a1c', '#ff9a1a'),
  reverse: lampMaterial('#cfcfcf', '#ffffff'),
 }), []);
 useEffect(() => () => { Object.values(lights).forEach(material => material.dispose()); }, [lights]);
 useFrame(() => {
  const state = greyCarPose(time);
  if (group.current) {
   group.current.position.set(...state.position);
   group.current.rotation.set(0, state.yaw, 0);
  }
  lights.tail.emissiveIntensity = state.brake ? 2.4 : 0;
  lights.indicator.emissiveIntensity = state.indicator ? 3 : 0;
  lights.reverse.emissiveIntensity = state.reverse ? 2 : 0;
  lights.headlight.emissiveIntensity = state.headlightFlash ? 3.2 : 0;
 });
 return <group ref={group}><BoxCar color="#7b8087" length={GREY_CAR_FOOTPRINT.length} width={GREY_CAR_FOOTPRINT.width} lights={lights} /></group>;
}

function Lamp({ x }: { x: number }) {
 return <group position={[x, 0, WALL_Z + 1.1]}>
  <mesh position={[0, 2.6, 0]} castShadow><cylinderGeometry args={[.09, .13, 5.2, 8]} /><meshStandardMaterial color="#454a50" roughness={.6} /></mesh>
  <mesh position={[0, 5.15, .55]}><boxGeometry args={[.14, .14, 1.2]} /><meshStandardMaterial color="#454a50" /></mesh>
  <mesh position={[0, 5.05, 1.1]}><boxGeometry args={[.6, .12, .38]} /><meshStandardMaterial color="#fff1c2" emissive="#ffd98a" emissiveIntensity={.9} /></mesh>
 </group>;
}

function Hedge({ x }: { x: number }) {
 return <group position={[x, 0, WALL_Z + .2]}>
  <mesh position={[0, .55, 0]} castShadow><boxGeometry args={[3.6, 1.1, 1.1]} /><meshStandardMaterial color="#56694a" roughness={1} /></mesh>
  <mesh position={[-.7, 1.1, 0]}><sphereGeometry args={[.7, 9, 7]} /><meshStandardMaterial color="#647a52" roughness={1} /></mesh>
  <mesh position={[.8, 1.05, 0]}><sphereGeometry args={[.6, 9, 7]} /><meshStandardMaterial color="#5c7249" roughness={1} /></mesh>
 </group>;
}

export function ParkingLot({ time }: { time: number }) {
 const asphalt = useMemo(createAsphaltTexture, []);
 useEffect(() => () => asphalt?.dispose(), [asphalt]);
 const { bayWidth, bayDepth, aisleWidth, parkedBayX, oppositeRowX, slotX } = PARKING;
 const lineX = useMemo(() => {
  const edges: number[] = [];
  for (let x = -10.5; x <= 10.5; x += bayWidth) edges.push(x);
  return edges;
 }, [bayWidth]);
 const rowZ = -bayDepth / 2;
 const oppositeZ = aisleWidth + bayDepth / 2;
 return <group>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.065, 0]} receiveShadow>
   <planeGeometry args={[90, 60]} /><meshStandardMaterial color="#ffffff" map={asphalt} roughness={.96} />
  </mesh>
  {lineX.map(x => <mesh key={`line-${x}`} position={[x, -.03, rowZ]} rotation={[-Math.PI / 2, 0, 0]}>
   <planeGeometry args={[.13, bayDepth]} /><meshStandardMaterial color="#ece8dc" roughness={.8} />
  </mesh>)}
  {lineX.map(x => <mesh key={`opposite-${x}`} position={[x, -.03, oppositeZ]} rotation={[-Math.PI / 2, 0, 0]}>
   <planeGeometry args={[.13, bayDepth]} /><meshStandardMaterial color="#ece8dc" roughness={.8} />
  </mesh>)}
  <mesh position={[0, -.03, -bayDepth]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[22, .13]} /><meshStandardMaterial color="#ece8dc" roughness={.8} /></mesh>
  {[-6, -2, 2, 6].map(x => <mesh key={`dash-${x}`} position={[x * 1.6, -.03, PARKING.aisleZ]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2, .1]} /><meshStandardMaterial color="#c9c4b4" roughness={.9} /></mesh>)}
  <mesh position={[slotX, -.025, rowZ]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[bayWidth - .2, bayDepth - .2]} /><meshStandardMaterial color="#56585c" roughness={1} transparent opacity={.5} /></mesh>
  <mesh position={[0, .55, WALL_Z - .4]} castShadow receiveShadow><boxGeometry args={[60, 1.1, .6]} /><meshStandardMaterial color="#b5ad9c" roughness={.95} /></mesh>
  <mesh position={[0, 2.2, WALL_Z - 1.6]} receiveShadow><boxGeometry args={[60, 4.4, .6]} /><meshStandardMaterial color="#cbbfa8" roughness={.95} /></mesh>
  {[-15, -6, 3, 12, 21].map(x => <Hedge key={x} x={x} />)}
  {LAMP_X.map(x => <Lamp key={x} x={x} />)}
  {parkedBayX.map((x, i) => <group key={`parked-${x}`} position={[x, 0, rowZ]} rotation={[0, Math.PI / 2, 0]}><BoxCar color={PARKED_COLORS[i]} length={4} width={1.75} /></group>)}
  {oppositeRowX.map((x, i) => <group key={`opposite-car-${x}`} position={[x, 0, oppositeZ]} rotation={[0, -Math.PI / 2, 0]}><BoxCar color={PARKED_COLORS[i + 6]} length={4} width={1.75} /></group>)}
  <GreyCar time={time} />
 </group>;
}

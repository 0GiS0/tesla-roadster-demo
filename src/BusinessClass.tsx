import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, DoubleSide, Group, InstancedMesh, Object3D, Path, Shape } from 'three';

const CLOUD_COUNT = 144;
const CLOUD_SPAN = 150;

function SunsetSky() {
 const sky = useRef<Group>(null);
 useFrame(({ camera }) => {
  if (sky.current) camera.getWorldPosition(sky.current.position);
 });
 return <group ref={sky}>
  <mesh renderOrder={-1000} frustumCulled={false}>
   <sphereGeometry args={[100, 32, 16]} />
   <shaderMaterial side={BackSide} depthWrite={false} fog={false} toneMapped={false}
    vertexShader={`
     varying vec3 direction;
     void main() {
      direction = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
     }
    `}
    fragmentShader={`
     varying vec3 direction;
     void main() {
      vec3 ray = normalize(direction);
      float height = ray.y;
      vec3 horizon = vec3(1.0, 0.67, 0.43);
      vec3 upper = vec3(0.20, 0.38, 0.63);
      vec3 lower = vec3(0.64, 0.53, 0.62);
      vec3 color = mix(horizon, upper, smoothstep(-0.02, 0.28, height));
      color = mix(lower, color, smoothstep(-0.35, -0.02, height));
      float glow = pow(max(dot(ray, normalize(vec3(-0.55, 0.10, -1.0))), 0.0), 16.0);
      color += vec3(0.22, 0.12, 0.05) * glow;
      gl_FragColor = vec4(color, 1.0);
     }
    `} />
  </mesh>
 </group>;
}

function CloudSea({ time }: { time: number }) {
 const clouds = useRef<InstancedMesh>(null);
 const dummy = useMemo(() => new Object3D(), []);
 useFrame(() => {
  const mesh = clouds.current;
  if (!mesh) return;
  for (let i = 0; i < CLOUD_COUNT; i++) {
   const row = Math.floor(i / 12), column = i % 12;
   const offset = ((column * 12.5 + row * 4.7 - time * 2.4) % CLOUD_SPAN + CLOUD_SPAN) % CLOUD_SPAN;
   const variation = Math.sin(i * 42.31);
   dummy.position.set(offset - CLOUD_SPAN / 2, -5.7 + variation * 1.1, 13 - row * 8.5);
   dummy.rotation.set(0, i * 1.7, 0);
   dummy.scale.set(6.5 + (i % 4) * .8, 1.3 + (i % 3) * .3, 4.8 + (i % 5) * .45);
   dummy.updateMatrix();
   mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
 });
 return <>
  <mesh position={[0, -8, -30]} rotation={[-Math.PI / 2, 0, 0]}>
   <planeGeometry args={[200, 150]} /><meshBasicMaterial color="#c6a9b5" fog={false} />
  </mesh>
  <instancedMesh ref={clouds} args={[undefined, undefined, CLOUD_COUNT]} frustumCulled={false}>
   <icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#efd6d2" roughness={1} flatShading fog={false} />
  </instancedMesh>
 </>;
}

function Aircraft() {
 const wing = useMemo(() => new Float32Array([
  -10, .45, 4, -2.7, .45, 4, -4.5, .8, -5,
  -10, .45, 4, -4.5, .8, -5, -7.2, .8, -5,
 ]), []);
 const normals = useMemo(() => new Float32Array([
  0, 1, 0, 0, 1, 0, 0, 1, 0,
  0, 1, 0, 0, 1, 0, 0, 1, 0,
 ]), []);
 const winglet = useMemo(() => new Float32Array([
  -7.2, .8, -5, -4.5, .8, -5, -4.8, 1.4, -5.8,
  -7.2, .8, -5, -4.8, 1.4, -5.8, -6.8, 1.4, -5.8,
 ]), []);
 return <group>
  <mesh position={[-12, -1.05, 7]} rotation={[0, 0, Math.PI / 2]} receiveShadow>
   <cylinderGeometry args={[2, 2, 36, 16]} /><meshStandardMaterial color="#d7ccc4" roughness={.65} metalness={.12} />
  </mesh>
  <mesh receiveShadow>
   <bufferGeometry>
    <bufferAttribute attach="attributes-position" args={[wing, 3]} />
    <bufferAttribute attach="attributes-normal" args={[normals, 3]} />
   </bufferGeometry>
   <meshStandardMaterial color="#e2d9d3" metalness={.28} roughness={.48} side={DoubleSide} />
  </mesh>
  <mesh>
   <bufferGeometry><bufferAttribute attach="attributes-position" args={[winglet, 3]} /></bufferGeometry>
   <meshBasicMaterial color="#eadbd3" side={DoubleSide} />
  </mesh>
  <mesh position={[-4.6, .69, -.3]} rotation={[0, -.2, -.035]}>
   <boxGeometry args={[.035, .025, 8.2]} /><meshBasicMaterial color="#b4a7a5" />
  </mesh>
  <mesh position={[-6.3, .7, -.3]} rotation={[0, -.2, -.035]}>
   <boxGeometry args={[.025, .025, 8.2]} /><meshBasicMaterial color="#c3b4b1" />
  </mesh>
 </group>;
}

function roundedRectangle(path: Path, left: number, bottom: number, right: number, top: number, radius: number) {
 path.moveTo(left + radius, bottom);
 path.lineTo(right - radius, bottom);
 path.quadraticCurveTo(right, bottom, right, bottom + radius);
 path.lineTo(right, top - radius);
 path.quadraticCurveTo(right, top, right - radius, top);
 path.lineTo(left + radius, top);
 path.quadraticCurveTo(left, top, left, top - radius);
 path.lineTo(left, bottom + radius);
 path.quadraticCurveTo(left, bottom, left + radius, bottom);
}

function WindowFrame() {
 const root = useRef<Group>(null);
 const frame = useMemo(() => {
  const shape = new Shape();
  shape.moveTo(-1.1, -1.1); shape.lineTo(1.1, -1.1);
  shape.lineTo(1.1, 1.1); shape.lineTo(-1.1, 1.1); shape.closePath();
  const opening = new Path();
  roundedRectangle(opening, -.91, -.90, .91, .90, .24);
  shape.holes.push(opening);
  return shape;
 }, []);
 const trim = useMemo(() => {
  const shape = new Shape();
  roundedRectangle(shape, -.93, -.92, .93, .92, .25);
  const opening = new Path();
  roundedRectangle(opening, -.91, -.90, .91, .90, .24);
  shape.holes.push(opening);
  return shape;
 }, []);
 useFrame(({ camera }) => {
  if (!root.current) return;
  camera.getWorldPosition(root.current.position);
  camera.getWorldQuaternion(root.current.quaternion);
  root.current.scale.set(1 / camera.projectionMatrix.elements[0], 1 / camera.projectionMatrix.elements[5], 1);
 });
 return <group ref={root}>
  <mesh position={[0, 0, -1]} renderOrder={1000} frustumCulled={false}>
   <shapeGeometry args={[frame]} /><meshBasicMaterial color="#776d70" transparent depthTest={false} depthWrite={false} toneMapped={false} />
  </mesh>
  <mesh position={[0, 0, -.99]} renderOrder={1001} frustumCulled={false}>
   <shapeGeometry args={[trim]} /><meshBasicMaterial color="#d4c1b6" transparent depthTest={false} depthWrite={false} toneMapped={false} />
  </mesh>
 </group>;
}

export function BusinessClass({ time }: { time: number }) {
 return <group>
  <SunsetSky />
  <CloudSea time={time} />
  <Aircraft />
  <WindowFrame />
 </group>;
}

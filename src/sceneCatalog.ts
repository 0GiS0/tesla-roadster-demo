import { potholeFlight, rampFlight } from './scenario';
import type { Scenario } from './scenario';

export interface SceneDefinition {
 key: string;
 hash: string;
 mode: 'original' | 'meme';
 scenario: Scenario;
 environment: 'ramp' | 'pothole';
 camera: {
  desktop: { position: [number, number, number]; target: [number, number, number] };
  portrait: { position: [number, number, number]; target: [number, number, number] };
  fit?: { width: number; height: number; direction: [number, number, number] };
 };
 copy: { label: string; title: string; summary: string };
 source?: { label: string; url: string };
}

export const sceneCatalog: SceneDefinition[] = [
 {
  key: 'ramp-flight',
  hash: '',
  mode: 'original',
  scenario: rampFlight,
  environment: 'ramp',
  camera: {
   desktop: { position: [-23, 16, 29], target: [-2, 6, 0] },
   portrait: { position: [-28, 19, 39], target: [-2, 6, 0] },
  },
  copy: {
   label: 'ORIGINAL',
   title: 'El suelo era solo el principio.',
   summary: 'Una rampa. Un impulso. Otra dimensión.',
  },
 },
 {
  key: 'bache-volador',
  hash: '#meme/bache-volador',
  mode: 'meme',
  scenario: potholeFlight,
  environment: 'pothole',
  camera: {
   desktop: { position: [-25, 16, 39], target: [-2, 2, 0] },
   portrait: { position: [-35, 22, 54], target: [-2, 2, 0] },
   fit: { width: 34, height: 12, direction: [0, .65, 1] },
  },
  copy: {
   label: 'MODO MEME',
   title: 'Bache volador.',
   summary: 'Un charco imposible, un cono y una salida con estilo.',
  },
  source: {
   label: 'Visto en @Sentletse · Ver original en X',
   url: 'https://x.com/Sentletse/status/2111059927531983230',
  },
 },
];

export const defaultScene = sceneCatalog[0];

export function sceneFromHash(hash: string): SceneDefinition {
 return sceneCatalog.find(scene => scene.hash === hash) ?? defaultScene;
}

export function sceneHashFor(scene: SceneDefinition): string {
 return scene.hash;
}

export function buildSceneUrl(origin: string, basePath: string, scene: SceneDefinition, debug = false): string {
 const url = new URL(basePath, origin);
 url.hash = scene.hash;
 if (debug) url.searchParams.set('debug', '1');
 return url.href;
}

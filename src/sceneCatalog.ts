import { parkingSpaceTheft, potholeFlight, rampFlight } from './scenario';
import type { Scenario } from './scenario';

export type SourcePlatform = 'X' | 'TikTok';

export interface SceneSource { author: string; platform: SourcePlatform; url: string }

export interface SceneDefinition {
 key: string;
 hash: string;
 mode: 'original' | 'meme';
 scenario: Scenario;
 environment: 'ramp' | 'pothole' | 'parking';
 camera: {
  desktop: { position: [number, number, number]; target: [number, number, number] };
  portrait: { position: [number, number, number]; target: [number, number, number] };
  fit?: { width: number; height: number; direction: [number, number, number]; target?: [number, number, number] };
 };
 copy: { label: string; title: string; summary: string };
 source?: SceneSource;
}

export function sourceLabel(source: SceneSource): string {
 return `Visto en ${source.author} · Ver original en ${source.platform}`;
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
   author: '@Sentletse',
   platform: 'X',
   url: 'https://x.com/Sentletse/status/2111059927531983230',
  },
 },
 {
  key: 'robo-de-plaza',
  hash: '#meme/robo-de-plaza',
  mode: 'meme',
  scenario: parkingSpaceTheft,
  environment: 'parking',
  camera: {
   desktop: { position: [-22, 14, 30], target: [-2, 2, 0] },
   portrait: { position: [-26, 17, 38], target: [-2, 2, 0] },
   fit: { width: 24, height: 12, direction: [-.3, .5, 1], target: [-3, 2, 0] },
  },
  copy: {
   label: 'MODO MEME',
   title: 'Robo de plaza.',
   summary: 'El último hueco del aparcamiento tiene dueño: baja del cielo con vapor.',
  },
  source: {
   author: '@krishnak3212',
   platform: 'TikTok',
   url: 'https://www.tiktok.com/@krishnak3212/video/7697839711238311182',
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

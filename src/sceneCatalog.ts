import { businessClass, cablesTangle, carrierEscape, parkingSpaceTheft, potholeFlight, rampFlight } from './scenario';
import type { Scenario } from './scenario';

export type SourcePlatform = 'Instagram' | 'X' | 'TikTok' | 'YouTube';

export interface SceneSource { author: string; platform: SourcePlatform; url: string }

export interface SceneDefinition {
 key: string;
 hash: string;
 mode: 'original' | 'meme';
 scenario: Scenario;
 environment: 'ramp' | 'pothole' | 'parking' | 'cables' | 'carrier' | 'business';
 camera: {
  desktop: { position: [number, number, number]; target: [number, number, number] };
  portrait: { position: [number, number, number]; target: [number, number, number] };
  fit?: { width: number; height: number; direction: [number, number, number]; target?: [number, number, number] };
 };
 copy: { label: string; title: string; summary: string };
 timelineLabels?: [string, string, string];
 source?: SceneSource;
 // Key moment shown in the tour video: an instant or a range of the time slider, in seconds.
 tourMoment?: number | { from: number; to: number };
}

export function sourceLabel(source: SceneSource): string {
 return `Visto en ${source.author} · Ver original en ${source.platform}`;
}

export const sceneCatalog: SceneDefinition[] = [
 {
  key: 'ramp-flight',
  hash: '',
  mode: 'original',
  tourMoment: { from: 12.5, to: 17 },
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
  tourMoment: { from: 2.5, to: 6 },
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
 {
  key: 'cables',
  hash: '#meme/cables',
  mode: 'meme',
  scenario: cablesTangle,
  environment: 'cables',
  camera: {
   desktop: { position: [-18, 12, 30], target: [0, 5, 0] },
   portrait: { position: [-6, 18, 38], target: [0, 6, 0] },
  },
  copy: {
   label: 'MODO MEME',
   title: 'Cables.',
   summary: 'El atasco no se mueve. El Roadster tampoco.',
  },
  timelineLabels: ['ATASCO', 'ENREDADO', 'ATRAPADO'],
  source: {
   author: 'MindBodyMillions',
   platform: 'YouTube',
   url: 'https://www.youtube.com/shorts/A3wyacegqCQ',
  },
 },
 {
  key: 'clase-business',
  hash: '#meme/clase-business',
  mode: 'meme',
  scenario: businessClass,
  environment: 'business',
  tourMoment: { from: 4, to: 7 },
  camera: {
   desktop: { position: [0, 5, 20], target: [0, 4, -2] },
   portrait: { position: [0, 5, 32], target: [0, 4, -2] },
  },
  copy: {
   label: 'MODO MEME',
   title: 'Clase business.',
   summary: 'Un vuelo en paralelo, una ventanilla y una estela hacia el horizonte.',
  },
  timelineLabels: ['EN PARALELO', 'VENTANILLA', 'ADELANTAMIENTO'],
  source: {
   author: '@YapayZekaSerisi',
   platform: 'X',
   url: 'https://x.com/YapayZekaSerisi/status/2111104253817155607',
  },
 },
 {
  key: 'fuga-del-portacoches',
  hash: '#meme/fuga-del-portacoches',
  mode: 'meme',
  tourMoment: { from: 5, to: 11 },
  scenario: carrierEscape,
  environment: 'carrier',
  camera: {
   desktop: { position: [-20, 17, 26], target: [-3, 4, 0] },
   portrait: { position: [-26, 22, 34], target: [-3, 4, 0] },
   fit: { width: 43, height: 23, direction: [-.55, .55, 1], target: [-2, 4.5, 0] },
  },
  copy: {
   label: 'MODO MEME',
   title: 'La fuga del portacoches.',
   summary: 'Cinco coches suben al remolque. Solo cuatro llegan a destino.',
  },
  timelineLabels: ['EN RUTA', 'DESPEGUE', 'FUGA'],
  source: {
   author: '@chaseluxuryai',
   platform: 'Instagram',
   url: 'https://www.instagram.com/reel/DelJf20o8HP',
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

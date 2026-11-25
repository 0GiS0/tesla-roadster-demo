import { describe,expect,it } from 'vitest';

// @ts-expect-error Vitest runs in Node, but @types/node is not a direct dependency.
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8') as string;
const publicFile=(name:string)=>new URL(`../public/${name}`,import.meta.url);
const manifest=JSON.parse(readFileSync(publicFile('manifest.webmanifest'),'utf8')) as {
 start_url:string;
 icons:{src:string;sizes:string;type:string}[];
};

function pngSize(name:string){
 const image=readFileSync(publicFile(name));
 expect(image.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
 return [image.readUInt32BE(16),image.readUInt32BE(20)];
}

describe('sharing and app icons',()=>{
 it('declares complete social metadata for the deployed site',()=>{
  const properties:Record<string,string>={
   'og:title':'Roadster — Más allá del asfalto',
   'og:description':'Una recreación interactiva de la maniobra del Roadster: rampa, vuelo y aterrizaje.',
   'og:url':'https://0gis0.github.io/tesla-roadster-demo/',
   'og:type':'website',
   'og:locale':'es_ES',
   'og:image':'https://0gis0.github.io/tesla-roadster-demo/social-preview.png',
   'og:image:width':'1200',
   'og:image:height':'630',
   'og:image:alt':'El Roadster despega junto a una rampa iluminada en una recreación interactiva.',
  };
  for(const [property,content] of Object.entries(properties)){
   expect(html).toContain(`<meta property="${property}" content="${content}"/>`);
  }
  expect(html).toContain('<meta name="twitter:card" content="summary_large_image"/>');
  expect(pngSize('social-preview.png')).toEqual([1200,630]);
 });

 it('links local icons and manifest under the configured base',()=>{
  for(const path of ['favicon.ico','favicon.svg','apple-touch-icon.png','manifest.webmanifest']){
   expect(html).toContain(`href="%BASE_URL%${path}"`);
   expect(readFileSync(publicFile(path)).length).toBeGreaterThan(0);
  }
  const ico=readFileSync(publicFile('favicon.ico'));
  expect([ico.readUInt16LE(2),ico.readUInt16LE(4),ico[6],ico[7]]).toEqual([1,1,32,32]);
  expect(manifest.start_url).toBe('./');
  for(const size of [180,192,512]){
   const icon=manifest.icons.find(entry=>entry.sizes===`${size}x${size}`);
   expect(icon?.type).toBe('image/png');
   expect(pngSize(icon!.src)).toEqual([size,size]);
  }
 });
});

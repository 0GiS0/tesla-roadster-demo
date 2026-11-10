import { describe,expect,it } from 'vitest';

// @ts-expect-error Vitest runs in Node, but @types/node is not a direct dependency.
import { readFileSync } from 'node:fs';

const stylesheet=readFileSync(new URL('./style.css',import.meta.url),'utf8') as string;

function colorFor(selector:string,property='color'){
 let color:string|undefined;
 const propertyPattern=property.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const declarationPattern=new RegExp(`(?:^|;)\\s*${propertyPattern}:\\s*(#[\\da-f]{6})(?:\\s*;|\\s*$)`,'i');
 for(const rule of stylesheet.split('}')){
  const openingBrace=rule.lastIndexOf('{');
  if(openingBrace<0)continue;
  const selectors=rule.slice(0,openingBrace).slice(rule.lastIndexOf('}')+1);
  if(selectors.split(',').some(candidate=>candidate.trim()===selector)){
   color=rule.slice(openingBrace+1).match(declarationPattern)?.[1]??color;
  }
 }
 if(!color)throw new Error(`Missing ${property} for ${selector}`);
 return color;
}

function luminance(color:string){
 const [red,green,blue]=[1,3,5].map(index=>parseInt(color.slice(index,index+2),16)/255);
 const linearize=(channel:number)=>channel<=0.04045?channel/12.92:((channel+0.055)/1.055)**2.4;
 return .2126*linearize(red)+.7152*linearize(green)+.0722*linearize(blue);
}

function contrastRatio(foreground:string,background:string){
 const [lighter,darker]=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);
 return (lighter+0.05)/(darker+0.05);
}

describe('secondary text contrast',()=>{
 it('keeps timeline labels accessible in Original and MEME modes',()=>{
  expect(contrastRatio(colorFor('.timeline-labels'),'#0d1119')).toBeGreaterThanOrEqual(4.5);
 });

 it('keeps the independence notice accessible',()=>{
  expect(contrastRatio(colorFor('.disclaimer>span:first-child'),'#090c13')).toBeGreaterThanOrEqual(4.5);
 });

 it('keeps meme card summaries accessible when selected or hovered',()=>{
  const foreground=colorFor('.meme-mode .scene-select button small');
  for(const selector of [
   '.meme-mode .scene-select button.selected',
   '.meme-mode .scene-select button:hover',
  ]){
   expect(contrastRatio(foreground,colorFor(selector,'background'))).toBeGreaterThanOrEqual(4.5);
  }
 });
});

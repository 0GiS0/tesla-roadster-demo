import { afterEach,describe,it,expect,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const { render }=vi.hoisted(()=>({render:vi.fn()}));
vi.mock('react-dom/client',()=>({createRoot:()=>({render})}));
vi.mock('@react-three/drei',()=>({useProgress:()=>({active:false,progress:100})}));
vi.mock('./Scene',()=>({Scene:()=>null}));
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();render.mockClear()});

async function renderAtHash(hash:string){
 vi.stubGlobal('document',{createElement:()=>({getContext:()=>null}),getElementById:()=>({})});
 const url=new URL('https://example.test/tesla-roadster-demo/');
 url.hash=hash;
 vi.stubGlobal('location',url);
 await import('./main');
 return renderToStaticMarkup(render.mock.calls[0][0]);
}

describe('Share button',()=>{
 it('renders a decorative link icon before the unchanged button label',async()=>{
  const markup=await renderAtHash('#meme/bache-volador');
  const button=markup.match(/<button[^>]*>(<svg[^>]*>.*?<\/svg>)Copiar enlace<\/button>/)?.[1];
  expect(button).toBeDefined();
  for(const attribute of ['width="18"','height="18"','fill="none"','stroke="currentColor"','stroke-width="1.7"','aria-hidden="true"']){
   expect(button).toContain(attribute);
  }
  expect(button).not.toContain('<title');
  expect(button).not.toContain('<circle');
  expect(markup).toContain('class="share-status" role="status"');
 });
});

describe('timeline labels',()=>{
 it('shows Cables-specific labels for its direct link',async()=>{
  const markup=await renderAtHash('#meme/cables');
  expect(markup).toContain('<div class="timeline-labels"><span>ATASCO</span><span>ENREDADO</span><span>ATRAPADO</span></div>');
 });

 it.each([
  ['', 'SUBIDA', 'VUELO', 'ATERRIZAJE'],
  ['#meme/bache-volador', 'APROXIMACIÓN', 'VUELO', 'ATERRIZAJE'],
  ['#meme/robo-de-plaza', 'APROXIMACIÓN', 'VUELO', 'ATERRIZAJE'],
 ])('keeps the existing labels for %s',async(hash,first,second,third)=>{
  const markup=await renderAtHash(hash);
  expect(markup).toContain(`<div class="timeline-labels"><span>${first}</span><span>${second}</span><span>${third}</span></div>`);
 });
});

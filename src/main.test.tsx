import { afterEach,describe,it,expect,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const { render }=vi.hoisted(()=>({render:vi.fn()}));
vi.mock('react-dom/client',()=>({createRoot:()=>({render})}));
vi.mock('@react-three/drei',()=>({useProgress:()=>({active:false,progress:100})}));
vi.mock('./Scene',()=>({Scene:()=>null}));
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();render.mockClear()});

describe('Share button',()=>{
 it('renders a decorative link icon before the unchanged button label',async()=>{
  vi.stubGlobal('document',{createElement:()=>({getContext:()=>null}),getElementById:()=>({})});
  vi.stubGlobal('location',new URL('https://example.test/tesla-roadster-demo/#meme/bache-volador'));
  await import('./main');
  const markup=renderToStaticMarkup(render.mock.calls[0][0]);
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

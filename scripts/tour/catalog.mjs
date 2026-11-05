// Loads the scene catalog (TypeScript) through Vite so the tour always
// reflects src/sceneCatalog.ts without a separate manifest.
import { createServer } from 'vite';

export async function loadCatalog() {
  const server = await createServer({
    root: process.cwd(),
    appType: 'custom',
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true, include: [] },
    logLevel: 'error',
  });
  try {
    const module = await server.ssrLoadModule('/src/sceneCatalog.ts');
    return module.sceneCatalog.map((scene) => ({
      key: scene.key,
      hash: scene.hash,
      mode: scene.mode,
      duration: scene.scenario.duration,
      label: scene.copy.label,
      title: scene.copy.title,
      summary: scene.copy.summary,
      source: scene.source ?? null,
    }));
  } finally {
    await server.close();
  }
}

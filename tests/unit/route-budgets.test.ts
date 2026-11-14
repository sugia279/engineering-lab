import { describe, expect, it } from 'vitest';
import { routeAssets, routeBytes } from '../../scripts/lib/route-budgets.mjs';
describe('route byte budget includes complete lazy graph', () => {
  const manifest = { main: { file: '_astro/main.js', imports: ['shared'], dynamicImports: ['auth'] }, shared: { file: '_astro/shared.js' }, auth: { file: '_astro/auth.js', imports: ['shared'], css: ['_astro/auth.css'] } };
  it('counts dynamic SDK bytes and deduplicates common dependencies', () => {
    const assets = routeAssets('<script src="/hiens-nha/_astro/main.js"></script>', manifest, '/hiens-nha/');
    expect([...assets].sort()).toEqual(['_astro/auth.css', '_astro/auth.js', '_astro/main.js', '_astro/shared.js']);
    expect(routeBytes(assets, (file: string) => file.endsWith('.css') ? 10 : 200000)).toEqual({ js: 600000, css: 10 });
    expect(routeBytes(assets, () => 200001).js).toBeGreaterThan(600000);
  });
  it('fails on missing graph dependencies and untracked JS instead of undercounting', () => {
    expect(() => routeAssets('<script src="/hiens-nha/_astro/main.js"></script>', { main: { ...manifest.main, dynamicImports: ['missing'] } }, '/hiens-nha/')).toThrow();
    expect(() => routeAssets('<script src="/hiens-nha/_astro/unknown.js"></script>', manifest, '/hiens-nha/')).toThrow();
    expect(() => routeBytes(new Set(['missing.js']), () => { throw Error('missing file'); })).toThrow();
  });
});

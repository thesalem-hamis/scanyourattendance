import { beforeEach, describe, expect, it, vi } from 'vitest';

const prepare = vi.hoisted(() => vi.fn());
vi.mock('@yudiel/react-qr-scanner', () => ({ prepareZXingModule: prepare }));
vi.mock('zxing-wasm/reader/zxing_reader.wasm?url', () => ({ default: '/assets/zxing_reader-HASH.wasm' }));

async function loadFresh() {
  vi.resetModules(); // the module remembers whether it already started
  return import('./decoder');
}

describe('preloadDecoder', () => {
  beforeEach(() => prepare.mockReset());

  it('starts fetching the decoder immediately, once, however often it is called', async () => {
    const { preloadDecoder } = await loadFresh();
    preloadDecoder();
    preloadDecoder();
    preloadDecoder();
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(prepare.mock.calls[0][0].fireImmediately).toBe(true);
  });

  it('serves the .wasm from our own site instead of a public CDN', async () => {
    const { preloadDecoder } = await loadFresh();
    preloadDecoder();
    const { locateFile } = prepare.mock.calls[0][0].overrides as {
      locateFile: (path: string, prefix: string) => string;
    };
    expect(locateFile('zxing_reader.wasm', 'https://cdn.example/')).toBe('/assets/zxing_reader-HASH.wasm');
  });

  it('leaves any other file the decoder asks for alone', async () => {
    const { preloadDecoder } = await loadFresh();
    preloadDecoder();
    const { locateFile } = prepare.mock.calls[0][0].overrides as {
      locateFile: (path: string, prefix: string) => string;
    };
    expect(locateFile('other.js', 'https://cdn.example/')).toBe('https://cdn.example/other.js');
  });
});

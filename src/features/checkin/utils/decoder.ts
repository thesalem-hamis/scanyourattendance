import { prepareZXingModule } from '@yudiel/react-qr-scanner';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

let started = false;

/**
 * The QR decoder is a ~400 KB WebAssembly file. By default the library downloads it
 * from a public CDN the first time you scan, which is slow or fails on weak church
 * internet. Instead we serve it from our own site, and start fetching it as soon as
 * the usher screen opens so the first scan is instant. (Phase 8 also caches it offline.)
 */
export function preloadDecoder(): void {
  if (started) return;
  started = true;
  void prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
    },
    fireImmediately: true,
  });
}
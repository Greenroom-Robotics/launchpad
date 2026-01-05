import { sha256sum } from './nodeCrypto.js';
import { versions } from './versions.js';
import { exposeElectronTRPC } from 'electron-trpc-experimental/preload';

process.once('loaded', async () => {
  exposeElectronTRPC();
});

export { sha256sum, versions };

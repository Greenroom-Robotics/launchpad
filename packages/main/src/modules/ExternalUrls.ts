import { singleton, inject } from 'tsyringe';
import { shell } from 'electron';
import { URL } from 'node:url';
import type { IInitializable } from '../interfaces.js';
import { TYPES } from '../types.js';

@singleton()
export class ExternalUrls implements IInitializable {

  readonly #externalUrls: Set<string>;

  constructor(
    @inject(TYPES.ElectronApp) private app: Electron.App,
    externalUrls: Set<string>
  ) {
    this.#externalUrls = externalUrls;
  }

  initialize(): void {
    this.app.on('web-contents-created', (_, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        const { origin } = new URL(url);

        if (this.#externalUrls.has(origin)) {
          shell.openExternal(url).catch(console.error);
        } else if (import.meta.env.DEV) {
          console.warn(`Blocked the opening of a disallowed external origin: ${origin}`);
        }

        // Prevent creating a new window.
        return { action: 'deny' };
      });
    });
  }
}


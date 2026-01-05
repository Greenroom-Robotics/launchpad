import { singleton, inject } from 'tsyringe';
import * as Electron from 'electron';
import { URL } from 'node:url';
import type { IInitializable } from '../interfaces.js';
import { TYPES } from '../types.js';

/**
 * Block navigation to origins not on the allowlist.
 *
 * Navigation exploits are quite common. If an attacker can convince the app to navigate away from its current page,
 * they can possibly force the app to open arbitrary web resources/websites on the web.
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
 */
@singleton()
export class BlockNotAllowedOrigins implements IInitializable {
  readonly #allowedOrigins: Set<string>;

  constructor(
    @inject(TYPES.ElectronApp) private app: Electron.App,
    allowedOrigins: Set<string> = new Set
  ) {
    this.#allowedOrigins = structuredClone(allowedOrigins)
  }

  initialize(): void {
    this.app.on('web-contents-created', (_, contents) => this.applyRule(contents));
  }

  private applyRule(contents: Electron.WebContents): void {

    contents.on('will-navigate', (event, url) => {
      const { origin } = new URL(url);
      if (this.#allowedOrigins.has(origin)) {
        return;
      }

      // Prevent navigation
      event.preventDefault();

      if (import.meta.env.DEV) {
        console.warn(`Blocked navigating to disallowed origin: ${origin}`);
      }
    });
  }
}


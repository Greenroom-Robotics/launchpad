import { singleton } from 'tsyringe';
import electronUpdater, { type AppUpdater, type Logger } from 'electron-updater';
import type { IInitializable } from '../interfaces.js';

type DownloadNotification = Parameters<AppUpdater['checkForUpdatesAndNotify']>[0];

@singleton()
export class AutoUpdater implements IInitializable {
  readonly #logger: Logger | null;
  readonly #notification: DownloadNotification;

  constructor() {
    this.#logger = null;
    this.#notification = undefined;
  }

  async initialize(): Promise<void> {
    await this.runAutoUpdater();
  }

  getAutoUpdater(): AppUpdater {
    // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
    // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
    const { autoUpdater } = electronUpdater;
    return autoUpdater;
  }

  async runAutoUpdater() {
    const updater = this.getAutoUpdater();

    // Set up error handlers to prevent crashes
    updater.on('error', (error) => {
      console.warn('AutoUpdater error (ignored):', error.message);
    });

    try {
      updater.logger = this.#logger || null;
      updater.fullChangelog = true;

      // Skip auto-updates for development channels or when running tests
      if (
        import.meta.env.VITE_DISTRIBUTION_CHANNEL &&
        import.meta.env.VITE_DISTRIBUTION_CHANNEL !== 'release'
      ) {
        console.log('Skipping auto-updater for non-release channel');
        return null;
      }

      if (import.meta.env.VITE_DISTRIBUTION_CHANNEL) {
        updater.channel = import.meta.env.VITE_DISTRIBUTION_CHANNEL;
      }

      return await updater.checkForUpdatesAndNotify(this.#notification);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('No published versions') ||
          error.message.includes('status 404') ||
          error.message.includes('Cannot download')
        ) {
          console.warn('AutoUpdater: No updates available or network error (ignored)');
          return null;
        }
      }

      console.warn('AutoUpdater: Unexpected error (ignored):', error);
      return null;
    }
  }
}

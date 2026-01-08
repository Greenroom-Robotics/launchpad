import { singleton } from 'tsyringe';
import electronUpdater, {
  type AppUpdater,
  type Logger,
  type UpdateInfo,
  type ProgressInfo,
} from 'electron-updater';
import { app } from 'electron';

type DownloadNotification = Parameters<AppUpdater['checkForUpdatesAndNotify']>[0];

@singleton()
export class UpdateService {
  readonly #logger: Logger | null;
  readonly #notification: DownloadNotification;

  constructor() {
    this.#logger = null;
    this.#notification = undefined;

    // Initialize auto-updater immediately
    this.runAutoUpdater();
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

  // Additional update management methods
  async checkForUpdates(): Promise<{ updateInfo?: UpdateInfo } | null> {
    const updater = this.getAutoUpdater();
    try {
      return await updater.checkForUpdates();
    } catch (error) {
      console.error('Error checking for updates:', error);
      throw error;
    }
  }

  async downloadUpdate(): Promise<string[]> {
    const updater = this.getAutoUpdater();
    return updater.downloadUpdate();
  }

  quitAndInstall(isSilent: boolean = false, isForceRunAfter: boolean = false): void {
    const updater = this.getAutoUpdater();
    updater.quitAndInstall(isSilent, isForceRunAfter);
  }

  // Set up event listeners
  onUpdateAvailable(callback: (info: UpdateInfo) => void): void {
    const updater = this.getAutoUpdater();
    updater.on('update-available', callback);
  }

  onUpdateNotAvailable(callback: (info: UpdateInfo) => void): void {
    const updater = this.getAutoUpdater();
    updater.on('update-not-available', callback);
  }

  onUpdateDownloaded(callback: (info: UpdateInfo) => void): void {
    const updater = this.getAutoUpdater();
    updater.on('update-downloaded', callback);
  }

  onDownloadProgress(callback: (progress: ProgressInfo) => void): void {
    const updater = this.getAutoUpdater();
    updater.on('download-progress', callback);
  }

  onError(callback: (error: Error) => void): void {
    const updater = this.getAutoUpdater();
    updater.on('error', callback);
  }

  // Get current version
  getCurrentVersion(): string {
    return app.getVersion();
  }

  // Set update channel
  setChannel(channel: string): void {
    const updater = this.getAutoUpdater();
    updater.channel = channel;
  }

  getChannel(): string {
    const updater = this.getAutoUpdater();
    return updater.channel || 'latest';
  }

  // Configure update behavior
  setAutoDownload(autoDownload: boolean): void {
    const updater = this.getAutoUpdater();
    updater.autoDownload = autoDownload;
  }

  setAutoInstallOnAppQuit(autoInstall: boolean): void {
    const updater = this.getAutoUpdater();
    updater.autoInstallOnAppQuit = autoInstall;
  }
}

import { singleton, inject } from 'tsyringe';
import { app } from 'electron';
import type { IInitializable } from '../interfaces.js';
import { TYPES } from '../types.js';

interface AutoStartOptions {
  enabled?: boolean;
  openAtLogin?: boolean;
  openAsHidden?: boolean;
}

@singleton()
export class AutoStartManager implements IInitializable {
  readonly #options: AutoStartOptions;

  constructor(@inject(TYPES.ElectronApp) private app: Electron.App) {
    this.#options = {
      enabled: true,
      openAtLogin: true,
      openAsHidden: true,
    };
  }

  async initialize(): Promise<void> {
    if (this.#options.enabled) {
      await this.app.whenReady();
      this.setupAutoStart();
    }
  }

  private setupAutoStart(): void {
    if (!this.#options.openAtLogin) {
      return;
    }

    // Configure the app to start at login
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: this.#options.openAsHidden ?? true,
      name: 'Greenroom Launchpad',
      path: process.execPath,
    });

    console.log('AutoStartManager: Configured app to start at login');
  }

  // Method to disable auto-start (can be called from settings)
  disableAutoStart(): void {
    app.setLoginItemSettings({
      openAtLogin: false,
    });
    console.log('AutoStartManager: Disabled auto-start');
  }

  // Method to enable auto-start (can be called from settings)
  enableAutoStart(openAsHidden: boolean = true): void {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: openAsHidden,
      name: 'Greenroom Launchpad',
      path: process.execPath,
    });
    console.log('AutoStartManager: Enabled auto-start');
  }

  // Check current auto-start status
  getAutoStartStatus(): boolean {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  }
}

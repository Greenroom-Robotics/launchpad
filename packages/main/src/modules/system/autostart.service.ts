import { singleton, inject } from 'tsyringe';
import { app } from 'electron';
import { TYPES } from '../../types.js';

interface AutoStartOptions {
  enabled?: boolean;
  openAtLogin?: boolean;
  openAsHidden?: boolean;
}

@singleton()
export class AutoStartService {
  readonly #options: AutoStartOptions;

  constructor(@inject(TYPES.ElectronApp) private app: Electron.App) {
    this.#options = {
      enabled: true,
      openAtLogin: true,
      openAsHidden: true,
    };

    // Initialize auto-start setup
    if (this.#options.enabled) {
      this.initializeAsync();
    }
  }

  private async initializeAsync(): Promise<void> {
    await this.app.whenReady();
    this.setupAutoStart();
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

    console.log('AutoStartService: Configured app to start at login');
  }

  // Method to disable auto-start (can be called from settings)
  disableAutoStart(): void {
    // Check if we're in development
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
      console.log('AutoStartService: Auto-start not available in development mode');
      return;
    }

    app.setLoginItemSettings({
      openAtLogin: false,
    });

    // Verify the setting was applied
    setTimeout(() => {
      const verifySettings = app.getLoginItemSettings();
      console.log(
        'AutoStartService: Verification - login item settings after disable:',
        verifySettings
      );
    }, 100);

    console.log('AutoStartService: Disabled auto-start');
  }

  // Method to enable auto-start (can be called from settings)
  enableAutoStart(openAsHidden: boolean = true): void {
    // Check if we're in development
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
      console.log('AutoStartService: Auto-start not available in development mode');
      return;
    }

    const settings = {
      openAtLogin: true,
      openAsHidden: openAsHidden,
      name: 'Greenroom Launchpad',
      path: process.execPath,
    };

    console.log('AutoStartService: Setting login item with:', settings);
    app.setLoginItemSettings(settings);

    // Verify the setting was applied
    setTimeout(() => {
      const verifySettings = app.getLoginItemSettings();
      console.log(
        'AutoStartService: Verification - login item settings after enable:',
        verifySettings
      );
    }, 100);

    console.log('AutoStartService: Enabled auto-start');
  }

  // Check current auto-start status
  getAutoStartStatus(): boolean {
    // Check if we're in development
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
      console.log(
        'AutoStartService: Auto-start not available in development mode, returning false'
      );
      return false;
    }

    const settings = app.getLoginItemSettings();
    console.log('AutoStartService: Current login item settings:', settings);
    return settings.openAtLogin;
  }
}

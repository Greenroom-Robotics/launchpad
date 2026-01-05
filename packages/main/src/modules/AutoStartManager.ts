import {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {app} from 'electron';

interface AutoStartOptions {
  enabled?: boolean;
  openAtLogin?: boolean;
  openAsHidden?: boolean;
}

class AutoStartManager implements AppModule {
  readonly #options: AutoStartOptions;

  constructor(options: AutoStartOptions = {}) {
    this.#options = {
      enabled: true,
      openAtLogin: true,
      openAsHidden: true,
      ...options
    };
  }

  async enable({app}: ModuleContext): Promise<void> {
    if (this.#options.enabled) {
      await app.whenReady();
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
      path: process.execPath
    });

    console.log('AutoStartManager: Configured app to start at login');
  }

  // Method to disable auto-start (can be called from settings)
  disableAutoStart(): void {
    app.setLoginItemSettings({
      openAtLogin: false
    });
    console.log('AutoStartManager: Disabled auto-start');
  }

  // Method to enable auto-start (can be called from settings)
  enableAutoStart(openAsHidden: boolean = true): void {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: openAsHidden,
      name: 'Greenroom Launchpad',
      path: process.execPath
    });
    console.log('AutoStartManager: Enabled auto-start');
  }

  // Check current auto-start status
  getAutoStartStatus(): boolean {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  }
}

export function createAutoStartManager(options?: AutoStartOptions) {
  return new AutoStartManager(options);
}
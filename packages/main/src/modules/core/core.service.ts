import { singleton, inject } from 'tsyringe';
import { BrowserWindow } from 'electron';
import { TYPES } from '../../types.js';
import type { AppInfo, AppState } from '@app/shared';

@singleton()
export class CoreService {
  constructor(@inject(TYPES.ElectronApp) private app: Electron.App) {
    // Initialize core functionality
  }

  getAppInfo(): AppInfo {
    return {
      name: this.app.getName(),
      version: this.app.getVersion(),
      description: 'Greenroom Launchpad - Application Management Hub',
    };
  }

  getAppState(): AppState {
    const allWindows = BrowserWindow.getAllWindows();
    const visibleWindows = allWindows.filter(
      (window) => window.isVisible() && !window.isDestroyed()
    );

    return {
      isReady: this.app.isReady(),
      windowCount: allWindows.length,
      backgroundMode: allWindows.length > 0 && visibleWindows.length === 0,
    };
  }

  async quitApp(force: boolean = false): Promise<void> {
    if (force) {
      this.app.exit(0);
    } else {
      this.app.quit();
    }
  }

  async restartApp(delay: number = 0): Promise<void> {
    if (delay > 0) {
      setTimeout(() => {
        this.app.relaunch();
        this.app.exit(0);
      }, delay);
    } else {
      this.app.relaunch();
      this.app.exit(0);
    }
  }
}

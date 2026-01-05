import type {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {Tray, Menu, nativeImage, app} from 'electron';
import {WindowManager} from './WindowManager.js';
import {fileURLToPath} from 'node:url';
import {join, dirname} from 'node:path';

export class TrayManager implements AppModule {
  #tray: Tray | null = null;

  async enable({app}: ModuleContext): Promise<void> {
    await app.whenReady();
    this.setupSystemTray();
  }

  private setupSystemTray(): void {
    // Create tray icon path
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const trayIconPath = join(currentDir, '../../../../buildResources/tray-icon-16.png');

    // Create tray icon
    const icon = nativeImage.createFromPath(trayIconPath);
    if (icon.isEmpty()) {
      console.warn('TrayManager: Could not load tray icon, using empty icon');
    }

    this.#tray = new Tray(icon);
    this.#tray.setToolTip('Greenroom Launchpad');

    // Set up context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Launchpad',
        click: () => {
          this.showLaunchpadWindow();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);

    this.#tray.setContextMenu(contextMenu);

    // Handle left-click on tray icon (show/hide launchpad)
    this.#tray.on('click', () => {
      this.showLaunchpadWindow();
    });

    // Handle double-click on tray icon (ensure it shows)
    this.#tray.on('double-click', () => {
      this.showLaunchpadWindow();
    });
  }

  private showLaunchpadWindow(): void {
    const windowManager = WindowManager.getInstance();
    if (windowManager) {
      windowManager.showLaunchpadWindow();
    }
  }

  destroy(): void {
    if (this.#tray) {
      this.#tray.destroy();
      this.#tray = null;
    }
  }
}

export function createTrayManager() {
  return new TrayManager();
}
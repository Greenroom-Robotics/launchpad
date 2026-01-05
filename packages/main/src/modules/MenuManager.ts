import { singleton, inject } from 'tsyringe';
import { Menu, BrowserWindow, MenuItemConstructorOptions } from 'electron';
import { WindowManager, WINDOW_TYPES } from './WindowManager.js';
import type { IInitializable } from '../interfaces.js';
import { TYPES } from '../types.js';

@singleton()
export class MenuManager implements IInitializable {

  constructor(
    @inject(WindowManager) private windowManager: WindowManager,
    @inject(TYPES.ElectronApp) private app: Electron.App
  ) { }

  async initialize(): Promise<void> {
    await this.app.whenReady();
    this.setupApplicationMenu();
  }

  private setupApplicationMenu(): void {
    const template: MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Window',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.createNewWindow();
            }
          },
          { type: 'separator' },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    // On macOS, adjust the menu structure
    if (process.platform === 'darwin') {
      template.unshift({
        label: 'Greenroom Launchpad',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services', submenu: [] },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });

      // macOS Window menu adjustments
      template[4].submenu = [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private createNewWindow(): void {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) {
      this.windowManager.createNewWindow();
      return;
    }

    // Get window metadata to determine window type
    const metadata = this.windowManager.getWindowMetadata(focusedWindow);

    if (!metadata || metadata.type === WINDOW_TYPES.LAUNCHPAD) {
      this.windowManager.createNewWindow();
    } else if (metadata.type === WINDOW_TYPES.APPLICATION) {
      // Create a new application window with the same URL and name
      if (metadata.applicationUrl && metadata.applicationName) {
        this.windowManager.createNewApplicationWindow(metadata.applicationUrl, metadata.applicationName);
      }
    }
  }
}
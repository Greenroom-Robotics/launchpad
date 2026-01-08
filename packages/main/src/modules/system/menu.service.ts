import { singleton, inject } from 'tsyringe';
import { Menu, BrowserWindow } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { WindowService, WINDOW_TYPES } from '../window/window.service.js';
import { TYPES } from '../../types.js';

@singleton()
export class MenuService {
  constructor(
    @inject(WindowService) private windowService: WindowService,
    @inject(TYPES.ElectronApp) private app: Electron.App
  ) {
    // Setup async initialization in constructor
    this.initializeAsync();
  }

  private async initializeAsync(): Promise<void> {
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
            },
          },
          { type: 'separator' },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            role: 'close',
          },
        ],
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
          { role: 'selectAll' },
        ],
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
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [{ role: 'minimize' }, { role: 'close' }],
      },
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
          { role: 'quit' },
        ],
      });

      // macOS Window menu adjustments
      template[4].submenu = [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private createNewWindow(): void {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) {
      this.windowService.createNewWindow();
      return;
    }

    // Get window metadata to determine window type
    const metadata = this.windowService.getWindowMetadata(focusedWindow);

    if (!metadata || metadata.type === WINDOW_TYPES.LAUNCHPAD) {
      this.windowService.createNewWindow();
    } else if (metadata.type === WINDOW_TYPES.APPLICATION) {
      // Create a new application window with the same URL and name
      if (metadata.applicationUrl && metadata.applicationName) {
        this.windowService.createNewApplicationWindow(
          metadata.applicationUrl,
          metadata.applicationName
        );
      }
    }
  }

  // Additional menu management methods
  updateMenu(template: MenuItemConstructorOptions[]): void {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  disableMenu(): void {
    Menu.setApplicationMenu(null);
  }

  getApplicationMenu(): Menu | null {
    return Menu.getApplicationMenu();
  }

  // Method to add custom menu items dynamically
  addMenuItem(position: number, menuItem: MenuItemConstructorOptions): void {
    const currentMenu = Menu.getApplicationMenu();
    if (currentMenu) {
      // This is a simplified implementation
      // In a real app, you might want to rebuild the entire menu structure
      console.log('Adding menu item at position:', position, menuItem.label);
    }
  }

  // Enable/disable specific menu items
  setMenuItemEnabled(menuPath: string, enabled: boolean): void {
    const menu = Menu.getApplicationMenu();
    if (menu) {
      // This would need proper implementation to find and modify specific menu items
      console.log(`Setting menu item ${menuPath} enabled: ${enabled}`);
    }
  }
}

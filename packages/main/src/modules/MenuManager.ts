import type {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {Menu, BrowserWindow} from 'electron';
import {WindowManager, WINDOW_TYPES} from './WindowManager.js';

export class MenuManager implements AppModule {

  async enable({app}: ModuleContext): Promise<void> {
    await app.whenReady();
    this.setupApplicationMenu();
  }

  private setupApplicationMenu(): void {
    const template = [
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
          { role: 'selectall' }
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
      (template[4] as any).submenu = [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ];
    }

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }

  private createNewWindow(): void {
    const windowManager = WindowManager.getInstance();
    if (!windowManager) {
      console.error('Menu: WindowManager not available');
      return;
    }

    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) {
      console.log('Menu: No focused window, creating new Launchpad window');
      windowManager.createNewWindow();
      return;
    }

    // Get window metadata to determine window type
    const metadata = windowManager.getWindowMetadata(focusedWindow);
    console.log('Menu: Window metadata:', metadata);
    console.log('Menu: Window title:', focusedWindow.getTitle());

    if (!metadata || metadata.type === WINDOW_TYPES.LAUNCHPAD) {
      console.log('Menu: Creating new Launchpad window');
      windowManager.createNewWindow();
    } else if (metadata.type === WINDOW_TYPES.APPLICATION) {
      console.log('Menu: Creating new application window:', metadata);
      // Create a new application window with the same URL and name
      if (metadata.applicationUrl && metadata.applicationName) {
        windowManager.createNewApplicationWindow(metadata.applicationUrl, metadata.applicationName)
          .then(() => console.log('Menu: Application window created successfully'))
          .catch(err => console.error('Menu: Error creating application window:', err));
      } else {
        console.error('Menu: Missing application URL or name in metadata');
      }
    }
  }
}

export function createMenuManager() {
  return new MenuManager();
}
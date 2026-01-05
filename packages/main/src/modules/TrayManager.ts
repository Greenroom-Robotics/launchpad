import { singleton, inject } from 'tsyringe';
import { Tray, Menu, nativeImage, app } from 'electron';
import { WindowManager } from './WindowManager.js';
import type { IInitializable } from '../interfaces.js';
import { TYPES } from '../types.js';

@singleton()
export class TrayManager implements IInitializable {
  #tray: Tray | null = null;

  constructor(
    @inject(WindowManager) private windowManager: WindowManager,
    @inject(TYPES.ElectronApp) private app: Electron.App
  ) { }

  async initialize(): Promise<void> {
    await this.app.whenReady();
    this.setupSystemTray();
  }

  private setupSystemTray(): void {
    // Create tray icon from embedded base64 data (cross-platform reliable)
    const iconDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACaUlEQVR4AXXB32vVdRzH8efrfdZQmM2dtiSItIN4GLKdmgjSjTG7iaLMQLoo88YNRsEqifoDpF83gt2cOSzKBkUlYlBUKy8HSZrIvsdIXdgPxLWNLHfMz/f97gRCp2/1eIii57fUMI1gGsaoIAniAnlMk0edV2a+oY24QeObV4RpP9IeTA2M95EyDMjZQPJHSF5T8gn+8Gfi4MllWkSLxjatxPQxplpIT/HDr1N80Ajajd+Dms1HaeZ1ruVnaPr9cWR2uUSLhm57HbgP4l4OnPiMbJ5/mbkIJ37OVO07pt+vv6ir6Y44v/BRSbtrdwETOKNR//pT/ofGN5fZcnsX3Z3f6+Jvc6R4SZXy0Q48RggaWPNt/oPGhh7EbB95DMognPNeXb3PZhdn8RjpIMU2FO/FO42gQHvu3kXiTeSHKek5giTiYW6yiViz8hddWt7WQfJ1SBkF2jXYRfL9SK/GoVMv8LfjGtv0I70rXmPxWo+RApIHRR7DpFhF8pcpuu518nBu7sSUfE7JN1CUopfkV+Kt00sUxMGTV8hjKTptzkj+JSm22wNV/iF5Rooe7dy4kQI9MbiK5N2UbNrIfZLca3jsoF0wQ/KvSDGpHf09tPN4jOQGUS/FuYWftK5cIXhW68vH4tzCPH/JLmPV3mlFjIL2qr9vvfpvzTTQtwZniuBwTJ2ZLNGiO1d/jvMQob2qlL9jbXfG3BJxdn5R1VsOyeOSgneJGAA+JMiAx5m9nMQNtrXShTiA9CTiNNIRxFlMYPRj2o40gPFGmJ6Oo42rtIgC21oZAkYRw0hrMQLpAqYvME34J9+eos2flF0XiroPfWwAAAAASUVORK5CYII=';
    const icon = nativeImage.createFromDataURL(iconDataUrl);

    if (icon.isEmpty()) {
      console.warn('TrayManager: Could not create tray icon from embedded data');
    }

    this.#tray = new Tray(icon);
    this.#tray.setToolTip('Greenroom Launchpad');

    // Set up context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Greenroom Launchpad',
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
    this.windowManager.showLaunchpadWindow();
  }

  destroy(): void {
    if (this.#tray) {
      this.#tray.destroy();
      this.#tray = null;
    }
  }
}
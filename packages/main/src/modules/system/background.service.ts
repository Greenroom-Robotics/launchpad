import { singleton, inject } from 'tsyringe';
import { BrowserWindow } from 'electron';
import { TYPES } from '../../types.js';
import { powerSaveBlocker } from 'electron';

@singleton()
export class BackgroundService {
  constructor(@inject(TYPES.ElectronApp) private app: Electron.App) {
    // Setup background operation event handlers immediately
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Instead of quitting when all windows are closed, keep the app running
    this.app.on('window-all-closed', () => {
      // Don't quit the app - let it continue running in the background
      // The app will be accessible via the system tray
      console.log('All windows closed, but keeping app running in background');
    });

    // Handle the case where the app is activated (e.g., clicked on dock icon on macOS)
    this.app.on('activate', () => {
      // If there are no windows, this will be handled by the existing logic in WindowManager
      const visibleWindows = BrowserWindow.getAllWindows().filter(
        (window) => window.isVisible() && !window.isDestroyed()
      );

      if (visibleWindows.length === 0) {
        console.log('App activated with no visible windows - WindowManager will handle this');
      }
    });

    // Handle before-quit event to allow proper cleanup
    this.app.on('before-quit', () => {
      console.log('App is quitting - cleaning up resources');
    });
  }

  // Additional background service methods
  isRunningInBackground(): boolean {
    const allWindows = BrowserWindow.getAllWindows();
    const visibleWindows = allWindows.filter(
      (window) => window.isVisible() && !window.isDestroyed()
    );
    return allWindows.length > 0 && visibleWindows.length === 0;
  }

  getWindowCount(): number {
    return BrowserWindow.getAllWindows().filter((window) => !window.isDestroyed()).length;
  }

  getVisibleWindowCount(): number {
    return BrowserWindow.getAllWindows().filter(
      (window) => window.isVisible() && !window.isDestroyed()
    ).length;
  }

  // Force quit the application
  forceQuit(): void {
    this.app.exit(0);
  }

  // Graceful shutdown
  async gracefulShutdown(): Promise<void> {
    console.log('Starting graceful shutdown...');

    // Close all windows
    const windows = BrowserWindow.getAllWindows();
    for (const window of windows) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }

    // Wait a bit for windows to close
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Quit the app
    this.app.quit();
  }

  // Check if app should quit when all windows are closed
  shouldQuitOnAllWindowsClosed(): boolean {
    // On macOS, apps typically stay open even when all windows are closed
    return process.platform !== 'darwin';
  }

  // Set up power management
  preventSystemSleep(prevent: boolean = true): number | null {
    if (prevent) {
      return powerSaveBlocker.start('prevent-app-suspension');
    }
    return null;
  }

  // Allow system sleep
  allowSystemSleep(blockerId: number): void {
    powerSaveBlocker.stop(blockerId);
  }
}

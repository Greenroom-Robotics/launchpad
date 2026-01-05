import {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {BrowserWindow} from 'electron';

class BackgroundOperationManager implements AppModule {
  enable({app}: ModuleContext): Promise<void> | void {
    // Instead of quitting when all windows are closed, keep the app running
    app.on('window-all-closed', () => {
      // Don't quit the app - let it continue running in the background
      // The app will be accessible via the system tray
      console.log('All windows closed, but keeping app running in background');
    });

    // Handle the case where the app is activated (e.g., clicked on dock icon on macOS)
    app.on('activate', () => {
      // If there are no windows, this will be handled by the existing logic in WindowManager
      const visibleWindows = BrowserWindow.getAllWindows().filter(window =>
        window.isVisible() && !window.isDestroyed()
      );

      if (visibleWindows.length === 0) {
        console.log('App activated with no visible windows - WindowManager will handle this');
      }
    });

    // Handle before-quit event to allow proper cleanup
    app.on('before-quit', () => {
      console.log('App is quitting - cleaning up resources');
    });
  }
}

export function createBackgroundOperationManager(...args: ConstructorParameters<typeof BackgroundOperationManager>) {
  return new BackgroundOperationManager(...args);
}
import 'reflect-metadata';
import { container } from 'tsyringe';
import type { AppInitConfig } from './AppInitConfig.js';
import { setupDI } from './di.js';
import { WindowManager } from './modules/WindowManager.js';
import { ConfigurationManager } from './modules/ConfigurationManager.js';
import { TrayManager } from './modules/TrayManager.js';
import { MenuManager } from './modules/MenuManager.js';
import { AutoStartManager } from './modules/AutoStartManager.js';
import { AutoUpdater } from './modules/AutoUpdater.js';
import { BackgroundOperationManager } from './modules/BackgroundOperationManager.js';
import { HardwareAccelerationModule } from './modules/HardwareAccelerationModule.js';
import { SingleInstanceApp } from './modules/SingleInstanceApp.js';
import { BasicAuthManager } from './modules/BasicAuthManager.js';
import { appRouter } from './trpc/router.js';

export type { AppRouter } from './trpc/router.js';

export async function initApp(initConfig: AppInitConfig) {
  // Setup dependency injection
  setupDI(initConfig);

  // Initialize tRPC - use experimental electron-trpc
  const { createIPCHandler } = await import('electron-trpc-experimental/main');
  createIPCHandler({ router: appRouter });

  // Get the Electron app instance
  const app = container.resolve<Electron.App>('ElectronApp');

  // Ignore SSL certificate errors for offline environment applications
  app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
    // Prevent the default behavior
    event.preventDefault();
    // Accept the certificate regardless of errors
    callback(true);
  });

  // Initialize services that need to run before app is ready
  const singleInstanceApp = container.resolve(SingleInstanceApp);
  singleInstanceApp.initialize();

  const hardwareAcceleration = container.resolve(HardwareAccelerationModule);
  hardwareAcceleration.initialize();

  // Initialize core services (order matters - some depend on others being ready)
  const windowManager = container.resolve(WindowManager);
  await windowManager.initialize();

  const backgroundOperationManager = container.resolve(BackgroundOperationManager);
  backgroundOperationManager.initialize();

  const configurationManager = container.resolve(ConfigurationManager);
  await configurationManager.initialize();

  const basicAuthManager = container.resolve(BasicAuthManager);
  await basicAuthManager.initialize();

  // Connect BasicAuthManager with WindowManager
  basicAuthManager.setWindowManager(windowManager);

  const menuManager = container.resolve(MenuManager);
  await menuManager.initialize();

  const trayManager = container.resolve(TrayManager);
  await trayManager.initialize();

  const autoStartManager = container.resolve(AutoStartManager);
  await autoStartManager.initialize();

  const autoUpdater = container.resolve(AutoUpdater);
  await autoUpdater.initialize();
}

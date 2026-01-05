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
import { BlockNotAllowedOrigins } from './modules/BlockNotAllowdOrigins.js';
import { ExternalUrls } from './modules/ExternalUrls.js';

export async function initApp(initConfig: AppInitConfig) {
  // Setup DI container with values
  setupDI(initConfig);

  // Create security services with runtime configuration
  const allowedOrigins = new Set(
    initConfig.renderer instanceof URL ? [initConfig.renderer.origin] : []
  );
  const externalUrls = new Set(
    initConfig.renderer instanceof URL
      ? [
        'https://vite.dev',
        'https://developer.mozilla.org',
        'https://solidjs.com',
        'https://qwik.dev',
        'https://lit.dev',
        'https://react.dev',
        'https://preactjs.com',
        'https://www.typescriptlang.org',
        'https://vuejs.org',
      ]
      : []
  );

  // Get the Electron app instance
  const app = container.resolve<Electron.App>('ElectronApp');

  // Register security services manually since they need runtime args
  container.register(BlockNotAllowedOrigins, { useValue: new BlockNotAllowedOrigins(app, allowedOrigins) });
  container.register(ExternalUrls, { useValue: new ExternalUrls(app, externalUrls) });

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

  const menuManager = container.resolve(MenuManager);
  await menuManager.initialize();

  const trayManager = container.resolve(TrayManager);
  await trayManager.initialize();

  const autoStartManager = container.resolve(AutoStartManager);
  await autoStartManager.initialize();

  const autoUpdater = container.resolve(AutoUpdater);
  await autoUpdater.initialize();

  // Initialize security services
  const blockNotAllowedOrigins = container.resolve(BlockNotAllowedOrigins);
  blockNotAllowedOrigins.initialize();

  const externalUrlsService = container.resolve(ExternalUrls);
  externalUrlsService.initialize();
}

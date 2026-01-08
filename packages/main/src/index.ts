import 'reflect-metadata';
import { container } from 'tsyringe';
import type { AppInitConfig } from './AppInitConfig.js';
import { setupDI } from './di.js';
import { AuthModule } from './modules/auth/index.js';
import { ConfigModule } from './modules/config/index.js';
import { WindowModule } from './modules/window/index.js';
import { SystemModule } from './modules/system/index.js';
import { UpdateModule } from './modules/update/index.js';
import { CoreModule } from './modules/core/index.js';
import { AppsModule } from './modules/apps/index.js';
import { appRouter } from './trpc/router.js';

export type { AppRouter } from './trpc/router.js';

export async function initApp(initConfig: AppInitConfig) {
  // Setup dependency injection
  setupDI(initConfig);

  // Register all domain modules
  AuthModule.register();
  ConfigModule.register();
  WindowModule.register();
  SystemModule.register();
  UpdateModule.register();
  CoreModule.register();
  AppsModule.register();

  // Initialize tRPC with new domain-based router
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

  // Services auto-initialize when resolved from container (constructor-based initialization)
  // Order matters for some dependencies

  // System services
  SystemModule.getInstanceService();
  SystemModule.getBackgroundService();

  // System UI services
  SystemModule.getTrayService();
  SystemModule.getMenuService();

  // Auto-start and update services
  SystemModule.getAutoStartService();
  UpdateModule.getService();

  // Config and apps services
  ConfigModule.getService();
  AppsModule.getService();

  // Core application service
  CoreModule.getService();

  console.log('[App] All domain modules initialized successfully');
}

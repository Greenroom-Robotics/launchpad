import { container } from 'tsyringe';
import { TrayService } from './tray.service.js';
import { MenuService } from './menu.service.js';
import { BackgroundService } from './background.service.js';
import { InstanceService } from './instance.service.js';
import { AutoStartService } from './autostart.service.js';
import { systemRouter } from './system.routes.js';

export class SystemModule {
  static register(): void {
    console.log('[SystemModule] Services registered successfully');
  }

  static getRouter(): typeof systemRouter {
    return systemRouter;
  }

  // Helper methods to get service instances
  static getTrayService(): TrayService {
    return container.resolve(TrayService);
  }

  static getMenuService(): MenuService {
    return container.resolve(MenuService);
  }

  static getBackgroundService(): BackgroundService {
    return container.resolve(BackgroundService);
  }

  static getInstanceService(): InstanceService {
    return container.resolve(InstanceService);
  }

  static getAutoStartService(): AutoStartService {
    return container.resolve(AutoStartService);
  }
}

import { container } from 'tsyringe';
import { ConfigStore } from './config.store.js';
import { ConfigService } from './config.service.js';
import { configRouter } from './config.routes.js';

export class ConfigModule {
  static register(): void {
    console.log('[ConfigModule] Services registered successfully');
  }

  static getRouter(): typeof configRouter {
    return configRouter;
  }

  // Helper method to get the config service instance
  static getService(): ConfigService {
    return container.resolve(ConfigService);
  }

  // Helper method to get the config store instance
  static getStore(): ConfigStore {
    return container.resolve(ConfigStore);
  }
}

import { container } from 'tsyringe';
import { CoreService } from './core.service.js';
import { coreRouter } from './core.routes.js';

export class CoreModule {
  static register(): void {
    console.log('[CoreModule] Services registered successfully');
  }

  static getRouter(): typeof coreRouter {
    return coreRouter;
  }

  static getService(): CoreService {
    return container.resolve(CoreService);
  }
}

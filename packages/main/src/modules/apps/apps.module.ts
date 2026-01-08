import { container } from 'tsyringe';
import { AppsService } from './apps.service.js';
import { appsRouter } from './apps.routes.js';

export class AppsModule {
  static register(): void {
    console.log('[AppsModule] Services registered successfully');
  }

  static getRouter(): typeof appsRouter {
    return appsRouter;
  }

  static getService(): AppsService {
    return container.resolve(AppsService);
  }
}

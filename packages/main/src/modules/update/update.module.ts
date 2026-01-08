import { container } from 'tsyringe';
import { UpdateService } from './update.service.js';
import { updateRouter } from './update.routes.js';

export class UpdateModule {
  static register(): void {
    console.log('[UpdateModule] Services registered successfully');
  }

  static getRouter(): typeof updateRouter {
    return updateRouter;
  }

  // Helper method to get the update service instance
  static getService(): UpdateService {
    return container.resolve(UpdateService);
  }
}

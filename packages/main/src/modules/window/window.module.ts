import { container } from 'tsyringe';
import { WindowService } from './window.service.js';
import { windowRouter } from './window.routes.js';

export class WindowModule {
  static register(): void {
    console.log('[WindowModule] Services registered successfully');
  }

  static getRouter(): typeof windowRouter {
    return windowRouter;
  }

  // Helper method to get the window service instance
  static getService(): WindowService {
    return container.resolve(WindowService);
  }
}

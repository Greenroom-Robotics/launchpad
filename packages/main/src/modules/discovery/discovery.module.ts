import { container } from 'tsyringe';
import { DiscoveryService } from './discovery.service.js';
import { discoveryRouter } from './discovery.routes.js';

export class DiscoveryModule {
  static register(): void {
    console.log('[DiscoveryModule] Services registered successfully');
  }

  static getRouter(): typeof discoveryRouter {
    return discoveryRouter;
  }

  static getService(): DiscoveryService {
    return container.resolve(DiscoveryService);
  }
}

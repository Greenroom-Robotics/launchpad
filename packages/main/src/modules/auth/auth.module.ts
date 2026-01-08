import { container } from 'tsyringe';
import { AuthStore } from './auth.store.js';
import { AuthService } from './auth.service.js';
import { authRouter } from './auth.routes.js';

export class AuthModule {
  static register(): void {
    console.log('[AuthModule] Services registered successfully');
  }

  static getRouter(): typeof authRouter {
    return authRouter;
  }

  // Helper method to get the auth service instance
  static getService(): AuthService {
    return container.resolve(AuthService);
  }

  // Helper method to get the auth store instance
  static getStore(): AuthStore {
    return container.resolve(AuthStore);
  }
}

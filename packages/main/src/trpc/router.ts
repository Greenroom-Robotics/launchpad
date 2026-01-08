import { router } from './procedures.js';
import { AuthModule } from '../modules/auth/index.js';
import { ConfigModule } from '../modules/config/index.js';
import { WindowModule } from '../modules/window/index.js';
import { SystemModule } from '../modules/system/index.js';
import { UpdateModule } from '../modules/update/index.js';
import { CoreModule } from '../modules/core/index.js';
import { AppsModule } from '../modules/apps/index.js';

export const appRouter = router({
  auth: AuthModule.getRouter(),
  config: ConfigModule.getRouter(),
  window: WindowModule.getRouter(),
  system: SystemModule.getRouter(),
  update: UpdateModule.getRouter(),
  core: CoreModule.getRouter(),
  apps: AppsModule.getRouter(),
});

export type AppRouter = typeof appRouter;

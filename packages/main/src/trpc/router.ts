import { router } from './procedures.js';
import { configRouter } from './routers/config.js';
import { appRouter as applicationRouter } from './routers/app.js';

export const appRouter = router({
  config: configRouter,
  app: applicationRouter,
});

export type AppRouter = typeof appRouter;

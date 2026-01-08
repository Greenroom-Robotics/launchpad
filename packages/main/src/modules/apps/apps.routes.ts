import { z } from 'zod';
import { router, publicProcedure, injectService } from '../../trpc/procedures.js';
import { AppsService } from './apps.service.js';

export const appsRouter = router({
  launchApp: publicProcedure
    .input(z.object({ appId: z.string(), newWindow: z.boolean().default(false) }))
    .use(injectService<AppsService>(AppsService))
    .mutation(async ({ ctx, input }) => {
      return ctx.service.launchApp(input.appId, input.newWindow);
    }),

  getAppStatus: publicProcedure
    .input(z.string()) // appId
    .use(injectService<AppsService>(AppsService))
    .query(({ ctx, input }) => {
      return ctx.service.getAppStatus(input);
    }),

  getAllAppsStatus: publicProcedure
    .use(injectService<AppsService>(AppsService))
    .query(({ ctx }) => {
      return ctx.service.getAllAppsStatus();
    }),

  checkAppConnectivity: publicProcedure
    .input(z.string()) // appId
    .use(injectService<AppsService>(AppsService))
    .query(async ({ ctx, input }) => {
      return ctx.service.checkAppConnectivity(input);
    }),

  batchConnectivityCheck: publicProcedure
    .input(z.object({ appIds: z.array(z.string()).optional() }))
    .use(injectService<AppsService>(AppsService))
    .query(async ({ ctx, input }) => {
      return ctx.service.batchConnectivityCheck(input.appIds);
    }),

  closeApp: publicProcedure
    .input(z.string()) // appId
    .use(injectService<AppsService>(AppsService))
    .mutation(({ ctx, input }) => {
      const success = ctx.service.closeApp(input);
      return { success };
    }),

  restartApp: publicProcedure
    .input(z.string()) // appId
    .use(injectService<AppsService>(AppsService))
    .mutation(async ({ ctx, input }) => {
      return ctx.service.restartApp(input);
    }),
});

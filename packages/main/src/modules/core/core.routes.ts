import { z } from 'zod';
import { router, publicProcedure, injectService } from '../../trpc/procedures.js';
import { CoreService } from './core.service.js';

export const coreRouter = router({
  getAppInfo: publicProcedure.use(injectService<CoreService>(CoreService)).query(({ ctx }) => {
    return ctx.service.getAppInfo();
  }),

  getAppState: publicProcedure.use(injectService<CoreService>(CoreService)).query(({ ctx }) => {
    return ctx.service.getAppState();
  }),

  quitApp: publicProcedure
    .input(z.object({ force: z.boolean().default(false) }))
    .use(injectService<CoreService>(CoreService))
    .mutation(async ({ ctx, input }) => {
      await ctx.service.quitApp(input.force);
      return { success: true, message: 'App quit initiated' };
    }),

  restartApp: publicProcedure
    .input(z.object({ delay: z.number().default(0) }))
    .use(injectService<CoreService>(CoreService))
    .mutation(async ({ ctx, input }) => {
      await ctx.service.restartApp(input.delay);
      return { success: true, message: 'App restart initiated' };
    }),
});

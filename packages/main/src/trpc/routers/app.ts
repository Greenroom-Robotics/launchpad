import { z } from 'zod';
import { router, publicProcedure, injectService } from '../procedures.js';
import { ConfigurationManager } from '../../modules/ConfigurationManager.js';
import { WindowManager } from '../../modules/WindowManager.js';

export const appRouter = router({
  openApplication: publicProcedure
    .input(z.object({ url: z.string(), name: z.string() }))
    .use(injectService<WindowManager>(WindowManager))
    .mutation(async ({ ctx, input }) => {
      await ctx.service.createApplicationWindow(input.url, input.name);
      return { success: true, url: input.url, name: input.name };
    }),

  checkConnectivity: publicProcedure
    .input(z.string())
    .use(injectService<ConfigurationManager>(ConfigurationManager))
    .query(async ({ ctx, input }) => {
      return ctx.service.checkConnectivity(input);
    }),
});

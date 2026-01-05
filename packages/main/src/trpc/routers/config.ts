import { z } from 'zod';
import { router, publicProcedure, injectService } from '../procedures.js';
import { ConfigurationManager } from '../../modules/ConfigurationManager.js';
import { ApplicationInstanceSchema, LaunchpadConfigSchema } from '@app/shared';

export const configRouter = router({
  getApplications: publicProcedure
    .use(injectService<ConfigurationManager>(ConfigurationManager))
    .query(({ ctx }) => {
      return ctx.service.getApplications();
    }),

  setApplications: publicProcedure
    .input(z.array(ApplicationInstanceSchema))
    .use(injectService<ConfigurationManager>(ConfigurationManager))
    .mutation(({ ctx, input }) => {
      return ctx.service.setApplications(input);
    }),

  getConfig: publicProcedure
    .use(injectService<ConfigurationManager>(ConfigurationManager))
    .query(({ ctx }) => {
      return ctx.service.getConfig();
    }),

  setConfig: publicProcedure
    .input(LaunchpadConfigSchema)
    .use(injectService<ConfigurationManager>(ConfigurationManager))
    .mutation(({ ctx, input }) => {
      return ctx.service.setConfig(input);
    }),

  resetToDefault: publicProcedure
    .use(injectService<ConfigurationManager>(ConfigurationManager))
    .mutation(({ ctx }) => {
      return ctx.service.resetToDefault();
    }),
});

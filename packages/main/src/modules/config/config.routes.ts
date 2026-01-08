import { z } from 'zod';
import { router, publicProcedure, injectService } from '../../trpc/procedures.js';
import { ConfigService } from './config.service.js';
import { ApplicationInstanceSchema, LaunchpadConfigSchema } from '@app/shared';

export const configRouter = router({
  getApplications: publicProcedure
    .use(injectService<ConfigService>(ConfigService))
    .query(({ ctx }) => {
      return ctx.service.getApplications();
    }),

  setApplications: publicProcedure
    .input(z.array(ApplicationInstanceSchema))
    .use(injectService<ConfigService>(ConfigService))
    .mutation(({ ctx, input }) => {
      return ctx.service.setApplications(input);
    }),

  getConfig: publicProcedure.use(injectService<ConfigService>(ConfigService)).query(({ ctx }) => {
    return ctx.service.getConfig();
  }),

  setConfig: publicProcedure
    .input(LaunchpadConfigSchema)
    .use(injectService<ConfigService>(ConfigService))
    .mutation(({ ctx, input }) => {
      return ctx.service.setConfig(input);
    }),

  resetToDefault: publicProcedure
    .use(injectService<ConfigService>(ConfigService))
    .mutation(({ ctx }) => {
      return ctx.service.resetToDefault();
    }),

  checkConnectivity: publicProcedure
    .input(z.string())
    .use(injectService<ConfigService>(ConfigService))
    .query(async ({ ctx, input }) => {
      return ctx.service.checkConnectivity(input);
    }),

  // Additional config management endpoints
  getApplication: publicProcedure
    .input(z.string()) // application ID
    .use(injectService<ConfigService>(ConfigService))
    .query(({ ctx, input }) => {
      return ctx.service.getApplication(input);
    }),

  updateApplication: publicProcedure
    .input(
      z.object({
        id: z.string(),
        updates: ApplicationInstanceSchema.partial(),
      })
    )
    .use(injectService<ConfigService>(ConfigService))
    .mutation(({ ctx, input }) => {
      const success = ctx.service.updateApplication(input.id, input.updates);
      return { success };
    }),

  addApplication: publicProcedure
    .input(ApplicationInstanceSchema)
    .use(injectService<ConfigService>(ConfigService))
    .mutation(({ ctx, input }) => {
      ctx.service.addApplication(input);
      return { success: true };
    }),

  removeApplication: publicProcedure
    .input(z.string()) // application ID
    .use(injectService<ConfigService>(ConfigService))
    .mutation(({ ctx, input }) => {
      const success = ctx.service.removeApplication(input);
      return { success };
    }),

  getEnabledApplications: publicProcedure
    .use(injectService<ConfigService>(ConfigService))
    .query(({ ctx }) => {
      return ctx.service.getEnabledApplications();
    }),

  getApplicationsByType: publicProcedure
    .input(z.enum(['gama', 'lookout', 'marops', 'missim']))
    .use(injectService<ConfigService>(ConfigService))
    .query(({ ctx, input }) => {
      return ctx.service.getApplicationsByType(input);
    }),

  toggleApplicationEnabled: publicProcedure
    .input(z.string()) // application ID
    .use(injectService<ConfigService>(ConfigService))
    .mutation(({ ctx, input }) => {
      const success = ctx.service.toggleApplicationEnabled(input);
      return { success };
    }),

  validateApplicationUrl: publicProcedure
    .input(z.string())
    .use(injectService<ConfigService>(ConfigService))
    .mutation(async ({ ctx, input }) => {
      return ctx.service.validateApplicationUrl(input);
    }),

  batchConnectivityCheck: publicProcedure
    .use(injectService<ConfigService>(ConfigService))
    .query(async ({ ctx }) => {
      return ctx.service.batchConnectivityCheck();
    }),
});

import { router, publicProcedure, injectService } from '../../trpc/procedures.js';
import { DiscoveryService } from './discovery.service.js';

export const discoveryRouter = router({
  getDiscoveredServices: publicProcedure
    .use(injectService<DiscoveryService>(DiscoveryService))
    .query(({ ctx }) => {
      return ctx.service.getDiscoveredServices();
    }),

  getDiscoveredApplications: publicProcedure
    .use(injectService<DiscoveryService>(DiscoveryService))
    .query(({ ctx }) => {
      return ctx.service.getDiscoveredApplications();
    }),

  refresh: publicProcedure
    .use(injectService<DiscoveryService>(DiscoveryService))
    .mutation(({ ctx }) => {
      ctx.service.refresh();
      return { success: true };
    }),
});

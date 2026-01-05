import { initTRPC } from '@trpc/server';
import { container } from 'tsyringe';

const t = initTRPC.create();

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

// Middleware to resolve services from TSyringe container
export const injectService = <T>(serviceToken: any) => {
  return middleware(async ({ next, ctx }) => {
    const service = container.resolve<T>(serviceToken);
    return next({
      ctx: {
        ...ctx,
        service,
      },
    });
  });
};

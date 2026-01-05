import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, injectService } from '../procedures.js';
import { ConfigurationManager } from '../../modules/ConfigurationManager.js';
import { WindowManager } from '../../modules/WindowManager.js';
import { BasicAuthManager } from '../../modules/BasicAuthManager.js';

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

  // Basic Auth management endpoints
  clearStoredCredentials: publicProcedure
    .input(z.object({ url: z.string().optional() }))
    .use(injectService<BasicAuthManager>(BasicAuthManager))
    .mutation(async ({ ctx, input }) => {
      ctx.service.clearStoredCredentials(input.url);
      return {
        success: true,
        message: input.url ? `Cleared credentials for ${input.url}` : 'Cleared all credentials',
      };
    }),

  getStoredAuthHosts: publicProcedure
    .use(injectService<BasicAuthManager>(BasicAuthManager))
    .query(async ({ ctx }) => {
      return { hosts: ctx.service.getAllStoredHosts() };
    }),

  hasStoredCredentials: publicProcedure
    .input(z.string())
    .use(injectService<BasicAuthManager>(BasicAuthManager))
    .query(async ({ ctx, input }) => {
      const credentials = ctx.service.getStoredCredentials(input);
      return { hasCredentials: credentials !== null };
    }),

  // Authentication challenge endpoints
  getChallengeDetails: publicProcedure
    .input(z.string()) // challengeId
    .use(injectService<BasicAuthManager>(BasicAuthManager))
    .query(async ({ ctx, input }) => {
      const details = ctx.service.getChallengeDetails(input);
      if (!details) {
        throw new Error(`Authentication challenge ${input} not found or expired`);
      }
      return details;
    }),

  submitLoginCredentials: publicProcedure
    .input(
      z.object({
        challengeId: z.string(),
        username: z.string(),
        password: z.string(),
        remember: z.boolean().default(true),
      })
    )
    .use(injectService<BasicAuthManager>(BasicAuthManager))
    .mutation(async ({ ctx, input }) => {
      const credentials = {
        username: input.username,
        password: input.password,
        remember: input.remember,
      };

      // This now validates credentials with server before storing
      const success = await ctx.service.resolveChallenge(input.challengeId, credentials);

      if (!success) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials - authentication failed',
        });
      }

      return {
        success: true,
        message: 'Authentication successful',
      };
    }),

  cancelLogin: publicProcedure
    .input(
      z.object({
        challengeId: z.string(),
      })
    )
    .use(injectService<BasicAuthManager>(BasicAuthManager))
    .mutation(async ({ ctx, input }) => {
      const success = ctx.service.resolveChallenge(input.challengeId, null);

      if (!success) {
        throw new Error(`Failed to cancel authentication challenge ${input.challengeId}`);
      }

      return { success: true, message: 'Login cancelled' };
    }),
});

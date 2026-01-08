import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, injectService } from '../../trpc/procedures.js';
import { AuthService } from './auth.service.js';

export const authRouter = router({
  // Basic Auth management endpoints
  clearStoredCredentials: publicProcedure
    .input(z.object({ url: z.string().optional() }))
    .use(injectService<AuthService>(AuthService))
    .mutation(async ({ ctx, input }) => {
      ctx.service.clearStoredCredentials(input.url);
      return {
        success: true,
        message: input.url ? `Cleared credentials for ${input.url}` : 'Cleared all credentials',
      };
    }),

  getStoredAuthHosts: publicProcedure
    .use(injectService<AuthService>(AuthService))
    .query(async ({ ctx }) => {
      return { hosts: ctx.service.getAllStoredHosts() };
    }),

  hasStoredCredentials: publicProcedure
    .input(z.string())
    .use(injectService<AuthService>(AuthService))
    .query(async ({ ctx, input }) => {
      const credentials = ctx.service.getStoredCredentials(input);
      return { hasCredentials: credentials !== null };
    }),

  submitLoginCredentials: publicProcedure
    .input(
      z.object({
        url: z.string(),
        username: z.string(),
        password: z.string(),
        remember: z.boolean().default(true),
      })
    )
    .use(injectService<AuthService>(AuthService))
    .mutation(async ({ ctx, input }) => {
      // First validate the credentials with the server
      const validation = await ctx.service.validateCredentialsWithServer(
        input.url,
        input.username,
        input.password
      );

      if (!validation.valid) {
        // Return validation error to frontend without closing window
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: validation.error || `Invalid credentials`,
        });
      }

      // Credentials are valid, create credentials object
      const credentials = {
        username: input.username,
        password: input.password,
        remember: input.remember,
      };

      // Resolve the login (this will close the window since validation succeeded)
      const success = await ctx.service.resolveLogin(input.url, credentials, true);

      if (!success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resolve login session',
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
        url: z.string(),
      })
    )
    .use(injectService<AuthService>(AuthService))
    .mutation(async ({ ctx, input }) => {
      const success = await ctx.service.resolveLogin(input.url, null);

      if (!success) {
        throw new Error(`Failed to cancel authentication for ${input.url}`);
      }

      return { success: true, message: 'Login cancelled' };
    }),

  // Credential validation endpoint
  validateCredentials: publicProcedure
    .input(
      z.object({
        url: z.string(),
        username: z.string(),
        password: z.string(),
      })
    )
    .use(injectService<AuthService>(AuthService))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.service.validateCredentialsWithServer(
        input.url,
        input.username,
        input.password
      );

      return result;
    }),

  // The createAuthChallenge route has been removed
  // Auth challenges are now handled internally by AuthService.checkAuthAndGetCredentials
});

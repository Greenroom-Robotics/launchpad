import { z } from 'zod';
import { router, publicProcedure, injectService } from '../../trpc/procedures.js';
import { UpdateService } from './update.service.js';

export const updateRouter = router({
  checkForUpdates: publicProcedure
    .use(injectService<UpdateService>(UpdateService))
    .query(async ({ ctx }) => {
      try {
        const result = await ctx.service.checkForUpdates();
        return {
          updateAvailable: !!result?.updateInfo,
          currentVersion: ctx.service.getCurrentVersion(),
          latestVersion: result?.updateInfo?.version || null,
          releaseNotes: result?.updateInfo?.releaseNotes || null,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          updateAvailable: false,
          currentVersion: ctx.service.getCurrentVersion(),
          error: errorMessage,
        };
      }
    }),

  getCurrentVersion: publicProcedure
    .use(injectService<UpdateService>(UpdateService))
    .query(({ ctx }) => {
      return { version: ctx.service.getCurrentVersion() };
    }),

  getChannel: publicProcedure.use(injectService<UpdateService>(UpdateService)).query(({ ctx }) => {
    return { channel: ctx.service.getChannel() };
  }),

  setChannel: publicProcedure
    .input(z.string())
    .use(injectService<UpdateService>(UpdateService))
    .mutation(({ ctx, input }) => {
      ctx.service.setChannel(input);
      return { success: true, channel: input };
    }),

  downloadUpdate: publicProcedure
    .use(injectService<UpdateService>(UpdateService))
    .mutation(async ({ ctx }) => {
      try {
        await ctx.service.downloadUpdate();
        return { success: true, message: 'Update download started' };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to download update: ${errorMessage}`);
      }
    }),

  installUpdate: publicProcedure
    .input(
      z.object({
        isSilent: z.boolean().default(false),
        isForceRunAfter: z.boolean().default(false),
      })
    )
    .use(injectService<UpdateService>(UpdateService))
    .mutation(({ ctx, input }) => {
      ctx.service.quitAndInstall(input.isSilent, input.isForceRunAfter);
      return { success: true, message: 'App will restart to install update' };
    }),

  setAutoDownload: publicProcedure
    .input(z.boolean())
    .use(injectService<UpdateService>(UpdateService))
    .mutation(({ ctx, input }) => {
      ctx.service.setAutoDownload(input);
      return { success: true, autoDownload: input };
    }),

  setAutoInstallOnAppQuit: publicProcedure
    .input(z.boolean())
    .use(injectService<UpdateService>(UpdateService))
    .mutation(({ ctx, input }) => {
      ctx.service.setAutoInstallOnAppQuit(input);
      return { success: true, autoInstallOnAppQuit: input };
    }),

  // Trigger manual update check
  triggerUpdateCheck: publicProcedure
    .use(injectService<UpdateService>(UpdateService))
    .mutation(async ({ ctx }) => {
      try {
        await ctx.service.runAutoUpdater();
        return { success: true, message: 'Update check initiated' };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Update check failed: ${errorMessage}`);
      }
    }),
});

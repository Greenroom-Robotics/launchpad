import { z } from 'zod';
import { router, publicProcedure, injectService } from '../../trpc/procedures.js';
import { TrayService } from './tray.service.js';
import { MenuService } from './menu.service.js';
import { BackgroundService } from './background.service.js';
import { InstanceService } from './instance.service.js';
import { AutoStartService } from './autostart.service.js';

export const systemRouter = router({
  // Tray management
  getTrayStatus: publicProcedure.use(injectService<TrayService>(TrayService)).query(({ ctx }) => {
    return {
      active: ctx.service.isActive(),
    };
  }),

  updateTrayTooltip: publicProcedure
    .input(z.string())
    .use(injectService<TrayService>(TrayService))
    .mutation(({ ctx, input }) => {
      ctx.service.updateTooltip(input);
      return { success: true };
    }),

  displayTrayBalloon: publicProcedure
    .input(z.object({ title: z.string(), content: z.string() }))
    .use(injectService<TrayService>(TrayService))
    .mutation(({ ctx, input }) => {
      ctx.service.displayBalloon(input.title, input.content);
      return { success: true };
    }),

  // Background service management
  getBackgroundStatus: publicProcedure
    .use(injectService<BackgroundService>(BackgroundService))
    .query(({ ctx }) => {
      return {
        runningInBackground: ctx.service.isRunningInBackground(),
        windowCount: ctx.service.getWindowCount(),
        visibleWindowCount: ctx.service.getVisibleWindowCount(),
      };
    }),

  gracefulShutdown: publicProcedure
    .use(injectService<BackgroundService>(BackgroundService))
    .mutation(async ({ ctx }) => {
      await ctx.service.gracefulShutdown();
      return { success: true };
    }),

  forceQuit: publicProcedure
    .use(injectService<BackgroundService>(BackgroundService))
    .mutation(({ ctx }) => {
      ctx.service.forceQuit();
      return { success: true };
    }),

  preventSystemSleep: publicProcedure
    .input(z.boolean().default(true))
    .use(injectService<BackgroundService>(BackgroundService))
    .mutation(({ ctx, input }) => {
      const blockerId = ctx.service.preventSystemSleep(input);
      return { success: true, blockerId };
    }),

  // Instance management
  getInstanceInfo: publicProcedure
    .use(injectService<InstanceService>(InstanceService))
    .query(({ ctx }) => {
      return ctx.service.getInstanceInfo();
    }),

  getCommandLineArgs: publicProcedure
    .use(injectService<InstanceService>(InstanceService))
    .query(({ ctx }) => {
      return {
        args: ctx.service.getCommandLineArgs(),
        workingDirectory: ctx.service.getWorkingDirectory(),
      };
    }),

  // Auto-start management
  getAutoStartStatus: publicProcedure
    .use(injectService<AutoStartService>(AutoStartService))
    .query(({ ctx }) => {
      return { enabled: ctx.service.getAutoStartStatus() };
    }),

  enableAutoStart: publicProcedure
    .input(z.object({ openAsHidden: z.boolean().default(true) }))
    .use(injectService<AutoStartService>(AutoStartService))
    .mutation(({ ctx, input }) => {
      ctx.service.enableAutoStart(input.openAsHidden);
      return { success: true };
    }),

  disableAutoStart: publicProcedure
    .use(injectService<AutoStartService>(AutoStartService))
    .mutation(({ ctx }) => {
      ctx.service.disableAutoStart();
      return { success: true };
    }),

  // Menu management
  disableMenu: publicProcedure.use(injectService<MenuService>(MenuService)).mutation(({ ctx }) => {
    ctx.service.disableMenu();
    return { success: true };
  }),

  hasApplicationMenu: publicProcedure
    .use(injectService<MenuService>(MenuService))
    .query(({ ctx }) => {
      return { hasMenu: ctx.service.getApplicationMenu() !== null };
    }),

  setMenuItemEnabled: publicProcedure
    .input(z.object({ menuPath: z.string(), enabled: z.boolean() }))
    .use(injectService<MenuService>(MenuService))
    .mutation(({ ctx, input }) => {
      ctx.service.setMenuItemEnabled(input.menuPath, input.enabled);
      return { success: true };
    }),

  // System info
  getSystemInfo: publicProcedure.query(() => {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      pid: process.pid,
      uptime: process.uptime(),
    };
  }),
});

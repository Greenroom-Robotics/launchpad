import { z } from 'zod';
import { router, publicProcedure, injectService } from '../../trpc/procedures.js';
import { WindowService } from './window.service.js';
import { BrowserWindow } from 'electron';

export const windowRouter = router({
  openApplication: publicProcedure
    .input(z.object({ url: z.string(), name: z.string() }))
    .use(injectService<WindowService>(WindowService))
    .mutation(async ({ ctx, input }) => {
      await ctx.service.createApplicationWindow(input.url, input.name);
      return { success: true, url: input.url, name: input.name };
    }),

  openNewApplicationWindow: publicProcedure
    .input(z.object({ url: z.string(), name: z.string() }))
    .use(injectService<WindowService>(WindowService))
    .mutation(async ({ ctx, input }) => {
      await ctx.service.createNewApplicationWindow(input.url, input.name);
      return { success: true, url: input.url, name: input.name };
    }),

  closeApplicationWindow: publicProcedure
    .input(z.string()) // application name
    .use(injectService<WindowService>(WindowService))
    .mutation(async ({ ctx, input }) => {
      const success = ctx.service.closeApplicationWindow(input);
      return { success };
    }),

  getApplicationWindow: publicProcedure
    .input(z.string()) // application name
    .use(injectService<WindowService>(WindowService))
    .query(({ ctx, input }) => {
      const window = ctx.service.getApplicationWindow(input);
      return {
        exists: !!window,
        isVisible: window?.isVisible() || false,
        isMinimized: window?.isMinimized() || false,
      };
    }),

  showLaunchpadWindow: publicProcedure
    .use(injectService<WindowService>(WindowService))
    .mutation(({ ctx }) => {
      ctx.service.showLaunchpadWindow();
      return { success: true };
    }),

  createNewWindow: publicProcedure
    .use(injectService<WindowService>(WindowService))
    .mutation(async ({ ctx }) => {
      await ctx.service.createNewWindow();
      return { success: true };
    }),

  restoreOrCreateWindow: publicProcedure
    .input(z.object({ show: z.boolean().default(true) }))
    .use(injectService<WindowService>(WindowService))
    .mutation(async ({ ctx, input }) => {
      await ctx.service.restoreOrCreateWindow(input.show);
      return { success: true };
    }),

  // Get window information
  getAllWindows: publicProcedure
    .use(injectService<WindowService>(WindowService))
    .query(({ ctx: _ctx }) => {
      const allWindows = BrowserWindow.getAllWindows();
      return {
        count: allWindows.length,
        windows: allWindows.map((window: BrowserWindow, index: number) => ({
          id: index,
          title: window.getTitle(),
          isVisible: window.isVisible(),
          isMinimized: window.isMinimized(),
          isMaximized: window.isMaximized(),
          isDestroyed: window.isDestroyed(),
        })),
      };
    }),

  // Focus a window by application name
  focusApplicationWindow: publicProcedure
    .input(z.string()) // application name
    .use(injectService<WindowService>(WindowService))
    .mutation(({ ctx, input }) => {
      const window = ctx.service.getApplicationWindow(input);
      if (window && !window.isDestroyed()) {
        if (window.isMinimized()) {
          window.restore();
        }
        window.show();
        window.focus();
        return { success: true };
      }
      return { success: false };
    }),
});

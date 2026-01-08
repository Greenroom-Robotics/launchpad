import { z } from 'zod';

// Core application schemas
export const AppInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string().optional(),
});

export const AppStateSchema = z.object({
  isReady: z.boolean(),
  windowCount: z.number(),
  backgroundMode: z.boolean(),
});

// Core operation schemas
export const QuitAppRequestSchema = z.object({
  force: z.boolean().default(false),
});

export const QuitAppResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const RestartAppRequestSchema = z.object({
  delay: z.number().default(0),
});

export const RestartAppResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Startup configuration schemas
export const StartupConfigSchema = z.object({
  autoStart: z.boolean(),
  startMinimized: z.boolean(),
  checkForUpdates: z.boolean(),
});

// Type exports
export type AppInfo = z.infer<typeof AppInfoSchema>;
export type AppState = z.infer<typeof AppStateSchema>;
export type QuitAppRequest = z.infer<typeof QuitAppRequestSchema>;
export type QuitAppResponse = z.infer<typeof QuitAppResponseSchema>;
export type RestartAppRequest = z.infer<typeof RestartAppRequestSchema>;
export type RestartAppResponse = z.infer<typeof RestartAppResponseSchema>;
export type StartupConfig = z.infer<typeof StartupConfigSchema>;

import { z } from 'zod';

// System preferences schemas
export const AutoStartOptionsSchema = z.object({
  enabled: z.boolean(),
  openAtLogin: z.boolean(),
  openAsHidden: z.boolean(),
});

export const SystemStatusSchema = z.object({
  autoStartEnabled: z.boolean(),
  trayActive: z.boolean(),
  menuActive: z.boolean(),
});

// System operation schemas
export const SetAutoStartRequestSchema = z.object({
  enabled: z.boolean(),
  openAsHidden: z.boolean().default(true),
});

export const SetAutoStartResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const SystemInfoSchema = z.object({
  platform: z.string(),
  version: z.string(),
  arch: z.string(),
  appVersion: z.string(),
});

// Tray operation schemas
export const TrayActionSchema = z.object({
  action: z.enum(['show', 'hide', 'toggle']),
});

export const TrayActionResponseSchema = z.object({
  success: z.boolean(),
  visible: z.boolean(),
});

// Type exports
export type AutoStartOptions = z.infer<typeof AutoStartOptionsSchema>;
export type SystemStatus = z.infer<typeof SystemStatusSchema>;
export type SetAutoStartRequest = z.infer<typeof SetAutoStartRequestSchema>;
export type SetAutoStartResponse = z.infer<typeof SetAutoStartResponseSchema>;
export type SystemInfo = z.infer<typeof SystemInfoSchema>;
export type TrayAction = z.infer<typeof TrayActionSchema>;
export type TrayActionResponse = z.infer<typeof TrayActionResponseSchema>;

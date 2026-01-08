import { z } from 'zod';

// Update status schemas
export const UpdateStatusSchema = z.object({
  available: z.boolean(),
  version: z.string().optional(),
  releaseDate: z.string().optional(),
  changelog: z.string().optional(),
});

export const UpdateProgressSchema = z.object({
  percent: z.number(),
  bytesPerSecond: z.number().optional(),
  total: z.number().optional(),
  transferred: z.number().optional(),
});

export const UpdateErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});

// Update operation schemas
export const CheckForUpdatesResponseSchema = z.object({
  updateAvailable: z.boolean(),
  currentVersion: z.string(),
  latestVersion: z.string().optional(),
  releaseNotes: z.string().optional(),
});

export const DownloadUpdateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const InstallUpdateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Type exports
export type UpdateStatus = z.infer<typeof UpdateStatusSchema>;
export type UpdateProgress = z.infer<typeof UpdateProgressSchema>;
export type UpdateError = z.infer<typeof UpdateErrorSchema>;
export type CheckForUpdatesResponse = z.infer<typeof CheckForUpdatesResponseSchema>;
export type DownloadUpdateResponse = z.infer<typeof DownloadUpdateResponseSchema>;
export type InstallUpdateResponse = z.infer<typeof InstallUpdateResponseSchema>;

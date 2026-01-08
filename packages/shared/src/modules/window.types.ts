import { z } from 'zod';

// Window type constants
export const WINDOW_TYPES = {
  LAUNCHPAD: 'launchpad',
  APPLICATION: 'application',
} as const;

export type WindowType = (typeof WINDOW_TYPES)[keyof typeof WINDOW_TYPES];

// Window metadata schemas
export const WindowMetadataSchema = z.object({
  type: z.enum(['launchpad', 'application']),
  applicationName: z.string().optional(),
  applicationUrl: z.string().optional(),
});

// Window operation schemas
export const OpenApplicationRequestSchema = z.object({
  url: z.string(),
  name: z.string(),
});

export const OpenApplicationResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  name: z.string(),
});

// Type exports
export type WindowMetadata = z.infer<typeof WindowMetadataSchema>;
export type OpenApplicationRequest = z.infer<typeof OpenApplicationRequestSchema>;
export type OpenApplicationResponse = z.infer<typeof OpenApplicationResponseSchema>;

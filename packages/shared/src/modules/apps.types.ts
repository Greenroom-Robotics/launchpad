import { z } from 'zod';

// Re-export application types from config.types
export { ApplicationInstanceSchema } from './config.types.js';
export type { ApplicationInstance } from './config.types.js';

// App management schemas
export const AppLaunchRequestSchema = z.object({
  appId: z.string(),
  newWindow: z.boolean().default(false),
});

export const AppLaunchResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  windowId: z.string().optional(),
});

export const AppStatusSchema = z.object({
  appId: z.string(),
  name: z.string(),
  status: z.enum(['stopped', 'starting', 'running', 'error']),
  windowCount: z.number(),
  lastAccessed: z.string().optional(),
});

// App discovery schemas
export const DiscoverAppsRequestSchema = z.object({
  baseUrl: z.string().optional(),
  timeout: z.number().default(5000),
});

export const DiscoveredAppSchema = z.object({
  name: z.string(),
  url: z.string(),
  type: z.enum(['gama', 'lookout', 'marops', 'missim']),
  version: z.string().optional(),
  description: z.string().optional(),
});

export const DiscoverAppsResponseSchema = z.object({
  apps: z.array(DiscoveredAppSchema),
  scannedUrls: z.array(z.string()),
});

// App connectivity schemas
export const AppConnectivityRequestSchema = z.object({
  appId: z.string(),
});

export const AppConnectivityResponseSchema = z.object({
  appId: z.string(),
  connected: z.boolean(),
  responseTime: z.number().optional(),
  error: z.string().optional(),
});

// Batch operations schemas
export const BatchConnectivityCheckSchema = z.object({
  appIds: z.array(z.string()),
});

export const BatchConnectivityResponseSchema = z.object({
  results: z.array(AppConnectivityResponseSchema),
});

// Type exports
export type AppLaunchRequest = z.infer<typeof AppLaunchRequestSchema>;
export type AppLaunchResponse = z.infer<typeof AppLaunchResponseSchema>;
export type AppStatus = z.infer<typeof AppStatusSchema>;
export type DiscoverAppsRequest = z.infer<typeof DiscoverAppsRequestSchema>;
export type DiscoveredApp = z.infer<typeof DiscoveredAppSchema>;
export type DiscoverAppsResponse = z.infer<typeof DiscoverAppsResponseSchema>;
export type AppConnectivityRequest = z.infer<typeof AppConnectivityRequestSchema>;
export type AppConnectivityResponse = z.infer<typeof AppConnectivityResponseSchema>;
export type BatchConnectivityCheck = z.infer<typeof BatchConnectivityCheckSchema>;
export type BatchConnectivityResponse = z.infer<typeof BatchConnectivityResponseSchema>;

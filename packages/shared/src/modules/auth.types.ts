import { z } from 'zod';

// Auth credential schemas
export const AuthCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
  remember: z.boolean(),
});

export const StoredCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
  timestamp: z.number(),
});

// Auth response schemas
export const AuthValidationResultSchema = z.object({
  valid: z.boolean(),
  status: z.number().optional(),
  error: z.string().optional(),
});

export const StoredAuthHostsSchema = z.object({
  hosts: z.array(z.string()),
});

export const HasStoredCredentialsSchema = z.object({
  hasCredentials: z.boolean(),
});

export const AuthSuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Type exports
export type AuthCredentials = z.infer<typeof AuthCredentialsSchema>;
export type StoredCredentials = z.infer<typeof StoredCredentialsSchema>;
export type AuthValidationResult = z.infer<typeof AuthValidationResultSchema>;
export type StoredAuthHosts = z.infer<typeof StoredAuthHostsSchema>;
export type HasStoredCredentials = z.infer<typeof HasStoredCredentialsSchema>;
export type AuthSuccessResponse = z.infer<typeof AuthSuccessResponseSchema>;

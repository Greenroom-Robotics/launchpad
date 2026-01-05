import { z } from 'zod';

export const ApplicationInstanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['gama', 'lookout', 'marops', 'missim']),
  url: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
});

export const LaunchpadConfigSchema = z.object({
  applications: z.array(ApplicationInstanceSchema),
});

export type ApplicationInstance = z.infer<typeof ApplicationInstanceSchema>;
export type LaunchpadConfig = z.infer<typeof LaunchpadConfigSchema>;

export const defaultConfig: LaunchpadConfig = {
  applications: [
    {
      id: 'local-gama',
      name: 'Local - GAMA',
      type: 'gama',
      url: 'http://localhost:3000',
      enabled: true,
    },
    {
      id: 'local-lookout',
      name: 'Local - Lookout+',
      type: 'lookout',
      url: 'http://localhost:4000',
      enabled: true,
    },
    {
      id: 'local-marops',
      name: 'Local - MarOps',
      type: 'marops',
      url: 'http://localhost:7000',
      enabled: true,
    },
    {
      id: 'local-missim',
      name: 'Local - MIS-SIM',
      type: 'missim',
      url: 'http://localhost:5000',
      enabled: true,
    },
  ],
};

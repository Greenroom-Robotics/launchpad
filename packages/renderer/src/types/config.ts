import type { RJSFSchema } from '@greenroom-robotics/alpha.schema-form';
import type { ApplicationInstance, LaunchpadConfig } from '@app/shared';
import { defaultConfig } from '@app/shared';

// Extended schema type that supports enumNames
interface ExtendedRJSFSchema extends RJSFSchema {
  enumNames?: string[];
  properties?: Record<string, ExtendedRJSFSchema>;
  items?: ExtendedRJSFSchema;
}

export type { ApplicationInstance, LaunchpadConfig };

export const applicationConfigSchema: ExtendedRJSFSchema = {
  type: 'object',
  properties: {
    applications: {
      type: 'array',
      title: 'Application',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            title: 'ID',
            description: 'Unique identifier for this application instance',
          },
          name: {
            type: 'string',
            title: 'Display Name',
            description: 'Name to show in the launcher',
          },
          type: {
            type: 'string',
            title: 'Application Type',
            enum: ['gama', 'lookout', 'marops', 'missim'],
            enumNames: ['GAMA', 'Lookout+', 'MarOps', 'MIS-SIM'],
          },
          url: {
            type: 'string',
            format: 'uri',
            title: 'URL',
            description: 'Full URL including protocol and port (e.g., http://localhost:3000)',
          },
          description: {
            type: 'string',
            title: 'Description',
            description: 'Optional description for this instance',
          },
          enabled: {
            type: 'boolean',
            title: 'Enabled',
            default: true,
            description: 'Whether this application should be shown in the launcher',
          },
        },
        required: ['id', 'name', 'type', 'url'],
      },
    },
  },
  required: ['applications'],
};

export { defaultConfig };

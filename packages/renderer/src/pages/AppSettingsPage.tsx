import { Box, Text } from 'grommet';
import { SchemaForm } from '@greenroom-robotics/alpha.schema-form';
import { useConfig } from '../hooks/useConfig';
import { useAsyncFn } from 'react-use';
import type { RJSFSchema } from '@greenroom-robotics/alpha.schema-form';
import type { LaunchpadConfig } from '@app/shared';
import { CollapsiblePanel } from '@greenroom-robotics/alpha.ui/build/components';

interface ExtendedRJSFSchema extends RJSFSchema {
  enumNames?: string[];
  properties?: Record<string, ExtendedRJSFSchema>;
  items?: ExtendedRJSFSchema;
}

const applicationConfigSchema: ExtendedRJSFSchema = {
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
          vesselName: {
            type: 'string',
            title: 'Vessel Name',
            description: 'Optional vessel name associated with this application',
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

export const AppSettingsPage = () => {
  const { applications, updateConfig } = useConfig();

  // Use useAsyncFn for form submission with built-in loading/error states
  const [submitState, handleSubmit] = useAsyncFn(
    async (data: LaunchpadConfig) => {
      await updateConfig.mutateAsync(data);
      console.log('Configuration saved successfully');
      return data;
    },
    [updateConfig]
  );

  if (applications.isLoading) {
    return (
      <Box align="center" justify="center" fill>
        <Text>Loading configuration...</Text>
      </Box>
    );
  }

  if (applications.error) {
    return (
      <Box align="center" justify="center" fill>
        <Text color="status-error">Error: {applications.error.message}</Text>
      </Box>
    );
  }

  const currentConfig = { applications: applications.data || [] };
  const { loading: isSaving, error: submitError, value: savedConfig } = submitState;

  return (
    <CollapsiblePanel label="Application Settings" defaultOpen>
      {/* Show save status */}
      {isSaving && (
        <Box pad="small" background="status-unknown" margin={{ bottom: 'small' }}>
          <Text color="white">Saving configuration...</Text>
        </Box>
      )}
      {submitError && (
        <Box pad="small" background="status-error" margin={{ bottom: 'small' }}>
          <Text color="white">Error saving: {submitError.message}</Text>
        </Box>
      )}
      {savedConfig && !isSaving && !submitError && (
        <Box pad="small" background="status-ok" margin={{ bottom: 'small' }}>
          <Text color="white">Configuration saved successfully!</Text>
        </Box>
      )}

      <SchemaForm
        schema={applicationConfigSchema}
        uiSchema={{
          applications: {
            items: {
              'ui:options': {
                numColumns: 3,
                defaultCollapsed: true,
                titleFieldPath: 'id',
              },
            },
          },
        }}
        formData={currentConfig}
        onSubmit={handleSubmit}
        disabled={isSaving}
      />
    </CollapsiblePanel>
  );
};

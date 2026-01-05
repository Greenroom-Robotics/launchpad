import { Box, Text, Button, Heading } from 'grommet';
import { Header } from '../components/layout/Header';
import { SchemaForm } from '@greenroom-robotics/alpha.schema-form';
import { useConfig } from '../hooks/useConfig';
import { useAsyncFn } from 'react-use';
import { trpc } from '../trpc-react';
import type { RJSFSchema } from '@greenroom-robotics/alpha.schema-form';
import type { LaunchpadConfig } from '@app/shared';

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

export const SettingsPage = () => {
  const { applications, updateConfig } = useConfig();

  // Get stored authentication hosts
  const { data: storedHosts, refetch: refetchHosts } = trpc.app.getStoredAuthHosts.useQuery();

  // Clear stored credentials mutation
  const clearCredentials = trpc.app.clearStoredCredentials.useMutation({
    onSuccess: () => {
      refetchHosts();
    },
  });

  // Use useAsyncFn for form submission with built-in loading/error states
  const [submitState, handleSubmit] = useAsyncFn(
    async (data: LaunchpadConfig) => {
      await updateConfig.mutateAsync(data);
      console.log('Configuration saved successfully');
      return data;
    },
    [updateConfig]
  );

  const handleClearAllCredentials = async () => {
    try {
      await clearCredentials.mutateAsync({});
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  };

  if (applications.isLoading) {
    return (
      <Box fill>
        <Header title="Launchpad - Settings" />
        <Box align="center" justify="center" fill>
          <Text>Loading configuration...</Text>
        </Box>
      </Box>
    );
  }

  if (applications.error) {
    return (
      <Box fill>
        <Header title="Launchpad - Settings" />
        <Box align="center" justify="center" fill>
          <Text color="status-error">Error: {applications.error.message}</Text>
        </Box>
      </Box>
    );
  }

  const currentConfig = { applications: applications.data || [] };
  const { loading: isSaving, error: submitError, value: savedConfig } = submitState;

  return (
    <Box fill>
      <Header title="Launchpad - Settings" />
      <Box margin={{ horizontal: 'medium', bottom: 'medium' }} overflow="auto">
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
                  numColumns: 2,
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

        {/* Authentication Management Section */}
        <Box margin={{ top: 'large' }}>
          <Heading level={3}>Authentication Management</Heading>

          <Box margin={{ top: 'medium' }}>
            <Text size="small" margin={{ bottom: 'small' }}>
              Stored authentication credentials for {storedHosts?.hosts?.length || 0} hosts
            </Text>

            {storedHosts?.hosts && storedHosts.hosts.length > 0 && (
              <Box margin={{ bottom: 'medium' }}>
                <Text size="small" weight="bold">
                  Stored credentials for:
                </Text>
                {storedHosts.hosts.map((host) => (
                  <Text key={host} size="small" margin={{ left: 'small' }}>
                    • {host}
                  </Text>
                ))}
              </Box>
            )}

            <Box direction="row" gap="small" align="center">
              <Button
                label="Clear All Stored Credentials"
                color="status-critical"
                onClick={handleClearAllCredentials}
                disabled={clearCredentials.isLoading || !storedHosts?.hosts?.length}
              />
              {clearCredentials.isLoading && <Text size="small">Clearing credentials...</Text>}
              {clearCredentials.isSuccess && (
                <Text size="small" color="status-ok">
                  Credentials cleared successfully
                </Text>
              )}
              {clearCredentials.isError && (
                <Text size="small" color="status-error">
                  Error clearing credentials
                </Text>
              )}
            </Box>

            <Text size="small" margin={{ top: 'small' }} color="text-weak">
              This will remove all saved login credentials. You will need to re-enter them when
              accessing protected applications.
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

import { Box, Text } from 'grommet';
import { Header } from '../components/layout/Header';
import { SchemaForm } from '@greenroom-robotics/alpha.schema-form';
import { applicationConfigSchema } from '../types/config';
import type { LaunchpadConfig } from '../types/config';
import { useConfig } from '../hooks/useConfig';
import { useAsyncFn } from 'react-use';

export const SettingsPage = () => {
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
      </Box>
    </Box>
  );
};

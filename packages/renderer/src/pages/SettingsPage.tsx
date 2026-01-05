
import { Box, Text } from 'grommet'
import { Header } from '../components/layout/Header'
import { SchemaForm } from '@greenroom-robotics/alpha.schema-form'
import { applicationConfigSchema } from '../types/config'
import type { LaunchpadConfig } from '../types/config'
import { useConfig } from '../hooks/useConfig'

export const SettingsPage = () => {
  const { applications, isLoading, error, updateConfig } = useConfig();

  const handleSubmit = async (data: LaunchpadConfig) => {
    try {
      await updateConfig(data);
      console.log("Configuration saved successfully");
    } catch (err) {
      console.error("Failed to save configuration:", err);
    }
  };

  if (isLoading) {
    return (
      <Box fill>
        <Header title="Settings" />
        <Box align="center" justify="center" fill>
          <Text>Loading configuration...</Text>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box fill>
        <Header title="Settings" />
        <Box align="center" justify="center" fill>
          <Text color="status-error">Error: {error}</Text>
        </Box>
      </Box>
    );
  }

  const currentConfig = { applications };

  return (
    <Box fill>
      <Header title="Settings" />
      <Box margin={{ horizontal: "medium", bottom: "medium" }} overflow="auto">
        <SchemaForm
          schema={applicationConfigSchema}
          uiSchema={{
              'applications': {
                'ui:options': {
                  orderable: false,
                },
                'items': {
                  'ui:options': {
                    numColumns: 2,
                    defaultCollapsed: true,
                    titleFieldPath: 'id',
                  },
                },

            }
          }}
          formData={currentConfig}
          onSubmit={handleSubmit}
        />
      </Box>
    </Box>
  )
}

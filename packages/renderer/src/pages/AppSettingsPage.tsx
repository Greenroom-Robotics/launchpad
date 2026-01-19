import { Box, Text, Button, Card } from 'grommet';
import { SchemaForm } from '@greenroom-robotics/alpha.schema-form';
import { useConfig } from '../hooks/useConfig';
import { useAsyncFn } from 'react-use';
import type { RJSFSchema } from '@greenroom-robotics/alpha.schema-form';
import type { ApplicationInstance, LaunchpadConfig } from '@app/shared';
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
  const {
    applications,
    discoveredApplications,
    updateApplications,
    updateConfig,
    refreshDiscovery,
  } = useConfig();

  // Use useAsyncFn for form submission with built-in loading/error states
  const [submitState, handleSubmit] = useAsyncFn(
    async (data: LaunchpadConfig) => {
      await updateConfig.mutateAsync(data);
      console.log('Configuration saved successfully');
      return data;
    },
    [updateConfig]
  );

  // Add a discovered service to the configured applications
  const handleAddDiscovered = async (discovered: ApplicationInstance) => {
    const currentApps = applications.data || [];
    // Check if already exists by URL
    if (currentApps.some((app) => app.url.toLowerCase() === discovered.url.toLowerCase())) {
      return; // Already configured
    }
    // Use discovered vesselName, or fall back to the display name
    const vesselName = discovered.vesselName || discovered.name;
    const newApp: ApplicationInstance = {
      id: discovered.id.replace('discovered-', ''),
      name: discovered.name,
      type: discovered.type,
      url: discovered.url,
      description: discovered.description,
      enabled: true,
      vesselName,
    };
    await updateApplications.mutateAsync([...currentApps, newApp]);
  };

  // Check if a discovered service is already configured
  const isAlreadyConfigured = (discovered: ApplicationInstance) =>
    (applications.data || []).some(
      (app) => app.url.toLowerCase() === discovered.url.toLowerCase()
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

      {/* Discovered Services Section */}
      <Box margin={{ top: 'medium' }}>
        <Box direction="row" justify="between" align="center" margin={{ bottom: 'small' }}>
          <Text weight="bold" size="large">
            Discovered on Network
          </Text>
          <Button
            label="Refresh"
            size="small"
            onClick={() => refreshDiscovery.mutate()}
            disabled={refreshDiscovery.isPending}
          />
        </Box>
        <Text size="small" color="text-weak" margin={{ bottom: 'small' }}>
          Services discovered via mDNS. Click + to add to your configuration.
        </Text>
        {(discoveredApplications.data || []).length === 0 ? (
          <Box pad="medium" background="background-contrast" round="small">
            <Text color="text-weak" textAlign="center">
              No services discovered. Ensure target hosts have Avahi configured.
            </Text>
          </Box>
        ) : (
          <Box gap="small">
            {(discoveredApplications.data || []).map((discovered) => {
              const configured = isAlreadyConfigured(discovered);
              // Access raw discovered service data for metadata
              const rawService = (discovered as unknown as { vesselName?: string; hostname?: string; product?: string });
              return (
                <Card key={discovered.id} background="background-contrast" pad="small">
                  <Box direction="row" justify="between" align="center">
                    <Box>
                      <Box direction="row" gap="small" align="center">
                        <Text weight="bold">{discovered.name}</Text>
                        <Text size="xsmall" color="text-weak">
                          {discovered.type.toUpperCase()}
                        </Text>
                        {configured && (
                          <Text size="xsmall" color="status-ok">
                            (configured)
                          </Text>
                        )}
                      </Box>
                      <Box direction="row" gap="small">
                        <Text size="small" color="text-weak">
                          {discovered.url}
                        </Text>
                        {rawService.vesselName && (
                          <Text size="small" color="text-weak">
                            | Vessel: {rawService.vesselName}
                          </Text>
                        )}
                        {rawService.hostname && (
                          <Text size="small" color="text-weak">
                            | Host: {rawService.hostname}
                          </Text>
                        )}
                      </Box>
                    </Box>
                    {!configured && (
                      <Button
                        icon={<Text size="large">+</Text>}
                        size="small"
                        primary
                        onClick={() => handleAddDiscovered(discovered)}
                        tip="Add to configuration"
                      />
                    )}
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </CollapsiblePanel>
  );
};

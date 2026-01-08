import { Box, Text, Button } from 'grommet';
import { trpc } from '../trpc-react';
import { CollapsiblePanel } from '@greenroom-robotics/alpha.ui/build/components';

export const AuthSettingsPage = () => {
  // Get stored authentication hosts
  const { data: storedHosts, refetch: refetchHosts } = trpc.auth.getStoredAuthHosts.useQuery();

  // Clear stored credentials mutation
  const clearCredentials = trpc.auth.clearStoredCredentials.useMutation({
    onSuccess: () => {
      refetchHosts();
    },
  });

  const handleClearAllCredentials = async () => {
    try {
      await clearCredentials.mutateAsync({});
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  };

  return (
    <CollapsiblePanel label="Authentication Settings" defaultOpen>
      {storedHosts?.hosts && storedHosts.hosts.length > 0 ? (
        <Box>
          <Text size="small" weight="bold">
            Stored credentials for:
          </Text>
          {storedHosts.hosts.map((host) => (
            <Text key={host} size="small" margin={{ left: 'small' }}>
              • {host}
            </Text>
          ))}
        </Box>
      ) : (
        'No stored credentials found.'
      )}

      <Box direction="row" gap="small" align="center">
        <Button
          label="Clear All Stored Credentials"
          color="status-critical"
          onClick={handleClearAllCredentials}
          disabled={clearCredentials.isPending || !storedHosts?.hosts?.length}
        />
        {clearCredentials.isPending && <Text size="small">Clearing credentials...</Text>}
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
        This will remove all saved login credentials. You will need to re-enter them when accessing
        protected applications.
      </Text>
    </CollapsiblePanel>
  );
};

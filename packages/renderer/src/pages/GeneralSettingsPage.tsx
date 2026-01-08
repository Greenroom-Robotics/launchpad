import { Box, Text, CheckBox } from 'grommet';
import { trpc } from '../trpc-react';
import { CollapsiblePanel } from '@greenroom-robotics/alpha.ui/build/components';

export const GeneralSettingsPage = () => {
  // Auto-start management
  const { data: autoStartStatus, refetch: refetchAutoStartStatus } =
    trpc.system.getAutoStartStatus.useQuery();
  const enableAutoStart = trpc.system.enableAutoStart.useMutation({
    onSuccess: () => {
      refetchAutoStartStatus();
    },
  });
  const disableAutoStart = trpc.system.disableAutoStart.useMutation({
    onSuccess: () => {
      refetchAutoStartStatus();
    },
  });

  // Update management
  const { data: updateInfo } = trpc.update.checkForUpdates.useQuery();

  // Check if we're in development mode (auto-start won't work)
  const isDevelopment = import.meta.env.DEV;

  const handleAutoStartToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    try {
      if (enabled) {
        await enableAutoStart.mutateAsync({ openAsHidden: true });
      } else {
        await disableAutoStart.mutateAsync();
      }
    } catch (error) {
      console.error('Error toggling auto-start:', error);
    }
  };

  return (
    <Box gap="medium">
      <CollapsiblePanel label="System Settings" defaultOpen>
        <Box direction="row" align="center" gap="small" margin={{ bottom: 'small' }}>
          <CheckBox
            checked={autoStartStatus?.enabled || false}
            onChange={handleAutoStartToggle}
            disabled={enableAutoStart.isPending || disableAutoStart.isPending || isDevelopment}
          />
          <Text size="small">Start automatically when computer boots</Text>
        </Box>

        {isDevelopment && (
          <Text size="small" color="status-warning" margin={{ left: 'medium', bottom: 'small' }}>
            Auto-start is only available in packaged/production builds
          </Text>
        )}

        {(enableAutoStart.isPending || disableAutoStart.isPending) && (
          <Text size="small" color="text-weak" margin={{ left: 'medium' }}>
            Updating auto-start setting...
          </Text>
        )}

        <Text size="small" color="text-weak" margin={{ left: 'medium' }}>
          {isDevelopment
            ? 'This setting will be available when the app is built and packaged'
            : 'When enabled, Launchpad will start automatically when your computer boots'}
        </Text>
      </CollapsiblePanel>

      <CollapsiblePanel label="Updates" defaultOpen>
        <Text size="small" margin={{ bottom: 'small' }}>
          Current Version: {updateInfo?.currentVersion || 'Unknown'}
        </Text>

        {updateInfo?.updateAvailable && 'latestVersion' in updateInfo && (
          <Text size="small" color="status-ok" margin={{ bottom: 'small' }}>
            Update available: {updateInfo.latestVersion}
          </Text>
        )}

        {!updateInfo?.updateAvailable && updateInfo?.currentVersion && (
          <Text size="small" color="text-weak" margin={{ bottom: 'small' }}>
            You are running the latest version
          </Text>
        )}

        <Text size="small" color="text-weak">
          Automatic update management will be available in a future release
        </Text>
      </CollapsiblePanel>
    </Box>
  );
};

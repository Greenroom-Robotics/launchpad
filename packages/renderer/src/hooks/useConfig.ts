import { trpc } from '../trpc-react';

export function useConfig() {
  const utils = trpc.useUtils();

  const invalidateConfig = () => {
    utils.config.getApplications.invalidate();
    utils.config.getConfig.invalidate();
  };

  const invalidateDiscovery = () => {
    utils.discovery.getDiscoveredApplications.invalidate();
  };

  return {
    applications: trpc.config.getApplications.useQuery(),
    discoveredApplications: trpc.discovery.getDiscoveredApplications.useQuery(undefined, {
      refetchInterval: 5000, // Poll for new discoveries every 5 seconds
    }),
    updateApplications: trpc.config.setApplications.useMutation({
      onSuccess: invalidateConfig,
    }),
    updateConfig: trpc.config.setConfig.useMutation({
      onSuccess: invalidateConfig,
    }),
    resetToDefault: trpc.config.resetToDefault.useMutation({
      onSuccess: invalidateConfig,
    }),
    refreshDiscovery: trpc.discovery.refresh.useMutation({
      onSuccess: invalidateDiscovery,
    }),
    launchApp: trpc.apps.launchApp.useMutation(),
  };
}

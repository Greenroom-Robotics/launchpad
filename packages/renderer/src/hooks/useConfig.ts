import { trpc } from '../trpc-react';

export function useConfig() {
  const utils = trpc.useUtils();

  const invalidateConfig = () => {
    utils.config.getApplications.invalidate();
    utils.config.getConfig.invalidate();
  };

  return {
    applications: trpc.config.getApplications.useQuery(),
    updateApplications: trpc.config.setApplications.useMutation({
      onSuccess: invalidateConfig,
    }),
    updateConfig: trpc.config.setConfig.useMutation({
      onSuccess: invalidateConfig,
    }),
    resetToDefault: trpc.config.resetToDefault.useMutation({
      onSuccess: invalidateConfig,
    }),
    openApplication: trpc.app.openApplication.useMutation(),
  };
}

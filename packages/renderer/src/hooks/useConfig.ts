import { useState } from 'react';
import { useAsyncFn, useMount } from 'react-use';
import type { ApplicationInstance, LaunchpadConfig } from '../types/config';

// Access the electron APIs through the exposed global
declare global {
  interface Window {
    [key: string]: unknown;
  }
}

interface ElectronConfigAPI {
  getApplications: () => Promise<ApplicationInstance[]>;
  setApplications: (applications: ApplicationInstance[]) => Promise<void>;
  getConfig: () => Promise<LaunchpadConfig>;
  setConfig: (config: LaunchpadConfig) => Promise<void>;
  resetToDefault: () => Promise<LaunchpadConfig>;
}

interface ElectronAppAPI {
  openApplication: (url: string, name: string) => Promise<void>;
  checkConnectivity: (url: string) => Promise<{ connected: boolean; error?: string }>;
}

// Helper to decode base64 encoded property names and get the exposed APIs
function getElectronAPI() {
  try {
    // The preload script exposes APIs with base64 encoded names
    const configKey = btoa('config');
    const appKey = btoa('app');

    return {
      config: window[configKey] as ElectronConfigAPI | undefined,
      app: window[appKey] as ElectronAppAPI | undefined,
    };
  } catch (error) {
    console.warn('Electron APIs not available:', error);
    return { config: undefined, app: undefined };
  }
}

export function useConfig() {
  const [applications, setApplications] = useState<ApplicationInstance[]>([]);
  const { config, app } = getElectronAPI();

  // Use useAsyncFn for loading applications with built-in state management
  const [loadState, loadApplications] = useAsyncFn(async () => {
    if (!config) {
      throw new Error('Configuration API not available');
    }
    const apps = await config.getApplications();
    setApplications(apps);
    return apps;
  }, [config]);

  // Load configuration on mount
  useMount(() => {
    loadApplications();
  });

  // Use useAsyncFn for updating applications
  const [, updateApplications] = useAsyncFn(
    async (newApplications: ApplicationInstance[]) => {
      if (!config) {
        throw new Error('Configuration API not available');
      }

      await config.setApplications(newApplications);
      setApplications(newApplications);
      return newApplications;
    },
    [config]
  );

  // Use useAsyncFn for updating config
  const [, updateConfig] = useAsyncFn(
    async (newConfig: LaunchpadConfig) => {
      if (!config) {
        throw new Error('Configuration API not available');
      }

      await config.setConfig(newConfig);
      setApplications(newConfig.applications);
      return newConfig;
    },
    [config]
  );

  // Use useAsyncFn for resetting to default
  const [, resetToDefault] = useAsyncFn(async () => {
    if (!config) {
      throw new Error('Configuration API not available');
    }

    const defaultConfig = await config.resetToDefault();
    setApplications(defaultConfig.applications);
    return defaultConfig;
  }, [config]);

  // Use useAsyncFn for opening applications
  const [, openApplication] = useAsyncFn(
    async (url: string, name: string) => {
      if (!app) {
        throw new Error('Application API not available');
      }

      await app.openApplication(url, name);
    },
    [app]
  );

  // Use useAsyncFn for connectivity checking
  const [, checkConnectivity] = useAsyncFn(
    async (url: string) => {
      if (!app) {
        return { connected: false, error: 'Application API not available' };
      }

      try {
        return await app.checkConnectivity(url);
      } catch (err) {
        console.error('Failed to check connectivity:', err);
        return { connected: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    },
    [app]
  );

  // Extract loading and error states from the loadState
  const { loading: isLoading, error } = loadState;

  return {
    applications,
    isLoading,
    error: error?.message,
    updateApplications,
    updateConfig,
    resetToDefault,
    openApplication,
    checkConnectivity,
  };
}

import { useState, useEffect } from 'react';
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
  openApplication: (url: string) => Promise<void>;
}

// Helper to decode base64 encoded property names and get the exposed APIs
function getElectronAPI() {
  try {
    // The preload script exposes APIs with base64 encoded names
    const configKey = btoa('config');
    const appKey = btoa('app');

    return {
      config: window[configKey] as ElectronConfigAPI | undefined,
      app: window[appKey] as ElectronAppAPI | undefined
    };
  } catch (error) {
    console.warn('Electron APIs not available:', error);
    return { config: undefined, app: undefined };
  }
}

export function useConfig() {
  const [applications, setApplications] = useState<ApplicationInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { config, app } = getElectronAPI();

  // Load configuration on mount
  useEffect(() => {
    if (!config) {
      setError('Configuration API not available');
      setIsLoading(false);
      return;
    }

    const loadConfig = async () => {
      try {
        const apps = await config!.getApplications();
        setApplications(apps);
      } catch (err) {
        console.error('Failed to load configuration:', err);
        setError('Failed to load configuration');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [config]);

  const updateApplications = async (newApplications: ApplicationInstance[]) => {
    if (!config) {
      throw new Error('Configuration API not available');
    }

    try {
      await config!.setApplications(newApplications);
      setApplications(newApplications);
    } catch (err) {
      console.error('Failed to update applications:', err);
      throw err;
    }
  };

  const updateConfig = async (newConfig: LaunchpadConfig) => {
    if (!config) {
      throw new Error('Configuration API not available');
    }

    try {
      await config!.setConfig(newConfig);
      setApplications(newConfig.applications);
    } catch (err) {
      console.error('Failed to update configuration:', err);
      throw err;
    }
  };

  const resetToDefault = async () => {
    if (!config) {
      throw new Error('Configuration API not available');
    }

    try {
      const defaultConfig = await config!.resetToDefault();
      setApplications(defaultConfig.applications);
    } catch (err) {
      console.error('Failed to reset configuration:', err);
      throw err;
    }
  };

  const openApplication = async (url: string) => {
    if (!app) {
      throw new Error('Application API not available');
    }

    try {
      await app!.openApplication(url);
    } catch (err) {
      console.error('Failed to open application:', err);
      throw err;
    }
  };

  return {
    applications,
    isLoading,
    error,
    updateApplications,
    updateConfig,
    resetToDefault,
    openApplication
  };
}
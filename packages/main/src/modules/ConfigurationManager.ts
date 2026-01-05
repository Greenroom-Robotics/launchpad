import { singleton } from 'tsyringe';
import Store from 'electron-store';
import { net } from 'electron';
import type { ApplicationInstance, LaunchpadConfig } from '@app/shared';
import { defaultConfig } from '@app/shared';
import type { IInitializable } from '../interfaces.js';
import { SecureHttpClient } from '../lib/httpClient.js';

@singleton()
export class ConfigurationManager implements IInitializable {
  private store: Store<LaunchpadConfig>;
  private httpClient: SecureHttpClient;

  constructor() {
    this.store = new Store<LaunchpadConfig>({
      name: 'launchpad-config',
      defaults: defaultConfig,
      schema: {
        applications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: {
                type: 'string',
                enum: ['gama', 'lookout', 'marops', 'missim'],
              },
              url: { type: 'string' },
              description: { type: 'string' },
              enabled: { type: 'boolean' },
            },
            required: ['id', 'name', 'type', 'url', 'enabled'],
          },
        },
      },
    });
    this.httpClient = new SecureHttpClient();
  }

  async initialize(): Promise<void> {
    // IPC handlers have been migrated to tRPC
  }

  getApplications(): ApplicationInstance[] {
    return this.store.get('applications', defaultConfig.applications);
  }

  setApplications(applications: ApplicationInstance[]): void {
    this.store.set('applications', applications);
  }

  getConfig(): LaunchpadConfig {
    return {
      applications: this.getApplications(),
    };
  }

  setConfig(config: LaunchpadConfig): void {
    this.store.set('applications', config.applications);
  }

  resetToDefault(): LaunchpadConfig {
    this.store.clear();
    return this.getConfig();
  }

  async checkConnectivity(url: string): Promise<{ connected: boolean; error?: string }> {
    try {
      // First check if we have basic network connectivity
      if (!net.isOnline()) {
        console.log(`[ConfigurationManager] No network connection detected`);
        return { connected: false, error: 'No network connection' };
      }

      // Use axios with SSL bypass for connectivity check
      const result = await this.httpClient.checkConnectivity(url);

      return {
        connected: result.connected,
        error: result.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        connected: false,
        error: errorMessage,
      };
    }
  }
}

import { singleton } from 'tsyringe';
import Store from 'electron-store';
import { net } from 'electron';
import type { ApplicationInstance, LaunchpadConfig } from '@app/shared';
import { defaultConfig } from '@app/shared';
import type { IInitializable } from '../interfaces.js';

@singleton()
export class ConfigurationManager implements IInitializable {
  private store: Store<LaunchpadConfig>;

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
        return { connected: false, error: 'No network connection' };
      }

      // Create a request to test the URL
      const request = net.request(url);

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          request.abort();
          resolve({ connected: false, error: 'Connection timeout' });
        }, 5000); // 5 second timeout

        request.on('response', () => {
          clearTimeout(timeout);
          // Consider any response (even 404) as connected, since the server is responding
          resolve({ connected: true });
        });

        request.on('error', (error) => {
          clearTimeout(timeout);
          resolve({ connected: false, error: error.message });
        });

        // Use HEAD request to avoid downloading content
        request.end();
      });
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

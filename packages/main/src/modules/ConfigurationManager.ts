import Store from 'electron-store';
import { ipcMain, net } from 'electron';
import type { ApplicationInstance, LaunchpadConfig } from '../types/config.js';
import { defaultConfig } from '../types/config.js';
import { AppModule } from '../AppModule.js';
import { WindowManager } from './WindowManager.js';

export class ConfigurationManager implements AppModule {
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
                enum: ['gama', 'lookout', 'marops', 'missim']
              },
              url: { type: 'string' },
              description: { type: 'string' },
              enabled: { type: 'boolean' }
            },
            required: ['id', 'name', 'type', 'url', 'enabled']
          }
        }
      }
    });
  }

  async enable() {
    // Set up IPC handlers for configuration management
    ipcMain.handle('config:getApplications', () => {
      return this.getApplications();
    });

    ipcMain.handle('config:setApplications', (_, applications: ApplicationInstance[]) => {
      return this.setApplications(applications);
    });

    ipcMain.handle('config:getConfig', () => {
      return this.getConfig();
    });

    ipcMain.handle('config:setConfig', (_, config: LaunchpadConfig) => {
      return this.setConfig(config);
    });

    ipcMain.handle('config:resetToDefault', () => {
      return this.resetToDefault();
    });

    // Handle opening application URLs in new Electron windows
    ipcMain.handle('app:openApplication', async (_, { url, name }: { url: string; name: string }) => {
      const windowManager = WindowManager.getInstance();
      if (!windowManager) {
        throw new Error('WindowManager not available');
      }
      await windowManager.createApplicationWindow(url, name);
      // Return simple success response instead of the BrowserWindow object
      return { success: true, url, name };
    });

    // Handle connectivity checking
    ipcMain.handle('app:checkConnectivity', async (_, url: string) => {
      return this.checkConnectivity(url);
    });
  }

  getApplications(): ApplicationInstance[] {
    return this.store.get('applications', defaultConfig.applications);
  }

  setApplications(applications: ApplicationInstance[]): void {
    this.store.set('applications', applications);
  }

  getConfig(): LaunchpadConfig {
    return {
      applications: this.getApplications()
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
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

}

export function createConfigurationManager() {
  return new ConfigurationManager();
}
import Store from 'electron-store';
import { ipcMain, shell } from 'electron';
import type { ApplicationInstance, LaunchpadConfig } from '../types/config.js';
import { defaultConfig } from '../types/config.js';
import { AppModule } from '../AppModule.js';

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

    // Handle opening application URLs in external browser
    ipcMain.handle('app:openApplication', (_, url: string) => {
      return shell.openExternal(url);
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

}

export function createConfigurationManager() {
  return new ConfigurationManager();
}
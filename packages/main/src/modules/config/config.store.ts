import { singleton } from 'tsyringe';
import Store from 'electron-store';
import type { ApplicationInstance, LaunchpadConfig } from '@app/shared';
import { defaultConfig } from '@app/shared';

@singleton()
export class ConfigStore {
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

  // Additional utility methods
  getApplication(id: string): ApplicationInstance | undefined {
    const applications = this.getApplications();
    return applications.find((app) => app.id === id);
  }

  updateApplication(id: string, updates: Partial<ApplicationInstance>): boolean {
    const applications = this.getApplications();
    const index = applications.findIndex((app) => app.id === id);

    if (index === -1) {
      return false;
    }

    applications[index] = { ...applications[index], ...updates };
    this.setApplications(applications);
    return true;
  }

  addApplication(application: ApplicationInstance): void {
    const applications = this.getApplications();
    applications.push(application);
    this.setApplications(applications);
  }

  removeApplication(id: string): boolean {
    const applications = this.getApplications();
    const index = applications.findIndex((app) => app.id === id);

    if (index === -1) {
      return false;
    }

    applications.splice(index, 1);
    this.setApplications(applications);
    return true;
  }

  getEnabledApplications(): ApplicationInstance[] {
    return this.getApplications().filter((app) => app.enabled);
  }

  getApplicationsByType(type: ApplicationInstance['type']): ApplicationInstance[] {
    return this.getApplications().filter((app) => app.type === type);
  }
}

import { singleton, inject } from 'tsyringe';
import { net } from 'electron';
import { SecureHttpClient } from '../../lib/httpClient.js';
import { ConfigStore } from './config.store.js';
import type { ApplicationInstance, LaunchpadConfig, ConnectivityCheckResponse } from '@app/shared';

@singleton()
export class ConfigService {
  private httpClient: SecureHttpClient;

  constructor(@inject(ConfigStore) private store: ConfigStore) {
    this.httpClient = new SecureHttpClient();
  }

  getApplications(): ApplicationInstance[] {
    return this.store.getApplications();
  }

  setApplications(applications: ApplicationInstance[]): void {
    this.store.setApplications(applications);
  }

  getConfig(): LaunchpadConfig {
    return this.store.getConfig();
  }

  setConfig(config: LaunchpadConfig): void {
    this.store.setConfig(config);
  }

  resetToDefault(): LaunchpadConfig {
    return this.store.resetToDefault();
  }

  async checkConnectivity(url: string): Promise<ConnectivityCheckResponse> {
    try {
      // First check if we have basic network connectivity
      if (!net.isOnline()) {
        console.log(`[ConfigService] No network connection detected`);
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

  // Additional business logic methods
  getApplication(id: string): ApplicationInstance | undefined {
    return this.store.getApplication(id);
  }

  updateApplication(id: string, updates: Partial<ApplicationInstance>): boolean {
    return this.store.updateApplication(id, updates);
  }

  addApplication(application: ApplicationInstance): void {
    this.store.addApplication(application);
  }

  removeApplication(id: string): boolean {
    return this.store.removeApplication(id);
  }

  getEnabledApplications(): ApplicationInstance[] {
    return this.store.getEnabledApplications();
  }

  getApplicationsByType(type: ApplicationInstance['type']): ApplicationInstance[] {
    return this.store.getApplicationsByType(type);
  }

  toggleApplicationEnabled(id: string): boolean {
    const application = this.getApplication(id);
    if (!application) {
      return false;
    }

    return this.updateApplication(id, { enabled: !application.enabled });
  }

  async validateApplicationUrl(url: string): Promise<{ valid: boolean; error?: string }> {
    try {
      new URL(url); // Basic URL validation
      const connectivity = await this.checkConnectivity(url);
      return {
        valid: connectivity.connected,
        error: connectivity.error,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid URL format',
      };
    }
  }

  async batchConnectivityCheck(): Promise<Record<string, ConnectivityCheckResponse>> {
    const applications = this.getEnabledApplications();
    const results: Record<string, ConnectivityCheckResponse> = {};

    await Promise.allSettled(
      applications.map(async (app) => {
        results[app.id] = await this.checkConnectivity(app.url);
      })
    );

    return results;
  }
}

import { singleton, inject } from 'tsyringe';
import { ConfigService } from '../config/config.service.js';
import { WindowService } from '../window/window.service.js';
import type { ApplicationInstance, AppLaunchResponse, AppStatus } from '@app/shared';

@singleton()
export class AppsService {
  constructor(
    @inject(ConfigService) private configService: ConfigService,
    @inject(WindowService) private windowService: WindowService
  ) {}

  async launchApp(appId: string, newWindow: boolean = false): Promise<AppLaunchResponse> {
    const app = this.configService.getApplication(appId);
    if (!app) {
      return {
        success: false,
        message: `Application with ID ${appId} not found`,
      };
    }

    if (!app.enabled) {
      return {
        success: false,
        message: `Application ${app.name} is disabled`,
      };
    }

    try {
      const window = newWindow
        ? await this.windowService.createNewApplicationWindow(app.url, app.name)
        : await this.windowService.createApplicationWindow(app.url, app.name);

      return {
        success: true,
        message: `Application ${app.name} launched successfully`,
        windowId: window?.id?.toString(),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Failed to launch ${app.name}: ${errorMessage}`,
      };
    }
  }

  getAppStatus(appId: string): AppStatus | null {
    const app = this.configService.getApplication(appId);
    if (!app) {
      return null;
    }

    const window = this.windowService.getApplicationWindow(app.name);
    const isRunning = window && !window.isDestroyed();

    return {
      appId: app.id,
      name: app.name,
      status: isRunning ? 'running' : 'stopped',
      windowCount: isRunning ? 1 : 0,
    };
  }

  getAllAppsStatus(): AppStatus[] {
    const apps = this.configService.getEnabledApplications();
    return apps.map((app) => this.getAppStatus(app.id)!).filter(Boolean);
  }

  async checkAppConnectivity(appId: string) {
    const app = this.configService.getApplication(appId);
    if (!app) {
      return {
        appId,
        connected: false,
        error: 'Application not found',
      };
    }

    const result = await this.configService.checkConnectivity(app.url);
    return {
      appId,
      connected: result.connected,
      error: result.error,
    };
  }

  async batchConnectivityCheck(appIds?: string[]) {
    const apps = appIds
      ? (appIds
          .map((id) => this.configService.getApplication(id))
          .filter(Boolean) as ApplicationInstance[])
      : this.configService.getEnabledApplications();

    const results = await Promise.allSettled(apps.map((app) => this.checkAppConnectivity(app.id)));

    return {
      results: results.map((result, index) =>
        result.status === 'fulfilled'
          ? result.value
          : { appId: apps[index].id, connected: false, error: 'Check failed' }
      ),
    };
  }

  closeApp(appId: string): boolean {
    const app = this.configService.getApplication(appId);
    if (!app) {
      return false;
    }

    return this.windowService.closeApplicationWindow(app.name);
  }

  async restartApp(appId: string): Promise<AppLaunchResponse> {
    const closed = this.closeApp(appId);
    if (!closed) {
      return { success: false, message: 'Failed to close application' };
    }

    // Wait a bit before restarting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return this.launchApp(appId);
  }
}

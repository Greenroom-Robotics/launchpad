import { singleton, inject } from 'tsyringe';
import * as Electron from 'electron';
import { TYPES } from '../../types.js';

@singleton()
export class InstanceService {
  private isMainInstance: boolean;

  constructor(@inject(TYPES.ElectronApp) private app: Electron.App) {
    // Enforce single instance immediately
    const isSingleInstance = this.app.requestSingleInstanceLock();
    this.isMainInstance = isSingleInstance;

    if (!isSingleInstance) {
      console.log('Another instance is already running, quitting...');
      this.app.quit();
      process.exit(0);
    } else {
      console.log('Main instance started successfully');
    }
  }

  // Check if this is the main instance
  isMain(): boolean {
    return this.isMainInstance;
  }

  // Get app instance info
  getInstanceInfo(): {
    isMain: boolean;
    hasLock: boolean;
    pid: number;
    version: string;
  } {
    return {
      isMain: this.isMainInstance,
      hasLock: this.app.hasSingleInstanceLock(),
      pid: process.pid,
      version: this.app.getVersion(),
    };
  }

  // Release the single instance lock (use with caution)
  releaseLock(): void {
    if (this.isMainInstance) {
      this.app.releaseSingleInstanceLock();
      this.isMainInstance = false;
      console.log('Single instance lock released');
    }
  }

  // Check if app has the single instance lock
  hasLock(): boolean {
    return this.app.hasSingleInstanceLock();
  }

  // Handle second instance events
  onSecondInstance(
    callback: (event: Electron.Event, commandLine: string[], workingDirectory: string) => void
  ): void {
    this.app.on('second-instance', callback);
  }

  // Get command line arguments
  getCommandLineArgs(): string[] {
    return process.argv;
  }

  // Get working directory
  getWorkingDirectory(): string {
    return process.cwd();
  }

  // Exit with specific code
  exitWithCode(code: number = 0): void {
    process.exit(code);
  }
}

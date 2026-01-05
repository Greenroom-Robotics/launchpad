import { singleton, inject } from 'tsyringe';
import * as Electron from 'electron';
import type { IInitializable } from '../interfaces.js';
import { TYPES } from '../types.js';

@singleton()
export class SingleInstanceApp implements IInitializable {

  constructor(
    @inject(TYPES.ElectronApp) private app: Electron.App
  ) { }

  initialize(): void {
    const isSingleInstance = this.app.requestSingleInstanceLock();
    if (!isSingleInstance) {
      this.app.quit();
      process.exit(0);
    }
  }
}


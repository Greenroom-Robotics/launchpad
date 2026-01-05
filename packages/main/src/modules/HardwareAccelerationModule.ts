import { singleton, inject } from 'tsyringe';
import type { IInitializable } from '../interfaces.js';
import { TYPES } from '../types.js';

@singleton()
export class HardwareAccelerationModule implements IInitializable {
  readonly #shouldBeDisabled: boolean;

  constructor(
    @inject(TYPES.ElectronApp) private app: Electron.App
  ) {
    // Disable by default
    this.#shouldBeDisabled = true;
  }

  initialize(): void {
    if (this.#shouldBeDisabled) {
      this.app.disableHardwareAcceleration();
    }
  }
}


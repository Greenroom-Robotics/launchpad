import 'reflect-metadata';
import { container } from 'tsyringe';
import { app } from 'electron';
import type { AppInitConfig } from './AppInitConfig.js';
import { TYPES } from './types.js';

export function setupDI(initConfig: AppInitConfig) {
    container.register(TYPES.ElectronApp, { useValue: app });
    container.register(TYPES.AppInitConfig, { useValue: initConfig });
}

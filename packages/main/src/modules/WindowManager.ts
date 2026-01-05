import { singleton, inject } from 'tsyringe';
import { TYPES } from '../types.js';
import { BrowserWindow } from 'electron';
import type { AppInitConfig } from '../AppInitConfig.js';
import type { IInitializable } from '../interfaces.js';

const WINDOW_TYPES = {
  LAUNCHPAD: 'launchpad',
  APPLICATION: 'application',
} as const;

type WindowType = (typeof WINDOW_TYPES)[keyof typeof WINDOW_TYPES];

interface WindowMetadata {
  type: WindowType;
  applicationName?: string;
  applicationUrl?: string;
}

@singleton()
export class WindowManager implements IInitializable {
  readonly #preload: { path: string };
  readonly #renderer: { path: string } | URL;
  readonly #openDevTools;
  readonly #applicationWindows: Map<string, BrowserWindow> = new Map();
  readonly #windowMetadata: WeakMap<BrowserWindow, WindowMetadata> = new WeakMap();

  constructor(
    @inject(TYPES.AppInitConfig) initConfig: AppInitConfig,
    @inject(TYPES.ElectronApp) private app: Electron.App
  ) {
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
    this.#openDevTools = false;
  }

  async initialize(): Promise<void> {
    await this.app.whenReady();
    await this.restoreOrCreateWindow(true);
    this.app.on('second-instance', () => this.restoreOrCreateWindow(true));
    this.app.on('activate', () => this.restoreOrCreateWindow(true));
  }

  async createWindow(): Promise<BrowserWindow> {
    const browserWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      title: 'Greenroom | Launchpad',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        preload: this.#preload.path,
      },
    });

    // Mark this as a Launchpad window
    this.#windowMetadata.set(browserWindow, {
      type: WINDOW_TYPES.LAUNCHPAD,
    });

    if (this.#renderer instanceof URL) {
      await browserWindow.loadURL(this.#renderer.href);
    } else {
      await browserWindow.loadFile(this.#renderer.path);
    }

    return browserWindow;
  }

  async restoreOrCreateWindow(show = false) {
    let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

    if (window === undefined) {
      window = await this.createWindow();
    }

    if (!show) {
      return window;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window?.show();

    if (this.#openDevTools) {
      window?.webContents.openDevTools();
    }

    window.focus();

    return window;
  }

  async createApplicationWindow(url: string, applicationName: string): Promise<BrowserWindow> {
    // Check if window already exists for this application
    const existingWindow = this.#applicationWindows.get(applicationName);
    if (existingWindow && !existingWindow.isDestroyed()) {
      // Focus existing window instead of creating new one
      if (existingWindow.isMinimized()) {
        existingWindow.restore();
      }
      existingWindow.focus();
      return existingWindow;
    }

    const browserWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      title: applicationName,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: true, // Keep web security for external URLs
        preload: this.#preload.path,
      },
    });

    // Mark this as an application window
    this.#windowMetadata.set(browserWindow, {
      type: WINDOW_TYPES.APPLICATION,
      applicationName: applicationName,
      applicationUrl: url,
    });

    // Store window reference before loading
    this.#applicationWindows.set(applicationName, browserWindow);

    // Clean up when window is closed
    browserWindow.on('closed', () => {
      this.#applicationWindows.delete(applicationName);
    });

    // Set up ready-to-show handler before loading
    browserWindow.once('ready-to-show', () => {
      browserWindow.show();
      if (this.#openDevTools) {
        browserWindow.webContents.openDevTools();
      }
    });

    // Handle load errors
    browserWindow.webContents.on(
      'did-fail-load',
      (event, errorCode, errorDescription, validatedURL) => {
        console.error(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
        // Show the window even on load failure so user can see the error
        if (!browserWindow.isDestroyed()) {
          browserWindow.show();
        }
      }
    );

    try {
      // Load the application URL
      await browserWindow.loadURL(url);
    } catch (error) {
      console.error(`Error loading URL ${url}:`, error);
      // Show window even if load fails
      if (!browserWindow.isDestroyed()) {
        browserWindow.show();
      }
    }

    return browserWindow;
  }

  getApplicationWindow(applicationName: string): BrowserWindow | undefined {
    const window = this.#applicationWindows.get(applicationName);
    return window && !window.isDestroyed() ? window : undefined;
  }

  closeApplicationWindow(applicationName: string): boolean {
    const window = this.#applicationWindows.get(applicationName);
    if (window && !window.isDestroyed()) {
      window.close();
      return true;
    }
    return false;
  }

  async createNewWindow(): Promise<BrowserWindow> {
    const window = await this.createWindow();

    window.show();
    if (this.#openDevTools) {
      window.webContents.openDevTools();
    }

    return window;
  }

  getWindowMetadata(window: BrowserWindow): WindowMetadata | undefined {
    return this.#windowMetadata.get(window);
  }

  showLaunchpadWindow(): void {
    // Find existing Launchpad window
    const launchpadWindow = BrowserWindow.getAllWindows().find((window) => {
      const metadata = this.#windowMetadata.get(window);
      return metadata && metadata.type === WINDOW_TYPES.LAUNCHPAD && !window.isDestroyed();
    });

    if (launchpadWindow) {
      // Show and focus existing window
      if (launchpadWindow.isMinimized()) {
        launchpadWindow.restore();
      }
      launchpadWindow.show();
      launchpadWindow.focus();
    } else {
      // Create and show new Launchpad window
      this.createNewWindow();
    }
  }

  async createNewApplicationWindow(url: string, applicationName: string): Promise<BrowserWindow> {
    // Always create a new window, don't check for existing ones
    const browserWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      title: applicationName,
      show: true, // Show immediately so user can see loading progress
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: true, // Keep web security for external URLs
        preload: this.#preload.path,
      },
    });

    // Mark this as an application window
    this.#windowMetadata.set(browserWindow, {
      type: WINDOW_TYPES.APPLICATION,
      applicationName: applicationName,
      applicationUrl: url,
    });

    // Open dev tools if needed
    if (this.#openDevTools) {
      browserWindow.webContents.openDevTools();
    }

    // Handle load errors
    browserWindow.webContents.on(
      'did-fail-load',
      (_, errorCode, errorDescription, validatedURL) => {
        console.error(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
      }
    );

    try {
      // Load the application URL
      await browserWindow.loadURL(url);
    } catch (error) {
      console.error(`Error loading URL ${url}:`, error);
    }

    return browserWindow;
  }
}

export { WINDOW_TYPES };

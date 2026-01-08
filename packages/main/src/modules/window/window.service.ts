import { singleton, inject } from 'tsyringe';
import { TYPES } from '../../types.js';
import { BrowserWindow } from 'electron';
import type { AppInitConfig } from '../../AppInitConfig.js';
import { AuthService, UserCancelledAuthError } from '../auth/auth.service.js';
import type { WindowMetadata } from '@app/shared';

const WINDOW_TYPES = {
  LAUNCHPAD: 'launchpad',
  APPLICATION: 'application',
} as const;

@singleton()
export class WindowService {
  readonly #preload: { path: string };
  readonly #renderer: { path: string } | URL;
  readonly #openDevTools;
  readonly #applicationWindows: Map<string, BrowserWindow> = new Map();
  readonly #windowMetadata: WeakMap<BrowserWindow, WindowMetadata> = new WeakMap();

  constructor(
    @inject(TYPES.AppInitConfig) initConfig: AppInitConfig,
    @inject(TYPES.ElectronApp) private app: Electron.App,
    @inject(AuthService) private authService: AuthService
  ) {
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
    this.#openDevTools = false;

    // Setup async initialization in constructor
    this.initializeAsync();
  }

  private async initializeAsync(): Promise<void> {
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

  /**
   * Simple auth setup for windows that already have credentials
   */
  private setupBasicAuthWithCredentials(
    browserWindow: BrowserWindow,
    url: string,
    credentials: { username: string; password: string }
  ): void {
    console.log(`[WindowService] Setting up basic auth for ${url} with provided credentials`);

    browserWindow.webContents.on(
      'login',
      (event, _authenticationResponseDetails, _authInfo, callback) => {
        console.log(`[WindowService] Using provided credentials for ${url}`);
        event.preventDefault();
        callback(credentials.username, credentials.password);
      }
    );
  }

  // The old complex setupBasicAuth method has been removed
  // Auth is now handled before window creation via AuthService.checkAuthAndGetCredentials

  async createApplicationWindow(
    url: string,
    applicationName: string
  ): Promise<BrowserWindow | undefined> {
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

    console.log(`[WindowService] Creating application window for ${applicationName} at ${url}`);

    // Check if authentication is required and get credentials
    let credentials: any = null;
    try {
      credentials = await this.authService.checkAuthAndGetCredentials(url);
      console.log(
        `[WindowService] Auth check result for ${url}: ${credentials ? 'credentials obtained' : 'no auth required'}`
      );
    } catch (error: unknown) {
      if (error instanceof UserCancelledAuthError) {
        console.log(
          `[WindowService] User cancelled authentication for ${url} - not creating window`
        );
        return; // Gracefully exit without creating window
      }
      // Handle actual auth errors (validation failures, network errors, etc.)
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error(`[WindowService] Authentication failed for ${url}:`, errorMessage);
      throw new Error(`Authentication failed: ${errorMessage}`);
    }

    // Create the browser window
    const browserWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      title: applicationName,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: false, // Disable web security to allow invalid SSL certificates
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

    // If we have credentials, set up basic auth for this window
    if (credentials) {
      this.setupBasicAuthWithCredentials(browserWindow, url, credentials);
    }

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
      (_event, errorCode, errorDescription, validatedURL) => {
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
      console.log(`[WindowService] Successfully loaded ${url} in window for ${applicationName}`);
    } catch (error: unknown) {
      console.error(`Error loading URL ${url}:`, error);
      // Show window even if load fails (for other errors)
      if (!browserWindow.isDestroyed()) {
        browserWindow.show();
      }
      throw error;
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

  async createNewApplicationWindow(
    url: string,
    applicationName: string
  ): Promise<BrowserWindow | undefined> {
    console.log(`[WindowService] Creating new application window for ${applicationName} at ${url}`);

    // Check if authentication is required and get credentials
    let credentials: any = null;
    try {
      credentials = await this.authService.checkAuthAndGetCredentials(url);
      console.log(
        `[WindowService] Auth check result for ${url}: ${credentials ? 'credentials obtained' : 'no auth required'}`
      );
    } catch (error: unknown) {
      if (error instanceof UserCancelledAuthError) {
        console.log(
          `[WindowService] User cancelled authentication for ${url} - not creating window`
        );
        return; // Gracefully exit without creating window
      }
      // Handle actual auth errors (validation failures, network errors, etc.)
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error(`[WindowService] Authentication failed for ${url}:`, errorMessage);
      throw new Error(`Authentication failed: ${errorMessage}`);
    }

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
        webSecurity: false, // Disable web security to allow invalid SSL certificates
        preload: this.#preload.path,
      },
    });

    // Mark this as an application window
    this.#windowMetadata.set(browserWindow, {
      type: WINDOW_TYPES.APPLICATION,
      applicationName: applicationName,
      applicationUrl: url,
    });

    // If we have credentials, set up basic auth for this window
    if (credentials) {
      this.setupBasicAuthWithCredentials(browserWindow, url, credentials);
    }

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
      console.log(
        `[WindowService] Successfully loaded ${url} in new window for ${applicationName}`
      );
    } catch (error) {
      console.error(`Error loading URL ${url}:`, error);
      throw error;
    }

    return browserWindow;
  }
}

export { WINDOW_TYPES };

import { singleton, inject } from 'tsyringe';
import { TYPES } from '../types.js';
import { BrowserWindow } from 'electron';
import type { AppInitConfig } from '../AppInitConfig.js';
import type { IInitializable } from '../interfaces.js';
import { BasicAuthManager } from './BasicAuthManager.js';

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
    @inject(TYPES.ElectronApp) private app: Electron.App,
    @inject(BasicAuthManager) private basicAuthManager: BasicAuthManager
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

  private setupBasicAuth(browserWindow: BrowserWindow, url: string): void {
    // Track cancelled URLs to prevent immediate retry
    const cancelledUrls = new Set<string>();

    // Handle HTTP Basic Auth challenges
    browserWindow.webContents.on(
      'login',
      async (event, authenticationResponseDetails, authInfo, callback) => {
        console.log(`[WindowManager] Login challenge for ${authenticationResponseDetails.url}`);
        console.log(`[WindowManager] Realm: ${authInfo.realm}`);

        // Prevent default behavior
        event.preventDefault();

        // Check if this URL was recently cancelled
        if (cancelledUrls.has(authenticationResponseDetails.url)) {
          console.log(
            `[WindowManager] Authentication cancelled for URL: ${authenticationResponseDetails.url}, closing window`
          );
          // Don't call callback - this prevents the retry loop
          // Just close the window immediately
          setTimeout(() => {
            if (!browserWindow.isDestroyed()) {
              browserWindow.webContents.stop();
              browserWindow.close();
            }
          }, 100);
          return;
        }

        try {
          // Check for stored credentials first
          const stored = this.basicAuthManager.getStoredCredentials(
            authenticationResponseDetails.url
          );

          if (stored) {
            console.log(
              `[WindowManager] Using stored credentials for ${authenticationResponseDetails.url}`
            );
            callback(stored.username, stored.password);
            return;
          }

          // Try to get credentials from the manager (this will create a challenge and show login window)
          const authResult = await this.basicAuthManager.requiresAuthentication(
            authenticationResponseDetails.url,
            authInfo.realm
          );

          if (authResult.credentials) {
            // We have stored credentials, use them immediately
            console.log(
              `[WindowManager] Using stored credentials for ${authenticationResponseDetails.url}`
            );
            callback(authResult.credentials.username, authResult.credentials.password);
          } else if (authResult.challengeId) {
            // Wait for user to provide credentials via the login window
            console.log(
              `[WindowManager] Waiting for user credentials via challenge ${authResult.challengeId}`
            );

            // Wait for challenge resolution (no timeout - let user decide)
            const credentials = await this.basicAuthManager.awaitChallengeCredentials(
              authResult.challengeId
            );

            if (credentials) {
              console.log(
                `[WindowManager] Using user-provided credentials for ${authenticationResponseDetails.url}`
              );
              callback(credentials.username, credentials.password);
            } else {
              console.log(
                `[WindowManager] User cancelled authentication for ${authenticationResponseDetails.url}`
              );

              // Mark this URL as cancelled to prevent immediate retry
              cancelledUrls.add(authenticationResponseDetails.url);
              // Remove from cancelled list after 5 seconds
              setTimeout(() => cancelledUrls.delete(authenticationResponseDetails.url), 5000);

              // Close the window if authentication was cancelled
              // Don't call callback to prevent retry loop
              setTimeout(() => {
                if (!browserWindow.isDestroyed()) {
                  console.log(`[WindowManager] Closing window due to cancelled authentication`);
                  // Stop loading first to prevent errors
                  browserWindow.webContents.stop();
                  browserWindow.close();
                }
              }, 100); // Small delay to ensure proper cleanup

              // DON'T call callback - this prevents the retry loop
              return; // Exit without calling callback
            }
          } else {
            console.log(
              `[WindowManager] No credentials available for ${authenticationResponseDetails.url}`
            );

            // Close the window if no credentials are available
            // Don't call callback to prevent retry loop
            setTimeout(() => {
              if (!browserWindow.isDestroyed()) {
                console.log(`[WindowManager] Closing window due to no available credentials`);
                // Stop loading first to prevent errors
                browserWindow.webContents.stop();
                browserWindow.close();
              }
            }, 100); // Small delay to ensure proper cleanup

            // DON'T call callback - this prevents retry loop
            return; // Exit without calling callback
          }
        } catch (error) {
          console.error(
            `[WindowManager] Error handling login for ${authenticationResponseDetails.url}:`,
            error
          );

          // Close the window on authentication error
          // Don't call callback to prevent retry loop
          setTimeout(() => {
            if (!browserWindow.isDestroyed()) {
              console.log(`[WindowManager] Closing window due to authentication error`);
              // Stop loading first to prevent errors
              browserWindow.webContents.stop();
              browserWindow.close();
            }
          }, 100); // Small delay to ensure proper cleanup

          // DON'T call callback - this prevents retry loop
          return; // Exit without calling callback
        }
      }
    );
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

    // Setup basic authentication handling
    this.setupBasicAuth(browserWindow, url);

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
    } catch (error: any) {
      console.error(`Error loading URL ${url}:`, error);
      // Show window even if load fails (for other errors)
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

    // Setup basic authentication handling
    this.setupBasicAuth(browserWindow, url);

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

  async createLoginWindow(challengeId: string): Promise<void> {
    const loginWindow = new BrowserWindow({
      width: 800,
      height: 520,
      show: false,
      modal: true,
      resizable: false,
      title: 'Login Required',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: this.#preload.path,
      },
    });
    loginWindow.removeMenu();

    // Handle window closed
    loginWindow.on('closed', () => {
      console.log(`[WindowManager] Login window closed for challenge ${challengeId}`);
      // Challenge will be handled by tRPC endpoints, no need to resolve here
    });

    // Set up ready-to-show handler
    loginWindow.once('ready-to-show', () => {
      loginWindow.show();
    });

    // Create login URL with challenge ID
    let loginUrl: string;
    if (this.#renderer instanceof URL) {
      const loginUrlObj = new URL(this.#renderer.href);
      loginUrlObj.searchParams.set('login', 'true');
      loginUrlObj.searchParams.set('challengeId', challengeId);
      loginUrl = loginUrlObj.href;
    } else {
      // For file-based renderer
      loginUrl = `${this.#renderer.path}?login=true&challengeId=${encodeURIComponent(challengeId)}`;
    }

    console.log(`[WindowManager] Creating login window for challenge ${challengeId}`);

    // Load the login page
    try {
      await loginWindow.loadURL(loginUrl);
    } catch (error) {
      console.error('Error loading login window:', error);
      loginWindow.close();
      throw error;
    }
  }
}

export { WINDOW_TYPES };

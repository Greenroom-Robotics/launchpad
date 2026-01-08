import { singleton, inject } from 'tsyringe';
import { SecureHttpClient } from '../../lib/httpClient.js';
import { AuthStore } from './auth.store.js';
import type { AuthCredentials, AuthValidationResult } from '@app/shared';
import type { AppInitConfig } from '../../AppInitConfig.js';
import { TYPES } from '../../types.js';
import { BrowserWindow } from 'electron';

/**
 * Error thrown when user explicitly cancels authentication
 * This is a normal user flow, not a system error
 */
class UserCancelledAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserCancelledAuthError';
  }
}

@singleton()
export class AuthService {
  private httpClient: SecureHttpClient;
  readonly #preload: { path: string };
  readonly #renderer: { path: string } | URL;
  private activeLoginWindows: Map<string, Promise<AuthCredentials | null>> = new Map();
  private activeLoginResolvers: Map<string, (credentials: AuthCredentials | null) => void> =
    new Map();

  constructor(
    @inject(TYPES.AppInitConfig) initConfig: AppInitConfig,
    @inject(AuthStore) private store: AuthStore
  ) {
    this.httpClient = new SecureHttpClient();
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
  }

  /**
   * Main auth flow method - checks if auth is required and gets credentials
   * Returns null if no auth needed, or AuthCredentials if auth is successful
   * Throws error if auth is required but user cancels or credentials are invalid
   */
  async checkAuthAndGetCredentials(url: string, realm?: string): Promise<AuthCredentials | null> {
    const host = this.getHostFromUrl(url);
    console.log(`[AuthService] Checking auth requirements for ${host}`);

    // Check if we have stored credentials first
    const stored = this.store.getStoredCredentials(url);
    if (stored) {
      console.log(`[AuthService] Using stored credentials for ${host}`);

      // Validate stored credentials are still valid
      const validation = await this.validateCredentialsWithServer(
        url,
        stored.username,
        stored.password
      );
      if (validation.valid) {
        return {
          username: stored.username,
          password: stored.password,
          remember: true,
        };
      } else {
        console.log(
          `[AuthService] Stored credentials for ${host} are no longer valid, clearing them`
        );
        this.store.clearStoredCredentials(url);
      }
    }

    // Test if auth is actually required by making a request
    try {
      const testResult = await this.httpClient.testBasicAuth(url, '', '');
      if (testResult.success || testResult.status !== 401) {
        console.log(`[AuthService] No authentication required for ${host}`);
        return null; // No auth required
      }
    } catch (error) {
      console.log(
        `[AuthService] Could not test auth requirements for ${host}, assuming auth is required`
      );
    }

    console.log(`[AuthService] Authentication required for ${host}`);

    // Check if we already have a login window open for this URL
    const existingPromise = this.activeLoginWindows.get(url);
    if (existingPromise) {
      console.log(`[AuthService] Reusing existing login window for ${host}`);
      return existingPromise;
    }

    // Create new login window and return the promise
    const loginPromise = this.createLoginWindow(url, realm);
    this.activeLoginWindows.set(url, loginPromise);

    try {
      const credentials = await loginPromise;

      if (credentials === null) {
        // User explicitly cancelled required authentication
        throw new UserCancelledAuthError('User cancelled authentication');
      }

      // Credentials have already been validated by the tRPC route before resolving
      // Store credentials if user wants to remember them
      if (credentials.remember) {
        console.log(`[AuthService] Storing validated credentials for ${this.getHostFromUrl(url)}`);
        this.store.storeCredentials(url, credentials.username, credentials.password);
      }

      return credentials;
    } finally {
      this.activeLoginWindows.delete(url);
    }
  }

  /**
   * Validate credentials with the server before storing them
   */
  async validateCredentialsWithServer(
    url: string,
    username: string,
    password: string
  ): Promise<AuthValidationResult> {
    try {
      console.log(`[AuthService] Validating credentials for ${url}`);
      const result = await this.httpClient.testBasicAuth(url, username, password);

      console.log(
        `[AuthService] Validation result: ${result.success ? 'SUCCESS' : 'FAILED'} (status ${result.status})`
      );

      return {
        valid: result.success,
        status: result.status,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      console.error(`[AuthService] Credential validation error for ${url}:`, errorMessage);
      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Creates a login window and returns a promise that resolves with credentials or null
   */
  private async createLoginWindow(url: string, realm?: string): Promise<AuthCredentials | null> {
    return new Promise((resolve, reject) => {
      console.log(`[AuthService] Creating login window for ${url}`);
      this.activeLoginResolvers.set(url, resolve);

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
        console.log(`[AuthService] Login window closed for ${url}`);
        // If promise hasn't been resolved yet, resolve with null (cancelled)
        const resolver = this.activeLoginResolvers.get(url);
        if (resolver) {
          console.log(`[AuthService] Window closed before resolution, treating as cancelled`);
          resolver(null);
          this.activeLoginResolvers.delete(url);
        }
      });

      // Set up ready-to-show handler
      loginWindow.once('ready-to-show', () => {
        loginWindow.show();
      });

      // Create login URL with URL and realm as query parameters (no challengeId needed!)
      let loginUrl: string;
      if (this.#renderer instanceof URL) {
        const loginUrlObj = new URL(this.#renderer.href);
        loginUrlObj.searchParams.set('login', 'true');
        loginUrlObj.searchParams.set('url', url);
        if (realm) {
          loginUrlObj.searchParams.set('realm', realm);
        }
        loginUrl = loginUrlObj.href;
      } else {
        // For file-based renderer
        const params = new URLSearchParams({
          login: 'true',
          url,
          ...(realm && { realm }),
        });
        loginUrl = `${this.#renderer.path}?${params.toString()}`;
      }

      console.log(`[AuthService] Stored resolver for ${url}`);

      // Load the login page
      loginWindow.loadURL(loginUrl).catch((error) => {
        console.error('Error loading login window:', error);
        loginWindow.close();
        reject(error);
      });
    });
  }

  /**
   * Resolves a login for the provided URL with credentials
   * Called by tRPC routes when user submits login form
   * @param url The URL being authenticated for
   * @param credentials The credentials to resolve with, or null for cancellation
   * @param validationPassed If true, credentials have been validated and window should close
   */
  async resolveLogin(
    url: string,
    credentials: AuthCredentials | null,
    validationPassed: boolean = false
  ): Promise<boolean> {
    console.log(`[AuthService] Attempting to resolve login for ${url}`);
    console.log(`[AuthService] Active login URLs:`, Array.from(this.activeLoginResolvers.keys()));

    const resolver = this.activeLoginResolvers.get(url);
    if (!resolver) {
      console.log(`[AuthService] Cannot resolve login for ${url}: no active login found`);
      return false;
    }

    if (credentials) {
      console.log(`[AuthService] Login for ${url} resolved with credentials`);
      resolver(credentials);

      // Only close the window if validation has passed (successful authentication)
      if (validationPassed) {
        const allWindows = BrowserWindow.getAllWindows();
        for (const window of allWindows) {
          const windowUrl = window.webContents.getURL();
          if (windowUrl.includes(`url=${encodeURIComponent(url)}`)) {
            console.log(
              `[AuthService] Closing login window for resolved URL ${url} (validation passed)`
            );
            window.close();
            break;
          }
        }
      } else {
        console.log(
          `[AuthService] Keeping login window open for ${url} (validation not confirmed)`
        );
      }
    } else {
      // User cancelled
      console.log(`[AuthService] Login for ${url} cancelled by user`);
      resolver(null);
      // Window will be closed by the cancel handler or closed event
    }

    this.activeLoginResolvers.delete(url);
    return true;
  }

  // getChallengeDetails method removed - data is passed via query params to login window

  // Store methods delegated to store
  storeCredentials(url: string, username: string, password: string): void {
    this.store.storeCredentials(url, username, password);
  }

  getStoredCredentials(url: string) {
    return this.store.getStoredCredentials(url);
  }

  clearStoredCredentials(url?: string): void {
    this.store.clearStoredCredentials(url);
  }

  getAllStoredHosts(): string[] {
    return this.store.getAllStoredHosts();
  }

  private getHostFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.host;
    } catch {
      return url;
    }
  }
}

// Export the error class for use in other modules
export { UserCancelledAuthError };

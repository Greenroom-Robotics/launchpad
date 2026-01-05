import { singleton } from 'tsyringe';
import Store from 'electron-store';
import type { IInitializable } from '../interfaces.js';
import { SecureHttpClient } from '../lib/httpClient.js';
import { safeStorage } from 'electron';

const getEncryptionKey = () => {
  const rawKey =
    'clealy!this@is#not$the%most^secure*method-but@it-will_encrypted_by_the_os*(typically)';

  // Attempt to secure it via OS
  if (safeStorage.isEncryptionAvailable()) {
    try {
      const encryptedBuffer = safeStorage.encryptString(rawKey);
      return encryptedBuffer.toString('hex');
    } catch (err) {
      // console.error('Failed to encrypt with safeStorage:', err);
      return rawKey;
    }
  } else {
    // console.log('safeStorage encryption not available, using raw key');
    return rawKey;
  }
};

interface StoredCredentials {
  username: string;
  password: string;
  timestamp: number;
}

interface AuthCredentials {
  username: string;
  password: string;
  remember: boolean;
}

interface AuthChallenge {
  id: string;
  url: string;
  realm?: string;
  timestamp: number;
  resolve: (credentials: AuthCredentials | null) => void;
}

@singleton()
export class BasicAuthManager implements IInitializable {
  private store: Store<Record<string, StoredCredentials>>;
  private activeChallenges: Map<string, AuthChallenge> = new Map();
  private windowManager?: any;
  private httpClient: SecureHttpClient;

  constructor() {
    const encryptionKey = getEncryptionKey();
    this.store = new Store<Record<string, StoredCredentials>>({
      name: 'basic-auth-credentials',
      encryptionKey,
      defaults: {},
    });
    this.httpClient = new SecureHttpClient();
  }

  async initialize(): Promise<void> {
    // Clean up expired credentials (older than 30 days)
    this.cleanupExpiredCredentials();

    // Start periodic cleanup of expired challenges
    setInterval(() => this.cleanupExpiredChallenges(), 60000); // Every minute
  }

  private cleanupExpiredCredentials(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const allCredentials = this.store.store;

    for (const [url, creds] of Object.entries(allCredentials)) {
      if (creds.timestamp < thirtyDaysAgo) {
        this.store.delete(url);
      }
    }
  }

  private cleanupExpiredChallenges(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5 minute timeout

    for (const [id, challenge] of this.activeChallenges.entries()) {
      if (challenge.timestamp < fiveMinutesAgo) {
        // Resolve with null to indicate timeout/cancellation
        challenge.resolve(null);
        this.activeChallenges.delete(id);
      }
    }
  }

  private generateChallengeId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getHostFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.host;
    } catch {
      return url;
    }
  }

  async requiresAuthentication(
    url: string,
    realm?: string
  ): Promise<{ challengeId: string; credentials?: AuthCredentials }> {
    const host = this.getHostFromUrl(url);

    // Check if we have stored credentials first
    const stored = this.getStoredCredentials(url);
    if (stored) {
      console.log(`[BasicAuthManager] Using stored credentials for ${host}`);
      return {
        challengeId: '',
        credentials: {
          username: stored.username,
          password: stored.password,
          remember: true,
        },
      };
    }

    console.log(`[BasicAuthManager] No stored credentials for ${host}, creating auth challenge`);

    // Create new authentication challenge and trigger login window
    const challengeId = this.createAuthChallenge(url, realm);

    // Create login window via WindowManager
    if (this.windowManager) {
      this.windowManager.createLoginWindow(challengeId).catch((error: any) => {
        console.error(`[BasicAuthManager] Error creating login window:`, error);
        this.resolveChallenge(challengeId, null);
      });
    }

    // Return challenge ID so WindowManager can track the validation
    return { challengeId };
  }

  // Wait for challenge to be resolved by user input and validation
  async awaitChallengeCredentials(challengeId: string): Promise<AuthCredentials | null> {
    if (!challengeId) {
      return null;
    }

    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge) {
      console.log(`[BasicAuthManager] Challenge ${challengeId} not found for await`);
      return null;
    }

    return new Promise((resolve) => {
      challenge.resolve = resolve;
    });
  }

  setWindowManager(windowManager: any): void {
    this.windowManager = windowManager;
  }

  createAuthChallenge(url: string, realm?: string): string {
    const challengeId = this.generateChallengeId();

    const challenge: AuthChallenge = {
      id: challengeId,
      url,
      realm,
      timestamp: Date.now(),
      resolve: () => {}, // Will be set when the challenge is awaited
    };

    this.activeChallenges.set(challengeId, challenge);
    console.log(`[BasicAuthManager] Created auth challenge ${challengeId} for ${url}`);

    return challengeId;
  }

  async awaitChallengeResolution(challengeId: string): Promise<AuthCredentials | null> {
    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge) {
      console.log(`[BasicAuthManager] Challenge ${challengeId} not found`);
      return null;
    }

    return new Promise((resolve) => {
      // Update the challenge's resolve function
      challenge.resolve = resolve;
    });
  }

  getChallengeDetails(challengeId: string): { url: string; realm?: string } | null {
    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge) {
      return null;
    }

    return {
      url: challenge.url,
      realm: challenge.realm,
    };
  }

  /**
   * Validate credentials with the server before storing them
   * @param url - The URL to test against
   * @param username - Username for Basic Auth
   * @param password - Password for Basic Auth
   * @returns Object with validation result and optional status/error
   */
  async validateCredentialsWithServer(
    url: string,
    username: string,
    password: string
  ): Promise<{ valid: boolean; status?: number; error?: string }> {
    try {
      console.log(`[BasicAuthManager] Validating credentials for ${url}`);
      const result = await this.httpClient.testBasicAuth(url, username, password);

      console.log(
        `[BasicAuthManager] Validation result: ${result.success ? 'SUCCESS' : 'FAILED'} (status ${result.status})`
      );

      return {
        valid: result.success,
        status: result.status,
      };
    } catch (error: any) {
      console.error(`[BasicAuthManager] Credential validation error for ${url}:`, error.message);
      return {
        valid: false,
        error: error.message || 'Validation failed',
      };
    }
  }

  // Simple challenge resolution - validates credentials with server before storing
  async resolveChallenge(
    challengeId: string,
    credentials: AuthCredentials | null
  ): Promise<boolean> {
    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge) {
      console.log(`[BasicAuthManager] Cannot resolve challenge ${challengeId}: not found`);
      return false;
    }

    if (credentials) {
      // VALIDATE CREDENTIALS WITH SERVER FIRST
      const validation = await this.validateCredentialsWithServer(
        challenge.url,
        credentials.username,
        credentials.password
      );

      if (!validation.valid) {
        // Don't store invalid credentials
        console.log(
          `[BasicAuthManager] Invalid credentials for ${challenge.url} (status: ${validation.status || 'unknown'})`
        );
        // DON'T resolve the challenge - keep it active so user can retry
        // DON'T delete the challenge - it stays active
        return false;
      }

      // Only store if validation succeeded AND user wants to remember
      if (credentials.remember) {
        console.log(`[BasicAuthManager] Storing validated credentials for ${challenge.url}`);
        this.storeCredentials(challenge.url, credentials.username, credentials.password);
      }

      console.log(
        `[BasicAuthManager] Challenge ${challengeId} resolved with validated credentials`
      );
      challenge.resolve(credentials);
      this.activeChallenges.delete(challengeId);
    } else {
      // User explicitly cancelled
      console.log(`[BasicAuthManager] Challenge ${challengeId} cancelled by user`);
      challenge.resolve(null);
      this.activeChallenges.delete(challengeId);
    }

    return true;
  }

  storeCredentials(url: string, username: string, password: string): void {
    const host = this.getHostFromUrl(url);
    this.store.set(host, {
      username,
      password,
      timestamp: Date.now(),
    });
    console.log(`[BasicAuthManager] Stored credentials for ${host}`);
  }

  getStoredCredentials(url: string): StoredCredentials | null {
    const host = this.getHostFromUrl(url);
    const credentials = this.store.get(host);

    if (credentials) {
      console.log(`[BasicAuthManager] Found stored credentials for ${host}`);
      return credentials;
    }

    console.log(`[BasicAuthManager] No stored credentials found for ${host}`);
    return null;
  }

  clearStoredCredentials(url?: string): void {
    if (url) {
      const host = this.getHostFromUrl(url);
      this.store.delete(host);
      console.log(`[BasicAuthManager] Cleared credentials for ${host}`);
    } else {
      this.store.clear();
      console.log(`[BasicAuthManager] Cleared all stored credentials`);
    }
  }

  getAllStoredHosts(): string[] {
    return Object.keys(this.store.store);
  }

  validateCredentials(url: string, username: string, password: string): boolean {
    const stored = this.getStoredCredentials(url);
    if (!stored) {
      return false;
    }
    return stored.username === username && stored.password === password;
  }
}

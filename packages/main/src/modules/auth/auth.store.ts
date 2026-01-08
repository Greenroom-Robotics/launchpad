import { singleton } from 'tsyringe';
import Store from 'electron-store';
import { safeStorage } from 'electron';
import type { StoredCredentials } from '@app/shared';

const getEncryptionKey = () => {
  const rawKey =
    'clealy!this@is#not$the%most^secure*method-but@it-will_encrypted_by_the_os*(typically)';

  // Attempt to secure it via OS
  if (safeStorage.isEncryptionAvailable()) {
    try {
      const encryptedBuffer = safeStorage.encryptString(rawKey);
      return encryptedBuffer.toString('hex');
    } catch {
      // console.error('Failed to encrypt with safeStorage:', err);
      return rawKey;
    }
  } else {
    // console.log('safeStorage encryption not available, using raw key');
    return rawKey;
  }
};

@singleton()
export class AuthStore {
  private store: Store<Record<string, StoredCredentials>>;

  constructor() {
    const encryptionKey = getEncryptionKey();
    this.store = new Store<Record<string, StoredCredentials>>({
      name: 'basic-auth-credentials',
      encryptionKey,
      defaults: {},
    });

    // Clean up expired credentials on initialization
    this.cleanupExpiredCredentials();
  }

  storeCredentials(url: string, username: string, password: string): void {
    const host = this.getHostFromUrl(url);
    this.store.set(host, {
      username,
      password,
      timestamp: Date.now(),
    });
    console.log(`[AuthStore] Stored credentials for ${host}`);
  }

  getStoredCredentials(url: string): StoredCredentials | null {
    const host = this.getHostFromUrl(url);
    const credentials = this.store.get(host);

    if (credentials) {
      console.log(`[AuthStore] Found stored credentials for ${host}`);
      return credentials;
    }

    console.log(`[AuthStore] No stored credentials found for ${host}`);
    return null;
  }

  clearStoredCredentials(url?: string): void {
    if (url) {
      const host = this.getHostFromUrl(url);
      this.store.delete(host);
      console.log(`[AuthStore] Cleared credentials for ${host}`);
    } else {
      this.store.clear();
      console.log(`[AuthStore] Cleared all stored credentials`);
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

  private cleanupExpiredCredentials(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const allCredentials = this.store.store;

    for (const [url, creds] of Object.entries(allCredentials)) {
      if (creds.timestamp < thirtyDaysAgo) {
        this.store.delete(url);
      }
    }
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

import axios, { AxiosInstance } from 'axios';
import https from 'https';

export class SecureHttpClient {
  private instance: AxiosInstance;

  constructor() {
    // Create HTTPS agent that bypasses SSL certificate validation
    // This is necessary for offline environments with self-signed certificates
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // Bypass SSL validation
      requestCert: false,
    });

    this.instance = axios.create({
      httpsAgent,
      validateStatus: () => true, // Don't throw on any status code
      timeout: 10000, // 10 second default timeout
    });
  }

  /**
   * Test Basic Authentication credentials against a server
   * @param url - The URL to test against
   * @param username - Username for Basic Auth
   * @param password - Password for Basic Auth
   * @returns Object with success status and HTTP status code
   */
  async testBasicAuth(
    url: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; status: number }> {
    try {
      const response = await this.instance.get(url, {
        auth: { username, password },
        timeout: 5000, // 5 second timeout for auth testing
      });

      return {
        success: response.status >= 200 && response.status < 400,
        status: response.status,
      };
    } catch (error: any) {
      console.error(`[SecureHttpClient] Auth test failed for ${url}:`, error.message);
      // If request fails completely, return error status
      return {
        success: false,
        status: error.response?.status || 0,
      };
    }
  }

  /**
   * Check connectivity to a given URL
   * @param url - The URL to check
   * @returns Object with connection status and optional error message
   */
  async checkConnectivity(
    url: string
  ): Promise<{ connected: boolean; status?: number; error?: string }> {
    try {
      const response = await this.instance.head(url, { timeout: 5000 });

      return {
        connected: true,
        status: response.status,
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}

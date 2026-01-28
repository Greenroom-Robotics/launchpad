import { singleton } from 'tsyringe';
import { Bonjour, type Service, type Browser } from 'bonjour-service';
import type { ApplicationInstance } from '@app/shared';

// Product type to service type mapping
const SERVICE_TYPES = {
  gama: '_gama._tcp',
  lookout: '_lookout._tcp',
  missim: '_missim._tcp',
  marops: '_marops._tcp',
} as const;

// Human-readable product names
const PRODUCT_NAMES = {
  gama: 'GAMA',
  lookout: 'Lookout+',
  missim: 'MIS-SIM',
  marops: 'MarOps',
} as const;

type ProductType = keyof typeof SERVICE_TYPES;

export interface DiscoveredService {
  id: string;
  name: string;
  type: ProductType;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  path: string;
  url: string;
  addresses: string[];
  txt: Record<string, string>;
  // Metadata from TXT records
  vesselName?: string;
  hostname?: string;
  product?: string;
}

@singleton()
export class DiscoveryService {
  private bonjour: Bonjour | null = null;
  private browsers: Map<ProductType, Browser> = new Map();
  private discoveredServices: Map<string, DiscoveredService> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.bonjour = new Bonjour();
    this.startDiscovery();
    console.log('[DiscoveryService] mDNS discovery started');
  }

  private startDiscovery(): void {
    if (!this.bonjour) return;

    // Browse for each product type
    // bonjour-service expects type without leading underscore or ._tcp suffix
    // e.g., '_greenroom-gama._tcp' -> 'greenroom-gama'
    for (const [productType, serviceType] of Object.entries(SERVICE_TYPES)) {
      const type = serviceType.replace(/^_/, '').replace(/\._tcp$/, '');
      const browser = this.bonjour.find({ type });

      browser.on('up', (service: Service) => {
        this.handleServiceUp(productType as ProductType, service);
      });

      browser.on('down', (service: Service) => {
        this.handleServiceDown(service);
      });

      this.browsers.set(productType as ProductType, browser);
    }
  }

  private handleServiceUp(productType: ProductType, service: Service): void {
    const txt = this.parseTxtRecord(service.txt);
    const protocol = (txt.protocol === 'https' ? 'https' : 'http') as 'http' | 'https';
    const path = txt.path || '/';

    // Use the first available address, preferring IPv4
    const addresses = service.addresses || [];
    const ipv4Addresses = addresses.filter((addr) => !addr.includes(':'));
    const host = ipv4Addresses[0] || addresses[0] || service.host;

    // Get hostname from service.host (e.g., "hostname.local") - strip .local suffix
    // Can be overridden by TXT record
    const defaultHostname = service.host?.replace(/\.local\.?$/, '') || host;
    const hostname = txt.hostname || defaultHostname;

    // Extract metadata from TXT records
    const vesselName = txt.vessel_name || txt.vesselName || txt.vessel;
    const product = txt.product || PRODUCT_NAMES[productType];

    // Replace Avahi %h placeholder with actual hostname
    const serviceName = service.name?.replace(/%h/g, hostname);

    // Generate a unique ID for this service instance
    const id = `discovered-${productType}-${serviceName}-${host}`
      .toLowerCase()
      .replace(/\s+/g, '-');

    const url = `${protocol}://${host}:${service.port}${path}`;

    const discoveredService: DiscoveredService = {
      id,
      name: serviceName || `${PRODUCT_NAMES[productType]} on ${hostname}`,
      type: productType,
      host,
      port: service.port,
      protocol,
      path,
      url,
      addresses,
      txt,
      // Metadata
      vesselName,
      hostname,
      product,
    };

    this.discoveredServices.set(id, discoveredService);
    console.log(`[DiscoveryService] Service discovered: ${discoveredService.name} at ${url}`);
    this.notifyListeners();
  }

  private handleServiceDown(service: Service): void {
    // Find and remove the service by matching name and host
    for (const [id, discovered] of this.discoveredServices) {
      if (discovered.name === service.name || discovered.host === service.host) {
        this.discoveredServices.delete(id);
        console.log(`[DiscoveryService] Service removed: ${discovered.name}`);
        this.notifyListeners();
        break;
      }
    }
  }

  private parseTxtRecord(txt: unknown): Record<string, string> {
    const result: Record<string, string> = {};

    if (Array.isArray(txt)) {
      // Array of Buffer or string
      for (const item of txt) {
        const str = Buffer.isBuffer(item) ? item.toString() : String(item);
        const [key, ...valueParts] = str.split('=');
        if (key) {
          result[key] = valueParts.join('=');
        }
      }
    } else if (txt && typeof txt === 'object') {
      // Object format
      for (const [key, value] of Object.entries(txt)) {
        result[key] = Buffer.isBuffer(value) ? value.toString() : String(value);
      }
    }

    return result;
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Get all discovered services
   */
  getDiscoveredServices(): DiscoveredService[] {
    return Array.from(this.discoveredServices.values());
  }

  /**
   * Convert discovered services to ApplicationInstance format
   */
  getDiscoveredApplications(): ApplicationInstance[] {
    return this.getDiscoveredServices().map((service) => ({
      id: service.id,
      name: service.name,
      type: service.type,
      url: service.url,
      description: `Discovered via mDNS at ${service.host}:${service.port}`,
      enabled: true,
      vesselName: service.vesselName,
    }));
  }

  /**
   * Subscribe to discovery changes
   */
  onDiscoveryChange(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Force a refresh by restarting all browsers
   */
  refresh(): void {
    console.log('[DiscoveryService] Refreshing discovery...');
    this.stopDiscovery();
    this.discoveredServices.clear();
    this.startDiscovery();
  }

  private stopDiscovery(): void {
    for (const browser of this.browsers.values()) {
      browser.stop();
    }
    this.browsers.clear();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopDiscovery();
    if (this.bonjour) {
      this.bonjour.destroy();
      this.bonjour = null;
    }
    this.listeners.clear();
  }
}

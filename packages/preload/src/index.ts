import { sha256sum } from './nodeCrypto.js';
import { versions } from './versions.js';
import { ipcRenderer } from 'electron';

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

// Configuration API
const config = {
  getApplications: () => ipcRenderer.invoke('config:getApplications'),
  setApplications: (applications: any[]) =>
    ipcRenderer.invoke('config:setApplications', applications),
  getConfig: () => ipcRenderer.invoke('config:getConfig'),
  setConfig: (config: any) => ipcRenderer.invoke('config:setConfig', config),
  resetToDefault: () => ipcRenderer.invoke('config:resetToDefault'),
};

// Application API
const app = {
  openApplication: (url: string, name: string) =>
    ipcRenderer.invoke('app:openApplication', { url, name }),
  checkConnectivity: (url: string) => ipcRenderer.invoke('app:checkConnectivity', url),
};

export { sha256sum, versions, send, config, app };

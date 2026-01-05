export interface ApplicationInstance {
  id: string;
  name: string;
  type: 'gama' | 'lookout' | 'marops' | 'missim';
  url: string;
  description?: string;
  enabled: boolean;
}

export interface LaunchpadConfig {
  applications: ApplicationInstance[];
}

export const defaultConfig: LaunchpadConfig = {
  applications: [
    {
      id: 'gama-local',
      name: 'GAMA',
      type: 'gama',
      url: 'http://localhost:3000',
      enabled: true,
    },
    {
      id: 'lookout-local',
      name: 'Lookout+',
      type: 'lookout',
      url: 'http://localhost:4000',
      enabled: true,
    },
    {
      id: 'marops-local',
      name: 'MarOps',
      type: 'marops',
      url: 'http://localhost:7000',
      enabled: true,
    },
    {
      id: 'missim-local',
      name: 'MIS-SIM',
      type: 'missim',
      url: 'http://localhost:5000',
      enabled: true,
    },
  ],
};

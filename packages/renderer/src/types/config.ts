import type { RJSFSchema } from "@greenroom-robotics/alpha.schema-form";

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

export const applicationConfigSchema: RJSFSchema = {
  "type": "object",
  "properties": {
    "applications": {
      "type": "array",
      "title": "Application",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "title": "ID",
            "description": "Unique identifier for this application instance"
          },
          "name": {
            "type": "string",
            "title": "Display Name",
            "description": "Name to show in the launcher"
          },
          "type": {
            "type": "string",
            "title": "Application Type",
            "enum": ["gama", "lookout", "marops", "missim"],
            "enumNames": ["GAMA", "Lookout+", "MarOps", "MIS-SIM"] as any
          },
          "url": {
            "type": "string",
            "format": "uri",
            "title": "URL",
            "description": "Full URL including protocol and port (e.g., http://localhost:3000)"
          },
          "description": {
            "type": "string",
            "title": "Description",
            "description": "Optional description for this instance"
          },
          "enabled": {
            "type": "boolean",
            "title": "Enabled",
            "default": true,
            "description": "Whether this application should be shown in the launcher"
          }
        },
        "required": ["id", "name", "type", "url"]
      }
    }
  },
  "required": ["applications"]
};

export const defaultConfig: LaunchpadConfig = {
  applications: [
    {
      id: 'gama-local',
      name: 'GAMA',
      type: 'gama',
      url: 'http://localhost:3000',
      enabled: true
    },
    {
      id: 'lookout-local',
      name: 'Lookout+',
      type: 'lookout',
      url: 'http://localhost:4000',
      enabled: true
    },
    {
      id: 'marops-local',
      name: 'MarOps',
      type: 'marops',
      url: 'http://localhost:7000',
      enabled: true
    },
    {
      id: 'missim-local',
      name: 'MIS-SIM',
      type: 'missim',
      url: 'http://localhost:5000',
      enabled: true
    }
  ]
};
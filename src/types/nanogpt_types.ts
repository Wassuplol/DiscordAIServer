// DYNAMIC MODEL BOT - ZERO HARDCODED VALUES
// All model data fetched live from NanoGPT API

export interface NanoGPTModel {
  id: string;
  name: string;
  capabilities: string[];
  context_window?: number;
  max_resolution?: string;
}

export interface ServerStructure {
  name: string;
  categories: {
    name: string;
    channels: {
      name: string;
      type: 'text' | 'voice';
    }[];
  }[];
  roles: {
    name: string;
    permissions: string;
  }[];
}
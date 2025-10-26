export interface Pin {
  id: number;
  label: string;
  color: string;
  function: string;
}

export interface Connector {
  id: string;
  name: string;
  type: 'ESC' | 'FC';
  pinCount: number;
  pins: Pin[];
}

export interface PinMapping {
  escPin: number;
  fcPin: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  escConnector: Connector;
  fcConnector: Connector;
  mappings: PinMapping[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  escConnector: Connector | null;
  fcConnector: Connector | null;
  mappings: PinMapping[];
  presets: Preset[];
  selectedPreset: string | null;
}

export const PIN_FUNCTIONS = [
  'Power (+)',
  'Ground (-)',
  'Signal',
  'Telemetry',
  'Data',
  'Motor 1',
  'Motor 2',
  'Motor 3',
  'Motor 4',
  'NC (Not Connected)',
  'Custom'
] as const;

export const PIN_COLORS = [
  '#ef4444', // red
  '#000000', // black
  '#ffffff', // white
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280'  // gray
] as const;

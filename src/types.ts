export interface TelemetryPoint {
  time: number; // relative second or timestamp
  bpm: number;
  hrv: number;
}

export type StressTierLevel = 1 | 2 | 3 | 4 | 5;

export interface MonitoredApp {
  id: string;
  name: string;
  domain: string;
  quotaMinutes: number;
  elapsedSeconds: number;
  status: 'idle' | 'active' | 'breached';
}

export interface OutboundLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'init' | 'telemetry' | 'stress' | 'distract' | 'reset' | 'ping' | 'config';
}

export type ClinicalProtocolId =
  | 'boxBreathing'
  | 'sensoryGrounding'
  | 'ocularReset'
  | 'vagusNerve'
  | 'postureHydration';

export interface ESP32ActuatorState {
  ledText: string;
  ledColor: 'green' | 'amber' | 'red';
  motorText: string;
  motorActive: boolean;
}

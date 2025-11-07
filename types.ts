export enum VitalSignType {
  HeartRate = 'Heart Rate',
  BloodPressure = 'Blood Pressure',
  Temperature = 'Temperature',
  OxygenSaturation = 'Oxygen Saturation',
}

export interface VitalReading<T> {
  timestamp: Date;
  value: T;
}

export interface BloodPressureValue {
  systolic: number;
  diastolic: number;
}

export type VitalsHistory = {
  [VitalSignType.HeartRate]: VitalReading<number>[];
  [VitalSignType.BloodPressure]: VitalReading<BloodPressureValue>[];
  [VitalSignType.Temperature]: VitalReading<number>[];
  [VitalSignType.OxygenSaturation]: VitalReading<number>[];
};

export interface Patient {
  name: string;
  age: number;
  vitals: VitalsHistory;
}

export interface FeatureIdea {
  name: string;
  description: string;
}

export interface HealthInsight {
  summary: string;
  recommendations: string[];
}

export interface NewVitalData {
  heartRate: number;
  systolic: number;
  diastolic: number;
  temperature: number;
  oxygenSaturation: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'info';
  message: string;
  timestamp: string;
}

export interface MedicationReminder {
  id: string;
  medication: string;
  dosage: string;
  time: string;
}

export interface ChatMessage {
  id: string;
  sender: 'Caregiver' | 'Medical Team';
  text: string;
  timestamp: string;
}

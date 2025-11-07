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
  medicalHistory: string;
  medicalSummary: {
    conditions: string[];
    allergies: string[];
  };
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

export interface ConsultationSummary {
  keyObservations: string[];
  suggestedQuestions: string[];
}

export interface SmartAlert {
  id: string;
  severity: 'Observation' | 'Warning';
  finding: string;
  context: string;
  timestamp: string;
}

export interface DailyLogEntry {
  id: string;
  type: 'meal' | 'activity';
  description: string;
  timestamp: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

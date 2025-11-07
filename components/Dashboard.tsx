import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { VitalSignType, Patient, BloodPressureValue, VitalsHistory, NewVitalData } from '../types.ts';
import VitalsCard from './VitalsCard.tsx';
import VitalsChart from './VitalsChart.tsx';
import HealthInsights from './HealthInsights.tsx';
import ManualEntryModal from './ManualEntryModal.tsx';
import NfcCapture from './NfcCapture.tsx';
import VoiceEntryModal from './VoiceEntryModal.tsx';

type TimeRange = '24h' | '7d' | '30d';

const NORMAL_RANGES = {
  [VitalSignType.HeartRate]: { min: 60, max: 100 },
  [VitalSignType.BloodPressure]: { systolic: { min: 90, max: 140 }, diastolic: { min: 60, max: 90 } },
  [VitalSignType.Temperature]: { min: 36.1, max: 37.2 },
  [VitalSignType.OxygenSaturation]: { min: 95, max: 100 },
};

const isVitalCritical = (type: VitalSignType, value: any): boolean => {
  try {
    switch (type) {
      case VitalSignType.HeartRate:
        return value < NORMAL_RANGES[type].min || value > NORMAL_RANGES[type].max;
      case VitalSignType.BloodPressure:
        return value.systolic < NORMAL_RANGES[type].systolic.min || value.systolic > NORMAL_RANGES[type].systolic.max ||
               value.diastolic < NORMAL_RANGES[type].diastolic.min || value.diastolic > NORMAL_RANGES[type].diastolic.max;
      case VitalSignType.Temperature:
        return value < NORMAL_RANGES[type].min || value > NORMAL_RANGES[type].max;
      case VitalSignType.OxygenSaturation:
        return value < NORMAL_RANGES[type].min; // Only check for lower bound
      default:
        return false;
    }
  } catch(e) {
      return false;
  }
};

const generateMockData = (range: TimeRange): Patient => {
  const now = new Date();
  let count: number;
  let timeStep: number; // in milliseconds

  switch (range) {
    case '7d':
      count = 7 * 24; // hourly for 7 days
      timeStep = 60 * 60 * 1000;
      break;
    case '30d':
      count = 30;
      timeStep = 24 * 60 * 60 * 1000; // daily for 30 days
      break;
    case '24h':
    default:
      count = 24;
      timeStep = 60 * 60 * 1000; // 1 hour
      break;
  }
  
  const generateReadings = <T,>(valueFn: (i: number) => T) =>
    Array.from({ length: count }, (_, i) => ({
      timestamp: new Date(now.getTime() - (count - 1 - i) * timeStep),
      value: valueFn(i),
    }));

  return {
    name: 'Manish Sharma',
    age: 82,
    medicalHistory: "Patient has a history of hypertension (high blood pressure) managed with Lisinopril for the past 10 years. Diagnosed with Type 2 Diabetes in 2015, controlled with diet and Metformin. Reports mild arthritis in the knees. Allergic to Penicillin, which causes a rash.",
    medicalSummary: {
        conditions: ["Hypertension", "Type 2 Diabetes", "Mild Arthritis"],
        allergies: ["Penicillin"]
    },
    vitals: {
      [VitalSignType.HeartRate]: generateReadings((i) => Math.round(65 + Math.random() * 10 - 5 + Math.sin(i / 4) * 3)),
      [VitalSignType.BloodPressure]: generateReadings((i) => ({
        systolic: Math.round(125 + Math.random() * 15 - 7 + Math.sin(i / 5) * 5),
        diastolic: Math.round(80 + Math.random() * 10 - 5 + Math.sin(i / 6) * 4),
      })),
      [VitalSignType.Temperature]: generateReadings((i) => 36.5 + Math.random() * 0.8 - 0.4 + Math.sin(i / 8) * 0.2),
      [VitalSignType.OxygenSaturation]: generateReadings((i) => 96 + Math.random() * 3 - 1.5 - Math.sin(i/3) * 0.5),
    },
  };
};

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [patient, setPatient] = useState<Patient>(generateMockData(timeRange));
  const [activeVital, setActiveVital] = useState<VitalSignType>(VitalSignType.HeartRate);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  useEffect(() => {
    setPatient(prev => ({...prev, vitals: generateMockData(timeRange).vitals}));
  }, [timeRange]);

  const handleAddNewVital = useCallback((newData: NewVitalData) => {
    const timestamp = new Date();
    setPatient(prevPatient => {
        const newVitals: VitalsHistory = {
            ...prevPatient.vitals,
            [VitalSignType.HeartRate]: [
                ...prevPatient.vitals[VitalSignType.HeartRate],
                { timestamp, value: newData.heartRate }
            ],
            [VitalSignType.BloodPressure]: [
                ...prevPatient.vitals[VitalSignType.BloodPressure],
                { timestamp, value: { systolic: newData.systolic, diastolic: newData.diastolic } }
            ],
            [VitalSignType.Temperature]: [
                ...prevPatient.vitals[VitalSignType.Temperature],
                { timestamp, value: newData.temperature }
            ],
            [VitalSignType.OxygenSaturation]: [
                ...prevPatient.vitals[VitalSignType.OxygenSaturation],
                { timestamp, value: newData.oxygenSaturation }
            ],
        };
        // Sort readings to ensure chart displays correctly
        Object.values(newVitals).forEach(readings => {
            readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        });

        return { ...prevPatient, vitals: newVitals };
    });
    setIsManualModalOpen(false);
    setIsVoiceModalOpen(false);
  }, []);


  const latestVitals = useMemo(() => ({
    [VitalSignType.HeartRate]: patient.vitals[VitalSignType.HeartRate].slice(-1)[0],
    [VitalSignType.BloodPressure]: patient.vitals[VitalSignType.BloodPressure].slice(-1)[0],
    [VitalSignType.Temperature]: patient.vitals[VitalSignType.Temperature].slice(-1)[0],
    [VitalSignType.OxygenSaturation]: patient.vitals[VitalSignType.OxygenSaturation].slice(-1)[0],
  }), [patient.vitals]);

  const chartData = useMemo(() => {
    if (!patient.vitals[activeVital] || patient.vitals[activeVital].length === 0) return [];
    
    switch(activeVital) {
        case VitalSignType.BloodPressure:
            return patient.vitals[activeVital].map(r => ({
                timestamp: r.timestamp,
                systolic: r.value.systolic,
                diastolic: r.value.diastolic
            }));
        default:
            const data = patient.vitals[activeVital] as {timestamp: Date, value: number}[];
            return data.map(r => ({ timestamp: r.timestamp, value: r.value }));
    }
  }, [patient.vitals, activeVital]);

  const getTrend = (data: { value: number }[]) => {
    if (data.length < 2) return 'stable';
    const last = data[data.length - 1].value;
    const secondLast = data[data.length - 2].value;
    if (last > secondLast) return 'up';
    if (last < secondLast) return 'down';
    return 'stable';
  };
  
  const getBPTrend = (data: { value: BloodPressureValue }[]) => {
    if (data.length < 2) return 'stable';
    const last = data[data.length - 1].value.systolic;
    const secondLast = data[data.length - 2].value.systolic;
    if (last > secondLast) return 'up';
    if (last < secondLast) return 'down';
    return 'stable';
  }

  const timeRangeLabels: { [key in TimeRange]: string } = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
  };

  return (
    <section>
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{patient.name}</h2>
                <p className="text-gray-500">Age: {patient.age}</p>
            </div>
            <div className="text-right">
                <h3 className="text-sm font-semibold text-gray-600">Key Conditions</h3>
                <p className="text-sm text-gray-500">{patient.medicalSummary.conditions.join(', ')}</p>
                <h3 className="text-sm font-semibold text-gray-600 mt-1">Allergies</h3>
                <p className="text-sm text-red-500">{patient.medicalSummary.allergies.join(', ')}</p>
            </div>
        </div>
      </div>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Add Vitals</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           <button 
                onClick={() => setIsManualModalOpen(true)}
                className="w-full px-4 py-2 text-base font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
                Manual Entry
            </button>
            <button 
                onClick={() => setIsVoiceModalOpen(true)}
                className="w-full px-4 py-2 text-base font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
                Voice Entry
            </button>
            <NfcCapture onVitalsCaptured={handleAddNewVital} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <VitalsCard
          title="Heart Rate"
          value={`${latestVitals[VitalSignType.HeartRate].value}`}
          unit="bpm"
          trend={getTrend(patient.vitals[VitalSignType.HeartRate])}
          onClick={() => setActiveVital(VitalSignType.HeartRate)}
          isActive={activeVital === VitalSignType.HeartRate}
          isCritical={isVitalCritical(VitalSignType.HeartRate, latestVitals[VitalSignType.HeartRate].value)}
        />
        <VitalsCard
          title="Blood Pressure"
          value={`${latestVitals[VitalSignType.BloodPressure].value.systolic}/${latestVitals[VitalSignType.BloodPressure].value.diastolic}`}
          unit="mmHg"
          trend={getBPTrend(patient.vitals[VitalSignType.BloodPressure])}
          onClick={() => setActiveVital(VitalSignType.BloodPressure)}
          isActive={activeVital === VitalSignType.BloodPressure}
          isCritical={isVitalCritical(VitalSignType.BloodPressure, latestVitals[VitalSignType.BloodPressure].value)}
        />
        <VitalsCard
          title="Temperature"
          value={`${latestVitals[VitalSignType.Temperature].value.toFixed(1)}`}
          unit="°C"
          trend={getTrend(patient.vitals[VitalSignType.Temperature])}
          onClick={() => setActiveVital(VitalSignType.Temperature)}
          isActive={activeVital === VitalSignType.Temperature}
          isCritical={isVitalCritical(VitalSignType.Temperature, latestVitals[VitalSignType.Temperature].value)}
        />
        <VitalsCard
          title="O₂ Saturation"
          value={`${latestVitals[VitalSignType.OxygenSaturation].value.toFixed(1)}`}
          unit="%"
          trend={getTrend(patient.vitals[VitalSignType.OxygenSaturation])}
          onClick={() => setActiveVital(VitalSignType.OxygenSaturation)}
          isActive={activeVital === VitalSignType.OxygenSaturation}
          isCritical={isVitalCritical(VitalSignType.OxygenSaturation, latestVitals[VitalSignType.OxygenSaturation].value)}
        />
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-2 sm:mb-0">
                {activeVital} - {timeRangeLabels[timeRange]}
            </h3>
            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-md">
                {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            timeRange === range
                                ? 'bg-primary text-white shadow'
                                : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {timeRangeLabels[range].split(' ')[1]}
                    </button>
                ))}
            </div>
        </div>
        <VitalsChart data={chartData} vitalType={activeVital} timeRange={timeRange} />
      </div>

      <HealthInsights vitals={patient.vitals} patient={patient}/>
      
      {isManualModalOpen && (
        <ManualEntryModal 
            onClose={() => setIsManualModalOpen(false)} 
            onSave={handleAddNewVital}
        />
       )}

       {isVoiceModalOpen && (
        <VoiceEntryModal
            onClose={() => setIsVoiceModalOpen(false)}
            onSave={handleAddNewVital}
        />
       )}
    </section>
  );
};

export default Dashboard;
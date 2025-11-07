import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { VitalSignType, Patient, BloodPressureValue, VitalsHistory, NewVitalData } from '../types';
import VitalsCard from './VitalsCard';
import VitalsChart from './VitalsChart';
import HealthInsights from './HealthInsights';
import ManualEntryModal from './ManualEntryModal';
import NfcCapture from './NfcCapture';
import VoiceEntryModal from './VoiceEntryModal';

type TimeRange = '24h' | '7d' | '30d';

const generateMockData = (range: TimeRange): Patient => {
  const now = new Date();
  let count: number;
  let timeStep: number; // in milliseconds

  switch (range) {
    case '7d':
      count = 7;
      timeStep = 24 * 60 * 60 * 1000; // 1 day
      break;
    case '30d':
      count = 30;
      timeStep = 24 * 60 * 60 * 1000; // 1 day
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
    setPatient(generateMockData(timeRange));
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
        <h2 className="text-2xl font-bold text-gray-800">{patient.name}</h2>
        <p className="text-gray-500">Age: {patient.age}</p>
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
        />
        <VitalsCard
          title="Blood Pressure"
          value={`${latestVitals[VitalSignType.BloodPressure].value.systolic}/${latestVitals[VitalSignType.BloodPressure].value.diastolic}`}
          unit="mmHg"
          trend={getBPTrend(patient.vitals[VitalSignType.BloodPressure])}
          onClick={() => setActiveVital(VitalSignType.BloodPressure)}
          isActive={activeVital === VitalSignType.BloodPressure}
        />
        <VitalsCard
          title="Temperature"
          value={`${latestVitals[VitalSignType.Temperature].value.toFixed(1)}`}
          unit="°C"
          trend={getTrend(patient.vitals[VitalSignType.Temperature])}
          onClick={() => setActiveVital(VitalSignType.Temperature)}
          isActive={activeVital === VitalSignType.Temperature}
        />
        <VitalsCard
          title="O₂ Saturation"
          value={`${latestVitals[VitalSignType.OxygenSaturation].value.toFixed(1)}`}
          unit="%"
          trend={getTrend(patient.vitals[VitalSignType.OxygenSaturation])}
          onClick={() => setActiveVital(VitalSignType.OxygenSaturation)}
          isActive={activeVital === VitalSignType.OxygenSaturation}
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

      <HealthInsights vitals={patient.vitals} />
      
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
import React, { useState, useCallback, useMemo } from 'react';
import { Alert, MedicationReminder, ChatMessage, VitalSignType, Patient } from '../types.ts';
import VitalsCard from './VitalsCard.tsx';
import VitalsChart from './VitalsChart.tsx';

// --- Mock Data for the Portal ---
const mockAlerts: Alert[] = [
  { id: '1', type: 'critical', message: 'High heart rate detected: 115 bpm', timestamp: '10 mins ago' },
  { id: '2', type: 'info', message: 'Medication reminder: Aspirin 81mg', timestamp: '1 hour ago' },
  { id: '3', type: 'info', message: 'Low O2 saturation overnight: 93%', timestamp: '8 hours ago' },
];

const mockInitialReminders: MedicationReminder[] = [
  { id: 'med1', medication: 'Lisinopril', dosage: '10mg', time: '08:00 AM' },
  { id: 'med2', medication: 'Metformin', dosage: '500mg', time: '08:00 PM' },
];

const mockInitialMessages: ChatMessage[] = [
  { id: 'msg1', sender: 'Medical Team', text: 'Good morning! Just checking in on Manish. His vitals seem stable overnight.', timestamp: '9:05 AM' },
  { id: 'msg2', sender: 'Caregiver', text: 'Thanks for checking! He seems to be doing well today.', timestamp: '9:07 AM' },
];

const generatePortalMockData = (): Patient => {
  const now = new Date();
  const generateReadings = <T,>(valueFn: (i: number) => T) =>
    Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000),
      value: valueFn(i),
    }));

  return {
    name: 'Manish Sharma',
    age: 82,
    vitals: {
      [VitalSignType.HeartRate]: generateReadings((i) => Math.round(70 + Math.random() * 5)),
      [VitalSignType.BloodPressure]: generateReadings((i) => ({
        systolic: Math.round(128 + Math.random() * 8),
        diastolic: Math.round(82 + Math.random() * 5),
      })),
      [VitalSignType.Temperature]: generateReadings((i) => 36.6 + Math.random() * 0.5),
      [VitalSignType.OxygenSaturation]: generateReadings((i) => 97 + Math.random() * 2),
    },
  };
};
// --- End Mock Data ---

const CaregiverPortal: React.FC = () => {
  const [patient] = useState<Patient>(generatePortalMockData());
  const [activeVital, setActiveVital] = useState<VitalSignType>(VitalSignType.HeartRate);
  const [reminders, setReminders] = useState<MedicationReminder[]>(mockInitialReminders);
  const [messages, setMessages] = useState<ChatMessage[]>(mockInitialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [medicationForm, setMedicationForm] = useState({ medication: '', dosage: '', time: '' });

  const latestVitals = useMemo(() => ({
    [VitalSignType.HeartRate]: patient.vitals[VitalSignType.HeartRate].slice(-1)[0],
    [VitalSignType.BloodPressure]: patient.vitals[VitalSignType.BloodPressure].slice(-1)[0],
    [VitalSignType.Temperature]: patient.vitals[VitalSignType.Temperature].slice(-1)[0],
    [VitalSignType.OxygenSaturation]: patient.vitals[VitalSignType.OxygenSaturation].slice(-1)[0],
  }), [patient.vitals]);

  const chartData = useMemo(() => {
    if (activeVital === VitalSignType.BloodPressure) {
      return patient.vitals[activeVital].map(r => ({ timestamp: r.timestamp, systolic: r.value.systolic, diastolic: r.value.diastolic }));
    }
    const data = patient.vitals[activeVital] as { timestamp: Date; value: number }[];
    return data.map(r => ({ timestamp: r.timestamp, value: r.value }));
  }, [patient.vitals, activeVital]);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (medicationForm.medication && medicationForm.dosage && medicationForm.time) {
      const newReminder: MedicationReminder = {
        id: `med${Date.now()}`,
        ...medicationForm,
      };
      setReminders([...reminders, newReminder]);
      setMedicationForm({ medication: '', dosage: '', time: '' });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const userMessage: ChatMessage = {
        id: `msg${Date.now()}`,
        sender: 'Caregiver',
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, userMessage]);
      setNewMessage('');

      // Simulate a reply from the medical team
      setTimeout(() => {
        const replyMessage: ChatMessage = {
            id: `msg${Date.now() + 1}`,
            sender: 'Medical Team',
            text: 'Thank you for your message. We have received it and will get back to you shortly.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, replyMessage]);
      }, 1500);
    }
  };

  return (
    <section className="mt-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Family & Caregiver Portal</h2>

        {/* Vitals Overview */}
        <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Patient Vitals Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <VitalsCard title="Heart Rate" value={`${latestVitals[VitalSignType.HeartRate].value}`} unit="bpm" trend="stable" onClick={() => setActiveVital(VitalSignType.HeartRate)} isActive={activeVital === VitalSignType.HeartRate} />
                <VitalsCard title="Blood Pressure" value={`${latestVitals[VitalSignType.BloodPressure].value.systolic}/${latestVitals[VitalSignType.BloodPressure].value.diastolic}`} unit="mmHg" trend="stable" onClick={() => setActiveVital(VitalSignType.BloodPressure)} isActive={activeVital === VitalSignType.BloodPressure}/>
                <VitalsCard title="Temperature" value={`${latestVitals[VitalSignType.Temperature].value.toFixed(1)}`} unit="°C" trend="stable" onClick={() => setActiveVital(VitalSignType.Temperature)} isActive={activeVital === VitalSignType.Temperature}/>
                <VitalsCard title="O₂ Saturation" value={`${latestVitals[VitalSignType.OxygenSaturation].value.toFixed(1)}`} unit="%" trend="stable" onClick={() => setActiveVital(VitalSignType.OxygenSaturation)} isActive={activeVital === VitalSignType.OxygenSaturation}/>
            </div>
            <VitalsChart data={chartData} vitalType={activeVital} timeRange="24h" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alerts & Notifications */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Alerts & Notifications</h3>
            <div className="space-y-3">
              {mockAlerts.map(alert => (
                <div key={alert.id} className={`p-3 rounded-md border-l-4 ${alert.type === 'critical' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                  <p className={`font-semibold ${alert.type === 'critical' ? 'text-red-800' : 'text-blue-800'}`}>{alert.message}</p>
                  <p className={`text-sm ${alert.type === 'critical' ? 'text-red-600' : 'text-blue-600'}`}>{alert.timestamp}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Medication Reminders */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Medication Reminders</h3>
            <form onSubmit={handleAddReminder} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 items-end">
              <input type="text" placeholder="Medication" value={medicationForm.medication} onChange={e => setMedicationForm({...medicationForm, medication: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required/>
              <input type="text" placeholder="Dosage" value={medicationForm.dosage} onChange={e => setMedicationForm({...medicationForm, dosage: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required/>
              <input type="time" value={medicationForm.time} onChange={e => setMedicationForm({...medicationForm, time: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required/>
              <button type="submit" className="sm:col-span-3 w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none">Add Reminder</button>
            </form>
            <div className="space-y-2">
              {reminders.map(reminder => (
                <div key={reminder.id} className="p-3 bg-gray-50 rounded-md border flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{reminder.medication}</p>
                    <p className="text-sm text-gray-600">{reminder.dosage}</p>
                  </div>
                  <p className="text-lg font-medium text-primary">{reminder.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direct Communication */}
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Direct Communication</h3>
            <div className="bg-gray-50 p-4 rounded-lg border h-64 overflow-y-auto flex flex-col space-y-3">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'Caregiver' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xs p-3 rounded-lg ${msg.sender === 'Caregiver' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}>
                           <p>{msg.text}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-1">{msg.sender}, {msg.timestamp}</p>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex space-x-3">
                <input type="text" placeholder="Type your message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90 focus:outline-none">Send</button>
            </form>
        </div>
      </div>
    </section>
  );
};

export default CaregiverPortal;
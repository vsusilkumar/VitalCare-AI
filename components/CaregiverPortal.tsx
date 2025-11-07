import React, { useState, useMemo } from 'react';
import { ChatMessage, MedicationReminder, Patient, VitalSignType, EmergencyContact } from '../types.ts';
import VitalsCard from './VitalsCard.tsx';
import VitalsChart from './VitalsChart.tsx';
import SmartAlerts from './SmartAlerts.tsx';
import DailyLog from './DailyLog.tsx';

// --- Mock Data for the Portal ---
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
    Array.from({ length: 7 * 24 }, (_, i) => ({ // 7 days of hourly data
      timestamp: new Date(now.getTime() - (7 * 24 - 1 - i) * 60 * 60 * 1000),
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

type PortalTab = 'overview' | 'alerts' | 'log';

const CaregiverPortal: React.FC = () => {
  const [patient] = useState<Patient>(generatePortalMockData());
  const [activePortalTab, setActivePortalTab] = useState<PortalTab>('overview');
  const [activeVital, setActiveVital] = useState<VitalSignType>(VitalSignType.HeartRate);
  const [reminders, setReminders] = useState<MedicationReminder[]>(mockInitialReminders);
  const [messages, setMessages] = useState<ChatMessage[]>(mockInitialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [medicationForm, setMedicationForm] = useState({ medication: '', dosage: '', time: '' });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: 'ec1', name: 'Rohan Sharma', relationship: 'Son', phone: '123-456-7890' },
    { id: 'ec2', name: 'Dr. Priya Singh', relationship: 'Primary Doctor', phone: '098-765-4321' },
  ]);
  const [contactForm, setContactForm] = useState({ name: '', relationship: '', phone: '' });

  const latestVitals = useMemo(() => ({
    [VitalSignType.HeartRate]: patient.vitals[VitalSignType.HeartRate].slice(-1)[0],
    [VitalSignType.BloodPressure]: patient.vitals[VitalSignType.BloodPressure].slice(-1)[0],
    [VitalSignType.Temperature]: patient.vitals[VitalSignType.Temperature].slice(-1)[0],
    [VitalSignType.OxygenSaturation]: patient.vitals[VitalSignType.OxygenSaturation].slice(-1)[0],
  }), [patient.vitals]);

  const chartData = useMemo(() => {
    const dataForChart = patient.vitals[activeVital].slice(-24); // Last 24 hours
    if (activeVital === VitalSignType.BloodPressure) {
      return dataForChart.map(r => ({ timestamp: r.timestamp, systolic: r.value.systolic, diastolic: r.value.diastolic }));
    }
    const data = dataForChart as { timestamp: Date; value: number }[];
    return data.map(r => ({ timestamp: r.timestamp, value: r.value }));
  }, [patient.vitals, activeVital]);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (medicationForm.medication && medicationForm.dosage && medicationForm.time) {
      const newReminder: MedicationReminder = { id: `med${Date.now()}`, ...medicationForm };
      setReminders([...reminders, newReminder]);
      setMedicationForm({ medication: '', dosage: '', time: '' });
    }
  };
  
  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.relationship && contactForm.phone) {
        const newContact: EmergencyContact = { id: `ec-${Date.now()}`, ...contactForm };
        setEmergencyContacts([...emergencyContacts, newContact]);
        setContactForm({ name: '', relationship: '', phone: '' });
    }
  };

  const handleRemoveContact = (id: string) => {
    setEmergencyContacts(emergencyContacts.filter(contact => contact.id !== id));
  };


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const userMessage: ChatMessage = {
        id: `msg${Date.now()}`, sender: 'Caregiver', text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, userMessage]);
      setNewMessage('');
      setTimeout(() => {
        const replyMessage: ChatMessage = {
            id: `msg${Date.now() + 1}`, sender: 'Medical Team',
            text: 'Thank you for your message. We have received it and will get back to you shortly.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, replyMessage]);
      }, 1500);
    }
  };
  
  const getTabClasses = (tabName: PortalTab) => {
    const baseClasses = "whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-base focus:outline-none";
    if (activePortalTab === tabName) {
      return `${baseClasses} border-secondary text-secondary`;
    }
    return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  };

  const renderContent = () => {
    switch (activePortalTab) {
        case 'alerts':
            return <SmartAlerts patient={patient} />;
        case 'log':
            return <DailyLog vitalsHistory={patient.vitals}/>;
        case 'overview':
        default:
            return (
                <>
                 {/* Vitals Overview */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Patient Vitals Overview (Last 24h)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <VitalsCard title="Heart Rate" value={`${latestVitals[VitalSignType.HeartRate].value}`} unit="bpm" trend="stable" onClick={() => setActiveVital(VitalSignType.HeartRate)} isActive={activeVital === VitalSignType.HeartRate} />
                        <VitalsCard title="Blood Pressure" value={`${latestVitals[VitalSignType.BloodPressure].value.systolic}/${latestVitals[VitalSignType.BloodPressure].value.diastolic}`} unit="mmHg" trend="stable" onClick={() => setActiveVital(VitalSignType.BloodPressure)} isActive={activeVital === VitalSignType.BloodPressure}/>
                        <VitalsCard title="Temperature" value={`${latestVitals[VitalSignType.Temperature].value.toFixed(1)}`} unit="°C" trend="stable" onClick={() => setActiveVital(VitalSignType.Temperature)} isActive={activeVital === VitalSignType.Temperature}/>
                        <VitalsCard title="O₂ Saturation" value={`${latestVitals[VitalSignType.OxygenSaturation].value.toFixed(1)}`} unit="%" trend="stable" onClick={() => setActiveVital(VitalSignType.OxygenSaturation)} isActive={activeVital === VitalSignType.OxygenSaturation}/>
                    </div>
                    <VitalsChart data={chartData} vitalType={activeVital} timeRange="24h" />
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    {/* Direct Communication */}
                    <div>
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
                     {/* Emergency Contacts */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Emergency Contacts</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <form onSubmit={handleAddContact} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 items-end">
                                <input type="text" name="name" placeholder="Name" value={contactForm.name} onChange={handleContactFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
                                <input type="text" name="relationship" placeholder="Relationship" value={contactForm.relationship} onChange={handleContactFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
                                <input type="tel" name="phone" placeholder="Phone Number" value={contactForm.phone} onChange={handleContactFormChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
                                <button type="submit" className="sm:col-span-3 w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none">Add Contact</button>
                            </form>
                            <div className="space-y-3">
                                {emergencyContacts.map(contact => (
                                    <div key={contact.id} className="p-3 bg-white rounded-md border flex justify-between items-center animate-fade-in">
                                        <div>
                                            <p className="font-semibold text-gray-800">{contact.name}</p>
                                            <p className="text-sm text-gray-500">{contact.relationship}</p>
                                            <p className="text-sm text-gray-600 mt-1">{contact.phone}</p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <a href={`tel:${contact.phone}`} aria-label={`Call ${contact.name}`} className="p-2 bg-secondary text-white rounded-full hover:bg-opacity-90 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                </svg>
                                            </a>
                                            <button onClick={() => handleRemoveContact(contact.id)} aria-label={`Remove ${contact.name}`} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                   <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
              </>
            )
    }
  }

  return (
    <section className="mt-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Family & Caregiver Portal</h2>

        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Portal Tabs">
                <button onClick={() => setActivePortalTab('overview')} className={getTabClasses('overview')}>Overview</button>
                <button onClick={() => setActivePortalTab('alerts')} className={getTabClasses('alerts')}>AI Smart Alerts</button>
                <button onClick={() => setActivePortalTab('log')} className={getTabClasses('log')}>Daily Log & Insights</button>
            </nav>
        </div>
        
        <div>{renderContent()}</div>

      </div>
    </section>
  );
};

export default CaregiverPortal;
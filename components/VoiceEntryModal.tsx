import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NewVitalData } from '../types.ts';
import { parseVitalsFromText } from '../services/geminiService.ts';
import Spinner from './Spinner.tsx';

interface VoiceEntryModalProps {
  onClose: () => void;
  onSave: (data: NewVitalData) => void;
}

// Fix: Cast window to any to access non-standard SpeechRecognition APIs.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

const InputField: React.FC<{ label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, type?: string, required?: boolean }> = 
({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input id={id} name={id} {...props} type={props.type || "number"} required={props.required !== false} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
    </div>
);


const VoiceEntryModal: React.FC<VoiceEntryModalProps> = ({ onClose, onSave }) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'result' | 'error'>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [formData, setFormData] = useState({
    heartRate: '',
    systolic: '',
    diastolic: '',
    temperature: '',
    oxygenSaturation: '',
  });
  const [error, setError] = useState('');
  
  // Fix: Use 'any' for the SpeechRecognition instance type as it's not available in default TS lib.
  const recognition = useRef<any | null>(null);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
        setError("Voice recognition is not supported in this browser. Please try Chrome or Safari.");
        setStatus('error');
        return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
        let finalTranscript = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interim += event.results[i][0].transcript;
            }
        }
        setInterimTranscript(interim);
        if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript + ' ');
        }
    };

    rec.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setStatus('error');
    };

    rec.onend = () => {
        if (status === 'listening') {
            handleProcessing();
        }
    };

    recognition.current = rec;
  }, [status]); // Re-create if status changes, might need to refine this dependency

  const handleToggleListening = () => {
    if (status === 'listening') {
        recognition.current?.stop();
        // onend will trigger processing
    } else {
        setTranscript('');
        setInterimTranscript('');
        setError('');
        setFormData({ heartRate: '', systolic: '', diastolic: '', temperature: '', oxygenSaturation: '' });
        setStatus('listening');
        recognition.current?.start();
    }
  };
  
  const handleProcessing = async () => {
    setStatus('processing');
    if (!transcript.trim()) {
      setError("No speech detected. Please try again.");
      setStatus('error');
      return;
    }
    try {
      const parsedData = await parseVitalsFromText(transcript);
      setFormData({
          heartRate: parsedData.heartRate?.toString() || '',
          systolic: parsedData.systolic?.toString() || '',
          diastolic: parsedData.diastolic?.toString() || '',
          temperature: parsedData.temperature?.toString() || '',
          oxygenSaturation: parsedData.oxygenSaturation?.toString() || '',
      });
      setStatus('result');
    } catch(err: any) {
      setError(err.message || "Failed to process the transcript.");
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { heartRate, systolic, diastolic, temperature, oxygenSaturation } = formData;
    
    if (!heartRate || !systolic || !diastolic || !temperature || !oxygenSaturation) {
        setError("All fields are required before saving.");
        return;
    }

    const vitalData: NewVitalData = {
      heartRate: parseFloat(heartRate),
      systolic: parseFloat(systolic),
      diastolic: parseFloat(diastolic),
      temperature: parseFloat(temperature),
      oxygenSaturation: parseFloat(oxygenSaturation),
    };
    
    if (Object.values(vitalData).some(isNaN)) {
        setError("Please ensure all fields contain valid numbers.");
        return;
    }
    onSave(vitalData);
  };

  const renderContent = () => {
    switch (status) {
        case 'listening':
        case 'processing':
        case 'idle':
        case 'error':
            return (
                <div className="text-center min-h-[200px] flex flex-col justify-center items-center">
                    {status === 'idle' && <p className="text-gray-500 mb-4">Click the microphone to start recording vitals.</p>}
                    {status === 'listening' && <p className="text-gray-500 mb-4 animate-pulse">Listening...</p>}
                    {status === 'processing' && (
                        <div className="flex flex-col items-center">
                           <Spinner />
                           <p className="text-gray-500 mt-4">AI is analyzing your speech...</p>
                        </div>
                    )}
                    <div className="p-2 bg-gray-100 rounded-md w-full text-left text-gray-700">
                        <p>{transcript}<span className="text-gray-400">{interimTranscript}</span></p>
                    </div>
                    {/* Fix: Removed redundant 'status !== "result"' check, which is always true in this block. */}
                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                </div>
            );
        case 'result':
            return (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Heart Rate (bpm)" id="heartRate" value={formData.heartRate} onChange={handleChange} placeholder="e.g., 75" />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Systolic (mmHg)" id="systolic" value={formData.systolic} onChange={handleChange} placeholder="e.g., 120" />
                        <InputField label="Diastolic (mmHg)" id="diastolic" value={formData.diastolic} onChange={handleChange} placeholder="e.g., 80" />
                    </div>
                    <InputField label="Temperature (°C)" id="temperature" value={formData.temperature} onChange={handleChange} placeholder="e.g., 36.8" />
                    <InputField label="O₂ Saturation (%)" id="oxygenSaturation" value={formData.oxygenSaturation} onChange={handleChange} placeholder="e.g., 98" />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </form>
            );
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-backdrop-in"
      aria-labelledby="modal-title" role="dialog" aria-modal="true" onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-2xl font-bold text-gray-800">Voice Vital Entry</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">
            {status === 'result' ? "Review the extracted data and save." : "Say the patient's vitals, e.g., 'Heart rate 75, BP 120 over 80...'"}
        </p>
        
        <div className="my-6">
            {renderContent()}
        </div>
        
        <div className="flex justify-between items-center pt-4">
            <button
                onClick={handleToggleListening}
                disabled={!isSpeechRecognitionSupported || status === 'processing'}
                className={`p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${status === 'listening' ? 'bg-red-500 text-white' : 'bg-primary text-white'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </button>
            <div className="space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit} 
                    disabled={status !== 'result'}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Save Vitals
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceEntryModal;
import React, { useState } from 'react';
import { NewVitalData } from '../types';

interface ManualEntryModalProps {
  onClose: () => void;
  onSave: (data: NewVitalData) => void;
}

const InputField: React.FC<{ label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, type?: string, required?: boolean }> = 
({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input id={id} name={id} {...props} type={props.type || "number"} required={props.required !== false} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
    </div>
);

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    heartRate: '',
    systolic: '',
    diastolic: '',
    temperature: '',
    oxygenSaturation: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { heartRate, systolic, diastolic, temperature, oxygenSaturation } = formData;
    
    if (!heartRate || !systolic || !diastolic || !temperature || !oxygenSaturation) {
        setError("All fields are required.");
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
        setError("Please enter valid numbers for all fields.");
        return;
    }

    onSave(vitalData);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-backdrop-in"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-2xl font-bold text-gray-800">Manual Vital Entry</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">Enter the latest vital readings for the patient.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Heart Rate (bpm)" id="heartRate" value={formData.heartRate} onChange={handleChange} placeholder="e.g., 75" />
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Systolic (mmHg)" id="systolic" value={formData.systolic} onChange={handleChange} placeholder="e.g., 120" />
                <InputField label="Diastolic (mmHg)" id="diastolic" value={formData.diastolic} onChange={handleChange} placeholder="e.g., 80" />
            </div>
            <InputField label="Temperature (°C)" id="temperature" value={formData.temperature} onChange={handleChange} placeholder="e.g., 36.8" />
            <InputField label="O₂ Saturation (%)" id="oxygenSaturation" value={formData.oxygenSaturation} onChange={handleChange} placeholder="e.g., 98" />
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    Save Vitals
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;

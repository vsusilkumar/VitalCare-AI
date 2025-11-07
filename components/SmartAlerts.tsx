import React, { useState, useCallback } from 'react';
import { Patient, SmartAlert } from '../types.ts';
import { getSmartAlerts } from '../services/geminiService.ts';
import Spinner from './Spinner.tsx';

interface SmartAlertsProps {
  patient: Patient;
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({ patient }) => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeVitals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAlerts([]);
    try {
      const results = await getSmartAlerts(patient.vitals, patient);
      const newAlerts = results.map((a, i) => ({
        ...a,
        id: `alert-${Date.now()}-${i}`,
        timestamp: new Date().toLocaleString(),
      }));
      setAlerts(newAlerts);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while generating smart alerts.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [patient]);
  
  const getSeverityClasses = (severity: 'Observation' | 'Warning') => {
    switch (severity) {
        case 'Warning':
            return 'bg-yellow-50 border-yellow-500 text-yellow-800';
        default:
            return 'bg-blue-50 border-blue-500 text-blue-800';
    }
  };

  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg border">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            AI-Powered Smart Alerts
          </h3>
          <p className="text-gray-600 mt-1">
            Analyze the last 7 days of data to find subtle patterns and potential issues.
          </p>
        </div>
        <button
          onClick={handleAnalyzeVitals}
          disabled={isLoading}
          className="w-full mt-4 sm:mt-0 sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-secondary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <><Spinner />Analyzing...</> : 'Check for Alerts'}
        </button>
      </div>

      {error && <p className="text-red-500 text-center my-4">{error}</p>}

      <div className="space-y-4">
        {alerts.length > 0 && (
          alerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-md border-l-4 animate-fade-in ${getSeverityClasses(alert.severity)}`}>
              <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{alert.severity}: <span className="font-medium">{alert.finding}</span></p>
                    <p className="mt-1 text-sm">{alert.context}</p>
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap ml-4">{alert.timestamp}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && alerts.length === 0 && !error && (
        <div className="text-center text-gray-500 py-12">
          <p>Click "Check for Alerts" to begin the AI analysis.</p>
          <p className="text-sm mt-1">The system will check for anomalies based on the patient's personal baseline.</p>
        </div>
      )}
    </div>
  );
};

export default SmartAlerts;

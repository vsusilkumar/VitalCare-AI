import React, { useState, useCallback } from 'react';
import { Patient, ConsultationSummary } from '../types.ts';
import { getConsultationSummary } from '../services/geminiService.ts';
import Spinner from './Spinner.tsx';

interface AiConsultationHelperProps {
  patient: Patient;
}

const AiConsultationHelper: React.FC<AiConsultationHelperProps> = ({ patient }) => {
  const [summary, setSummary] = useState<ConsultationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

  const handleGenerateSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);
    try {
      const result = await getConsultationSummary(patient.vitals, patient);
      setSummary(result);
      setIsSummaryVisible(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
      setIsSummaryVisible(false); // Hide on error to show error message
    } finally {
      setIsLoading(false);
    }
  }, [patient]);

  const handleHide = () => {
    setIsSummaryVisible(false);
    setSummary(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 text-center bg-gray-50 rounded-lg border animate-fade-in">
        <div className="flex justify-center items-center">
          <Spinner className="text-secondary" />
          <p className="ml-2 text-gray-600">Analyzing patient data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 text-center bg-red-50 rounded-lg border border-red-200 animate-fade-in">
        <p className="font-semibold text-red-700">Analysis Failed</p>
        <p className="text-sm text-red-600 mt-1">{error}</p>
        <div className="mt-4 space-x-2">
          <button onClick={handleHide} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            Close
          </button>
          <button onClick={handleGenerateSummary} className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isSummaryVisible && summary) {
    return (
      <div className="w-full p-6 bg-light rounded-lg border border-gray-200 shadow-sm animate-fade-in">
        <h3 className="text-xl font-bold text-gray-800 mb-4">AI Consultation Summary</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h5 className="font-semibold text-gray-700 mb-1">Key Observations</h5>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {summary.keyObservations.map((obs, i) => <li key={i}>{obs}</li>)}
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-gray-700 mb-1">Suggested Questions</h5>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {summary.suggestedQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t flex justify-end space-x-2">
          <button onClick={handleHide} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            Hide Summary
          </button>
          <button onClick={handleGenerateSummary} className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={handleGenerateSummary}
        className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-secondary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
      >
        Get AI Consultation Summary
      </button>
    </div>
  );
};

export default AiConsultationHelper;

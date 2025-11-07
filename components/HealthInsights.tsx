import React, { useState, useCallback } from 'react';
import { VitalsHistory, HealthInsight } from '../types';
import { getHealthInsights } from '../services/geminiService';
import Spinner from './Spinner';

interface HealthInsightsProps {
  vitals: VitalsHistory;
}

const HealthInsights: React.FC<HealthInsightsProps> = ({ vitals }) => {
  const [insights, setInsights] = useState<HealthInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeVitals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);
    try {
      const result = await getHealthInsights(vitals);
      setInsights(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while analyzing vitals.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [vitals]);

  return (
    <section className="mt-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
            Personalized AI Health Insights
          </h2>
          <button
            onClick={handleAnalyzeVitals}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-secondary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Spinner />
                Analyzing...
              </>
            ) : (
              'Analyze Vitals'
            )}
          </button>
        </div>

        {error && <p className="text-red-500 text-center my-4">{error}</p>}

        {insights && (
          <div className="mt-6 animate-fade-in">
            <div className="bg-light p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-secondary">Summary</h3>
              <p className="mt-2 text-gray-700">{insights.summary}</p>
            </div>
            <div className="mt-4 bg-light p-5 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-secondary">Recommendations</h3>
              <ul className="mt-2 list-disc list-inside space-y-1 text-gray-700">
                {insights.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!isLoading && !insights && !error && (
            <div className="text-center text-gray-500 py-8">
                <p>Click "Analyze Vitals" to generate personalized health insights based on the last 24 hours of data.</p>
                <p className="text-sm mt-2">
                    <span className="font-semibold">Disclaimer:</span> This is not medical advice. Consult a healthcare professional for any health concerns.
                </p>
            </div>
        )}

      </div>
    </section>
  );
};

export default HealthInsights;
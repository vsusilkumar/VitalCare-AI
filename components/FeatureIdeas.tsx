import React, { useState, useCallback } from 'react';
import { getFeatureIdeas } from '../services/geminiService.ts';
import { FeatureIdea } from '../types.ts';
import Spinner from './Spinner.tsx';

const initialIdeas: FeatureIdea[] = [
  {
    name: 'Integrated Video Consultations',
    description: 'Seamlessly integrates video consultations directly from the app, automatically sharing relevant recent vital signs and trend data with the healthcare provider during the virtual visit, eliminating manual data transfer.',
  },
  {
    name: 'Secure Family & Caregiver Portal',
    description: 'A secure portal within the app enabling authorized family members and caregivers to view real-time vital data, receive personalized alerts, set medication reminders, and communicate directly with the patient or medical team.',
  },
];


const FeatureIdeas: React.FC = () => {
  const [ideas, setIdeas] = useState<FeatureIdea[]>(initialIdeas);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getFeatureIdeas();
      // Prepend new ideas to the existing ones
      setIdeas(prevIdeas => [...result, ...prevIdeas]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while generating ideas.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <section className="mt-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
            Expand VitalCare with AI
          </h2>
          <button
            onClick={handleGenerateIdeas}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Spinner />
                Generating...
              </>
            ) : (
              'Generate More Ideas'
            )}
          </button>
        </div>
        
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea, index) => (
            <div key={index} className="bg-gray-50 p-5 rounded-lg border border-gray-200 animate-fade-in">
              <h3 className="text-lg font-semibold text-primary">{idea.name}</h3>
              <p className="mt-2 text-gray-600">{idea.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureIdeas;
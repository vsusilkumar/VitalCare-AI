
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CaregiverPortal from './components/CaregiverPortal';
import VideoConsultation from './components/VideoConsultation';

type Tab = 'dashboard' | 'portal' | 'consultation';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    // Check for the API key in session storage on initial load
    const storedApiKey = sessionStorage.getItem('gemini_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    sessionStorage.setItem('gemini_api_key', newKey);
  };


  const getTabClasses = (tabName: Tab) => {
    const baseClasses = "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none";
    if (activeTab === tabName) {
      return `${baseClasses} border-primary text-primary`;
    }
    return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={getTabClasses('dashboard')}
                    aria-current={activeTab === 'dashboard' ? 'page' : undefined}
                >
                    Patient Dashboard
                </button>
                <button
                    onClick={() => setActiveTab('portal')}
                    className={getTabClasses('portal')}
                    aria-current={activeTab === 'portal' ? 'page' : undefined}
                >
                    Caregiver Portal
                </button>
                <button
                    onClick={() => setActiveTab('consultation')}
                    className={getTabClasses('consultation')}
                    aria-current={activeTab === 'consultation' ? 'page' : undefined}
                >
                    Video Consultation
                </button>
            </nav>
        </div>

        <div>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'portal' && <CaregiverPortal />}
            {activeTab === 'consultation' && <VideoConsultation />}
        </div>
        
      </main>
    </div>
  );
};

export default App;

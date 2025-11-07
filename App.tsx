import React, { useState } from 'react';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import CaregiverPortal from './components/CaregiverPortal.tsx';
import VideoConsultation from './components/VideoConsultation.tsx';

type Tab = 'dashboard' | 'portal' | 'consultation';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const getTabClasses = (tabName: Tab) => {
    const baseClasses = "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none";
    if (activeTab === tabName) {
      return `${baseClasses} border-primary text-primary`;
    }
    return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
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
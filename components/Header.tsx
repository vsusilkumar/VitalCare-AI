
import React, { useState, useEffect } from 'react';

interface HeaderProps {
    apiKey: string;
    onApiKeyChange: (key: string) => void;
}

const Header: React.FC<HeaderProps> = ({ apiKey, onApiKeyChange }) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(!!apiKey);

  useEffect(() => {
    setLocalApiKey(apiKey);
    setIsSaved(!!apiKey);
  }, [apiKey]);

  const handleSave = () => {
    onApiKeyChange(localApiKey);
    setIsSaved(true);
  };
  
  const handleEdit = () => {
      setIsSaved(false);
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <svg
              className="w-8 h-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800">
              VitalCare <span className="text-primary">AI</span>
            </h1>
          </div>
          <div className="flex items-center space-x-2">
             {isSaved ? (
                 <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600 font-medium">API Key Saved</span>
                    <button onClick={handleEdit} className="text-sm text-primary hover:underline">Edit</button>
                 </div>
             ) : (
                <>
                    <input
                        type="password"
                        placeholder="Enter Gemini API Key"
                        value={localApiKey}
                        onChange={(e) => setLocalApiKey(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button 
                        onClick={handleSave} 
                        disabled={!localApiKey}
                        className="px-3 py-1 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none disabled:bg-gray-400"
                    >
                        Save
                    </button>
                </>
             )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

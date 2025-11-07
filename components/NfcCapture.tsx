import React, { useState, useEffect, useCallback } from 'react';
import { NewVitalData } from '../types.ts';

interface NfcCaptureProps {
  onVitalsCaptured: (data: NewVitalData) => void;
}

const NfcCapture: React.FC<NfcCaptureProps> = ({ onVitalsCaptured }) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error' | 'unsupported'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [controller, setController] = useState<AbortController | null>(null);

  useEffect(() => {
    if (!('NDEFReader' in window)) {
      setStatus('unsupported');
    }
  }, []);
  
  const scan = useCallback(async () => {
    if (status === 'unsupported') return;
    
    try {
      const ndef = new (window as any).NDEFReader();
      const newController = new AbortController();
      setController(newController);
      
      setStatus('scanning');
      await ndef.scan({ signal: newController.signal });

      ndef.addEventListener('reading', ({ message }: any) => {
        try {
          const textDecoder = new TextDecoder();
          const jsonRecord = message.records.find((r: any) => r.recordType === 'text');
          if (!jsonRecord) {
              throw new Error("No text record found on NFC tag.");
          }
          const jsonData = textDecoder.decode(jsonRecord.data);
          const parsedData = JSON.parse(jsonData);

          // Basic validation
          if (
            typeof parsedData.heartRate === 'number' &&
            typeof parsedData.systolic === 'number' &&
            typeof parsedData.diastolic === 'number' &&
            typeof parsedData.temperature === 'number' &&
            typeof parsedData.oxygenSaturation === 'number'
          ) {
            onVitalsCaptured(parsedData);
            setStatus('success');
          } else {
            throw new Error("NFC data is missing required fields or has incorrect types.");
          }
        } catch(err: any) {
            setErrorMessage(err.message || 'Failed to parse NFC data.');
            setStatus('error');
        } finally {
            newController.abort();
        }
      });

      ndef.addEventListener('readingerror', () => {
        setErrorMessage('Cannot read data from the NFC tag. Try again.');
        setStatus('error');
        newController.abort();
      });

    } catch (error: any) {
        setErrorMessage(error.message || 'NFC Scan failed.');
        setStatus('error');
    }
  }, [onVitalsCaptured, status]);

  const handleButtonClick = () => {
      if (status === 'scanning' && controller) {
          controller.abort();
          setStatus('idle');
      } else {
          scan();
      }
  };

  const getButtonText = () => {
    switch (status) {
      case 'scanning': return 'Scanning... (Tap to Cancel)';
      case 'success': return 'Scan Complete!';
      case 'error': return 'Error! Retry Scan';
      case 'unsupported': return 'NFC Not Supported';
      default: return 'Scan with NFC';
    }
  };
  
  const getButtonClasses = () => {
    const base = "flex-1 px-4 py-2 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    switch (status) {
        case 'scanning': return `${base} text-white bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500`;
        case 'success': return `${base} text-white bg-green-500 cursor-default`;
        case 'error': return `${base} text-white bg-red-500 hover:bg-red-600 focus:ring-red-500`;
        case 'unsupported': return `${base} text-white bg-gray-400 cursor-not-allowed`;
        default: return `${base} text-white bg-secondary hover:bg-opacity-90 focus:ring-secondary`;
    }
  };


  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'success' || status === 'error') {
      timer = setTimeout(() => setStatus('idle'), 3000);
    }
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <>
      <button 
        onClick={handleButtonClick}
        disabled={status === 'unsupported' || status === 'success'}
        className={getButtonClasses()}
      >
        {getButtonText()}
      </button>
      {status === 'scanning' && <p className="text-sm text-gray-500 text-center col-span-full">Hold your device near an NFC tag.</p>}
      {status === 'error' && <p className="text-sm text-red-500 text-center col-span-full">{errorMessage}</p>}
      {status === 'unsupported' && <p className="text-sm text-gray-500 text-center col-span-full">Your browser does not support Web NFC. Please use a compatible browser like Chrome on Android.</p>}
    </>
  );
};

export default NfcCapture;
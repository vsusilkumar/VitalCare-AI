
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { VitalSignType, Patient } from '../types';
import VitalsCard from './VitalsCard';
import VitalsChart from './VitalsChart';

// Mock data generation specific for this component's needs
const generateMockData = (): Patient => {
  const now = new Date();
  const generateReadings = <T,>(valueFn: (i: number) => T) =>
    Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000),
      value: valueFn(i),
    }));

  return {
    name: 'Manish Sharma',
    age: 82,
    vitals: {
      [VitalSignType.HeartRate]: generateReadings((i) => Math.round(72 + Math.random() * 8 - 4)),
      [VitalSignType.BloodPressure]: generateReadings((i) => ({
        systolic: Math.round(130 + Math.random() * 10 - 5),
        diastolic: Math.round(85 + Math.random() * 6 - 3),
      })),
      [VitalSignType.Temperature]: generateReadings((i) => 36.7 + Math.random() * 0.4 - 0.2),
      [VitalSignType.OxygenSaturation]: generateReadings((i) => 96 + Math.random() * 2 - 1),
    },
  };
};

const NORMAL_RANGES = {
  [VitalSignType.HeartRate]: { min: 60, max: 100 },
  [VitalSignType.BloodPressure]: { systolic: { min: 90, max: 140 }, diastolic: { min: 60, max: 90 } },
  [VitalSignType.Temperature]: { min: 36.1, max: 37.2 },
  [VitalSignType.OxygenSaturation]: { min: 95, max: 100 },
};

const isVitalCritical = (type: VitalSignType, value: any): boolean => {
  try {
    switch (type) {
      case VitalSignType.HeartRate:
        return value < NORMAL_RANGES[type].min || value > NORMAL_RANGES[type].max;
      case VitalSignType.BloodPressure:
        return value.systolic < NORMAL_RANGES[type].systolic.min || value.systolic > NORMAL_RANGES[type].systolic.max ||
               value.diastolic < NORMAL_RANGES[type].diastolic.min || value.diastolic > NORMAL_RANGES[type].diastolic.max;
      case VitalSignType.Temperature:
        return value < NORMAL_RANGES[type].min || value > NORMAL_RANGES[type].max;
      case VitalSignType.OxygenSaturation:
        return value < NORMAL_RANGES[type].min; // Only check for lower bound
      default:
        return false;
    }
  } catch(e) {
      return false;
  }
};


const VideoConsultation: React.FC = () => {
    const [patient] = useState<Patient>(generateMockData());
    const [activeVital, setActiveVital] = useState<VitalSignType>(VitalSignType.HeartRate);
    const [callStatus, setCallStatus] = useState<'requesting' | 'active' | 'ended' | 'error'>('requesting');
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const patientVideoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // State for draggable/resizable video
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [size, setSize] = useState({ width: 480, height: 270 });
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const initialMousePos = useRef({ x: 0, y: 0 });
    const initialVideoPos = useRef({ x: 0, y: 0 });
    const initialVideoSize = useRef({ width: 0, height: 0 });

    useEffect(() => {
        const startStream = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Your browser does not support camera access.");
                }
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (patientVideoRef.current) {
                    patientVideoRef.current.srcObject = stream;
                    await patientVideoRef.current.play();
                }
                setCallStatus('active');
            } catch (err: any) {
                console.error("Error accessing media devices.", err);
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                    setError("Camera and microphone access was denied. Please allow access in your browser settings.");
                } else {
                    setError("Could not access your camera and microphone. Please check your hardware and permissions.");
                }
                setCallStatus('error');
            }
        };

        startStream();

        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleToggleMute = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(prev => !prev);
        }
    };

    const handleEndCall = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        if (patientVideoRef.current) {
            patientVideoRef.current.srcObject = null;
        }
        setCallStatus('ended');
    };

    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        initialMousePos.current = { x: e.clientX, y: e.clientY };
        initialVideoPos.current = { ...position };
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // prevent drag from starting
        setIsResizing(true);
        initialMousePos.current = { x: e.clientX, y: e.clientY };
        initialVideoSize.current = { ...size };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            const dx = e.clientX - initialMousePos.current.x;
            const dy = e.clientY - initialMousePos.current.y;
            if (videoContainerRef.current) {
                const containerRect = videoContainerRef.current.getBoundingClientRect();
                let newX = initialVideoPos.current.x + dx;
                let newY = initialVideoPos.current.y + dy;
    
                if (newX < 0) newX = 0;
                if (newY < 0) newY = 0;
                if (newX + size.width > containerRect.width) newX = containerRect.width - size.width;
                if (newY + size.height > containerRect.height) newY = containerRect.height - size.height;
                
                setPosition({ x: newX, y: newY });
            }
        }
        if (isResizing) {
            const dx = e.clientX - initialMousePos.current.x;
            let newWidth = initialVideoSize.current.width + dx;
            
            if (newWidth < 200) newWidth = 200;
            if (videoContainerRef.current) {
                const containerRect = videoContainerRef.current.getBoundingClientRect();
                if (position.x + newWidth > containerRect.width) {
                    newWidth = containerRect.width - position.x;
                }
            }
            
            const newHeight = newWidth * (9 / 16); // maintain aspect ratio
            setSize({ width: newWidth, height: newHeight });
        }
    }, [isDragging, isResizing, size.width, size.height, position.x, position.y]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);


    const latestVitals = useMemo(() => ({
        [VitalSignType.HeartRate]: patient.vitals[VitalSignType.HeartRate].slice(-1)[0],
        [VitalSignType.BloodPressure]: patient.vitals[VitalSignType.BloodPressure].slice(-1)[0],
        [VitalSignType.Temperature]: patient.vitals[VitalSignType.Temperature].slice(-1)[0],
        [VitalSignType.OxygenSaturation]: patient.vitals[VitalSignType.OxygenSaturation].slice(-1)[0],
    }), [patient.vitals]);

    const chartData = useMemo(() => {
        if (activeVital === VitalSignType.BloodPressure) {
          return patient.vitals[activeVital].map(r => ({ timestamp: r.timestamp, systolic: r.value.systolic, diastolic: r.value.diastolic }));
        }
        const data = patient.vitals[activeVital] as { timestamp: Date; value: number }[];
        return data.map(r => ({ timestamp: r.timestamp, value: r.value }));
    }, [patient.vitals, activeVital]);

    const PatientVideoFeed = () => (
        <div className="w-full h-full bg-black rounded-lg flex items-center justify-center text-white overflow-hidden">
            {callStatus !== 'active' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-sm font-semibold mt-1">You</p>
                    {callStatus === 'requesting' && <span className="text-xs text-gray-300 mt-1">Connecting...</span>}
                    {callStatus === 'error' && <span className="text-xs text-red-400 text-center mt-1">{error}</span>}
                    {callStatus === 'ended' && <span className="text-xs text-gray-300 mt-1">Call Ended</span>}
                </div>
            )}
            <video ref={patientVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${callStatus === 'active' ? '' : 'hidden'}`}></video>
        </div>
    );
    

    return (
        <section>
            <div className="bg-white p-6 rounded-lg shadow">
                 <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Video Consultation</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Video Section */}
                    <div className="lg:col-span-2">
                        <div ref={videoContainerRef} className="relative w-full aspect-video bg-gray-900 rounded-lg shadow-inner overflow-hidden">
                            
                            <div 
                                onMouseDown={handleDragStart}
                                style={{
                                    position: 'absolute',
                                    top: `${position.y}px`,
                                    left: `${position.x}px`,
                                    width: `${size.width}px`,
                                    height: `${size.height}px`,
                                }}
                                className="shadow-2xl rounded-lg"
                            >
                                <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center cursor-move relative">
                                    <div className="text-center text-gray-400 select-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        <p className="mt-2 text-lg font-semibold">Dr. Anya Sharma</p>
                                    </div>
                                    <div 
                                        onMouseDown={handleResizeStart}
                                        className="absolute bottom-0 right-0 w-5 h-5 bg-white/50 hover:bg-white rounded-tl-lg cursor-se-resize"
                                    />
                                </div>
                            </div>
                            
                            <div className="absolute bottom-4 right-4 w-1/3 min-w-[200px] aspect-video border-2 border-white rounded-md shadow-lg">
                                <PatientVideoFeed />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center space-x-4">
                            <button onClick={handleToggleMute} disabled={callStatus !== 'active'} className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">
                                {isMuted ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.083A7.002 7.002 0 004.268 11M11 5.083v-1.1A3.002 3.002 0 0114 1.996a3.001 3.001 0 012.996 3.005v.081M11 18.917A7.002 7.002 0 0017.732 13M11 18.917v1.1a3.002 3.002 0 003 2.985 3.001 3.001 0 002.996-3.005v-1.081m-6 0a3 3 0 00-3-3H5a3 3 0 00-3 3v2a3 3 0 003 3h3a3 3 0 003-3v-2zM3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                )}
                            </button>
                            <button onClick={handleEndCall} disabled={callStatus !== 'active'} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M19.992 19.34a1 1 0 01-1.12.843 14.493 14.493 0 01-7.74-3.545 14.493 14.493 0 01-3.545-7.74 1 1 0 01.843-1.12l2.095-.524a1 1 0 011.05.578l1.196 2.69a1 1 0 01-.2 1.156l-1.45 1.45a11.5 11.5 0 005.122 5.122l1.45-1.45a1 1 0 011.156-.2l2.69 1.196a1 1 0 01.578 1.05l-.524 2.095z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Vitals Sidebar */}
                    <div className="lg:col-span-1 bg-light p-4 rounded-lg border">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Patient Live Vitals</h3>
                        <div className="space-y-4 mb-6">
                            <VitalsCard title="Heart Rate" value={`${latestVitals[VitalSignType.HeartRate].value}`} unit="bpm" trend="stable" onClick={() => setActiveVital(VitalSignType.HeartRate)} isActive={activeVital === VitalSignType.HeartRate} isCritical={isVitalCritical(VitalSignType.HeartRate, latestVitals[VitalSignType.HeartRate].value)} />
                            <VitalsCard title="Blood Pressure" value={`${latestVitals[VitalSignType.BloodPressure].value.systolic}/${latestVitals[VitalSignType.BloodPressure].value.diastolic}`} unit="mmHg" trend="stable" onClick={() => setActiveVital(VitalSignType.BloodPressure)} isActive={activeVital === VitalSignType.BloodPressure} isCritical={isVitalCritical(VitalSignType.BloodPressure, latestVitals[VitalSignType.BloodPressure].value)} />
                            <VitalsCard title="Temperature" value={`${latestVitals[VitalSignType.Temperature].value.toFixed(1)}`} unit="°C" trend="stable" onClick={() => setActiveVital(VitalSignType.Temperature)} isActive={activeVital === VitalSignType.Temperature} isCritical={isVitalCritical(VitalSignType.Temperature, latestVitals[VitalSignType.Temperature].value)} />
                            <VitalsCard title="O₂ Saturation" value={`${latestVitals[VitalSignType.OxygenSaturation].value.toFixed(1)}`} unit="%" trend="stable" onClick={() => setActiveVital(VitalSignType.OxygenSaturation)} isActive={activeVital === VitalSignType.OxygenSaturation} isCritical={isVitalCritical(VitalSignType.OxygenSaturation, latestVitals[VitalSignType.OxygenSaturation].value)} />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-600 mb-2">{activeVital} - Last 24h</h4>
                        <VitalsChart data={chartData} vitalType={activeVital} timeRange="24h" />
                    </div>
                 </div>
            </div>
        </section>
    );
};

export default VideoConsultation;
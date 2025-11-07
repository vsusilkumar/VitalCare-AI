
import React from 'react';

interface VitalsCardProps {
  title: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  onClick: () => void;
  isActive: boolean;
  isCritical?: boolean;
}

const TrendIcon: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
  if (trend === 'up') {
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l.293.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>;
  }
  if (trend === 'down') {
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.707-4.293l3-3a1 1 0 00-1.414-1.414L10 10.586 8.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0z" clipRule="evenodd" /></svg>;
  }
  return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" /></svg>;
};

const VitalsCard: React.FC<VitalsCardProps> = ({ title, value, unit, trend, onClick, isActive, isCritical = false }) => {
  const baseClasses = "bg-white p-4 rounded-lg shadow-md cursor-pointer transition-all duration-300 ease-in-out";
  const activeClasses = "ring-2 ring-primary scale-105";
  const criticalClasses = "ring-2 ring-red-500 animate-pulse-red";

  return (
    <div onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : 'hover:shadow-lg'} ${isCritical ? criticalClasses : ''}`}>
      <div className="flex justify-between items-start">
        <h4 className="text-md font-semibold text-gray-600">{title}</h4>
        <TrendIcon trend={trend} />
      </div>
      <div className="mt-2 text-center">
        <span className="text-4xl font-bold text-gray-800">{value}</span>
        <span className="text-lg text-gray-500 ml-1">{unit}</span>
      </div>
    </div>
  );
};

export default VitalsCard;
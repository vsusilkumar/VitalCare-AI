
import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { VitalSignType } from '../types';

interface ChartDataPoint {
  timestamp: Date;
  [key: string]: any;
}

interface VitalsChartProps {
  data: ChartDataPoint[];
  vitalType: VitalSignType;
  timeRange: '24h' | '7d' | '30d';
}

const VitalsChart: React.FC<VitalsChartProps> = ({ data, vitalType, timeRange }) => {
  const processedData = useMemo(() => 
    data.map(d => ({ ...d, timestamp: d.timestamp.getTime() })),
  [data]);

  const [initialDomain, setInitialDomain] = useState<[number, number] | null>(null);
  const [xDomain, setXDomain] = useState<[number, number] | ['auto', 'auto']>(['auto', 'auto']);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; domain: [number, number] } | null>(null);

  useEffect(() => {
    if (processedData.length > 0) {
      const domain: [number, number] = [processedData[0].timestamp, processedData[processedData.length - 1].timestamp];
      setInitialDomain(domain);
      setXDomain(domain);
    } else {
      setInitialDomain(null);
      setXDomain(['auto', 'auto']);
    }
  }, [processedData]);

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (timeRange === '24h') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getUnit = () => {
    switch(vitalType) {
        case VitalSignType.HeartRate: return ' bpm';
        case VitalSignType.BloodPressure: return ' mmHg';
        case VitalSignType.Temperature: return ' °C';
        case VitalSignType.OxygenSaturation: return ' %';
        default: return '';
    }
  };

  const handleZoomIn = () => {
    if (Array.isArray(xDomain) && typeof xDomain[0] === 'number') {
      const [start, end] = xDomain as [number, number];
      const range = end - start;
      const minZoom = timeRange === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      if (range <= minZoom) return;
      const newStart = start + range * 0.2;
      const newEnd = end - range * 0.2;
      setXDomain([newStart, newEnd]);
    }
  };

  const handleZoomOut = () => {
    if (Array.isArray(xDomain) && typeof xDomain[0] === 'number' && initialDomain) {
      const [start, end] = xDomain as [number, number];
      const range = end - start;
      let newStart = start - range * 0.2;
      let newEnd = end + range * 0.2;

      if (newStart < initialDomain[0]) newStart = initialDomain[0];
      if (newEnd > initialDomain[1]) newEnd = initialDomain[1];
      
      setXDomain([newStart, newEnd]);
    }
  };

  const handleResetZoom = () => {
    if (initialDomain) {
      setXDomain(initialDomain);
    }
  };

  const handleMouseDown = (e: any) => {
    if (e?.chartX && Array.isArray(xDomain) && typeof xDomain[0] === 'number') {
      setIsPanning(true);
      setPanStart({ x: e.chartX, domain: xDomain as [number, number] });
    }
  };

  const handleMouseMove = (e: any) => {
    if (isPanning && panStart && e?.chartX) {
      const { chartWidth } = e;
      if (!chartWidth) return;

      const dx = e.chartX - panStart.x;
      const timeRange = panStart.domain[1] - panStart.domain[0];
      const timePerPixel = timeRange / chartWidth;
      const timeShift = dx * timePerPixel;

      let newStart = panStart.domain[0] - timeShift;
      let newEnd = panStart.domain[1] - timeShift;
      
      if (initialDomain) {
        if (newStart < initialDomain[0]) {
          const diff = initialDomain[0] - newStart;
          newStart += diff;
          newEnd += diff;
        }
        if (newEnd > initialDomain[1]) {
          const diff = newEnd - initialDomain[1];
          newStart -= diff;
          newEnd -= diff;
        }
      }
      
      setXDomain([newStart, newEnd]);
    }
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
    setPanStart(null);
  };
  
  const buttonClasses = "px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <div className="flex justify-end space-x-2 mb-4">
        <button onClick={handleZoomIn} disabled={!initialDomain} className={buttonClasses}>Zoom In</button>
        <button onClick={handleZoomOut} disabled={!initialDomain} className={buttonClasses}>Zoom Out</button>
        <button onClick={handleResetZoom} disabled={!initialDomain} className={buttonClasses}>Reset</button>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart 
            data={processedData} 
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isPanning ? 'grabbing' : (initialDomain ? 'grab' : 'default') }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              allowDataOverflow
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={xDomain}
              tickFormatter={formatXAxis} 
              tick={{ fill: '#6b7280' }} 
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280' }} 
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(2px)',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
              }}
              labelFormatter={(label) => new Date(Number(label)).toLocaleString()}
              formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}`, vitalType]}
            />
            <Legend wrapperStyle={{ color: '#374151' }}/>
            {vitalType === VitalSignType.BloodPressure ? (
              <>
                <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={false} name="Systolic" unit={getUnit()} />
                <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={false} name="Diastolic" unit={getUnit()} />
              </>
            ) : (
              <Line type="monotone" dataKey="value" stroke="#00A896" strokeWidth={2} dot={false} name={vitalType} unit={getUnit()} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default VitalsChart;

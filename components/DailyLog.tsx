import React, { useState, useCallback } from 'react';
import { DailyLogEntry, VitalsHistory } from '../types.ts';
import { getDietaryAndActivityInsights } from '../services/geminiService.ts';
import Spinner from './Spinner.tsx';

interface DailyLogProps {
    vitalsHistory: VitalsHistory;
}

const mockLogs: DailyLogEntry[] = [
    { id: '1', type: 'meal', description: 'Oatmeal with berries for breakfast.', timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000) },
    { id: '2', type: 'activity', description: '20-minute slow walk in the park.', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
    { id: '3', type: 'meal', description: 'Chicken soup and toast for lunch.', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
];

const DailyLog: React.FC<DailyLogProps> = ({ vitalsHistory }) => {
    const [logs, setLogs] = useState<DailyLogEntry[]>(mockLogs);
    const [newLog, setNewLog] = useState({ type: 'meal' as 'meal' | 'activity', description: '' });
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddLog = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLog.description.trim()) {
            const entry: DailyLogEntry = {
                id: `log-${Date.now()}`,
                ...newLog,
                timestamp: new Date(),
            };
            setLogs(prev => [entry, ...prev]);
            setNewLog({ type: 'meal', description: '' });
        }
    };

    const handleAnalyze = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setInsights([]);
        try {
            const result = await getDietaryAndActivityInsights(logs, vitalsHistory);
            setInsights(result);
        } catch(err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [logs, vitalsHistory]);

    return (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Log Entry and List */}
            <div className="lg:col-span-2">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Log Meals & Activities</h3>
                <form onSubmit={handleAddLog} className="flex flex-col sm:flex-row gap-3 mb-6">
                    <select value={newLog.type} onChange={e => setNewLog({...newLog, type: e.target.value as 'meal' | 'activity'})} className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        <option value="meal">Meal</option>
                        <option value="activity">Activity</option>
                    </select>
                    <input 
                        type="text" 
                        placeholder={newLog.type === 'meal' ? "e.g., Lentil soup for dinner" : "e.g., Light gardening for 30 mins"}
                        value={newLog.description}
                        onChange={e => setNewLog({...newLog, description: e.target.value})}
                        className="flex-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        required
                    />
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 focus:outline-none">Add Log</button>
                </form>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {logs.map(log => (
                        <div key={log.id} className="p-3 bg-gray-50 rounded-md border flex justify-between items-start animate-fade-in">
                            <div>
                                <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${log.type === 'meal' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>{log.type}</span>
                                <p className="text-gray-700 mt-2">{log.description}</p>
                            </div>
                            <p className="text-sm text-gray-500 whitespace-nowrap ml-4">{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Insights */}
            <div className="lg:col-span-1">
                 <div className="p-4 bg-light rounded-lg border sticky top-20">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Correlation Insights</h3>
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-4 py-2 mb-4 border border-transparent text-base font-medium rounded-md text-white bg-secondary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:bg-gray-400"
                    >
                         {isLoading ? <><Spinner />Analyzing...</> : 'Analyze Correlations'}
                    </button>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {insights.length > 0 && (
                        <div className="space-y-3">
                            {insights.map((insight, i) => (
                                <div key={i} className="text-sm text-gray-700 bg-white p-3 rounded-md border-l-4 border-secondary animate-fade-in">
                                    {insight}
                                </div>
                            ))}
                        </div>
                    )}
                    {!isLoading && insights.length === 0 && !error && (
                        <p className="text-sm text-center text-gray-500 py-4">Click "Analyze" to find connections between daily logs and vital signs.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default DailyLog;

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { generateTimeSeriesData, generateHeatmapData } from '@/lib/dataGenerator';
import { DataPoint, TimeRange, AggregationInterval } from '@/lib/types';

// Dynamically import chart components with no SSR
const LineChart = dynamic(() => import('@/components/charts/LineChart'), { ssr: false });
const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });
const ScatterPlot = dynamic(() => import('@/components/charts/ScatterPlot'), { ssr: false });
const Heatmap = dynamic(() => import('@/components/charts/Heatmap'), { ssr: false });
const PerformanceMonitor = dynamic(() => import('@/components/ui/PerformanceMonitor'), { ssr: false });

type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';

export default function Dashboard() {
  // State for data and loading
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [dataPoints, setDataPoints] = useState<number>(1000);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [aggregation, setAggregation] = useState<AggregationInterval>('1m');
  const [activeChart, setActiveChart] = useState<ChartType>('line');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(1000);
  
  // Refs for animation frame and performance tracking
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  
  // Generate initial data
  useEffect(() => {
    generateData();
    
    // Set up performance monitoring
    const monitorInterval = setInterval(updatePerformanceMetrics, 1000);
    
    return () => {
      clearInterval(monitorInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Handle auto-refresh
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        generateData();
      }, autoRefreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, autoRefreshInterval]);
  
  // Generate or update data
  const generateData = useCallback(() => {
    setIsLoading(true);
    try {
      let newData: DataPoint[] = [];
      
      if (activeChart === 'heatmap') {
        newData = generateHeatmapData({
          count: dataPoints,
          timeRange,
          withNoise: true,
        });
      } else {
        newData = generateTimeSeriesData({
          count: dataPoints,
          timeRange,
          withNoise: true,
        });
      }
      
      setData(newData);
      setError(null);
    } catch (err) {
      console.error('Error generating data:', err);
      setError('Failed to generate data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [dataPoints, timeRange, activeChart]);
  
  // Update performance metrics
  const updatePerformanceMetrics = useCallback(() => {
    // Update FPS
    const now = performance.now();
    frameCountRef.current++;
    
    if (now - lastFpsUpdateRef.current >= 1000) {
      const elapsed = (now - lastFpsUpdateRef.current) / 1000;
      const currentFps = Math.round(frameCountRef.current / elapsed);
      setFps(currentFps);
      
      // Reset counters
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }
    
    // Update memory usage (browser only)
    if ('memory' in window.performance) {
      // @ts-ignore - TypeScript doesn't know about this API
      const usedJSHeapSize = window.performance.memory.usedJSHeapSize;
      setMemoryUsage(usedJSHeapSize / (1024 * 1024)); // Convert to MB
    }
    
    // Schedule next update
    animationFrameRef.current = requestAnimationFrame(updatePerformanceMetrics);
  }, []);
  
  // Handle data points change
  const handleDataPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setDataPoints(Math.min(10000, Math.max(10, value)));
    }
  };
  
  // Handle time range change
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value as TimeRange);
  };
  
  // Handle aggregation change
  const handleAggregationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAggregation(e.target.value as AggregationInterval);
  };
  
  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };
  
  // Handle refresh interval change
  const handleRefreshIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 100) {
      setAutoRefreshInterval(value);
    }
  };
  
  // Handle refresh data
  const handleRefreshData = () => {
    generateData();
  };
  
  // Render the appropriate chart based on activeChart
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          {error}
        </div>
      );
    }
    
    const chartProps = {
      data,
      width: '100%',
      height: '100%',
      showGrid,
    };
    
    switch (activeChart) {
      case 'bar':
        return <BarChart {...chartProps} barColor="#3b82f6" />;
      case 'scatter':
        return <ScatterPlot {...chartProps} pointColor="#3b82f6" pointSize={4} showRegressionLine={true} />;
      case 'heatmap':
        return <Heatmap {...chartProps} colorRange={['#f0f9ff', '#0369a1']} cellSize={10} showAxisLabels={true} />;
      case 'line':
      default:
        return <LineChart {...chartProps} lineColor="#3b82f6" showPoints={dataPoints <= 1000} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Dashboard</h1>
        <p className="text-gray-600">Interactive data visualization with real-time updates</p>
      </header>
      
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="dataPoints" className="block text-sm font-medium text-gray-700 mb-1">
              Data Points: {dataPoints.toLocaleString()}
            </label>
            <input
              type="range"
              id="dataPoints"
              min="10"
              max="10000"
              step="10"
              value={dataPoints}
              onChange={handleDataPointsChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10</span>
              <span>10,000</span>
            </div>
          </div>
          
          <div>
            <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="aggregation" className="block text-sm font-medium text-gray-700 mb-1">
              Aggregation
            </label>
            <select
              id="aggregation"
              value={aggregation}
              onChange={handleAggregationChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="1d">1 Day</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                id="showGrid"
                type="checkbox"
                checked={showGrid}
                onChange={() => setShowGrid(!showGrid)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="showGrid" className="ml-2 block text-sm text-gray-700">
                Show Grid
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="autoRefresh"
                type="checkbox"
                checked={autoRefresh}
                onChange={toggleAutoRefresh}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRefresh" className="ml-2 block text-sm text-gray-700">
                Auto-refresh
              </label>
            </div>
            
            {autoRefresh && (
              <div className="flex-1">
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={autoRefreshInterval}
                  onChange={handleRefreshIntervalChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {autoRefreshInterval}ms
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <select
                value={activeChart}
                onChange={(e) => setActiveChart(e.target.value as ChartType)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="scatter">Scatter Plot</option>
                <option value="heatmap">Heatmap</option>
              </select>
            </div>
            
            <button
              onClick={handleRefreshData}
              disabled={isLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Performance Monitor */}
      <div className="mb-8">
        <PerformanceMonitor 
          fps={fps} 
          memoryUsage={memoryUsage} 
          dataPoints={data.length}
          chartType={activeChart}
        />
      </div>
      
      {/* Main Chart */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {activeChart === 'line' && 'Time Series Data'}
            {activeChart === 'bar' && 'Bar Chart'}
            {activeChart === 'scatter' && 'Scatter Plot'}
            {activeChart === 'heatmap' && 'Heatmap Visualization'}
          </h2>
          <div className="text-sm text-gray-500">
            {data.length.toLocaleString()} points
          </div>
        </div>
        <div className="h-[500px] w-full">
          {renderChart()}
        </div>
      </div>
      
      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Raw Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Showing {Math.min(10, data.length)} of {data.length.toLocaleString()} data points
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aggregated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 10).map((point, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(point.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {point.value.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {point.aggregated ? 'Yes' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
                <span className="font-medium">{data.length.toLocaleString()}</span> results
              </p>
            </div>
            <div>
              <button
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                onClick={() => {
                  // Export data as CSV
                  const headers = ['Timestamp', 'Value', 'Aggregated'];
                  const csvContent = [
                    headers.join(','),
                    ...data.map(point => [
                      new Date(point.timestamp).toISOString(),
                      point.value,
                      point.aggregated ? 'Yes' : 'No'
                    ].join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `data-${new Date().toISOString().slice(0, 10)}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

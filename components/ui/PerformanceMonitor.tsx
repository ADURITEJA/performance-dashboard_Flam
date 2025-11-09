'use client';

import { useEffect, useRef, useState } from 'react';

export type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';

interface PerformanceMonitorProps {
  fps: number;
  memoryUsage: number;
  dataPoints: number;
  chartType: ChartType;
  renderTime?: number;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  fps,
  memoryUsage,
  dataPoints,
  chartType,
  renderTime = 0
}) => {
  const [avgFps, setAvgFps] = useState<number>(0);
  const [maxFps, setMaxFps] = useState<number>(0);
  const [minFps, setMinFps] = useState<number>(Infinity);
  const [avgRenderTime, setAvgRenderTime] = useState<number>(0);
  
  const fpsHistory = useRef<number[]>([]);
  const renderTimeHistory = useRef<number[]>([]);
  const historySize = 60; // Keep last 60 samples

  // Track FPS metrics
  useEffect(() => {
    if (fps > 0) {
      // Update FPS history
      fpsHistory.current = [...fpsHistory.current, fps].slice(-historySize);
      
      // Calculate average FPS
      const sum = fpsHistory.current.reduce((a, b) => a + b, 0);
      setAvgFps(Math.round(sum / fpsHistory.current.length));
      
      // Update min/max FPS
      setMaxFps(Math.max(...fpsHistory.current));
      setMinFps(Math.min(...fpsHistory.current));
    }
  }, [fps]);

  // Track render time metrics
  useEffect(() => {
    if (renderTime > 0) {
      renderTimeHistory.current = [...renderTimeHistory.current, renderTime].slice(-historySize);
      const sum = renderTimeHistory.current.reduce((a, b) => a + b, 0);
      setAvgRenderTime(sum / renderTimeHistory.current.length);
    }
  }, [renderTime]);

  // Get color based on FPS value
  const getFpsColor = (value: number) => {
    if (value >= 50) return 'text-green-600';
    if (value >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get color based on memory usage
  const getMemoryColor = (value: number) => {
    if (value < 100) return 'text-green-600';
    if (value < 200) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get chart type display name
  const getChartTypeName = (type: ChartType): string => {
    const typeMap: Record<ChartType, string> = {
      line: 'Line Chart',
      bar: 'Bar Chart',
      scatter: 'Scatter Plot',
      heatmap: 'Heatmap'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            {getChartTypeName(chartType)}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
            {dataPoints.toLocaleString()} points
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Frame Rate</p>
          <div className="flex items-baseline">
            <span className={`text-2xl font-semibold ${getFpsColor(fps)}`}>
              {fps}
            </span>
            <span className="ml-2 text-sm text-gray-500">FPS</span>
          </div>
          <p className="text-xs text-gray-500">
            Avg: {avgFps} | Min: {minFps} | Max: {maxFps}
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Memory Usage</p>
          <div className="flex items-baseline">
            <span className={`text-2xl font-semibold ${getMemoryColor(memoryUsage)}`}>
              {memoryUsage.toFixed(1)}
            </span>
            <span className="ml-2 text-sm text-gray-500">MB</span>
          </div>
          <p className="text-xs text-gray-500">
            {memoryUsage < 100 ? 'Optimal' : memoryUsage < 200 ? 'Warning' : 'Critical'}
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Render Time</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-gray-900">
              {avgRenderTime.toFixed(1)}
            </span>
            <span className="ml-2 text-sm text-gray-500">ms</span>
          </div>
          <p className="text-xs text-gray-500">
            {avgRenderTime < 16 ? '60 FPS+' : avgRenderTime < 33 ? '30 FPS+' : 'Below 30 FPS'}
          </p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-500">Data Points</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-gray-900">
              {dataPoints.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {dataPoints < 1000 ? 'Light' : dataPoints < 5000 ? 'Medium' : 'Heavy'} load
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;

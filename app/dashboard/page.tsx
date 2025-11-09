'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import { DataPoint, TimeRangeType as TimeRange } from '@/src/lib/types';
import { getDataProcessor } from '@/src/lib/workerUtils';
import PerformanceMonitor from '@/components/ui/PerformanceMonitor';

// Lazy load heavy components
const LineChart = lazy(() => import('@/components/charts/LineChart'));
const BarChart = lazy(() => import('@/components/charts/BarChart'));
const ScatterPlot = lazy(() => import('@/components/charts/ScatterPlot'));
const Heatmap = lazy(() => import('@/components/charts/Heatmap'));

const CHART_TYPES = ['line', 'bar', 'scatter', 'heatmap'] as const;
type ChartType = typeof CHART_TYPES[number];

export default function DashboardPage() {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    dataPoints: 0
  });

  // Load data using Web Worker
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      const startTime = performance.now();
      
      try {
        const processor = getDataProcessor();
        const result = await processor.generateData({
          count: 100,
          minValue: 0,
          maxValue: 100,
          chartType,
        });
        
        if (mounted) {
          setData(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (mounted) {
          setData([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      mounted = false;
    };
  }, [chartType]);

  // Update FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastFpsUpdate = 0;
    let animationFrameId: number;

    const updateFps = (timestamp: number) => {
      frameCount++;
      
      if (timestamp - lastFpsUpdate >= 1000) {
        setPerformanceMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate))
        }));
        frameCount = 0;
        lastFpsUpdate = timestamp;
      }
      
      animationFrameId = requestAnimationFrame(updateFps);
    };
    
    animationFrameId = requestAnimationFrame(updateFps);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const ChartComponent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-64">Loading chart data...</div>;
    }

    const commonProps = {
      data,
      width: '100%',
      height: 400,
    };

    const renderChart = () => {
      switch (chartType) {
        case 'line':
          return <LineChart data={data} width="100%" height={400} margin={{ top: 20, right: 20, bottom: 40, left: 60 }} lineColor="#3b82f6" />;
        case 'bar':
          return <BarChart data={data} width="100%" height={400} margin={{ top: 20, right: 20, bottom: 40, left: 60 }} barColor="#3b82f6" />;
        case 'scatter':
          return <ScatterPlot data={data} width="100%" height={400} margin={{ top: 20, right: 20, bottom: 40, left: 60 }} pointColor="#3b82f6" pointSize={5} />;
        case 'heatmap':
          return <Heatmap data={data} width="100%" height={400} margin={{ top: 20, right: 20, bottom: 40, left: 60 }} colorRange={['#f0f9ff', '#0369a1']} />;
        default:
          return <LineChart data={data} width="100%" height={400} margin={{ top: 20, right: 20, bottom: 40, left: 60 }} lineColor="#3b82f6" />;
      }
    };

    return (
      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading chart...</div>}>
        {renderChart()}
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Real-time data visualization with performance monitoring
          </p>
        </header>

        <PerformanceMonitor 
          fps={performanceMetrics.fps}
          memoryUsage={performanceMetrics.memoryUsage}
          dataPoints={performanceMetrics.dataPoints}
          chartType={chartType}
          renderTime={performanceMetrics.renderTime}
        />

        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
            </h2>
            <div className="flex space-x-2">
              {CHART_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    chartType === type
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[500px] w-full">
            <ChartComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
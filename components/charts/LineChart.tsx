'use client';

import { useEffect, useRef, useCallback } from 'react';
import { DataPoint } from '@/lib/types';

interface LineChartProps {
  data: DataPoint[];
  width?: string | number;
  height?: string | number;
  margin?: { top: number; right: number; bottom: number; left: number };
  lineColor?: string;
  areaColor?: string;
  showArea?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = '100%',
  height = 400,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  lineColor = '#3b82f6',
  areaColor = 'rgba(59, 130, 246, 0.2)',
  showArea = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastRenderTimeRef = useRef<number>(0);
  const fpsRef = useRef<number[]>([]);

  // Calculate dimensions
  const getDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { canvasWidth: 0, canvasHeight: 0, width: 0, height: 0 };
    
    const canvasWidth = typeof width === 'number' ? width : canvas.parentElement?.clientWidth || 800;
    const canvasHeight = typeof height === 'number' ? height : 400;
    
    return {
      canvasWidth,
      canvasHeight,
      width: canvasWidth - margin.left - margin.right,
      height: canvasHeight - margin.top - margin.bottom,
    };
  }, [width, height, margin]);

  // Draw the chart
  const drawChart = useCallback(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const { canvasWidth, canvasHeight, width, height } = getDimensions();
    
    // Set the canvas dimensions
    canvas.width = canvasWidth * window.devicePixelRatio;
    canvas.height = canvasHeight * window.devicePixelRatio;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Find min/max values for scaling
    const xValues = data.map(d => d.timestamp);
    const yValues = data.map(d => d.value);
    
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues) * 0.95; // Add 5% padding
    const yMax = Math.max(...yValues) * 1.05; // Add 5% padding
    
    // Scale functions
    const xScale = (value: number) => 
      margin.left + ((value - xMin) / (xMax - xMin)) * width;
      
    const yScale = (value: number) => 
      margin.top + height - ((value - yMin) / (yMax - yMin)) * height;
    
    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Draw y-axis grid lines
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = margin.top + (i * height) / yTicks;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + width, y);
      ctx.stroke();
      
      // Draw y-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const value = yMin + ((yTicks - i) / yTicks) * (yMax - yMin);
      ctx.fillText(value.toFixed(2), margin.left - 10, y);
    }
    
    // Draw x-axis grid lines and labels
    const xTicks = Math.min(10, data.length);
    for (let i = 0; i <= xTicks; i++) {
      const index = Math.floor((i / xTicks) * (data.length - 1));
      const point = data[index];
      const x = xScale(point.timestamp);
      
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + height);
      ctx.stroke();
      
      // Draw x-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const date = new Date(point.timestamp);
      const timeString = date.toLocaleTimeString();
      ctx.fillText(timeString, x, margin.top + height + 10);
    }
    
    // Draw area
    if (showArea && data.length > 1) {
      ctx.fillStyle = areaColor;
      ctx.beginPath();
      ctx.moveTo(xScale(data[0].timestamp), yScale(0));
      
      for (let i = 0; i < data.length; i++) {
        const point = data[i];
        ctx.lineTo(xScale(point.timestamp), yScale(point.value));
      }
      
      ctx.lineTo(xScale(data[data.length - 1].timestamp), yScale(0));
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw line
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const x = xScale(point.timestamp);
      const y = yScale(point.value);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Draw data points
    const pointRadius = 2;
    for (let i = 0; i < data.length; i++) {
      // Only draw a subset of points for better performance
      if (data.length > 100 && i % Math.ceil(data.length / 100) !== 0) continue;
      
      const point = data[i];
      const x = xScale(point.timestamp);
      const y = yScale(point.value);
      
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw axis lines
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + height);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + height);
    ctx.lineTo(margin.left + width, margin.top + height);
    ctx.stroke();
    
    // Calculate FPS
    const now = performance.now();
    const delta = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;
    
    if (delta > 0) {
      const currentFps = Math.round(1000 / delta);
      fpsRef.current = [...fpsRef.current, currentFps].slice(-10);
      
      // Draw FPS counter
      const avgFps = Math.round(
        fpsRef.current.reduce((sum, fps) => sum + fps, 0) / fpsRef.current.length
      );
      
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`FPS: ${avgFps}`, canvasWidth - 10, 10);
    }
  }, [data, getDimensions, lineColor, areaColor, showArea, margin]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(drawChart);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawChart]);

  // Initial draw and update on data change
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(drawChart);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawChart]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          display: 'block',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
        }}
      />
    </div>
  );
};

export default LineChart;

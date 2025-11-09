'use client';

import { useEffect, useRef, useCallback } from 'react';
import { DataPoint } from '@/lib/types';

interface ScatterPlotProps {
  data: DataPoint[];
  width?: string | number;
  height?: string | number;
  margin?: { top: number; right: number; bottom: number; left: number };
  pointColor?: string;
  pointSize?: number;
  showRegressionLine?: boolean;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  width = '100%',
  height = 400,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  pointColor = '#3b82f6',
  pointSize = 5,
  showRegressionLine = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastRenderTimeRef = useRef<number>(0);
  const fpsRef = useRef<number[]>([]);
  const hoveredPointRef = useRef<number | null>(null);
  const tooltipRef = useRef<{ x: number; y: number; value: number; timestamp: number } | null>(null);

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

  // Calculate linear regression
  const calculateRegression = useCallback((data: DataPoint[]) => {
    if (data.length < 2) return null;

    const xValues = data.map((_, i) => i);
    const yValues = data.map(d => d.value);
    
    const n = xValues.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += xValues[i];
      sumY += yValues[i];
      sumXY += xValues[i] * yValues[i];
      sumXX += xValues[i] * xValues[i];
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return {
      slope,
      intercept,
      getY: (x: number) => slope * x + intercept,
    };
  }, []);

  // Draw the chart
  const drawChart = useCallback(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const { canvasWidth, canvasHeight, width, height } = getDimensions();
    
    // Set the canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale for high DPI displays
    ctx.scale(dpr, dpr);
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Find min/max values for scaling
    const xValues = data.map((_, i) => i);
    const yValues = data.map(d => d.value);
    
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues) * 0.9; // Add 10% padding
    const yMax = Math.max(...yValues) * 1.1; // Add 10% padding
    
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
      const x = xScale(xValues[index]);
      
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
    
    // Calculate and draw regression line if enabled
    if (showRegressionLine && data.length > 1) {
      const regression = calculateRegression(data);
      if (regression) {
        const startY = regression.getY(xMin);
        const endY = regression.getY(xMax);
        
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(margin.left, yScale(startY));
        ctx.lineTo(margin.left + width, yScale(endY));
        ctx.stroke();
        
        ctx.setLineDash([]);
      }
    }
    
    // Draw points
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const x = xScale(xValues[i]);
      const y = yScale(point.value);
      const isHovered = hoveredPointRef.current === i;
      const currentSize = isHovered ? pointSize * 1.5 : pointSize;
      
      // Draw point
      ctx.fillStyle = isHovered ? '#ef4444' : pointColor;
      ctx.beginPath();
      ctx.arc(x, y, currentSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Store tooltip data for hovered point
      if (isHovered) {
        tooltipRef.current = {
          x,
          y: y - 10,
          value: point.value,
          timestamp: point.timestamp
        };
      }
    }
    
    // Draw tooltip for hovered point
    if (tooltipRef.current) {
      const { x, y, value, timestamp } = tooltipRef.current;
      const date = new Date(timestamp).toLocaleString();
      
      // Draw tooltip background
      const text = `${value.toFixed(2)} (${date})`;
      const textWidth = ctx.measureText(text).width;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      const tooltipX = Math.min(
        Math.max(margin.left, x - textWidth / 2 - 10),
        margin.left + width - textWidth - 20
      );
      
      ctx.fillRect(
        tooltipX,
        y - 30,
        textWidth + 20,
        25
      );
      
      // Draw tooltip text
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, tooltipX + 10, y - 18);
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
  }, [data, getDimensions, pointColor, pointSize, showRegressionLine, margin, calculateRegression]);

  // Handle mouse move for hover effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const { width, height } = getDimensions();
    
    // Find the closest point to the mouse
    let closestIndex = -1;
    let minDistance = Infinity;
    
    const xValues = data.map((_, i) => i);
    const yValues = data.map(d => d.value);
    
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues) * 0.9;
    const yMax = Math.max(...yValues) * 1.1;
    
    const xScale = (value: number) => 
      margin.left + ((value - xMin) / (xMax - xMin)) * width;
      
    const yScale = (value: number) => 
      margin.top + height - ((value - yMin) / (yMax - yMin)) * height;
    
    for (let i = 0; i < data.length; i++) {
      const x = xScale(xValues[i]);
      const y = yScale(yValues[i]);
      
      const distance = Math.sqrt(
        Math.pow(mouseX - x, 2) + 
        Math.pow(mouseY - y, 2)
      );
      
      if (distance < 20 && distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    hoveredPointRef.current = closestIndex >= 0 ? closestIndex : null;
    
    // Request animation frame to update the chart
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(drawChart);
  }, [data, drawChart, getDimensions, margin]);

  // Handle window resize and initial draw
  useEffect(() => {
    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(drawChart);
    };

    window.addEventListener('resize', handleResize);
    
    // Initial draw
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(drawChart);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawChart]);

  // Update on data or dimension changes
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
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          hoveredPointRef.current = null;
          tooltipRef.current = null;
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(drawChart);
        }}
        style={{
          display: 'block',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
        }}
      />
    </div>
  );
};

export default ScatterPlot;

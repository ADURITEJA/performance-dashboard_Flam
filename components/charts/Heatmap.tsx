'use client';

import { useEffect, useRef, useCallback } from 'react';
import { DataPoint } from '@/src/lib/types';

interface HeatmapProps {
  data: DataPoint[];
  width?: string | number;
  height?: string | number;
  margin?: { top: number; right: number; bottom: number; left: number };
  colorRange?: [string, string]; // [minColor, maxColor]
  cellSize?: number;
  showAxisLabels?: boolean;
}

const Heatmap: React.FC<HeatmapProps> = ({
  data,
  width = '100%',
  height = 400,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  colorRange = ['#f0f9ff', '#0369a1'], // light blue to dark blue
  cellSize = 10,
  showAxisLabels = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastRenderTimeRef = useRef<number>(0);
  const fpsRef = useRef<number[]>([]);
  const hoveredCellRef = useRef<{ row: number; col: number } | null>(null);
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

  // Convert a value to a color in the gradient
  const valueToColor = useCallback((value: number, min: number, max: number) => {
    if (min === max) return colorRange[0];
    
    const ratio = (value - min) / (max - min);
    const r1 = parseInt(colorRange[0].substring(1, 3), 16);
    const g1 = parseInt(colorRange[0].substring(3, 5), 16);
    const b1 = parseInt(colorRange[0].substring(5, 7), 16);
    
    const r2 = parseInt(colorRange[1].substring(1, 3), 16);
    const g2 = parseInt(colorRange[1].substring(3, 5), 16);
    const b2 = parseInt(colorRange[1].substring(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio).toString(16).padStart(2, '0');
    const g = Math.round(g1 + (g2 - g1) * ratio).toString(16).padStart(2, '0');
    const b = Math.round(b1 + (b2 - b1) * ratio).toString(16).padStart(2, '0');
    
    return `#${r}${g}${b}`;
  }, [colorRange]);

  // Process data into a grid
  const processData = useCallback((data: DataPoint[], width: number, height: number) => {
    if (data.length === 0) return { grid: [], min: 0, max: 0 };
    
    // Calculate grid dimensions
    const numCols = Math.max(1, Math.floor(width / cellSize));
    const numRows = Math.max(1, Math.floor(height / cellSize));
    
    // Initialize grid
    const grid: { value: number; count: number; timestamp: number }[][] = [];
    for (let i = 0; i < numRows; i++) {
      grid.push(Array(numCols).fill(null).map(() => ({ value: 0, count: 0, timestamp: 0 })));
    }
    
    // Find min/max values for scaling
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Distribute data points into grid cells
    const timeValues = data.map(d => d.timestamp);
    const minTime = Math.min(...timeValues);
    const maxTime = Math.max(...timeValues);
    
    data.forEach(point => {
      const col = Math.min(
        numCols - 1,
        Math.max(0, Math.floor((point.timestamp - minTime) / (maxTime - minTime) * numCols))
      );
      
      const row = Math.min(
        numRows - 1,
        Math.max(0, Math.floor((1 - (point.value - min) / (max - min)) * numRows))
      );
      
      // Update cell with average value
      const cell = grid[row][col];
      const total = cell.value * cell.count + point.value;
      cell.count++;
      cell.value = total / cell.count;
      cell.timestamp = point.timestamp; // Keep the latest timestamp
    });
    
    return { grid, min, max };
  }, [cellSize]);

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
    
    // Process data into grid
    const { grid, min, max } = processData(data, width, height);
    const numRows = grid.length;
    const numCols = numRows > 0 ? grid[0].length : 0;
    
    if (numRows === 0 || numCols === 0) return;
    
    const cellWidth = width / numCols;
    const cellHeight = height / numRows;
    
    // Draw cells
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const cell = grid[row][col];
        if (cell.count === 0) continue; // Skip empty cells
        
        const x = margin.left + col * cellWidth;
        const y = margin.top + row * cellHeight;
        
        // Highlight hovered cell
        const isHovered = hoveredCellRef.current?.row === row && hoveredCellRef.current?.col === col;
        const border = isHovered ? 2 : 0;
        
        // Draw cell
        ctx.fillStyle = valueToColor(cell.value, min, max);
        ctx.fillRect(x + border, y + border, cellWidth - 2 * border, cellHeight - 2 * border);
        
        // Store tooltip data for hovered cell
        if (isHovered) {
          tooltipRef.current = {
            x: x + cellWidth / 2,
            y: y - 10,
            value: cell.value,
            timestamp: cell.timestamp
          };
        }
      }
    }
    
    // Draw tooltip for hovered cell
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
    
    // Draw axis labels if enabled
    if (showAxisLabels) {
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // X-axis labels (time)
      const xTicks = Math.min(5, numCols);
      for (let i = 0; i <= xTicks; i++) {
        const col = Math.floor((i / xTicks) * (numCols - 1));
        const x = margin.left + (col + 0.5) * cellWidth;
        
        // Find the first non-empty cell in this column to get timestamp
        let timestamp = 0;
        for (let row = 0; row < numRows; row++) {
          if (grid[row][col]?.timestamp) {
            timestamp = grid[row][col].timestamp;
            break;
          }
        }
        
        if (timestamp) {
          const date = new Date(timestamp);
          const timeString = date.toLocaleTimeString();
          ctx.fillText(timeString, x, margin.top + height + 10);
        }
      }
      
      // Y-axis labels (value)
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      const yTicks = Math.min(5, numRows);
      for (let i = 0; i <= yTicks; i++) {
        const row = Math.floor((i / yTicks) * (numRows - 1));
        const y = margin.top + (row + 0.5) * cellHeight;
        
        // Calculate value for this row
        const value = min + (1 - row / (numRows - 1)) * (max - min);
        ctx.fillText(value.toFixed(2), margin.left - 10, y);
      }
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
  }, [data, getDimensions, margin, processData, showAxisLabels, valueToColor]);

  // Handle mouse move for hover effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const { width, height } = getDimensions();
    
    // Process data to get grid dimensions
    const { grid } = processData(data, width, height);
    const numRows = grid.length;
    const numCols = numRows > 0 ? grid[0].length : 0;
    
    if (numRows === 0 || numCols === 0) {
      hoveredCellRef.current = null;
      tooltipRef.current = null;
      return;
    }
    
    const cellWidth = width / numCols;
    const cellHeight = height / numRows;
    
    // Find hovered cell
    const col = Math.floor((mouseX - margin.left) / cellWidth);
    const row = Math.floor((mouseY - margin.top) / cellHeight);
    
    if (
      col >= 0 && 
      col < numCols && 
      row >= 0 && 
      row < numRows && 
      grid[row][col]?.count > 0
    ) {
      hoveredCellRef.current = { row, col };
    } else {
      hoveredCellRef.current = null;
      tooltipRef.current = null;
    }
    
    // Request animation frame to update the chart
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(drawChart);
  }, [data, drawChart, getDimensions, margin, processData]);

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
          hoveredCellRef.current = null;
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

export default Heatmap;

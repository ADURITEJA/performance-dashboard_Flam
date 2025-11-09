export interface DataPoint {
  x: number | string | Date;
  y: number;
  [key: string]: any; // For additional properties
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  dataPoints: number;
}

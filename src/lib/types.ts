export interface DataPoint {
  timestamp: number;
  value: number;
  aggregated?: boolean;
  x?: number;
  y?: number;
  category?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // For backward compatibility
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'heatmap';
  dataKey: string;
  color: string;
  visible: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  dataPoints: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export type TimeRangeType = '1h' | '6h' | '24h' | '7d' | '30d';
export type AggregationInterval = 'minute' | 'hour' | 'day' | 'week' | 'month';

export interface DataGeneratorOptions {
  count: number;
  minValue: number;
  maxValue: number;
  startDate?: Date;
  endDate?: Date;
  timeRange?: TimeRangeType;
  aggregation?: AggregationInterval;
  category?: string;
  withNoise?: boolean;
  xCount?: number;
  yCount?: number;
}

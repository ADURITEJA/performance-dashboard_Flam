import { DataPoint, DataGeneratorOptions, TimeRangeType, AggregationInterval } from './types';

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// Helper function to get time range in milliseconds
function getTimeRangeMs(timeRange: TimeRangeType): number {
  switch (timeRange) {
    case '1h': return MS_PER_HOUR;
    case '6h': return 6 * MS_PER_HOUR;
    case '24h': return 24 * MS_PER_HOUR;
    case '7d': return 7 * MS_PER_DAY;
    case '30d': return 30 * MS_PER_DAY;
    default: return 24 * MS_PER_HOUR; // Default to 24h
  }
}

// Helper function to get aggregation interval in milliseconds
function getAggregationMs(interval: AggregationInterval): number {
  switch (interval) {
    case '1m': return MS_PER_MINUTE;
    case '5m': return 5 * MS_PER_MINUTE;
    case '15m': return 15 * MS_PER_MINUTE;
    case '1h': return MS_PER_HOUR;
    case '1d': return MS_PER_DAY;
    default: return MS_PER_MINUTE; // Default to 1m
  }
}

export function generateTimeSeriesData(options: DataGeneratorOptions): DataPoint[] {
  const {
    count = 1000,
    withNoise = true,
    timeRange = '24h',
    startDate = new Date(),
    endDate = new Date(),
    minValue = 0,
    maxValue = 100,
    aggregation
  } = {
    ...options,
    withNoise: options.withNoise ?? true,
    minValue: options.minValue ?? 0,
    maxValue: options.maxValue ?? 100
  };

  const data: DataPoint[] = [];
  
  // Calculate time range
  const now = Date.now();
  const rangeMs = getTimeRangeMs(timeRange);
  const endTime = now;
  const startTime = now - rangeMs;
  
  // Calculate time step based on count
  const timeStep = rangeMs / count;
  const valueRange = maxValue - minValue;

  // Generate data points
  for (let i = 0; i < count; i++) {
    const timestamp = startTime + i * timeStep;
    const x = (i / count) * 10; // Scale for more periods
    
    // Generate a base value using a combination of sine waves
    let value = (
      Math.sin(x) * 0.6 + 
      Math.sin(x * 2.3) * 0.3 + 
      Math.sin(x * 0.7) * 0.1
    );
    
    // Add some noise if enabled
    if (withNoise) {
      value += (Math.random() - 0.5) * 0.3;
    }
    
    // Normalize to [0, 1] and scale to desired range
    value = ((value + 1) / 2) * valueRange + minValue;
    
    data.push({
      timestamp,
      value,
      x: i,
      y: value
    });
  }

  // Apply aggregation if specified
  if (aggregation) {
    return aggregateData(data, aggregation, timeRange);
  }

  return data;
}

function aggregateData(data: DataPoint[], interval: AggregationInterval, timeRange: TimeRangeType): DataPoint[] {
  if (data.length === 0) return [];
  
  const intervalMs = getAggregationMs(interval);
  const aggregated: DataPoint[] = [];
  let currentInterval = Math.floor(data[0].timestamp / intervalMs) * intervalMs;
  let intervalData: DataPoint[] = [];
  
  for (const point of data) {
    if (point.timestamp >= currentInterval + intervalMs) {
      // Process the completed interval
      if (intervalData.length > 0) {
        const avgValue = intervalData.reduce((sum, p) => sum + p.value, 0) / intervalData.length;
        aggregated.push({
          timestamp: currentInterval,
          value: avgValue,
          aggregated: true
        });
        intervalData = [];
      }
      
      // Move to the next interval
      currentInterval = Math.floor(point.timestamp / intervalMs) * intervalMs;
    }
    
    intervalData.push(point);
  }
  
  return data;
}

/**
 * Generates multiple series of time-series data
 */
export function generateMultipleSeries(
  seriesCount: number,
  pointsPerSeries: number,
  minValue: number,
  maxValue: number,
  timeRange: { start: Date; end: Date }
): Record<string, DataPoint[]> {
  const result: Record<string, DataPoint[]> = {};
  
  for (let i = 0; i < seriesCount; i++) {
    const category = `series-${i + 1}`;
    result[category] = generateTimeSeriesData({
      count: pointsPerSeries,
      minValue,
      maxValue,
      startDate: timeRange.start,
      endDate: timeRange.end,
      category,
    });
  }
  
  return result;
}

/**
 * Generates a heatmap data structure
 * Can be called with individual parameters or an options object
 */
export function generateHeatmapData(
  xCountOrOptions: number | Omit<DataGeneratorOptions, 'count' | 'timeRange'>,
  yCountParam: number = 10,
  minValueParam: number = 0,
  maxValueParam: number = 100
): DataPoint[] {
  // Handle both parameter styles
  let options: DataGeneratorOptions;
  
  if (typeof xCountOrOptions === 'object') {
    // Called with options object
    options = {
      ...xCountOrOptions,
      count: 1000, // Default count for time-based heatmap
      timeRange: '24h' // Default time range
    };
  } else {
    // Called with individual parameters
    options = {
      xCount: xCountOrOptions,
      yCount: yCountParam,
      minValue: minValueParam,
      maxValue: maxValueParam,
      count: 1000, // Default count for time-based heatmap
      timeRange: '24h' // Default time range
    };
  }
  
  // Destructure with defaults
  const {
    xCount = 10,
    yCount: yCountOpt = 10,
    minValue = 0,
    maxValue = 100,
    count = 1000,
    timeRange = '24h'
  } = options;
  
  // If xCount is provided, generate a grid heatmap
  if (typeof xCount === 'number' && yCountOpt) {
    const data: DataPoint[] = [];
    const valueRange = maxValue - minValue;
    
    for (let x = 0; x < xCount; x++) {
      for (let y = 0; y < yCountOpt; y++) {
        // Create some pattern in the data
        const distance = Math.sqrt(
          Math.pow(x / xCount - 0.5, 2) + 
          Math.pow(y / yCountOpt - 0.5, 2)
        );
        
        // Value is higher towards the center
        const value = minValue + (1 - distance) * valueRange * (0.8 + Math.random() * 0.2);
        
        data.push({
          x,
          y,
          value,
          timestamp: Date.now(),
          category: 'heatmap'
        });
      }
    }
    
    return data;
  }
  
  // Otherwise generate a time-based heatmap
  const data: DataPoint[] = [];
  const now = Date.now();
  const rangeMs = getTimeRangeMs(timeRange as TimeRangeType);
  const startTime = now - rangeMs;
  
  // Generate random points for heatmap
  for (let i = 0; i < count; i++) {
    const timestamp = startTime + Math.random() * rangeMs;
    const value = minValue + Math.random() * (maxValue - minValue);
    
    data.push({
      timestamp,
      value,
      x: (timestamp - startTime) / rangeMs * 100, // 0-100%
      y: ((value - minValue) / (maxValue - minValue)) * 100, // 0-100%
      category: 'time-heatmap'
    });
  }
  
  return data;
}
import { dataProcessor } from '@/src/workers/dataProcessor';

// This is a simple wrapper around the dataProcessor instance
export function getDataProcessor() {
  // In server-side rendering, return a mock implementation
  if (typeof window === 'undefined') {
    return {
      generateData: async () => [],
      processData: async (data: any[]) => data,
    };
  }
  
  return dataProcessor;
}

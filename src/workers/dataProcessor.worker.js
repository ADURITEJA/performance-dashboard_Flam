// This is a Web Worker that processes data in the background
// It will be automatically handled by Webpack's worker-loader

// Import the data generation functions using dynamic import
let generateTimeSeriesData, generateHeatmapData;

// Handle messages from the main thread
self.onmessage = async function(e) {
  const { type, payload } = e.data;
  
  try {
    switch (type) {
      case 'GENERATE_DATA': {
        // Lazy load the data generators
        if (!generateTimeSeriesData || !generateHeatmapData) {
          const dataGenerator = await import('../lib/dataGenerator');
          generateTimeSeriesData = dataGenerator.generateTimeSeriesData;
          generateHeatmapData = dataGenerator.generateHeatmapData;
        }

        const { count, minValue, maxValue, chartType } = payload;
        let data;
        
        if (chartType === 'heatmap') {
          data = generateHeatmapData({
            count: count || 100,
            minValue: minValue || 0,
            maxValue: maxValue || 100,
            timeRange: '24h',
            withNoise: true
          });
        } else {
          data = generateTimeSeriesData({
            count: count || 100,
            minValue: minValue || 0,
            maxValue: maxValue || 100,
            timeRange: '24h',
            withNoise: true
          });
        }
        
        self.postMessage({
          type: 'GENERATE_DATA',
          payload: { 
            data, 
            requestId: payload.requestId 
          }
        });
        break;
      }
        
      case 'PROCESS_DATA':
        // Just echo back the data for now
        self.postMessage({
          type: 'PROCESS_DATA',
          payload: { 
            data: payload.data, 
            requestId: payload.requestId 
          }
        });
        break;
        
      case 'INIT':
        // Worker is ready
        self.postMessage({ type: 'READY' });
        break;
        
      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    console.error('Error in worker:', error);
    self.postMessage({
      type: 'ERROR',
      payload: { 
        error: error.message, 
        requestId: payload?.requestId 
      }
    });
  }
};

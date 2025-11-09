// This runs in a separate thread
self.onmessage = function(e) {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'PROCESS_DATA':
      const { data, options } = payload;
      const processed = processData(data, options);
      self.postMessage({ type: 'DATA_PROCESSED', payload: processed });
      break;
    case 'GENERATE_DATA':
      const { count, minValue, maxValue, chartType } = payload;
      const generated = generateData(count, minValue, maxValue, chartType);
      self.postMessage({ type: 'DATA_GENERATED', payload: generated });
      break;
  }
};

function processData(data, options) {
  // Implement your data processing logic here
  // This runs in a separate thread
  return {
    ...data,
    processed: true,
    timestamp: Date.now()
  };
}

function generateData(count, minValue, maxValue, chartType) {
  // This would be your data generation logic
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      x: i,
      y: minValue + Math.random() * (maxValue - minValue),
      value: minValue + Math.random() * (maxValue - minValue)
    });
  }
  return data;
}

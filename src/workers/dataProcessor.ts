// Worker wrapper to handle Web Worker communication
export class DataProcessor {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(new URL('../../public/workers/dataProcessor.worker.js', import.meta.url));
  }

  generateData(params: {
    count: number;
    minValue: number;
    maxValue: number;
    chartType: string;
  }): Promise<any[]> {
    return new Promise((resolve) => {
      this.worker.onmessage = (e) => {
        if (e.data.type === 'DATA_GENERATED') {
          resolve(e.data.payload);
        }
      };
      this.worker.postMessage({
        type: 'GENERATE_DATA',
        payload: params,
      });
    });
  }

  processData(data: any[], options: any): Promise<any[]> {
    return new Promise((resolve) => {
      this.worker.onmessage = (e) => {
        if (e.data.type === 'DATA_PROCESSED') {
          resolve(e.data.payload);
        }
      };
      this.worker.postMessage({
        type: 'PROCESS_DATA',
        payload: { data, options },
      });
    });
  }
}

export const dataProcessor = new DataProcessor();

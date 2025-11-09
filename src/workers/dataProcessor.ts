'use client';

import { DataPoint, DataGeneratorOptions } from '@/src/lib/types';

class DataProcessor {
  private worker: Worker | null = null;
  private messageQueue: Array<{resolve: (value: any) => void, reject: (reason?: any) => void, requestId: string}> = [];
  private isReady = false;
  private readyResolvers: Array<() => void> = [];

  constructor() {
    // Only initialize the worker in the browser environment
    if (typeof window !== 'undefined') {
      this.initializeWorker();
    }
  }

  private async initializeWorker() {
    try {
      // Use dynamic import for the worker
      const Worker = (await import('worker-loader!./dataProcessor.worker.js')).default;
      this.worker = new Worker() as Worker;
      
      this.worker.onmessage = (e: MessageEvent) => {
        const { type, payload } = e.data;
        
        if (type === 'READY') {
          this.isReady = true;
          this.readyResolvers.forEach(resolve => resolve());
          this.readyResolvers = [];
          return;
        }
        
        // Find the promise that's waiting for this response
        const requestIndex = this.messageQueue.findIndex(
          item => item.requestId === payload?.requestId
        );
        
        if (requestIndex !== -1) {
          const { resolve, reject } = this.messageQueue[requestIndex];
          this.messageQueue.splice(requestIndex, 1);
          
          if (type === 'ERROR') {
            reject(new Error(payload.error));
          } else {
            resolve(payload);
          }
        }
      };
      
      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending promises
        this.messageQueue.forEach(({ reject }) => {
          reject(error);
        });
        this.messageQueue = [];
      };
      
      // Notify the worker that we're ready
      this.worker.postMessage({ type: 'INIT' });
      
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      this.isReady = false;
    }
  }

  private async ensureReady(): Promise<void> {
    if (this.isReady) return Promise.resolve();
    
    return new Promise((resolve) => {
      this.readyResolvers.push(resolve);
    });
  }

  private async sendToWorker<T>(type: string, payload: any = {}): Promise<T> {
    if (!this.worker) {
      throw new Error('Worker is not available');
    }
    
    await this.ensureReady();
    
    const requestId = Math.random().toString(36).substring(2, 11);
    
    return new Promise((resolve, reject) => {
      this.messageQueue.push({ resolve, reject, requestId });
      
      this.worker?.postMessage({
        type,
        payload: {
          ...payload,
          requestId,
        },
      });
    });
  }

  public async generateData(params: DataGeneratorOptions & { chartType: string }): Promise<DataPoint[]> {
    try {
      const result = await this.sendToWorker<{ data: DataPoint[] }>('GENERATE_DATA', params);
      return result?.data || [];
    } catch (error) {
      console.error('Error in generateData:', error);
      return [];
    }
  }

  public async processData(data: DataPoint[]): Promise<DataPoint[]> {
    try {
      const result = await this.sendToWorker<{ data: DataPoint[] }>('PROCESS_DATA', { data });
      return result?.data || [];
    } catch (error) {
      console.error('Error in processData:', error);
      return [];
    }
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.messageQueue = [];
    }
  }
}

// Create a single instance
export const dataProcessor = new DataProcessor();

// Export the instance as default for backward compatibility
export default dataProcessor;

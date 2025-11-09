declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

declare module '@/workers/dataProcessor' {
  import { WorkerMessage, ProcessDataPayload, GenerateDataPayload } from '@/workers/dataProcessor';
  
  export class DataProcessorWorker {
    public static getInstance(): DataProcessorWorker;
    public processData(data: any[], options: ProcessDataPayload['options']): Promise<any>;
    public generateData(payload: GenerateDataPayload): Promise<any[]>;
    public on(type: string, callback: (data: any) => void): () => void;
    public terminate(): void;
  }
  
  export const dataProcessor: DataProcessorWorker;
}

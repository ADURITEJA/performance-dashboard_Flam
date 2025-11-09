import { NextResponse } from 'next/server';
import { generateTimeSeriesData, generateHeatmapData } from '@/lib/dataGenerator';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { type, options } = await request.json();
    
    let data;
    
    switch (type) {
      case 'time-series':
        data = generateTimeSeriesData(options);
        break;
      case 'heatmap':
        data = generateHeatmapData(options);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid data type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error processing data:', error);
    return NextResponse.json(
      { error: 'Failed to process data' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; // Ensure we get fresh data on each request

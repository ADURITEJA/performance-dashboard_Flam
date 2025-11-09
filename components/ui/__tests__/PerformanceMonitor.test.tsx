import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerformanceMonitor from '../PerformanceMonitor';
import type { ChartType } from '../PerformanceMonitor';

type PerformanceMonitorProps = React.ComponentProps<typeof PerformanceMonitor>;

describe('PerformanceMonitor', () => {
  const mockProps: PerformanceMonitorProps = {
    fps: 60,
    memoryUsage: 50,
    dataPoints: 1000,
    chartType: 'line' as ChartType,
    renderTime: 10,
  };

  it('renders the component with provided props', () => {
    const { container } = render(<PerformanceMonitor {...mockProps} />);
    
    // Check if the component renders with the provided props
    expect(container).toHaveTextContent('60 FPS');
    expect(container).toHaveTextContent('50.0MB');
    expect(container).toHaveTextContent('1,000 points');
    expect(container).toHaveTextContent('10.0ms');
  });

  it('shows the current chart type', () => {
    const { container } = render(<PerformanceMonitor {...mockProps} />);
    expect(container).toHaveTextContent('Line Chart');
  });
});

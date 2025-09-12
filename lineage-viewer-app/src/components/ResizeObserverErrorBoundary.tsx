import React from 'react';

interface ResizeObserverErrorBoundaryProps {
  children: React.ReactNode;
}

class ResizeObserverErrorBoundary extends React.Component<ResizeObserverErrorBoundaryProps> {
  constructor(props: ResizeObserverErrorBoundaryProps) {
    super(props);
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Suppress ResizeObserver errors
    if (error.message?.includes('ResizeObserver loop completed with undelivered notifications')) {
      console.log('🔧 ResizeObserver error caught and suppressed by error boundary');
      return;
    }
    
    // Log other errors
    console.error('🔧 Error caught by boundary:', error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}

export default ResizeObserverErrorBoundary;

// Utility to fix ResizeObserver loop errors
export const suppressResizeObserverErrors = () => {
  // Override the global error handler to suppress ResizeObserver errors
  const originalError = window.onerror;
  
  window.onerror = function(message: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) {
    if (typeof message === 'string' && 
        message.includes('ResizeObserver loop completed with undelivered notifications')) {
      return true; // Suppress this error
    }
    
    if (originalError) {
      return originalError.call(window, message, source, lineno, colno, error);
    }
    
    return false;
  };

  // Also handle unhandled promise rejections
  const originalUnhandledRejection = window.onunhandledrejection;
  
  window.onunhandledrejection = function(event: PromiseRejectionEvent) {
    if (event.reason && 
        typeof event.reason === 'string' && 
        event.reason.includes('ResizeObserver loop completed with undelivered notifications')) {
      event.preventDefault(); // Suppress this error
      return;
    }
    
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(window, event);
    }
  };
};

// CSS fix for ResizeObserver
export const addResizeObserverCSSFix = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Fix ResizeObserver loop error */
    .ResizeObserver {
      overflow: hidden !important;
    }
    
    /* Additional fixes for common ResizeObserver issues */
    [data-resize-observer] {
      overflow: hidden !important;
    }
    
    /* Fix for Material-UI components that might trigger ResizeObserver */
    .MuiContainer-root {
      overflow-x: hidden;
    }
  `;
  document.head.appendChild(style);
};

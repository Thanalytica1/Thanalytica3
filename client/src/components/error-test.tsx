import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Component for testing error boundary functionality (dev only)
export function ErrorTest() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    // This will trigger the error boundary
    throw new Error('Test error for Error Boundary demonstration');
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="max-w-md mx-auto mt-4 border-orange-200">
      <CardHeader>
        <CardTitle className="text-orange-700">Error Boundary Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          This component is only visible in development mode. Click the button below to test the error boundary.
        </p>
        <Button
          onClick={() => setShouldError(true)}
          variant="destructive"
          size="sm"
        >
          Trigger Test Error
        </Button>
      </CardContent>
    </Card>
  );
}
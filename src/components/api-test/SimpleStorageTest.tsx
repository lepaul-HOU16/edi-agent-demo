import React, { useState } from 'react';
import { Button, Alert, Container, Header, SpaceBetween } from '@cloudscape-design/components';
import osduApi from '../../services/osduApiService';

const SimpleStorageTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testStorageService = async () => {
    console.log('🚀 Simple storage test started');
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      // Log expected headers for debugging
      console.log('📋 Expected headers should include:');
      console.log('  - Authorization: Bearer [JWT_ID_TOKEN]');
      console.log('  - data-partition-id: osdu');
      console.log('  - x-access-token: [JWT_ACCESS_TOKEN]');
      console.log('  - Content-Type: application/json');
      
      // Test health check only
      console.log('🏥 Testing storage service health check...');
      const healthResult = await osduApi.testStorageHealthCheck('osdu');
      console.log('✅ Health check result:', healthResult);
      
      setResult({
        status: 'success',
        data: healthResult,
        message: 'Storage service health check passed!'
      });
    } catch (err: any) {
      console.error('Storage test failed:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container header={<Header variant="h2">Simple Storage Service Test</Header>}>
      <SpaceBetween direction="vertical" size="l">
        <Button
          onClick={testStorageService}
          loading={isLoading}
          variant="primary"
        >
          Test Storage Health Check
        </Button>

        {error && (
          <Alert type="error" header="Test Failed">
            {error}
          </Alert>
        )}

        {result && (
          <Alert type="success" header="Test Passed">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default SimpleStorageTest;
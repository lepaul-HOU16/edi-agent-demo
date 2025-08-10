import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import osduApi from './services/osduApiService';

const TestAPI = () => {
  const { isAuthenticated, user, tokens } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('all');

  // Test individual service with OSDU M25 compliant calls
  const testService = async (serviceName) => {
    if (!isAuthenticated) {
      return { status: 'error', error: 'Not authenticated' };
    }

    try {
      switch (serviceName) {
        case 'schema':
          const schemas = await osduApi.getSchemas('osdu', {}, { limit: 5 });
          return { 
            status: 'success', 
            data: schemas,
            message: `Found ${schemas.getSchemas?.items?.length || 0} schemas`,
            details: `OSDU M25 Schema Service - Connected successfully`
          };
        
        case 'entitlements':
          const entitlements = await osduApi.getEntitlements('osdu', {}, { limit: 5 });
          return { 
            status: 'success', 
            data: entitlements,
            message: `Found ${entitlements.listEntitlements?.items?.length || 0} entitlements`,
            details: `OSDU M25 Entitlements Service - Connected successfully`
          };
        
        case 'legal':
          const legalTags = await osduApi.getLegalTags('osdu', {});
          return { 
            status: 'success', 
            data: legalTags,
            message: `Found ${legalTags.getLegalTags?.items?.length || 0} legal tags`,
            details: `OSDU M25 Legal Tagging Service - Connected successfully`
          };
        
        case 'search':
        case 'storage':
        case 'ai':
        case 'dataIngestion':
        case 'seismicIngestion':
          // Test connectivity for deployed services
          const connectivity = await osduApi.testConnectivity('osdu');
          const serviceResult = connectivity[serviceName];
          
          if (!serviceResult) {
            return { status: 'error', error: 'Service not found in connectivity test' };
          }
          
          if (serviceResult.status === 'connected') {
            return {
              status: 'success',
              message: `${serviceName} service is connected and ready`,
              details: `Endpoint: ${serviceResult.endpoint}`
            };
          } else {
            return {
              status: serviceResult.status === 'not_configured' ? 'not_deployed' : 'error',
              error: serviceResult.error,
              details: `Endpoint: ${serviceResult.endpoint || 'Not configured'}`
            };
          }
        
        default:
          return { status: 'error', error: 'Unknown service' };
      }
    } catch (error) {
      console.error(`Error testing ${serviceName}:`, error);
      return { 
        status: 'error', 
        error: error.message,
        details: `Failed to connect to ${serviceName} service`
      };
    }
  };

  // Test all services
  const testAllServices = async () => {
    setIsLoading(true);
    const services = ['schema', 'entitlements', 'legal', 'search', 'storage', 'ai', 'dataIngestion', 'seismicIngestion'];
    const results = {};

    for (const service of services) {
      console.log(`Testing ${service} service...`);
      results[service] = await testService(service);
    }

    setTestResults(results);
    setIsLoading(false);
  };

  // Test specific service
  const testSpecificService = async (serviceName) => {
    setIsLoading(true);
    const result = await testService(serviceName);
    setTestResults({ [serviceName]: result });
    setIsLoading(false);
  };

  // Auto-test on component mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      testAllServices();
    }
  }, [isAuthenticated]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#f44336';
      case 'not_deployed': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'not_deployed': return '⏳';
      default: return '❓';
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔐 Authentication Required</h2>
        <p>Please sign in to test OSDU M25 API services</p>
      </div>
    );
  }

  return (
    <div data-testapi-modal style={{ 
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      border: '2px solid #2196f3',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      padding: '20px', 
      maxWidth: '1200px', 
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 1000,
      width: '90vw'
    }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '15px',
        cursor: 'pointer',
        fontSize: '24px',
        color: '#666',
        zIndex: 1001
      }}
      onClick={() => {
        // Add a way to close the modal - we'll add this functionality
        const testApiElement = document.querySelector('[data-testapi-modal]');
        if (testApiElement) {
          testApiElement.style.display = 'none';
        }
      }}>
        ✕
      </div>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1>🚀 OSDU M25 API Service Testing</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Testing connectivity to OSDU M25 compliant services with Cognito authentication
        </p>
        <div style={{ 
          background: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '8px', 
          marginTop: '15px',
          border: '1px solid #2196f3'
        }}>
          <strong>👤 Authenticated as:</strong> {user?.username || user?.email || 'Unknown'}
          <br />
          <strong>🏢 Data Partition:</strong> osdu
          <br />
          <strong>🔑 Auth Method:</strong> AWS Cognito
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={testAllServices}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? '🔄 Testing...' : '🧪 Test All Services'}
        </button>

        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          style={{
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        >
          <option value="all">All Services</option>
          <option value="schema">Schema Service</option>
          <option value="entitlements">Entitlements Service</option>
          <option value="legal">Legal Tagging Service</option>
          <option value="search">Search Service</option>
          <option value="storage">Storage Service</option>
          <option value="seismic">Seismic Service</option>
          <option value="dataIngestion">Data Ingestion Service</option>
          <option value="ai">AI Service</option>
        </select>

        <button
          onClick={() => selectedService === 'all' ? testAllServices() : testSpecificService(selectedService)}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isLoading ? '🔄 Testing...' : `🎯 Test ${selectedService === 'all' ? 'All' : selectedService}`}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        {Object.entries(testResults).map(([serviceName, result]) => (
          <div
            key={serviceName}
            style={{
              border: `2px solid ${getStatusColor(result.status)}`,
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: result.status === 'success' ? '#f8fff8' : 
                             result.status === 'error' ? '#fff8f8' : '#fff8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>
                {getStatusIcon(result.status)}
              </span>
              <h3 style={{ margin: 0, textTransform: 'capitalize', color: getStatusColor(result.status) }}>
                {serviceName.replace(/([A-Z])/g, ' $1').trim()} Service
              </h3>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <strong>Status:</strong> 
              <span style={{ 
                color: getStatusColor(result.status), 
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {result.status.toUpperCase()}
              </span>
            </div>

            {result.message && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Message:</strong> {result.message}
              </div>
            )}

            {result.details && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Details:</strong> {result.details}
              </div>
            )}

            {result.error && (
              <div style={{ 
                backgroundColor: '#ffebee', 
                padding: '10px', 
                borderRadius: '6px',
                border: '1px solid #f44336',
                marginTop: '10px'
              }}>
                <strong style={{ color: '#f44336' }}>Error:</strong>
                <pre style={{ 
                  margin: '5px 0 0 0', 
                  fontSize: '12px', 
                  color: '#d32f2f',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {result.error}
                </pre>
              </div>
            )}

            {result.data && result.status === 'success' && (
              <details style={{ marginTop: '15px' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  color: '#2196f3',
                  marginBottom: '10px'
                }}>
                  📊 View Response Data
                </summary>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '15px', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '300px',
                  border: '1px solid #ddd'
                }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {Object.keys(testResults).length === 0 && !isLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          backgroundColor: '#f9f9f9',
          borderRadius: '12px',
          border: '2px dashed #ddd'
        }}>
          <h3>🎯 Ready to Test</h3>
          <p>Click "Test All Services" to check connectivity to OSDU M25 compliant services</p>
        </div>
      )}
    </div>
  );
};

export default TestAPI;

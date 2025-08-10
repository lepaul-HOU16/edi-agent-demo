import React, { useState } from 'react';
import { Button, Alert, Container, Header, SpaceBetween, Box, ProgressBar } from '@cloudscape-design/components';
import osduApi from '../../services/osduApiService';

const AdminBootstrap: React.FC = () => {
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const adminEmail = 'cmgabri@amazon.com';
  const dataPartition = 'osdu';

  const adminGroups = [
    {
      name: `service.schema.admin@${dataPartition}.dataservices.energy`,
      description: 'Schema Service Administrators - Full access to schema operations',
      serviceName: 'schema'
    },
    {
      name: `service.storage.admin@${dataPartition}.dataservices.energy`,
      description: 'Storage Service Administrators - Full access to storage operations',
      serviceName: 'storage'
    },
    {
      name: `service.search.admin@${dataPartition}.dataservices.energy`,
      description: 'Search Service Administrators - Full access to search operations',
      serviceName: 'search'
    },
    {
      name: `service.legal.admin@${dataPartition}.dataservices.energy`,
      description: 'Legal Service Administrators - Full access to legal tag operations',
      serviceName: 'legal'
    },
    {
      name: `service.entitlements.admin@${dataPartition}.dataservices.energy`,
      description: 'Entitlements Service Administrators - Full access to entitlements and groups',
      serviceName: 'entitlements'
    }
  ];

  const bootstrapAdminGroups = async () => {
    setIsBootstrapping(true);
    setProgress(0);
    setResults([]);
    setError(null);

    try {
      const groupResults = [];
      const totalSteps = adminGroups.length; // Bootstrap group (single operation)
      let currentStep = 0;

      for (const group of adminGroups) {
        try {
          // Bootstrap the group (create if needed and ensure user is OWNER)
          console.log(`Bootstrapping OSDU service group: ${group.name}`);
          setProgress((currentStep / totalSteps) * 100);
          
          const bootstrapResult = await osduApi.bootstrapAdminGroup({
            name: group.name,
            description: group.description
          }, dataPartition);

          console.log(`✅ ${bootstrapResult.message}`);
          currentStep++;

          groupResults.push({
            group: group.name,
            service: group.serviceName,
            status: 'success',
            bootstrapResult: bootstrapResult,
            groupCreated: bootstrapResult.groupCreated,
            memberAdded: bootstrapResult.memberAdded
          });

        } catch (error: any) {
          console.error(`❌ Failed to bootstrap group ${group.name}:`, error);
          
          groupResults.push({
            group: group.name,
            service: group.serviceName,
            status: 'error',
            error: error.message
          });
          
          currentStep++; // Move to next group
        }
      }

      setProgress(100);
      setResults(groupResults);

      // Check if any groups were created successfully
      const successCount = groupResults.filter(r => r.status === 'success').length;
      if (successCount > 0) {
        console.log(`✅ Successfully bootstrapped ${successCount} admin service groups`);
      }

    } catch (error: any) {
      console.error('Bootstrap failed:', error);
      setError(error.message);
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <Container header={<Header variant="h2">OSDU Admin Groups Bootstrap</Header>}>
      <SpaceBetween direction="vertical" size="l">
        <Alert type="info" header="OSDU Admin Groups Bootstrap">
          This tool will create OSDU-compliant service admin groups and add {adminEmail} as OWNER to each group.
          This follows the OSDU group-based permissions model for proper service access control.
        </Alert>

        <Box>
          <SpaceBetween direction="vertical" size="s">
            <Header variant="h3">OSDU Service Admin Groups to Create:</Header>
            {adminGroups.map((group, index) => (
              <Box key={index} variant="p">
                <strong>{group.serviceName.toUpperCase()} Service Admin Group</strong><br/>
                🏷️ Group Name: {group.name}<br/>
                📝 Description: {group.description}<br/>
                👤 Admin User: {adminEmail} (OWNER role)<br/>
                🎯 Service: {group.serviceName}
              </Box>
            ))}
          </SpaceBetween>
        </Box>

        <Button
          onClick={bootstrapAdminGroups}
          loading={isBootstrapping}
          variant="primary"
          disabled={isBootstrapping}
        >
          {isBootstrapping ? 'Creating Admin Groups...' : 'Bootstrap Admin Groups'}
        </Button>

        {isBootstrapping && (
          <ProgressBar
            value={progress}
            label="Creating OSDU service admin groups"
            description={`${Math.round(progress)}% complete - Creating groups and adding admin user`}
          />
        )}

        {error && (
          <Alert type="error" header="Group Bootstrap Failed">
            {error}
          </Alert>
        )}

        {results.length > 0 && (
          <SpaceBetween direction="vertical" size="s">
            <Header variant="h3">Group Bootstrap Results:</Header>
            {results.map((result, index) => (
              <Alert
                key={index}
                type={result.status === 'success' ? 'success' : 'error'}
                header={`${result.service.toUpperCase()} Service Admin Group: ${result.status}`}
              >
                {result.status === 'success' ? (
                  <SpaceBetween direction="vertical" size="xs">
                    <Box variant="p">
                      ✅ <strong>Result:</strong> {result.bootstrapResult?.message}
                    </Box>
                    <Box variant="p">
                      🏗️ <strong>Group Created:</strong> {result.groupCreated ? 'Yes' : 'Already existed'}
                    </Box>
                    <Box variant="p">
                      👤 <strong>Admin Access:</strong> {result.memberAdded ? 'Added as OWNER' : 'Already OWNER'}
                    </Box>
                    <Box variant="p">
                      🎯 <strong>Service Access:</strong> Full admin access to {result.service} service
                    </Box>
                  </SpaceBetween>
                ) : (
                  <Box variant="p">
                    <strong>Error:</strong> {result.error}
                  </Box>
                )}
              </Alert>
            ))}
          </SpaceBetween>
        )}

        {results.length > 0 && results.some(r => r.status === 'success') && (
          <Alert type="success" header="Next Steps">
            <SpaceBetween direction="vertical" size="xs">
              <Box variant="p">OSDU service admin groups were created successfully!</Box>
              <Box variant="p"><strong>Next steps:</strong></Box>
              <Box variant="p">1. 🔄 Log out and log back in to refresh your tokens</Box>
              <Box variant="p">2. 🧪 Test the API test page - services should now recognize your group membership</Box>
              <Box variant="p">3. 📊 Try listing schemas - should work with group-based authorization</Box>
              <Box variant="p">4. 💾 Try storage operations - should work with admin group access</Box>
              <Box variant="p">5. 👥 Use the Group Management interface to manage additional users</Box>
            </SpaceBetween>
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default AdminBootstrap;
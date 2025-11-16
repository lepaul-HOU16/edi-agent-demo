const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const client = new LambdaClient({ region: 'us-east-1' });

async function testCalculator() {
  const payload = {
    tool: 'calculate_porosity',
    parameters: {
      well_name: 'WELL-001',
      method: 'density',
      matrix_density: 2.65,
      fluid_density: 1.0
    }
  };

  console.log('Testing petrophysics calculator...');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const command = new InvokeCommand({
      FunctionName: 'EnergyInsights-development-petrophysics-calculator',
      Payload: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());

    console.log('\n=== RESULT ===');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    
    if (result.results) {
      console.log('\nStatistics:');
      console.log('  Mean porosity:', result.results.statistics.mean.toFixed(3));
      console.log('  Min:', result.results.statistics.min.toFixed(3));
      console.log('  Max:', result.results.statistics.max.toFixed(3));
      console.log('  Count:', result.results.statistics.count);
    }

    if (result.error) {
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCalculator();

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Read .env.local file
try {
  const envFile = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envFile, 'utf8');

  // Parse environment variables
  const envVars = {};
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        envVars[key] = value;
      }
    }
  });

  // Extract Cognito configuration
  const region = envVars.VITE_AWS_REGION;
  const userPoolId = envVars.VITE_USER_POOL_ID;
  const clientId = envVars.VITE_USER_POOL_CLIENT_ID;

  console.log('Extracted Cognito configuration:');
  console.log(`Region: ${region}`);
  console.log(`User Pool ID: ${userPoolId}`);
  console.log(`Client ID: ${clientId}`);

  // Start the server
  console.log('\nStarting server...');
  exec('node serve-login.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });

  // Open the browser with the correct URL
  const url = `http://localhost:3000/standalone-login.html?region=${region}&userPoolId=${userPoolId}&clientId=${clientId}`;
  console.log(`\nOpening browser at: ${url}`);

  // Open browser based on platform
  const openCommand = process.platform === 'win32' ? 'start' :
    process.platform === 'darwin' ? 'open' : 'xdg-open';

  exec(`${openCommand} "${url}"`);

} catch (error) {
  console.error('Error reading .env.local file:', error);
}

import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createRenewableDemoLayer(scope: Construct): lambda.LayerVersion {
  return new lambda.LayerVersion(scope, 'RenewableDemoLayer', {
    code: lambda.Code.fromAsset(join(__dirname, 'python')),
    compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
    compatibleArchitectures: [lambda.Architecture.X86_64],
    description: 'Renewable energy demo Python code and dependencies',
  });
}
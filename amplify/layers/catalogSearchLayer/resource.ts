import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Lambda Layer for Catalog Search Dependencies
 * 
 * Provides Python packages required by the catalogSearch Lambda:
 * - requests: HTTP client for OSDU API calls
 * - boto3/botocore: AWS SDK (though Lambda provides this, we include for consistency)
 * - strands-agents: AI agent framework
 * - strands-agents-tools: Agent tools
 * - mcp: Model Context Protocol
 * - Other dependencies (pydantic, httpx, etc.)
 * 
 * Updated: Packages now in python/ directory (not python/lib/)
 */
export function createCatalogSearchLayer(scope: Construct): lambda.LayerVersion {
    return new lambda.LayerVersion(scope, 'CatalogSearchLayer', {
        layerVersionName: 'catalog-search-dependencies',
        code: lambda.Code.fromAsset(__dirname), // Point to directory containing python/ folder
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
        compatibleArchitectures: [lambda.Architecture.ARM_64],
        description: 'Python dependencies for catalog search: requests, strands-agents, mcp, etc.',
    });
}

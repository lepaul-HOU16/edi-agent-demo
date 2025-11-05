#!/bin/bash

# Configure Bedrock Agent Action Group for Petrophysics
# This script automates the action group configuration after Lambda deployment

set -e

echo "🤖 === AGENTCORE ACTION GROUP CONFIGURATION ==="
echo ""

# Configuration
AGENT_ID="QUQKELPKM2"
AGENT_VERSION="DRAFT"
ACTION_GROUP_NAME="petrophysics-tools"

# Step 1: Get Lambda ARN
echo "📋 Step 1: Finding petrophysicsCalculator Lambda..."
LAMBDA_ARN=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'Petrophysics') || contains(FunctionName, 'petrophysics')].FunctionArn" --output text)

if [ -z "$LAMBDA_ARN" ]; then
  echo "❌ ERROR: petrophysicsCalculator Lambda not found!"
  echo ""
  echo "Please deploy the backend first:"
  echo "  npx ampx sandbox"
  echo ""
  exit 1
fi

echo "✅ Found Lambda: $LAMBDA_ARN"
echo ""

# Step 2: Check if action group already exists
echo "📋 Step 2: Checking for existing action group..."
EXISTING_ACTION_GROUP=$(aws bedrock-agent list-agent-action-groups \
  --agent-id "$AGENT_ID" \
  --agent-version "$AGENT_VERSION" \
  --query "actionGroupSummaries[?actionGroupName=='$ACTION_GROUP_NAME'].actionGroupId" \
  --output text)

if [ -n "$EXISTING_ACTION_GROUP" ]; then
  echo "⚠️  Action group '$ACTION_GROUP_NAME' already exists (ID: $EXISTING_ACTION_GROUP)"
  echo ""
  read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Deleting existing action group..."
    aws bedrock-agent delete-agent-action-group \
      --agent-id "$AGENT_ID" \
      --agent-version "$AGENT_VERSION" \
      --action-group-id "$EXISTING_ACTION_GROUP"
    echo "✅ Deleted existing action group"
    echo ""
  else
    echo "❌ Cancelled. Exiting."
    exit 0
  fi
fi

# Step 3: Create API schema for action group
echo "📋 Step 3: Creating API schema..."
cat > /tmp/petrophysics-api-schema.json << 'EOF'
{
  "openapi": "3.0.0",
  "info": {
    "title": "Petrophysics Tools API",
    "version": "1.0.0",
    "description": "API for petrophysical calculations and well data analysis"
  },
  "paths": {
    "/calculate_porosity": {
      "post": {
        "summary": "Calculate porosity for a well",
        "description": "Calculate porosity using density, neutron, or effective methods",
        "operationId": "calculate_porosity",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["well_name", "method"],
                "properties": {
                  "well_name": {
                    "type": "string",
                    "description": "Name of the well"
                  },
                  "method": {
                    "type": "string",
                    "enum": ["density", "neutron", "effective"],
                    "description": "Calculation method"
                  },
                  "depth_start": {
                    "type": "number",
                    "description": "Start depth in feet (optional)"
                  },
                  "depth_end": {
                    "type": "number",
                    "description": "End depth in feet (optional)"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful porosity calculation",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {"type": "boolean"},
                    "message": {"type": "string"},
                    "artifacts": {"type": "array"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/calculate_shale_volume": {
      "post": {
        "summary": "Calculate shale volume",
        "description": "Calculate shale volume using various methods",
        "operationId": "calculate_shale_volume",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["well_name", "method"],
                "properties": {
                  "well_name": {"type": "string"},
                  "method": {
                    "type": "string",
                    "enum": ["larionov_tertiary", "larionov_pre_tertiary", "linear", "clavier"]
                  },
                  "depth_start": {"type": "number"},
                  "depth_end": {"type": "number"}
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful calculation"
          }
        }
      }
    },
    "/calculate_saturation": {
      "post": {
        "summary": "Calculate water saturation",
        "description": "Calculate water saturation using Archie's equation",
        "operationId": "calculate_saturation",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["well_name", "method"],
                "properties": {
                  "well_name": {"type": "string"},
                  "method": {"type": "string", "enum": ["archie"]},
                  "porosity_method": {"type": "string"},
                  "depth_start": {"type": "number"},
                  "depth_end": {"type": "number"}
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful calculation"
          }
        }
      }
    },
    "/list_wells": {
      "get": {
        "summary": "List all available wells",
        "description": "Get a list of all wells in the system",
        "operationId": "list_wells",
        "responses": {
          "200": {
            "description": "List of wells"
          }
        }
      }
    },
    "/get_well_info": {
      "post": {
        "summary": "Get well information",
        "description": "Get detailed information about a specific well",
        "operationId": "get_well_info",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["well_name"],
                "properties": {
                  "well_name": {"type": "string"}
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Well information"
          }
        }
      }
    }
  }
}
EOF

echo "✅ API schema created"
echo ""

# Step 4: Create action group
echo "📋 Step 4: Creating action group..."
aws bedrock-agent create-agent-action-group \
  --agent-id "$AGENT_ID" \
  --agent-version "$AGENT_VERSION" \
  --action-group-name "$ACTION_GROUP_NAME" \
  --action-group-executor lambda="$LAMBDA_ARN" \
  --api-schema payload=file:///tmp/petrophysics-api-schema.json \
  --description "Petrophysical calculation tools for well data analysis" \
  --action-group-state ENABLED

echo "✅ Action group created"
echo ""

# Step 5: Add Lambda permission for Bedrock to invoke it
echo "📋 Step 5: Adding Lambda permission for Bedrock..."
aws lambda add-permission \
  --function-name "$LAMBDA_ARN" \
  --statement-id bedrock-agent-invoke-$(date +%s) \
  --action lambda:InvokeFunction \
  --principal bedrock.amazonaws.com \
  --source-arn "arn:aws:bedrock:us-east-1:$(aws sts get-caller-identity --query Account --output text):agent/$AGENT_ID" \
  2>/dev/null || echo "⚠️  Permission may already exist (this is okay)"

echo "✅ Lambda permission added"
echo ""

# Step 6: Prepare agent
echo "📋 Step 6: Preparing agent..."
aws bedrock-agent prepare-agent --agent-id "$AGENT_ID"

echo "✅ Agent prepared"
echo ""

# Step 7: Verify configuration
echo "📋 Step 7: Verifying configuration..."
aws bedrock-agent list-agent-action-groups \
  --agent-id "$AGENT_ID" \
  --agent-version "$AGENT_VERSION" \
  --output table

echo ""
echo "🎉 === CONFIGURATION COMPLETE ==="
echo ""
echo "Next steps:"
echo "1. Test integration: node tests/test-agentcore-integration.js"
echo "2. Test in UI: npm run dev"
echo "3. Send message: 'calculate porosity for well-001'"
echo ""
echo "Troubleshooting:"
echo "- Check CloudWatch logs: aws logs tail /aws/lambda/$(basename $LAMBDA_ARN) --follow"
echo "- View agent details: aws bedrock-agent get-agent --agent-id $AGENT_ID"
echo ""

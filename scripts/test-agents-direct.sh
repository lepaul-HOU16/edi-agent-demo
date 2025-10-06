#!/bin/bash

# Test the renewable agents directly (without AgentCore)
# This helps verify the agents work before deploying to AgentCore

echo "======================================================================"
echo "  Testing Renewable Agents Directly"
echo "======================================================================"

cd agentic-ai-for-renewable-site-design-mainline/workshop-assets

# Activate virtual environment
source .venv/bin/activate

# Set environment variables
export AWS_REGION=us-west-2
export INTERACTIVE_MODE=1
export GET_INFO_LOGS=0
export DISABLE_CALLBACK_HANDLER=1

echo ""
echo "🧪 Testing Multi-Agent System..."
echo ""
echo "This will run the multi-agent system interactively."
echo "Try this query:"
echo "  'Analyze terrain for wind farm at 35.067482, -101.395466 with project_id test123'"
echo ""

# Run the multi-agent system
python agents/multi_agent.py

#!/usr/bin/env python3
"""
Simple FastAPI server that wraps the renewable energy agents.
This provides an HTTP endpoint that the EDI Platform frontend can call.

Run with: uvicorn run-renewable-api:app --reload --port 8000
"""

import os
import sys
from pathlib import Path

# Add workshop directory to path
WORKSHOP_DIR = Path(__file__).parent.parent / "agentic-ai-for-renewable-site-design-mainline" / "workshop-assets"
sys.path.insert(0, str(WORKSHOP_DIR))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3

# Set environment variables
os.environ['AWS_REGION'] = 'us-west-2'
os.environ['DISABLE_CALLBACK_HANDLER'] = '1'

app = FastAPI(title="Renewable Energy API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AgentRequest(BaseModel):
    prompt: str
    session_id: str | None = None

class AgentResponse(BaseModel):
    success: bool
    message: str
    artifacts: list = []
    thought_steps: list = []
    agent_used: str = "renewable_energy"

@app.get("/")
async def root():
    return {
        "service": "Renewable Energy API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "/invoke": "POST - Invoke the renewable energy multi-agent system",
            "/health": "GET - Health check"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/invoke", response_model=AgentResponse)
async def invoke_agent(request: AgentRequest):
    """
    Invoke the renewable energy multi-agent system.
    
    Example request:
    {
        "prompt": "Analyze terrain for wind farm at 35.067482, -101.395466 with project_id test123"
    }
    """
    try:
        # Import agents (lazy import to avoid startup issues)
        from agents.multi_agent import create_agent_graph
        
        # Create the agent graph
        agent_graph = create_agent_graph()
        
        # Invoke the agent
        response = agent_graph(request.prompt)
        
        # Parse the response
        # Note: The actual response format depends on how the agents return data
        # This is a simplified version
        return AgentResponse(
            success=True,
            message=str(response),
            artifacts=[],  # TODO: Extract artifacts from response
            thought_steps=[],  # TODO: Extract thought steps from response
            agent_used="renewable_energy"
        )
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error invoking agent: {error_details}")
        
        raise HTTPException(
            status_code=500,
            detail=f"Error invoking renewable energy agent: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("  Renewable Energy API Server")
    print("=" * 70)
    print("\n🚀 Starting server on http://localhost:8000")
    print("\n📚 API Documentation: http://localhost:8000/docs")
    print("\n🧪 Test endpoint:")
    print('   curl -X POST http://localhost:8000/invoke \\')
    print('     -H "Content-Type: application/json" \\')
    print('     -d \'{"prompt": "Analyze terrain for wind farm at 35.067482, -101.395466 with project_id test123"}\'')
    print("\n" + "=" * 70)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)

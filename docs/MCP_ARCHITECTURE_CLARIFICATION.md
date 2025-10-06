# MCP Architecture Clarification

## Question: What about the MCP servers?

This document clarifies the role of MCP (Model Context Protocol) servers in the renewable energy integration.

---

## Architecture Overview

### Two Different MCP Use Cases

The EDI Platform uses MCP servers in **two different ways**:

#### 1. Frontend MCP Servers (Petrophysical Analysis)
**Location**: Configured in `.kiro/settings/mcp.json`  
**Purpose**: Direct tool access from Kiro IDE and frontend  
**Example**: `petrophysical-analysis` MCP server

```json
{
  "mcpServers": {
    "petrophysical-analysis": {
      "command": "/path/to/start_mcp_server.sh",
      "autoApprove": [
        "list_wells",
        "get_well_info",
        "calculate_porosity"
      ]
    }
  }
}
```

**Usage**: Frontend directly calls MCP tools for petrophysical calculations.

#### 2. Backend MCP Servers (Renewable Energy)
**Location**: Deployed within AgentCore runtime  
**Purpose**: Tools for Python agents running in the backend  
**Example**: `wind_farm_mcp_server.py` (part of deployed backend)

**Usage**: Python agents in AgentCore use MCP tools internally. Frontend does NOT directly call these MCP servers.

---

## Renewable Energy Architecture

### Current Implementation (Correct ✅)

```
┌─────────────────────────────────────────────────────────────────┐
│                    EDI Platform Frontend                         │
│                                                                  │
│  User Query → Agent Router → RenewableProxyAgent                │
│                                    ↓                             │
│                            RenewableClient                       │
│                                    ↓                             │
└────────────────────────────────────┼─────────────────────────────┘
                                     │
                                     │ HTTP POST
                                     │ (AgentCore Invoke API)
                                     ↓
┌─────────────────────────────────────────────────────────────────┐
│              AWS Bedrock AgentCore Runtime                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Renewable Energy Multi-Agent System            │    │
│  │                                                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │ Terrain  │  │  Layout  │  │Simulation│            │    │
│  │  │  Agent   │  │  Agent   │  │  Agent   │            │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │    │
│  │       │             │             │                    │    │
│  │       └─────────────┼─────────────┘                    │    │
│  │                     ↓                                   │    │
│  │  ┌──────────────────────────────────────────────────┐ │    │
│  │  │    MCP Server (wind_farm_mcp_server.py)          │ │    │
│  │  │                                                   │ │    │
│  │  │  Tools:                                           │ │    │
│  │  │  - get_wind_resource_data()                      │ │    │
│  │  │  - get_turbine_specifications()                  │ │    │
│  │  │  - analyze_terrain()                             │ │    │
│  │  │  - calculate_wake_effects()                      │ │    │
│  │  │  - optimize_layout()                             │ │    │
│  │  └──────────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Points

1. **Frontend does NOT configure renewable MCP server**
   - The `wind_farm_mcp_server.py` is NOT in `.kiro/settings/mcp.json`
   - Frontend does NOT directly call MCP tools
   - Frontend calls AgentCore HTTP endpoint

2. **Backend uses MCP server internally**
   - Python agents in AgentCore use MCP tools
   - MCP server is part of the deployed backend
   - MCP server provides tools like `get_wind_resource_data()`, `optimize_layout()`, etc.

3. **Communication flow**
   ```
   Frontend → HTTP → AgentCore → MCP Tools → Response → Frontend
   ```

---

## Why This Architecture?

### Advantages of HTTP + AgentCore

1. **Simplicity**: Frontend only needs HTTP client, not MCP client
2. **Security**: MCP server is isolated within backend
3. **Scalability**: AgentCore handles agent orchestration
4. **Flexibility**: Backend can use multiple MCP servers without frontend changes
5. **Deployment**: MCP server deployed once with backend, not on every client

### When to Use Direct MCP (Frontend)

Use direct MCP connection when:
- ✅ Tools are simple and stateless
- ✅ No complex agent orchestration needed
- ✅ Low latency required
- ✅ Tools run locally or in accessible environment

**Example**: Petrophysical calculations (simple, stateless, fast)

### When to Use HTTP + AgentCore (Backend MCP)

Use AgentCore with internal MCP when:
- ✅ Complex multi-agent workflows
- ✅ Agent orchestration required
- ✅ Tools need shared state
- ✅ Backend-only resources (APIs, databases)

**Example**: Renewable energy analysis (complex, multi-step, orchestrated)

---

## Comparison Table

| Aspect | Petrophysical MCP | Renewable MCP |
|--------|-------------------|---------------|
| **Location** | Frontend config | Backend deployment |
| **Access** | Direct from frontend | Via AgentCore HTTP |
| **Configuration** | `.kiro/settings/mcp.json` | Backend deployment |
| **Tools** | Simple calculations | Complex workflows |
| **Orchestration** | None | Multi-agent system |
| **State** | Stateless | Stateful agents |
| **Deployment** | Local/accessible | AWS Bedrock |

---

## Implementation Status

### ✅ What We Implemented

1. **RenewableClient** - HTTP client for AgentCore
2. **RenewableProxyAgent** - Agent that calls RenewableClient
3. **Agent Router** - Routes renewable queries to proxy agent
4. **UI Components** - Render renewable artifacts

### ❌ What We Did NOT Implement (And Don't Need To)

1. ~~Direct MCP connection from frontend~~
2. ~~MCP server configuration in `.kiro/settings/mcp.json`~~
3. ~~MCP tool calls from frontend~~

**Reason**: The renewable backend is accessed via HTTP, not direct MCP.

---

## MCP Server Details (Backend)

### wind_farm_mcp_server.py

**Location**: Deployed within AgentCore runtime  
**Purpose**: Provides tools for renewable energy analysis

**Tools Provided**:
```python
# Wind resource data
get_wind_resource_data(lat, lng, height)
get_wind_rose_data(lat, lng)

# Turbine specifications
get_turbine_specifications(model)
list_available_turbines()

# Terrain analysis
analyze_terrain(lat, lng, radius)
identify_exclusion_zones(lat, lng, radius)

# Layout optimization
optimize_turbine_layout(site_data, turbine_model, capacity)
calculate_spacing(turbine_model, wind_direction)

# Performance simulation
calculate_wake_effects(layout, wind_data)
estimate_annual_energy_production(layout, wind_data, turbine_model)

# GIS operations
create_site_map(lat, lng, features)
export_geojson(layout)
```

**Usage by Agents**:
```python
# Terrain Agent
terrain_data = mcp_client.call_tool(
    "analyze_terrain",
    lat=35.067482,
    lng=-101.395466,
    radius=5000
)

# Layout Agent
optimized_layout = mcp_client.call_tool(
    "optimize_turbine_layout",
    site_data=terrain_data,
    turbine_model="Vestas V150",
    capacity=30
)

# Simulation Agent
performance = mcp_client.call_tool(
    "calculate_wake_effects",
    layout=optimized_layout,
    wind_data=wind_resource
)
```

---

## FAQ

### Q: Should we add renewable MCP server to `.kiro/settings/mcp.json`?
**A**: No. The renewable MCP server is part of the backend deployment, not a frontend tool.

### Q: Can the frontend directly call renewable MCP tools?
**A**: No. The frontend calls AgentCore HTTP endpoint, which internally uses MCP tools.

### Q: How do we test the renewable MCP server?
**A**: Test via AgentCore endpoint. The MCP server is tested as part of the backend deployment.

### Q: Can we use both architectures?
**A**: Yes! Petrophysical uses direct MCP, renewable uses HTTP + AgentCore. Both are valid for different use cases.

### Q: What if we want to add more renewable tools?
**A**: Add tools to `wind_farm_mcp_server.py` in the backend. No frontend changes needed.

---

## Conclusion

The current implementation is **correct and complete**. The renewable energy integration uses:

1. ✅ **HTTP communication** (RenewableClient → AgentCore)
2. ✅ **Backend MCP server** (used internally by Python agents)
3. ✅ **No frontend MCP configuration** (not needed)

The MCP server (`wind_farm_mcp_server.py`) is part of the deployed backend and does not need to be configured in the frontend.

---

**Status**: ✅ Architecture is correct  
**Action Required**: None - implementation is complete  
**Documentation**: This clarification document

#!/usr/bin/env python3
"""
Simple test to verify MCP server can start
"""
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server

# Create a simple server
server = Server("test-server")

@server.list_tools()
async def list_tools():
    return []

async def main():
    print("Starting MCP test server...")
    try:
        async with stdio_server() as (read_stream, write_stream):
            print("Server started successfully")
            await server.run(read_stream, write_stream, server.create_initialization_options())
    except Exception as e:
        print(f"Server error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
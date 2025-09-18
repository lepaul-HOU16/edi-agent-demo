import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZodRawShape } from "zod";
import mcpMiddleware from "middy-mcp";

import { APIGatewayProxyEvent } from 'aws-lambda';
import { petrophysicsTools } from "../tools/petrophysicsTools";


// Create an MCP server focused on petrophysical analysis
const server = new McpServer({
    name: "Petrophysical Analysis MCP Server",
    version: "1.0.0",
});


// Register petrophysical tools (lightweight, no LangChain dependencies)
for (const petrophysicsTool of petrophysicsTools) {
    console.log('Registering petrophysical tool ', petrophysicsTool.name)
    
    server.registerTool(
        petrophysicsTool.name,
        {
            title: petrophysicsTool.name,
            description: petrophysicsTool.description,
            inputSchema: (petrophysicsTool.inputSchema as any).shape as ZodRawShape
        },
        async (args: any) => {
            try {
                const result = await petrophysicsTool.func(args);
                return {
                    content: [{ type: "text", text: result }],
                };
            } catch (error) {
                console.error(`Error in petrophysical tool ${petrophysicsTool.name}:`, error);
                return {
                    content: [{ type: "text", text: JSON.stringify({
                        success: false,
                        error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }) }],
                };
            }
        }
    );
}

// Add logging middleware
const logMiddleware = () => {
    return {
        before: async (request: any) => {
            console.log("Before middleware execution");
            // console.log("Request:", JSON.stringify(request));
        },
        after: async (request: any) => {
            console.log("After middleware execution");
            console.log("Response:", JSON.stringify(request.response));
        },
        onError: async (request: any) => {
            console.error("Middleware error:", request.error);
        }
    };
};

export const handler = middy(async (
    event: APIGatewayProxyEvent
) => {
    console.log('Petrophysical MCP Server Event: ', event)
    const chatSessionId = event.headers["chat-session-id"] ?? "default-session-id"
    console.log('Chat Session Id: ', chatSessionId)

    // The return will be handled by the mcp server
    return {};
})
    .use(logMiddleware())
    .use(mcpMiddleware({ server }))
    .use(httpErrorHandler());

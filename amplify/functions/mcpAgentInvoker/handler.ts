import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import mcpMiddleware from "middy-mcp";

import { APIGatewayProxyEvent } from 'aws-lambda';
import { setChatSessionId } from "../tools/toolUtils";
import { getConfiguredAmplifyClient } from "../../../utils/amplifyUtils";
import { createChatSession } from "../graphql/mutations";

import * as APITypes from "../graphql/API";
import { createChatMessage, invokeReActAgent, invokeLightweightAgent, listChatMessageByChatSessionIdAndCreatedAt } from "../../../utils/graphqlStatements";

// Create an MCP server
const server = new McpServer({
    name: "Lambda hosted MCP Server",
    version: "1.0.0",
});

server.registerTool("invokeReactAgent", {
    title: "invokeReactAgent",              // This title takes precedence
    description: "Invokes the enhanced conversational petrophysical analysis agent with educational capabilities",
    inputSchema: { prompt: z.string() }
}, async ({ prompt }) => {
    const amplifyClient = getConfiguredAmplifyClient()
    
    console.log('🎓 MCP AGENT: Invoking Enhanced Conversational Agent');
    console.log('📝 Prompt:', prompt);
    
    // Use invokeLightweightAgent to access our enhanced conversational agent
    const invokeEnhancedAgentResponse = await amplifyClient.graphql({
        query: invokeLightweightAgent,
        variables: {
            chatSessionId: 'mcp-session-' + Date.now(),
            message: prompt,
            foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
            userId: 'mcp-user'
        },
    });

    console.log('🎯 Enhanced Agent Response: ', invokeEnhancedAgentResponse);

    if ('errors' in invokeEnhancedAgentResponse && invokeEnhancedAgentResponse.errors) {
        console.error('❌ Enhanced Agent Errors:', invokeEnhancedAgentResponse.errors);
        return {
            content: [{ type: "text", text: "Error invoking Enhanced Conversational Agent: " + JSON.stringify(invokeEnhancedAgentResponse.errors) }],
        }
    }

    const result = 'data' in invokeEnhancedAgentResponse ? (invokeEnhancedAgentResponse.data as any)?.invokeLightweightAgent : null;
    
    if (result && result.success) {
        console.log('✅ Enhanced Agent Success');
        console.log('📊 Message length:', result.message?.length || 0);
        console.log('📦 Artifacts count:', result.artifacts?.length || 0);
        
        let responseText = result.message || "Enhanced analysis completed";
        
        // If there are artifacts, mention them in the response
        if (result.artifacts && result.artifacts.length > 0) {
            responseText += `\n\n📊 **Interactive Analysis Generated** (${result.artifacts.length} visualization${result.artifacts.length > 1 ? 's' : ''})`;
            responseText += `\nThe enhanced analysis includes interactive charts, plots, and professional documentation.`;
        }
        
        return {
            content: [{ type: "text", text: responseText }],
        }
    } else {
        console.error('❌ Enhanced Agent Failed:', result);
        return {
            content: [{ type: "text", text: result?.message || "Enhanced Agent returned no response" }],
        }
    }
});

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
    console.log('Event: ', event)
    const chatSessionId = event.headers["chat-session-id"] ?? "default-session-id"
    console.log('Chat Session Id: ', chatSessionId)

    setChatSessionId(chatSessionId);
    // setFoundationModelId(event.headers["foundation-model-id"] ?? "default-foundation-model-id");
    // The return will be handled by the mcp server
    return {};
})
    .use(logMiddleware())
    .use(mcpMiddleware({ server }))
    .use(httpErrorHandler());

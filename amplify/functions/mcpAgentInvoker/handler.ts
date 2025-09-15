import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
// import mcpMiddleware from "middy-mcp"; // Commented out - module not available

import { APIGatewayProxyEvent } from 'aws-lambda';
import { setChatSessionId } from "../tools/toolUtils";
import { getConfiguredAmplifyClient } from "../../../utils/amplifyUtils";
import { createChatSession } from "../graphql/mutations";

import * as APITypes from "../graphql/API";
import { createChatMessage, invokeReActAgent, listChatMessageByChatSessionIdAndCreatedAt } from "../../../utils/graphqlStatements";

// Create an MCP server
const server = new McpServer({
    name: "Lambda hosted MCP Server",
    version: "1.0.0",
});

server.registerTool("invokeReactAgent", {
    title: "invokeReactAgent",              // This title takes precedence
    description: "Invokes an agent which specializes in operational tasks, like running large scale data analysis",
    inputSchema: { prompt: z.string() }
}, async ({ prompt }) => {
    const amplifyClient = getConfiguredAmplifyClient()
    // Create a new chat session
    console.log('Creating new chat session');
    const { data: newChatSession, errors: newChatSessionErrors } = await amplifyClient.graphql({
        query: createChatSession,
        variables: {
            input: {
                name: `Test Chat Session`
            }
        }
    });
    if (newChatSessionErrors) {
        console.error(newChatSessionErrors);
        process.exit(1);
    }

    const { errors: newChatMessageErrors } = await amplifyClient.graphql({
        query: createChatMessage,
        variables: {
            input: {
                chatSessionId: newChatSession.createChatSession.id,
                content: {
                    text: prompt
                },
                role: APITypes.ChatMessageRole.human
            }
        }
    });

    if (newChatMessageErrors) {
        console.error(newChatMessageErrors);
        process.exit(1);
    }

    const invokeReActAgentResponse = await amplifyClient.graphql({
        query: invokeReActAgent,
        variables: {
            chatSessionId: newChatSession.createChatSession.id,
            userId: 'test-user',
            // origin: domainUrl
        },
    });

    console.log('Invoke ReAct Agent Response: ', invokeReActAgentResponse);

    if (invokeReActAgentResponse.errors) {
        console.error(invokeReActAgentResponse.errors);
        process.exit(1);
    }

    let responseComplete = false;
    const waitStartTime = Date.now();
    while (!responseComplete) {
        const { data, errors: lastMessageErrors } = await amplifyClient.graphql({
            query: listChatMessageByChatSessionIdAndCreatedAt,
            variables: {
                chatSessionId: newChatSession.createChatSession.id,
                sortDirection: APITypes.ModelSortDirection.DESC,
                limit: 1
            }
        });
        if (lastMessageErrors) {
            console.error(lastMessageErrors);
            process.exit(1);
        }

        const messages = data.listChatMessageByChatSessionIdAndCreatedAt.items;
        if (messages.length > 0) {
            const lastMessage = messages[0];
            responseComplete = lastMessage.responseComplete || false;
            if (responseComplete) console.log('Assistant response complete. Final response: \n', lastMessage.content?.text);

            const finalResponseText = lastMessage.content?.text || "No Text Returned"

            return {
                content: [{ type: "text", text: finalResponseText }],
            }
        }

        if (!responseComplete) {
            const elapsedSeconds = Math.floor((Date.now() - waitStartTime) / 1000);
            console.log(`Waiting for assistant to finish analysis... (${elapsedSeconds} seconds)`);
            // Wait x seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }

    return {
        content: [{ type: "text", text: "Error invoking Agent" }],
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
    // .use(mcpMiddleware({ server })) // Commented out - middy-mcp module not available
    .use(httpErrorHandler());

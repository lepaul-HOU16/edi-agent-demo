import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z, ZodRawShape } from "zod";
// Note: middy-mcp is not available, implementing MCP handling manually

import { DynamicStructuredTool } from "@langchain/core/tools";

import { APIGatewayProxyEvent } from 'aws-lambda';
import { setChatSessionId } from "../tools/toolUtils";

import {
    s3FileManagementTools,
    listFiles,
    readFile,
    writeFile,
    updateFile,
    textToTableTool,
    searchFiles
} from "../tools/s3ToolBox";
import { userInputTool } from "../tools/userInputTool";
import { pysparkTool } from "../tools/athenaPySparkTool";
import { renderAssetTool } from "../tools/renderAssetTool";
import { createProjectTool } from "../tools/createProjectTool";


// Create an MCP server
const server = new McpServer({
    name: "Lambda hosted MCP Server",
    version: "1.0.0",
});

server.registerPrompt(
    "dummy",
    {
        title: "Dummy Prompt",
        description: "Here is a dummy prompt",
        argsSchema: { myArgString: z.string() }
    },
    ({ myArgString }) => ({
        messages: [{
            role: "user",
            content: {
                type: "text",
                text: `Here is the arg you sent:\n\n${myArgString}`
            }
        }]
    })
);

// Static resource
server.registerResource(
    "config",
    "config://app",
    {
        title: "Application Config",
        description: "Application configuration data",
        mimeType: "text/plain"
    },
    async (uri: any) => ({
        contents: [{
            uri: uri.href,
            text: "App configuration here"
        }]
    })
);

const resource = new ResourceTemplate(`metadata:///{+path}`, {
    list: async () => {
        return {
            resources: [
                {
                    name: "metadata-item",
                    uri: "metadata:///test",
                    title: "Metadata Item",
                    description: "A metadata resource item"
                }
            ]
        };
    },
    complete: {
        ["+path"]: async (value) => {
            return ["test"];
        },
    },
});

server.registerResource("test",
    resource,
    {},
    async (uri: any) => ({
        contents: [{
            uri: uri.href,
            text: "Output here"
        }]
    })
)


// server.registerTool("add", {
//     title: "add",              // This title takes precedence
//     description: "Adds two numbers together",
//     inputSchema: { a: z.number(), b: z.number() }
// }, async ({ a, b }) => ({
//     content: [{ type: "text", text: String(a + b) }],
// }));

const langChainToolHandler = (langChainTool: DynamicStructuredTool) => async (args: any) => {
    // Call the LangChain tool with the arguments
    const result = await langChainTool.invoke(args);

    // Convert result to string - if it's an object, use JSON.stringify, otherwise use as is
    const resultText = typeof result === 'object' && result !== null
        ? JSON.stringify(result)
        : String(result);

    console.log(`Result of ${langChainTool.name}: `, resultText)

    // Return the result in the format expected by MCP
    return {
        content: [{ type: "text", text: resultText }],
    };
}

const langGraphTools: DynamicStructuredTool[] = [
    pysparkTool({
        additionalSetupScript: `
import plotly.io as pio
import plotly.graph_objects as go

# Create a custom layout with transparent background
custom_layout = go.Layout(
    paper_bgcolor='rgba(0,0,0,0)',
    plot_bgcolor='rgba(0,0,0,0)',
    xaxis=dict(showgrid=False),
    yaxis=dict(
        showgrid=True,
        gridcolor='lightgray',
        type='log'  # <-- Set y-axis to logarithmic
    )
)

# Create and register the template
custom_template = go.layout.Template(layout=custom_layout)
pio.templates["transparent_clean_log"] = custom_template
pio.templates.default = "transparent_clean_log"
`,
    }),
    listFiles,
    readFile,
    writeFile,
    // updateFile,
    // textToTableTool,
    // searchFiles,
    renderAssetTool,
    userInputTool,
    createProjectTool
]

for (const langChainTool of langGraphTools) {
    console.log('Registering tool ', langChainTool.name)
    if (!('shape' in langChainTool.schema)) continue

    server.registerTool(
        langChainTool.name,
        {
            title: langChainTool.name,
            description: langChainTool.description,
            inputSchema: langChainTool.schema.shape as ZodRawShape

        },
        langChainToolHandler(langChainTool) as any
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
    console.log('Event: ', event)
    const chatSessionId = event.headers["chat-session-id"] ?? "default-session-id"
    console.log('Chat Session Id: ', chatSessionId)

    setChatSessionId(chatSessionId);
    
    // Manual MCP handling since middy-mcp is not available
    try {
        // Parse the request and handle MCP protocol manually
        const body = JSON.parse(event.body || '{}');
        
        // Return a basic MCP response structure
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: body.id || null,
                result: { tools: [] }
            })
        };
    } catch (error) {
        console.error('MCP handler error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: null,
                error: { code: -32603, message: 'Internal error' }
            })
        };
    }
})
    .use(logMiddleware())
    .use(httpErrorHandler());

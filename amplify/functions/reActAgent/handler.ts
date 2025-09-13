import { stringify } from "yaml";

import { getConfiguredAmplifyClient } from '../../../utils/amplifyUtils';

import { ChatBedrockConverse } from "@langchain/aws";
import { HumanMessage, ToolMessage, BaseMessage, SystemMessage, AIMessageChunk, AIMessage } from "@langchain/core/messages";
import { Calculator } from "@langchain/community/tools/calculator";
import { Tool, StructuredToolInterface, ToolSchemaBase } from "@langchain/core/tools";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

import { publishResponseStreamChunk } from "../graphql/mutations";

import { setChatSessionId } from "../tools/toolUtils";
import { s3FileManagementTools } from "../tools/s3ToolBox";
import { getGlobalDirectoryContext, scanWithUploadDetection, refreshContextForUploads, scanGlobalDirectory } from "../tools/globalDirectoryScanner";
import { classifyQueryIntent } from "../tools/queryIntentClassifier";
import { userInputTool } from "../tools/userInputTool";
import { pysparkTool } from "../tools/athenaPySparkTool";
import { renderAssetTool } from "../tools/renderAssetTool";
import { createProjectTool } from "../tools/createProjectTool";
import { permeabilityCalculator } from "../tools/customWorkshopTool";
import { plotDataTool } from "../tools/plotDataTool";
import { petrophysicsSystemMessage } from "./petrophysicsSystemMessage";

import { Schema } from '../../data/resource';

import { getLangChainChatMessagesStartingWithHumanMessage, getLangChainMessageTextContent, publishMessage, stringifyLimitStringLength } from '../../../utils/langChainUtils';
import { EventEmitter } from "events";

import { startMcpBridgeServer } from "./awsSignedMcpBridge"

const USE_MCP = false;
const LOCAL_PROXY_PORT = 3020

let mcpTools: StructuredToolInterface<ToolSchemaBase, any, any>[] = []

// Increase the default max listeners to prevent warnings
EventEmitter.defaultMaxListeners = 10;

const graphQLFieldName = 'invokeReActAgent'

export const handler: Schema["invokeReActAgent"]["functionHandler"] = async (event, context) => {
    console.log('event:\n', JSON.stringify(event, null, 2))

    const foundationModelId = event.arguments.foundationModelId || process.env.AGENT_MODEL_ID
    if (!foundationModelId) throw new Error("AGENT_MODEL_ID is not set");

    const userId = event.arguments.userId || (event.identity && 'sub' in event.identity ? event.identity.sub : null);
    if (!userId) throw new Error("userId is required");

    try {
        if (event.arguments.chatSessionId === null) throw new Error("chatSessionId is required");

        // Set the chat session ID for use by the S3 tools
        setChatSessionId(event.arguments.chatSessionId);

        // Define the S3 prefix for this chat session (needed for env vars)
        const bucketName = process.env.STORAGE_BUCKET_NAME || "amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m";
        if (!bucketName) throw new Error("STORAGE_BUCKET_NAME is not set");

        const amplifyClient = getConfiguredAmplifyClient();

        amplifyClient.graphql({
            query: publishResponseStreamChunk,
            variables: {
                chunkText: "Getting chat messages",
                index: 0,
                chatSessionId: event.arguments.chatSessionId
            }
        })

        // Lightweight scanning without heavy context loading
        await amplifyClient.graphql({
            query: publishResponseStreamChunk,
            variables: {
                chunkText: "Ready to analyze data...",
                index: 0,
                chatSessionId: event.arguments.chatSessionId
            }
        })

        // This function includes validation to prevent "The text field in the ContentBlock object is blank" errors
        // by ensuring no message content is empty when sent to Bedrock
        const chatSessionMessages = await getLangChainChatMessagesStartingWithHumanMessage(event.arguments.chatSessionId)

        if (chatSessionMessages.length === 0) {
            console.warn('No messages found in chat session')
            return
        }

        const agentModel = new ChatBedrockConverse({
            model: process.env.AGENT_MODEL_ID,
            // temperature: 0
        });

        if (mcpTools.length === 0 && USE_MCP) {
            await amplifyClient.graphql({
                query: publishResponseStreamChunk,
                variables: {
                    chunkText: "Listing MCP tools",
                    index: 0,
                    chatSessionId: event.arguments.chatSessionId
                }
            })

            // Start the MCP bridge server with default options
            startMcpBridgeServer({
                port: LOCAL_PROXY_PORT,
                service: 'lambda'
            })

            const mcpClient = new MultiServerMCPClient({
                useStandardContentBlocks: true,
                prefixToolNameWithServerName: false,
                // additionalToolNamePrefix: "",

                mcpServers: {
                    a4e: {
                        url: `http://localhost:${LOCAL_PROXY_PORT}/proxy`,
                        headers: {
                            'target-url': process.env.MCP_FUNCTION_URL!,
                            'accept': 'application/json',
                            'jsonrpc': '2.0',
                            'chat-session-id': event.arguments.chatSessionId
                        }
                    }
                }
            })

            mcpTools = await mcpClient.getTools()

            await amplifyClient.graphql({
                query: publishResponseStreamChunk,
                variables: {
                    chunkText: "Completed listing MCP tools",
                    index: 0,
                    chatSessionId: event.arguments.chatSessionId
                }
            })
        }

        console.log('Mcp Tools: ', mcpTools)

        const agentTools = USE_MCP ? mcpTools : [
            new Calculator(),
            ...s3FileManagementTools,
            userInputTool,
            createProjectTool,
            permeabilityCalculator,
            plotDataTool,
            renderAssetTool,
            ...mcpTools,
            pysparkTool({
                additionalToolDescription: `
# Example LAS file loading and processing
import lasio
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Load LAS file example:
las = lasio.read("path/to/file.las")
well_df = las.df()  # Convert to pandas DataFrame

# Display well information
for item in las.well:
    print(f"{item.descr} ({item.mnemonic}): {item.value}")

# Display curve information  
for count, curve in enumerate(las.curves):
    print(f"Curve: {curve.mnemonic}, Units: {curve.unit}, Description: {curve.descr}")
print(f"There are a total of: {count+1} curves present within this file")

# Basic plotting example (after loading data):
def create_simple_log_plot(df):
    fig, ax = plt.subplots(figsize=(8, 10))
    if 'GR' in df.columns:
        ax.plot(df['GR'], df.index, label='Gamma Ray')
    ax.set_ylabel('Depth')
    ax.set_xlabel('Log Values')
    ax.legend()
    return fig
            `,
                additionalSetupScript: `
sc.addPyFile("s3://${bucketName}/global/pypi/pypi_libs.zip")

import plotly.io as pio
import plotly.graph_objects as go

import matplotlib.pyplot as plt

# Create a custom layout
custom_layout = go.Layout(
    paper_bgcolor='white',
    plot_bgcolor='white',
    xaxis=dict(
        showgrid=True,
        gridcolor='lightgray'),
    yaxis=dict(
        showgrid=True,
        gridcolor='lightgray'
    )
)

# Create and register the template
custom_template = go.layout.Template(layout=custom_layout)
pio.templates["white_clean_log"] = custom_template
pio.templates.default = "white_clean_log"

# Setup matplotlib and plotly defaults for clean visualizations
print("Setting up plotting libraries...")
                `,
            }),
            renderAssetTool
        ]

        const agent = createReactAgent({
            llm: agentModel,
            tools: agentTools,
        });

        // Check if the user wants to use the petrophysics system message
        // We'll check if the first human message contains keywords related to petrophysics
        let usesPetrophysics = false;
        
        // Look for petrophysics-related keywords in the first human message
        if (chatSessionMessages.length > 0 && chatSessionMessages[0] instanceof HumanMessage) {
            const firstMessageContent = getLangChainMessageTextContent(chatSessionMessages[0]);
            if (firstMessageContent) {
                const firstMessage = firstMessageContent.toLowerCase();
                const petrophysicsKeywords = ['petrophysics', 'well log', 'well', 'wells', 'formation', 'porosity', 'permeability', 'las file', 'reservoir'];
                usesPetrophysics = petrophysicsKeywords.some(keyword => firstMessage.includes(keyword.toLowerCase()));
            }
        }
        
        // Log which system message is being used
        console.log(`Using ${usesPetrophysics ? 'petrophysics' : 'default'} system message`);
        
        // Choose the appropriate base system message
        let baseSystemMessage = usesPetrophysics ? petrophysicsSystemMessage : `
# Petrophysics Agent Instructions

## CRITICAL: Data Discovery Protocol
**MANDATORY FIRST STEP**: When users ask about wells, well data, or "how many wells", you MUST immediately use the listFiles("global/well-data") tool to check for available LAS files before responding. Do NOT assume no data exists without checking first.

**Available Well Data Location**: global/well-data/ directory contains LAS well log files
- ALWAYS check this location first for any well-related queries
- Use listFiles("global/well-data") to see all available well files  
- Use readFile("global/well-data/filename.las") to access specific wells

## Overview
You are a petrophysics agent designed to execute formation evaluation and petrophysical workflows using well-log data, core data, and other subsurface information. Your capabilities include data loading, visualization, analysis, and comprehensive reporting.

## Data Loading and Management Guidelines

1. **LAS File Handling**:
   - Use the lasio Python package to load and parse LAS files
   - Search recursively through all available data folders to locate LAS files
   
2. **Core Data Integration**:
   - Load core data from CSV, Excel, or other tabular formats
   - Align core data with well log depths for integrated analysis
   - Handle depth shifts and corrections between core and log data

3. **Well Report Processing**:
   - Extract key information from well reports (PDF, text)
   - Organize formation tops, lithology descriptions, and test results

## Visualization Guidelines

1. **Composite Well Log Display**:
   - Create multi-track log displays using matplotlib
   - Include customizable tracks for different log types
   - ALWAYS use matplotlib

2. **Petrophysical Cross-plots**:
   - Generate standard cross-plots (e.g., neutron-density, M-N, etc.)
   - Include color-coding by depth or additional parameters
   - Add overlay templates (e.g., mineral lines, fluid lines)
   - ALWAYS use matplotlib

3. **Cross-plot Matrix**:
   - Create a matrix of cross-plots for multiple log combinations
   - Enable quick comparison of relationships between different logs
   - ALWAYS use matplotlib


## Petrophysical Analysis Guidelines

1. **Basic Log Analysis**:
   - Calculate shale volume using gamma ray normalization
   - Determine porosity from density logs
   - Estimate water saturation using Archie's equation or other models
   - Create well log display of calculated logs.

2. **Advanced Petrophysical Workflows**:
   - Implement multi-mineral analysis - optional, only if a tool is available and is explicitly requested by user.
   - Perform clay typing and mineral identification - optional, only if a tool is available and is explicitly requested by user.
   - Execute permeability estimation from logs and core data - optional, only if a tool is available and is explicitly requested by user.

3. **Formation Evaluation Workflow**:
   - Identify pay zones based on cutoff criteria
   - Cutoff criteria: Vsh<0.4 and Porosity> 0.1 and sw < 0
   - Calculate net-to-gross ratios
   - Estimate hydrocarbon volumes  

4. **Quality check guidelines**:
   - Perform quality control on the log data
   - Identify and flag outliers or anomalies
   - Ensure data quality for accurate analysis
   - Treat -999.25 values as NaN values. Do not perform any calculation with NaN values.
   - Report if a key well-log for petrophysical analysis and formation evaluation has more than 70% NaN values.
   - Generate intermediate well-log displays whenever possible and relevant

## Reporting

1. **Comprehensive Report Generation**:
   - Create detailed PDF reports of all analyses performed
   - Include methodology descriptions, assumptions, and limitations
   - Summarize key findings and recommendations

2. **Report Structure**:
   - Executive summary
   - Data inventory and quality assessment
   - Methodology and workflow description
   - Analysis results with visualizations
   - Interpretation and conclusions
   - Recommendations for further analysis
   - Appendices with detailed plots and data tables

## Example Workflow Execution

1. Load all available LAS files from the data directory
2. Perform quality control on the log data
3. Generate composite log displays for key wells
4. Create standard petrophysical cross-plots
5. Calculate basic petrophysical properties
6. Generate a cross-plot matrix for key parameters
7. Perform formation evaluation and identify zones of interest
8. Generate a comprehensive report documenting the entire workflow

## When creating reports and visualizations:
- Use iframes to display plots or graphics
- Use the writeFile tool to create the first draft of the report file
- Use html formatting for the report
- Put reports in the 'reports' directory
- **CRITICAL**: ALWAYS call renderAssetTool immediately after creating ANY file (plots, reports, visualizations) to display it in the chat
- Do NOT mention created files in your final response text - let the renderAssetTool display them automatically
- IMPORTANT: When referencing files in HTML (links or iframes):
  * Always use paths relative to the workspace root (no ../ needed)
  * For plots: use "plots/filename.html"
  * For reports: use "reports/filename.html"
  * For data files: use "data/filename.csv"

## MANDATORY Asset Display Protocol - NO EXCEPTIONS:
**YOU MUST FOLLOW THIS EXACT SEQUENCE EVERY TIME:**

1. Create visualization/report file using writeFile or pysparkTool
2. **IMMEDIATELY** call renderAssetTool with the file path - THIS IS REQUIRED, NOT OPTIONAL
3. **NEVER** mention file creation in your final response text
4. **NEVER** tell users to "open" files - the renderAssetTool displays them automatically
5. Focus your response ONLY on analysis insights and findings

**CRITICAL FILE PATH RULES:**
- Use EXACT same file path in renderAssetTool as used in writeFile/pysparkTool
- File paths should be relative: "plots/filename.html" or "reports/filename.html"
- Do NOT add prefixes or modify the path between creation and rendering

**EXAMPLES OF WHAT TO DO:**
✅ Create plot → Wait 2-3 seconds → Call renderAssetTool → Provide analysis insights
✅ Create report → Wait 2-3 seconds → Call renderAssetTool → Summarize key findings

**EXAMPLES OF WHAT NOT TO DO:**
❌ Create files and mention them in text response
❌ Tell users "I've created files for you" 
❌ Tell users "To view the reports, open..."
❌ Skip calling renderAssetTool after creating files
❌ Change file path between writeFile and renderAssetTool

**REMEMBER: The renderAssetTool displays files inline in the chat - users see them immediately without any action needed.**

## When using the file management tools:
- The listFiles tool returns separate 'directories' and 'files' fields to clearly distinguish between them
- To access a directory, include the trailing slash in the path or use the directory name
- To read a file, use the readFile tool with the complete path including the filename
- Global files are shared across sessions and are read-only
- When saving reports to file, use the writeFile tool with html formatting
        `;

        // Use the base system message without diluting additions
        let systemMessageContent = baseSystemMessage;

        const input = {
            messages: [
                new SystemMessage({
                    content: systemMessageContent
                }),
                ...chatSessionMessages,
            ].filter((message): message is BaseMessage => message !== undefined)
        }

        console.log('input:\n', stringifyLimitStringLength(input))

        const agentEventStream = agent.streamEvents(
            input,
            {
                version: "v2",
                recursionLimit: 100
            }
        );

        let chunkIndex = 0
        for await (const streamEvent of agentEventStream) {
            switch (streamEvent.event) {
                case "on_chat_model_stream":
                    const tokenStreamChunk = streamEvent.data.chunk as AIMessageChunk
                    if (!tokenStreamChunk.content) continue
                    const chunkText = getLangChainMessageTextContent(tokenStreamChunk)
                    process.stdout.write(chunkText || "")
                    const publishChunkResponse = await amplifyClient.graphql({
                        query: publishResponseStreamChunk,
                        variables: {
                            chunkText: chunkText || "",
                            index: chunkIndex++,
                            chatSessionId: event.arguments.chatSessionId
                        }
                    })
                    // console.log('published chunk response:\n', JSON.stringify(publishChunkResponse, null, 2))
                    if (publishChunkResponse.errors) console.log('Error publishing response chunk:\n', publishChunkResponse.errors)
                    break;
                case "on_chain_end":
                    if (streamEvent.data.output?.messages) {
                        // console.log('received on chain end:\n', stringifyLimitStringLength(streamEvent.data.output.messages))
                        switch (streamEvent.name) {
                            case "tools":
                            case "agent":
                                chunkIndex = 0 //reset the stream chunk index
                                const streamChunk = streamEvent.data.output.messages[0] as ToolMessage | AIMessageChunk
                                console.log('received tool or agent message:\n', stringifyLimitStringLength(streamChunk))
                                console.log(streamEvent.name, streamChunk.content, typeof streamChunk.content === 'string')
                                if (streamEvent.name === 'tools' && typeof streamChunk.content === 'string' && streamChunk.content.toLowerCase().includes("error")) {
                                    console.log('Generating error message for tool call')
                                    const toolCallMessage = streamEvent.data.input.messages[streamEvent.data.input.messages.length - 1] as AIMessageChunk
                                    const toolCallArgs = toolCallMessage.tool_calls?.[0].args
                                    const toolName = streamChunk.lc_kwargs.name
                                    const selectedToolSchema = agentTools.find(tool => tool.name === toolName)?.schema


                                    // Check if the schema is a Zod schema with safeParse method
                                    const isZodSchema = (schema: any): schema is { safeParse: Function } => {
                                        return schema && typeof schema.safeParse === 'function';
                                    }

                                    //TODO: If the schema is a json schema, convert it to ZOD and do the same error checking: import { jsonSchemaToZod } from "json-schema-to-zod";
                                    let zodError;
                                    if (selectedToolSchema && isZodSchema(selectedToolSchema)) {
                                        zodError = selectedToolSchema.safeParse(toolCallArgs);
                                        console.log({ toolCallMessage, toolCallArgs, toolName, selectedToolSchema, zodError, formattedZodError: zodError?.error?.format() });

                                        if (zodError?.error) {
                                            streamChunk.content += '\n\n' + stringify(zodError.error.format());
                                        }
                                    } else {
                                        selectedToolSchema
                                        console.log({ toolCallMessage, toolCallArgs, toolName, selectedToolSchema, message: "Schema is not a Zod schema with safeParse method" });
                                    }

                                    // const zodError = selectedToolSchema?.safeParse(toolCallArgs)
                                    console.log({ toolCallMessage, toolCallArgs, toolName, selectedToolSchema, zodError, formattedZodError: zodError?.error?.format() })

                                    streamChunk.content += '\n\n' + stringify(zodError?.error?.format())
                                }

                                // Check if this is a table result from textToTableTool and format it properly
                                if (streamChunk instanceof ToolMessage && streamChunk.name === 'textToTableTool') {
                                    try {
                                        const toolResult = JSON.parse(streamChunk.content as string);
                                        if (toolResult.messageContentType === 'tool_table') {
                                            // Attach table data to the message using additional_kwargs which is supported by LangChain
                                            (streamChunk as any).additional_kwargs = {
                                                tableData: toolResult.data,
                                                tableColumns: toolResult.columns,
                                                matchedFileCount: toolResult.matchedFileCount,
                                                messageContentType: 'tool_table'
                                            };
                                        }
                                    } catch (error) {
                                        console.error("Error processing textToTableTool result:", error);
                                    }
                                }

                                // Check if this is a PySpark result and format it for better display
                                if (streamChunk instanceof ToolMessage && streamChunk.name === 'pysparkTool') {
                                    try {
                                        const pysparkResult = JSON.parse(streamChunk.content as string);
                                        if (pysparkResult.status === "COMPLETED" && pysparkResult.output?.content) {
                                            // Attach PySpark output data for special rendering
                                            (streamChunk as any).additional_kwargs = {
                                                pysparkOutput: pysparkResult.output.content,
                                                pysparkError: pysparkResult.output.stderr,
                                                messageContentType: 'pyspark_result'
                                            };
                                        }
                                    } catch (error) {
                                        console.error("Error processing pysparkTool result:", error);
                                    }
                                }

                                await publishMessage({
                                    chatSessionId: event.arguments.chatSessionId,
                                    fieldName: graphQLFieldName,
                                    owner: userId,
                                    message: streamChunk
                                })
                                break;
                            default:
                                break;
                        }
                    }
                    break;
            }
        }
    } catch (error) {
        const amplifyClient = getConfiguredAmplifyClient();

        console.warn("Error responding to user:", JSON.stringify(error, null, 2));

        // Send the complete error message to the client
        const errorMessage = error instanceof Error ? error.stack || error.message : String(error);

        const publishChunkResponse = await amplifyClient.graphql({
            query: publishResponseStreamChunk,
            variables: {
                chunkText: errorMessage,
                index: 0,
                chatSessionId: event.arguments.chatSessionId
            }
        })

        throw error;
    } finally {
        // Clean up any remaining event listeners
        if (process.eventNames().length > 0) {
            process.removeAllListeners();
        }
    }
}

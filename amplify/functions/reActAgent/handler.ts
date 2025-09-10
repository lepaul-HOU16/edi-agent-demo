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
import { getGlobalDirectoryContext, scanWithUploadDetection, refreshContextForUploads } from "../tools/globalDirectoryScanner";
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
        const bucketName = process.env.STORAGE_BUCKET_NAME;
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

        // Load global directory context with upload detection
        await amplifyClient.graphql({
            query: publishResponseStreamChunk,
            variables: {
                chunkText: "Loading global data context and checking for recent uploads...",
                index: 0,
                chatSessionId: event.arguments.chatSessionId
            }
        })

        // Force refresh of global directory context to ensure fresh data
        await refreshContextForUploads(event.arguments.chatSessionId);
        
        // Use enhanced scan with upload detection
        const globalIndex = await scanWithUploadDetection(event.arguments.chatSessionId, true);
        const globalDirectoryContext = await getGlobalDirectoryContext(event.arguments.chatSessionId);

        if (globalDirectoryContext) {
            await amplifyClient.graphql({
                query: publishResponseStreamChunk,
                variables: {
                    chunkText: `Global data context loaded successfully - found ${globalIndex?.totalFiles || 0} files`,
                    index: 0,
                    chatSessionId: event.arguments.chatSessionId
                }
            })
        } else {
            console.warn('No global directory context loaded - this may be expected if no global data exists')
            await amplifyClient.graphql({
                query: publishResponseStreamChunk,
                variables: {
                    chunkText: "No global data context found - will proceed with available tools for data upload",
                    index: 0,
                    chatSessionId: event.arguments.chatSessionId
                }
            })
        }

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

## When creating reports:
- Use iframes to display plots or graphics
- Use the writeFile tool to create the first draft of the report file
- Use html formatting for the report
- Put reports in the 'reports' directory
- IMPORTANT: When referencing files in HTML (links or iframes):
  * Always use paths relative to the workspace root (no ../ needed)
  * For plots: use "plots/filename.html"
  * For reports: use "reports/filename.html"
  * For data files: use "data/filename.csv"
  * Example iframe: <iframe src="plots/well_production_plot.html" width="100%" height="500px" frameborder="0"></iframe>
  * Example link: <a href="data/production_data.csv">Download Data</a>

## When using the file management tools:
- The listFiles tool returns separate 'directories' and 'files' fields to clearly distinguish between them
- To access a directory, include the trailing slash in the path or use the directory name
- To read a file, use the readFile tool with the complete path including the filename
- Global files are shared across sessions and are read-only
- When saving reports to file, use the writeFile tool with html formatting
        `//.replace(/^\s+/gm, '') //This trims the whitespace from the beginning of each line

        // Combine base system message with global context and well data awareness
        let systemMessageContent = baseSystemMessage;
        if (globalDirectoryContext) {
            // Check if we have well data and get count from globalIndex
            const wellLogCount = globalIndex?.filesByType?.['Well Log']?.length || 0;
            const hasWellData = wellLogCount > 0 || globalDirectoryContext.includes('.las') || globalDirectoryContext.includes('well');
            
            // Enhanced context with well data awareness and specific path guidance
            const wellDataContext = hasWellData ? 
                "\n\n## 🎯 CRITICAL: AVAILABLE WELL DATA DETECTED!\n\n" +
                `### ✅ CONFIRMED: ${wellLogCount} LAS FILES (WELLS) ARE AVAILABLE IN YOUR SYSTEM\n\n` +
                "### 📋 WELL COUNTING INSTRUCTIONS - READ THIS FIRST:\n" +
                `When user asks \"how many wells do I have\" or similar questions:\n` +
                `1. **IMMEDIATE ANSWER**: You have ${wellLogCount} wells available\n` +
                `2. **To verify/list wells**: Use searchFiles({\"filePattern\": \".*\\.las$\", \"includeGlobal\": true})\n` +
                `3. **To explore well data**: Use listFiles(\"global/well-data\") to see available wells\n` +
                `4. **Well locations**: Primary location is global/well-data/ directory\n\n` +
                "### IMPORTANT: ALL FILES ARE IN S3 STORAGE - DO NOT USE FILESYSTEM OPERATIONS!\n\n" +
                "### Available Global Well Data:\n" +
                `- **${wellLogCount} LAS files detected** in global/well-data/ directory\n` +
                "- **Supporting Files**: Well_tops.csv, converted_coordinates.csv in the same directory\n" +
                "- **Access Method**: ONLY use S3 tools - `listFiles(\"global/well-data\")` to explore available files\n" +
                "- **File Reading**: ONLY use S3 tools - `readFile(\"global/well-data/WELL-001.las\")` format for specific files\n\n" +
                "### MANDATORY Data Discovery Workflow:\n" +
                "1. **ALWAYS start with**: `listFiles(\"global/well-data\")` (use the S3 listFiles tool)\n" +
                "2. **Read individual files**: `readFile(\"global/well-data/FILENAME.las\")` (use the S3 readFile tool)\n" +
                "3. **Process systematically**: Work through wells sequentially for analysis\n\n" +
                "### CRITICAL FILE ACCESS RULES - READ CAREFULLY:\n" +
                "- ❌ **ABSOLUTELY FORBIDDEN**: `open()`, `os.path.exists()`, `os.listdir()`, `glob.glob()`, `pathlib.Path().exists()`, or ANY filesystem operations\n" +
                "- ❌ **NEVER** treat paths like `/global/well-data/` or `global/well-data/` as local directories - THEY DO NOT EXIST LOCALLY!\n" +
                "- ❌ **NEVER** use Python code like: `os.listdir('/global/well-data/')`, `os.path.exists('global/well-data/')`, or `for file in glob.glob('global/well-data/*.las')`\n" +
                "- ❌ **ERROR WILL OCCUR**: FileNotFoundError: [Errno 2] No such file or directory: '/global/well-data/' - THIS IS WRONG APPROACH!\n" +
                "- ✅ **ONLY CORRECT METHOD**: Use S3 tools: `listFiles()`, `readFile()`, `writeFile()` - these are the ONLY way to access data\n" +
                "- ✅ **MANDATORY**: ALL file access must go through S3 tools, then save to local temp files for processing\n\n" +
                "### WRONG vs CORRECT Examples:\n" +
                "❌ WRONG: `files = os.listdir('/global/well-data/')`  # THIS WILL FAIL!\n" +
                "✅ CORRECT: `files_json = listFiles('global/well-data'); files = json.loads(files_json)['files']`\n" +
                "❌ WRONG: `with open('global/well-data/WELL-001.las') as f:`  # THIS WILL FAIL!\n" +
                "✅ CORRECT: `content_json = readFile('global/well-data/WELL-001.las'); content = json.loads(content_json)['content']`\n\n" +
                "### S3 to Local File Processing Pattern:\n" +
                "```python\n" +
                "import json\n" +
                "import lasio\n\n" +
                "# Step 1: List available files\n" +
                "files_result = listFiles(\"global/well-data\")\n" +
                "files_data = json.loads(files_result)\n" +
                "files = files_data['files']\n\n" +
                "# Step 2: Process each LAS file\n" +
                "for filename in files:\n" +
                "    if filename.endswith('.las'):\n" +
                "        # Read S3 file content\n" +
                "        content_result = readFile(f\"global/well-data/{filename}\")\n" +
                "        content_data = json.loads(content_result)\n" +
                "        las_content = content_data['content']\n" +
                "        \n" +
                "        # Save to local temp file\n" +
                "        local_filename = f'/tmp/{filename}'\n" +
                "        with open(local_filename, 'w') as f:\n" +
                "            f.write(las_content)\n" +
                "        \n" +
                "        # Process with lasio\n" +
                "        las = lasio.read(local_filename)\n" +
                "        # Now you can work with las.df(), las.curves, etc.\n" +
                "```\n\n" +
                "### ABSOLUTELY CRITICAL - STOP FILESYSTEM ERRORS:\n" +
                "⚠️  **IF YOU GET FileNotFoundError: [Errno 2] No such file or directory: '/global/well-data/' - YOU ARE DOING IT WRONG!**\n" +
                "⚠️  **THERE IS NO LOCAL DIRECTORY CALLED 'global/well-data' OR '/global/well-data/'**\n" +
                "⚠️  **YOU MUST USE S3 TOOLS ONLY - NO EXCEPTIONS!**\n\n" +
                "### BANNED OPERATIONS (WILL ALWAYS FAIL):\n" +
                "```python\n" +
                "# These will ALWAYS fail with FileNotFoundError:\n" +
                "os.listdir('/global/well-data/')  # NO!\n" +
                "os.listdir('global/well-data/')   # NO!\n" +
                "glob.glob('global/well-data/*.las')  # NO!\n" +
                "os.path.exists('global/well-data')  # NO!\n" +
                "pathlib.Path('global/well-data').exists()  # NO!\n" +
                "for root, dirs, files in os.walk('global/well-data'):  # NO!\n" +
                "```\n\n" +
                "### MANDATORY S3 TOOL USAGE:\n" +
                "```python\n" +
                "# Step 1: ALWAYS start with listFiles S3 tool\n" +
                "files_result = listFiles('global/well-data')  # This is a TOOL CALL, not Python filesystem\n" +
                "files_data = json.loads(files_result)\n" +
                "print('Available files:', files_data['files'])\n\n" +
                "# Step 2: Read each file using readFile S3 tool\n" +
                "for filename in files_data['files']:\n" +
                "    if filename.endswith('.las'):\n" +
                "        content_result = readFile(f'global/well-data/{filename}')  # This is a TOOL CALL\n" +
                "        content_data = json.loads(content_result)\n" +
                "        las_content = content_data['content']\n" +
                "        \n" +
                "        # Save to /tmp/ for lasio processing\n" +
                "        with open(f'/tmp/{filename}', 'w') as f:\n" +
                "            f.write(las_content)\n" +
                "        \n" +
                "        # Now you can use lasio\n" +
                "        las = lasio.read(f'/tmp/{filename}')\n" +
                "```\n\n" +
                "### Important Notes:\n" +
                "- The data IS available and accessible - if you get FileNotFoundError, you're using filesystem operations instead of S3 tools\n" +
                "- Global data is shared across all sessions and contains real well log data\n" +
                "- When users mention workflows, they expect you to automatically access this global data using S3 tools\n" +
                "- Use the PySpark tool with proper S3 paths for data processing\n" +
                "- listFiles() and readFile() are TOOL CALLS that work with S3, not Python filesystem functions\n\n" :
                "\n\n## GLOBAL DATA CONTEXT\nNo well data currently detected in global directory. Guide users to upload data if needed.\n\n";
            systemMessageContent = baseSystemMessage + "\n\n" + globalDirectoryContext + wellDataContext;
        }

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

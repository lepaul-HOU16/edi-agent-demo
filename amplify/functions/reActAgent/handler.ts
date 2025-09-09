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
import { userInputTool } from "../tools/userInputTool";
import { pysparkTool } from "../tools/athenaPySparkTool";
import { renderAssetTool } from "../tools/renderAssetTool";
import { createProjectTool } from "../tools/createProjectTool";
import { permeabilityCalculator } from "../tools/customWorkshopTool";
import { plotDataTool } from "../tools/plotDataTool";
import { wellLogDisplayTool } from "../tools/wellLogDisplayTool";
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
            wellLogDisplayTool,
            renderAssetTool,
            ...mcpTools
            pysparkTool({
                additionalToolDescription: `
las = lasio.read("local_file.las")
for item in las.well:
    print(f"{item.descr} ({item.mnemonic}): {item.value}")
for count, curve in enumerate(las.curves):
    print(f"Curve: {curve.mnemonic}, Units: {curve.unit}, Description: {curve.descr}")
print(f"There are a total of: {count+1} curves present within this file")
well = las.df()

#Create Composite Well Log Display
import matplotlib.pyplot as plt
import numpy as np
     
def create_composite_log(las, logs_to_plot, depth_range=None):
     # Set up the figure
     fig, axes = plt.subplots(1, len(logs_to_plot), figsize=(2*len(logs_to_plot), 10), sharey=True)
         
     # Get depth
     depth = las.index
     if depth_range:
         min_depth, max_depth = depth_range
         depth_mask = (depth >= min_depth) & (depth <= max_depth)
         depth = depth[depth_mask]

    #Set up the plot axes
    ax1 = plt.subplot2grid((1,6), (0,0), rowspan=1, colspan = 1)
    ax2 = plt.subplot2grid((1,6), (0,1), rowspan=1, colspan = 1, sharey = ax1)
    ax3 = plt.subplot2grid((1,6), (0,2), rowspan=1, colspan = 1, sharey = ax1)
    ax4 = plt.subplot2grid((1,6), (0,3), rowspan=1, colspan = 1, sharey = ax1)
    ax5 = ax3.twiny() #Twins the y-axis for the density track with the neutron track
    ax6 = plt.subplot2grid((1,6), (0,4), rowspan=1, colspan = 1, sharey = ax1)
    ax7 = ax2.twiny()

    # As our curve scales will be detached from the top of the track,
    # this code adds the top border back in without dealing with splines
    ax10 = ax1.twiny()
    ax10.xaxis.set_visible(False)
    ax11 = ax2.twiny()
    ax11.xaxis.set_visible(False)
    ax12 = ax3.twiny()
    ax12.xaxis.set_visible(False)
    ax13 = ax4.twiny()
    ax13.xaxis.set_visible(False)
    ax14 = ax6.twiny()
    ax14.xaxis.set_visible(False)

    # Gamma Ray track
    ax1.plot(well["GR"], well.index, color = "green", linewidth = 0.5)
    ax1.set_xlabel("Gamma")
    ax1.xaxis.label.set_color("green")
    ax1.set_xlim(0, 200)
    ax1.set_ylabel("Depth (m)")
    ax1.tick_params(axis='x', colors="green")
    ax1.spines["top"].set_edgecolor("green")
    ax1.title.set_color('green')
    ax1.set_xticks([0, 50, 100, 150, 200])

    # Resistivity track
    ax2.plot(well["RDEP"], well.index, color = "red", linewidth = 0.5)
    ax2.set_xlabel("Resistivity - Deep")
    ax2.set_xlim(0.2, 2000)
    ax2.xaxis.label.set_color("red")
    ax2.tick_params(axis='x', colors="red")
    ax2.spines["top"].set_edgecolor("red")
    ax2.set_xticks([0.1, 1, 10, 100, 1000])
    ax2.semilogx()

    # Density track
    ax3.plot(well["RHOB"], well.index, color = "red", linewidth = 0.5)
    ax3.set_xlabel("Density")
    ax3.set_xlim(1.95, 2.95)
    ax3.xaxis.label.set_color("red")
    ax3.tick_params(axis='x', colors="red")
    ax3.spines["top"].set_edgecolor("red")
    ax3.set_xticks([1.95, 2.45, 2.95])

    # Sonic track
    ax4.plot(well["DTC"], well.index, color = "purple", linewidth = 0.5)
    ax4.set_xlabel("Sonic")
    ax4.set_xlim(140, 40)
    ax4.xaxis.label.set_color("purple")
    ax4.tick_params(axis='x', colors="purple")
    ax4.spines["top"].set_edgecolor("purple")

    # Neutron track placed ontop of density track
    ax5.plot(well["NPHI"], well.index, color = "blue", linewidth = 0.5)
    ax5.set_xlabel('Neutron')
    ax5.xaxis.label.set_color("blue")
    ax5.set_xlim(0.45, -0.15)
    ax5.set_ylim(4150, 3500)
    ax5.tick_params(axis='x', colors="blue")
    ax5.spines["top"].set_position(("axes", 1.08))
    ax5.spines["top"].set_visible(True)
    ax5.spines["top"].set_edgecolor("blue")
    ax5.set_xticks([0.45,  0.15, -0.15])

    # Caliper track
    ax6.plot(well["CALI"], well.index, color = "black", linewidth = 0.5)
    ax6.set_xlabel("Caliper")
    ax6.set_xlim(6, 16)
    ax6.xaxis.label.set_color("black")
    ax6.tick_params(axis='x', colors="black")
    ax6.spines["top"].set_edgecolor("black")
    #ax6.fill_betweenx(well_nan.index, 8.5, well["CALI"], facecolor='yellow')
    ax6.set_xticks([6,  11, 16])

    # Resistivity track - Curve 2
    ax7.plot(well["RMED"], well.index, color = "green", linewidth = 0.5)
    ax7.set_xlabel("Resistivity - Med")
    ax7.set_xlim(0.2, 2000)
    ax7.xaxis.label.set_color("green")
    ax7.spines["top"].set_position(("axes", 1.08))
    ax7.spines["top"].set_visible(True)
    ax7.tick_params(axis='x', colors="green")
    ax7.spines["top"].set_edgecolor("green")
    ax7.set_xticks([0.1, 1, 10, 100, 1000])
    ax7.semilogx()


    # Common functions for setting up the plot can be extracted into
    # a for loop. This saves repeating code.
    for ax in [ax1, ax2, ax3, ax4, ax6]:
    ax.set_ylim(3200, 2700)
    ax.grid(which='major', color='lightgrey', linestyle='-')
    ax.xaxis.set_ticks_position("top")
    ax.xaxis.set_label_position("top")
    ax.spines["top"].set_position(("axes", 1.02))
    
    # loop through the formations dictionary and zone colours
    #for depth, colour in zip(formations.values(), zone_colours):
    # use the depths and colours to shade across the subplots
    #ax.axhspan(depth[0], depth[1], color=colour, alpha=0.1)
    
    
    for ax in [ax2, ax3, ax4, ax6]:
        plt.setp(ax.get_yticklabels(), visible = False)
         
    plt.tight_layout()
    return fig
         
#Create Petrophysical Cross-plots
def create_crossplot(las, x_log, y_log, color_by=None, overlay=None, **kwargs):
     fig, ax = plt.subplots(figsize=(8, 8))
         
     x_data = las[x_log].values
     y_data = las[y_log].values
         
     # Basic scatter plot
     if color_by is None:
         ax.scatter(x_data, y_data, **kwargs)
     else:
         # Color by another log
         color_data = las[color_by].values
         scatter = ax.scatter(x_data, y_data, c=color_data, **kwargs)
         plt.colorbar(scatter, label=color_by)
         
     # Add overlays (e.g., mineral lines)
     if overlay == 'neutron-density':
         # Add sandstone, limestone, dolomite lines
         pass  # Implement specific overlay logic
         
     ax.set_xlabel(x_log)
     ax.set_ylabel(y_log)
     ax.grid(True)
         
     return fig

#Create Cross-plot Matrix
def create_crossplot_matrix(las, logs, color_by=None, **kwargs):
     n = len(logs)
     fig, axes = plt.subplots(n, n, figsize=(n*3, n*3))
         
     for i, y_log in enumerate(logs):
         for j, x_log in enumerate(logs):
             if i != j:  # Skip diagonal
                 x_data = las[x_log].values
                 y_data = las[y_log].values
                     
                 if color_by is None:
                     axes[i, j].scatter(x_data, y_data, **kwargs)
                 else:
                     color_data = las[color_by].values
                     scatter = axes[i, j].scatter(x_data, y_data, c=color_data, **kwargs)
                     
                 axes[i, j].set_xlabel(x_log)
                 axes[i, j].set_ylabel(y_log)
             else:
                 # Display histogram on diagonal
                 axes[i, j].hist(las[x_log].values, bins=30)
                 axes[i, j].set_title(x_log)
         
     plt.tight_layout()
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

# Create a composite well-log plot
fig, ax = plt.subplots()

#Set up the plot axes
ax1 = plt.subplot2grid((1,6), (0,0), rowspan=1, colspan = 1)
ax2 = plt.subplot2grid((1,6), (0,1), rowspan=1, colspan = 1, sharey = ax1)
ax3 = plt.subplot2grid((1,6), (0,2), rowspan=1, colspan = 1, sharey = ax1)
ax4 = plt.subplot2grid((1,6), (0,3), rowspan=1, colspan = 1, sharey = ax1)
ax5 = ax3.twiny() #Twins the y-axis for the density track with the neutron track
ax6 = plt.subplot2grid((1,6), (0,4), rowspan=1, colspan = 1, sharey = ax1)
ax7 = ax2.twiny()

# As our curve scales will be detached from the top of the track,
# this code adds the top border back in without dealing with splines
ax10 = ax1.twiny()
ax10.xaxis.set_visible(False)
ax11 = ax2.twiny()
ax11.xaxis.set_visible(False)
ax12 = ax3.twiny()
ax12.xaxis.set_visible(False)
ax13 = ax4.twiny()
ax13.xaxis.set_visible(False)
ax14 = ax6.twiny()
ax14.xaxis.set_visible(False)

# Gamma Ray track
ax1.plot(well["GR"], well.index, color = "green", linewidth = 0.5)
ax1.set_xlabel("Gamma")
ax1.xaxis.label.set_color("green")
ax1.set_xlim(0, 200)
ax1.set_ylabel("Depth (m)")
ax1.tick_params(axis='x', colors="green")
ax1.spines["top"].set_edgecolor("green")
ax1.title.set_color('green')
ax1.set_xticks([0, 50, 100, 150, 200])

# Resistivity track
ax2.plot(well["RDEP"], well.index, color = "red", linewidth = 0.5)
ax2.set_xlabel("Resistivity - Deep")
ax2.set_xlim(0.2, 2000)
ax2.xaxis.label.set_color("red")
ax2.tick_params(axis='x', colors="red")
ax2.spines["top"].set_edgecolor("red")
ax2.set_xticks([0.1, 1, 10, 100, 1000])
ax2.semilogx()

# Density track
ax3.plot(well["RHOB"], well.index, color = "red", linewidth = 0.5)
ax3.set_xlabel("Density")
ax3.set_xlim(1.95, 2.95)
ax3.xaxis.label.set_color("red")
ax3.tick_params(axis='x', colors="red")
ax3.spines["top"].set_edgecolor("red")
ax3.set_xticks([1.95, 2.45, 2.95])

# Sonic track
ax4.plot(well["DTC"], well.index, color = "purple", linewidth = 0.5)
ax4.set_xlabel("Sonic")
ax4.set_xlim(140, 40)
ax4.xaxis.label.set_color("purple")
ax4.tick_params(axis='x', colors="purple")
ax4.spines["top"].set_edgecolor("purple")

# Neutron track placed ontop of density track
ax5.plot(well["NPHI"], well.index, color = "blue", linewidth = 0.5)
ax5.set_xlabel('Neutron')
ax5.xaxis.label.set_color("blue")
ax5.set_xlim(0.45, -0.15)
ax5.set_ylim(4150, 3500)
ax5.tick_params(axis='x', colors="blue")
ax5.spines["top"].set_position(("axes", 1.08))
ax5.spines["top"].set_visible(True)
ax5.spines["top"].set_edgecolor("blue")
ax5.set_xticks([0.45,  0.15, -0.15])

# Caliper track
ax6.plot(well["CALI"], well.index, color = "black", linewidth = 0.5)
ax6.set_xlabel("Caliper")
ax6.set_xlim(6, 16)
ax6.xaxis.label.set_color("black")
ax6.tick_params(axis='x', colors="black")
ax6.spines["top"].set_edgecolor("black")
#ax6.fill_betweenx(well_nan.index, 8.5, well["CALI"], facecolor='yellow')
ax6.set_xticks([6,  11, 16])

# Resistivity track - Curve 2
ax7.plot(well["RMED"], well.index, color = "green", linewidth = 0.5)
ax7.set_xlabel("Resistivity - Med")
ax7.set_xlim(0.2, 2000)
ax7.xaxis.label.set_color("green")
ax7.spines["top"].set_position(("axes", 1.08))
ax7.spines["top"].set_visible(True)
ax7.tick_params(axis='x', colors="green")
ax7.spines["top"].set_edgecolor("green")
ax7.set_xticks([0.1, 1, 10, 100, 1000])
ax7.semilogx()


# Common functions for setting up the plot can be extracted into
# a for loop. This saves repeating code.
for ax in [ax1, ax2, ax3, ax4, ax6]:
    ax.set_ylim(3200, 2700)
    ax.grid(which='major', color='lightgrey', linestyle='-')
    ax.xaxis.set_ticks_position("top")
    ax.xaxis.set_label_position("top")
    ax.spines["top"].set_position(("axes", 1.02))
    
    # loop through the formations dictionary and zone colours
#    for depth, colour in zip(formations.values(), zone_colours):
        # use the depths and colours to shade across the subplots
#        ax.axhspan(depth[0], depth[1], color=colour, alpha=0.1)
    
    
for ax in [ax2, ax3, ax4, ax6]:
    plt.setp(ax.get_yticklabels(), visible = False)
    
plt.tight_layout()
fig.subplots_adjust(wspace = 0.15)
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
                const petrophysicsKeywords = ['petrophysics', 'well log', 'formation', 'porosity', 'permeability', 'las file', 'reservoir'];
                usesPetrophysics = petrophysicsKeywords.some(keyword => firstMessage.includes(keyword.toLowerCase()));
            }
        }
        
        // Log which system message is being used
        console.log(`Using ${usesPetrophysics ? 'petrophysics' : 'default'} system message`);
        
        // Choose the appropriate system message
        let systemMessageContent = usesPetrophysics ? petrophysicsSystemMessage : `
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
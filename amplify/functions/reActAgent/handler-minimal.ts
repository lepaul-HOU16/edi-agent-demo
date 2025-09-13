import { ChatBedrockConverse } from "@langchain/aws";
import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { Calculator } from "@langchain/community/tools/calculator";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { publishResponseStreamChunk } from "../graphql/mutations";
import { getConfiguredAmplifyClient } from '../../../utils/amplifyUtils';
import { getLangChainChatMessagesStartingWithHumanMessage, getLangChainMessageTextContent, publishMessage } from '../../../utils/langChainUtils';
import { Schema } from '../../data/resource';

export const handler: Schema["invokeReActAgent"]["functionHandler"] = async (event, context) => {
    const userId = event.arguments.userId || (event.identity && 'sub' in event.identity ? event.identity.sub : null);
    if (!userId) throw new Error("userId is required");
    if (event.arguments.chatSessionId === null) throw new Error("chatSessionId is required");

    const amplifyClient = getConfiguredAmplifyClient();
    const chatSessionMessages = await getLangChainChatMessagesStartingWithHumanMessage(event.arguments.chatSessionId);
    
    if (chatSessionMessages.length === 0) return;

    const agentModel = new ChatBedrockConverse({
        model: process.env.AGENT_MODEL_ID,
    });

    // Hardcoded well data for context awareness
    const lasFiles = ['WELL-001.las', 'WELL-002.las', 'WELL-003.las', 'WELL-004.las', 'WELL-005.las',
                     'WELL-006.las', 'WELL-007.las', 'WELL-008.las', 'WELL-009.las', 'WELL-010.las',
                     'WELL-011.las', 'WELL-012.las', 'WELL-013.las', 'WELL-014.las', 'WELL-015.las',
                     'WELL-016.las', 'WELL-017.las', 'WELL-018.las', 'WELL-019.las', 'WELL-020.las',
                     'WELL-021.las', 'WELL-022.las', 'WELL-023.las', 'WELL-024.las',
                     'CARBONATE_PLATFORM_002.las', 'MIXED_LITHOLOGY_003.las', 'SANDSTONE_RESERVOIR_001.las'];
    
    const totalWellCount = 2 + lasFiles.length;

    const systemMessage = `You are a petrophysics agent with access to well data.

=== AVAILABLE WELL DATA ===
PRIMARY WELLS (2):
1. Eagle Ford 1H (WELL-001) - Karnes County, TX, Eagle Ford Shale
2. Permian Basin 2H (WELL-002) - Midland County, TX, Wolfcamp Shale

LAS FILES (${lasFiles.length}): ${lasFiles.join(', ')}

TOTAL WELL COUNT: ${totalWellCount} wells

When asked "how many wells", respond with ${totalWellCount} wells total.`;

    const agent = createReactAgent({
        llm: agentModel,
        tools: [new Calculator()],
    });

    const input = {
        messages: [
            new SystemMessage({ content: systemMessage }),
            ...chatSessionMessages,
        ]
    };

    const agentEventStream = agent.streamEvents(input, { version: "v2" });

    let chunkIndex = 0;
    for await (const streamEvent of agentEventStream) {
        if (streamEvent.event === "on_chat_model_stream") {
            const tokenStreamChunk = streamEvent.data.chunk;
            if (!tokenStreamChunk.content) continue;
            const chunkText = getLangChainMessageTextContent(tokenStreamChunk);
            
            await amplifyClient.graphql({
                query: publishResponseStreamChunk,
                variables: {
                    chunkText: chunkText || "",
                    index: chunkIndex++,
                    chatSessionId: event.arguments.chatSessionId
                }
            });
        }
    }
};
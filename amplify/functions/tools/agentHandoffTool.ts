import { z } from "zod";

import { getConfiguredAmplifyClient } from '../../../utils/amplifyUtils';
import { Schema } from '../../data/resource';

const agentHandoffToolSchema = z.object({
    agentName: z.string(),
    agentDescription: z.string(),
    agentInstructions: z.string(),
})

export const agentHandoffTool = {
    name: "agentHandoffTool",
    description: `Use this tool to hand off the conversation to another agent with specific instructions.
The agent will be invoked with the provided name, description, and instructions.
This will end the current agent's execution.`,
    schema: agentHandoffToolSchema,
    func: async (agentHandoffToolArgs: z.infer<typeof agentHandoffToolSchema>) => {
        const amplifyClient = getConfiguredAmplifyClient();
        const { agentName, agentDescription, agentInstructions } = agentHandoffToolArgs;

        const chatSessionId = process.env.CHAT_SESSION_ID;
        if (!chatSessionId) {
            throw new Error("CHAT_SESSION_ID environment variable is not set");
        }

        // Invoke the lightweight agent via GraphQL (updated from deprecated invokeReActAgent)
        const response = await amplifyClient.mutations.invokeLightweightAgent({
            chatSessionId
        });

        if (!response.data?.success) {
            throw new Error("Failed to invoke agent");
        }

        // Return a signal to end execution (replaces langchain Command)
        return {
            status: "handoff_complete",
            agentName,
            agentDescription,
            agentInstructions,
            message: `Successfully handed off to ${agentName}: ${agentDescription}`
        };
    }
};

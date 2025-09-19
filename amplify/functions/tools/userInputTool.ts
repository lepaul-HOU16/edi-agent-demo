import { z } from "zod";

const userInputToolSchema = z.object({
    title: z.string(),
    description: z.string(),
    buttonTextBeforeClick: z.string(),
    buttonTextAfterClick: z.string(),
})

export const userInputTool = {
    name: "userInputTool",
    description: `
Use this tool to send emails or add items to a work management system.
The messages should never request information.
They should only inform someone besides the user about an action they should take (including to review an item from the chat).
`,
    schema: userInputToolSchema,
    func: async (userInputToolArgs: z.infer<typeof userInputToolSchema>) => {
        return {
            ...userInputToolArgs,
        }
    }
};

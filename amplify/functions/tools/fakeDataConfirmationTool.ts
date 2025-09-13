import { tool } from "@langchain/core/tools";
import { z } from "zod";

const fakeDataConfirmationToolSchema = z.object({
    dataType: z.string().describe("Type of fake data being requested (e.g., 'well logs', 'production data', 'formation parameters')"),
    purpose: z.string().describe("Brief description of what the fake data will be used for"),
    dataDescription: z.string().describe("Description of the specific fake data that will be generated"),
})

export const fakeDataConfirmationTool = tool(
    async (fakeDataConfirmationArgs) => {
        return {
            title: "Fake Data Usage Confirmation",
            description: `I need to generate fake ${fakeDataConfirmationArgs.dataType} for ${fakeDataConfirmationArgs.purpose}. 

**Data to be generated:** ${fakeDataConfirmationArgs.dataDescription}

**Important Note:** This will be synthetic data created for demonstration/analysis purposes only. The generated data will not represent real well conditions or measurements.

Please confirm if you would like to proceed with fake data generation, or if you prefer to upload actual data files instead.`,
            buttonTextBeforeClick: "Proceed with Fake Data",
            buttonTextAfterClick: "Confirmed - Generating Fake Data",
            fakeDataType: fakeDataConfirmationArgs.dataType,
            fakeDataPurpose: fakeDataConfirmationArgs.purpose,
            fakeDataDescription: fakeDataConfirmationArgs.dataDescription
        }
    },
    {
        name: "fakeDataConfirmationTool",
        description: "Use this tool when you need to generate fake/synthetic data for analysis or demonstration purposes. This tool will prompt the user to confirm they want to proceed with fake data generation. Always use this tool before creating any synthetic well data, production data, or other petroleum engineering datasets. The tool ensures transparency about data authenticity and gives users the option to provide real data instead.",
        schema: fakeDataConfirmationToolSchema,
    }
);

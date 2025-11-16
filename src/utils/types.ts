import { z } from "zod";
import React from "react";
import { Schema } from "@/types/api";

const zodStringDate = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, should be YYYY-MM-DD")
    .describe("The date in YYYY-MM-DD format")



// Message type includes all fields from ChatMessage including id
export type Message = {
    id?: string;
    chatSessionId: string;
    role?: "human" | "ai" | "tool" | "ai-stream" | "professional-response" | "thinking" | null | undefined;
    content: any;
    artifacts?: any[];
    thoughtSteps?: any[];
    responseComplete?: boolean;
    createdAt?: string;
    updatedAt?: string;
    owner?: string;
  };


export type PublishMessageCommandInput = {
    chatSessionId: string,
    fieldName: string,
    owner: string,
    message: any, // Generic message type for flexibility
    responseComplete?: boolean,
}

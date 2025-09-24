import * as APITypes from "../amplify/functions/graphql/API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};


export const createChatMessage = /* GraphQL */ `mutation CreateChatMessage(
  $condition: ModelChatMessageConditionInput
  $input: CreateChatMessageInput!
) {
  createChatMessage(condition: $condition, input: $input) {
    chatSessionId
    chatSessionIdUnderscoreFieldName
    content {
      text
    }
    responseComplete
    toolCallId
    toolName
    toolCalls

    role
    id
    createdAt
    updatedAt
    owner
  }
}
` as GeneratedMutation<
  APITypes.CreateChatMessageMutationVariables,
  APITypes.CreateChatMessageMutation
>;


export const publishResponseStreamChunk = /* GraphQL */ `mutation PublishResponseStreamChunk(
  $chunkText: String!
  $chatSessionId: String!
  $index: Int!
) {
  publishResponseStreamChunk(
    chunkText: $chunkText
    chatSessionId: $chatSessionId
    index: $index
  ) {
    __typename
  }
}
` as GeneratedMutation<
  APITypes.PublishResponseStreamChunkMutationVariables,
  APITypes.PublishResponseStreamChunkMutation
>;

export type ListChatMessageByChatSessionIdAndCreatedAtOutputType = Omit<APITypes.ListChatMessageByChatSessionIdAndCreatedAtQuery, 'listChatMessageByChatSessionIdAndCreatedAt'> & {
  listChatMessageByChatSessionIdAndCreatedAt?: {
    __typename: "ModelChatMessageConnection",
    items: Array<{
      __typename: "ChatMessage",
      chatSessionId?: string | null,
      content?: {
        text?: string | null,
      } | null,
      createdAt?: string | null,
      id: string,
      owner?: string | null,
      responseComplete?: boolean | null,
      role?: APITypes.ChatMessageRole | null,
      toolCallId?: string | null,
      toolCalls?: string | null,
      toolName?: string | null,
      updatedAt: string,
    } | null>,
    nextToken?: string | null,
  } | null
};

export const listChatMessageByChatSessionIdAndCreatedAt = /* GraphQL */ `query ListChatMessageByChatSessionIdAndCreatedAt(
  $chatSessionId: ID!
  $createdAt: ModelStringKeyConditionInput
  $filter: ModelChatMessageFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listChatMessageByChatSessionIdAndCreatedAt(
    chatSessionId: $chatSessionId
    createdAt: $createdAt
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      chatSessionId
      content {
        text
      }
      createdAt
      id
      owner
      responseComplete
      role
      toolCallId
      toolCalls
      toolName
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<  
  APITypes.ListChatMessageByChatSessionIdAndCreatedAtQueryVariables,
  ListChatMessageByChatSessionIdAndCreatedAtOutputType
>;

export const invokeReActAgent = /* GraphQL */ `query InvokeReActAgent(
  $chatSessionId: ID!
  $foundationModelId: String
  $respondToAgent: Boolean
  $userId: String
  # $origin: String
) {
  invokeReActAgent(
    chatSessionId: $chatSessionId
    foundationModelId: $foundationModelId
    respondToAgent: $respondToAgent
    userId: $userId
    # origin: $origin
  ) {
    __typename
  }
}
` as GeneratedQuery<
  APITypes.InvokeReActAgentQueryVariables,
  APITypes.InvokeReActAgentQuery
>;

export const invokeLightweightAgent = /* GraphQL */ `mutation InvokeLightweightAgent(
  $chatSessionId: ID!
  $message: String!
  $foundationModelId: String
  $userId: String
) {
  invokeLightweightAgent(
    chatSessionId: $chatSessionId
    message: $message
    foundationModelId: $foundationModelId
    userId: $userId
  ) {
    success
    message
    artifacts
  }
}`;

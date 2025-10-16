/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const catalogSearch = /* GraphQL */ `query CatalogSearch($existingContext: AWSJSON, $prompt: String!) {
  catalogSearch(existingContext: $existingContext, prompt: $prompt)
}
` as GeneratedQuery<
  APITypes.CatalogSearchQueryVariables,
  APITypes.CatalogSearchQuery
>;
export const collectionQuery = /* GraphQL */ `query CollectionQuery($collectionId: String, $operation: String!) {
  collectionQuery(collectionId: $collectionId, operation: $operation)
}
` as GeneratedQuery<
  APITypes.CollectionQueryQueryVariables,
  APITypes.CollectionQueryQuery
>;
export const getCatalogMapData = /* GraphQL */ `query GetCatalogMapData($type: String!) {
  getCatalogMapData(type: $type)
}
` as GeneratedQuery<
  APITypes.GetCatalogMapDataQueryVariables,
  APITypes.GetCatalogMapDataQuery
>;
export const getChatMessage = /* GraphQL */ `query GetChatMessage($id: ID!) {
  getChatMessage(id: $id) {
    artifacts
    chatSession {
      collectionContext
      createdAt
      id
      linkedCollectionId
      name
      owner
      updatedAt
      __typename
    }
    chatSessionId
    chatSessionIdUnderscoreFieldName
    content {
      text
      __typename
    }
    createdAt
    id
    owner
    responseComplete
    role
    thoughtSteps
    toolCallId
    toolCalls
    toolName
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetChatMessageQueryVariables,
  APITypes.GetChatMessageQuery
>;
export const getChatSession = /* GraphQL */ `query GetChatSession($id: ID!) {
  getChatSession(id: $id) {
    collectionContext
    createdAt
    id
    linkedCollectionId
    messages {
      nextToken
      __typename
    }
    name
    owner
    updatedAt
    workSteps {
      description
      name
      result
      status
      __typename
    }
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetChatSessionQueryVariables,
  APITypes.GetChatSessionQuery
>;
export const getDummyModelToAddIamDirective = /* GraphQL */ `query GetDummyModelToAddIamDirective($id: ID!) {
  getDummyModelToAddIamDirective(id: $id) {
    createdAt
    id
    owner
    responseStreamChunk {
      chatSessionId
      chunkText
      index
      __typename
    }
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetDummyModelToAddIamDirectiveQueryVariables,
  APITypes.GetDummyModelToAddIamDirectiveQuery
>;
export const getProject = /* GraphQL */ `query GetProject($id: ID!) {
  getProject(id: $id) {
    createdAt
    description
    financial {
      NPV10
      cost
      incrimentalGasRateMCFD
      incrimentalOilRateBOPD
      revenuePresentValue
      successProbability
      __typename
    }
    foundationModelId
    id
    name
    nextAction {
      buttonTextAfterClick
      buttonTextBeforeClick
      __typename
    }
    owner
    procedureS3Path
    reportS3Path
    result
    sourceChatSessionId
    status
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetProjectQueryVariables,
  APITypes.GetProjectQuery
>;
export const getWell = /* GraphQL */ `query GetWell($id: ID!) {
  getWell(id: $id) {
    alerts
    createdAt
    healthScore
    id
    lastMaintenanceDate
    location
    metadata
    name
    nextMaintenanceDate
    operationalStatus
    sensors
    type
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetWellQueryVariables, APITypes.GetWellQuery>;
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
      artifacts
      chatSessionId
      chatSessionIdUnderscoreFieldName
      createdAt
      id
      owner
      responseComplete
      role
      thoughtSteps
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
  APITypes.ListChatMessageByChatSessionIdAndCreatedAtQuery
>;
export const listChatMessageByChatSessionIdUnderscoreFieldNameAndCreatedAt = /* GraphQL */ `query ListChatMessageByChatSessionIdUnderscoreFieldNameAndCreatedAt(
  $chatSessionIdUnderscoreFieldName: String!
  $createdAt: ModelStringKeyConditionInput
  $filter: ModelChatMessageFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listChatMessageByChatSessionIdUnderscoreFieldNameAndCreatedAt(
    chatSessionIdUnderscoreFieldName: $chatSessionIdUnderscoreFieldName
    createdAt: $createdAt
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      artifacts
      chatSessionId
      chatSessionIdUnderscoreFieldName
      createdAt
      id
      owner
      responseComplete
      role
      thoughtSteps
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
  APITypes.ListChatMessageByChatSessionIdUnderscoreFieldNameAndCreatedAtQueryVariables,
  APITypes.ListChatMessageByChatSessionIdUnderscoreFieldNameAndCreatedAtQuery
>;
export const listChatMessages = /* GraphQL */ `query ListChatMessages(
  $filter: ModelChatMessageFilterInput
  $limit: Int
  $nextToken: String
) {
  listChatMessages(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      artifacts
      chatSessionId
      chatSessionIdUnderscoreFieldName
      createdAt
      id
      owner
      responseComplete
      role
      thoughtSteps
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
  APITypes.ListChatMessagesQueryVariables,
  APITypes.ListChatMessagesQuery
>;
export const listChatSessions = /* GraphQL */ `query ListChatSessions(
  $filter: ModelChatSessionFilterInput
  $limit: Int
  $nextToken: String
) {
  listChatSessions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      collectionContext
      createdAt
      id
      linkedCollectionId
      name
      owner
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListChatSessionsQueryVariables,
  APITypes.ListChatSessionsQuery
>;
export const listDummyModelToAddIamDirectives = /* GraphQL */ `query ListDummyModelToAddIamDirectives(
  $filter: ModelDummyModelToAddIamDirectiveFilterInput
  $limit: Int
  $nextToken: String
) {
  listDummyModelToAddIamDirectives(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      owner
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListDummyModelToAddIamDirectivesQueryVariables,
  APITypes.ListDummyModelToAddIamDirectivesQuery
>;
export const listProjects = /* GraphQL */ `query ListProjects(
  $filter: ModelProjectFilterInput
  $limit: Int
  $nextToken: String
) {
  listProjects(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      description
      foundationModelId
      id
      name
      owner
      procedureS3Path
      reportS3Path
      result
      sourceChatSessionId
      status
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListProjectsQueryVariables,
  APITypes.ListProjectsQuery
>;
export const listWells = /* GraphQL */ `query ListWells(
  $filter: ModelWellFilterInput
  $limit: Int
  $nextToken: String
) {
  listWells(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      alerts
      createdAt
      healthScore
      id
      lastMaintenanceDate
      location
      metadata
      name
      nextMaintenanceDate
      operationalStatus
      sensors
      type
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListWellsQueryVariables, APITypes.ListWellsQuery>;

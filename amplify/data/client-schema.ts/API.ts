/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type ChatMessage = {
  __typename: "ChatMessage",
  artifacts?: Array< string | null > | null,
  chatSession?: ChatSession | null,
  chatSessionId?: string | null,
  chatSessionIdUnderscoreFieldName?: string | null,
  content?: ChatMessageContent | null,
  createdAt?: string | null,
  id: string,
  owner?: string | null,
  responseComplete?: boolean | null,
  role?: ChatMessageRole | null,
  thoughtSteps?: Array< string | null > | null,
  toolCallId?: string | null,
  toolCalls?: string | null,
  toolName?: string | null,
  updatedAt: string,
};

export type ChatSession = {
  __typename: "ChatSession",
  collectionContext?: string | null,
  createdAt: string,
  id: string,
  linkedCollectionId?: string | null,
  messages?: ModelChatMessageConnection | null,
  name?: string | null,
  owner?: string | null,
  updatedAt: string,
  workSteps?:  Array<WorkStep | null > | null,
};

export type ModelChatMessageConnection = {
  __typename: "ModelChatMessageConnection",
  items:  Array<ChatMessage | null >,
  nextToken?: string | null,
};

export type WorkStep = {
  __typename: "WorkStep",
  description?: string | null,
  name?: string | null,
  result?: string | null,
  status?: WorkStepStatus | null,
};

export enum WorkStepStatus {
  completed = "completed",
  failed = "failed",
  in_progress = "in_progress",
  pending = "pending",
}


export type ChatMessageContent = {
  __typename: "ChatMessageContent",
  text?: string | null,
};

export enum ChatMessageRole {
  ai = "ai",
  human = "human",
  tool = "tool",
}


export type DummyModelToAddIamDirective = {
  __typename: "DummyModelToAddIamDirective",
  createdAt: string,
  id: string,
  owner?: string | null,
  responseStreamChunk?: ResponseStreamChunk | null,
  updatedAt: string,
};

export type ResponseStreamChunk = {
  __typename: "ResponseStreamChunk",
  chatSessionId: string,
  chunkText: string,
  index: number,
};

export type Project = {
  __typename: "Project",
  createdAt: string,
  description?: string | null,
  financial?: ProjectFinancial | null,
  foundationModelId?: string | null,
  id: string,
  name?: string | null,
  nextAction?: ProjectNextAction | null,
  owner?: string | null,
  procedureS3Path?: string | null,
  reportS3Path: string,
  result?: string | null,
  sourceChatSessionId?: string | null,
  status?: ProjectStatus | null,
  updatedAt: string,
};

export type ProjectFinancial = {
  __typename: "ProjectFinancial",
  NPV10?: number | null,
  cost?: number | null,
  incrimentalGasRateMCFD?: number | null,
  incrimentalOilRateBOPD?: number | null,
  revenuePresentValue?: number | null,
  successProbability?: number | null,
};

export type ProjectNextAction = {
  __typename: "ProjectNextAction",
  buttonTextAfterClick?: string | null,
  buttonTextBeforeClick?: string | null,
};

export enum ProjectStatus {
  approved = "approved",
  completed = "completed",
  drafting = "drafting",
  failed = "failed",
  in_progress = "in_progress",
  proposed = "proposed",
  rejected = "rejected",
  scheduled = "scheduled",
}


export type Well = {
  __typename: "Well",
  alerts: string,
  createdAt: string,
  healthScore: number,
  id: string,
  lastMaintenanceDate: string,
  location: string,
  metadata: string,
  name: string,
  nextMaintenanceDate: string,
  operationalStatus?: WellOperationalStatus | null,
  sensors: string,
  type: string,
  updatedAt: string,
};

export enum WellOperationalStatus {
  critical = "critical",
  degraded = "degraded",
  offline = "offline",
  operational = "operational",
}


export type ModelStringKeyConditionInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
};

export type ModelChatMessageFilterInput = {
  and?: Array< ModelChatMessageFilterInput | null > | null,
  artifacts?: ModelStringInput | null,
  chatSessionId?: ModelIDInput | null,
  chatSessionIdUnderscoreFieldName?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelChatMessageFilterInput | null,
  or?: Array< ModelChatMessageFilterInput | null > | null,
  owner?: ModelStringInput | null,
  responseComplete?: ModelBooleanInput | null,
  role?: ModelChatMessageRoleInput | null,
  thoughtSteps?: ModelStringInput | null,
  toolCallId?: ModelStringInput | null,
  toolCalls?: ModelStringInput | null,
  toolName?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelStringInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  _null = "_null",
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
}


export type ModelSizeInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelIDInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export type ModelBooleanInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelChatMessageRoleInput = {
  eq?: ChatMessageRole | null,
  ne?: ChatMessageRole | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelChatSessionFilterInput = {
  and?: Array< ModelChatSessionFilterInput | null > | null,
  collectionContext?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  linkedCollectionId?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelChatSessionFilterInput | null,
  or?: Array< ModelChatSessionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelChatSessionConnection = {
  __typename: "ModelChatSessionConnection",
  items:  Array<ChatSession | null >,
  nextToken?: string | null,
};

export type ModelDummyModelToAddIamDirectiveFilterInput = {
  and?: Array< ModelDummyModelToAddIamDirectiveFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelDummyModelToAddIamDirectiveFilterInput | null,
  or?: Array< ModelDummyModelToAddIamDirectiveFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelDummyModelToAddIamDirectiveConnection = {
  __typename: "ModelDummyModelToAddIamDirectiveConnection",
  items:  Array<DummyModelToAddIamDirective | null >,
  nextToken?: string | null,
};

export type ModelProjectFilterInput = {
  and?: Array< ModelProjectFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  foundationModelId?: ModelStringInput | null,
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  not?: ModelProjectFilterInput | null,
  or?: Array< ModelProjectFilterInput | null > | null,
  owner?: ModelStringInput | null,
  procedureS3Path?: ModelStringInput | null,
  reportS3Path?: ModelStringInput | null,
  result?: ModelStringInput | null,
  sourceChatSessionId?: ModelIDInput | null,
  status?: ModelProjectStatusInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelProjectStatusInput = {
  eq?: ProjectStatus | null,
  ne?: ProjectStatus | null,
};

export type ModelProjectConnection = {
  __typename: "ModelProjectConnection",
  items:  Array<Project | null >,
  nextToken?: string | null,
};

export type ModelWellFilterInput = {
  alerts?: ModelStringInput | null,
  and?: Array< ModelWellFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  healthScore?: ModelIntInput | null,
  id?: ModelIDInput | null,
  lastMaintenanceDate?: ModelStringInput | null,
  location?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  name?: ModelStringInput | null,
  nextMaintenanceDate?: ModelStringInput | null,
  not?: ModelWellFilterInput | null,
  operationalStatus?: ModelWellOperationalStatusInput | null,
  or?: Array< ModelWellFilterInput | null > | null,
  sensors?: ModelStringInput | null,
  type?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelIntInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelWellOperationalStatusInput = {
  eq?: WellOperationalStatus | null,
  ne?: WellOperationalStatus | null,
};

export type ModelWellConnection = {
  __typename: "ModelWellConnection",
  items:  Array<Well | null >,
  nextToken?: string | null,
};

export type ModelChatMessageConditionInput = {
  and?: Array< ModelChatMessageConditionInput | null > | null,
  artifacts?: ModelStringInput | null,
  chatSessionId?: ModelIDInput | null,
  chatSessionIdUnderscoreFieldName?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  not?: ModelChatMessageConditionInput | null,
  or?: Array< ModelChatMessageConditionInput | null > | null,
  owner?: ModelStringInput | null,
  responseComplete?: ModelBooleanInput | null,
  role?: ModelChatMessageRoleInput | null,
  thoughtSteps?: ModelStringInput | null,
  toolCallId?: ModelStringInput | null,
  toolCalls?: ModelStringInput | null,
  toolName?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateChatMessageInput = {
  artifacts?: Array< string | null > | null,
  chatSessionId?: string | null,
  chatSessionIdUnderscoreFieldName?: string | null,
  content?: ChatMessageContentInput | null,
  createdAt?: string | null,
  id?: string | null,
  owner?: string | null,
  responseComplete?: boolean | null,
  role?: ChatMessageRole | null,
  thoughtSteps?: Array< string | null > | null,
  toolCallId?: string | null,
  toolCalls?: string | null,
  toolName?: string | null,
};

export type ChatMessageContentInput = {
  text?: string | null,
};

export type ModelChatSessionConditionInput = {
  and?: Array< ModelChatSessionConditionInput | null > | null,
  collectionContext?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  linkedCollectionId?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelChatSessionConditionInput | null,
  or?: Array< ModelChatSessionConditionInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateChatSessionInput = {
  collectionContext?: string | null,
  id?: string | null,
  linkedCollectionId?: string | null,
  name?: string | null,
  workSteps?: Array< WorkStepInput | null > | null,
};

export type WorkStepInput = {
  description?: string | null,
  name?: string | null,
  result?: string | null,
  status?: WorkStepStatus | null,
};

export type ModelDummyModelToAddIamDirectiveConditionInput = {
  and?: Array< ModelDummyModelToAddIamDirectiveConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  not?: ModelDummyModelToAddIamDirectiveConditionInput | null,
  or?: Array< ModelDummyModelToAddIamDirectiveConditionInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateDummyModelToAddIamDirectiveInput = {
  id?: string | null,
  responseStreamChunk?: ResponseStreamChunkInput | null,
};

export type ResponseStreamChunkInput = {
  chatSessionId: string,
  chunkText: string,
  index: number,
};

export type ModelProjectConditionInput = {
  and?: Array< ModelProjectConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  description?: ModelStringInput | null,
  foundationModelId?: ModelStringInput | null,
  name?: ModelStringInput | null,
  not?: ModelProjectConditionInput | null,
  or?: Array< ModelProjectConditionInput | null > | null,
  owner?: ModelStringInput | null,
  procedureS3Path?: ModelStringInput | null,
  reportS3Path?: ModelStringInput | null,
  result?: ModelStringInput | null,
  sourceChatSessionId?: ModelIDInput | null,
  status?: ModelProjectStatusInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateProjectInput = {
  description?: string | null,
  financial?: ProjectFinancialInput | null,
  foundationModelId?: string | null,
  id?: string | null,
  name?: string | null,
  nextAction?: ProjectNextActionInput | null,
  procedureS3Path?: string | null,
  reportS3Path: string,
  result?: string | null,
  sourceChatSessionId?: string | null,
  status?: ProjectStatus | null,
};

export type ProjectFinancialInput = {
  NPV10?: number | null,
  cost?: number | null,
  incrimentalGasRateMCFD?: number | null,
  incrimentalOilRateBOPD?: number | null,
  revenuePresentValue?: number | null,
  successProbability?: number | null,
};

export type ProjectNextActionInput = {
  buttonTextAfterClick?: string | null,
  buttonTextBeforeClick?: string | null,
};

export type ModelWellConditionInput = {
  alerts?: ModelStringInput | null,
  and?: Array< ModelWellConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  healthScore?: ModelIntInput | null,
  lastMaintenanceDate?: ModelStringInput | null,
  location?: ModelStringInput | null,
  metadata?: ModelStringInput | null,
  name?: ModelStringInput | null,
  nextMaintenanceDate?: ModelStringInput | null,
  not?: ModelWellConditionInput | null,
  operationalStatus?: ModelWellOperationalStatusInput | null,
  or?: Array< ModelWellConditionInput | null > | null,
  sensors?: ModelStringInput | null,
  type?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateWellInput = {
  alerts: string,
  healthScore: number,
  id?: string | null,
  lastMaintenanceDate: string,
  location: string,
  metadata: string,
  name: string,
  nextMaintenanceDate: string,
  operationalStatus?: WellOperationalStatus | null,
  sensors: string,
  type: string,
};

export type DeleteChatMessageInput = {
  id: string,
};

export type DeleteChatSessionInput = {
  id: string,
};

export type DeleteDummyModelToAddIamDirectiveInput = {
  id: string,
};

export type DeleteProjectInput = {
  id: string,
};

export type DeleteWellInput = {
  id: string,
};

export type InvokeLightweightAgentReturnType = {
  __typename: "InvokeLightweightAgentReturnType",
  artifacts?: Array< string | null > | null,
  message: string,
  success: boolean,
  thoughtSteps?: Array< string | null > | null,
};

export type InvokeMaintenanceAgentReturnType = {
  __typename: "InvokeMaintenanceAgentReturnType",
  artifacts?: Array< string | null > | null,
  auditTrail?: string | null,
  message: string,
  success: boolean,
  thoughtSteps?: Array< string | null > | null,
  workflow?: string | null,
};

export type UpdateChatMessageInput = {
  artifacts?: Array< string | null > | null,
  chatSessionId?: string | null,
  chatSessionIdUnderscoreFieldName?: string | null,
  content?: ChatMessageContentInput | null,
  createdAt?: string | null,
  id: string,
  owner?: string | null,
  responseComplete?: boolean | null,
  role?: ChatMessageRole | null,
  thoughtSteps?: Array< string | null > | null,
  toolCallId?: string | null,
  toolCalls?: string | null,
  toolName?: string | null,
};

export type UpdateChatSessionInput = {
  collectionContext?: string | null,
  id: string,
  linkedCollectionId?: string | null,
  name?: string | null,
  workSteps?: Array< WorkStepInput | null > | null,
};

export type UpdateDummyModelToAddIamDirectiveInput = {
  id: string,
  responseStreamChunk?: ResponseStreamChunkInput | null,
};

export type UpdateProjectInput = {
  description?: string | null,
  financial?: ProjectFinancialInput | null,
  foundationModelId?: string | null,
  id: string,
  name?: string | null,
  nextAction?: ProjectNextActionInput | null,
  procedureS3Path?: string | null,
  reportS3Path?: string | null,
  result?: string | null,
  sourceChatSessionId?: string | null,
  status?: ProjectStatus | null,
};

export type UpdateWellInput = {
  alerts?: string | null,
  healthScore?: number | null,
  id: string,
  lastMaintenanceDate?: string | null,
  location?: string | null,
  metadata?: string | null,
  name?: string | null,
  nextMaintenanceDate?: string | null,
  operationalStatus?: WellOperationalStatus | null,
  sensors?: string | null,
  type?: string | null,
};

export type ModelSubscriptionChatMessageFilterInput = {
  and?: Array< ModelSubscriptionChatMessageFilterInput | null > | null,
  artifacts?: ModelSubscriptionStringInput | null,
  chatSessionId?: ModelSubscriptionIDInput | null,
  chatSessionIdUnderscoreFieldName?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionChatMessageFilterInput | null > | null,
  owner?: ModelStringInput | null,
  responseComplete?: ModelSubscriptionBooleanInput | null,
  role?: ModelSubscriptionStringInput | null,
  thoughtSteps?: ModelSubscriptionStringInput | null,
  toolCallId?: ModelSubscriptionStringInput | null,
  toolCalls?: ModelSubscriptionStringInput | null,
  toolName?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionBooleanInput = {
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelSubscriptionChatSessionFilterInput = {
  and?: Array< ModelSubscriptionChatSessionFilterInput | null > | null,
  collectionContext?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  linkedCollectionId?: ModelSubscriptionStringInput | null,
  name?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionChatSessionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionDummyModelToAddIamDirectiveFilterInput = {
  and?: Array< ModelSubscriptionDummyModelToAddIamDirectiveFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionDummyModelToAddIamDirectiveFilterInput | null > | null,
  owner?: ModelStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionProjectFilterInput = {
  and?: Array< ModelSubscriptionProjectFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  description?: ModelSubscriptionStringInput | null,
  foundationModelId?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionProjectFilterInput | null > | null,
  owner?: ModelStringInput | null,
  procedureS3Path?: ModelSubscriptionStringInput | null,
  reportS3Path?: ModelSubscriptionStringInput | null,
  result?: ModelSubscriptionStringInput | null,
  sourceChatSessionId?: ModelSubscriptionIDInput | null,
  status?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionWellFilterInput = {
  alerts?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionWellFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  healthScore?: ModelSubscriptionIntInput | null,
  id?: ModelSubscriptionIDInput | null,
  lastMaintenanceDate?: ModelSubscriptionStringInput | null,
  location?: ModelSubscriptionStringInput | null,
  metadata?: ModelSubscriptionStringInput | null,
  name?: ModelSubscriptionStringInput | null,
  nextMaintenanceDate?: ModelSubscriptionStringInput | null,
  operationalStatus?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionWellFilterInput | null > | null,
  sensors?: ModelSubscriptionStringInput | null,
  type?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionIntInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type CatalogSearchQueryVariables = {
  existingContext?: string | null,
  prompt: string,
};

export type CatalogSearchQuery = {
  catalogSearch?: string | null,
};

export type CollectionQueryQueryVariables = {
  collectionId?: string | null,
  operation: string,
};

export type CollectionQueryQuery = {
  collectionQuery?: string | null,
};

export type GetCatalogMapDataQueryVariables = {
  type: string,
};

export type GetCatalogMapDataQuery = {
  getCatalogMapData?: string | null,
};

export type GetChatMessageQueryVariables = {
  id: string,
};

export type GetChatMessageQuery = {
  getChatMessage?:  {
    __typename: "ChatMessage",
    artifacts?: Array< string | null > | null,
    chatSession?:  {
      __typename: "ChatSession",
      collectionContext?: string | null,
      createdAt: string,
      id: string,
      linkedCollectionId?: string | null,
      name?: string | null,
      owner?: string | null,
      updatedAt: string,
    } | null,
    chatSessionId?: string | null,
    chatSessionIdUnderscoreFieldName?: string | null,
    content?:  {
      __typename: "ChatMessageContent",
      text?: string | null,
    } | null,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    thoughtSteps?: Array< string | null > | null,
    toolCallId?: string | null,
    toolCalls?: string | null,
    toolName?: string | null,
    updatedAt: string,
  } | null,
};

export type GetChatSessionQueryVariables = {
  id: string,
};

export type GetChatSessionQuery = {
  getChatSession?:  {
    __typename: "ChatSession",
    collectionContext?: string | null,
    createdAt: string,
    id: string,
    linkedCollectionId?: string | null,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    name?: string | null,
    owner?: string | null,
    updatedAt: string,
    workSteps?:  Array< {
      __typename: "WorkStep",
      description?: string | null,
      name?: string | null,
      result?: string | null,
      status?: WorkStepStatus | null,
    } | null > | null,
  } | null,
};

export type GetDummyModelToAddIamDirectiveQueryVariables = {
  id: string,
};

export type GetDummyModelToAddIamDirectiveQuery = {
  getDummyModelToAddIamDirective?:  {
    __typename: "DummyModelToAddIamDirective",
    createdAt: string,
    id: string,
    owner?: string | null,
    responseStreamChunk?:  {
      __typename: "ResponseStreamChunk",
      chatSessionId: string,
      chunkText: string,
      index: number,
    } | null,
    updatedAt: string,
  } | null,
};

export type GetProjectQueryVariables = {
  id: string,
};

export type GetProjectQuery = {
  getProject?:  {
    __typename: "Project",
    createdAt: string,
    description?: string | null,
    financial?:  {
      __typename: "ProjectFinancial",
      NPV10?: number | null,
      cost?: number | null,
      incrimentalGasRateMCFD?: number | null,
      incrimentalOilRateBOPD?: number | null,
      revenuePresentValue?: number | null,
      successProbability?: number | null,
    } | null,
    foundationModelId?: string | null,
    id: string,
    name?: string | null,
    nextAction?:  {
      __typename: "ProjectNextAction",
      buttonTextAfterClick?: string | null,
      buttonTextBeforeClick?: string | null,
    } | null,
    owner?: string | null,
    procedureS3Path?: string | null,
    reportS3Path: string,
    result?: string | null,
    sourceChatSessionId?: string | null,
    status?: ProjectStatus | null,
    updatedAt: string,
  } | null,
};

export type GetWellQueryVariables = {
  id: string,
};

export type GetWellQuery = {
  getWell?:  {
    __typename: "Well",
    alerts: string,
    createdAt: string,
    healthScore: number,
    id: string,
    lastMaintenanceDate: string,
    location: string,
    metadata: string,
    name: string,
    nextMaintenanceDate: string,
    operationalStatus?: WellOperationalStatus | null,
    sensors: string,
    type: string,
    updatedAt: string,
  } | null,
};

export type ListChatMessageByChatSessionIdAndCreatedAtQueryVariables = {
  chatSessionId: string,
  createdAt?: ModelStringKeyConditionInput | null,
  filter?: ModelChatMessageFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListChatMessageByChatSessionIdAndCreatedAtQuery = {
  listChatMessageByChatSessionIdAndCreatedAt?:  {
    __typename: "ModelChatMessageConnection",
    items:  Array< {
      __typename: "ChatMessage",
      artifacts?: Array< string | null > | null,
      chatSessionId?: string | null,
      chatSessionIdUnderscoreFieldName?: string | null,
      createdAt?: string | null,
      id: string,
      owner?: string | null,
      responseComplete?: boolean | null,
      role?: ChatMessageRole | null,
      thoughtSteps?: Array< string | null > | null,
      toolCallId?: string | null,
      toolCalls?: string | null,
      toolName?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListChatMessageByChatSessionIdUnderscoreFieldNameAndCreatedAtQueryVariables = {
  chatSessionIdUnderscoreFieldName: string,
  createdAt?: ModelStringKeyConditionInput | null,
  filter?: ModelChatMessageFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListChatMessageByChatSessionIdUnderscoreFieldNameAndCreatedAtQuery = {
  listChatMessageByChatSessionIdUnderscoreFieldNameAndCreatedAt?:  {
    __typename: "ModelChatMessageConnection",
    items:  Array< {
      __typename: "ChatMessage",
      artifacts?: Array< string | null > | null,
      chatSessionId?: string | null,
      chatSessionIdUnderscoreFieldName?: string | null,
      createdAt?: string | null,
      id: string,
      owner?: string | null,
      responseComplete?: boolean | null,
      role?: ChatMessageRole | null,
      thoughtSteps?: Array< string | null > | null,
      toolCallId?: string | null,
      toolCalls?: string | null,
      toolName?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListChatMessagesQueryVariables = {
  filter?: ModelChatMessageFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListChatMessagesQuery = {
  listChatMessages?:  {
    __typename: "ModelChatMessageConnection",
    items:  Array< {
      __typename: "ChatMessage",
      artifacts?: Array< string | null > | null,
      chatSessionId?: string | null,
      chatSessionIdUnderscoreFieldName?: string | null,
      createdAt?: string | null,
      id: string,
      owner?: string | null,
      responseComplete?: boolean | null,
      role?: ChatMessageRole | null,
      thoughtSteps?: Array< string | null > | null,
      toolCallId?: string | null,
      toolCalls?: string | null,
      toolName?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListChatSessionsQueryVariables = {
  filter?: ModelChatSessionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListChatSessionsQuery = {
  listChatSessions?:  {
    __typename: "ModelChatSessionConnection",
    items:  Array< {
      __typename: "ChatSession",
      collectionContext?: string | null,
      createdAt: string,
      id: string,
      linkedCollectionId?: string | null,
      name?: string | null,
      owner?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListDummyModelToAddIamDirectivesQueryVariables = {
  filter?: ModelDummyModelToAddIamDirectiveFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListDummyModelToAddIamDirectivesQuery = {
  listDummyModelToAddIamDirectives?:  {
    __typename: "ModelDummyModelToAddIamDirectiveConnection",
    items:  Array< {
      __typename: "DummyModelToAddIamDirective",
      createdAt: string,
      id: string,
      owner?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListProjectsQueryVariables = {
  filter?: ModelProjectFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListProjectsQuery = {
  listProjects?:  {
    __typename: "ModelProjectConnection",
    items:  Array< {
      __typename: "Project",
      createdAt: string,
      description?: string | null,
      foundationModelId?: string | null,
      id: string,
      name?: string | null,
      owner?: string | null,
      procedureS3Path?: string | null,
      reportS3Path: string,
      result?: string | null,
      sourceChatSessionId?: string | null,
      status?: ProjectStatus | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListWellsQueryVariables = {
  filter?: ModelWellFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListWellsQuery = {
  listWells?:  {
    __typename: "ModelWellConnection",
    items:  Array< {
      __typename: "Well",
      alerts: string,
      createdAt: string,
      healthScore: number,
      id: string,
      lastMaintenanceDate: string,
      location: string,
      metadata: string,
      name: string,
      nextMaintenanceDate: string,
      operationalStatus?: WellOperationalStatus | null,
      sensors: string,
      type: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type CollectionManagementMutationVariables = {
  collectionId?: string | null,
  dataSourceType?: string | null,
  description?: string | null,
  name?: string | null,
  operation: string,
  previewMetadata?: string | null,
};

export type CollectionManagementMutation = {
  collectionManagement?: string | null,
};

export type CreateChatMessageMutationVariables = {
  condition?: ModelChatMessageConditionInput | null,
  input: CreateChatMessageInput,
};

export type CreateChatMessageMutation = {
  createChatMessage?:  {
    __typename: "ChatMessage",
    artifacts?: Array< string | null > | null,
    chatSession?:  {
      __typename: "ChatSession",
      collectionContext?: string | null,
      createdAt: string,
      id: string,
      linkedCollectionId?: string | null,
      name?: string | null,
      owner?: string | null,
      updatedAt: string,
    } | null,
    chatSessionId?: string | null,
    chatSessionIdUnderscoreFieldName?: string | null,
    content?:  {
      __typename: "ChatMessageContent",
      text?: string | null,
    } | null,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    thoughtSteps?: Array< string | null > | null,
    toolCallId?: string | null,
    toolCalls?: string | null,
    toolName?: string | null,
    updatedAt: string,
  } | null,
};

export type CreateChatSessionMutationVariables = {
  condition?: ModelChatSessionConditionInput | null,
  input: CreateChatSessionInput,
};

export type CreateChatSessionMutation = {
  createChatSession?:  {
    __typename: "ChatSession",
    collectionContext?: string | null,
    createdAt: string,
    id: string,
    linkedCollectionId?: string | null,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    name?: string | null,
    owner?: string | null,
    updatedAt: string,
    workSteps?:  Array< {
      __typename: "WorkStep",
      description?: string | null,
      name?: string | null,
      result?: string | null,
      status?: WorkStepStatus | null,
    } | null > | null,
  } | null,
};

export type CreateDummyModelToAddIamDirectiveMutationVariables = {
  condition?: ModelDummyModelToAddIamDirectiveConditionInput | null,
  input: CreateDummyModelToAddIamDirectiveInput,
};

export type CreateDummyModelToAddIamDirectiveMutation = {
  createDummyModelToAddIamDirective?:  {
    __typename: "DummyModelToAddIamDirective",
    createdAt: string,
    id: string,
    owner?: string | null,
    responseStreamChunk?:  {
      __typename: "ResponseStreamChunk",
      chatSessionId: string,
      chunkText: string,
      index: number,
    } | null,
    updatedAt: string,
  } | null,
};

export type CreateProjectMutationVariables = {
  condition?: ModelProjectConditionInput | null,
  input: CreateProjectInput,
};

export type CreateProjectMutation = {
  createProject?:  {
    __typename: "Project",
    createdAt: string,
    description?: string | null,
    financial?:  {
      __typename: "ProjectFinancial",
      NPV10?: number | null,
      cost?: number | null,
      incrimentalGasRateMCFD?: number | null,
      incrimentalOilRateBOPD?: number | null,
      revenuePresentValue?: number | null,
      successProbability?: number | null,
    } | null,
    foundationModelId?: string | null,
    id: string,
    name?: string | null,
    nextAction?:  {
      __typename: "ProjectNextAction",
      buttonTextAfterClick?: string | null,
      buttonTextBeforeClick?: string | null,
    } | null,
    owner?: string | null,
    procedureS3Path?: string | null,
    reportS3Path: string,
    result?: string | null,
    sourceChatSessionId?: string | null,
    status?: ProjectStatus | null,
    updatedAt: string,
  } | null,
};

export type CreateWellMutationVariables = {
  condition?: ModelWellConditionInput | null,
  input: CreateWellInput,
};

export type CreateWellMutation = {
  createWell?:  {
    __typename: "Well",
    alerts: string,
    createdAt: string,
    healthScore: number,
    id: string,
    lastMaintenanceDate: string,
    location: string,
    metadata: string,
    name: string,
    nextMaintenanceDate: string,
    operationalStatus?: WellOperationalStatus | null,
    sensors: string,
    type: string,
    updatedAt: string,
  } | null,
};

export type DeleteChatMessageMutationVariables = {
  condition?: ModelChatMessageConditionInput | null,
  input: DeleteChatMessageInput,
};

export type DeleteChatMessageMutation = {
  deleteChatMessage?:  {
    __typename: "ChatMessage",
    artifacts?: Array< string | null > | null,
    chatSession?:  {
      __typename: "ChatSession",
      collectionContext?: string | null,
      createdAt: string,
      id: string,
      linkedCollectionId?: string | null,
      name?: string | null,
      owner?: string | null,
      updatedAt: string,
    } | null,
    chatSessionId?: string | null,
    chatSessionIdUnderscoreFieldName?: string | null,
    content?:  {
      __typename: "ChatMessageContent",
      text?: string | null,
    } | null,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    thoughtSteps?: Array< string | null > | null,
    toolCallId?: string | null,
    toolCalls?: string | null,
    toolName?: string | null,
    updatedAt: string,
  } | null,
};

export type DeleteChatSessionMutationVariables = {
  condition?: ModelChatSessionConditionInput | null,
  input: DeleteChatSessionInput,
};

export type DeleteChatSessionMutation = {
  deleteChatSession?:  {
    __typename: "ChatSession",
    collectionContext?: string | null,
    createdAt: string,
    id: string,
    linkedCollectionId?: string | null,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    name?: string | null,
    owner?: string | null,
    updatedAt: string,
    workSteps?:  Array< {
      __typename: "WorkStep",
      description?: string | null,
      name?: string | null,
      result?: string | null,
      status?: WorkStepStatus | null,
    } | null > | null,
  } | null,
};

export type DeleteDummyModelToAddIamDirectiveMutationVariables = {
  condition?: ModelDummyModelToAddIamDirectiveConditionInput | null,
  input: DeleteDummyModelToAddIamDirectiveInput,
};

export type DeleteDummyModelToAddIamDirectiveMutation = {
  deleteDummyModelToAddIamDirective?:  {
    __typename: "DummyModelToAddIamDirective",
    createdAt: string,
    id: string,
    owner?: string | null,
    responseStreamChunk?:  {
      __typename: "ResponseStreamChunk",
      chatSessionId: string,
      chunkText: string,
      index: number,
    } | null,
    updatedAt: string,
  } | null,
};

export type DeleteProjectMutationVariables = {
  condition?: ModelProjectConditionInput | null,
  input: DeleteProjectInput,
};

export type DeleteProjectMutation = {
  deleteProject?:  {
    __typename: "Project",
    createdAt: string,
    description?: string | null,
    financial?:  {
      __typename: "ProjectFinancial",
      NPV10?: number | null,
      cost?: number | null,
      incrimentalGasRateMCFD?: number | null,
      incrimentalOilRateBOPD?: number | null,
      revenuePresentValue?: number | null,
      successProbability?: number | null,
    } | null,
    foundationModelId?: string | null,
    id: string,
    name?: string | null,
    nextAction?:  {
      __typename: "ProjectNextAction",
      buttonTextAfterClick?: string | null,
      buttonTextBeforeClick?: string | null,
    } | null,
    owner?: string | null,
    procedureS3Path?: string | null,
    reportS3Path: string,
    result?: string | null,
    sourceChatSessionId?: string | null,
    status?: ProjectStatus | null,
    updatedAt: string,
  } | null,
};

export type DeleteWellMutationVariables = {
  condition?: ModelWellConditionInput | null,
  input: DeleteWellInput,
};

export type DeleteWellMutation = {
  deleteWell?:  {
    __typename: "Well",
    alerts: string,
    createdAt: string,
    healthScore: number,
    id: string,
    lastMaintenanceDate: string,
    location: string,
    metadata: string,
    name: string,
    nextMaintenanceDate: string,
    operationalStatus?: WellOperationalStatus | null,
    sensors: string,
    type: string,
    updatedAt: string,
  } | null,
};

export type InvokeLightweightAgentMutationVariables = {
  agentType?: string | null,
  chatSessionId: string,
  foundationModelId?: string | null,
  message: string,
  userId?: string | null,
};

export type InvokeLightweightAgentMutation = {
  invokeLightweightAgent?:  {
    __typename: "InvokeLightweightAgentReturnType",
    artifacts?: Array< string | null > | null,
    message: string,
    success: boolean,
    thoughtSteps?: Array< string | null > | null,
  } | null,
};

export type InvokeMaintenanceAgentMutationVariables = {
  chatSessionId: string,
  foundationModelId?: string | null,
  message: string,
  userId?: string | null,
};

export type InvokeMaintenanceAgentMutation = {
  invokeMaintenanceAgent?:  {
    __typename: "InvokeMaintenanceAgentReturnType",
    artifacts?: Array< string | null > | null,
    auditTrail?: string | null,
    message: string,
    success: boolean,
    thoughtSteps?: Array< string | null > | null,
    workflow?: string | null,
  } | null,
};

export type PublishResponseStreamChunkMutationVariables = {
  chatSessionId: string,
  chunkText: string,
  index: number,
};

export type PublishResponseStreamChunkMutation = {
  publishResponseStreamChunk?:  {
    __typename: "ResponseStreamChunk",
    chatSessionId: string,
    chunkText: string,
    index: number,
  } | null,
};

export type UpdateChatMessageMutationVariables = {
  condition?: ModelChatMessageConditionInput | null,
  input: UpdateChatMessageInput,
};

export type UpdateChatMessageMutation = {
  updateChatMessage?:  {
    __typename: "ChatMessage",
    artifacts?: Array< string | null > | null,
    chatSession?:  {
      __typename: "ChatSession",
      collectionContext?: string | null,
      createdAt: string,
      id: string,
      linkedCollectionId?: string | null,
      name?: string | null,
      owner?: string | null,
      updatedAt: string,
    } | null,
    chatSessionId?: string | null,
    chatSessionIdUnderscoreFieldName?: string | null,
    content?:  {
      __typename: "ChatMessageContent",
      text?: string | null,
    } | null,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    thoughtSteps?: Array< string | null > | null,
    toolCallId?: string | null,
    toolCalls?: string | null,
    toolName?: string | null,
    updatedAt: string,
  } | null,
};

export type UpdateChatSessionMutationVariables = {
  condition?: ModelChatSessionConditionInput | null,
  input: UpdateChatSessionInput,
};

export type UpdateChatSessionMutation = {
  updateChatSession?:  {
    __typename: "ChatSession",
    collectionContext?: string | null,
    createdAt: string,
    id: string,
    linkedCollectionId?: string | null,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    name?: string | null,
    owner?: string | null,
    updatedAt: string,
    workSteps?:  Array< {
      __typename: "WorkStep",
      description?: string | null,
      name?: string | null,
      result?: string | null,
      status?: WorkStepStatus | null,
    } | null > | null,
  } | null,
};

export type UpdateDummyModelToAddIamDirectiveMutationVariables = {
  condition?: ModelDummyModelToAddIamDirectiveConditionInput | null,
  input: UpdateDummyModelToAddIamDirectiveInput,
};

export type UpdateDummyModelToAddIamDirectiveMutation = {
  updateDummyModelToAddIamDirective?:  {
    __typename: "DummyModelToAddIamDirective",
    createdAt: string,
    id: string,
    owner?: string | null,
    responseStreamChunk?:  {
      __typename: "ResponseStreamChunk",
      chatSessionId: string,
      chunkText: string,
      index: number,
    } | null,
    updatedAt: string,
  } | null,
};

export type UpdateProjectMutationVariables = {
  condition?: ModelProjectConditionInput | null,
  input: UpdateProjectInput,
};

export type UpdateProjectMutation = {
  updateProject?:  {
    __typename: "Project",
    createdAt: string,
    description?: string | null,
    financial?:  {
      __typename: "ProjectFinancial",
      NPV10?: number | null,
      cost?: number | null,
      incrimentalGasRateMCFD?: number | null,
      incrimentalOilRateBOPD?: number | null,
      revenuePresentValue?: number | null,
      successProbability?: number | null,
    } | null,
    foundationModelId?: string | null,
    id: string,
    name?: string | null,
    nextAction?:  {
      __typename: "ProjectNextAction",
      buttonTextAfterClick?: string | null,
      buttonTextBeforeClick?: string | null,
    } | null,
    owner?: string | null,
    procedureS3Path?: string | null,
    reportS3Path: string,
    result?: string | null,
    sourceChatSessionId?: string | null,
    status?: ProjectStatus | null,
    updatedAt: string,
  } | null,
};

export type UpdateWellMutationVariables = {
  condition?: ModelWellConditionInput | null,
  input: UpdateWellInput,
};

export type UpdateWellMutation = {
  updateWell?:  {
    __typename: "Well",
    alerts: string,
    createdAt: string,
    healthScore: number,
    id: string,
    lastMaintenanceDate: string,
    location: string,
    metadata: string,
    name: string,
    nextMaintenanceDate: string,
    operationalStatus?: WellOperationalStatus | null,
    sensors: string,
    type: string,
    updatedAt: string,
  } | null,
};

export type OnCreateChatMessageSubscriptionVariables = {
  filter?: ModelSubscriptionChatMessageFilterInput | null,
  owner?: string | null,
};

export type OnCreateChatMessageSubscription = {
  onCreateChatMessage?:  {
    __typename: "ChatMessage",
    artifacts?: Array< string | null > | null,
    chatSession?:  {
      __typename: "ChatSession",
      collectionContext?: string | null,
      createdAt: string,
      id: string,
      linkedCollectionId?: string | null,
      name?: string | null,
      owner?: string | null,
      updatedAt: string,
    } | null,
    chatSessionId?: string | null,
    chatSessionIdUnderscoreFieldName?: string | null,
    content?:  {
      __typename: "ChatMessageContent",
      text?: string | null,
    } | null,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    thoughtSteps?: Array< string | null > | null,
    toolCallId?: string | null,
    toolCalls?: string | null,
    toolName?: string | null,
    updatedAt: string,
  } | null,
};

export type OnCreateChatSessionSubscriptionVariables = {
  filter?: ModelSubscriptionChatSessionFilterInput | null,
  owner?: string | null,
};

export type OnCreateChatSessionSubscription = {
  onCreateChatSession?:  {
    __typename: "ChatSession",
    collectionContext?: string | null,
    createdAt: string,
    id: string,
    linkedCollectionId?: string | null,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    name?: string | null,
    owner?: string | null,
    updatedAt: string,
    workSteps?:  Array< {
      __typename: "WorkStep",
      description?: string | null,
      name?: string | null,
      result?: string | null,
      status?: WorkStepStatus | null,
    } | null > | null,
  } | null,
};

export type OnCreateDummyModelToAddIamDirectiveSubscriptionVariables = {
  filter?: ModelSubscriptionDummyModelToAddIamDirectiveFilterInput | null,
  owner?: string | null,
};

export type OnCreateDummyModelToAddIamDirectiveSubscription = {
  onCreateDummyModelToAddIamDirective?:  {
    __typename: "DummyModelToAddIamDirective",
    createdAt: string,
    id: string,
    owner?: string | null,
    responseStreamChunk?:  {
      __typename: "ResponseStreamChunk",
      chatSessionId: string,
      chunkText: string,
      index: number,
    } | null,
    updatedAt: string,
  } | null,
};

export type OnCreateProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null,
  owner?: string | null,
};

export type OnCreateProjectSubscription = {
  onCreateProject?:  {
    __typename: "Project",
    createdAt: string,
    description?: string | null,
    financial?:  {
      __typename: "ProjectFinancial",
      NPV10?: number | null,
      cost?: number | null,
      incrimentalGasRateMCFD?: number | null,
      incrimentalOilRateBOPD?: number | null,
      revenuePresentValue?: number | null,
      successProbability?: number | null,
    } | null,
    foundationModelId?: string | null,
    id: string,
    name?: string | null,
    nextAction?:  {
      __typename: "ProjectNextAction",
      buttonTextAfterClick?: string | null,
      buttonTextBeforeClick?: string | null,
    } | null,
    owner?: string | null,
    procedureS3Path?: string | null,
    reportS3Path: string,
    result?: string | null,
    sourceChatSessionId?: string | null,
    status?: ProjectStatus | null,
    updatedAt: string,
  } | null,
};

export type OnCreateWellSubscriptionVariables = {
  filter?: ModelSubscriptionWellFilterInput | null,
};

export type OnCreateWellSubscription = {
  onCreateWell?:  {
    __typename: "Well",
    alerts: string,
    createdAt: string,
    healthScore: number,
    id: string,
    lastMaintenanceDate: string,
    location: string,
    metadata: string,
    name: string,
    nextMaintenanceDate: string,
    operationalStatus?: WellOperationalStatus | null,
    sensors: string,
    type: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteChatMessageSubscriptionVariables = {
  filter?: ModelSubscriptionChatMessageFilterInput | null,
  owner?: string | null,
};

export type OnDeleteChatMessageSubscription = {
  onDeleteChatMessage?:  {
    __typename: "ChatMessage",
    artifacts?: Array< string | null > | null,
    chatSession?:  {
      __typename: "ChatSession",
      collectionContext?: string | null,
      createdAt: string,
      id: string,
      linkedCollectionId?: string | null,
      name?: string | null,
      owner?: string | null,
      updatedAt: string,
    } | null,
    chatSessionId?: string | null,
    chatSessionIdUnderscoreFieldName?: string | null,
    content?:  {
      __typename: "ChatMessageContent",
      text?: string | null,
    } | null,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    thoughtSteps?: Array< string | null > | null,
    toolCallId?: string | null,
    toolCalls?: string | null,
    toolName?: string | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteChatSessionSubscriptionVariables = {
  filter?: ModelSubscriptionChatSessionFilterInput | null,
  owner?: string | null,
};

export type OnDeleteChatSessionSubscription = {
  onDeleteChatSession?:  {
    __typename: "ChatSession",
    collectionContext?: string | null,
    createdAt: string,
    id: string,
    linkedCollectionId?: string | null,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    name?: string | null,
    owner?: string | null,
    updatedAt: string,
    workSteps?:  Array< {
      __typename: "WorkStep",
      description?: string | null,
      name?: string | null,
      result?: string | null,
      status?: WorkStepStatus | null,
    } | null > | null,
  } | null,
};

export type OnDeleteDummyModelToAddIamDirectiveSubscriptionVariables = {
  filter?: ModelSubscriptionDummyModelToAddIamDirectiveFilterInput | null,
  owner?: string | null,
};

export type OnDeleteDummyModelToAddIamDirectiveSubscription = {
  onDeleteDummyModelToAddIamDirective?:  {
    __typename: "DummyModelToAddIamDirective",
    createdAt: string,
    id: string,
    owner?: string | null,
    responseStreamChunk?:  {
      __typename: "ResponseStreamChunk",
      chatSessionId: string,
      chunkText: string,
      index: number,
    } | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null,
  owner?: string | null,
};

export type OnDeleteProjectSubscription = {
  onDeleteProject?:  {
    __typename: "Project",
    createdAt: string,
    description?: string | null,
    financial?:  {
      __typename: "ProjectFinancial",
      NPV10?: number | null,
      cost?: number | null,
      incrimentalGasRateMCFD?: number | null,
      incrimentalOilRateBOPD?: number | null,
      revenuePresentValue?: number | null,
      successProbability?: number | null,
    } | null,
    foundationModelId?: string | null,
    id: string,
    name?: string | null,
    nextAction?:  {
      __typename: "ProjectNextAction",
      buttonTextAfterClick?: string | null,
      buttonTextBeforeClick?: string | null,
    } | null,
    owner?: string | null,
    procedureS3Path?: string | null,
    reportS3Path: string,
    result?: string | null,
    sourceChatSessionId?: string | null,
    status?: ProjectStatus | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteWellSubscriptionVariables = {
  filter?: ModelSubscriptionWellFilterInput | null,
};

export type OnDeleteWellSubscription = {
  onDeleteWell?:  {
    __typename: "Well",
    alerts: string,
    createdAt: string,
    healthScore: number,
    id: string,
    lastMaintenanceDate: string,
    location: string,
    metadata: string,
    name: string,
    nextMaintenanceDate: string,
    operationalStatus?: WellOperationalStatus | null,
    sensors: string,
    type: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateChatMessageSubscriptionVariables = {
  filter?: ModelSubscriptionChatMessageFilterInput | null,
  owner?: string | null,
};

export type OnUpdateChatMessageSubscription = {
  onUpdateChatMessage?:  {
    __typename: "ChatMessage",
    artifacts?: Array< string | null > | null,
    chatSession?:  {
      __typename: "ChatSession",
      collectionContext?: string | null,
      createdAt: string,
      id: string,
      linkedCollectionId?: string | null,
      name?: string | null,
      owner?: string | null,
      updatedAt: string,
    } | null,
    chatSessionId?: string | null,
    chatSessionIdUnderscoreFieldName?: string | null,
    content?:  {
      __typename: "ChatMessageContent",
      text?: string | null,
    } | null,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    thoughtSteps?: Array< string | null > | null,
    toolCallId?: string | null,
    toolCalls?: string | null,
    toolName?: string | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateChatSessionSubscriptionVariables = {
  filter?: ModelSubscriptionChatSessionFilterInput | null,
  owner?: string | null,
};

export type OnUpdateChatSessionSubscription = {
  onUpdateChatSession?:  {
    __typename: "ChatSession",
    collectionContext?: string | null,
    createdAt: string,
    id: string,
    linkedCollectionId?: string | null,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    name?: string | null,
    owner?: string | null,
    updatedAt: string,
    workSteps?:  Array< {
      __typename: "WorkStep",
      description?: string | null,
      name?: string | null,
      result?: string | null,
      status?: WorkStepStatus | null,
    } | null > | null,
  } | null,
};

export type OnUpdateDummyModelToAddIamDirectiveSubscriptionVariables = {
  filter?: ModelSubscriptionDummyModelToAddIamDirectiveFilterInput | null,
  owner?: string | null,
};

export type OnUpdateDummyModelToAddIamDirectiveSubscription = {
  onUpdateDummyModelToAddIamDirective?:  {
    __typename: "DummyModelToAddIamDirective",
    createdAt: string,
    id: string,
    owner?: string | null,
    responseStreamChunk?:  {
      __typename: "ResponseStreamChunk",
      chatSessionId: string,
      chunkText: string,
      index: number,
    } | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateProjectSubscriptionVariables = {
  filter?: ModelSubscriptionProjectFilterInput | null,
  owner?: string | null,
};

export type OnUpdateProjectSubscription = {
  onUpdateProject?:  {
    __typename: "Project",
    createdAt: string,
    description?: string | null,
    financial?:  {
      __typename: "ProjectFinancial",
      NPV10?: number | null,
      cost?: number | null,
      incrimentalGasRateMCFD?: number | null,
      incrimentalOilRateBOPD?: number | null,
      revenuePresentValue?: number | null,
      successProbability?: number | null,
    } | null,
    foundationModelId?: string | null,
    id: string,
    name?: string | null,
    nextAction?:  {
      __typename: "ProjectNextAction",
      buttonTextAfterClick?: string | null,
      buttonTextBeforeClick?: string | null,
    } | null,
    owner?: string | null,
    procedureS3Path?: string | null,
    reportS3Path: string,
    result?: string | null,
    sourceChatSessionId?: string | null,
    status?: ProjectStatus | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateWellSubscriptionVariables = {
  filter?: ModelSubscriptionWellFilterInput | null,
};

export type OnUpdateWellSubscription = {
  onUpdateWell?:  {
    __typename: "Well",
    alerts: string,
    createdAt: string,
    healthScore: number,
    id: string,
    lastMaintenanceDate: string,
    location: string,
    metadata: string,
    name: string,
    nextMaintenanceDate: string,
    operationalStatus?: WellOperationalStatus | null,
    sensors: string,
    type: string,
    updatedAt: string,
  } | null,
};

export type RecieveResponseStreamChunkSubscriptionVariables = {
  chatSessionId: string,
};

export type RecieveResponseStreamChunkSubscription = {
  recieveResponseStreamChunk?:  {
    __typename: "ResponseStreamChunk",
    chatSessionId: string,
    chunkText: string,
    index: number,
  } | null,
};

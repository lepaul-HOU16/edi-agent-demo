import { type ClientSchema, a, defineData, defineFunction } from '@aws-amplify/backend';

export const lightweightAgentFunction = defineFunction({
  name: 'lightweightAgent',
  entry: '../functions/lightweightAgent/handler.ts',
  timeoutSeconds: 300,
  memoryMB: 1024,
  resourceGroupName: 'data',
  environment: {
    AGENT_MODEL_ID: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    TEXT_TO_TABLE_MODEL_ID: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    TEXT_TO_TABLE_CONCURRENCY: '5',
    ORIGIN_BASE_PATH: process.env.ORIGIN_BASE_PATH || '',
    S3_BUCKET: 'amplify-digitalassistant--workshopstoragebucketd9b-1kur1xycq1xq',
    AMPLIFY_BRANCH: process.env.AMPLIFY_BRANCH || 'main',
    AMPLIFY_APP_ID: process.env.AMPLIFY_APP_ID || 'unknown'
  }
});

// ReActAgent has been deprecated and replaced with EnhancedStrandsAgent via lightweightAgent
// MCP functionality is now handled locally within EnhancedStrandsAgent

export const catalogMapDataFunction = defineFunction({
  name: 'catalogMapData',
  entry: '../functions/catalogMapData/index.ts',
  timeoutSeconds: 60,
  environment: {
    STORAGE_BUCKET_NAME: 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m',
  }
});

export const catalogSearchFunction = defineFunction({
  name: 'catalogSearch',
  entry: '../functions/catalogSearch/index.ts',
  timeoutSeconds: 60,
  environment: {
    OSDU_BASE_URL: 'https://community.opensubsurface.org',
    OSDU_API_VERSION: 'v2',
    OSDU_PARTITION_ID: 'opendes',
    STORAGE_BUCKET_NAME: 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m',
    // Add OSDU_ACCESS_TOKEN as environment variable when available
  }
});

export const schema = a.schema({
  Project: a.model({
    name: a.string(),
    description: a.string(),
    status: a.enum(["drafting", "proposed", "approved", "rejected", "scheduled", "in_progress", "completed", "failed"]),
    result: a.string(),
    procedureS3Path: a.string(),
    reportS3Path: a.string().required(),
    sourceChatSessionId: a.id(),
    financial: a.customType({
      revenuePresentValue: a.float(),
      cost: a.float(),
      NPV10: a.float(),
      successProbability: a.float(),
      incrimentalGasRateMCFD: a.float(),
      incrimentalOilRateBOPD: a.float(),
    }),
    foundationModelId: a.string(),
    nextAction: a.customType({
      buttonTextBeforeClick: a.string(),
      buttonTextAfterClick: a.string(),
    })
  })
    .authorization((allow) => [allow.owner(), allow.authenticated(), allow.guest()]),

  WorkStep: a.customType({
    name: a.string(),
    description: a.string(),
    status: a.enum(["pending", "in_progress", "completed", "failed"]),
    result: a.string()
  }),

  ChatSession: a.model({
    name: a.string(),
    messages: a.hasMany("ChatMessage", "chatSessionId"),
    workSteps: a.ref("WorkStep").array(),
  })
    .authorization((allow) => [allow.owner(), allow.authenticated(), allow.guest()]),

  ChatMessage: a
    .model({
      chatSessionId: a.id(),
      chatSession: a.belongsTo("ChatSession", 'chatSessionId'),

      //Chat message fields
      content: a.customType({
        text: a.string(),
      }),
      role: a.enum(["human", "ai", "tool"]),
      responseComplete: a.boolean(),
      chatSessionIdUnderscoreFieldName: a.string(), //This is so that when invoking multiple agents, an agent can query it's own messages
      artifacts: a.json().array(), // Add artifacts field
      thoughtSteps: a.json().array(), // Add thought steps field for chain of thought

      //auto-generated fields
      owner: a.string(),
      createdAt: a.datetime(),

      //langchain fields
      toolCallId: a.string(),
      toolName: a.string(),
      toolCalls: a.string(),
    })
    .secondaryIndexes((index) => [
      index("chatSessionId").sortKeys(["createdAt"]),
      index("chatSessionIdUnderscoreFieldName").sortKeys(["createdAt"])
    ])
    .authorization((allow) => [allow.owner(), allow.authenticated(), allow.guest()]),

  //These assets enable token level streaming from the model
  ResponseStreamChunk: a.customType({
    chunkText: a.string().required(),
    index: a.integer().required(),
    chatSessionId: a.string().required()
  }),

  DummyModelToAddIamDirective: a.model({//This is required to add the IAM directive to the ResponseStreamChunk type
    responseStreamChunk: a.ref('ResponseStreamChunk')
  })
    .authorization((allow) => [allow.owner()]),

  publishResponseStreamChunk: a.mutation()
    .arguments({
      chunkText: a.string().required(),
      index: a.integer().required(),
      chatSessionId: a.string().required(),
    })
    .returns(a.ref('ResponseStreamChunk'))
    // .returns(a.string())
    .handler(a.handler.custom({ entry: './publishMessageStreamChunk.js' }))
    .authorization(allow => [allow.authenticated()]),

  recieveResponseStreamChunk: a
    .subscription()
    .for(a.ref('publishResponseStreamChunk'))
    .arguments({ chatSessionId: a.string().required() })
    .handler(a.handler.custom({ entry: './receiveMessageStreamChunk.js' }))
    .authorization(allow => [allow.authenticated()]),

  invokeLightweightAgent: a.mutation()
    .arguments({
      chatSessionId: a.id().required(),
      message: a.string().required(),
      foundationModelId: a.string(),
      userId: a.string(),
    })
    .returns(a.customType({
      success: a.boolean().required(),
      message: a.string().required(),
      artifacts: a.json().array(),
      thoughtSteps: a.json().array() // CRITICAL FIX: Add thoughtSteps to return type
    }))
    .handler(a.handler.function(lightweightAgentFunction))
    .authorization((allow) => [allow.authenticated()]),

  // invokeReActAgent has been deprecated - use invokeLightweightAgent instead
  // which now uses EnhancedStrandsAgent with local MCP tools

  getCatalogMapData: a.query()
    .arguments({
      type: a.string().required(),
    })
    .returns(a.string())
    .handler(a.handler.function(catalogMapDataFunction))
    .authorization((allow) => [allow.authenticated()]),

  catalogSearch: a.query()
    .arguments({
      prompt: a.string().required(),
      existingContext: a.json(),
    })
    .returns(a.string())
    .handler(a.handler.function(catalogSearchFunction))
    .authorization((allow) => [allow.authenticated()]),
})
  .authorization((allow) => [
    allow.resource(lightweightAgentFunction).to(["query", "mutate"])
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

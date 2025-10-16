import { type ClientSchema, a, defineData, defineFunction } from '@aws-amplify/backend';
import { maintenanceAgentFunction } from '../functions/maintenanceAgent/resource';

// Main agent function with full routing capabilities (EnhancedStrandsAgent + RenewableProxyAgent)
export const agentFunction = defineFunction({
  name: 'agent',
  entry: '../functions/agents/handler.ts',
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
    AMPLIFY_APP_ID: process.env.AMPLIFY_APP_ID || 'unknown',
    // Renewable energy integration configuration
    RENEWABLE_ENABLED: 'true',
    RENEWABLE_ORCHESTRATOR_FUNCTION_NAME: 'amplify-digitalassistant--renewableOrchestratorlam-jBcrYHDFlPXd',
    NEXT_PUBLIC_RENEWABLE_ENABLED: process.env.NEXT_PUBLIC_RENEWABLE_ENABLED || 'false',
    NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT: process.env.NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT || '',
    NEXT_PUBLIC_RENEWABLE_S3_BUCKET: process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET || 'renewable-energy-artifacts-484907533441',
    NEXT_PUBLIC_RENEWABLE_AWS_REGION: process.env.NEXT_PUBLIC_RENEWABLE_AWS_REGION || 'us-west-2'
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

export const renewableToolsFunction = defineFunction({
  name: 'renewableTools',
  entry: '../functions/renewableTools/handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  resourceGroupName: 'data',
  environment: {
    NREL_API_KEY: process.env.NREL_API_KEY || 'DEMO_KEY',
    RENEWABLE_AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  }
});

// Enterprise Collection Service - Re-enabled for full rollout
export const collectionServiceFunction = defineFunction({
  name: 'collectionService',
  entry: '../functions/collectionService/handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    STORAGE_BUCKET_NAME: 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m',
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

  // Well Equipment Model for Wells Equipment Dashboard
  Well: a.model({
    name: a.string().required(),
    type: a.string().required(), // 'well'
    location: a.string().required(),
    operationalStatus: a.enum(["operational", "degraded", "critical", "offline"]),
    healthScore: a.integer().required(),
    lastMaintenanceDate: a.string().required(),
    nextMaintenanceDate: a.string().required(),
    sensors: a.json().required(), // Array of sensor objects
    alerts: a.json().required(), // Array of alert objects
    metadata: a.json().required(), // Field, operator, install date, depth, production data
  })
    .authorization((allow) => [allow.authenticated(), allow.guest()]),

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
    // Phase 3: Collection integration
    linkedCollectionId: a.string(),
    collectionContext: a.json(), // Cached collection data for performance
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
      agentType: a.string(), // Optional: 'auto', 'petrophysics', 'maintenance', 'renewable'
    })
    .returns(a.customType({
      success: a.boolean().required(),
      message: a.string().required(),
      artifacts: a.json().array(),
      thoughtSteps: a.json().array() // CRITICAL FIX: Add thoughtSteps to return type
    }))
    .handler(a.handler.function(agentFunction))
    .authorization((allow) => [allow.authenticated()]),

  // NEW: Maintenance Agent mutation
  invokeMaintenanceAgent: a.mutation()
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
      thoughtSteps: a.json().array(),
      workflow: a.json(),
      auditTrail: a.json()
    }))
    .handler(a.handler.function(maintenanceAgentFunction))
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

  // Enterprise Collection Management Operations - Simplified to avoid GraphQL conflicts
  collectionManagement: a.mutation()
    .arguments({
      operation: a.string().required(),
      name: a.string(),
      description: a.string(),
      dataSourceType: a.string(),
      previewMetadata: a.json(),
      collectionId: a.string(),
    })
    .returns(a.string())
    .handler(a.handler.function(collectionServiceFunction))
    .authorization((allow) => [allow.authenticated()]),

  collectionQuery: a.query()
    .arguments({
      operation: a.string().required(),
      collectionId: a.string(),
    })
    .returns(a.string())
    .handler(a.handler.function(collectionServiceFunction))
    .authorization((allow) => [allow.authenticated()]),
})
  .authorization((allow) => [
    allow.resource(agentFunction).to(["query", "mutate"])
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

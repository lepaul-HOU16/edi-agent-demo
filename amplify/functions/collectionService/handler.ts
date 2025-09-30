import { Handler } from 'aws-lambda';

interface CreateCollectionRequest {
  name: string;
  description?: string;
  dataSourceType: string;
  previewMetadata?: string;
}

interface ListCollectionsResponse {
  collections: any[];
  count: number;
}

// Global persistent collections storage for demo (survives Lambda warm starts)
declare global {
  var persistentCollections: any[] | undefined;
}

// Initialize collections with demo data if not already set
function getCollections() {
  if (!global.persistentCollections) {
    console.log('🔄 Initializing persistent collections storage');
    global.persistentCollections = [
      {
        id: 'demo_collection_1',
        name: 'Cuu Long Basin Wells',
        description: 'Production wells from the Cuu Long Basin area',
        dataSourceType: 'Mixed',
        previewMetadata: {
          wellCount: 15,
          dataPointCount: 15,
          dataSources: ['OSDU', 'S3'],
          operators: ['PetroVietnam', 'Total'],
          createdFrom: 'demo'
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'current-user'
      },
      {
        id: 'demo_collection_2', 
        name: 'Deep Water Exploration',
        description: 'High-potential deep water exploration targets',
        dataSourceType: 'S3',
        previewMetadata: {
          wellCount: 8,
          dataPointCount: 8,
          dataSources: ['S3'],
          operators: ['Shell', 'Chevron'],
          createdFrom: 'demo'
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'current-user'
      }
    ];
  }
  return global.persistentCollections;
}

function addCollection(collection: any) {
  const collections = getCollections();
  collections.push(collection);
  console.log('✅ Collection added to persistent storage, total:', collections.length);
}

// Helper function for creating collections
async function handleCreateCollection(args: any) {
  console.log('📁 Creating collection via helper:', args);
  
  // Safely handle previewMetadata - could be string or already parsed object
  let parsedMetadata = {};
  if (args.previewMetadata) {
    try {
      if (typeof args.previewMetadata === 'string') {
        parsedMetadata = JSON.parse(args.previewMetadata);
      } else if (typeof args.previewMetadata === 'object') {
        parsedMetadata = args.previewMetadata;
      }
    } catch (parseError) {
      console.error('⚠️ Failed to parse previewMetadata, using empty object:', parseError);
      parsedMetadata = {};
    }
  }
  
  const newCollection = {
    id: `collection_${Date.now()}`,
    name: args.name,
    description: args.description || '',
    dataSourceType: args.dataSourceType,
    previewMetadata: parsedMetadata,
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    owner: 'current-user'
  };
  
  // Store the collection in persistent global storage
  addCollection(newCollection);
  
  return JSON.stringify({
    success: true,
    collection: newCollection,
    message: 'Collection created successfully'
  });
}

export const handler: Handler = async (event) => {
  console.log('🗂️ Collection Service Handler:', JSON.stringify(event, null, 2));
  
  try {
    // Get operation from arguments first (simplified API), then fallback to fieldName
    const operation = event.arguments?.operation || event.info?.fieldName || 'unknown';
    console.log('🔍 Operation detected:', operation);
    console.log('📝 Arguments received:', event.arguments);
    
    switch (operation) {
      case 'createCollection':
        const createArgs = event.arguments;
        console.log('📁 Creating collection:', createArgs);
        
        // Safely handle previewMetadata - could be string or already parsed object
        let parsedMetadata = {};
        if (createArgs.previewMetadata) {
          try {
            if (typeof createArgs.previewMetadata === 'string') {
              parsedMetadata = JSON.parse(createArgs.previewMetadata);
            } else if (typeof createArgs.previewMetadata === 'object') {
              parsedMetadata = createArgs.previewMetadata;
            }
          } catch (parseError) {
            console.error('⚠️ Failed to parse previewMetadata, using empty object:', parseError);
            parsedMetadata = {};
          }
        }
        
        const newCollection = {
          id: `collection_${Date.now()}`,
          name: createArgs.name,
          description: createArgs.description || '',
          dataSourceType: createArgs.dataSourceType,
          previewMetadata: parsedMetadata,
          createdAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          owner: 'current-user'
        };
        
        // Store the collection in persistent global storage
        addCollection(newCollection);
        
        return JSON.stringify({
          success: true,
          collection: newCollection,
          message: 'Collection created successfully'
        });

      case 'listCollections':
        const collections = getCollections();
        console.log('📋 Listing collections, current count:', collections.length);
        
        const collectionsResponse: ListCollectionsResponse = {
          collections: collections,
          count: collections.length
        };
        
        return JSON.stringify(collectionsResponse);

      case 'getCollection':
      case 'fetchCollection':
        const collectionId = event.arguments?.collectionId;
        console.log('🔍 Getting collection:', collectionId);
        
        return JSON.stringify({
          success: false,
          error: 'Collection not found - mock implementation'
        });

      case 'deleteCollection':
        const deleteId = event.arguments?.collectionId;
        console.log('🗑️ Deleting collection:', deleteId);
        
        return JSON.stringify({
          success: true,
          message: 'Collection deleted successfully'
        });

      case 'collectionManagement':
        // Handle the unified operation approach
        console.log('🔧 Handling unified collection management operation');
        const unifiedOperation = event.arguments?.operation;
        if (unifiedOperation === 'createCollection') {
          return await handleCreateCollection(event.arguments);
        }
        return JSON.stringify({
          success: false,
          error: `Unknown unified operation: ${unifiedOperation}`
        });

      case 'collectionQuery':
        // Handle the unified query approach  
        console.log('🔧 Handling unified collection query operation');
        const queryOperation = event.arguments?.operation;
        if (queryOperation === 'listCollections') {
          const collections = getCollections();
          console.log('📋 Unified query - listing collections, count:', collections.length);
          return JSON.stringify({
            collections: collections,
            count: collections.length
          });
        }
        return JSON.stringify({
          success: false,
          error: `Unknown query operation: ${queryOperation}`
        });

      default:
        console.log('❌ Unknown operation:', operation);
        return JSON.stringify({
          success: false,
          error: `Unknown operation: ${operation}`
        });
    }
    
  } catch (error) {
    console.error('❌ Collection service error:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      operation: event.info?.fieldName || 'unknown'
    });
  }
};

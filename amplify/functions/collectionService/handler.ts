import { Handler } from 'aws-lambda';

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
    
    // Generate 24 numbered wells from S3 global/well-data directory
    const numberedWells = Array.from({ length: 24 }, (_, i) => {
      const wellNum = String(i + 1).padStart(3, '0');
      return {
        id: `well_${wellNum}`,
        name: `WELL-${wellNum}`,
        type: 'wellbore',
        dataSource: 'S3',
        s3Key: `global/well-data/WELL-${wellNum}.las`,
        location: 'South China Sea',
        operator: 'Production Operator',
        depth: '2000-3500m',
        curves: ['GR', 'RHOB', 'NPHI', 'DTC', 'CALI', 'Resistivity']
      };
    });
    
    global.persistentCollections = [
      {
        id: 'demo_collection_1',
        name: 'South China Sea Production Wells (24 Wells)',
        description: '24 numbered production wells (WELL-001 through WELL-024) with complete LAS files from the South China Sea',
        dataSourceType: 'S3',
        previewMetadata: {
          wellCount: 24,
          dataPointCount: 24,
          dataSources: ['S3'],
          operators: ['Production Operator'],
          createdFrom: 'demo',
          location: 'South China Sea',
          wellRange: 'WELL-001 to WELL-024'
        },
        dataItems: numberedWells,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'current-user'
      },
      {
        id: 'demo_collection_osdu',
        name: 'Cuu Long Basin Wells (OSDU)',
        description: 'Production wells from the Cuu Long Basin area via OSDU',
        dataSourceType: 'Mixed',
        previewMetadata: {
          wellCount: 5,
          dataPointCount: 5,
          dataSources: ['OSDU', 'S3'],
          operators: ['PetroVietnam', 'Total'],
          createdFrom: 'demo'
        },
        dataItems: [
          {
            id: 'well_osdu_001',
            name: 'AKM-12',
            type: 'wellbore',
            dataSource: 'OSDU',
            s3Key: 'wells/akm-12/trajectory.csv',
            osduId: 'osdu:work-product-component--WellboreTrajectory:6ec4485cfed716a909ccabf93cbc658fe7ba2a1bd971d33041ba505d43b949d5'
          },
          {
            id: 'well_osdu_002',
            name: 'ANN-04-S1',
            type: 'trajectory',
            dataSource: 'OSDU',
            s3Key: 'wells/ann-04-s1/trajectory.csv',
            osduId: 'osdu:work-product-component--WellboreTrajectory:4f1c114b29ff8baee976b0ec2c54927e2519bf67b5a3a021aad7b926edeecfa2'
          },
          {
            id: 'well_osdu_003',
            name: 'KDZ-02-S1',
            type: 'wellbore',
            dataSource: 'OSDU',
            s3Key: 'wells/kdz-02-s1/trajectory.csv',
            osduId: 'osdu:work-product-component--WellboreTrajectory:9ca70981081a141c8abf442b27c72ff8df17dda8f9f8a5d29557a7cc650036b9'
          },
          {
            id: 'well_osdu_004',
            name: 'VRS-401',
            type: 'trajectory',
            dataSource: 'OSDU',
            s3Key: 'wells/vrs-401/trajectory.csv',
            osduId: 'osdu:work-product-component--WellboreTrajectory:7dc159bda77d41c8aa99cd08b13acb3178236f824c913c83d3844bf603fc1dee'
          },
          {
            id: 'well_osdu_005',
            name: 'LIR-31',
            type: 'wellbore',
            dataSource: 'OSDU',
            s3Key: 'wells/lir-31/trajectory.csv',
            osduId: 'osdu:work-product-component--WellboreTrajectory:4fdcc38ba9036b76fc499723bd8164f412762985490'
          }
        ],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'current-user'
      },

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
  
  // Safely handle dataItems - could be string or already parsed array
  let parsedDataItems = [];
  if (args.dataItems) {
    try {
      if (typeof args.dataItems === 'string') {
        parsedDataItems = JSON.parse(args.dataItems);
      } else if (Array.isArray(args.dataItems)) {
        parsedDataItems = args.dataItems;
      }
      console.log('✅ Parsed dataItems:', parsedDataItems.length, 'items');
    } catch (parseError) {
      console.error('⚠️ Failed to parse dataItems, using empty array:', parseError);
      parsedDataItems = [];
    }
  }
  
  const newCollection = {
    id: `collection_${Date.now()}`,
    name: args.name,
    description: args.description || '',
    dataSourceType: args.dataSourceType,
    previewMetadata: parsedMetadata,
    dataItems: parsedDataItems, // Store the actual data items with OSDU metadata
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    owner: 'current-user'
  };
  
  // Store the collection in persistent global storage
  addCollection(newCollection);
  
  console.log('✅ Collection created with data items:', {
    id: newCollection.id,
    name: newCollection.name,
    itemCount: parsedDataItems.length,
    osduCount: parsedDataItems.filter((item: any) => item.dataSource === 'OSDU').length,
    catalogCount: parsedDataItems.filter((item: any) => item.dataSource !== 'OSDU').length
  });
  
  return JSON.stringify({
    success: true,
    collection: newCollection,
    collectionId: newCollection.id, // Include ID for navigation
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
        
        // Safely handle dataItems - could be string or already parsed array
        let parsedDataItems = [];
        if (createArgs.dataItems) {
          try {
            if (typeof createArgs.dataItems === 'string') {
              parsedDataItems = JSON.parse(createArgs.dataItems);
            } else if (Array.isArray(createArgs.dataItems)) {
              parsedDataItems = createArgs.dataItems;
            }
            console.log('✅ Parsed dataItems:', parsedDataItems.length, 'items');
          } catch (parseError) {
            console.error('⚠️ Failed to parse dataItems, using empty array:', parseError);
            parsedDataItems = [];
          }
        }
        
        const newCollection = {
          id: `collection_${Date.now()}`,
          name: createArgs.name,
          description: createArgs.description || '',
          dataSourceType: createArgs.dataSourceType,
          previewMetadata: parsedMetadata,
          dataItems: parsedDataItems, // Store the actual data items with OSDU metadata
          createdAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          owner: 'current-user'
        };
        
        // Store the collection in persistent global storage
        addCollection(newCollection);
        
        console.log('✅ Collection created with data items:', {
          id: newCollection.id,
          name: newCollection.name,
          itemCount: parsedDataItems.length,
          osduCount: parsedDataItems.filter((item: any) => item.dataSource === 'OSDU').length,
          catalogCount: parsedDataItems.filter((item: any) => item.dataSource !== 'OSDU').length
        });
        
        return JSON.stringify({
          success: true,
          collection: newCollection,
          collectionId: newCollection.id, // Include ID for navigation
          message: 'Collection created successfully'
        });

      case 'listCollections':
        const collectionsForList = getCollections();
        console.log('📋 Listing collections, current count:', collectionsForList.length);
        
        const collectionsResponse: ListCollectionsResponse = {
          collections: collectionsForList,
          count: collectionsForList.length
        };
        
        return JSON.stringify(collectionsResponse);

      case 'getCollection':
      case 'fetchCollection':
      case 'getCollectionById':
        const collectionId = event.arguments?.collectionId;
        console.log('🔍 Getting collection by ID:', collectionId);
        
        if (!collectionId) {
          return JSON.stringify({
            success: false,
            error: 'Collection ID is required'
          });
        }
        
        const collectionsForGet = getCollections();
        const collection = collectionsForGet.find(c => c.id === collectionId);
        
        if (!collection) {
          return JSON.stringify({
            success: false,
            error: `Collection not found: ${collectionId}`
          });
        }
        
        // Update last accessed time
        collection.lastAccessedAt = new Date().toISOString();
        
        return JSON.stringify({
          success: true,
          collection: collection
        });

      case 'deleteCollection':
        const deleteId = event.arguments?.collectionId;
        console.log('🗑️ Deleting collection:', deleteId);
        
        if (!deleteId) {
          return JSON.stringify({
            success: false,
            error: 'Collection ID is required'
          });
        }
        
        const collectionsBeforeDelete = getCollections();
        const indexToDelete = collectionsBeforeDelete.findIndex(c => c.id === deleteId);
        
        if (indexToDelete === -1) {
          return JSON.stringify({
            success: false,
            error: `Collection not found: ${deleteId}`
          });
        }
        
        collectionsBeforeDelete.splice(indexToDelete, 1);
        console.log('✅ Collection deleted, remaining count:', collectionsBeforeDelete.length);
        
        return JSON.stringify({
          success: true,
          message: 'Collection deleted successfully'
        });

      case 'linkCanvasToCollection':
        const canvasId = event.arguments?.canvasId;
        const linkCollectionId = event.arguments?.collectionId;
        console.log('🔗 Linking canvas to collection:', { canvasId, linkCollectionId });
        
        if (!canvasId || !linkCollectionId) {
          return JSON.stringify({
            success: false,
            error: 'Both canvasId and collectionId are required'
          });
        }
        
        // Verify collection exists
        const collectionsForLink = getCollections();
        const targetCollection = collectionsForLink.find(c => c.id === linkCollectionId);
        
        if (!targetCollection) {
          return JSON.stringify({
            success: false,
            error: `Collection not found: ${linkCollectionId}`
          });
        }
        
        // Note: The actual linking is done in the ChatSession model via linkedCollectionId field
        // This operation just validates the collection exists
        return JSON.stringify({
          success: true,
          message: 'Canvas linked to collection successfully',
          collection: targetCollection
        });

      case 'collectionManagement':
        // Handle the unified operation approach
        console.log('🔧 Handling unified collection management operation');
        const unifiedOperation = event.arguments?.operation;
        
        switch (unifiedOperation) {
          case 'createCollection':
            return await handleCreateCollection(event.arguments);
          
          case 'deleteCollection':
            const deleteId = event.arguments?.collectionId;
            if (!deleteId) {
              return JSON.stringify({
                success: false,
                error: 'Collection ID is required'
              });
            }
            
            const collectionsBeforeDelete = getCollections();
            const indexToDelete = collectionsBeforeDelete.findIndex(c => c.id === deleteId);
            
            if (indexToDelete === -1) {
              return JSON.stringify({
                success: false,
                error: `Collection not found: ${deleteId}`
              });
            }
            
            collectionsBeforeDelete.splice(indexToDelete, 1);
            console.log('✅ Collection deleted via unified API, remaining:', collectionsBeforeDelete.length);
            
            return JSON.stringify({
              success: true,
              message: 'Collection deleted successfully'
            });
          
          case 'linkCanvasToCollection':
            const canvasId = event.arguments?.canvasId;
            const linkCollectionId = event.arguments?.collectionId;
            
            if (!canvasId || !linkCollectionId) {
              return JSON.stringify({
                success: false,
                error: 'Both canvasId and collectionId are required'
              });
            }
            
            const collectionsForLink = getCollections();
            const targetCollection = collectionsForLink.find(c => c.id === linkCollectionId);
            
            if (!targetCollection) {
              return JSON.stringify({
                success: false,
                error: `Collection not found: ${linkCollectionId}`
              });
            }
            
            return JSON.stringify({
              success: true,
              message: 'Canvas linked to collection successfully',
              collection: targetCollection
            });
          
          default:
            return JSON.stringify({
              success: false,
              error: `Unknown unified operation: ${unifiedOperation}`
            });
        }

      case 'getCollectionWells':
        const wellsCollectionId = event.arguments?.collectionId;
        console.log('🔍 Getting wells for collection:', wellsCollectionId);
        
        if (!wellsCollectionId) {
          return JSON.stringify({
            success: false,
            error: 'Collection ID is required'
          });
        }
        
        const collectionsForWells = getCollections();
        const wellsCollection = collectionsForWells.find(c => c.id === wellsCollectionId);
        
        if (!wellsCollection) {
          return JSON.stringify({
            success: false,
            error: `Collection not found: ${wellsCollectionId}`
          });
        }
        
        // Extract well identifiers from data items
        const dataItems = wellsCollection.dataItems || [];
        const wells = dataItems
          .filter((item: any) => item.type === 'wellbore' || item.type === 'trajectory')
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            s3Key: item.s3Key,
            osduId: item.osduId,
            type: item.type
          }));
        
        console.log(`✅ Found ${wells.length} wells in collection ${wellsCollectionId}`);
        
        return JSON.stringify({
          success: true,
          wells,
          count: wells.length
        });

      case 'collectionQuery':
        // Handle the unified query approach  
        console.log('🔧 Handling unified collection query operation');
        const queryOperation = event.arguments?.operation;
        if (queryOperation === 'listCollections') {
          const collectionsForQuery = getCollections();
          console.log('📋 Unified query - listing collections, count:', collectionsForQuery.length);
          return JSON.stringify({
            collections: collectionsForQuery,
            count: collectionsForQuery.length
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

# Design Document

## Overview

This design implements a multi-source data architecture for the petrophysical analysis agent, enabling it to work with S3, OSDU, and future data sources through a clean abstraction layer. The design preserves all existing S3 functionality while adding OSDU support and preparing for TGS and VOLVE integration.

**Key Design Principles:**
1. **Preserve Existing Functionality**: All S3-based analysis continues working unchanged
2. **Clean Abstraction**: Data source adapters provide uniform interface
3. **Extensible Architecture**: New sources can be added without modifying core logic
4. **Collection Integration**: OSDU data flows seamlessly through collection system
5. **Minimal UI Changes**: Only add multi-select to existing selector

## Architecture

### High-Level Flow

```
User Query with Data Source Selection
    ↓
Data Source Detection (Frontend)
    ↓
    ├─→ [S3 Selected] → S3DataSourceAdapter → S3 Bucket → LAS Files
    │                                              ↓
    ├─→ [OSDU Selected] → OSDUDataSourceAdapter → OSDU API → Well Data
    │                                              ↓
    └─→ [Multiple Selected] → Query All Selected Sources
                                    ↓
                        Unified Well Data Format
                                    ↓
                        MCP Calculation Engines
                                    ↓
                        Petrophysical Results
                                    ↓
                        Collection System Integration
                                    ↓
                        Display in Chat/Canvas
```


### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Data Catalog)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Data Source Selector (Enhanced)                       │    │
│  │  - Multi-select dropdown (EXACT same styling)          │    │
│  │  - Options: S3, OSDU, TGS*, VOLVE* (*=In Development)  │    │
│  │  - "Select All Sources" replaces "Auto"                │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
│  ┌────────────────▼───────────────────────────────────────┐    │
│  │  CatalogChatBoxCloudscape                              │    │
│  │  - Passes selected sources to agent                    │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                              │
└───────────────────┼──────────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────────────────────────┐
│                Backend (Enhanced Strands Agent)                   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  DataSourceRegistry                                    │     │
│  │  - Manages available data source adapters             │     │
│  │  - Routes queries to appropriate adapters             │     │
│  └────────────────┬───────────────────────────────────────┘     │
│                   │                                              │
│         ┌─────────┴─────────┬─────────────┬──────────────┐     │
│         │                   │             │              │     │
│  ┌──────▼──────┐   ┌────────▼────┐  ┌────▼────┐  ┌─────▼────┐│
│  │S3Adapter    │   │OSDUAdapter  │  │TGSAdapter│  │VOLVEAdapt││
│  │(Existing)   │   │(New)        │  │(Future)  │  │(Future)  ││
│  └──────┬──────┘   └────────┬────┘  └────┬────┘  └─────┬────┘│
│         │                   │             │              │     │
└─────────┼───────────────────┼─────────────┼──────────────┼─────┘
          │                   │             │              │
┌─────────▼──────┐   ┌────────▼────────┐  │              │
│  S3 Bucket     │   │  OSDU API       │  │              │
│  (LAS Files)   │   │  (External)     │  │              │
└────────────────┘   └─────────────────┘  │              │
                                           │              │
                     ┌─────────────────────▼──────────────▼─────┐
                     │  Future Data Sources (TGS, VOLVE)        │
                     └───────────────────────────────────────────┘
```


## Components and Interfaces

### 1. Data Source Adapter Interface

**Location**: `amplify/functions/agents/dataSourceAdapters/IDataSourceAdapter.ts`

**Purpose**: Define standard interface that all data source adapters must implement

**Interface Definition**:
```typescript
export interface WellData {
  wellName: string;
  source: 'S3' | 'OSDU' | 'TGS' | 'VOLVE';
  sourceMetadata: {
    recordId?: string;
    dataPartition?: string;
    sourceUrl?: string;
    lastUpdated?: string;
  };
  curves: {
    DEPT: number[];
    GR?: number[];
    RHOB?: number[];
    NPHI?: number[];
    RT?: number[];
    [key: string]: number[] | undefined;
  };
  wellInfo: {
    location?: { latitude: number; longitude: number };
    operator?: string;
    field?: string;
    [key: string]: any;
  };
}

export interface IDataSourceAdapter {
  // Identifier for this data source
  readonly name: string;
  readonly displayName: string;
  readonly status: 'active' | 'development';
  
  // Check if this adapter can handle a given well name
  canHandle(wellName: string): boolean;
  
  // List available wells from this source
  listWells(filter?: string): Promise<string[]>;
  
  // Get well information
  getWellInfo(wellName: string): Promise<WellData>;
  
  // Get specific curve data
  getCurveData(wellName: string, curves: string[], depthRange?: [number, number]): Promise<WellData>;
  
  // Check if source is available
  isAvailable(): Promise<boolean>;
}
```


### 2. S3 Data Source Adapter

**Location**: `amplify/functions/agents/dataSourceAdapters/S3DataSourceAdapter.ts`

**Purpose**: Wrap existing S3 functionality in the adapter interface

**Implementation**:
```typescript
import { IDataSourceAdapter, WellData } from './IDataSourceAdapter';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

export class S3DataSourceAdapter implements IDataSourceAdapter {
  readonly name = 's3';
  readonly displayName = 'S3 (Local Wells)';
  readonly status = 'active';
  
  private s3Client: S3Client;
  private bucket: string;
  private prefix: string;
  
  constructor(bucket: string, prefix: string = 'global/well-data/') {
    this.s3Client = new S3Client({ region: 'us-east-1' });
    this.bucket = bucket;
    this.prefix = prefix;
  }
  
  canHandle(wellName: string): boolean {
    // S3 wells match pattern: WELL-001, WELL-002, etc.
    return /^WELL-\d{3}$/.test(wellName);
  }
  
  async listWells(filter?: string): Promise<string[]> {
    const response = await this.s3Client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: this.prefix
    }));
    
    const wells = (response.Contents || [])
      .filter(obj => obj.Key?.endsWith('.las'))
      .map(obj => obj.Key!.replace(this.prefix, '').replace('.las', ''));
    
    return filter ? wells.filter(w => w.includes(filter)) : wells;
  }
  
  async getWellInfo(wellName: string): Promise<WellData> {
    // Use existing S3 LAS file parsing logic
    const key = `${this.prefix}${wellName}.las`;
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    }));
    
    const content = await response.Body!.transformToString();
    const parsedData = this.parseLASFile(content);
    
    return {
      wellName,
      source: 'S3',
      sourceMetadata: {
        sourceUrl: `s3://${this.bucket}/${key}`,
        lastUpdated: response.LastModified?.toISOString()
      },
      curves: parsedData.curves,
      wellInfo: parsedData.wellInfo
    };
  }
  
  async getCurveData(wellName: string, curves: string[], depthRange?: [number, number]): Promise<WellData> {
    const wellData = await this.getWellInfo(wellName);
    
    // Filter curves
    const filteredCurves: any = { DEPT: wellData.curves.DEPT };
    curves.forEach(curve => {
      if (wellData.curves[curve]) {
        filteredCurves[curve] = wellData.curves[curve];
      }
    });
    
    // Filter by depth range if specified
    if (depthRange) {
      const [start, end] = depthRange;
      const indices = wellData.curves.DEPT
        .map((d, i) => (d >= start && d <= end) ? i : -1)
        .filter(i => i !== -1);
      
      Object.keys(filteredCurves).forEach(key => {
        filteredCurves[key] = indices.map(i => filteredCurves[key][i]);
      });
    }
    
    return { ...wellData, curves: filteredCurves };
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      await this.s3Client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: this.prefix,
        MaxKeys: 1
      }));
      return true;
    } catch {
      return false;
    }
  }
  
  private parseLASFile(content: string): { curves: any; wellInfo: any } {
    // Reuse existing LAS parsing logic from MCP server
    // This is the SAME code that currently works
    // NO CHANGES to parsing logic
    return { curves: {}, wellInfo: {} }; // Placeholder
  }
}
```


### 3. OSDU Data Source Adapter

**Location**: `amplify/functions/agents/dataSourceAdapters/OSDUDataSourceAdapter.ts`

**Purpose**: Retrieve well data from OSDU API and convert to standard format

**Implementation**:
```typescript
import { IDataSourceAdapter, WellData } from './IDataSourceAdapter';

export class OSDUDataSourceAdapter implements IDataSourceAdapter {
  readonly name = 'osdu';
  readonly displayName = 'OSDU';
  readonly status = 'active';
  
  private apiUrl: string;
  private apiKey: string;
  private dataPartition: string;
  private cache: Map<string, { data: WellData; timestamp: number }>;
  
  constructor(apiUrl: string, apiKey: string, dataPartition: string = 'osdu') {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.dataPartition = dataPartition;
    this.cache = new Map();
  }
  
  canHandle(wellName: string): boolean {
    // OSDU wells: anything that's NOT the S3 pattern
    return !/^WELL-\d{3}$/.test(wellName);
  }
  
  async listWells(filter?: string): Promise<string[]> {
    const query = filter || '*';
    const response = await this.callOSDUAPI({
      query: `list wells ${query}`,
      dataPartition: this.dataPartition,
      maxResults: 100
    });
    
    // Extract well names from OSDU response
    return response.records.map((r: any) => r.name || r.id);
  }
  
  async getWellInfo(wellName: string): Promise<WellData> {
    // Check cache first (15 minute TTL)
    const cached = this.cache.get(wellName);
    if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
      console.log(`Using cached OSDU data for ${wellName}`);
      return cached.data;
    }
    
    // Query OSDU for well data
    const response = await this.callOSDUAPI({
      query: `get well data for ${wellName} including log curves GR RHOB NPHI RT`,
      dataPartition: this.dataPartition,
      maxResults: 1
    });
    
    if (!response.records || response.records.length === 0) {
      throw new Error(`Well ${wellName} not found in OSDU`);
    }
    
    const record = response.records[0];
    const wellData = this.convertOSDUToStandardFormat(wellName, record);
    
    // Cache the result
    this.cache.set(wellName, { data: wellData, timestamp: Date.now() });
    
    return wellData;
  }
  
  async getCurveData(wellName: string, curves: string[], depthRange?: [number, number]): Promise<WellData> {
    const wellData = await this.getWellInfo(wellName);
    
    // Filter curves
    const filteredCurves: any = { DEPT: wellData.curves.DEPT };
    curves.forEach(curve => {
      if (wellData.curves[curve]) {
        filteredCurves[curve] = wellData.curves[curve];
      }
    });
    
    // Filter by depth range if specified
    if (depthRange) {
      const [start, end] = depthRange;
      const indices = wellData.curves.DEPT
        .map((d, i) => (d >= start && d <= end) ? i : -1)
        .filter(i => i !== -1);
      
      Object.keys(filteredCurves).forEach(key => {
        filteredCurves[key] = indices.map(i => filteredCurves[key][i]);
      });
    }
    
    return { ...wellData, curves: filteredCurves };
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          query: 'health check',
          dataPartition: this.dataPartition,
          maxResults: 1
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  private async callOSDUAPI(params: any): Promise<any> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`OSDU API error: ${response.status}`);
    }
    
    return await response.json();
  }
  
  private convertOSDUToStandardFormat(wellName: string, osduRecord: any): WellData {
    // Convert OSDU format to standard WellData format
    // Map OSDU curve names to standard names
    const curveMapping: { [key: string]: string } = {
      'GammaRay': 'GR',
      'BulkDensity': 'RHOB',
      'NeutronPorosity': 'NPHI',
      'Resistivity': 'RT',
      'Depth': 'DEPT'
    };
    
    const curves: any = {};
    
    // Extract and map curves
    if (osduRecord.logData) {
      Object.keys(osduRecord.logData).forEach(osduName => {
        const standardName = curveMapping[osduName] || osduName;
        curves[standardName] = osduRecord.logData[osduName];
      });
    }
    
    // Normalize null values to -999.25
    Object.keys(curves).forEach(key => {
      curves[key] = curves[key].map((v: any) => 
        (v === null || v === undefined || v === -9999) ? -999.25 : v
      );
    });
    
    return {
      wellName,
      source: 'OSDU',
      sourceMetadata: {
        recordId: osduRecord.id,
        dataPartition: this.dataPartition,
        sourceUrl: osduRecord.sourceUrl,
        lastUpdated: osduRecord.lastModified
      },
      curves,
      wellInfo: {
        location: osduRecord.location,
        operator: osduRecord.operator,
        field: osduRecord.field
      }
    };
  }
}
```


### 4. Data Source Registry

**Location**: `amplify/functions/agents/dataSourceAdapters/DataSourceRegistry.ts`

**Purpose**: Manage available data source adapters and route queries

**Implementation**:
```typescript
import { IDataSourceAdapter, WellData } from './IDataSourceAdapter';
import { S3DataSourceAdapter } from './S3DataSourceAdapter';
import { OSDUDataSourceAdapter } from './OSDUDataSourceAdapter';

export class DataSourceRegistry {
  private adapters: Map<string, IDataSourceAdapter>;
  private priorityOrder: string[];
  
  constructor() {
    this.adapters = new Map();
    this.priorityOrder = [];
  }
  
  registerAdapter(adapter: IDataSourceAdapter, priority: number = 0): void {
    this.adapters.set(adapter.name, adapter);
    
    // Insert in priority order (higher priority first)
    const index = this.priorityOrder.findIndex((name, i) => {
      const existingAdapter = this.adapters.get(name);
      return priority > (existingAdapter?.priority || 0);
    });
    
    if (index === -1) {
      this.priorityOrder.push(adapter.name);
    } else {
      this.priorityOrder.splice(index, 0, adapter.name);
    }
  }
  
  getAdapter(name: string): IDataSourceAdapter | undefined {
    return this.adapters.get(name);
  }
  
  getAllAdapters(): IDataSourceAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  getActiveAdapters(): IDataSourceAdapter[] {
    return this.getAllAdapters().filter(a => a.status === 'active');
  }
  
  async findAdapterForWell(wellName: string, selectedSources?: string[]): Promise<IDataSourceAdapter | null> {
    // Filter by selected sources if provided
    const adaptersToCheck = selectedSources
      ? selectedSources.map(name => this.adapters.get(name)).filter(Boolean) as IDataSourceAdapter[]
      : this.getActiveAdapters();
    
    // Check adapters in priority order
    for (const adapterName of this.priorityOrder) {
      const adapter = this.adapters.get(adapterName);
      if (adapter && adaptersToCheck.includes(adapter) && adapter.canHandle(wellName)) {
        // Verify adapter is available
        if (await adapter.isAvailable()) {
          return adapter;
        }
      }
    }
    
    return null;
  }
  
  async getWellData(wellName: string, selectedSources?: string[]): Promise<WellData> {
    const adapter = await this.findAdapterForWell(wellName, selectedSources);
    
    if (!adapter) {
      const sourcesStr = selectedSources?.join(', ') || 'any source';
      throw new Error(`Well ${wellName} not found in ${sourcesStr}`);
    }
    
    console.log(`Using ${adapter.displayName} for well ${wellName}`);
    return await adapter.getWellInfo(wellName);
  }
  
  async listAllWells(selectedSources?: string[], filter?: string): Promise<{ source: string; wells: string[] }[]> {
    const adaptersToQuery = selectedSources
      ? selectedSources.map(name => this.adapters.get(name)).filter(Boolean) as IDataSourceAdapter[]
      : this.getActiveAdapters();
    
    const results = await Promise.all(
      adaptersToQuery.map(async adapter => ({
        source: adapter.displayName,
        wells: await adapter.listWells(filter)
      }))
    );
    
    return results;
  }
}

// Singleton instance
let registryInstance: DataSourceRegistry | null = null;

export function getDataSourceRegistry(): DataSourceRegistry {
  if (!registryInstance) {
    registryInstance = new DataSourceRegistry();
    
    // Register S3 adapter
    const s3Adapter = new S3DataSourceAdapter(
      process.env.S3_BUCKET || '',
      'global/well-data/'
    );
    registryInstance.registerAdapter(s3Adapter, 10); // High priority
    
    // Register OSDU adapter
    const osduAdapter = new OSDUDataSourceAdapter(
      process.env.OSDU_API_URL || '',
      process.env.OSDU_API_KEY || '',
      'osdu'
    );
    registryInstance.registerAdapter(osduAdapter, 5); // Medium priority
    
    // Future: Register TGS and VOLVE adapters when ready
  }
  
  return registryInstance;
}
```


### 5. Enhanced Strands Agent Integration

**Location**: `amplify/functions/agents/enhancedStrandsAgent.ts`

**Purpose**: Integrate data source registry into existing agent

**Changes Required**:
```typescript
import { getDataSourceRegistry } from './dataSourceAdapters/DataSourceRegistry';

export class EnhancedStrandsAgent extends BaseEnhancedAgent {
  private dataSourceRegistry: DataSourceRegistry;
  
  constructor(modelId?: string, s3Bucket?: string) {
    super(true);
    this.dataSourceRegistry = getDataSourceRegistry();
    // ... existing constructor code ...
  }
  
  async processMessage(message: string, selectedSources?: string[]): Promise<any> {
    // ... existing code ...
    
    // When handling well-specific queries, use registry
    const wellData = await this.dataSourceRegistry.getWellData(wellName, selectedSources);
    
    // wellData.source will be 'S3' or 'OSDU'
    // wellData.curves contains standardized curve data
    // Pass to existing MCP calculation engines (NO CHANGES to calculations)
    
    // ... rest of existing code ...
  }
  
  async handleListWells(selectedSources?: string[]): Promise<any> {
    const wellsBySource = await this.dataSourceRegistry.listAllWells(selectedSources);
    
    // Format response showing wells grouped by source
    const message = wellsBySource.map(({ source, wells }) => 
      `**${source}**: ${wells.length} wells\n${wells.join(', ')}`
    ).join('\n\n');
    
    return {
      success: true,
      message,
      artifacts: []
    };
  }
}
```

**CRITICAL**: All existing calculation handlers (handleCalculatePorosity, handleCalculateShale, etc.) remain UNCHANGED. They just receive WellData from the registry instead of directly from S3.


### 6. Frontend Data Source Selector Enhancement

**Location**: `src/app/catalog/page.tsx`

**Purpose**: Add multi-select to existing selector WITHOUT changing appearance

**CRITICAL CONSTRAINTS**:
- Preserve EXACT existing styling, dimensions, colors, fonts
- Only add multi-select functionality
- Do NOT modify any other UI elements

**Implementation**:
```typescript
// Find existing data source selector code
// Current: Single select with "Auto" option
// Change: Multi-select with "Select All Sources" option

// BEFORE (current code - DO NOT DELETE):
const [dataSource, setDataSource] = useState<string>('auto');

// AFTER (enhanced code):
const [selectedDataSources, setSelectedDataSources] = useState<string[]>(['s3', 'osdu']);

// Data source options
const dataSourceOptions = [
  { value: 'all', label: 'Select All Sources', type: 'action' },
  { value: 's3', label: 'S3 (Local Wells)', status: 'active' },
  { value: 'osdu', label: 'OSDU', status: 'active' },
  { value: 'tgs', label: 'TGS (In Development)', status: 'development', disabled: true },
  { value: 'volve', label: 'VOLVE (In Development)', status: 'development', disabled: true }
];

// Handler for multi-select
const handleDataSourceChange = (selected: string[]) => {
  if (selected.includes('all')) {
    // Select all active sources
    const activeSources = dataSourceOptions
      .filter(opt => opt.status === 'active' && opt.type !== 'action')
      .map(opt => opt.value);
    setSelectedDataSources(activeSources);
  } else {
    setSelectedDataSources(selected);
  }
};

// Pass selected sources to agent
const handleChatSearch = async (prompt: string) => {
  // ... existing code ...
  
  const response = await amplifyClient.queries.invokeAgent({
    message: prompt,
    selectedDataSources: selectedDataSources // NEW: Pass selected sources
  });
  
  // ... existing code ...
};
```

**UI Component** (using existing Cloudscape components):
```typescript
<Multiselect
  selectedOptions={selectedDataSources.map(value => ({
    value,
    label: dataSourceOptions.find(opt => opt.value === value)?.label || value
  }))}
  onChange={({ detail }) => handleDataSourceChange(detail.selectedOptions.map(opt => opt.value!))}
  options={dataSourceOptions.map(opt => ({
    value: opt.value,
    label: opt.label,
    disabled: opt.disabled,
    description: opt.status === 'development' ? 'Coming soon' : undefined
  }))}
  placeholder="Select data sources"
  // CRITICAL: Use EXACT same styling as current selector
  // Copy className, style props from existing selector
/>
```


### 7. Collection System Integration

**Location**: `src/utils/collectionInheritance.ts` and `amplify/functions/collectionService/handler.ts`

**Purpose**: Enable OSDU wells in collections

**Collection Data Model Enhancement**:
```typescript
interface CollectionWell {
  wellName: string;
  source: 'S3' | 'OSDU' | 'TGS' | 'VOLVE';
  sourceMetadata: {
    recordId?: string;
    dataPartition?: string;
    sourceUrl?: string;
    lastUpdated?: string;
  };
  // Cached well data (for offline access)
  cachedData?: {
    curves: any;
    wellInfo: any;
    cachedAt: string;
  };
}

interface Collection {
  id: string;
  name: string;
  wells: CollectionWell[];
  createdAt: string;
  updatedAt: string;
}
```

**Adding OSDU Wells to Collections**:
```typescript
// When petrophysics analysis is performed on OSDU well
async function addWellToCollection(wellData: WellData, collectionId?: string) {
  const collectionWell: CollectionWell = {
    wellName: wellData.wellName,
    source: wellData.source,
    sourceMetadata: wellData.sourceMetadata,
    cachedData: {
      curves: wellData.curves,
      wellInfo: wellData.wellInfo,
      cachedAt: new Date().toISOString()
    }
  };
  
  // Add to collection (existing collection service)
  await collectionService.addWell(collectionId, collectionWell);
}
```

**Loading Collections with OSDU Wells**:
```typescript
async function loadCollectionInCanvas(collectionId: string) {
  const collection = await collectionService.getCollection(collectionId);
  
  const wellDataPromises = collection.wells.map(async (well) => {
    // Check if cached data is fresh (< 24 hours)
    if (well.cachedData) {
      const cacheAge = Date.now() - new Date(well.cachedData.cachedAt).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        console.log(`Using cached data for ${well.wellName}`);
        return {
          ...well.cachedData,
          wellName: well.wellName,
          source: well.source
        };
      }
    }
    
    // Refresh from source
    console.log(`Refreshing ${well.wellName} from ${well.source}`);
    const registry = getDataSourceRegistry();
    return await registry.getWellData(well.wellName, [well.source.toLowerCase()]);
  });
  
  const wellData = await Promise.all(wellDataPromises);
  return wellData;
}
```


## Data Models

### WellData (Unified Format)
```typescript
interface WellData {
  wellName: string;
  source: 'S3' | 'OSDU' | 'TGS' | 'VOLVE';
  sourceMetadata: {
    recordId?: string;
    dataPartition?: string;
    sourceUrl?: string;
    lastUpdated?: string;
  };
  curves: {
    DEPT: number[];
    GR?: number[];
    RHOB?: number[];
    NPHI?: number[];
    RT?: number[];
    [key: string]: number[] | undefined;
  };
  wellInfo: {
    location?: { latitude: number; longitude: number };
    operator?: string;
    field?: string;
    [key: string]: any;
  };
}
```

### Data Source Configuration
```typescript
interface DataSourceConfig {
  name: string;
  displayName: string;
  status: 'active' | 'development';
  priority: number;
  config: {
    [key: string]: any;
  };
}
```

## Error Handling

### Data Source Unavailable
```typescript
try {
  const wellData = await registry.getWellData(wellName, selectedSources);
} catch (error) {
  if (error.message.includes('not found')) {
    return {
      success: false,
      message: `Well ${wellName} not found in selected data sources (${selectedSources.join(', ')}). Please verify the well name or try different sources.`
    };
  }
  
  if (error.message.includes('unavailable')) {
    return {
      success: false,
      message: `Data source is currently unavailable. Please try again later or select different sources.`
    };
  }
  
  throw error;
}
```

### Missing Required Curves
```typescript
function validateRequiredCurves(wellData: WellData, required: string[]): string[] {
  const missing = required.filter(curve => !wellData.curves[curve]);
  return missing;
}

// Usage
const missing = validateRequiredCurves(wellData, ['GR', 'RHOB', 'NPHI']);
if (missing.length > 0) {
  return {
    success: false,
    message: `Well ${wellData.wellName} from ${wellData.source} is missing required curves: ${missing.join(', ')}. Cannot perform porosity analysis.`
  };
}
```

### OSDU API Errors
```typescript
async callOSDUAPI(params: any): Promise<any> {
  try {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('OSDU API rate limit exceeded. Please try again in a few minutes.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('OSDU API authentication failed. Please check configuration.');
      }
      throw new Error(`OSDU API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to reach OSDU API. Please check network connection.');
    }
    throw error;
  }
}
```


## Testing Strategy

### Unit Tests

**Test 1: Data Source Adapter Interface**
```typescript
describe('S3DataSourceAdapter', () => {
  it('should handle S3 well names', () => {
    const adapter = new S3DataSourceAdapter('bucket', 'prefix/');
    expect(adapter.canHandle('WELL-001')).toBe(true);
    expect(adapter.canHandle('MAR-3')).toBe(false);
  });
  
  it('should list wells from S3', async () => {
    const adapter = new S3DataSourceAdapter('bucket', 'prefix/');
    const wells = await adapter.listWells();
    expect(wells).toContain('WELL-001');
  });
});

describe('OSDUDataSourceAdapter', () => {
  it('should handle non-S3 well names', () => {
    const adapter = new OSDUDataSourceAdapter('url', 'key', 'partition');
    expect(adapter.canHandle('MAR-3')).toBe(true);
    expect(adapter.canHandle('WELL-001')).toBe(false);
  });
  
  it('should cache OSDU data', async () => {
    const adapter = new OSDUDataSourceAdapter('url', 'key', 'partition');
    const data1 = await adapter.getWellInfo('MAR-3');
    const data2 = await adapter.getWellInfo('MAR-3');
    // Second call should use cache (verify with spy)
  });
});
```

**Test 2: Data Source Registry**
```typescript
describe('DataSourceRegistry', () => {
  it('should find correct adapter for well', async () => {
    const registry = getDataSourceRegistry();
    const adapter = await registry.findAdapterForWell('WELL-001');
    expect(adapter?.name).toBe('s3');
    
    const osduAdapter = await registry.findAdapterForWell('MAR-3');
    expect(osduAdapter?.name).toBe('osdu');
  });
  
  it('should respect selected sources', async () => {
    const registry = getDataSourceRegistry();
    const adapter = await registry.findAdapterForWell('MAR-3', ['s3']);
    expect(adapter).toBeNull(); // MAR-3 not in S3
  });
});
```

### Integration Tests

**Test 1: End-to-End OSDU Analysis**
```bash
# tests/test-osdu-petrophysics-integration.js
node tests/test-osdu-petrophysics-integration.js
```

**Test 2: Mixed-Source Collection**
```typescript
describe('Mixed-Source Collections', () => {
  it('should create collection with S3 and OSDU wells', async () => {
    const collection = await createCollection({
      name: 'Mixed Test',
      wells: [
        { wellName: 'WELL-001', source: 'S3' },
        { wellName: 'MAR-3', source: 'OSDU' }
      ]
    });
    
    expect(collection.wells).toHaveLength(2);
    expect(collection.wells[0].source).toBe('S3');
    expect(collection.wells[1].source).toBe('OSDU');
  });
  
  it('should load mixed collection in canvas', async () => {
    const wellData = await loadCollectionInCanvas(collectionId);
    expect(wellData).toHaveLength(2);
    expect(wellData[0].source).toBe('S3');
    expect(wellData[1].source).toBe('OSDU');
  });
});
```

### Manual Testing

**Test Cases**:
1. Query S3 well (WELL-001) → Should use S3 adapter
2. Query OSDU well (MAR-3) → Should use OSDU adapter
3. Select only S3 source, query MAR-3 → Should show "not found in S3"
4. Select only OSDU source, query WELL-001 → Should show "not found in OSDU"
5. Select both sources, query any well → Should find in appropriate source
6. Create collection with OSDU well → Should save with source metadata
7. Load collection with OSDU well → Should retrieve from cache or refresh
8. Perform porosity calculation on OSDU well → Should work same as S3


## Deployment Considerations

### Environment Variables

**Development** (`.env.local`):
```bash
# S3 Configuration (existing)
S3_BUCKET=amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m

# OSDU Configuration (new)
OSDU_API_URL=https://mye6os9wfa.execute-api.us-east-1.amazonaws.com/prod/search
OSDU_API_KEY=<your-osdu-api-key>
OSDU_DATA_PARTITION=osdu

# Future: TGS and VOLVE configurations
# TGS_API_URL=...
# VOLVE_API_URL=...
```

**Production**:
- Set via AWS Lambda environment variables
- OSDU_API_KEY must be set securely (never commit to git)

### Deployment Steps

1. **Create Data Source Adapter Files**:
   ```bash
   mkdir -p amplify/functions/agents/dataSourceAdapters
   # Create IDataSourceAdapter.ts
   # Create S3DataSourceAdapter.ts
   # Create OSDUDataSourceAdapter.ts
   # Create DataSourceRegistry.ts
   ```

2. **Update Enhanced Strands Agent**:
   ```bash
   # Modify amplify/functions/agents/enhancedStrandsAgent.ts
   # Add data source registry integration
   # Update processMessage to accept selectedSources parameter
   ```

3. **Update Frontend Selector**:
   ```bash
   # Modify src/app/catalog/page.tsx
   # Change single select to multi-select
   # Add data source options
   # Pass selectedSources to agent
   ```

4. **Update Collection System**:
   ```bash
   # Modify src/utils/collectionInheritance.ts
   # Update CollectionWell interface
   # Add source metadata handling
   ```

5. **Deploy to Sandbox**:
   ```bash
   npx ampx sandbox
   ```

6. **Set Environment Variables**:
   ```bash
   # Via AWS Lambda console or CLI
   aws lambda update-function-configuration \
     --function-name <agent-function-name> \
     --environment Variables={OSDU_API_KEY=<key>}
   ```

7. **Test Integration**:
   ```bash
   node tests/test-osdu-petrophysics-integration.js
   ```

### Rollback Plan

If issues occur:
1. Revert frontend selector changes (restore single select)
2. Remove data source registry from agent
3. Agent falls back to direct S3 access (existing code path)
4. Redeploy: `npx ampx sandbox`
5. All S3 functionality remains intact


## Security Considerations

### API Key Management

**OSDU API Key**:
- Stored in Lambda environment variables only
- Never exposed to frontend
- Never logged in console or CloudWatch
- Never committed to version control
- Sanitized from error messages

**Access Control**:
- Data source adapters run server-side only
- Frontend cannot directly access OSDU API
- All OSDU requests proxied through Lambda
- User authentication required for all queries

### Data Privacy

**Caching**:
- OSDU data cached for 15 minutes in Lambda memory
- Cache cleared on Lambda cold start
- No persistent storage of OSDU data (except in collections)
- Collection data encrypted at rest in DynamoDB

**Audit Trail**:
- Log all data source access
- Log which user accessed which wells
- Log data source selection for each query
- CloudWatch logs for debugging (no sensitive data)

## Performance Optimization

### Caching Strategy

**OSDU Data Caching**:
- In-memory cache in Lambda (15 minute TTL)
- Collection-level cache (24 hour TTL)
- Cache invalidation on explicit refresh

**S3 Data Caching**:
- No caching needed (S3 is fast and reliable)
- Existing MCP server handles S3 access

### API Rate Limiting

**OSDU API**:
- Implement exponential backoff on failures
- Queue requests if rate limit approached
- Cache aggressively to reduce API calls
- Monitor API usage in CloudWatch

**Optimization Techniques**:
- Batch well queries when possible
- Prefetch common wells
- Use cached data for repeated queries
- Lazy load well data in collections

## Future Enhancements

### Phase 2: TGS Integration
- Implement TGSDataSourceAdapter
- Add TGS API configuration
- Update selector to enable TGS
- Test with TGS data

### Phase 3: VOLVE Integration
- Implement VOLVEDataSourceAdapter
- Add VOLVE API configuration
- Update selector to enable VOLVE
- Test with VOLVE data

### Phase 4: Advanced Features
- Cross-source well correlation
- Data source performance metrics
- Intelligent source selection (ML-based)
- Hybrid queries (combine multiple sources)
- Real-time data source health monitoring

## Success Metrics

### Functional Metrics
- All S3 wells continue working (100% backward compatibility)
- OSDU wells accessible and analyzable
- Mixed-source collections work correctly
- Data source selector functions properly

### Performance Metrics
- OSDU query response time < 3 seconds
- Cache hit rate > 70%
- API error rate < 1%
- No regressions in S3 query performance

### User Experience Metrics
- Clear data source attribution in results
- Helpful error messages for data source issues
- Smooth transition between sources
- No confusion about which source is being used


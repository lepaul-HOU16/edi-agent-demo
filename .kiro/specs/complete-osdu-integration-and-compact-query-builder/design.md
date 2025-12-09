# Design Document

## Overview

This design completes the OSDU integration with real credentials and redesigns the query builder to be **compact, sticky, and performant**. The current query builder is 1971 lines and takes up too much screen space. The new design will be:

- **Compact**: Maximum 400px height, scrollable criteria list
- **Sticky**: Remains at top when scrolling with high z-index
- **Fast**: Debounced updates, optimized rendering
- **Simple**: Essential controls visible, advanced options collapsed

## Architecture

### Current (Broken) State

```
┌─────────────────────────────────────────┐
│  OSDU Lambda                            │
│  ├─ Demo data (50 fake wells)          │
│  ├─ No real API integration            │
│  └─ No authentication                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Query Builder (1971 lines!)           │
│  ├─ Takes up entire screen             │
│  ├─ Scrolls away when viewing results  │
│  ├─ Too many options visible           │
│  └─ Slow with many criteria            │
└─────────────────────────────────────────┘
```

### New (Fixed) State

```
┌─────────────────────────────────────────┐
│  OSDU Lambda                            │
│  ├─ Amazon Federate OAuth2             │
│  ├─ Real EDI Platform API              │
│  ├─ Token management & caching         │
│  └─ Real well data with coordinates    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Compact Query Builder (~500 lines)    │
│  ├─ Max 400px height, sticky           │
│  ├─ Scrollable criteria (if many)      │
│  ├─ Collapsed advanced options         │
│  ├─ High z-index (stays on top)        │
│  └─ Debounced updates (fast)           │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. OSDU OAuth2 Client (New)

**Location**: `cdk/lambda-functions/osdu/oauth2Client.ts`

```typescript
interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  authUrl: string;
}

interface OAuth2Token {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // Calculated expiry timestamp
}

class OSDUOAuth2Client {
  private config: OAuth2Config;
  private cachedToken: OAuth2Token | null = null;

  constructor(config: OAuth2Config) {
    this.config = config;
  }

  async getAccessToken(): Promise<string> {
    // Check if cached token is still valid (with 5 min buffer)
    if (this.cachedToken && this.cachedToken.expires_at > Date.now() + 300000) {
      return this.cachedToken.access_token;
    }

    // Request new token
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error(`OAuth2 token request failed: ${response.status}`);
    }

    const tokenData = await response.json();
    this.cachedToken = {
      ...tokenData,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };

    return this.cachedToken.access_token;
  }
}
```

### 2. EDI Platform API Client (New)

**Location**: `cdk/lambda-functions/osdu/ediPlatformClient.ts`

```typescript
interface EDISearchRequest {
  kind: string;
  query?: string;
  limit?: number;
  offset?: number;
  returnedFields?: string[];
  sort?: {
    field: string[];
    order: string[];
  };
}

interface EDISearchResponse {
  results: any[];
  totalCount: number;
}

class EDIPlatformClient {
  private baseUrl: string;
  private oauth2Client: OSDUOAuth2Client;

  constructor(baseUrl: string, oauth2Client: OSDUOAuth2Client) {
    this.baseUrl = baseUrl;
    this.oauth2Client = oauth2Client;
  }

  async search(request: EDISearchRequest): Promise<EDISearchResponse> {
    const accessToken = await this.oauth2Client.getAccessToken();

    const response = await fetch(`${this.baseUrl}/api/search/v2/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'data-partition-id': 'osdu' // Required by OSDU
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`EDI Platform API error: ${response.status}`);
    }

    return await response.json();
  }
}
```

### 3. Updated OSDU Lambda Handler

**Location**: `cdk/lambda-functions/osdu/handler.ts`

**Changes**:
- Remove demo data generation
- Initialize OAuth2 client with credentials from Secrets Manager
- Call real EDI Platform API
- Transform EDI response to frontend format
- Handle authentication errors gracefully

```typescript
import { OSDUOAuth2Client } from './oauth2Client';
import { EDIPlatformClient } from './ediPlatformClient';
import { getSecret } from '../shared/secretsManager';

let oauth2Client: OSDUOAuth2Client | null = null;
let ediClient: EDIPlatformClient | null = null;

async function initializeClients() {
  if (oauth2Client && ediClient) {
    return { oauth2Client, ediClient };
  }

  // Get credentials from Secrets Manager
  const credentials = await getSecret('osdu-credentials');
  
  oauth2Client = new OSDUOAuth2Client({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    tokenUrl: credentials.tokenUrl,
    authUrl: credentials.authUrl
  });

  ediClient = new EDIPlatformClient(
    credentials.platformUrl,
    oauth2Client
  );

  return { oauth2Client, ediClient };
}

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const { ediClient } = await initializeClients();
    
    const body = JSON.parse(event.body || '{}');
    const { query, maxResults = 1000 } = body;

    // Call real EDI Platform API
    const response = await ediClient.search({
      kind: '*:*:*master-data--Well:*',
      query: query,
      limit: maxResults,
      returnedFields: [
        'id',
        'data.FacilityName',
        'data.SpatialLocation.Wgs84Coordinates',
        'data.VerticalMeasurement.Depth',
        'data.operator',
        'data.country',
        'data.basin'
      ]
    });

    // Transform to frontend format
    const records = response.results.map(transformWellRecord);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer: `Found ${records.length} wells in OSDU`,
        recordCount: records.length,
        records: records
      })
    };

  } catch (error) {
    console.error('OSDU API error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'OSDU search failed',
        answer: 'Unable to search OSDU data. Please check credentials and try again.',
        recordCount: 0,
        records: []
      })
    };
  }
};
```

### 4. Compact Query Builder Component (Redesigned)

**Location**: `src/components/CompactOSDUQueryBuilder.tsx`

**Key Design Principles**:
- Maximum 400px height
- Sticky positioning with high z-index
- Scrollable criteria list
- Collapsed advanced options
- Inline compact forms
- Debounced query preview updates

```typescript
interface CompactQueryBuilderProps {
  onExecute: (query: string, criteria: QueryCriterion[]) => void;
  onClose: () => void;
  isSticky?: boolean; // Whether to use sticky positioning
}

export const CompactOSDUQueryBuilder: React.FC<CompactQueryBuilderProps> = ({
  onExecute,
  onClose,
  isSticky = true
}) => {
  const [dataType, setDataType] = useState('well');
  const [criteria, setCriteria] = useState<QueryCriterion[]>([]);
  const [queryPreview, setQueryPreview] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounced query preview update (300ms delay)
  const debouncedUpdatePreview = useMemo(
    () => debounce((criteria: QueryCriterion[]) => {
      const query = generateOSDUQuery(criteria);
      setQueryPreview(query);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedUpdatePreview(criteria);
  }, [criteria, debouncedUpdatePreview]);

  return (
    <div
      style={{
        position: isSticky ? 'sticky' : 'relative',
        top: isSticky ? 0 : 'auto',
        zIndex: isSticky ? 1400 : 'auto',
        maxHeight: '400px',
        backgroundColor: 'white',
        boxShadow: isSticky ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    >
      <Container
        header={
          <Header
            variant="h3"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setShowAdvanced(!showAdvanced)} iconName="settings">
                  Advanced
                </Button>
                <Button onClick={onClose} iconName="close" variant="icon" />
              </SpaceBetween>
            }
          >
            OSDU Query Builder
          </Header>
        }
      >
        <SpaceBetween size="s">
          {/* Data Type Selector - Compact inline */}
          <FormField label="Data Type">
            <Select
              selectedOption={{ label: dataType, value: dataType }}
              onChange={({ detail }) => setDataType(detail.selectedOption.value!)}
              options={[
                { label: 'Well', value: 'well' },
                { label: 'Wellbore', value: 'wellbore' },
                { label: 'Log', value: 'log' },
                { label: 'Seismic', value: 'seismic' }
              ]}
            />
          </FormField>

          {/* Criteria List - Scrollable if many */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <SpaceBetween size="xs">
              {criteria.map((criterion, index) => (
                <CompactCriterionRow
                  key={criterion.id}
                  criterion={criterion}
                  index={index}
                  onUpdate={(updates) => updateCriterion(criterion.id, updates)}
                  onRemove={() => removeCriterion(criterion.id)}
                  dataType={dataType}
                />
              ))}
            </SpaceBetween>
          </div>

          {/* Add Criterion Button */}
          <Button onClick={addCriterion} iconName="add-plus">
            Add Filter
          </Button>

          {/* Query Preview - Compact */}
          <ExpandableSection headerText="Query Preview" variant="footer">
            <Box padding="s">
              <code style={{ fontSize: '12px', display: 'block', whiteSpace: 'pre-wrap' }}>
                {queryPreview}
              </code>
            </Box>
          </ExpandableSection>

          {/* Advanced Options - Collapsed by default */}
          {showAdvanced && (
            <ExpandableSection headerText="Advanced Options">
              <SpaceBetween size="s">
                <FormField label="Max Results">
                  <Input type="number" value="1000" />
                </FormField>
                <FormField label="Sort By">
                  <Select options={[{ label: 'Relevance', value: 'relevance' }]} />
                </FormField>
              </SpaceBetween>
            </ExpandableSection>
          )}

          {/* Execute Button */}
          <Button variant="primary" onClick={() => onExecute(queryPreview, criteria)}>
            Execute Query
          </Button>
        </SpaceBetween>
      </Container>
    </div>
  );
};
```

### 5. Compact Criterion Row Component

**Location**: `src/components/CompactCriterionRow.tsx`

```typescript
interface CompactCriterionRowProps {
  criterion: QueryCriterion;
  index: number;
  onUpdate: (updates: Partial<QueryCriterion>) => void;
  onRemove: () => void;
  dataType: string;
}

export const CompactCriterionRow: React.FC<CompactCriterionRowProps> = ({
  criterion,
  index,
  onUpdate,
  onRemove,
  dataType
}) => {
  return (
    <Grid gridDefinition={[
      { colspan: 4 }, // Field
      { colspan: 3 }, // Operator
      { colspan: 4 }, // Value
      { colspan: 1 }  // Remove button
    ]}>
      {/* Field Selector */}
      <Select
        selectedOption={{ label: criterion.field, value: criterion.field }}
        onChange={({ detail }) => onUpdate({ field: detail.selectedOption.value! })}
        options={getFieldOptions(dataType)}
        placeholder="Select field"
      />

      {/* Operator Selector */}
      <Select
        selectedOption={{ label: criterion.operator, value: criterion.operator }}
        onChange={({ detail }) => onUpdate({ operator: detail.selectedOption.value! })}
        options={getOperatorOptions(criterion.fieldType)}
        placeholder="Operator"
      />

      {/* Value Input */}
      <Input
        value={String(criterion.value)}
        onChange={({ detail }) => onUpdate({ value: detail.value })}
        placeholder="Value"
        invalid={!criterion.isValid}
      />

      {/* Remove Button */}
      <Button
        onClick={onRemove}
        iconName="remove"
        variant="icon"
      />
    </Grid>
  );
};
```

### 6. Query Builder Mock-up Page

**Location**: `src/pages/OSDUQueryBuilderMockup.tsx`

This page will demonstrate:
- Compact design (400px max height)
- Sticky behavior on scroll
- Before/after comparison
- Responsive behavior
- Design annotations

```typescript
export default function OSDUQueryBuilderMockup() {
  const [showOld, setShowOld] = useState(false);
  const [isSticky, setIsSticky] = useState(true);

  return (
    <div style={{ padding: '20px' }}>
      <SpaceBetween size="l">
        {/* Header */}
        <Header variant="h1">
          OSDU Query Builder Redesign
        </Header>

        {/* Toggle Controls */}
        <SpaceBetween direction="horizontal" size="s">
          <Toggle
            checked={showOld}
            onChange={({ detail }) => setShowOld(detail.checked)}
          >
            Show Old Design
          </Toggle>
          <Toggle
            checked={isSticky}
            onChange={({ detail }) => setIsSticky(detail.checked)}
          >
            Enable Sticky
          </Toggle>
        </SpaceBetween>

        {/* Design Comparison */}
        <Grid gridDefinition={[{ colspan: showOld ? 6 : 12 }, { colspan: 6 }]}>
          {/* New Design */}
          <Container header={<Header variant="h2">New Design (Compact)</Header>}>
            <CompactOSDUQueryBuilder
              onExecute={() => {}}
              onClose={() => {}}
              isSticky={isSticky}
            />
            <Box margin={{ top: 'm' }}>
              <Alert type="success">
                <strong>Improvements:</strong>
                <ul>
                  <li>Max 400px height (vs 800px+)</li>
                  <li>Sticky positioning with high z-index</li>
                  <li>Scrollable criteria list</li>
                  <li>Collapsed advanced options</li>
                  <li>Debounced updates (300ms)</li>
                  <li>~500 lines (vs 1971 lines)</li>
                </ul>
              </Alert>
            </Box>
          </Container>

          {/* Old Design (if toggled) */}
          {showOld && (
            <Container header={<Header variant="h2">Old Design (Large)</Header>}>
              <OSDUQueryBuilder
                onExecute={() => {}}
                onClose={() => {}}
              />
              <Box margin={{ top: 'm' }}>
                <Alert type="warning">
                  <strong>Issues:</strong>
                  <ul>
                    <li>Takes up entire screen</li>
                    <li>Scrolls away with results</li>
                    <li>Too many visible options</li>
                    <li>Slow with many criteria</li>
                    <li>1971 lines of code</li>
                  </ul>
                </Alert>
              </Box>
            </Container>
          )}
        </Grid>

        {/* Scroll Demo Content */}
        <Container header={<Header variant="h2">Scroll to Test Sticky Behavior</Header>}>
          <Box padding="xxl">
            {Array.from({ length: 20 }).map((_, i) => (
              <Box key={i} padding="m" margin={{ bottom: 's' }} backgroundColor="grey-100">
                Sample search result {i + 1} - Scroll down to see query builder stay at top
              </Box>
            ))}
          </Box>
        </Container>
      </SpaceBetween>
    </div>
  );
}
```

## Data Models

### OAuth2 Credentials (Secrets Manager)

```json
{
  "clientId": "vavourak-qs-ac-fed",
  "clientSecret": "S6miKKOEIRy4WdsKKpg696jlhevQ0yow0TNgIg3GVE7YA",
  "tokenUrl": "https://idp-integ.federate.amazon.com/api/oauth2/v2/token",
  "authUrl": "https://idp-integ.federate.amazon.com/api/oauth2/v1/authorize",
  "platformUrl": "https://edi-platform.example.com"
}
```

### EDI Platform Search Request

```json
{
  "kind": "*:*:*master-data--Well:*",
  "query": "data.operator = \"Shell\" AND data.depth > 3000",
  "limit": 1000,
  "offset": 0,
  "returnedFields": [
    "id",
    "data.FacilityName",
    "data.SpatialLocation.Wgs84Coordinates",
    "data.VerticalMeasurement.Depth"
  ],
  "sort": {
    "field": ["id"],
    "order": ["DESC"]
  }
}
```

### EDI Platform Search Response

```json
{
  "results": [
    {
      "id": "osdu:master-data--Well:12345",
      "data": {
        "FacilityName": "WELL-001",
        "SpatialLocation": {
          "Wgs84Coordinates": {
            "Latitude": 60.123,
            "Longitude": 5.456
          }
        },
        "VerticalMeasurement": {
          "Depth": {
            "Value": 3500,
            "UOM": "m"
          }
        },
        "operator": "Shell",
        "country": "Norway",
        "basin": "North Sea"
      }
    }
  ],
  "totalCount": 1
}
```

## Error Handling

### OAuth2 Authentication Errors

**When**: Token request fails

**Response**:
```json
{
  "statusCode": 401,
  "body": {
    "error": "Authentication failed",
    "answer": "Unable to authenticate with OSDU. Please check credentials in AWS Secrets Manager.",
    "troubleshooting": [
      "Verify client ID and secret are correct",
      "Check token URL is accessible",
      "Ensure credentials haven't expired"
    ]
  }
}
```

### API Request Errors

**When**: EDI Platform API returns error

**Response**:
```json
{
  "statusCode": 502,
  "body": {
    "error": "EDI Platform API error",
    "answer": "Unable to search OSDU data. The EDI Platform returned an error.",
    "details": "HTTP 500: Internal Server Error"
  }
}
```

## Testing Strategy

### Unit Tests

- Test OAuth2 token request and caching
- Test token expiry and refresh logic
- Test EDI Platform API client
- Test query builder compact rendering
- Test sticky positioning behavior
- Test debounced query preview updates

### Integration Tests

- Test end-to-end OSDU search with real credentials
- Test query builder execution flow
- Test sticky behavior on scroll
- Test responsive behavior on mobile
- Test error handling for auth failures

### Manual Testing

- Configure credentials in Secrets Manager
- Execute OSDU queries and verify real data
- Test query builder sticky behavior
- Test on different screen sizes
- Verify performance with many criteria

## Implementation Notes

### Credentials Storage

Store OSDU credentials in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name osdu-credentials \
  --secret-string '{
    "clientId": "vavourak-qs-ac-fed",
    "clientSecret": "S6miKKOEIRy4WdsKKpg696jlhevQ0yow0TNgIg3GVE7YA",
    "tokenUrl": "https://idp-integ.federate.amazon.com/api/oauth2/v2/token",
    "authUrl": "https://idp-integ.federate.amazon.com/api/oauth2/v1/authorize",
    "platformUrl": "https://edi-platform.example.com"
  }'
```

### Sticky Positioning CSS

```css
.compact-query-builder {
  position: sticky;
  top: 0;
  z-index: 1400; /* Higher than chat messages (1300) */
  max-height: 400px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  transition: box-shadow 0.2s ease;
}

.compact-query-builder:not(.is-sticky) {
  box-shadow: none;
}

.criteria-list {
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
}
```

### Performance Optimizations

1. **Debounced Query Preview**: Update preview 300ms after last change
2. **Memoized Components**: Use React.memo for criterion rows
3. **Virtual Scrolling**: If >20 criteria, use virtual scrolling
4. **Lazy Loading**: Load autocomplete data on demand
5. **Token Caching**: Cache OAuth2 tokens to minimize requests

### Size Comparison

| Metric | Old Query Builder | New Compact Builder |
|--------|------------------|---------------------|
| Lines of Code | 1971 | ~500 |
| Max Height | 800px+ | 400px |
| Sticky | No | Yes |
| Z-index | 1300 | 1400 |
| Advanced Options | Always visible | Collapsed |
| Query Preview Update | Immediate | Debounced (300ms) |
| Mobile Optimized | No | Yes |

## Migration Path

1. Create new `CompactOSDUQueryBuilder` component
2. Add OAuth2 client and EDI Platform client
3. Store credentials in Secrets Manager
4. Update OSDU Lambda to use real API
5. Create mock-up page for design review
6. Replace old query builder with compact version
7. Test with real OSDU data
8. Deploy and monitor performance

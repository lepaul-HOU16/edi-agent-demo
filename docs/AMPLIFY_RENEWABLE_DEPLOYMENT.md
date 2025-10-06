# Amplify Renewable Energy Backend - Deployment Guide

## ✅ What Was Created

I've integrated renewable energy tools into your existing Amplify backend:

### 1. Lambda Function
**Location:** `amplify/functions/renewableTools/`

**Features:**
- `getWindConditions` - Fetch wind data from NREL API
- `calculateEnergyProduction` - Calculate wind farm energy output

### 2. Client Service
**Location:** `src/services/renewableEnergyService.ts`

**Exports:**
- `RenewableEnergyService` - Service class
- `useWindData()` - React hook for wind data
- `useEnergyProduction()` - React hook for energy calculations

### 3. API Routes
**Location:** `src/app/api/renewable/`

- `/api/renewable/wind-data` - Wind data endpoint
- `/api/renewable/energy-production` - Energy production endpoint

## 🚀 Deployment Steps

### Step 1: Install Dependencies

```bash
# Install Lambda dependencies
cd amplify/functions/renewableTools
npm install
cd ../../..

# Install API route dependencies (if needed)
npm install @aws-sdk/client-lambda
```

### Step 2: Deploy to Amplify

```bash
# Deploy your Amplify backend
npx amplify push

# Or if using Amplify Gen 2
npx ampx sandbox
```

### Step 3: Set Environment Variables

Add to your `.env.local`:

```bash
# Renewable Tools Lambda Function Name
RENEWABLE_TOOLS_FUNCTION_NAME=renewableTools-<your-env-id>

# AWS Region
AWS_REGION=us-east-1

# NREL API Key (optional, defaults to DEMO_KEY)
NREL_API_KEY=your_nrel_api_key_here
```

To get a free NREL API key:
1. Visit https://developer.nrel.gov/signup/
2. Sign up for a free account
3. Copy your API key

## 📖 Usage Examples

### In Your React Components

```typescript
import { useWindData, useEnergyProduction } from '@/services/renewableEnergyService';

export default function RenewableAnalysis() {
  const { data: windData, loading, error, fetchWindData } = useWindData();
  const { data: production, calculateProduction } = useEnergyProduction();
  
  const handleAnalyze = async () => {
    // Get wind data
    await fetchWindData({
      latitude: 30.25,
      longitude: -97.74,
      year: 2019
    });
    
    // Calculate energy production
    await calculateProduction({
      latitude: 30.25,
      longitude: -97.74,
      turbineCount: 10,
      turbineCapacity: 3.0 // MW
    });
  };
  
  return (
    <div>
      <button onClick={handleAnalyze} disabled={loading}>
        Analyze Wind Farm
      </button>
      
      {windData && (
        <div>
          <h3>Wind Conditions</h3>
          <p>Mean Wind Speed: {windData.summary.meanWindSpeed} m/s</p>
          <p>Max Wind Speed: {windData.summary.maxWindSpeed} m/s</p>
        </div>
      )}
      
      {production && (
        <div>
          <h3>Energy Production</h3>
          <p>Annual Production: {production.energyProduction.annualGWh} GWh</p>
          <p>Capacity Factor: {production.windConditions.capacityFactor}</p>
        </div>
      )}
    </div>
  );
}
```

### Direct Service Usage

```typescript
import { RenewableEnergyService } from '@/services/renewableEnergyService';

// Get wind data
const windData = await RenewableEnergyService.getWindConditions({
  latitude: 30.25,
  longitude: -97.74,
  year: 2019
});

console.log('Mean wind speed:', windData.summary.meanWindSpeed);

// Calculate energy production
const production = await RenewableEnergyService.calculateEnergyProduction({
  latitude: 30.25,
  longitude: -97.74,
  turbineCount: 10,
  turbineCapacity: 3.0
});

console.log('Annual production:', production.energyProduction.annualGWh, 'GWh');
```

## 🔧 Configuration

### Lambda Function Settings

Edit `amplify/functions/renewableTools/resource.ts`:

```typescript
export const renewableTools = defineFunction({
  name: 'renewableTools',
  entry: './handler.ts',
  timeoutSeconds: 60,      // Adjust timeout
  memoryMB: 512,           // Adjust memory
  environment: {
    NREL_API_KEY: process.env.NREL_API_KEY || 'DEMO_KEY',
  },
});
```

### Add More Tools

Edit `amplify/functions/renewableTools/handler.ts` and add new functions:

```typescript
async function newTool(params: any): Promise<any> {
  // Your implementation
}

// Add to handler switch statement
case 'newTool':
  result = await newTool(params);
  break;
```

## ✅ Testing

### Test Wind Data

```bash
curl -X POST http://localhost:3000/api/renewable/wind-data \
  -H "Content-Type: application/json" \
  -d '{
    "action": "getWindConditions",
    "params": {
      "latitude": 30.25,
      "longitude": -97.74
    }
  }'
```

### Test Energy Production

```bash
curl -X POST http://localhost:3000/api/renewable/energy-production \
  -H "Content-Type: application/json" \
  -d '{
    "action": "calculateEnergyProduction",
    "params": {
      "latitude": 30.25,
      "longitude": -97.74,
      "turbineCount": 10,
      "turbineCapacity": 3.0
    }
  }'
```

## 📊 What You Get

### Wind Data Response

```json
{
  "location": { "latitude": 30.25, "longitude": -97.74 },
  "year": 2019,
  "summary": {
    "meanWindSpeed": "6.5",
    "maxWindSpeed": "18.2",
    "minWindSpeed": "0.3",
    "totalHours": 8760,
    "dataQuality": "good"
  }
}
```

### Energy Production Response

```json
{
  "location": { "latitude": 30.25, "longitude": -97.74 },
  "windFarm": {
    "turbineCount": 10,
    "turbineCapacity": 3.0,
    "totalCapacity": 30
  },
  "windConditions": {
    "meanWindSpeed": "6.5",
    "capacityFactor": "30.0%"
  },
  "energyProduction": {
    "annualMWh": "78840",
    "annualGWh": "78.84",
    "monthlyAverageMWh": "6570"
  }
}
```

## 🎯 Next Steps

1. **Deploy:** Run `npx amplify push`
2. **Test:** Use the examples above
3. **Integrate:** Add to your UI components
4. **Extend:** Add more renewable energy tools as needed

## 🆘 Troubleshooting

### Lambda Function Not Found

Check the function name after deployment:
```bash
aws lambda list-functions | grep renewableTools
```

Update `.env.local` with the correct function name.

### NREL API Rate Limits

The DEMO_KEY has rate limits. Get a free API key from https://developer.nrel.gov/signup/

### CORS Issues

If you get CORS errors, the API routes handle this automatically. Make sure you're calling from the same domain.

## ✅ Success!

You now have a fully integrated renewable energy backend in your Amplify project! 🎉

The Lambda function is part of your Amplify deployment and will be managed with `amplify push`.

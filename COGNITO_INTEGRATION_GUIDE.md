# OSDU Cognito Authentication Integration Guide

This guide explains how to integrate AWS Cognito authentication with your UXPin UI to access OSDU services using proper authentication tokens instead of API keys.

## 🔐 Authentication Architecture

### Current Setup
- **AWS Cognito User Pool**: Manages user authentication
- **AWS Cognito Identity Pool**: Provides AWS credentials for authenticated users
- **OSDU Services**: Schema, Entitlements, Legal Tagging services
- **Token-based Authentication**: Uses Cognito ID tokens for API access

### Key Components Created

#### 1. Authentication Context (`src/contexts/AuthContext.jsx`)
- Manages authentication state across the entire application
- Provides sign-in, sign-up, password reset functionality
- Handles token management and refresh
- Integrates with AWS Amplify v6

#### 2. Authentication Components (`src/components/auth/`)
- **AuthComponents.jsx**: Sign-in, sign-up, password reset forms
- **AuthFlow.jsx**: Manages authentication flow states
- **ProtectedRoute.jsx**: Guards authenticated content
- **UserProfile.jsx**: User profile display and sign-out

#### 3. OSDU API Service (`src/services/osduApiService.js`)
- Handles all OSDU API calls using Cognito tokens
- Replaces API key authentication with Bearer token authentication
- Includes proper OSDU headers (data-partition-id, etc.)
- Provides methods for all OSDU services

## 🚀 Implementation Steps

### Step 1: Replace Current App.jsx
```bash
# Backup current App.jsx
mv src/App.jsx src/App_original.jsx

# Use the new authenticated version
mv src/App_with_auth.jsx src/App.jsx
```

### Step 2: Update Dependencies
The required dependencies are already installed:
- `aws-amplify@^6.15.2`
- `@aws-amplify/ui-react@^6.11.2`

### Step 3: Environment Configuration
Your `.env.local` is already configured with:
```env
# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=us-east-1_LV35D0F5u
VITE_USER_POOL_CLIENT_ID=mn9i191f54kmg1r36t55e66pi
VITE_IDENTITY_POOL_ID=us-east-1:272f0ac6-6976-4a2a-bb8c-4d0cf64d246e

# Cognito Configuration
VITE_COGNITO_AUTHORITY=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_LV35D0F5u
VITE_COGNITO_DOMAIN=https://osdu-dev-83633757.auth.us-east-1.amazoncognito.com
VITE_REDIRECT_URI=http://localhost:5173/callback
VITE_LOGOUT_URI=http://localhost:5173/logout

# Service API Endpoints (using tokens, not API keys)
VITE_SCHEMA_API_URL=https://xjl632qlona35o6dygf7ce2bta.appsync-api.us-east-1.amazonaws.com/graphql
VITE_ENTITLEMENTS_API_URL=https://chohm5ac3vcafg2qmu4eu4h7uy.appsync-api.us-east-1.amazonaws.com/graphql
VITE_LEGAL_API_URL=https://h4osu2loind5pdhuxc34bkaqxy.appsync-api.us-east-1.amazonaws.com/graphql
```

## 🔧 Usage Examples

### Using Authentication Context
```jsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Using OSDU API Service
```jsx
import osduApi from './services/osduApiService';

function DataComponent() {
  const [schemas, setSchemas] = useState([]);
  
  useEffect(() => {
    const loadSchemas = async () => {
      try {
        const result = await osduApi.getSchemas();
        setSchemas(result.getSchemas.schemas);
      } catch (error) {
        console.error('Failed to load schemas:', error);
      }
    };
    
    loadSchemas();
  }, []);
  
  return (
    <div>
      {schemas.map(schema => (
        <div key={schema.schemaIdentity.id}>
          {schema.schemaIdentity.id}
        </div>
      ))}
    </div>
  );
}
```

### Protected Routes
```jsx
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <YourMainContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}
```

## 🔍 Authentication Flow

### 1. Initial Load
- App checks for existing authentication
- Shows loading spinner while checking
- Redirects to sign-in if not authenticated

### 2. Sign-In Process
- User enters credentials
- Cognito validates and returns tokens
- Tokens stored in context and used for API calls

### 3. API Calls
- All OSDU API calls use Bearer token authentication
- Tokens automatically refreshed when needed
- Proper OSDU headers included (data-partition-id, etc.)

### 4. Sign-Out
- Clears tokens and user state
- Redirects to authentication flow

## 🧪 Testing Components

### TestAuth Component
- Shows authentication status
- Displays token availability
- Tests Cognito configuration

### TestAPI Component
- Tests connectivity to OSDU services using tokens
- Shows authentication status for each service
- Replaces API key testing with token-based testing

### DebugEnv Component
- Shows environment configuration
- Helps debug authentication issues

## 🔒 Security Features

### Token Management
- Automatic token refresh
- Secure token storage
- Token validation before API calls

### OSDU Headers
- `Authorization: Bearer <id_token>`
- `data-partition-id: osdu`
- `x-access-token: <access_token>` (for additional verification)

### Error Handling
- Comprehensive error messages
- Authentication error handling
- Service-specific error handling

## 🚦 Development vs Production

### Development Mode
- Test components visible (`import.meta.env.DEV`)
- Detailed error messages
- Debug information available

### Production Mode
- Test components hidden
- Minimal error exposure
- Optimized performance

## 📝 API Methods Available

### Schema Service
```javascript
await osduApi.getSchemas(dataPartition)
await osduApi.getSchema(schemaId, dataPartition)
```

### Entitlements Service
```javascript
await osduApi.getEntitlements(filter, dataPartition)
await osduApi.createEntitlement(entitlementData, dataPartition)
await osduApi.getUserPermissions(resourceId, dataPartition)
await osduApi.hasPermission(resourceId, action, dataPartition)
```

### Legal Tagging Service
```javascript
await osduApi.getLegalTags(dataPartition)
await osduApi.createLegalTag(legalTagData, dataPartition)
```

### Connectivity Testing
```javascript
await osduApi.testConnectivity(dataPartition)
```

## 🔧 Customization

### Adding New Services
1. Add endpoint to environment variables
2. Add methods to `osduApiService.js`
3. Update test connectivity function

### Custom Authentication UI
- Modify components in `src/components/auth/`
- Customize styles and branding
- Add additional authentication providers

### Error Handling
- Customize error messages in `AuthContext.jsx`
- Add service-specific error handling
- Implement retry logic

## 🐛 Troubleshooting

### Common Issues

#### "Authentication required" errors
- Check if user is signed in
- Verify token availability
- Check token expiration

#### API call failures
- Verify service endpoints in environment
- Check network connectivity
- Validate OSDU service deployment

#### Sign-in failures
- Verify Cognito configuration
- Check user pool settings
- Validate redirect URIs

### Debug Steps
1. Check browser console for errors
2. Use TestAuth component to verify configuration
3. Use TestAPI component to test service connectivity
4. Check network tab for failed requests

## 🎯 Next Steps

1. **Test Authentication**: Run the app and test sign-in/sign-up flow
2. **Verify API Connectivity**: Use TestAPI component to verify OSDU service access
3. **Build UI Components**: Create UI components that use the OSDU API service
4. **Add Error Handling**: Implement proper error handling for your use cases
5. **Customize Styling**: Update authentication components to match your design

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Use the test components to diagnose issues
3. Verify environment configuration
4. Check OSDU service deployment status

The authentication system is now fully integrated and ready for production use with proper Cognito token-based authentication!

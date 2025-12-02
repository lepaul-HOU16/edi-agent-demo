# Migration Files Inventory

## Overview
This document catalogs all files changed between commit 925b396 (pre-migration) and commit ab01226 (post-migration).

**Total Files Changed**: 1,047 files

## Priority Classification

### 🔴 CRITICAL - User-Facing Components (Highest Priority)
These directly impact user experience and should be reviewed first.

#### Agent Landing Pages
- `src/components/agent-landing-pages/EDIcraftAgentLanding.tsx` ⚠️ **KNOWN REGRESSION**

#### Core Chat Components
- `src/components/ChatBox.tsx`
- `src/components/ChatMessage.tsx`
- `src/components/AgentLandingPage.tsx`
- `src/components/AgentSwitcher.tsx`

#### Main Pages
- `src/pages/ChatPage.tsx`
- `src/pages/CatalogPage.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/ProjectsPage.tsx`
- `src/pages/CollectionsPage.tsx`
- `src/pages/CanvasesPage.tsx`
- `src/pages/ListChatsPage.tsx`
- `src/pages/CreateNewChatPage.tsx`

#### Message Components (User Feedback)
- `src/components/messageComponents/AiMessageComponent.tsx`
- `src/components/messageComponents/HumanMessageComponent.tsx`
- `src/components/messageComponents/ThinkingMessageComponent.tsx`
- `src/components/messageComponents/EDIcraftResponseComponent.tsx`
- `src/components/messageComponents/UniversalResponseComponent.tsx`

#### UI Feedback Components
- `src/components/ThinkingIndicator.tsx`
- `src/components/ChainOfThoughtDisplay.tsx`
- `src/components/SimplifiedThoughtStep.tsx`

### 🟡 HIGH - API Integration & State Management
These affect how the frontend communicates with backend.

#### API Layer (NEW - Post-Migration)
- `src/lib/api/chat.ts` ⚠️ **NEW FILE - Replaces Amplify**
- `src/lib/api/client.ts`
- `src/lib/api/catalog.ts`
- `src/lib/api/collections.ts`
- `src/lib/api/projects.ts`
- `src/lib/api/renewable.ts`
- `src/lib/api/sessions.ts`
- `src/lib/api/storage.ts`
- `src/lib/api/osdu.ts`

#### Authentication
- `src/lib/auth/cognitoAuth.ts` ⚠️ **Replaces Amplify Auth**
- `src/components/WithAuth.tsx`
- `src/components/ConfigureAmplify.tsx`

#### Utilities
- `src/utils/chatUtils.ts`
- `src/utils/types.ts`
- `src/utils/thoughtTypes.ts`
- `src/services/agentService.ts`

### 🟢 MEDIUM - Backend Lambda Functions
Backend changes that should maintain same behavior.

#### Chat Lambda Functions
- `cdk/lambda-functions/chat/handler.ts`
- `cdk/lambda-functions/chat/agents/agentRouter.ts`
- `cdk/lambda-functions/chat/agents/edicraftAgent.ts`
- `cdk/lambda-functions/chat/agents/enhancedStrandsAgent.ts`
- `cdk/lambda-functions/chat/agents/generalKnowledgeAgent.ts`
- `cdk/lambda-functions/chat/agents/maintenanceStrandsAgent.ts`
- `cdk/lambda-functions/chat/agents/renewableProxyAgent.ts`

#### Renewable Energy Lambda Functions
- `cdk/lambda-functions/renewable-orchestrator/handler.ts`
- `cdk/lambda-functions/renewable-orchestrator/RenewableIntentClassifier.ts`
- `cdk/lambda-functions/renewable-orchestrator/IntentRouter.ts`

#### Other API Handlers
- `cdk/lambda-functions/chat-sessions/handler.ts`
- `cdk/lambda-functions/projects/handler.ts`
- `cdk/lambda-functions/collections/handler.ts`
- `cdk/lambda-functions/catalog-search/handler.ts`

### 🔵 LOW - Infrastructure & Configuration
Infrastructure changes (expected during migration).

#### CDK Infrastructure
- `cdk/lib/main-stack.ts`
- `cdk/lib/constructs/lambda-function.ts`
- `cdk/bin/app.ts`
- `cdk/cdk.json`
- `cdk/package.json`

#### Build Configuration
- `package.json` ⚠️ **Check for dependency changes**
- `vite.config.ts`
- `tsconfig.json`
- `index.html`

#### Deployment
- `.github/workflows/deploy-production.yml` ⚠️ **KNOWN REGRESSION - CloudFront wait**
- `scripts/deploy-frontend.sh`

#### Application Entry Points
- `src/main.tsx`
- `src/App.tsx`

### ⚪ DOCUMENTATION - No User Impact
Documentation and test files.

#### Documentation Files (300+ files)
- All `.md` files in root directory
- All files in `docs/` directory
- All files in `tests/` directory

#### Test Files
- All `__tests__/` directories
- All `.test.ts`, `.test.tsx` files

## Detailed Categorization

### Frontend Components (React/TypeScript)

#### Core UI Components (24 files)
```
src/components/AgentLandingPage.tsx
src/components/AgentSwitcher.tsx
src/components/AppLayout.tsx
src/components/ArtifactRenderer.tsx
src/components/CatalogChatBox.tsx
src/components/CatalogChatBoxCloudscape.tsx
src/components/ChainOfThoughtDisplay.tsx
src/components/ChatBox.tsx
src/components/ChatMessage.tsx
src/components/CollectionContextBadge.tsx
src/components/CollectionCreationModal.tsx
src/components/ConfigureAmplify.tsx
src/components/ConfirmationDialog.tsx
src/components/DataDashboard.tsx
src/components/ErrorBoundary.tsx
src/components/ExpandablePromptInput.tsx
src/components/FileDrawer.tsx
src/components/FileExplorer.tsx
src/components/FileViewer.tsx
src/components/SimplifiedThoughtStep.tsx
src/components/ThinkingIndicator.tsx
src/components/TopNavBar.tsx
src/components/UserAttributesProvider.tsx
src/components/WithAuth.tsx
```

#### Agent Landing Pages (1 file)
```
src/components/agent-landing-pages/EDIcraftAgentLanding.tsx ⚠️ CRITICAL REGRESSION
```

#### Message Components (20 files)
```
src/components/messageComponents/AiMessageComponent.tsx
src/components/messageComponents/CalculatorToolComponent.tsx
src/components/messageComponents/ComprehensivePorosityAnalysisComponent.tsx
src/components/messageComponents/ComprehensiveShaleAnalysisComponent.tsx
src/components/messageComponents/ComprehensiveWellDataDiscoveryComponent.tsx
src/components/messageComponents/CreateProjectToolComponent.tsx
src/components/messageComponents/CustomWorkshopComponent.tsx
src/components/messageComponents/DefaultToolMessageComponent.tsx
src/components/messageComponents/DuckDuckGoSearchToolComponent.tsx
src/components/messageComponents/EDIcraftResponseComponent.tsx
src/components/messageComponents/HumanMessageComponent.tsx
src/components/messageComponents/InteractiveEducationalComponent.tsx
src/components/messageComponents/ListFilesToolComponent.tsx
src/components/messageComponents/LogPlotViewerComponent.tsx
src/components/messageComponents/MultiWellCorrelationComponent.tsx
src/components/messageComponents/ProfessionalResponseComponent.tsx
src/components/messageComponents/PySparkToolComponent.tsx
src/components/messageComponents/ReadFileToolComponent.tsx
src/components/messageComponents/RenderAssetToolComponent.tsx
src/components/messageComponents/SearchFilesToolComponent.tsx
src/components/messageComponents/TextToTableToolComponent.tsx
src/components/messageComponents/ThinkingMessageComponent.tsx
src/components/messageComponents/UniversalResponseComponent.tsx
src/components/messageComponents/UpdateFileToolComponent.tsx
src/components/messageComponents/UserInputToolComponent.tsx
src/components/messageComponents/WebBrowserToolComponent.tsx
src/components/messageComponents/WriteFileToolComponent.tsx
```

#### Renewable Energy Components (18 files)
```
src/components/renewable/CallToActionPanel.tsx
src/components/renewable/ErrorRecoveryActions.tsx
src/components/renewable/ErrorRecoverySystem.tsx
src/components/renewable/InteractiveWindRose.tsx
src/components/renewable/MatplotlibWindRose.tsx
src/components/renewable/PerformanceAnalysisDashboard.tsx
src/components/renewable/PlotlyWindRose.tsx
src/components/renewable/ProgressIndicator.tsx
src/components/renewable/ProgressiveDisclosurePanel.tsx
src/components/renewable/ProjectDashboardArtifact.tsx
src/components/renewable/ProjectListTable.tsx
src/components/renewable/RenewableConfigPanel.tsx
src/components/renewable/RenewableJobStatusDisplay.tsx
src/components/renewable/SimulationChartArtifact.tsx
src/components/renewable/StandardErrorBoundary.tsx
src/components/renewable/SuitabilityAssessmentWorkflow.tsx
src/components/renewable/VisualizationGallery.tsx
src/components/renewable/VisualizationRenderer.tsx
src/components/renewable/WakeAnalysisArtifact.tsx
src/components/renewable/WakeAnalysisDashboard.tsx
src/components/renewable/WindResourceDashboard.tsx
src/components/renewable/WorkflowHelpPanel.tsx
src/components/renewable/WorkflowOrchestrator.tsx
src/components/renewable/WorkflowStepComponent.tsx
src/components/renewable/workflow-steps/SiteSelectionStep.tsx
```

### Pages (9 files)
```
src/pages/CanvasesPage.tsx
src/pages/CatalogPage.tsx
src/pages/ChatPage.tsx
src/pages/CollectionDetailPage.tsx
src/pages/CollectionsPage.tsx
src/pages/CreateNewChatPage.tsx
src/pages/HomePage.tsx
src/pages/ListChatsPage.tsx
src/pages/ProjectsPage.tsx
```

### API Layer - NEW (9 files) ⚠️
These are NEW files that replace Amplify API calls.
```
src/lib/api/catalog.ts
src/lib/api/chat.ts ⚠️ CRITICAL - Main chat API
src/lib/api/client.ts
src/lib/api/collections.ts
src/lib/api/index.ts
src/lib/api/osdu.ts
src/lib/api/projects.ts
src/lib/api/renewable.ts
src/lib/api/sessions.ts
src/lib/api/storage.ts
```

### Authentication (1 file) ⚠️
```
src/lib/auth/cognitoAuth.ts ⚠️ Replaces Amplify Auth
```

### Utilities (12 files)
```
src/utils/chatUtils.ts
src/utils/collectionInheritance.ts
src/utils/graphqlStatements.ts
src/utils/osduAutocompleteData.ts
src/utils/osduQueryExecutor.ts
src/utils/osduQueryGenerator.ts
src/utils/osduQueryTemplates.ts
src/utils/queryBuilderAnalytics.ts
src/utils/queryHistory.ts
src/utils/s3ArtifactStorage.ts
src/utils/thoughtTypes.ts
src/utils/types.ts
src/utils/weather.ts
```

### Services (3 files)
```
src/services/agentService.ts
src/services/collectionContextLoader.ts
src/services/renewableEnergyService.ts
src/services/renewable/RenewableAnalysisErrorHandler.ts
```

### Hooks (4 files)
```
src/hooks/useAgentProgress.ts
src/hooks/useChatMessagePolling.ts
src/hooks/useRenewableJobPolling.ts
src/hooks/useRenewableJobStatus.ts
```

### Backend Lambda Functions (50+ files)
All files in `cdk/lambda-functions/` directory.

### Infrastructure (CDK)
All files in `cdk/lib/` and `cdk/bin/` directories.

### Deployment & CI/CD
```
.github/workflows/deploy-production.yml ⚠️ KNOWN REGRESSION
scripts/deploy-frontend.sh
scripts/setup-github-actions.sh
```

### Configuration Files
```
package.json ⚠️ Check dependencies
vite.config.ts
tsconfig.json
cdk/cdk.json
cdk/package.json
```

## Known Regressions

### 1. EDIcraft Clear Button ⚠️ CRITICAL
**File**: `src/components/agent-landing-pages/EDIcraftAgentLanding.tsx`
**Issue**: Clear button behavior changed - now shows user message in chat instead of direct action
**Impact**: Users cannot clear Minecraft environment properly
**Priority**: CRITICAL - Fix immediately

### 2. CloudFront Deployment ⚠️ CRITICAL
**File**: `.github/workflows/deploy-production.yml`
**Issue**: Deployment fails at "Wait for invalidation" step
**Impact**: Cannot deploy to production
**Priority**: CRITICAL - Fix immediately

## Analysis Summary

### Infrastructure Changes (Expected)
- Removed all Amplify Gen2 files (`amplify/` directory)
- Added CDK infrastructure (`cdk/` directory)
- Created new REST API layer (`src/lib/api/`)
- Replaced Amplify Auth with direct Cognito (`src/lib/auth/cognitoAuth.ts`)
- Updated deployment workflow (GitHub Actions)

### Behavioral Changes (Potential Regressions)
- **Agent Landing Pages**: EDIcraft confirmed regression
- **Chat Components**: Need to verify ChatBox, ChatMessage behavior
- **API Integration**: All API calls now use REST instead of Amplify
- **Authentication Flow**: Changed from Amplify to direct Cognito
- **State Management**: May have changed in components

## Next Steps

1. ✅ **Task 1 Complete**: Files identified and categorized
2. **Task 2**: Analyze EDIcraft component for smart merge
3. **Task 3**: Smart merge EDIcraft Clear button
4. **Task 4**: Fix CloudFront deployment workflow
5. **Task 5**: Test EDIcraft merge on localhost
6. **Task 6-17**: Identify and fix other regressions
7. **Task 18-20**: Comprehensive validation

## Files Requiring Immediate Review

### Critical UX Components (Review First)
1. `src/components/agent-landing-pages/EDIcraftAgentLanding.tsx` ⚠️
2. `src/components/ChatBox.tsx`
3. `src/pages/ChatPage.tsx`
4. `src/lib/api/chat.ts`
5. `src/utils/chatUtils.ts`

### Infrastructure (Review for Correctness)
1. `.github/workflows/deploy-production.yml` ⚠️
2. `src/lib/auth/cognitoAuth.ts`
3. `cdk/lib/main-stack.ts`

## Comparison Strategy

For each critical file:
1. Extract pre-migration version: `git show 925b396:path/to/file`
2. Extract post-migration version: `git show ab01226:path/to/file`
3. Compare line-by-line
4. Identify: (a) Infrastructure changes (keep), (b) Behavioral changes (regression)
5. Document regression
6. Create fix task

---

**Generated**: Task 1 - Migration Files Inventory
**Commits Compared**: 925b396 (pre-migration) → ab01226 (post-migration)
**Total Files**: 1,047 files changed

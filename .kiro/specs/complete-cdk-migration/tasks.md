# Implementation Plan: Complete CDK Migration

## Overview

Complete the migration from Amplify to CDK by integrating renewable tool Lambdas, verifying all functionality, and shutting down Amplify sandbox.

---

## Phase 1: Configure Renewable Tool Integration

- [x] 1. Update CDK stack with renewable tool Lambda environment variables
  - Add `RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME` environment variable to renewable orchestrator
  - Add `RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME` environment variable to renewable orchestrator
  - Add `RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME` environment variable to renewable orchestrator
  - Update IAM permissions to allow invoking specific tool Lambda ARNs
  - Remove wildcard Amplify Lambda permissions
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Deploy updated CDK stack
  - Run `npm run build` in cdk directory
  - Run `cdk diff` to review changes
  - Run `cdk deploy` to apply changes
  - Wait for deployment to complete
  - Verify deployment succeeded
  - _Requirements: 1.5_

- [x] 3. Verify renewable orchestrator configuration
  - Check Lambda environment variables in AWS Console
  - Verify all three tool function names are set
  - Check IAM policy has correct permissions
  - Verify no errors in CloudWatch logs
  - Test Lambda can be invoked manually
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

---

## Phase 2: Test Renewable Energy Workflows

- [x] 4. Test terrain analysis end-to-end
  - Send terrain analysis request via CDK API
  - Verify renewable orchestrator invokes terrain Lambda
  - Verify terrain Lambda returns results
  - Verify artifacts are generated correctly
  - Check CloudWatch logs for errors
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 5. Test layout optimization end-to-end
  - Send layout optimization request via CDK API
  - Verify renewable orchestrator invokes layout Lambda
  - Verify layout Lambda returns results
  - Verify artifacts are generated correctly
  - Check CloudWatch logs for errors
  - _Requirements: 2.2, 2.4, 2.5_

- [x] 6. Test wake simulation end-to-end
  - Send wake simulation request via CDK API
  - Verify renewable orchestrator invokes simulation Lambda
  - Verify simulation Lambda returns results
  - Verify artifacts are generated correctly
  - Check CloudWatch logs for errors
  - _Requirements: 2.3, 2.4, 2.5_

---

## Phase 3: Verify Chat and Session Management

- [x] 7. Test chat message sending
  - Send chat message via CDK API endpoint
  - Verify message saved to DynamoDB
  - Verify AI response generated
  - Verify response saved to DynamoDB
  - Check CloudWatch logs for errors
  - _Requirements: 3.1, 3.5_
  - _Status: COMPLETE - Chat Lambda implemented and tested via cdk/test-chat-api.sh_

- [x] 8. Test chat session management
  - Create new chat session via CDK API
  - List all chat sessions via CDK API
  - Get specific session via CDK API
  - Get session messages via CDK API
  - Verify all operations work correctly
  - _Requirements: 3.2, 3.3, 3.4, 3.5_
  - _Status: COMPLETE - ChatSessions Lambda implemented with full CRUD operations_

---

## Phase 4: Verify File Storage Operations

- [x] 9. Test file upload and download
  - Upload test file via CDK API
  - Verify file stored in S3 bucket
  - Download file via CDK API
  - Verify file content matches upload
  - Check CloudWatch logs for errors
  - _Requirements: 4.1, 4.2, 4.5_
  - _Status: COMPLETE - S3 proxy Lambda (api-s3-proxy) implemented and integrated_

- [x] 10. Test file listing and deletion
  - List files via CDK API
  - Verify all uploaded files appear
  - Delete test file via CDK API
  - Verify file removed from S3
  - Check CloudWatch logs for errors
  - _Requirements: 4.3, 4.4, 4.5_
  - _Status: COMPLETE - S3 operations handled by api-s3-proxy Lambda_

---

## Phase 5: Frontend Verification

- [x] 11. Configure frontend to use CDK API
  - Add `VITE_API_URL` to `.env.local` pointing to CDK API Gateway
  - Update frontend to use CDK endpoints instead of Amplify
  - Verify no Amplify AppSync references remain in code
  - Build frontend with `npm run build`
  - Check build output for errors
  - _Requirements: 5.1, 5.5_
  - _Status: COMPLETE - Frontend configured with VITE_API_URL=https://hbt1j807qf.execute-api.us-east-1.amazonaws.com_
  - _Status: COMPLETE - All Amplify references removed from codebase_
  - _Status: COMPLETE - Using REST API client with Cognito authentication_

- [x] 12. Test frontend end-to-end in browser
  - Deploy frontend to CloudFront S3 bucket
  - Open CloudFront URL in browser
  - Test chat functionality (send message, view response)
  - Test renewable energy features (terrain, layout, simulation)
  - Test file upload/download via UI
  - Verify no console errors
  - Verify all artifacts render correctly
  - _Requirements: 5.2, 5.3, 5.4_

---

## Phase 6: Amplify Sandbox Shutdown

- [x] 13. Final verification before shutdown
  - Run renewable energy tests (terrain, layout, simulation)
  - Run chat and session tests
  - Run file storage tests
  - Test all features in browser via CloudFront
  - Verify zero errors in CloudWatch logs
  - Document all working features
  - _Requirements: 6.2_
  - _Status: COMPLETE - All CDK features verified working_

- [x] 14. Identify and document Amplify sandbox stack
  - List all Amplify CloudFormation stacks
  - Identify the specific sandbox stack to delete
  - Document stack name and resources
  - Create backup plan if needed
  - Verify CDK stack is independent
  - _Requirements: 6.1_
  - _Status: COMPLETE - Identified stack: amplify-agentsforenergy-lepaul-sandbox-eca99671d7_
  - _Note: This is the main Amplify Gen 2 sandbox stack with nested stacks for auth, data, storage, functions_

- [x] 15. Stop and delete Amplify sandbox
  - Stop Amplify sandbox process if running (Ctrl+C or verify no process running)
  - Delete Amplify CloudFormation stack: `amplify-agentsforenergy-lepaul-sandbox-eca99671d7`
  - Command: `aws cloudformation delete-stack --stack-name amplify-agentsforenergy-lepaul-sandbox-eca99671d7`
  - Wait for stack deletion to complete (may take 10-15 minutes)
  - Verify all nested stacks deleted (auth, data, storage, functions, networking, agents)
  - Test CDK backend still works after deletion
  - _Requirements: 6.1, 6.2, 6.3_
  - _Warning: This is irreversible - ensure all tests pass first_
  - _Critical: CDK stack (EnergyInsights-development) is completely independent and will NOT be affected_

- [x] 16. Verify single-backend operation
  - List all CloudFormation stacks: `aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE`
  - Verify only CDK stack (EnergyInsights-development) remains for this application
  - Test all features still work via CDK API Gateway
  - Verify frontend still accessible via CloudFront: https://d36sq31aqkfe46.cloudfront.net
  - Check AWS costs reduced (no duplicate Lambda functions, DynamoDB tables)
  - Verify no Amplify dependencies in code (already verified - none found)
  - Update documentation to reflect CDK-only architecture
  - _Requirements: 6.3, 6.4, 6.5_

---

## Phase 7: Documentation and Cleanup

- [x] 17. Update README and documentation
  - Document CDK deployment process (`cd cdk && npm run build && cdk deploy`)
  - Create architecture diagram showing CDK components (API Gateway, Lambda, DynamoDB, S3, CloudFront)
  - Document all REST API endpoints:
    - Chat: POST /api/chat/message
    - Sessions: GET/POST/DELETE /api/chat/sessions
    - Renewable: POST /api/renewable/analyze
    - Projects: GET/POST/PUT/DELETE /api/projects
    - Collections: GET/POST/PUT/DELETE /api/collections
    - OSDU: POST /api/osdu/search
    - Catalog: GET /api/catalog/map-data, POST /api/catalog/search
    - S3 Proxy: GET/POST/DELETE /api/s3/*
  - Create troubleshooting guide for common issues
  - Document rollback procedure if needed
  - Remove Amplify-specific documentation from README
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 18. Clean up Amplify artifacts
  - Remove `amplify/` directory from codebase (contains Gen 2 backend definition)
  - Remove Amplify CLI configuration files (.amplifyrc, amplify.yml)
  - Remove `amplify_outputs.json` files (root and amplify/)
  - Check package.json for Amplify dependencies (already removed from frontend)
  - Update build scripts to remove any Amplify commands
  - Archive Amplify configuration for reference if needed
  - _Requirements: 6.5_
  - _Note: Verify no code references amplify/ directory before deletion_

---

## Success Criteria

The migration is complete when:

✅ Renewable orchestrator has all environment variables set (COMPLETE)
✅ All renewable energy features work via CDK API (COMPLETE - terrain, layout, simulation tested)
✅ All chat features work via CDK API (COMPLETE - message sending, sessions tested)
✅ All file storage features work via CDK API (COMPLETE - S3 proxy implemented)
✅ Frontend uses CDK API exclusively (COMPLETE - no Amplify references)
✅ Frontend deployed to CloudFront (COMPLETE - https://d36sq31aqkfe46.cloudfront.net)
⏳ Amplify sandbox is deleted (PENDING - Task 15)
⏳ Only CDK stack remains in AWS (PENDING - Task 16)
✅ All features tested and working (COMPLETE)
⏳ Documentation updated (PENDING - Task 17)
✅ Zero console errors (COMPLETE)
✅ Zero CloudWatch errors (COMPLETE)

**Remaining Tasks:** 15, 16, 17, 18 (Amplify shutdown and cleanup)

## Rollback Plan

If critical issues occur:

1. Keep Amplify sandbox running
2. Revert CDK stack to previous version
3. Point frontend back to Amplify
4. Investigate and fix issues
5. Retry migration

**DO NOT delete Amplify until all tests pass!**

# Implementation Plan

## Phase 1: Manual CloudWatch Log Analysis (START HERE)

- [x] 1. Check CloudWatch logs for lightweightAgent Lambda
  - Open AWS CloudWatch console
  - Navigate to `/aws/lambda/lightweightAgent` log group
  - Search for recent renewable energy query attempts
  - Look for errors, exceptions, or "renewable" keyword
  - Document any errors found with timestamps and request IDs
  - Check if RenewableProxyAgent is being invoked
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Check CloudWatch logs for renewableOrchestrator Lambda
  - Open AWS CloudWatch console
  - Navigate to `/aws/lambda/renewableOrchestrator` log group (if it exists)
  - Search for any invocation attempts
  - If no logs exist, orchestrator is likely not deployed or not being called
  - If logs exist, check for errors or exceptions
  - Document findings with timestamps
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Check CloudWatch logs for terrain tool Lambda
  - Open AWS CloudWatch console
  - Navigate to `/aws/lambda/renewableTerrain` log group (if it exists)
  - Check if terrain Lambda is being invoked directly (bypassing orchestrator)
  - Look for errors or exceptions
  - Document findings
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. Check browser console for frontend errors
  - Open browser developer tools (F12)
  - Attempt a renewable energy query
  - Check Console tab for JavaScript errors
  - Check Network tab for failed API requests
  - Look for GraphQL errors or 403/401 responses
  - Document any errors with full stack traces
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 5. Document initial findings
  - Create `docs/CLOUDWATCH_LOG_ANALYSIS.md`
  - Summarize errors found in each Lambda
  - Identify which Lambda is failing (or not being called)
  - Note any missing log groups (indicates Lambda not deployed)
  - Determine likely root cause category (deployment, permissions, config, auth)
  - _Requirements: All requirements_

## Phase 2: Create Quick Diagnostic Script Based on Findings

- [ ] 6. Create simple Lambda existence checker
  - Create `scripts/check-lambda-exists.js`
  - Check if renewableOrchestrator Lambda exists
  - Check if terrain, layout, simulation, report Lambdas exist
  - Use AWS SDK Lambda.getFunction() API
  - Print simple YES/NO for each Lambda
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 7. Create simple environment variable checker
  - Create `scripts/check-env-vars.js`
  - Check lightweightAgent for RENEWABLE_ORCHESTRATOR_FUNCTION_NAME
  - Check orchestrator for tool Lambda function names
  - Print actual values or "NOT SET"
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Create simple direct invocation test
  - Create `scripts/test-invoke-orchestrator.js`
  - Try to invoke renewableOrchestrator with health check payload
  - Catch and log any AWS SDK errors (ResourceNotFoundException, AccessDeniedException, etc.)
  - Print success or specific error message
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 3: Apply Targeted Fix Based on Root Cause

- [x] 9. Fix deployment issue (if Lambdas don't exist)
  - Run `npx ampx sandbox` to deploy all Lambdas
  - Wait for deployment to complete
  - Re-run Lambda existence checker to verify
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 10. Fix environment variable issue (if vars not set)
  - Update `amplify/backend.ts` to set missing environment variables
  - Add RENEWABLE_ORCHESTRATOR_FUNCTION_NAME to lightweightAgent
  - Add tool Lambda function names to orchestrator
  - Redeploy with `npx ampx sandbox`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 11. Fix IAM permission issue (if AccessDeniedException found)
  - Update `amplify/backend.ts` to add Lambda invocation permissions
  - Add lambda:InvokeFunction permission to lightweightAgent role
  - Add lambda:InvokeFunction permission to orchestrator role
  - Redeploy with `npx ampx sandbox`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 12. Fix GraphQL schema issue (if query not defined)
  - Check `amplify/data/resource.ts` for invokeRenewableAgent query
  - Add query if missing with correct Lambda resolver
  - Verify authorization allows authenticated users
  - Redeploy with `npx ampx sandbox`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 13. Fix authentication issue (if auth errors found)
  - Check if user is signed in
  - Verify Cognito token is valid
  - Check AppSync authorization configuration
  - Update authorization rules if needed
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

## Phase 4: Add Minimal Logging for Future Debugging

- [ ] 14. Add basic error logging to RenewableProxyAgent
  - Add try-catch around orchestrator invocation
  - Log error message, error code, and function name
  - Log environment variable value on error
  - Keep logging minimal (< 5 lines)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 15. Add basic error logging to orchestrator
  - Add try-catch around tool Lambda invocations
  - Log error message and tool Lambda name
  - Log entry point with query text
  - Keep logging minimal
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Add user-friendly error message to frontend
  - Update error handling in ChatMessage component
  - Replace "access issue" with specific error based on error code
  - Show "Renewable features unavailable" for deployment errors
  - Show "Permission denied" for auth errors
  - Clear loading state on all errors
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

## Phase 5: Verify Fix and Test

- [ ] 17. Re-run diagnostic scripts
  - Run Lambda existence checker - should show all Lambdas exist
  - Run environment variable checker - should show all vars set
  - Run direct invocation test - should succeed
  - Document results
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 18. Test renewable energy query end-to-end
  - Send "analyze terrain at 40.7128,-74.0060" through UI
  - Verify loading indicator appears
  - Verify response is received (no page reload needed)
  - Verify terrain map is displayed
  - Check CloudWatch logs for any errors
  - _Requirements: All requirements_

- [ ] 19. Document root cause and solution
  - Create `docs/RENEWABLE_ACCESS_FAILURE_ROOT_CAUSE.md`
  - Document what was broken (deployment, permissions, config, etc.)
  - Document the specific fix applied
  - Include before/after CloudWatch log examples
  - Add troubleshooting steps for future issues
  - _Requirements: All requirements_

- [ ] 20. Monitor production for 24 hours
  - Deploy fix to production
  - Monitor CloudWatch logs for errors
  - Check user feedback for "access issue" errors
  - Verify renewable energy queries work consistently
  - Document any remaining issues
  - _Requirements: All requirements_


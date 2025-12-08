# Implementation Tasks: Fix Catalog Layout and OSDU Regression

## Task 1: Add OSDU Lambda to CDK Stack

Configure the OSDU Lambda function in the CDK stack to restore OSDU search functionality.

- [ ] 1.1 Add OSDU Lambda function configuration to `cdk/lib/main-stack.ts`
  - Import LambdaFunction construct
  - Create OSDU function with proper environment variables
  - Set timeout to 60 seconds for external API calls
  - Set memory to 512 MB
  - _Requirements: 1.1, 1.2_

- [ ] 1.2 Add API Gateway routes for OSDU endpoints
  - Add `POST /api/osdu/search` route
  - Add `GET /api/osdu/wells/{id}` route
  - Configure with Lambda authorizer
  - _Requirements: 1.1, 1.3_

- [ ] 1.3 Add CDK outputs for OSDU Lambda
  - Output OSDU Lambda ARN
  - Output OSDU API endpoints
  - _Requirements: 1.4_

## Task 2: Fix Prompt Input Border Radius

Normalize the border radius on the prompt input to match the response container.

- [ ] 2.1 Update ExpandablePromptInput component styling
  - Add border-radius override to match response container (8px)
  - Apply to both `.awsui-prompt-input` and `.awsui-prompt-input__container`
  - Ensure all four corners have equal radius
  - _Requirements: 2.1_

## Task 3: Deploy and Verify

Deploy the changes and verify both fixes work correctly.

- [ ] 3.1 Deploy CDK stack
  - Run `cd cdk && npm run deploy`
  - Verify OSDU Lambda is created
  - Verify API routes are added
  - Check CloudFormation outputs
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3.2 Test on localhost
  - Start dev server: `npm run dev`
  - Navigate to Catalog page
  - Test "show me osdu wells" query
  - Verify proper error message (not 404)
  - Inspect prompt input border radius
  - Verify all corners match
  - _Requirements: 1.1, 2.1_

- [ ] 3.3 Verify CloudWatch logs
  - Check OSDU Lambda is invoked
  - Verify environment variables are accessible
  - Check for any errors in logs
  - _Requirements: 1.1, 1.2_

## Notes

- OSDU API credentials (OSDU_API_URL, OSDU_API_KEY) are optional
- If not provided, Lambda returns proper "Service Not Configured" error
- Border radius fix is cosmetic but improves UX consistency
- Both fixes are independent and can be tested separately

# AgentCore Implementation Checklist

Use this checklist to track your progress implementing the AgentCore solution.

## Phase 1: Verify Files ✅

- [x] `amplify/functions/petrophysicsCalculator/handler.py` exists
- [x] `amplify/functions/petrophysicsCalculator/requirements.txt` exists
- [x] `amplify/functions/petrophysicsCalculator/resource.ts` exists
- [x] `docs/AGENTCORE_IMPLEMENTATION_GUIDE.md` exists
- [x] `docs/AGENTCORE_QUICK_START.md` exists

## Phase 2: Deploy Lambda Function

- [ ] Run `npx ampx sandbox`
- [ ] Wait for deployment to complete
- [ ] Note the Lambda function ARN
- [ ] Verify function appears in AWS Console
- [ ] Test function directly (optional)

## Phase 3: Create Bedrock Agent

- [ ] Open AWS Console → Amazon Bedrock
- [ ] Navigate to Agents section
- [ ] Click "Create Agent"
- [ ] Enter name: `petrophysics-agent`
- [ ] Select model: Claude 3.5 Sonnet
- [ ] Paste instructions (from guide)
- [ ] Click "Create"
- [ ] **Note Agent ID**: ___________________________

## Phase 4: Add Action Group

- [ ] In Agent page, click "Add Action Group"
- [ ] Enter name: `petrophysics-calculations`
- [ ] Select Lambda: `petrophysicsCalculator`
- [ ] Choose "Define with in-line OpenAPI schema"
- [ ] Copy OpenAPI schema from guide
- [ ] Paste schema into editor
- [ ] Click "Add"

## Phase 5: Prepare Agent

- [ ] Click "Prepare" button (top right)
- [ ] Wait 2-3 minutes for preparation
- [ ] Verify status shows "Prepared"
- [ ] **Note Alias ID**: ___________________________

## Phase 6: Test in Console

- [ ] Click "Test" tab
- [ ] Try: `"list wells"`
- [ ] Verify response shows wells
- [ ] Try: `"calculate porosity for well-001"`
- [ ] Verify response shows calculation results

## Phase 7: Update Backend Code

- [ ] Open `amplify/backend.ts`
- [ ] Add Agent ID environment variable
- [ ] Add Alias ID environment variable
- [ ] Add IAM permissions for Bedrock
- [ ] Save file

```typescript
// Add these lines to amplify/backend.ts
backend.enhancedStrandsAgent.addEnvironment('BEDROCK_AGENT_ID', 'YOUR_AGENT_ID_HERE');
backend.enhancedStrandsAgent.addEnvironment('BEDROCK_AGENT_ALIAS_ID', 'YOUR_ALIAS_ID_HERE');

import { aws_iam as iam } from 'aws-cdk-lib';
backend.enhancedStrandsAgent.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['bedrock:InvokeAgent', 'bedrock:InvokeModel'],
    resources: ['*']
  })
);
```

## Phase 8: Deploy Updated Code

- [ ] Run `npx ampx sandbox` again
- [ ] Wait for deployment
- [ ] Verify no errors in deployment

## Phase 9: Test End-to-End

- [ ] Open chat interface
- [ ] Try: `"list wells"`
- [ ] Verify response
- [ ] Try: `"calculate porosity for well-001"`
- [ ] Verify you see:
  - [ ] Real statistics (not 0%)
  - [ ] Mean porosity ~11%
  - [ ] 4-track log visualization
  - [ ] GR, RHOB, NPHI, Porosity curves

## Phase 10: Verify Success

- [ ] Check CloudWatch logs for Lambda
- [ ] Check CloudWatch logs for Agent
- [ ] Verify no errors
- [ ] Test with different wells
- [ ] Test different methods (density, neutron, effective)

## Troubleshooting

If something doesn't work:

### Lambda Issues
- [ ] Check Lambda exists in AWS Console
- [ ] Verify S3 permissions
- [ ] Check CloudWatch logs
- [ ] Test Lambda directly with test event

### Agent Issues
- [ ] Verify Agent is "Prepared"
- [ ] Check Action Group is configured
- [ ] Test in Bedrock Console first
- [ ] Verify Lambda is linked correctly

### Integration Issues
- [ ] Verify environment variables are set
- [ ] Check IAM permissions
- [ ] Review CloudWatch logs for both Lambdas
- [ ] Verify Agent IDs are correct

## Success Criteria

✅ All checkboxes above are checked
✅ Chat interface shows real porosity data
✅ Statistics are not 0%
✅ Log curves display correctly
✅ No errors in CloudWatch logs

## Time Tracking

- Phase 1-2 (Deploy Lambda): _____ minutes
- Phase 3-5 (Create Agent): _____ minutes
- Phase 6 (Test Console): _____ minutes
- Phase 7-8 (Update Code): _____ minutes
- Phase 9-10 (Test E2E): _____ minutes
- **Total Time**: _____ minutes

## Notes

Use this space for any notes, issues, or observations:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

## Next Steps After Success

- [ ] Add shale volume calculations
- [ ] Add saturation calculations
- [ ] Optimize for large datasets
- [ ] Add caching
- [ ] Add monitoring/alerting
- [ ] Document for team

---

**Good luck!** 🚀

For detailed instructions, see: `docs/AGENTCORE_IMPLEMENTATION_GUIDE.md`
For quick reference, see: `docs/AGENTCORE_QUICK_START.md`

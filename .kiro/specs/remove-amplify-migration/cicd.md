# CI/CD After Migration

## Current (Amplify)

**How it works:**
- Push to `main` branch
- Amplify detects push
- Amplify builds and deploys automatically
- Takes 10-15 minutes

**Problems:**
- ❌ Opaque build process
- ❌ Hard to debug failures
- ❌ Can't customize build steps
- ❌ Slow deployments
- ❌ Limited control

## After Migration (GitHub Actions)

**How it works:**
- Push to `main` branch
- GitHub Actions triggers
- Runs your custom workflow
- Deploys to AWS
- Takes 5-8 minutes

**Benefits:**
- ✅ Full control over build process
- ✅ Easy to debug (clear logs)
- ✅ Customizable steps
- ✅ Faster deployments
- ✅ Can run tests before deploy
- ✅ Can deploy to multiple environments

## GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to AWS

on:
  push:
    branches:
      - main
  workflow_dispatch: # Manual trigger

env:
  AWS_REGION: us-east-1
  NODE_VERSION: 20

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Build Lambda functions
        run: npm run build:lambdas

      - name: Deploy infrastructure (CDK)
        run: |
          cd cdk
          npm ci
          npx cdk deploy --all --require-approval never

      - name: Build frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          NEXT_PUBLIC_USER_POOL_ID: ${{ secrets.USER_POOL_ID }}
          NEXT_PUBLIC_USER_POOL_CLIENT_ID: ${{ secrets.USER_POOL_CLIENT_ID }}

      - name: Deploy frontend to S3
        run: |
          aws s3 sync out/ s3://${{ secrets.FRONTEND_BUCKET }} --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"

      - name: Notify on success
        if: success()
        run: echo "✅ Deployment successful!"

      - name: Notify on failure
        if: failure()
        run: echo "❌ Deployment failed!"
```

## Setup Steps

### 1. Create GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions

Add these secrets:
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `API_URL` - Your API Gateway URL
- `USER_POOL_ID` - Your Cognito User Pool ID
- `USER_POOL_CLIENT_ID` - Your Cognito Client ID
- `FRONTEND_BUCKET` - Your S3 bucket name
- `CLOUDFRONT_ID` - Your CloudFront distribution ID

### 2. Create AWS IAM User for CI/CD

```bash
# Create IAM user
aws iam create-user --user-name github-actions-deploy

# Attach policies
aws iam attach-user-policy \
  --user-name github-actions-deploy \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Create access key
aws iam create-access-key --user-name github-actions-deploy
```

### 3. Add Workflow File

```bash
mkdir -p .github/workflows
# Create deploy.yml with content above
```

### 4. Push to Main

```bash
git add .github/workflows/deploy.yml
git commit -m "Add CI/CD workflow"
git push origin main
```

**That's it!** Every push to main will now trigger deployment.

## Deployment Flow

```
Push to main
    ↓
GitHub Actions triggered
    ↓
1. Checkout code
2. Install dependencies
3. Run tests ✅
    ↓
4. Build Lambda functions
5. Deploy CDK stack (infrastructure)
    ↓
6. Build Next.js frontend
7. Upload to S3
8. Invalidate CloudFront cache
    ↓
✅ Deployment complete!
```

## Advanced Features

### Deploy to Multiple Environments

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches:
      - main        # Production
      - develop     # Staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # ... setup steps ...
      
      - name: Determine environment
        id: env
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "environment=production" >> $GITHUB_OUTPUT
            echo "stack_name=prod" >> $GITHUB_OUTPUT
          else
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "stack_name=staging" >> $GITHUB_OUTPUT
          fi

      - name: Deploy CDK
        run: |
          cd cdk
          npx cdk deploy --all \
            --context environment=${{ steps.env.outputs.environment }} \
            --require-approval never
```

### Run Tests Before Deploy

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test  # Only deploy if tests pass
    runs-on: ubuntu-latest
    steps:
      # ... deployment steps ...
```

### Deploy Only Changed Components

```yaml
- name: Check what changed
  id: changes
  run: |
    if git diff --name-only HEAD~1 | grep -q "^functions/"; then
      echo "lambdas=true" >> $GITHUB_OUTPUT
    fi
    if git diff --name-only HEAD~1 | grep -q "^src/"; then
      echo "frontend=true" >> $GITHUB_OUTPUT
    fi

- name: Deploy Lambda functions
  if: steps.changes.outputs.lambdas == 'true'
  run: npm run deploy:lambdas

- name: Deploy frontend
  if: steps.changes.outputs.frontend == 'true'
  run: npm run deploy:frontend
```

### Slack Notifications

```yaml
- name: Notify Slack on success
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "✅ Deployment to production successful!"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "❌ Deployment to production failed!"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Alternative: AWS CodePipeline

If you prefer AWS-native CI/CD:

```typescript
// In CDK stack
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';

const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
  pipelineName: 'EnergyInsightsPipeline',
});

// Source stage
const sourceOutput = new codepipeline.Artifact();
pipeline.addStage({
  stageName: 'Source',
  actions: [
    new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub',
      owner: 'your-username',
      repo: 'your-repo',
      branch: 'main',
      oauthToken: cdk.SecretValue.secretsManager('github-token'),
      output: sourceOutput,
    }),
  ],
});

// Build stage
const buildOutput = new codepipeline.Artifact();
pipeline.addStage({
  stageName: 'Build',
  actions: [
    new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    }),
  ],
});

// Deploy stage
pipeline.addStage({
  stageName: 'Deploy',
  actions: [
    new codepipeline_actions.CloudFormationCreateUpdateStackAction({
      actionName: 'DeployInfrastructure',
      stackName: 'EnergyInsightsStack',
      templatePath: buildOutput.atPath('cdk.out/EnergyInsightsStack.template.json'),
      adminPermissions: true,
    }),
  ],
});
```

## Comparison

| Feature | Amplify CI/CD | GitHub Actions | AWS CodePipeline |
|---------|---------------|----------------|------------------|
| Setup | Automatic | Manual | Manual |
| Customization | Limited | Full | Full |
| Speed | Slow (10-15 min) | Fast (5-8 min) | Medium (8-12 min) |
| Debugging | Hard | Easy | Medium |
| Cost | Included | Free (2000 min/mo) | $1/pipeline/mo |
| Flexibility | Low | High | High |
| Learning Curve | Easy | Easy | Medium |

## Recommendation

**Use GitHub Actions** (or GitLab CI, Bitbucket Pipelines, etc.)

**Why:**
- ✅ Free for most use cases
- ✅ Easy to set up and customize
- ✅ Great debugging experience
- ✅ Fast deployments
- ✅ Large ecosystem of actions
- ✅ Works with any Git provider

## Manual Deployment (Backup)

If CI/CD fails, you can always deploy manually:

```bash
# Deploy infrastructure
cd cdk
npx cdk deploy --all

# Deploy frontend
npm run build
npm run deploy:frontend
```

## Summary

**Current (Amplify):**
- Push to main → Amplify auto-deploys
- 10-15 minutes
- Limited control

**After Migration:**
- Push to main → GitHub Actions deploys
- 5-8 minutes
- Full control
- Can run tests first
- Can deploy to multiple environments
- Better debugging

**Setup effort:** 30 minutes to create workflow file and add secrets

**Ongoing effort:** Zero - works automatically like Amplify

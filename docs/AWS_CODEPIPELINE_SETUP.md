# AWS CodePipeline CI/CD Setup (Alternative)

If you prefer AWS-native CI/CD instead of GitHub Actions, you can use AWS CodePipeline.

---

## Overview

**AWS CodePipeline** provides a fully managed CI/CD service that:
- Integrates directly with GitHub
- Runs entirely in your AWS account
- No need for GitHub Actions minutes
- Native integration with CDK

---

## Architecture

```
GitHub (main branch)
    ↓ (webhook)
CodePipeline
    ↓
CodeBuild (Build & Test)
    ↓
CodeBuild (Deploy CDK)
    ↓
CodeBuild (Deploy Frontend)
    ↓
CloudWatch (Monitoring)
```

---

## Setup Steps

### Step 1: Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these scopes:
   - `repo` (full control)
   - `admin:repo_hook` (write:repo_hook)
3. Save the token securely

### Step 2: Store Token in Secrets Manager

```bash
aws secretsmanager create-secret \
    --name github-token \
    --description "GitHub personal access token for CodePipeline" \
    --secret-string "YOUR_GITHUB_TOKEN"
```

### Step 3: Create CodeBuild Projects

#### Build Project (buildspec.yml)

Create `buildspec.yml` in project root:

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - echo "Installing dependencies..."
      - npm ci
      - cd cdk && npm ci && cd ..
  
  pre_build:
    commands:
      - echo "Running tests..."
      - npm run lint || true
      - npm test || true
  
  build:
    commands:
      - echo "Building frontend..."
      - npm run build
      - echo "Building CDK..."
      - cd cdk && npm run build && cd ..
  
  post_build:
    commands:
      - echo "Build complete"

artifacts:
  files:
    - '**/*'
  name: BuildArtifact

cache:
  paths:
    - 'node_modules/**/*'
    - 'cdk/node_modules/**/*'
```

#### Deploy CDK Project (buildspec-deploy-cdk.yml)

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - npm install -g aws-cdk
  
  build:
    commands:
      - echo "Deploying CDK stack..."
      - cd cdk
      - npm ci
      - npm run build
      - cdk deploy --require-approval never
  
  post_build:
    commands:
      - echo "CDK deployment complete"
```

#### Deploy Frontend Project (buildspec-deploy-frontend.yml)

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
  
  build:
    commands:
      - echo "Deploying frontend..."
      - |
        BUCKET=$(aws cloudformation describe-stacks \
          --stack-name EnergyInsights-development \
          --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
          --output text)
        
        DIST_ID=$(aws cloudformation describe-stacks \
          --stack-name EnergyInsights-development \
          --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
          --output text)
        
        echo "Deploying to S3 bucket: $BUCKET"
        aws s3 sync dist/ s3://$BUCKET/ --delete
        
        echo "Invalidating CloudFront: $DIST_ID"
        aws cloudfront create-invalidation \
          --distribution-id $DIST_ID \
          --paths "/*"
  
  post_build:
    commands:
      - echo "Frontend deployment complete"
```

### Step 4: Create CodePipeline via CDK

Add to your CDK stack:

```typescript
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

// Get GitHub token from Secrets Manager
const githubToken = secretsmanager.Secret.fromSecretNameV2(
  this,
  'GitHubToken',
  'github-token'
);

// Create CodeBuild projects
const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
  buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
  environment: {
    buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
    computeType: codebuild.ComputeType.SMALL,
  },
});

const deployCdkProject = new codebuild.PipelineProject(this, 'DeployCdkProject', {
  buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec-deploy-cdk.yml'),
  environment: {
    buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
    computeType: codebuild.ComputeType.SMALL,
    privileged: true,
  },
});

const deployFrontendProject = new codebuild.PipelineProject(this, 'DeployFrontendProject', {
  buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec-deploy-frontend.yml'),
  environment: {
    buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
    computeType: codebuild.ComputeType.SMALL,
  },
});

// Grant permissions
deployCdkProject.addToRolePolicy(new iam.PolicyStatement({
  actions: ['cloudformation:*', 'lambda:*', 'apigateway:*', 's3:*', 'iam:*'],
  resources: ['*'],
}));

deployFrontendProject.addToRolePolicy(new iam.PolicyStatement({
  actions: ['s3:*', 'cloudfront:*', 'cloudformation:DescribeStacks'],
  resources: ['*'],
}));

// Create pipeline
const sourceOutput = new codepipeline.Artifact();
const buildOutput = new codepipeline.Artifact();

const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
  pipelineName: 'EnergyInsights-Pipeline',
  stages: [
    {
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: 'YOUR_GITHUB_USERNAME',
          repo: 'YOUR_REPO_NAME',
          branch: 'main',
          oauthToken: githubToken.secretValue,
          output: sourceOutput,
        }),
      ],
    },
    {
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    },
    {
      stageName: 'Deploy_Backend',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Deploy_CDK',
          project: deployCdkProject,
          input: buildOutput,
        }),
      ],
    },
    {
      stageName: 'Deploy_Frontend',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Deploy_Frontend',
          project: deployFrontendProject,
          input: buildOutput,
        }),
      ],
    },
  ],
});
```

### Step 5: Deploy Pipeline

```bash
cd cdk
npm run build
cdk deploy
```

---

## Comparison: GitHub Actions vs CodePipeline

| Feature | GitHub Actions | AWS CodePipeline |
|---------|---------------|------------------|
| **Cost** | 2,000 free minutes/month | $1/month + $0.002/minute |
| **Setup** | Easier (YAML in repo) | More complex (CDK/CloudFormation) |
| **Integration** | Native GitHub | Webhook to GitHub |
| **Logs** | GitHub UI | CloudWatch Logs |
| **Secrets** | GitHub Secrets | Secrets Manager |
| **Approval** | GitHub Environments | Manual approval stage |
| **Best For** | GitHub-centric teams | AWS-centric teams |

---

## Recommendation

**Use GitHub Actions if:**
- ✅ You're already using GitHub
- ✅ You want simpler setup
- ✅ You want to see CI/CD in GitHub UI
- ✅ You have free GitHub Actions minutes

**Use CodePipeline if:**
- ✅ You prefer AWS-native tools
- ✅ You want everything in AWS
- ✅ You need advanced AWS integrations
- ✅ You're already using other AWS DevOps tools

---

## Next Steps

For GitHub Actions (recommended):
1. Follow `docs/GITHUB_ACTIONS_SETUP.md`
2. Run `bash scripts/setup-github-actions.sh`
3. Push to main branch

For CodePipeline:
1. Create GitHub token
2. Store in Secrets Manager
3. Add pipeline code to CDK stack
4. Deploy with `cdk deploy`

---

**Last Updated:** November 16, 2025

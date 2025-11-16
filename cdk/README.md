# Energy Insights CDK Infrastructure

This directory contains the AWS CDK infrastructure code for Energy Data Insights, replacing AWS Amplify Gen 2.

## Structure

```
cdk/
├── bin/
│   └── app.ts              # CDK app entry point
├── lib/
│   ├── main-stack.ts       # Main infrastructure stack
│   └── constructs/         # Reusable constructs (to be added)
├── test/                   # Infrastructure tests (to be added)
├── cdk.json                # CDK configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript configuration
```

## Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Synthesize CloudFormation template
npm run synth

# Show differences with deployed stack
npm run diff

# Deploy to AWS
npm run deploy

# Deploy specific stack
npx cdk deploy EnergyInsightsStack
```

## Development

```bash
# Watch mode (auto-compile on changes)
npm run watch
```

## Testing

```bash
# Run infrastructure tests
npm test
```

## Deployment

### First Time Setup

1. Bootstrap CDK (one-time):
```bash
npx cdk bootstrap aws://ACCOUNT-ID/REGION
```

2. Deploy:
```bash
npm run deploy
```

### Subsequent Deployments

```bash
npm run deploy
```

Or use CI/CD (GitHub Actions) for automatic deployment on push to main.

## Migration Status

- [x] Phase 1.1: CDK project structure created
- [ ] Phase 1.2: Stack structure defined
- [ ] Phase 1.3: CDK deployment configured
- [ ] Phase 2.1: Existing resources imported
- [ ] ... (see tasks.md for full plan)

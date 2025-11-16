#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainStack } from '../lib/main-stack';

const app = new cdk.App();

// Get environment from context or default to development
const environment = app.node.tryGetContext('environment') || 'development';

// Get resource IDs from context or use defaults
const userPoolId = app.node.tryGetContext('userPoolId') || process.env.USER_POOL_ID;
const userPoolClientId = app.node.tryGetContext('userPoolClientId') || process.env.USER_POOL_CLIENT_ID;
const storageBucketName = app.node.tryGetContext('storageBucketName') || process.env.STORAGE_BUCKET_NAME;

new MainStack(app, `EnergyInsights-${environment}`, {
  environment,
  userPoolId,
  userPoolClientId,
  storageBucketName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Energy Data Insights - ${environment} Stack`,
  tags: {
    Project: 'EnergyInsights',
    Environment: environment,
    ManagedBy: 'CDK',
  },
});

app.synth();

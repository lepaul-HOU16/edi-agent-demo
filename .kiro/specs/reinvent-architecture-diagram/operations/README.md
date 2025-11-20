# Deployment and Operations Guide

## Overview

This guide provides comprehensive deployment procedures, monitoring configurations, and operational runbooks for the AWS Energy Data Insights platform. It covers everything from initial deployment to production operations and troubleshooting.

## Contents

1. **[Deployment Pipeline](./deployment-pipeline.md)** - CI/CD pipeline architecture and deployment procedures
2. **[CloudWatch Dashboard](./cloudwatch-dashboard.json)** - Pre-configured monitoring dashboard
3. **[Monitoring Alerts](./monitoring-alerts.md)** - Alert configurations and thresholds
4. **[Troubleshooting Decision Tree](./troubleshooting-tree.md)** - Systematic problem diagnosis
5. **[Operations Runbook](./operations-runbook.md)** - Common operational procedures

## Quick Start

### Prerequisites
- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm installed
- CDK CLI installed: `npm install -g aws-cdk`
- Access to AWS account with appropriate permissions

### Initial Deployment

```bash
# 1. Clone repository
git clone <repository-url>
cd energy-data-insights

# 2. Install dependencies
npm install
cd cdk && npm install && cd ..

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# 4. Bootstrap CDK (first time only)
cd cdk
cdk bootstrap

# 5. Deploy infrastructure
cdk deploy --all --require-approval never

# 6. Deploy frontend
npm run build
# Upload to S3/CloudFront (automated in CI/CD)
```

### Verification

```bash
# Test authentication
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username": "test@example.com", "password": "TestPassword123!"}'

# Test chat endpoint
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/api/chat/message \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"chatSessionId": "test-session", "message": "Hello"}'
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Environment                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  CloudFront → S3 (Frontend)                                  │
│       ↓                                                       │
│  API Gateway → Lambda Authorizer → Cognito                   │
│       ↓                                                       │
│  Chat Lambda → Agent Router → Specialized Agents             │
│       ↓                                                       │
│  Orchestrator → Tool Lambdas → S3 Artifacts                  │
│       ↓                                                       │
│  DynamoDB (Messages, Sessions, Context)                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Metrics

### Service Level Objectives (SLOs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Availability | 99.9% | Successful requests / Total requests |
| API Latency (p95) | < 5s | 95th percentile response time |
| Error Rate | < 1% | Failed requests / Total requests |
| Agent Success Rate | > 95% | Successful agent responses / Total queries |
| Artifact Generation | > 90% | Artifacts generated / Requests requiring artifacts |

### Cost Targets

| Environment | Monthly Budget | Alert Threshold |
|-------------|----------------|-----------------|
| Development | $50 | $40 |
| Staging | $100 | $80 |
| Production | $500 | $400 |

## Support and Escalation

### Severity Levels

**P0 - Critical**: Complete service outage
- Response Time: 15 minutes
- Resolution Time: 2 hours
- Escalation: Immediate to on-call engineer

**P1 - High**: Major feature unavailable
- Response Time: 1 hour
- Resolution Time: 4 hours
- Escalation: After 2 hours

**P2 - Medium**: Minor feature degradation
- Response Time: 4 hours
- Resolution Time: 24 hours
- Escalation: After 8 hours

**P3 - Low**: Cosmetic issues, feature requests
- Response Time: 24 hours
- Resolution Time: 1 week
- Escalation: None

## Related Documentation

- [AWS Architecture Diagram](../diagrams/01-high-level-architecture.mmd)
- [IAM Permissions Reference](../iam-reference-cards/README.md)
- [Integration Guide](../integration-guide/README.md)
- [Starter Kit](../starter-kit/README.md)

## Contact Information

- **DevOps Team**: devops@example.com
- **On-Call Engineer**: +1-555-0100
- **Slack Channel**: #energy-insights-ops
- **PagerDuty**: https://example.pagerduty.com

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintained By**: Platform Engineering Team

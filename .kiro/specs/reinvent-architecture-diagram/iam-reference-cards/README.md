# IAM Permissions Reference Cards

Comprehensive IAM permission documentation for AWS Energy Data Insights Platform Lambda functions, designed for AWS re:Invent chalk talk presentations.

## 📚 Contents

This directory contains 5 detailed IAM reference cards plus a summary matrix:

1. **Lambda Authorizer** (`01-lambda-authorizer.html`)
   - JWT token validation for API Gateway
   - Cognito integration permissions
   - 5 permissions (all required)

2. **Chat Lambda** (`02-chat-lambda.html`)
   - Agent routing and orchestration
   - DynamoDB, S3, Bedrock, and Lambda invocation
   - 15 permissions (14 required, 1 optional)

3. **Renewable Orchestrator** (`03-renewable-orchestrator.html`)
   - Multi-tool coordination for wind farm analysis
   - Project lifecycle management
   - 12 permissions (all required)

4. **Tool Lambdas** (`04-tool-lambdas.html`)
   - Python-based analysis tools (terrain, layout, simulation, report, windrose)
   - Minimal S3-only permissions
   - 5 permissions (all required)

5. **Petrophysics Calculator** (`05-petrophysics-calculator.html`)
   - LAS file processing and calculations
   - Read-only well data access
   - 6 permissions (5 required, 1 optional)

6. **Permissions Summary Matrix** (`permissions-summary.html`)
   - Complete permission mapping across all functions
   - Visual matrix showing permission usage
   - Summary statistics

## 🎯 Features

Each reference card includes:

- ✅ **Visual Indicators**: Required vs optional permissions clearly marked
- 📄 **Complete IAM Policy JSON**: Copy-paste ready policy statements
- 🔗 **Resource ARN Patterns**: Specific resource identifiers
- 📝 **Use Case Descriptions**: Why each permission is needed
- 🔒 **Security Best Practices**: Principle of least privilege guidance
- 🔄 **Workflow Diagrams**: How permissions are used in practice

## 📖 Usage

### View in Browser

1. Open `index.html` in your web browser
2. Click on any card to view detailed permissions
3. Use the summary matrix for quick reference

### Print Reference Cards

**Option 1: Manual Printing (Recommended)**
1. Open any HTML file in your browser
2. Press `Ctrl/Cmd+P` to open print dialog
3. Select "Save as PDF" as destination
4. Choose "Letter" (8.5x11) paper size
5. Save with the card name

**Option 2: Automated PDF Generation**
```bash
# Generate all PDFs at once
./generate-pdfs.sh

# PDFs will be saved to pdfs/ directory
```

Requirements for automated generation:
- Chrome or Chromium browser installed
- macOS: `brew install --cask google-chrome`
- Ubuntu: `sudo apt install chromium-browser`
- Fedora: `sudo dnf install chromium`

### Use in Presentations

1. **Print Cards**: Print each card on 8.5x11 paper for easy reference
2. **Handouts**: Distribute cards to audience members
3. **Quick Reference**: Keep cards handy during chalk talk
4. **Implementation Guide**: Use JSON policies directly in CDK/CloudFormation

### Copy IAM Policies

Each card contains a complete IAM policy JSON block that can be copied directly into:
- AWS CDK constructs
- CloudFormation templates
- Terraform configurations
- AWS Console IAM policy editor

Example:
```typescript
// In CDK
import { aws_iam as iam } from 'aws-cdk-lib';

chatLambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
    resources: ['arn:aws:dynamodb:*:*:table/ChatMessage-*']
  })
);
```

## 🔒 Security Best Practices

All reference cards follow these security principles:

1. **Principle of Least Privilege**: Each Lambda has only the permissions it needs
2. **Resource-Specific ARNs**: Permissions scoped to specific resources, not wildcards
3. **No Cross-Account Access**: All resources within same AWS account
4. **Read-Only Where Possible**: Tool Lambdas only have read access to source data
5. **Audit Logging**: All actions logged to CloudWatch for compliance

## 📊 Permission Statistics

- **Total Lambda Functions**: 5
- **Unique Permissions**: 23
- **AWS Services Used**: 6 (Cognito, DynamoDB, S3, Bedrock, Lambda, CloudWatch)
- **Most Permissive**: Chat Lambda (15 permissions)
- **Least Permissive**: Lambda Authorizer & Tool Lambdas (5 permissions each)

## 🎨 Customization

To customize the reference cards:

1. Edit the HTML files directly
2. Modify the CSS styles in the `<style>` section
3. Update permission descriptions and examples
4. Add your organization's branding
5. Regenerate PDFs using the script

## 📝 File Structure

```
iam-reference-cards/
├── index.html                      # Main index page
├── 01-lambda-authorizer.html       # Authorizer permissions
├── 02-chat-lambda.html             # Chat Lambda permissions
├── 03-renewable-orchestrator.html  # Orchestrator permissions
├── 04-tool-lambdas.html            # Tool Lambda permissions
├── 05-petrophysics-calculator.html # Petrophysics permissions
├── permissions-summary.html        # Summary matrix
├── generate-pdfs.sh                # PDF generation script
├── README.md                       # This file
└── pdfs/                           # Generated PDFs (created by script)
    ├── 01-lambda-authorizer.pdf
    ├── 02-chat-lambda.pdf
    ├── 03-renewable-orchestrator.pdf
    ├── 04-tool-lambdas.pdf
    ├── 05-petrophysics-calculator.pdf
    └── permissions-summary.pdf
```

## 🚀 Quick Start

```bash
# View in browser
open index.html

# Generate all PDFs
./generate-pdfs.sh

# Print specific card
open 02-chat-lambda.html
# Then Ctrl/Cmd+P to print
```

## 💡 Tips

- **For Presentations**: Print cards on cardstock for durability
- **For Implementation**: Keep digital copies for easy policy copying
- **For Security Review**: Use summary matrix to validate least privilege
- **For Troubleshooting**: Check required permissions when debugging access denied errors
- **For Documentation**: Include cards in architecture documentation

## 📄 License

These reference cards are part of the AWS Energy Data Insights Platform documentation.

## 🤝 Contributing

To add new Lambda functions or update permissions:

1. Create a new HTML file following the existing template
2. Update `index.html` to include the new card
3. Update `permissions-summary.html` with new permissions
4. Add the new file to `generate-pdfs.sh`
5. Update this README with the new card information

## 📞 Support

For questions or issues with the reference cards:
- Check the main project documentation
- Review the design document for detailed architecture information
- Consult AWS IAM documentation for permission details

---

**AWS Energy Data Insights Platform** | re:Invent Chalk Talk | Version 1.0

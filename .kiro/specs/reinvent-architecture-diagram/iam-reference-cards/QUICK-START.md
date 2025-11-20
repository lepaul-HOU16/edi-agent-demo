# IAM Reference Cards - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: View the Cards
```bash
# Open the index page in your browser
open index.html

# Or navigate directly to a specific card
open 02-chat-lambda.html
```

### Step 2: Generate PDFs (Optional)
```bash
# Generate all PDFs at once
./generate-pdfs.sh

# PDFs will be saved to pdfs/ directory
ls -lh pdfs/
```

### Step 3: Print for Presentation
1. Open any HTML file in your browser
2. Press `Ctrl/Cmd+P` to print
3. Select "Save as PDF" or print directly
4. Choose Letter (8.5x11) paper size

## 📋 What's Included

### 5 Lambda Function Reference Cards
- **Lambda Authorizer**: JWT validation (5 permissions)
- **Chat Lambda**: Agent orchestration (15 permissions)
- **Renewable Orchestrator**: Multi-tool coordination (12 permissions)
- **Tool Lambdas**: Python analysis tools (5 permissions)
- **Petrophysics Calculator**: Well log analysis (6 permissions)

### Supporting Materials
- **Index Page**: Navigation hub for all cards
- **Permissions Matrix**: Complete permission comparison
- **README**: Detailed documentation
- **Scripts**: PDF generation and validation

## 💡 Common Use Cases

### For Presentations
```bash
# Print all cards on cardstock
./generate-pdfs.sh
# Then print PDFs from pdfs/ directory
```

### For Implementation
1. Open the card for your Lambda function
2. Scroll to "Complete IAM Policy JSON" section
3. Copy the JSON policy
4. Paste into your CDK/CloudFormation template

### For Security Review
1. Open `permissions-summary.html`
2. Review the permission matrix
3. Verify least privilege compliance
4. Check for any unnecessary permissions

### For Troubleshooting
1. Identify the Lambda function with access issues
2. Open its reference card
3. Check required permissions
4. Verify IAM role has all required permissions

## 🎯 Quick Reference

### File Locations
```
iam-reference-cards/
├── index.html              # Start here
├── 01-lambda-authorizer.html
├── 02-chat-lambda.html
├── 03-renewable-orchestrator.html
├── 04-tool-lambdas.html
├── 05-petrophysics-calculator.html
├── permissions-summary.html
└── README.md               # Full documentation
```

### Key Features
- ✅ Visual indicators (required vs optional)
- ✅ Copy-paste ready IAM policies
- ✅ Resource ARN patterns
- ✅ Security best practices
- ✅ Print-optimized layout

### Scripts
```bash
# Validate all cards
./validate-cards.sh

# Generate PDFs
./generate-pdfs.sh
```

## 🔒 Security Notes

All cards follow AWS security best practices:
- Principle of least privilege
- Resource-specific ARNs (no wildcards)
- Read-only access where possible
- CloudWatch logging for audit

## 📞 Need Help?

- **Full Documentation**: See `README.md`
- **Design Details**: See `../design.md`
- **Requirements**: See `../requirements.md`

## ⚡ Pro Tips

1. **Print on Cardstock**: More durable for presentations
2. **Laminate Cards**: Reusable reference materials
3. **Digital Copies**: Keep on laptop for quick policy lookup
4. **QR Codes**: Add QR codes linking to GitHub repo
5. **Custom Branding**: Edit HTML to add your organization's logo

---

**Ready to use!** Open `index.html` to get started.

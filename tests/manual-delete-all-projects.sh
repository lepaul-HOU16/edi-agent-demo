#!/bin/bash

# Manual script to delete ALL renewable projects from S3
# Use this as a workaround until the deleteRenewableProject fix is deployed

echo "=========================================="
echo "Manual Project Deletion Script"
echo "=========================================="
echo ""

BUCKET="amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy"

echo "⚠️  WARNING: This will delete ALL renewable energy projects from S3!"
echo "Bucket: $BUCKET"
echo ""

# Count projects
PROJECT_COUNT=$(aws s3 ls "s3://$BUCKET/renewable/projects/" --recursive 2>/dev/null | grep "project.json" | wc -l | tr -d ' ')

echo "Found $PROJECT_COUNT projects to delete"
echo ""

read -p "Are you sure you want to delete ALL projects? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Deleting all projects..."
echo ""

# Delete all files under renewable/projects/
aws s3 rm "s3://$BUCKET/renewable/projects/" --recursive

echo ""
echo "✅ All projects deleted from S3"
echo ""
echo "Verifying..."
REMAINING=$(aws s3 ls "s3://$BUCKET/renewable/projects/" --recursive 2>/dev/null | grep "project.json" | wc -l | tr -d ' ')

if [ "$REMAINING" -eq 0 ]; then
    echo "✅ Verification passed: 0 projects remaining"
else
    echo "⚠️  Warning: $REMAINING projects still remain"
fi

echo ""
echo "Next steps:"
echo "1. Refresh your browser"
echo "2. Request the dashboard again"
echo "3. You should see 0 projects"
echo ""

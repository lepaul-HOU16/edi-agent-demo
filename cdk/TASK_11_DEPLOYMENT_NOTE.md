# Task 11 Deployment Note

## Issue Encountered

When attempting to deploy the S3 bucket for frontend hosting (Task 11.1), we encountered an AWS account-level Block Public Access setting that prevents public bucket policies.

**Error:**
```
User is not authorized to perform: s3:PutBucketPolicy because public policies 
are prevented by the BlockPublicPolicy setting in S3 Block Public Access
```

## Solution

Instead of making the S3 bucket publicly accessible (which is a security risk anyway), we'll implement the proper architecture:

**Task 11.2: CloudFront + S3 with Origin Access Control (OAC)**

This is the recommended AWS best practice:
1. S3 bucket remains private (Block Public Access enabled)
2. CloudFront distribution created with Origin Access Control
3. CloudFront has permission to read from S3
4. Users access the site through CloudFront URL (not S3 directly)

## Benefits of CloudFront Approach

✅ **Security**: S3 bucket stays private
✅ **Performance**: CDN caching worldwide
✅ **Cost**: Reduced S3 data transfer costs
✅ **HTTPS**: Free SSL certificate with CloudFront
✅ **Custom Domain**: Easy to configure
✅ **Cache Control**: Better control over caching

## Next Steps

Proceeding directly to Task 11.2 to create CloudFront distribution with S3 origin.
This will create both resources together with proper access controls.

## Status

- Task 11.1: Skipped (will be done as part of 11.2)
- Task 11.2: In Progress

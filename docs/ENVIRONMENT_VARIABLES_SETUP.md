# Setting Up Environment Variables in AWS Amplify

This guide explains how to set up environment variables for your Next.js application deployed with AWS Amplify, specifically to handle AWS credentials securely.

## Local Development

For local development, create a `.env.local` file in the root of your project. You can use the `.env.local.example` file as a template:

```bash
cp .env.local.example .env.local
```

Then edit the `.env.local` file to add your actual credentials. This file should never be committed to version control.

## AWS Amplify Console

To set environment variables in AWS Amplify:

1. Log in to the [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your app
3. Go to the "Environment variables" section under "App settings"
4. Add the following environment variables:

   - `NEXT_PUBLIC_AWS_REGION`: The AWS region (e.g., `us-east-1`)
   - `NEXT_PUBLIC_AWS_ACCESS_KEY_ID`: Your AWS access key ID
   - `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
   - `NEXT_PUBLIC_LAMBDA_MAP_URL`: Your Lambda map function URL
   - `NEXT_PUBLIC_LAMBDA_SEARCH_URL`: Your Lambda search function URL
   - `NEXT_PUBLIC_EDI_USERNAME`: Your EDI username
   - `NEXT_PUBLIC_EDI_PASSWORD`: Your EDI password
   - `NEXT_PUBLIC_EDI_CLIENT_ID`: Your EDI client ID
   - `NEXT_PUBLIC_EDI_CLIENT_SECRET`: Your EDI client secret
   - `NEXT_PUBLIC_EDI_PARTITION`: Your EDI partition

5. Click "Save"
6. Redeploy your application to apply the changes

## Security Best Practices

### Using AWS IAM Roles (Recommended)

Instead of hardcoding AWS credentials, consider using IAM roles for your Amplify app:

1. Create an IAM role with the necessary permissions for your Lambda functions
2. Configure your Amplify app to use this role
3. Remove the `NEXT_PUBLIC_AWS_ACCESS_KEY_ID` and `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY` environment variables

### Using AWS Amplify Sandbox Environment

For Amplify sandbox environments, you can use the built-in authentication mechanism:

1. In the Amplify Console, go to your app
2. Navigate to "Environment variables"
3. Add the necessary environment variables
4. Mark sensitive variables as "Secret" by toggling the option

## Important Notes

1. Variables prefixed with `NEXT_PUBLIC_` will be exposed to the browser. For truly sensitive information that should not be exposed to the client, consider using server-side environment variables or AWS services like Secrets Manager.

2. For production environments, consider using AWS Parameter Store or Secrets Manager for sensitive values, and retrieve them at runtime.

3. Regularly rotate your credentials and access keys as per AWS best practices.

4. Consider implementing additional security measures such as IP restrictions and request rate limiting.

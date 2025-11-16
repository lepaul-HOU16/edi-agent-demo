"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
/**
 * Test Lambda function to verify Cognito User Pool import
 *
 * This function attempts to describe the User Pool to verify:
 * 1. The User Pool ID is correct
 * 2. The Lambda has permission to access it
 * 3. The User Pool exists and is accessible
 */
const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    const userPoolId = process.env.USER_POOL_ID;
    if (!userPoolId) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'USER_POOL_ID environment variable not set',
            }),
        };
    }
    try {
        const client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
        const command = new client_cognito_identity_provider_1.DescribeUserPoolCommand({
            UserPoolId: userPoolId,
        });
        const response = await client.send(command);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                success: true,
                message: 'Successfully accessed Cognito User Pool',
                userPool: {
                    id: response.UserPool?.Id,
                    name: response.UserPool?.Name,
                    arn: response.UserPool?.Arn,
                    status: response.UserPool?.Status,
                    creationDate: response.UserPool?.CreationDate,
                    lastModifiedDate: response.UserPool?.LastModifiedDate,
                },
            }, null, 2),
        };
    }
    catch (error) {
        console.error('Error accessing User Pool:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to access User Pool',
                message: error instanceof Error ? error.message : 'Unknown error',
                userPoolId,
            }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxnR0FBbUg7QUFFbkg7Ozs7Ozs7R0FPRztBQUNJLE1BQU0sT0FBTyxHQUFZLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtJQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV0RCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQztJQUU1QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDaEIsT0FBTztZQUNMLFVBQVUsRUFBRSxHQUFHO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLEtBQUssRUFBRSwyQ0FBMkM7YUFDbkQsQ0FBQztTQUNILENBQUM7SUFDSixDQUFDO0lBRUQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsSUFBSSxnRUFBNkIsQ0FBQztZQUMvQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksV0FBVztTQUM5QyxDQUFDLENBQUM7UUFFSCxNQUFNLE9BQU8sR0FBRyxJQUFJLDBEQUF1QixDQUFDO1lBQzFDLFVBQVUsRUFBRSxVQUFVO1NBQ3ZCLENBQUMsQ0FBQztRQUVILE1BQU0sUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU1QyxPQUFPO1lBQ0wsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUU7Z0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjthQUNuQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNuQixPQUFPLEVBQUUsSUFBSTtnQkFDYixPQUFPLEVBQUUseUNBQXlDO2dCQUNsRCxRQUFRLEVBQUU7b0JBQ1IsRUFBRSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRTtvQkFDekIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSTtvQkFDN0IsR0FBRyxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsR0FBRztvQkFDM0IsTUFBTSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTTtvQkFDakMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsWUFBWTtvQkFDN0MsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxnQkFBZ0I7aUJBQ3REO2FBQ0YsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ1osQ0FBQztJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVuRCxPQUFPO1lBQ0wsVUFBVSxFQUFFLEdBQUc7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDbkIsS0FBSyxFQUFFLDRCQUE0QjtnQkFDbkMsT0FBTyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7Z0JBQ2pFLFVBQVU7YUFDWCxDQUFDO1NBQ0gsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUF2RFcsUUFBQSxPQUFPLFdBdURsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IENvZ25pdG9JZGVudGl0eVByb3ZpZGVyQ2xpZW50LCBEZXNjcmliZVVzZXJQb29sQ29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1jb2duaXRvLWlkZW50aXR5LXByb3ZpZGVyJztcblxuLyoqXG4gKiBUZXN0IExhbWJkYSBmdW5jdGlvbiB0byB2ZXJpZnkgQ29nbml0byBVc2VyIFBvb2wgaW1wb3J0XG4gKiBcbiAqIFRoaXMgZnVuY3Rpb24gYXR0ZW1wdHMgdG8gZGVzY3JpYmUgdGhlIFVzZXIgUG9vbCB0byB2ZXJpZnk6XG4gKiAxLiBUaGUgVXNlciBQb29sIElEIGlzIGNvcnJlY3RcbiAqIDIuIFRoZSBMYW1iZGEgaGFzIHBlcm1pc3Npb24gdG8gYWNjZXNzIGl0XG4gKiAzLiBUaGUgVXNlciBQb29sIGV4aXN0cyBhbmQgaXMgYWNjZXNzaWJsZVxuICovXG5leHBvcnQgY29uc3QgaGFuZGxlcjogSGFuZGxlciA9IGFzeW5jIChldmVudCkgPT4ge1xuICBjb25zb2xlLmxvZygnRXZlbnQ6JywgSlNPTi5zdHJpbmdpZnkoZXZlbnQsIG51bGwsIDIpKTtcblxuICBjb25zdCB1c2VyUG9vbElkID0gcHJvY2Vzcy5lbnYuVVNFUl9QT09MX0lEO1xuICBcbiAgaWYgKCF1c2VyUG9vbElkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgZXJyb3I6ICdVU0VSX1BPT0xfSUQgZW52aXJvbm1lbnQgdmFyaWFibGUgbm90IHNldCcsXG4gICAgICB9KSxcbiAgICB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgQ29nbml0b0lkZW50aXR5UHJvdmlkZXJDbGllbnQoe1xuICAgICAgcmVnaW9uOiBwcm9jZXNzLmVudi5BV1NfUkVHSU9OIHx8ICd1cy1lYXN0LTEnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY29tbWFuZCA9IG5ldyBEZXNjcmliZVVzZXJQb29sQ29tbWFuZCh7XG4gICAgICBVc2VyUG9vbElkOiB1c2VyUG9vbElkLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjbGllbnQuc2VuZChjb21tYW5kKTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBtZXNzYWdlOiAnU3VjY2Vzc2Z1bGx5IGFjY2Vzc2VkIENvZ25pdG8gVXNlciBQb29sJyxcbiAgICAgICAgdXNlclBvb2w6IHtcbiAgICAgICAgICBpZDogcmVzcG9uc2UuVXNlclBvb2w/LklkLFxuICAgICAgICAgIG5hbWU6IHJlc3BvbnNlLlVzZXJQb29sPy5OYW1lLFxuICAgICAgICAgIGFybjogcmVzcG9uc2UuVXNlclBvb2w/LkFybixcbiAgICAgICAgICBzdGF0dXM6IHJlc3BvbnNlLlVzZXJQb29sPy5TdGF0dXMsXG4gICAgICAgICAgY3JlYXRpb25EYXRlOiByZXNwb25zZS5Vc2VyUG9vbD8uQ3JlYXRpb25EYXRlLFxuICAgICAgICAgIGxhc3RNb2RpZmllZERhdGU6IHJlc3BvbnNlLlVzZXJQb29sPy5MYXN0TW9kaWZpZWREYXRlLFxuICAgICAgICB9LFxuICAgICAgfSwgbnVsbCwgMiksXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBhY2Nlc3NpbmcgVXNlciBQb29sOicsIGVycm9yKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBlcnJvcjogJ0ZhaWxlZCB0byBhY2Nlc3MgVXNlciBQb29sJyxcbiAgICAgICAgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIHVzZXJQb29sSWQsXG4gICAgICB9KSxcbiAgICB9O1xuICB9XG59O1xuIl19
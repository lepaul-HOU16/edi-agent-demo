"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
/**
 * Test Lambda function to verify Cognito authorizer
 *
 * This function returns the authenticated user's information
 * from the JWT token validated by the Cognito authorizer.
 */
const handler = async (event) => {
    console.log('Test auth function invoked');
    console.log('Event:', JSON.stringify(event, null, 2));
    try {
        // Extract user information from the authorizer context
        // TypeScript doesn't have the full type definition, so we use 'any'
        const authorizer = event.requestContext.authorizer;
        const jwt = authorizer?.jwt;
        if (!jwt) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    success: false,
                    message: 'No JWT token found in request context',
                    requestContext: event.requestContext,
                }),
            };
        }
        // Return authenticated user information
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                success: true,
                message: 'Authentication successful',
                user: {
                    sub: jwt.claims.sub,
                    email: jwt.claims.email,
                    username: jwt.claims['cognito:username'],
                    groups: jwt.claims['cognito:groups'] || [],
                },
                jwt: {
                    issuer: jwt.claims.iss,
                    audience: jwt.claims.aud,
                    expiresAt: jwt.claims.exp,
                    issuedAt: jwt.claims.iat,
                },
            }),
        };
    }
    catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQTs7Ozs7R0FLRztBQUNJLE1BQU0sT0FBTyxHQUE2RCxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDL0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0lBQzFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXRELElBQUksQ0FBQztRQUNILHVEQUF1RDtRQUN2RCxvRUFBb0U7UUFDcEUsTUFBTSxVQUFVLEdBQUksS0FBSyxDQUFDLGNBQXNCLENBQUMsVUFBVSxDQUFDO1FBQzVELE1BQU0sR0FBRyxHQUFHLFVBQVUsRUFBRSxHQUFHLENBQUM7UUFFNUIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1QsT0FBTztnQkFDTCxVQUFVLEVBQUUsR0FBRztnQkFDZixPQUFPLEVBQUU7b0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjtpQkFDbkM7Z0JBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQ25CLE9BQU8sRUFBRSxLQUFLO29CQUNkLE9BQU8sRUFBRSx1Q0FBdUM7b0JBQ2hELGNBQWMsRUFBRSxLQUFLLENBQUMsY0FBYztpQkFDckMsQ0FBQzthQUNILENBQUM7UUFDSixDQUFDO1FBRUQsd0NBQXdDO1FBQ3hDLE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2FBQ25DO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLE9BQU8sRUFBRSxJQUFJO2dCQUNiLE9BQU8sRUFBRSwyQkFBMkI7Z0JBQ3BDLElBQUksRUFBRTtvQkFDSixHQUFHLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHO29CQUNuQixLQUFLLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO29CQUN2QixRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQztvQkFDeEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFO2lCQUMzQztnQkFDRCxHQUFHLEVBQUU7b0JBQ0gsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRztvQkFDdEIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRztvQkFDeEIsU0FBUyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRztvQkFDekIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRztpQkFDekI7YUFDRixDQUFDO1NBQ0gsQ0FBQztJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0IsT0FBTztZQUNMLFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFO2dCQUNQLGNBQWMsRUFBRSxrQkFBa0I7YUFDbkM7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDbkIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsT0FBTyxFQUFFLHVCQUF1QjtnQkFDaEMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7YUFDaEUsQ0FBQztTQUNILENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBN0RXLFFBQUEsT0FBTyxXQTZEbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudFYyLCBBUElHYXRld2F5UHJveHlSZXN1bHRWMiwgSGFuZGxlciB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuXG4vKipcbiAqIFRlc3QgTGFtYmRhIGZ1bmN0aW9uIHRvIHZlcmlmeSBDb2duaXRvIGF1dGhvcml6ZXJcbiAqIFxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBhdXRoZW50aWNhdGVkIHVzZXIncyBpbmZvcm1hdGlvblxuICogZnJvbSB0aGUgSldUIHRva2VuIHZhbGlkYXRlZCBieSB0aGUgQ29nbml0byBhdXRob3JpemVyLlxuICovXG5leHBvcnQgY29uc3QgaGFuZGxlcjogSGFuZGxlcjxBUElHYXRld2F5UHJveHlFdmVudFYyLCBBUElHYXRld2F5UHJveHlSZXN1bHRWMj4gPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgY29uc29sZS5sb2coJ1Rlc3QgYXV0aCBmdW5jdGlvbiBpbnZva2VkJyk7XG4gIGNvbnNvbGUubG9nKCdFdmVudDonLCBKU09OLnN0cmluZ2lmeShldmVudCwgbnVsbCwgMikpO1xuXG4gIHRyeSB7XG4gICAgLy8gRXh0cmFjdCB1c2VyIGluZm9ybWF0aW9uIGZyb20gdGhlIGF1dGhvcml6ZXIgY29udGV4dFxuICAgIC8vIFR5cGVTY3JpcHQgZG9lc24ndCBoYXZlIHRoZSBmdWxsIHR5cGUgZGVmaW5pdGlvbiwgc28gd2UgdXNlICdhbnknXG4gICAgY29uc3QgYXV0aG9yaXplciA9IChldmVudC5yZXF1ZXN0Q29udGV4dCBhcyBhbnkpLmF1dGhvcml6ZXI7XG4gICAgY29uc3Qgand0ID0gYXV0aG9yaXplcj8uand0O1xuXG4gICAgaWYgKCFqd3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBtZXNzYWdlOiAnTm8gSldUIHRva2VuIGZvdW5kIGluIHJlcXVlc3QgY29udGV4dCcsXG4gICAgICAgICAgcmVxdWVzdENvbnRleHQ6IGV2ZW50LnJlcXVlc3RDb250ZXh0LFxuICAgICAgICB9KSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIGF1dGhlbnRpY2F0ZWQgdXNlciBpbmZvcm1hdGlvblxuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBtZXNzYWdlOiAnQXV0aGVudGljYXRpb24gc3VjY2Vzc2Z1bCcsXG4gICAgICAgIHVzZXI6IHtcbiAgICAgICAgICBzdWI6IGp3dC5jbGFpbXMuc3ViLFxuICAgICAgICAgIGVtYWlsOiBqd3QuY2xhaW1zLmVtYWlsLFxuICAgICAgICAgIHVzZXJuYW1lOiBqd3QuY2xhaW1zWydjb2duaXRvOnVzZXJuYW1lJ10sXG4gICAgICAgICAgZ3JvdXBzOiBqd3QuY2xhaW1zWydjb2duaXRvOmdyb3VwcyddIHx8IFtdLFxuICAgICAgICB9LFxuICAgICAgICBqd3Q6IHtcbiAgICAgICAgICBpc3N1ZXI6IGp3dC5jbGFpbXMuaXNzLFxuICAgICAgICAgIGF1ZGllbmNlOiBqd3QuY2xhaW1zLmF1ZCxcbiAgICAgICAgICBleHBpcmVzQXQ6IGp3dC5jbGFpbXMuZXhwLFxuICAgICAgICAgIGlzc3VlZEF0OiBqd3QuY2xhaW1zLmlhdCxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3I6JywgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgIH0pLFxuICAgIH07XG4gIH1cbn07XG4iXX0=
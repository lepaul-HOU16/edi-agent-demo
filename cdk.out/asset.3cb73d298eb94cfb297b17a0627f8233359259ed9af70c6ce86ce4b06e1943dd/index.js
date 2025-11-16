"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
/**
 * Test Lambda function to verify DynamoDB table imports
 *
 * This function:
 * 1. Verifies all table names are correct
 * 2. Checks Lambda has permission to access tables
 * 3. Retrieves basic table information
 * 4. Counts items in each table
 */
const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    const tables = {
        chatMessage: process.env.CHAT_MESSAGE_TABLE,
        chatSession: process.env.CHAT_SESSION_TABLE,
        project: process.env.PROJECT_TABLE,
        agentProgress: process.env.AGENT_PROGRESS_TABLE,
        sessionContext: process.env.SESSION_CONTEXT_TABLE,
    };
    // Verify all environment variables are set
    const missingTables = Object.entries(tables)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
    if (missingTables.length > 0) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Missing table environment variables',
                missingTables,
            }),
        };
    }
    const client = new client_dynamodb_1.DynamoDBClient({
        region: process.env.AWS_REGION || 'us-east-1',
    });
    const results = {};
    try {
        // Check each table
        for (const [key, tableName] of Object.entries(tables)) {
            if (!tableName)
                continue;
            try {
                // Describe table
                const describeCommand = new client_dynamodb_1.DescribeTableCommand({
                    TableName: tableName,
                });
                const describeResponse = await client.send(describeCommand);
                // Get item count (using scan with limit for efficiency)
                const scanCommand = new client_dynamodb_1.ScanCommand({
                    TableName: tableName,
                    Select: 'COUNT',
                    Limit: 1,
                });
                const scanResponse = await client.send(scanCommand);
                results[key] = {
                    tableName,
                    status: describeResponse.Table?.TableStatus,
                    itemCount: describeResponse.Table?.ItemCount || 0,
                    sizeBytes: describeResponse.Table?.TableSizeBytes || 0,
                    creationDate: describeResponse.Table?.CreationDateTime,
                    accessible: true,
                };
            }
            catch (error) {
                results[key] = {
                    tableName,
                    accessible: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        }
        const allAccessible = Object.values(results).every((r) => r.accessible);
        return {
            statusCode: allAccessible ? 200 : 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                success: allAccessible,
                message: allAccessible
                    ? 'Successfully accessed all DynamoDB tables'
                    : 'Some tables are not accessible',
                tables: results,
            }, null, 2),
        };
    }
    catch (error) {
        console.error('Error accessing tables:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to access DynamoDB tables',
                message: error instanceof Error ? error.message : 'Unknown error',
                tables: results,
            }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBNkY7QUFFN0Y7Ozs7Ozs7O0dBUUc7QUFDSSxNQUFNLE9BQU8sR0FBWSxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7SUFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFdEQsTUFBTSxNQUFNLEdBQUc7UUFDYixXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0I7UUFDM0MsV0FBVyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCO1FBQzNDLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWE7UUFDbEMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CO1FBQy9DLGNBQWMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQjtLQUNsRCxDQUFDO0lBRUYsMkNBQTJDO0lBQzNDLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1NBQ3pDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQztTQUM5QixHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUV2QixJQUFJLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDN0IsT0FBTztZQUNMLFVBQVUsRUFBRSxHQUFHO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLEtBQUssRUFBRSxxQ0FBcUM7Z0JBQzVDLGFBQWE7YUFDZCxDQUFDO1NBQ0gsQ0FBQztJQUNKLENBQUM7SUFFRCxN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QWU7Z0JBQ2pFLE1BQU0sRUFBRSxPQUFPO2FBQ2hCLENBQUM7U0FDSCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQWhHVyxRQUFBLE9BQU8sV0FnR2xCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgRHluYW1vREJDbGllbnQsIERlc2NyaWJlVGFibGVDb21tYW5kLCBTY2FuQ29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5cbi8qKlxuICogVGVzdCBMYW1iZGEgZnVuY3Rpb24gdG8gdmVyaWZ5IER5bmFtb0RCIHRhYmxlIGltcG9ydHNcbiAqIFxuICogVGhpcyBmdW5jdGlvbjpcbiAqIDEuIFZlcmlmaWVzIGFsbCB0YWJsZSBuYW1lcyBhcmUgY29ycmVjdFxuICogMi4gQ2hlY2tzIExhbWJkYSBoYXMgcGVybWlzc2lvbiB0byBhY2Nlc3MgdGFibGVzXG4gKiAzLiBSZXRyaWV2ZXMgYmFzaWMgdGFibGUgaW5mb3JtYXRpb25cbiAqIDQuIENvdW50cyBpdGVtcyBpbiBlYWNoIHRhYmxlXG4gKi9cbmV4cG9ydCBjb25zdCBoYW5kbGVyOiBIYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gIGNvbnNvbGUubG9nKCdFdmVudDonLCBKU09OLnN0cmluZ2lmeShldmVudCwgbnVsbCwgMikpO1xuXG4gIGNvbnN0IHRhYmxlcyA9IHtcbiAgICBjaGF0TWVzc2FnZTogcHJvY2Vzcy5lbnYuQ0hBVF9NRVNTQUdFX1RBQkxFLFxuICAgIGNoYXRTZXNzaW9uOiBwcm9jZXNzLmVudi5DSEFUX1NFU1NJT05fVEFCTEUsXG4gICAgcHJvamVjdDogcHJvY2Vzcy5lbnYuUFJPSkVDVF9UQUJMRSxcbiAgICBhZ2VudFByb2dyZXNzOiBwcm9jZXNzLmVudi5BR0VOVF9QUk9HUkVTU19UQUJMRSxcbiAgICBzZXNzaW9uQ29udGV4dDogcHJvY2Vzcy5lbnYuU0VTU0lPTl9DT05URVhUX1RBQkxFLFxuICB9O1xuXG4gIC8vIFZlcmlmeSBhbGwgZW52aXJvbm1lbnQgdmFyaWFibGVzIGFyZSBzZXRcbiAgY29uc3QgbWlzc2luZ1RhYmxlcyA9IE9iamVjdC5lbnRyaWVzKHRhYmxlcylcbiAgICAuZmlsdGVyKChbXywgdmFsdWVdKSA9PiAhdmFsdWUpXG4gICAgLm1hcCgoW2tleV0pID0+IGtleSk7XG5cbiAgaWYgKG1pc3NpbmdUYWJsZXMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGVycm9yOiAnTWlzc2luZyB0YWJsZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMnLFxuICAgICAgICBtaXNzaW5nVGFibGVzLFxuICAgICAgfSksXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGNsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7XG4gICAgcmVnaW9uOiBwcm9jZXNzLmVudi5BV1NfUkVHSU9OIHx8ICd1cy1lYXN0LTEnLFxuICB9KTtcblxuICBjb25zdCByZXN1bHRzOiBhbnkgPSB7fTtcblxuICB0cnkge1xuICAgIC8vIENoZWNrIGVhY2ggdGFibGVcbiAgICBmb3IgKGNvbnN0IFtrZXksIHRhYmxlTmFtZV0gb2YgT2JqZWN0LmVudHJpZXModGFibGVzKSkge1xuICAgICAgaWYgKCF0YWJsZU5hbWUpIGNvbnRpbnVlO1xuXG4gICAgICB0cnkge1xuICAgICAgICAvLyBEZXNjcmliZSB0YWJsZVxuICAgICAgICBjb25zdCBkZXNjcmliZUNvbW1hbmQgPSBuZXcgRGVzY3JpYmVUYWJsZUNvbW1hbmQoe1xuICAgICAgICAgIFRhYmxlTmFtZTogdGFibGVOYW1lLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZGVzY3JpYmVSZXNwb25zZSA9IGF3YWl0IGNsaWVudC5zZW5kKGRlc2NyaWJlQ29tbWFuZCk7XG5cbiAgICAgICAgLy8gR2V0IGl0ZW0gY291bnQgKHVzaW5nIHNjYW4gd2l0aCBsaW1pdCBmb3IgZWZmaWNpZW5jeSlcbiAgICAgICAgY29uc3Qgc2NhbkNvbW1hbmQgPSBuZXcgU2NhbkNvbW1hbmQoe1xuICAgICAgICAgIFRhYmxlTmFtZTogdGFibGVOYW1lLFxuICAgICAgICAgIFNlbGVjdDogJ0NPVU5UJyxcbiAgICAgICAgICBMaW1pdDogMSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHNjYW5SZXNwb25zZSA9IGF3YWl0IGNsaWVudC5zZW5kKHNjYW5Db21tYW5kKTtcblxuICAgICAgICByZXN1bHRzW2tleV0gPSB7XG4gICAgICAgICAgdGFibGVOYW1lLFxuICAgICAgICAgIHN0YXR1czogZGVzY3JpYmVSZXNwb25zZS5UYWJsZT8uVGFibGVTdGF0dXMsXG4gICAgICAgICAgaXRlbUNvdW50OiBkZXNjcmliZVJlc3BvbnNlLlRhYmxlPy5JdGVtQ291bnQgfHwgMCxcbiAgICAgICAgICBzaXplQnl0ZXM6IGRlc2NyaWJlUmVzcG9uc2UuVGFibGU/LlRhYmxlU2l6ZUJ5dGVzIHx8IDAsXG4gICAgICAgICAgY3JlYXRpb25EYXRlOiBkZXNjcmliZVJlc3BvbnNlLlRhYmxlPy5DcmVhdGlvbkRhdGVUaW1lLFxuICAgICAgICAgIGFjY2Vzc2libGU6IHRydWUsXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXN1bHRzW2tleV0gPSB7XG4gICAgICAgICAgdGFibGVOYW1lLFxuICAgICAgICAgIGFjY2Vzc2libGU6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhbGxBY2Nlc3NpYmxlID0gT2JqZWN0LnZhbHVlcyhyZXN1bHRzKS5ldmVyeSgocjogYW55KSA9PiByLmFjY2Vzc2libGUpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IGFsbEFjY2Vzc2libGUgPyAyMDAgOiA1MDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBzdWNjZXNzOiBhbGxBY2Nlc3NpYmxlLFxuICAgICAgICBtZXNzYWdlOiBhbGxBY2Nlc3NpYmxlIFxuICAgICAgICAgID8gJ1N1Y2Nlc3NmdWxseSBhY2Nlc3NlZCBhbGwgRHluYW1vREIgdGFibGVzJ1xuICAgICAgICAgIDogJ1NvbWUgdGFibGVzIGFyZSBub3QgYWNjZXNzaWJsZScsXG4gICAgICAgIHRhYmxlczogcmVzdWx0cyxcbiAgICAgIH0sIG51bGwsIDIpLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgYWNjZXNzaW5nIHRhYmxlczonLCBlcnJvcik7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gYWNjZXNzIER5bmFtb0RCIHRhYmxlcycsXG4gICAgICAgIG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICB0YWJsZXM6IHJlc3VsdHMsXG4gICAgICB9KSxcbiAgICB9O1xuICB9XG59O1xuIl19